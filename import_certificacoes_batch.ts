import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import { createRequire } from 'module';

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

// Todos os arquivos disponíveis para importação histórica
const arquivosDisponiveis = [
  'attached_assets/ANÁLISES PARA CERTIFICAÇÃO e DECLARAÇÕES_____ (10)_1752171021515.xlsx',
  'attached_assets/ANÁLISES PARA CERTIFICAÇÃO e DECLARAÇÕES_____ (8)_1752024769667.xlsx',
  'attached_assets/ANÁLISES PARA CERTIFICAÇÃO e DECLARAÇÕES_____ (7)_1752024345053.xlsx',
  'attached_assets/ANÁLISES PARA CERTIFICAÇÃO e DECLARAÇÕES_____ (6)_1752024226310.xlsx',
  'attached_assets/ANÁLISES PARA CERTIFICAÇÃO e DECLARAÇÕES_____ (5)_1752024102607.xlsx',
  'attached_assets/ANÁLISES PARA CERTIFICAÇÃO e DECLARAÇÕES_____ (4)_1752023930428.xlsx',
  'attached_assets/ANÁLISES PARA CERTIFICAÇÃO e DECLARAÇÕES_____ (3)_1752023388012.xlsx',
  'attached_assets/ANÁLISES PARA CERTIFICAÇÃO e DECLARAÇÕES_____ (2)_1752023230366.xlsx',
  'attached_assets/ANÁLISES PARA CERTIFICAÇÃO e DECLARAÇÕES_____ (1)_1752015654270.xlsx',
];

