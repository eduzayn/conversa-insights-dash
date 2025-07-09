import { db } from './server/db';
import { certifications } from './shared/schema';
import { or, like, eq } from 'drizzle-orm';

async function verificarOutrasDivergencias() {
  try {
    console.log('🔍 Verificando outras possíveis divergências no sistema...\n');
    
    // Buscar alunos com nomes similares mas CPFs diferentes
    const todosRegistros = await db.select().from(certifications);
    
    // Agrupar por nome de aluno
    const alunosPorNome = new Map();
    
    todosRegistros.forEach(reg => {
      const nomeNormalizado = reg.aluno.toLowerCase().trim();
      if (!alunosPorNome.has(nomeNormalizado)) {
        alunosPorNome.set(nomeNormalizado, []);
      }
      alunosPorNome.get(nomeNormalizado).push(reg);
    });
    
    console.log('📊 Verificando alunos com possíveis divergências de CPF:\n');
    
    let divergenciasEncontradas = 0;
    
    for (const [nomeAluno, registros] of alunosPorNome) {
      // Verificar se há CPFs diferentes para o mesmo nome
      const cpfsUnicos = [...new Set(registros.map(r => r.cpf).filter(cpf => cpf))];
      
      if (cpfsUnicos.length > 1) {
        console.log(`⚠️  ${registros[0].aluno}:`);
        cpfsUnicos.forEach(cpf => {
          const cursosComCPF = registros.filter(r => r.cpf === cpf);
          console.log(`   CPF ${cpf}:`);
          cursosComCPF.forEach(curso => {
            console.log(`     - ${curso.modalidade}: ${curso.curso}`);
          });
        });
        console.log('');
        divergenciasEncontradas++;
      }
    }
    
    if (divergenciasEncontradas === 0) {
      console.log('✅ Nenhuma divergência de CPF encontrada para outros alunos\n');
    } else {
      console.log(`📋 Total de alunos com divergências de CPF: ${divergenciasEncontradas}\n`);
    }
    
    // Verificar duplicatas de cursos (mesmo CPF, mesma modalidade, mesmo curso)
    console.log('🔍 Verificando duplicatas de cursos:\n');
    
    const duplicatas = [];
    
    for (const [nomeAluno, registros] of alunosPorNome) {
      const cursosUnicos = new Set();
      
      for (const registro of registros) {
        const chave = `${registro.cpf}-${registro.modalidade}-${registro.curso}`;
        
        if (cursosUnicos.has(chave)) {
          duplicatas.push(registro);
        } else {
          cursosUnicos.add(chave);
        }
      }
    }
    
    if (duplicatas.length > 0) {
      console.log(`⚠️  Encontradas ${duplicatas.length} duplicatas:`);
      duplicatas.forEach(dup => {
        console.log(`   - ${dup.aluno} (${dup.cpf}): ${dup.modalidade} - ${dup.curso}`);
      });
    } else {
      console.log('✅ Nenhuma duplicata encontrada');
    }
    
    // Verificar registros com CPF null ou vazio
    console.log('\n🔍 Verificando registros com CPF null ou vazio:\n');
    
    const registrosSemCPF = todosRegistros.filter(reg => !reg.cpf || reg.cpf.trim() === '');
    
    if (registrosSemCPF.length > 0) {
      console.log(`⚠️  Encontrados ${registrosSemCPF.length} registros sem CPF:`);
      registrosSemCPF.forEach(reg => {
        console.log(`   - ${reg.aluno}: ${reg.modalidade} - ${reg.curso}`);
      });
    } else {
      console.log('✅ Todos os registros possuem CPF');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar divergências:', error);
  }
}

// Executar a verificação
verificarOutrasDivergencias()
  .then(() => {
    console.log('\n✅ Verificação de divergências concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro na verificação:', error);
    process.exit(1);
  });