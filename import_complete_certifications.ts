import fs from 'fs';
import { db } from './server/db.ts';
import { certifications } from './shared/schema.ts';

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
    i++;
  }
  
  // Adicionar a última coluna
  result.push(current.trim());
  
  return result;
}

async function importCompleteCertifications() {
  try {
    // Ler o arquivo CSV
    const csvContent = fs.readFileSync('attached_assets/An_lise_Certifica__o_Julho_1752012380734.csv', 'utf-8');
    
    // Processar o CSV considerando quebras de linha dentro das aspas
    const lines = csvContent.split('\n');
    const processedLines: string[] = [];
    let currentLine = '';
    
    for (let i = 1; i < lines.length; i++) { // Pular cabeçalho
      const line = lines[i];
      
      if (currentLine) {
        currentLine += ' ' + line;
      } else {
        currentLine = line;
      }
      
      // Verificar se a linha está completa contando aspas
      let totalQuotes = 0;
      for (const char of currentLine) {
        if (char === '"') totalQuotes++;
      }
      
      if (totalQuotes % 2 === 0 && currentLine.trim()) {
        processedLines.push(currentLine);
        currentLine = '';
      }
    }
    
    // Se ainda houver linha pendente, adicionar
    if (currentLine.trim()) {
      processedLines.push(currentLine);
    }
    
    console.log(`Processadas ${processedLines.length} linhas do CSV`);
    
    const allCertifications = [];
    const skippedLines = [];
    
    for (let i = 0; i < processedLines.length; i++) {
      const line = processedLines[i];
      if (!line.trim()) continue;
      
      const columns = parseCSVLine(line);
      
      // Limpar aspas dos campos
      const cleanColumns = columns.map(col => col.replace(/^"/, '').replace(/"$/, '').trim());
      
      const modalidadeOriginal = cleanColumns[3];
      const curso = cleanColumns[4];
      const aluno = cleanColumns[1];
      const cpf = cleanColumns[2];
      
      // Pular apenas se não tiver nome do aluno
      if (!aluno) {
        skippedLines.push(`Linha ${i + 2}: Sem nome do aluno`);
        continue;
      }
      
      // Para linhas sem modalidade/curso, definir valores padrão
      let categoria = 'pos_graduacao'; // Padrão
      let subcategoria = null;
      let modalidade = 'EAD';
      let cursoFinal = curso || 'Não informado';
      
      // Mapear categorias baseadas na modalidade (se informada)
      if (modalidadeOriginal) {
        switch (modalidadeOriginal) {
          case 'Pós-Graduação':
            categoria = 'pos_graduacao';
            break;
          case 'Segunda Licenciatura':
            categoria = 'segunda_graduacao';
            subcategoria = 'segunda_licenciatura';
            break;
          case 'Formação Pedagógica':
            categoria = 'segunda_graduacao';
            subcategoria = 'formacao_pedagogica';
            break;
          case 'Formação Livre':
            categoria = 'formacao_livre';
            break;
          case 'Diplomação por Competência':
            categoria = 'formacao_livre';
            subcategoria = 'diplomacao_competencia';
            break;
          default:
            console.log(`Modalidade não reconhecida: ${modalidadeOriginal}, usando padrão`);
        }
      }
      
      const certification = {
        aluno: aluno,
        cpf: cpf || 'Não informado',
        modalidade: modalidade,
        curso: cursoFinal,
        financeiro: cleanColumns[5] || '',
        documentacao: cleanColumns[6] || '',
        plataforma: cleanColumns[7] || '',
        tutoria: cleanColumns[8] || '',
        observacao: cleanColumns[9] || '',
        inicioCertificacao: cleanColumns[10] || '',
        dataPrevista: cleanColumns[11] || null,
        dataEntrega: cleanColumns[12] || null,
        diploma: cleanColumns[13] || '',
        categoria: categoria,
        subcategoria: subcategoria,
        status: 'pendente'
      };
      
      // Determinar status baseado na prioridade
      const prioridade = cleanColumns[0] || '';
      if (prioridade.includes('Urgente')) {
        certification.status = 'em_andamento';
      } else if (prioridade.includes('Análise Concluída')) {
        certification.status = 'concluido';
      } else if (prioridade.includes('Mediana') || prioridade.includes('Normal')) {
        certification.status = 'em_andamento';
      }
      
      allCertifications.push(certification);
    }
    
    console.log(`Encontradas ${allCertifications.length} certificações válidas`);
    console.log(`Linhas ignoradas: ${skippedLines.length}`);
    
    if (skippedLines.length > 0) {
      console.log('\nLinhas ignoradas:');
      skippedLines.forEach(line => console.log(line));
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
      console.log('\nTodas as certificações importadas com sucesso!');
    }
    
  } catch (error) {
    console.error('Erro ao importar certificações:', error);
  }
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  importCompleteCertifications().then(() => {
    console.log('Importação concluída!');
    process.exit(0);
  }).catch(console.error);
}

export { importCompleteCertifications };