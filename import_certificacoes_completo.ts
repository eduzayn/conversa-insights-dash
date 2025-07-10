import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import { createRequire } from 'module';

// Import XLSX usando createRequire para compatibilidade ES
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

interface DadosCertificacao {
  status: string;
  aluno: string;
  cpf: string;
  dataSolicitacao: string;
  curso: string;
  financeiro: string;
  documentacao: string;
  atividadesPlataforma: string;
  praticasPedagogicas: string;
  dataLiberacao: string;
  observacao: string;
}

interface EstatisticasImportacao {
  arquivo: string;
  sucessos: number;
  duplicatas: number;
  erros: number;
  total: number;
  cpfsInvalidos: number;
}

// Mapeamento de arquivos disponíveis (processando apenas os mais recentes)
const arquivosDisponiveis = [
  'attached_assets/ANÁLISES PARA CERTIFICAÇÃO e DECLARAÇÕES_____ (10)_1752171021515.xlsx', // Mais recente (novembro)
  'attached_assets/ANÁLISES PARA CERTIFICAÇÃO e DECLARAÇÕES_____ (8)_1752024769667.xlsx',  // Anterior
  'attached_assets/ANÁLISES PARA CERTIFICAÇÃO e DECLARAÇÕES_____ (7)_1752024345053.xlsx',  // Anterior
];

function processarExcel(caminhoArquivo: string): DadosCertificacao[] {
  console.log(`📖 Processando arquivo: ${caminhoArquivo}`);
  
  if (!fs.existsSync(caminhoArquivo)) {
    console.log(`❌ Arquivo não encontrado: ${caminhoArquivo}`);
    return [];
  }

  const workbook = XLSX.readFile(caminhoArquivo);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Converter para JSON com array de arrays
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  console.log(`📋 Total de linhas no arquivo: ${jsonData.length}`);
  
  if (jsonData.length < 2) {
    console.log('⚠️ Arquivo sem dados');
    return [];
  }
  
  const dados: DadosCertificacao[] = [];
  
  // Processar cada linha (pular cabeçalho)
  for (let i = 1; i < jsonData.length; i++) {
    const linha = jsonData[i] as any[];
    if (!linha || linha.length < 6) continue;
    
    // Estrutura correta: Status, CPF, Aluno, Data, Curso, Financeiro, Documentação, Plataforma, Práticas, DataLiberação, Observações
    dados.push({
      status: String(linha[0] || ''),
      cpf: String(linha[1] || ''),
      aluno: String(linha[2] || ''),
      dataSolicitacao: String(linha[3] || ''),
      curso: String(linha[4] || ''),
      financeiro: String(linha[5] || ''),
      documentacao: String(linha[6] || ''),
      atividadesPlataforma: String(linha[7] || ''),
      praticasPedagogicas: String(linha[8] || ''),
      dataLiberacao: String(linha[9] || ''),
      observacao: String(linha[10] || '')
    });
  }
  
  console.log(`✅ Registros extraídos: ${dados.length}`);
  return dados;
}

function parsearLinha(linha: string): string[] {
  const campos: string[] = [];
  let campoAtual = '';
  let dentroAspas = false;
  let i = 0;
  
  while (i < linha.length) {
    const char = linha[i];
    
    if (char === '"') {
      dentroAspas = !dentroAspas;
    } else if (char === ',' && !dentroAspas) {
      campos.push(campoAtual.trim());
      campoAtual = '';
    } else {
      campoAtual += char;
    }
    i++;
  }
  
  // Adicionar último campo
  if (campoAtual) {
    campos.push(campoAtual.trim());
  }
  
  return campos;
}