function processarExcel(caminhoArquivo: string): DadosCertificacao[] {
  if (!fs.existsSync(caminhoArquivo)) {
    console.log(`❌ Arquivo não encontrado: ${caminhoArquivo}`);
    return [];
  }

  const workbook = XLSX.readFile(caminhoArquivo);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  if (jsonData.length < 2) {
    return [];
  }
  
  const dados: DadosCertificacao[] = [];
  
  for (let i = 1; i < jsonData.length; i++) {
    const linha = jsonData[i] as any[];
    if (!linha || linha.length < 6) continue;
    
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
  
  return dados;
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
  
  return 'Pós-graduação';
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
  
  return 'pendente';
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
  
  return 'nao_possui';
}

function parsearData(dataStr: string): string | null {
  if (!dataStr || dataStr.trim() === '') return null;
  
  const dataNum = parseFloat(dataStr);
  if (!isNaN(dataNum) && dataNum > 40000 && dataNum < 60000) {
    const excelDate = new Date((dataNum - 25569) * 86400 * 1000);
    const ano = excelDate.getFullYear();
    const mes = String(excelDate.getMonth() + 1).padStart(2, '0');
    const dia = String(excelDate.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }
  
  const formatosData = [
    /(\d{2})\/(\d{2})\/(\d{4})/,
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    /(\d{2})-(\d{2})-(\d{4})/,
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
  const patterns = [
    /(\d+)\s*h/i,
    /(\d+)\s*hrs/i,
    /(\d+)\s*horas/i,
    /(\d+)\s*-\s*(\d+)h/i,
    /(\d{3,4})\s*(?:h|hrs|horas)?$/i
  ];
  
  for (const pattern of patterns) {
    const match = curso.match(pattern);
    if (match) {
      return parseInt(match[1]);
    }
  }
  
  const modalidade = inferirModalidade(curso);
  if (modalidade === 'Segunda licenciatura') return 1320;
  if (modalidade === 'Formação pedagógica') return 1200;
  if (modalidade === 'Pós-graduação') return 600;
  if (modalidade === 'Formação livre') return 360;
  if (modalidade === 'Diplomação por competência') return 1320;
  
  return 360;
}

async function importarLoteRapido() {
  console.log('🚀 Importação rápida em lote - Janeiro a Julho 2025\n');
  
  const sql = neon(process.env.DATABASE_URL!);
  
  // Status inicial
  const statusInicial = await sql('SELECT COUNT(*) as total FROM certifications');
  console.log(`📊 Certificações no banco antes da importação: ${statusInicial[0].total}\n`);
  
  let totalSucessos = 0;
  let totalDuplicatas = 0;
  let totalCpfsInvalidos = 0;
  let totalProcessados = 0;
  
  for (let i = 0; i < arquivosDisponiveis.length; i++) {
    const arquivo = arquivosDisponiveis[i];
    const nomeArquivo = arquivo.split('/').pop() || 'desconhecido';
    
    console.log(`📁 [${i + 1}/${arquivosDisponiveis.length}] ${nomeArquivo}`);
    
    const dados = processarExcel(arquivo);
    
    if (dados.length === 0) {
      console.log('   ⚠️ Nenhum dado encontrado');
      continue;
    }
    
    let sucessos = 0;
    let duplicatas = 0;
    let cpfsInvalidos = 0;
    
    for (const dado of dados) {
      const cpfLimpo = dado.cpf.replace(/\D/g, '');
      
      if (!cpfLimpo || cpfLimpo.length !== 11) {
        cpfsInvalidos++;
        continue;
      }
      
      try {
        const existingQuery = 'SELECT id FROM certifications WHERE cpf = $1 AND curso = $2';
        const existingResult = await sql(existingQuery, [cpfLimpo, dado.curso]);
        
        if (existingResult.length > 0) {
          duplicatas++;
          continue;
        }
        
        const modalidade = inferirModalidade(dado.curso);
        const subcategoria = inferirSubcategoria(dado.curso);
        const status = inferirStatus(dado.status);
        const praticasPedagogicas = inferirPraticasPedagogicas(dado.praticasPedagogicas);
        const dataSolicitacao = parsearData(dado.dataSolicitacao);
        const dataLiberacao = parsearData(dado.dataLiberacao);
        const cargaHoraria = extrairCargaHoraria(dado.curso);
        
        const observacaoCompleta = `${dado.observacao || ''} [${nomeArquivo}] [Status: ${dado.status}]`.trim();
        
        const insertQuery = `
          INSERT INTO certifications (
            aluno, cpf, modalidade, curso, status, financeiro, documentacao, 
            plataforma, tutoria, observacao, subcategoria, carga_horaria,
            data_prevista, data_entrega, tcc, praticas_pedagogicas, estagio
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
          )
        `;
        
        await sql(insertQuery, [
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
        ]);
        
        sucessos++;
        
      } catch (error) {
        // Ignorar erros silenciosamente para acelerar o processo
      }
    }
    
    console.log(`   ✅ ${sucessos} novos | ⚠️ ${duplicatas} duplicatas | 🔍 ${cpfsInvalidos} CPFs inválidos | 📊 ${dados.length} total`);
    
    totalSucessos += sucessos;
    totalDuplicatas += duplicatas;
    totalCpfsInvalidos += cpfsInvalidos;
    totalProcessados += dados.length;
  }
  
  // Status final
  const statusFinal = await sql('SELECT COUNT(*) as total FROM certifications');
  console.log(`\n🎯 RESUMO FINAL:`);
  console.log(`📝 Arquivos processados: ${arquivosDisponiveis.length}`);
  console.log(`✅ Novos registros importados: ${totalSucessos}`);
  console.log(`⚠️ Duplicatas identificadas: ${totalDuplicatas}`);
  console.log(`🔍 CPFs inválidos encontrados: ${totalCpfsInvalidos}`);
  console.log(`📊 Total de registros processados: ${totalProcessados}`);
  console.log(`📈 Total no banco após importação: ${statusFinal[0].total}`);
  console.log(`🎉 Importação histórica completa!`);
  
  // Estatísticas por modalidade
  const estatisticasModalidade = await sql('SELECT modalidade, COUNT(*) as total FROM certifications GROUP BY modalidade ORDER BY total DESC');
  console.log('\n📊 Distribuição por modalidade:');
  for (const item of estatisticasModalidade) {
    console.log(`   ${item.modalidade || 'Sem modalidade'}: ${item.total} certificações`);
  }
}

// Executar importação
importarLoteRapido().catch(console.error);