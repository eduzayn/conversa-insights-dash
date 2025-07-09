import { readFile } from 'fs/promises';
import * as XLSX from 'xlsx';
import { db } from './server/db';
import { certifications } from './shared/schema';
import { eq, and } from 'drizzle-orm';

async function processarExcelJunhoCompleto() {
  console.log('📊 Processando arquivo completo de junho...');
  
  try {
    // Ler o arquivo Excel
    const buffer = await readFile('./attached_assets/ANÁLISES PARA CERTIFICAÇÃO e DECLARAÇÕES_____ (8)_1752024769667.xlsx');
    const workbook = XLSX.read(buffer);
    
    // Pegar a primeira aba
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Converter para JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📋 Total de linhas encontradas: ${data.length}`);
    
    // Processar cada linha
    let processados = 0;
    let jaExistentes = 0;
    let erros = 0;
    const dadosProcessados = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      
      try {
        // Extrair dados da linha
        const inicio = row['INÍCIO'] || row['Início'] || row['inicio'] || '';
        const aluno = row['ALUNO'] || row['Aluno'] || row['aluno'] || '';
        const cpf = limparCPF(row['CPF'] || row['Cpf'] || row['cpf'] || '');
        const modalidade = row['MODALIDADE'] || row['Modalidade'] || row['modalidade'] || '';
        const curso = limparCurso(row['CURSO'] || row['Curso'] || row['curso'] || '');
        const financeiro = row['FINANCEIRO'] || row['Financeiro'] || row['financeiro'] || '';
        const documentacao = row['DOCUMENTAÇÃO'] || row['Documentação'] || row['documentacao'] || '';
        const plataforma = row['PLATAFORMA'] || row['Plataforma'] || row['plataforma'] || '';
        const tutoria = row['TUTORIA'] || row['Tutoria'] || row['tutoria'] || '';
        const observacao = row['OBSERVAÇÃO'] || row['Observação'] || row['observacao'] || '';
        
        // Pular linhas vazias
        if (!aluno || !cpf || !curso) {
          console.log(`⚠️  Linha ${i + 1}: Dados obrigatórios faltando - pulando`);
          continue;
        }
        
        // Verificar se já existe
        const existente = await db
          .select()
          .from(certifications)
          .where(
            and(
              eq(certifications.cpf, cpf),
              eq(certifications.curso, curso)
            )
          );
          
        if (existente.length > 0) {
          jaExistentes++;
          continue;
        }
        
        const dadosCertificacao = {
          inicio,
          aluno,
          cpf,
          modalidade,
          curso,
          financeiro,
          documentacao,
          plataforma,
          tutoria,
          observacao,
          status: inferirStatus(financeiro, documentacao, plataforma),
          categoria: getCategoria(modalidade),
          subcategoria: getSubcategoria(modalidade, curso),
          cargaHoraria: extrairCargaHoraria(curso),
          prioridade: 'mediana',
          situacaoAnalise: extrairSituacaoAnalise(plataforma, documentacao),
          praticasPedagogicas: extrairStatusPraticasPedagogicas(plataforma),
          disciplinasRestantes: extrairDisciplinasRestantes(plataforma)
        };
        
        dadosProcessados.push(dadosCertificacao);
        processados++;
        
        console.log(`✅ Linha ${i + 1}: ${aluno} - ${curso} processado`);
        
      } catch (error) {
        erros++;
        console.log(`❌ Erro na linha ${i + 1}:`, error);
      }
    }
    
    // Salvar dados processados
    const fs = await import('fs');
    fs.writeFileSync('./dados_junho_2025_completo.json', JSON.stringify(dadosProcessados, null, 2));
    
    console.log('\n📊 Resumo do processamento:');
    console.log(`📋 Total de linhas: ${data.length}`);
    console.log(`✅ Processados: ${processados}`);
    console.log(`⚠️  Já existentes: ${jaExistentes}`);
    console.log(`❌ Erros: ${erros}`);
    console.log(`💾 Dados salvos em: dados_junho_2025_completo.json`);
    
  } catch (error) {
    console.error('❌ Erro ao processar arquivo:', error);
  }
}

function limparCPF(cpf: string): string {
  return cpf.toString().replace(/[^\d]/g, '');
}

function limparCurso(curso: string): string {
  return curso.toString().trim();
}

function extrairCargaHoraria(curso: string): number | null {
  const match = curso.match(/(\d+)h/i);
  return match ? parseInt(match[1]) : null;
}

function extrairStatusPraticasPedagogicas(plataforma: string): string {
  const texto = plataforma.toLowerCase();
  if (texto.includes('pp aprovadas') || texto.includes('práticas aprovadas')) {
    return 'aprovado';
  }
  if (texto.includes('pp reprovadas') || texto.includes('práticas reprovadas')) {
    return 'reprovado';
  }
  if (texto.includes('pp em correção') || texto.includes('práticas em correção')) {
    return 'em_correcao';
  }
  return 'nao_possui';
}

function extrairDisciplinasRestantes(plataforma: string): number | null {
  const match = plataforma.match(/(\d+)\s*disciplinas?\s*restantes?/i);
  return match ? parseInt(match[1]) : null;
}

function extrairSituacaoAnalise(plataforma: string, documentacao: string): string {
  const textoCompleto = `${plataforma} ${documentacao}`.toLowerCase();
  
  if (textoCompleto.includes('análise concluída') || textoCompleto.includes('certificado')) {
    return 'Análise Concluída, Aluno certificado';
  }
  if (textoCompleto.includes('em análise') || textoCompleto.includes('pendente')) {
    return 'Em análise';
  }
  if (textoCompleto.includes('aprovado')) {
    return 'Aprovado';
  }
  if (textoCompleto.includes('reprovado')) {
    return 'Reprovado';
  }
  
  return 'Pendente';
}

function inferirStatus(financeiro: string, documentacao: string, plataforma: string): string {
  const textoCompleto = `${financeiro} ${documentacao} ${plataforma}`.toLowerCase();
  
  if (textoCompleto.includes('certificado') || textoCompleto.includes('concluído')) {
    return 'concluido';
  }
  if (textoCompleto.includes('em andamento') || textoCompleto.includes('cursando')) {
    return 'em_andamento';
  }
  if (textoCompleto.includes('cancelado')) {
    return 'cancelado';
  }
  
  return 'pendente';
}

function getCategoria(modalidade: string): string {
  const modal = modalidade.toLowerCase();
  
  if (modal.includes('pós-graduação') || modal.includes('pos graduacao')) {
    return 'pos_graduacao';
  }
  if (modal.includes('segunda') && modal.includes('graduação')) {
    return 'segunda_graduacao';
  }
  if (modal.includes('licenciatura') || modal.includes('formação pedagógica')) {
    return 'segunda_graduacao';
  }
  if (modal.includes('formação livre')) {
    return 'formacao_livre';
  }
  if (modal.includes('eja')) {
    return 'eja';
  }
  if (modal.includes('diplomação')) {
    return 'diplomacao_competencia';
  }
  if (modal.includes('capacitação')) {
    return 'capacitacao';
  }
  if (modal.includes('graduação')) {
    return 'graduacao';
  }
  if (modal.includes('sequencial')) {
    return 'sequencial';
  }
  
  return 'geral';
}

function getSubcategoria(modalidade: string, curso: string): string {
  const modal = modalidade.toLowerCase();
  const cursoLower = curso.toLowerCase();
  
  if (modal.includes('segunda') && modal.includes('licenciatura')) {
    return 'segunda_licenciatura';
  }
  if (modal.includes('formação pedagógica')) {
    return 'formacao_pedagogica';
  }
  if (modal.includes('pedagogia') && modal.includes('bacharel')) {
    return 'pedagogia_bachareis';
  }
  
  return '';
}

// Executar
processarExcelJunhoCompleto().catch(console.error);