function inferirModalidade(curso: string): string {
  const cursoUpper = curso.toUpperCase();
  
  if (cursoUpper.includes('SEGUNDA LICENCIATURA') || cursoUpper.includes('SEGUNDA LIC')) {
    return 'Segunda licenciatura';
  }
  if (cursoUpper.includes('FORMAÇÃO PEDAGÓGICA') || cursoUpper.includes('FORM. PEDAGÓGICA')) {
    return 'Formação pedagógica';
  }
  if (cursoUpper.includes('PÓS-GRADUAÇÃO') || cursoUpper.includes('PÓS GRADUAÇÃO')) {
    return 'Pós-graduação';
  }
  if (cursoUpper.includes('FORMAÇÃO LIVRE') || cursoUpper.includes('FORM. LIVRE')) {
    return 'Formação livre';
  }
  if (cursoUpper.includes('DIPLOMAÇÃO POR COMPETÊNCIA') || cursoUpper.includes('DIPLOMAÇÃO')) {
    return 'Diplomação por competência';
  }
  if (cursoUpper.includes('PEDAGOGIA PARA BACHARÉIS') || cursoUpper.includes('PEDAGOGIA BACH')) {
    return 'Formação pedagógica';
  }
  if (cursoUpper.includes('GRADUAÇÃO') && !cursoUpper.includes('PÓS')) {
    return 'Graduação';
  }
  if (cursoUpper.includes('CAPACITAÇÃO')) {
    return 'Capacitação';
  }
  if (cursoUpper.includes('EJA')) {
    return 'EJA';
  }
  if (cursoUpper.includes('SEQUENCIAL')) {
    return 'Sequencial';
  }
  
  return 'Pós-graduação'; // Default para cursos não identificados
}

function inferirSubcategoria(curso: string): string | null {
  const modalidade = inferirModalidade(curso);
  
  if (modalidade === 'Segunda licenciatura' || modalidade === 'Formação pedagógica') {
    return 'segunda_graduacao';
  }
  if (modalidade === 'Pós-graduação') {
    return 'pos_graduacao';
  }
  if (modalidade === 'Formação livre') {
    return 'formacao_livre';
  }
  if (modalidade === 'Diplomação por competência') {
    return 'diplomacao_competencia';
  }
  if (modalidade === 'Graduação') {
    return 'graduacao';
  }
  if (modalidade === 'Capacitação') {
    return 'capacitacao';
  }
  if (modalidade === 'EJA') {
    return 'eja';
  }
  if (modalidade === 'Sequencial') {
    return 'sequencial';
  }
  
  return null;
}

function inferirStatus(status: string): string {
  const statusUpper = status.toUpperCase();
  
  if (statusUpper.includes('CONCLUÍDA') || statusUpper.includes('CERTIFICADO') || 
      statusUpper.includes('LIBERADO') || statusUpper.includes('APROVADO')) {
    return 'concluido';
  }
  if (statusUpper.includes('URGENTE') || statusUpper.includes('ANDAMENTO')) {
    return 'em_andamento';
  }
  if (statusUpper.includes('PENDENTE') || statusUpper.includes('AGUARDANDO')) {
    return 'pendente';
  }
  if (statusUpper.includes('CANCELADO') || statusUpper.includes('CANCELADA')) {
    return 'cancelado';
  }
  if (statusUpper.includes('MEDIANA') || statusUpper.includes('NORMAL')) {
    return 'em_andamento';
  }
  
  return 'pendente'; // Default
}

function inferirPraticasPedagogicas(praticas: string): string {
  const praticasUpper = praticas.toUpperCase();
  
  if (praticasUpper.includes('APROVAD')) {
    return 'aprovado';
  }
  if (praticasUpper.includes('REPROVAD')) {
    return 'reprovado';
  }
  if (praticasUpper.includes('CORREÇÃO') || praticasUpper.includes('CORRECAO')) {
    return 'em_correcao';
  }
  if (praticasUpper.includes('NÃO TEM') || praticasUpper.includes('NÃO POSSUI') || 
      praticasUpper.includes('NÃO PRECISA') || praticasUpper.includes('NÃO NECESSITA')) {
    return 'nao_possui';
  }
  
  return 'nao_possui'; // Default
}

