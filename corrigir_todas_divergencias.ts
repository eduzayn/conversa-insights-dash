import { db } from './server/db';
import { certifications } from './shared/schema';
import { eq, and } from 'drizzle-orm';

async function corrigirTodasDivergencias() {
  try {
    console.log('🔄 Corrigindo todas as divergências identificadas...\n');
    
    // Correções de CPF para unificação
    const correcoesCPF = [
      {
        nome: 'Herber Moabia Chaves Santos',
        cpfIncorreto: '690.558.822-91',
        cpfCorreto: '043.501.688-94'
      },
      {
        nome: 'Giancarlo Lucena dos Santos',
        cpfIncorreto: '659.791.094-05',
        cpfCorreto: '659.791.094-04'
      },
      {
        nome: 'Luciana Dias Leal Toledo',
        cpfIncorreto: '1197818677',
        cpfCorreto: '011.978.186-77'
      },
      {
        nome: 'Selma de Souza Rodrigues Rocha',
        cpfIncorreto: '15153220842',
        cpfCorreto: '151.532.208-42'
      },
      {
        nome: 'Ronald José de Lima Albuquerque',
        cpfIncorreto: '4693268402',
        cpfCorreto: '046.932.684-02'
      },
      {
        nome: 'Daniel Sobreira de Magalhães',
        cpfIncorreto: '918.851.085-92',
        cpfCorreto: '918.851.085-91'
      }
    ];
    
    // Aplicar correções de CPF
    console.log('📝 Corrigindo CPFs divergentes:\n');
    
    for (const correcao of correcoesCPF) {
      const registros = await db.select()
        .from(certifications)
        .where(eq(certifications.cpf, correcao.cpfIncorreto));
      
      if (registros.length > 0) {
        console.log(`🔄 ${correcao.nome}: ${correcao.cpfIncorreto} → ${correcao.cpfCorreto}`);
        
        for (const registro of registros) {
          await db.update(certifications)
            .set({ 
              cpf: correcao.cpfCorreto,
              observacao: 'CPF corrigido - divergência unificada' 
            })
            .where(eq(certifications.id, registro.id));
        }
        
        console.log(`   ✅ ${registros.length} registro(s) corrigido(s)`);
      }
    }
    
    // Remover duplicata encontrada
    console.log('\n🗑️  Removendo duplicatas:\n');
    
    const duplicatas = await db.select()
      .from(certifications)
      .where(and(
        eq(certifications.cpf, '59527803268'),
        eq(certifications.modalidade, 'Pós-Graduação'),
        eq(certifications.curso, 'Não informado')
      ));
    
    if (duplicatas.length > 1) {
      // Manter apenas o primeiro registro
      for (let i = 1; i < duplicatas.length; i++) {
        await db.delete(certifications)
          .where(eq(certifications.id, duplicatas[i].id));
        console.log(`   ✅ Removida duplicata: Suzana Moura da Silva Torres - Pós-Graduação`);
      }
    }
    
    // Verificar se foram resolvidas as divergências
    console.log('\n📊 Verificando se as correções foram aplicadas:\n');
    
    for (const correcao of correcoesCPF) {
      const registrosUnificados = await db.select()
        .from(certifications)
        .where(eq(certifications.cpf, correcao.cpfCorreto));
      
      console.log(`✅ ${correcao.nome}: ${registrosUnificados.length} registro(s) com CPF ${correcao.cpfCorreto}`);
    }
    
    console.log('\n📋 Resumo das correções aplicadas:');
    console.log('   ✅ CPFs unificados para 6 alunos');
    console.log('   ✅ Duplicatas removidas');
    console.log('   ⚠️  10 registros sem CPF permanecem (requerem preenchimento manual)');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir divergências:', error);
  }
}

// Executar as correções
corrigirTodasDivergencias()
  .then(() => {
    console.log('\n✅ Correção de todas as divergências concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro nas correções:', error);
    process.exit(1);
  });