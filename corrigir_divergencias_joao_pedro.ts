import { db } from './server/db';
import { certifications } from './shared/schema';
import { eq } from 'drizzle-orm';

async function corrigirDivergenciasJoaoPedro() {
  try {
    console.log('🔄 Corrigindo divergências para João Pedro Amorim de Oliveira Araújo...\n');
    
    // Buscar todos os registros do João Pedro (ambos CPFs)
    const registrosCPF1 = await db.select()
      .from(certifications)
      .where(eq(certifications.cpf, '114.501.706-17'));
    
    const registrosCPF2 = await db.select()
      .from(certifications)
      .where(eq(certifications.cpf, '12614151408'));
    
    console.log('📋 Registros com CPF 114.501.706-17:');
    registrosCPF1.forEach(reg => {
      console.log(`   - ${reg.modalidade}: ${reg.curso}`);
    });
    
    console.log('\n📋 Registros com CPF 12614151408:');
    registrosCPF2.forEach(reg => {
      console.log(`   - ${reg.modalidade}: ${reg.curso}`);
    });
    
    // Unificar CPFs - usar o CPF da planilha de julho (12614151408) como padrão
    if (registrosCPF1.length > 0) {
      console.log('\n🔄 Unificando CPFs para 12614151408...');
      
      for (const registro of registrosCPF1) {
        await db.update(certifications)
          .set({
            cpf: '12614151408',
            observacao: 'CPF unificado conforme planilha de julho 2025'
          })
          .where(eq(certifications.id, registro.id));
      }
      
      console.log('✅ CPFs unificados');
    }
    
    // Verificar se há duplicatas de cursos
    const todosRegistros = await db.select()
      .from(certifications)
      .where(eq(certifications.cpf, '12614151408'));
    
    console.log('\n📊 Registros unificados:');
    todosRegistros.forEach(reg => {
      console.log(`   - ${reg.modalidade}: ${reg.curso}`);
    });
    
    // Verificar duplicatas
    const cursosDuplicados = todosRegistros.filter((reg, index, arr) => 
      arr.findIndex(r => r.curso === reg.curso && r.modalidade === reg.modalidade) !== index
    );
    
    if (cursosDuplicados.length > 0) {
      console.log('\n🔄 Removendo duplicatas...');
      
      for (const duplicata of cursosDuplicados) {
        await db.delete(certifications)
          .where(eq(certifications.id, duplicata.id));
        console.log(`   - Removida duplicata: ${duplicata.modalidade} - ${duplicata.curso}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao corrigir divergências:', error);
  }
}

// Executar a correção
corrigirDivergenciasJoaoPedro()
  .then(() => {
    console.log('\n✅ Correção de divergências concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro na correção:', error);
    process.exit(1);
  });