function parsearData(dataStr: string): string | null {
  if (!dataStr || dataStr.trim() === '') return null;
  
  // Se for um número (data serial do Excel)
  const dataNum = parseFloat(dataStr);
  if (!isNaN(dataNum) && dataNum > 40000 && dataNum < 60000) {
    // Converter data serial do Excel para JavaScript Date
    const excelDate = new Date((dataNum - 25569) * 86400 * 1000);
    const ano = excelDate.getFullYear();
    const mes = String(excelDate.getMonth() + 1).padStart(2, '0');
    const dia = String(excelDate.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }
  
  // Tentar diferentes formatos de data string
  const formatosData = [
    /(\d{2})\/(\d{2})\/(\d{4})/,  // DD/MM/YYYY
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // D/M/YYYY
    /(\d{2})-(\d{2})-(\d{4})/,   // DD-MM-YYYY
  ];
  
  for (const formato of formatosData) {
    const match = dataStr.match(formato);
    if (match) {
      const dia = match[1].padStart(2, '0');
      const mes = match[2].padStart(2, '0');
      const ano = match[3];
      return `${ano}-${mes}-${dia}`;
    }
  }
  
  return null;
}

function extrairCargaHoraria(curso: string): number {
  // Procurar por padrões de carga horária
  const patterns = [
    /(\d+)\s*h/i,           // 360h
    /(\d+)\s*hrs/i,         // 360hrs
    /(\d+)\s*horas/i,       // 360 horas
    /(\d+)\s*-\s*(\d+)h/i,  // 1200-1320h
    /(\d{3,4})\s*(?:h|hrs|horas)?$/i  // 1320 no final
  ];
  
  for (const pattern of patterns) {
    const match = curso.match(pattern);
    if (match) {
      return parseInt(match[1]);
    }
  }
  
  // Carga horária padrão por modalidade
  const modalidade = inferirModalidade(curso);
  if (modalidade === 'Segunda licenciatura') return 1320;
  if (modalidade === 'Formação pedagógica') return 1200;
  if (modalidade === 'Pós-graduação') return 600;
  if (modalidade === 'Formação livre') return 360;
  if (modalidade === 'Diplomação por competência') return 1320;
  
  return 360; // Default
}

async function importarArquivo(caminhoArquivo: string, sql: any): Promise<EstatisticasImportacao> {
  console.log(`\n🔄 Importando arquivo: ${caminhoArquivo}`);
  
  const dados = processarExcel(caminhoArquivo);
  let sucessos = 0;
  let duplicatas = 0;
  let erros = 0;
  let cpfsInvalidos = 0;
  
  for (const dado of dados) {
    try {
      // Validar CPF
      const cpfLimpo = dado.cpf.replace(/\D/g, '');
      if (!cpfLimpo || cpfLimpo.length !== 11) {
        console.log(`⚠️ CPF inválido para ${dado.aluno}: ${dado.cpf}`);
        cpfsInvalidos++;
        continue;
      }
      
      // Verificar duplicata
      const existingQuery = `
        SELECT id FROM certifications 
        WHERE cpf = $1 AND curso = $2
      `;
      const existingResult = await sql(existingQuery, [cpfLimpo, dado.curso]);
      
      if (existingResult.length > 0) {
        duplicatas++;
        continue;
      }
      
      // Processar dados
      const modalidade = inferirModalidade(dado.curso);
      const subcategoria = inferirSubcategoria(dado.curso);
      const status = inferirStatus(dado.status);
      const praticasPedagogicas = inferirPraticasPedagogicas(dado.praticasPedagogicas);
      const dataSolicitacao = parsearData(dado.dataSolicitacao);
      const dataLiberacao = parsearData(dado.dataLiberacao);
      const cargaHoraria = extrairCargaHoraria(dado.curso);
      
      // Inserir no banco
      const insertQuery = `
        INSERT INTO certifications (
          aluno, cpf, modalidade, curso, status, financeiro, documentacao, 
          plataforma, tutoria, observacao, subcategoria, carga_horaria,
          data_prevista, data_entrega, tcc, praticas_pedagogicas, estagio
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
        )
      `;
      
      const observacaoCompleta = `${dado.observacao || ''} [Arquivo: ${caminhoArquivo.split('/').pop()}] [Status original: ${dado.status}] [Práticas: ${dado.praticasPedagogicas}]`.trim();
      
      const values = [
        dado.aluno,
        cpfLimpo,
        modalidade,
        dado.curso,
        status,
        dado.financeiro || 'Em análise',
        dado.documentacao || 'Pendente',
        dado.atividadesPlataforma || 'Em andamento',
        'Não informado',
        observacaoCompleta,
        subcategoria,
        cargaHoraria,
        dataSolicitacao,
        dataLiberacao,
        'nao_possui',
        praticasPedagogicas,
        'nao_possui'
      ];
      
      await sql(insertQuery, values);
      sucessos++;
      
      if (sucessos % 50 === 0) {
        console.log(`   ✅ Processados ${sucessos} registros...`);
      }
      
    } catch (error) {
      console.error(`❌ Erro ao processar ${dado.aluno}:`, error);
      erros++;
    }
  }
  
  return {
    arquivo: caminhoArquivo,
    sucessos,
    duplicatas,
    erros,
    total: dados.length,
    cpfsInvalidos
  };
}

async function importarTodosArquivos() {
  console.log('🚀 Iniciando importação completa de certificações (Janeiro-Julho 2025)...\n');
  
  const sql = neon(process.env.DATABASE_URL!);
  const estatisticasGerais: EstatisticasImportacao[] = [];
  
  // Verificar status atual do banco
  const statusAtual = await sql('SELECT COUNT(*) as total, modalidade FROM certifications GROUP BY modalidade');
  console.log('📊 Status atual do banco:');
  for (const item of statusAtual) {
    console.log(`   ${item.modalidade || 'Sem modalidade'}: ${item.total} certificações`);
  }
  console.log('');
  
  // Processar cada arquivo
  for (const arquivo of arquivosDisponiveis) {
    try {
      const estatisticas = await importarArquivo(arquivo, sql);
      estatisticasGerais.push(estatisticas);
      
      console.log(`\n📈 Relatório ${arquivo.split('/').pop()}:`);
      console.log(`   ✅ Sucessos: ${estatisticas.sucessos}`);
      console.log(`   ⚠️ Duplicatas: ${estatisticas.duplicatas}`);
      console.log(`   ❌ Erros: ${estatisticas.erros}`);
      console.log(`   🔍 CPFs inválidos: ${estatisticas.cpfsInvalidos}`);
      console.log(`   📊 Total processado: ${estatisticas.total}`);
      
    } catch (error) {
      console.error(`❌ Erro ao processar arquivo ${arquivo}:`, error);
    }
  }
  
  // Relatório final
  console.log('\n🎯 RELATÓRIO FINAL DA IMPORTAÇÃO:');
  console.log('=====================================');
  
  const totalSucessos = estatisticasGerais.reduce((acc, est) => acc + est.sucessos, 0);
  const totalDuplicatas = estatisticasGerais.reduce((acc, est) => acc + est.duplicatas, 0);
  const totalErros = estatisticasGerais.reduce((acc, est) => acc + est.erros, 0);
  const totalCpfsInvalidos = estatisticasGerais.reduce((acc, est) => acc + est.cpfsInvalidos, 0);
  const totalProcessados = estatisticasGerais.reduce((acc, est) => acc + est.total, 0);
  
  console.log(`📝 Arquivos processados: ${arquivosDisponiveis.length}`);
  console.log(`✅ Total de sucessos: ${totalSucessos}`);
  console.log(`⚠️ Total de duplicatas: ${totalDuplicatas}`);
  console.log(`❌ Total de erros: ${totalErros}`);
  console.log(`🔍 Total de CPFs inválidos: ${totalCpfsInvalidos}`);
  console.log(`📊 Total de registros processados: ${totalProcessados}`);
  
  // Status final do banco
  const statusFinal = await sql('SELECT COUNT(*) as total, modalidade FROM certifications GROUP BY modalidade ORDER BY total DESC');
  console.log('\n📊 Status final do banco:');
  for (const item of statusFinal) {
    console.log(`   ${item.modalidade || 'Sem modalidade'}: ${item.total} certificações`);
  }
  
  console.log('\n🎉 Importação completa finalizada!');
}

// Executar importação
importarTodosArquivos().catch(console.error);

export { importarTodosArquivos };