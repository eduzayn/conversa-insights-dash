import { db } from './server/db';
import { certifications } from './shared/schema';

async function verificarImportacaoFevereiro() {
  console.log('📊 Verificando importação de fevereiro 2025...');
  
  try {
    // Total geral
    const totalGeral = await db.select().from(certifications);
    console.log(`🎯 Total de certificações no sistema: ${totalGeral.length}`);
    
    // Certificações importadas hoje
    const importadasHoje = await db
      .select()
      .from(certifications)
      .where(
        // Usar função SQL para filtrar por data
        db.sql`DATE(created_at) = CURRENT_DATE`
      );
    
    console.log(`📅 Certificações importadas hoje: ${importadasHoje.length}`);
    
    // Estatísticas por modalidade
    const estatisticasModalidade = {};
    totalGeral.forEach(cert => {
      const modalidade = cert.modalidade || 'Não informado';
      if (!estatisticasModalidade[modalidade]) {
        estatisticasModalidade[modalidade] = 0;
      }
      estatisticasModalidade[modalidade]++;
    });
    
    console.log('\n📈 Estatísticas por modalidade:');
    Object.entries(estatisticasModalidade)
      .sort(([,a], [,b]) => b - a)
      .forEach(([modalidade, count]) => {
        console.log(`${modalidade}: ${count} certificações`);
      });
    
    // Estatísticas por status
    const estatisticasStatus = {};
    totalGeral.forEach(cert => {
      const status = cert.status || 'Não informado';
      if (!estatisticasStatus[status]) {
        estatisticasStatus[status] = 0;
      }
      estatisticasStatus[status]++;
    });
    
    console.log('\n📊 Estatísticas por status:');
    Object.entries(estatisticasStatus)
      .sort(([,a], [,b]) => b - a)
      .forEach(([status, count]) => {
        console.log(`${status}: ${count} certificações`);
      });
    
    // Verificar certificações por mês/período
    const periodos = {
      'Fevereiro 2025': 0,
      'Março 2025': 0,
      'Abril 2025': 0,
      'Maio 2025': 0,
      'Junho 2025': 0,
      'Julho 2025': 0,
      'Outros': 0
    };
    
    totalGeral.forEach(cert => {
      const created = new Date(cert.created_at);
      const today = new Date();
      const diffDays = Math.floor((today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 1) {
        // Estimativa baseada no período de importação
        if (cert.modalidade === 'Segunda licenciatura' || cert.modalidade === 'Pós-graduação') {
          periodos['Fevereiro 2025']++;
        } else {
          periodos['Outros']++;
        }
      } else {
        periodos['Outros']++;
      }
    });
    
    console.log('\n📅 Distribuição por período (estimativa):');
    Object.entries(periodos).forEach(([periodo, count]) => {
      if (count > 0) {
        console.log(`${periodo}: ${count} certificações`);
      }
    });
    
    // Verificar qualidade dos dados
    const comCPF = totalGeral.filter(cert => cert.cpf && cert.cpf.length === 11);
    const comCurso = totalGeral.filter(cert => cert.curso && cert.curso.trim().length > 0);
    const comModalidade = totalGeral.filter(cert => cert.modalidade && cert.modalidade !== 'Não informado');
    
    console.log('\n🔍 Qualidade dos dados:');
    console.log(`CPFs válidos: ${comCPF.length}/${totalGeral.length} (${((comCPF.length / totalGeral.length) * 100).toFixed(1)}%)`);
    console.log(`Com curso: ${comCurso.length}/${totalGeral.length} (${((comCurso.length / totalGeral.length) * 100).toFixed(1)}%)`);
    console.log(`Com modalidade: ${comModalidade.length}/${totalGeral.length} (${((comModalidade.length / totalGeral.length) * 100).toFixed(1)}%)`);
    
    console.log('\n✅ Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
  }
}

// Executar se for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  verificarImportacaoFevereiro()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro:', error);
      process.exit(1);
    });
}

export { verificarImportacaoFevereiro };