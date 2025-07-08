import fs from 'fs';
import { db } from './server/db.ts';
import { certifications } from './shared/schema.ts';

async function importPosGraduacao() {
  try {
    // Ler o arquivo CSV
    const csvContent = fs.readFileSync('attached_assets/An_lise_Certifica__o_Julho_1752012380734.csv', 'utf-8');
    const lines = csvContent.split('\n');
    
    // Pular a primeira linha (cabeçalho)
    const dataLines = lines.slice(1);
    
    const posGraduacaoCertifications = [];
    
    for (const line of dataLines) {
      if (!line.trim()) continue;
      
      const columns = line.split(',');
      
      // Verificar se é uma certificação de pós-graduação
      const modalidade = columns[3]?.trim();
      const curso = columns[4]?.trim();
      
      if (modalidade === 'Pós-Graduação' && curso) {
        const certification = {
          aluno: columns[1]?.trim() || '',
          cpf: columns[2]?.trim() || '',
          modalidade: modalidade,
          curso: curso,
          financeiro: columns[5]?.trim() || '',
          documentacao: columns[6]?.trim() || '',
          plataforma: columns[7]?.trim() || '',
          tutoria: columns[8]?.trim() || '',
          observacao: columns[9]?.trim() || '',
          inicioCertificacao: columns[10]?.trim() || '',
          dataPrevista: columns[11]?.trim() || null,
          dataEntrega: columns[12]?.trim() || null,
          diploma: columns[13]?.trim() || '',
          categoria: 'pos_graduacao',
          subcategoria: null,
          status: 'pendente' // Status padrão
        };
        
        // Determinar status baseado na prioridade/observações
        const inicio = columns[0]?.trim() || '';
        if (inicio.includes('Urgente')) {
          certification.status = 'em_andamento';
        } else if (inicio.includes('Análise Concluída')) {
          certification.status = 'concluido';
        } else if (inicio.includes('Mediana')) {
          certification.status = 'em_andamento';
        }
        
        posGraduacaoCertifications.push(certification);
      }
    }
    
    console.log(`Encontradas ${posGraduacaoCertifications.length} certificações de pós-graduação`);
    
    // Inserir no banco de dados
    if (posGraduacaoCertifications.length > 0) {
      await db.insert(certifications).values(posGraduacaoCertifications);
      console.log('Certificações de pós-graduação importadas com sucesso!');
    }
    
    // Mostrar algumas estatísticas
    const stats = posGraduacaoCertifications.reduce((acc, cert) => {
      acc[cert.curso] = (acc[cert.curso] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\nEstatísticas por curso:');
    Object.entries(stats).forEach(([curso, count]) => {
      console.log(`${curso}: ${count} certificações`);
    });
    
  } catch (error) {
    console.error('Erro ao importar certificações:', error);
  }
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  importPosGraduacao().then(() => {
    console.log('Importação concluída!');
    process.exit(0);
  }).catch(console.error);
}

export { importPosGraduacao };