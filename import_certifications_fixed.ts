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

async function importCertificationsFixed() {
  try {
    // Ler o arquivo CSV
    const csvContent = fs.readFileSync('attached_assets/An_lise_Certifica__o_Julho_1752012380734.csv', 'utf-8');
    
    // Processar o CSV considerando quebras de linha dentro das aspas
    const lines = csvContent.split('\n');
    const processedLines: string[] = [];
    let currentLine = '';
    let inQuotes = false;
    
    for (let i = 1; i < lines.length; i++) { // Pular cabeçalho
      const line = lines[i];
      
      // Contar aspas para determinar se estamos dentro de uma célula com quebra de linha
      let quoteCount = 0;
      for (const char of line) {
        if (char === '"') quoteCount++;
      }
      
      if (currentLine) {
        currentLine += ' ' + line;
      } else {
        currentLine = line;
      }
      
      // Se o número de aspas for par, a linha está completa
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
    
    for (const line of processedLines) {
      if (!line.trim()) continue;
      
      const columns = parseCSVLine(line);
      
      // Limpar aspas dos campos
      const cleanColumns = columns.map(col => col.replace(/^"/, '').replace(/"$/, '').trim());
      
      const modalidadeOriginal = cleanColumns[3];
      const curso = cleanColumns[4];
      const aluno = cleanColumns[1];
      const cpf = cleanColumns[2];
      
      // Pular se não tiver dados essenciais
      if (!modalidadeOriginal || !curso || !aluno) continue;
      
      let categoria = '';
      let subcategoria = null;
      let modalidade = 'EAD'; // Padrão EAD
      
      // Mapear categorias baseadas na modalidade
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
          categoria = 'eja';
          break;
        default:
          console.log(`Modalidade não reconhecida: ${modalidadeOriginal}`);
          continue;
      }
      
      const certification = {
        aluno: aluno,
        cpf: cpf,
        modalidade: modalidade,
        curso: curso,
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
    
    // Mostrar estatísticas por categoria
    const statsByCategory = allCertifications.reduce((acc, cert) => {
      acc[cert.categoria] = (acc[cert.categoria] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\nEstatísticas por categoria:');
    Object.entries(statsByCategory).forEach(([categoria, count]) => {
      console.log(`${categoria}: ${count} certificações`);
    });
    
    // Mostrar alguns cursos por categoria
    console.log('\nExemplos de cursos por categoria:');
    const examplesByCategory = allCertifications.reduce((acc, cert) => {
      if (!acc[cert.categoria]) acc[cert.categoria] = new Set();
      acc[cert.categoria].add(cert.curso);
      return acc;
    }, {});
    
    Object.entries(examplesByCategory).forEach(([categoria, cursos]) => {
      console.log(`${categoria}: ${Array.from(cursos).slice(0, 5).join(', ')}`);
    });
    
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
  importCertificationsFixed().then(() => {
    console.log('Importação concluída!');
    process.exit(0);
  }).catch(console.error);
}

export { importCertificationsFixed };