import fs from 'fs';
import { db } from './server/db.ts';
import { certifications } from './shared/schema.ts';

async function importPDFCertifications() {
  try {
    // Ler o arquivo PDF (já convertido para texto)
    const pdfContent = fs.readFileSync('attached_assets/ANÁLISES PARA CERTIFICAÇÃO e DECLARAÇÕES_____ - Julho_1752016483113.pdf', 'utf-8');
    
    const lines = pdfContent.split('\n');
    const allCertifications = [];
    const skippedLines = [];
    
    // Pular primeira linha (cabeçalho)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Tentar extrair dados da linha
      const certification = parseLineData(line, i + 1);
      if (certification) {
        allCertifications.push(certification);
      } else {
        skippedLines.push(`Linha ${i + 1}: ${line.substring(0, 100)}...`);
      }
    }
    
    console.log(`Processadas ${lines.length} linhas do PDF`);
    console.log(`Encontradas ${allCertifications.length} certificações válidas`);
    console.log(`Linhas ignoradas: ${skippedLines.length}`);
    
    if (skippedLines.length > 0) {
      console.log('\nPrimeiras 10 linhas ignoradas:');
      skippedLines.slice(0, 10).forEach(line => console.log(line));
    }
    
    // Mostrar estatísticas por categoria
    const statsByCategory = allCertifications.reduce((acc, cert) => {
      acc[cert.categoria] = (acc[cert.categoria] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\nEstatísticas por categoria:');
    Object.entries(statsByCategory).forEach(([categoria, count]) => {
      console.log(`${categoria}: ${count} certificações`);
    });
    
    // Mostrar alunos únicos
    const uniqueStudents = new Set(allCertifications.map(cert => cert.aluno));
    console.log(`\nTotal de alunos únicos: ${uniqueStudents.size}`);
    
    // Inserir no banco de dados
    if (allCertifications.length > 0) {
      await db.insert(certifications).values(allCertifications);
      console.log('\nTodas as certificações do PDF importadas com sucesso!');
    }
    
  } catch (error) {
    console.error('Erro ao importar certificações do PDF:', error);
  }
}

function parseLineData(line: string, lineNumber: number) {
  try {
    // Padrão complexo para extrair dados da linha formatada
    // Baseado na estrutura visual do PDF
    
    // Verificar se é uma linha de dados (tem nome de aluno)
    const nomeMatch = line.match(/([A-ZÁÊÇÕ][A-Za-zÁÉÍÓÚÂÊÎÔÛÃÕÇáéíóúâêîôûãõç\s]+(?:DE|DA|DOS|DAS|DO)\s+[A-ZÁÊÇÕ][A-Za-zÁÉÍÓÚÂÊÎÔÛÃÕÇáéíóúâêîôûãõç\s]*)/);
    
    if (!nomeMatch) {
      return null; // Não é uma linha de dados válida
    }
    
    let aluno = nomeMatch[1].trim();
    
    // Extrair prioridade/início
    let inicio = '';
    if (line.includes('Urgente')) inicio = 'Urgente';
    else if (line.includes('Mediana')) inicio = 'Mediana';
    else if (line.includes('Análise Concluída')) inicio = 'Análise Concluída';
    else if (line.includes('Normal')) inicio = 'Normal';
    
    // Extrair CPF
    const cpfMatch = line.match(/(\d{3}\.?\d{3}\.?\d{3}-?\d{2}|\d{11}|Não localizado|Não licalizado)/);
    const cpf = cpfMatch ? cpfMatch[1] : '';
    
    // Extrair modalidade
    let modalidade = '';
    let categoria = 'pos_graduacao';
    let subcategoria = null;
    
    if (line.includes('Segunda Licenciatura')) {
      modalidade = 'Segunda Licenciatura';
      categoria = 'segunda_graduacao';
      subcategoria = 'segunda_licenciatura';
    } else if (line.includes('Formação Pedagógica')) {
      modalidade = 'Formação Pedagógica';
      categoria = 'segunda_graduacao';
      subcategoria = 'formacao_pedagogica';
    } else if (line.includes('Pós-Graduação')) {
      modalidade = 'Pós-Graduação';
      categoria = 'pos_graduacao';
    } else if (line.includes('Diplomação por Competência')) {
      modalidade = 'Diplomação por Competência';
      categoria = 'eja';
    } else if (line.includes('Formação Livre')) {
      modalidade = 'Formação Livre';
      categoria = 'formacao_livre';
    } else {
      modalidade = 'EAD';
    }
    
    // Extrair curso (texto após modalidade)
    let curso = '';
    const modalidadeIndex = line.indexOf(modalidade);
    if (modalidadeIndex > -1) {
      const afterModalidade = line.substring(modalidadeIndex + modalidade.length).trim();
      const cursoMatch = afterModalidade.match(/^([A-Za-zÁÉÍÓÚÂÊÎÔÛÃÕÇáéíóúâêîôûãõç\s,–-]+?)(?:\s+(?:Quitada?|Não|Iniciou|Pós de|Contratou|Aprovado)|\s*$)/);
      if (cursoMatch) {
        curso = cursoMatch[1].trim();
      }
    }
    
    // Extrair informações financeiras
    const financeiroMatch = line.match(/(?:Quitada?|Iniciou)[^,]*(?:expirou?|expira)[^,]*/);
    const financeiro = financeiroMatch ? financeiroMatch[0] : '';
    
    // Extrair documentação
    let documentacao = '';
    if (line.includes('Entregue e Deferida')) documentacao = 'Entregue e Deferida';
    else if (line.includes('Não encaminhou nenhum documento')) documentacao = 'Não encaminhou nenhum documento';
    else if (line.includes('Incompleto')) documentacao = 'Incompleto';
    
    // Extrair plataforma/tutoria
    let plataforma = '';
    let tutoria = '';
    if (line.includes('Aprovado em todas disciplinas')) {
      plataforma = 'Aprovado em todas disciplinas';
      tutoria = 'Aprovado em todas disciplinas';
    } else if (line.includes('Simple não encontrei as notas')) {
      plataforma = 'Simple não encontrei as notas';
      tutoria = 'Simple não encontrei as notas';
    } else if (line.includes('Não encontrei')) {
      plataforma = 'Não encontrei';
      tutoria = 'Não encontrei';
    }
    
    // Determinar status baseado na prioridade
    let status = 'pendente';
    if (inicio.includes('Urgente')) {
      status = 'em_andamento';
    } else if (inicio.includes('Análise Concluída')) {
      status = 'concluido';
    } else if (inicio.includes('Mediana') || inicio.includes('Normal')) {
      status = 'em_andamento';
    }
    
    // Extrair observações adicionais
    let observacao = '';
    const obsMatch = line.match(/(?:Pós de brinde|Simple|Aprovado em apenas|Resta concluir|Falta apenas)[^,]*/);
    if (obsMatch) {
      observacao = obsMatch[0];
    }
    
    const certification = {
      inicio: inicio || null,
      aluno: aluno,
      cpf: cpf || null,
      modalidade: modalidade || 'EAD',
      curso: curso || 'Não informado',
      financeiro: financeiro || null,
      documentacao: documentacao || null,
      plataforma: plataforma || null,
      tutoria: tutoria || null,
      observacao: observacao || null,
      inicioCertificacao: null,
      dataPrevista: null,
      dataEntrega: null,
      diploma: null,
      status: status,
      categoria: categoria,
      subcategoria: subcategoria,
      prioridade: inicio.toLowerCase() === 'urgente' ? 'urgente' : 
                 inicio.toLowerCase() === 'mediana' ? 'mediana' : 'normal',
      situacaoAnalise: inicio.includes('Análise Concluída') ? 'concluida' : null
    };
    
    return certification;
    
  } catch (error) {
    console.error(`Erro ao processar linha ${lineNumber}:`, error);
    return null;
  }
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  importPDFCertifications().then(() => {
    console.log('Importação do PDF concluída!');
    process.exit(0);
  }).catch(console.error);
}

export { importPDFCertifications };