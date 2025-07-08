import fs from 'fs';
import { db } from './server/db.ts';
import { certifications } from './shared/schema.ts';

async function importAllCertifications() {
  try {
    // Ler o arquivo CSV
    const csvContent = fs.readFileSync('attached_assets/An_lise_Certifica__o_Julho_1752012380734.csv', 'utf-8');
    const lines = csvContent.split('\n');
    
    // Pular a primeira linha (cabeçalho)
    const dataLines = lines.slice(1);
    
    const allCertifications = [];
    
    for (const line of dataLines) {
      if (!line.trim()) continue;
      
      // Dividir por vírgula mas cuidar com vírgulas dentro de aspas
      const columns = [];
      let currentColumn = '';
      let insideQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          columns.push(currentColumn.trim());
          currentColumn = '';
        } else {
          currentColumn += char;
        }
      }
      columns.push(currentColumn.trim());
      
      // Mapear modalidades
      const modalidadeOriginal = columns[3]?.replace(/"/g, '').trim();
      const curso = columns[4]?.replace(/"/g, '').trim();
      const aluno = columns[1]?.replace(/"/g, '').trim();
      const cpf = columns[2]?.replace(/"/g, '').trim();
      
      if (!modalidadeOriginal || !curso || !aluno) continue;
      
      let categoria = '';
      let subcategoria = null;
      let modalidade = modalidadeOriginal;
      
      // Mapear categorias baseadas na modalidade
      switch (modalidadeOriginal) {
        case 'Pós-Graduação':
          categoria = 'pos_graduacao';
          modalidade = 'EAD'; // Assumindo EAD como padrão
          break;
        case 'Segunda Licenciatura':
          categoria = 'segunda_graduacao';
          subcategoria = 'segunda_licenciatura';
          modalidade = 'EAD';
          break;
        case 'Formação Pedagógica':
          categoria = 'segunda_graduacao';
          subcategoria = 'formacao_pedagogica';
          modalidade = 'EAD';
          break;
        case 'Formação Livre':
          categoria = 'formacao_livre';
          modalidade = 'EAD';
          break;
        case 'Diplomação por Competência':
          categoria = 'eja';
          modalidade = 'EAD';
          break;
        default:
          continue; // Pular se não reconhecer a modalidade
      }
      
      const certification = {
        aluno: aluno,
        cpf: cpf,
        modalidade: modalidade,
        curso: curso,
        financeiro: columns[5]?.replace(/"/g, '').trim() || '',
        documentacao: columns[6]?.replace(/"/g, '').trim() || '',
        plataforma: columns[7]?.replace(/"/g, '').trim() || '',
        tutoria: columns[8]?.replace(/"/g, '').trim() || '',
        observacao: columns[9]?.replace(/"/g, '').trim() || '',
        inicioCertificacao: columns[10]?.replace(/"/g, '').trim() || '',
        dataPrevista: columns[11]?.replace(/"/g, '').trim() || null,
        dataEntrega: columns[12]?.replace(/"/g, '').trim() || null,
        diploma: columns[13]?.replace(/"/g, '').trim() || '',
        categoria: categoria,
        subcategoria: subcategoria,
        status: 'pendente' // Status padrão
      };
      
      // Determinar status baseado na prioridade/observações
      const inicio = columns[0]?.replace(/"/g, '').trim() || '';
      if (inicio.includes('Urgente')) {
        certification.status = 'em_andamento';
      } else if (inicio.includes('Análise Concluída')) {
        certification.status = 'concluido';
      } else if (inicio.includes('Mediana')) {
        certification.status = 'em_andamento';
      } else if (inicio.includes('Normal')) {
        certification.status = 'em_andamento';
      }
      
      allCertifications.push(certification);
    }
    
    console.log(`Encontradas ${allCertifications.length} certificações no total`);
    
    // Mostrar estatísticas por categoria
    const statsByCategory = allCertifications.reduce((acc, cert) => {
      acc[cert.categoria] = (acc[cert.categoria] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\nEstatísticas por categoria:');
    Object.entries(statsByCategory).forEach(([categoria, count]) => {
      console.log(`${categoria}: ${count} certificações`);
    });
    
    // Mostrar estatísticas por status
    const statsByStatus = allCertifications.reduce((acc, cert) => {
      acc[cert.status] = (acc[cert.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\nEstatísticas por status:');
    Object.entries(statsByStatus).forEach(([status, count]) => {
      console.log(`${status}: ${count} certificações`);
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
  importAllCertifications().then(() => {
    console.log('Importação concluída!');
    process.exit(0);
  }).catch(console.error);
}

export { importAllCertifications };