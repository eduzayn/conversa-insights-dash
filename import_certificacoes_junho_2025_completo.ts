import { readFile } from 'fs/promises';
import { db } from './server/db';
import { certifications } from './shared/schema';
import { eq, and } from 'drizzle-orm';

async function importarCertificacoesJunho2025Completo() {
  console.log('📚 Importando certificações de junho 2025 (arquivo completo)...');
  
  try {
    // Ler dados processados
    const dados = JSON.parse(await readFile('./dados_junho_2025_completo.json', 'utf8'));
    
    let importados = 0;
    let jaExistentes = 0;
    let erros = 0;
    
    for (const certificacao of dados) {
      try {
        // Verificar se já existe
        const existente = await db
          .select()
          .from(certifications)
          .where(
            and(
              eq(certifications.cpf, certificacao.cpf),
              eq(certifications.curso, certificacao.curso)
            )
          );
          
        if (existente.length > 0) {
          jaExistentes++;
          console.log(`⚠️  Já existe: ${certificacao.aluno} - ${certificacao.curso}`);
          continue;
        }
        
        // Inserir nova certificação
        await db.insert(certifications).values(certificacao);
        importados++;
        
        console.log(`✅ Importado: ${certificacao.aluno} - ${certificacao.curso}`);
        
      } catch (error) {
        erros++;
        console.log(`❌ Erro ao importar ${certificacao.aluno}:`, error);
      }
    }
    
    console.log('\n📊 Relatório final:');
    console.log(`📋 Total no arquivo: ${dados.length}`);
    console.log(`✅ Importados: ${importados}`);
    console.log(`⚠️  Já existentes: ${jaExistentes}`);
    console.log(`❌ Erros: ${erros}`);
    
    // Salvar relatório
    const relatorio = {
      mes: 'junho_2025_completo',
      dataImportacao: new Date().toISOString(),
      totalArquivo: dados.length,
      importados,
      jaExistentes,
      erros,
      detalhes: {
        categorias: dados.reduce((acc, item) => {
          acc[item.categoria] = (acc[item.categoria] || 0) + 1;
          return acc;
        }, {}),
        modalidades: dados.reduce((acc, item) => {
          acc[item.modalidade] = (acc[item.modalidade] || 0) + 1;
          return acc;
        }, {}),
        status: dados.reduce((acc, item) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        }, {})
      }
    };
    
    const fs = await import('fs');
    fs.writeFileSync('./relatorio_importacao_junho_2025_completo.json', JSON.stringify(relatorio, null, 2));
    
    console.log('\n🎯 Certificações por categoria:');
    Object.entries(relatorio.detalhes.categorias).forEach(([categoria, count]) => {
      console.log(`  ${categoria}: ${count}`);
    });
    
    console.log('\n📊 Certificações por modalidade:');
    Object.entries(relatorio.detalhes.modalidades).forEach(([modalidade, count]) => {
      console.log(`  ${modalidade}: ${count}`);
    });
    
    console.log('\n📈 Certificações por status:');
    Object.entries(relatorio.detalhes.status).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    console.log('\n💾 Relatório salvo em: relatorio_importacao_junho_2025_completo.json');
    
  } catch (error) {
    console.error('❌ Erro na importação:', error);
  }
}

// Executar
importarCertificacoesJunho2025Completo().catch(console.error);