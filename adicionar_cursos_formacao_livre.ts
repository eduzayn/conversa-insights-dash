import { db } from './server/db';
import { preRegisteredCourses } from './shared/schema';
import { eq, and } from 'drizzle-orm';

async function adicionarCursosFormacaoLivre() {
  console.log('📚 Adicionando cursos de Formação Livre...');
  
  const cursosFormacaoLivre = [
    {
      nome: 'Psicanálise',
      modalidade: 'Formação livre',
      categoria: 'formacao_livre',
      cargaHoraria: 360,
      area: 'Psicologia',
      ativo: true
    },
    {
      nome: 'Sexologia',
      modalidade: 'Formação livre',
      categoria: 'formacao_livre',
      cargaHoraria: 360,
      area: 'Saúde',
      ativo: true
    }
  ];

  try {
    let adicionados = 0;
    let jaExistentes = 0;

    for (const curso of cursosFormacaoLivre) {
      try {
        // Verificar se o curso já existe
        const existente = await db
          .select()
          .from(preRegisteredCourses)
          .where(
            and(
              eq(preRegisteredCourses.nome, curso.nome),
              eq(preRegisteredCourses.modalidade, curso.modalidade)
            )
          );

        if (existente.length > 0) {
          console.log(`⚠️  Curso já existe: ${curso.nome}`);
          jaExistentes++;
          continue;
        }

        // Adicionar o curso
        await db.insert(preRegisteredCourses).values({
          ...curso,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        console.log(`✅ Adicionado: ${curso.nome}`);
        adicionados++;

      } catch (error) {
        console.error(`❌ Erro ao adicionar ${curso.nome}:`, error);
      }
    }

    console.log('\n📊 Resumo da operação:');
    console.log(`✅ Cursos adicionados: ${adicionados}`);
    console.log(`⚠️  Cursos já existentes: ${jaExistentes}`);
    console.log(`📚 Total de cursos processados: ${cursosFormacaoLivre.length}`);

    // Verificar total de cursos de formação livre no sistema
    const totalFormacaoLivre = await db
      .select()
      .from(preRegisteredCourses)
      .where(eq(preRegisteredCourses.modalidade, 'Formação livre'));
    
    console.log(`🎯 Total de cursos de Formação Livre: ${totalFormacaoLivre.length}`);
    
    console.log('\n🔍 Cursos de Formação Livre no sistema:');
    totalFormacaoLivre.forEach(curso => {
      console.log(`- ${curso.nome} (${curso.cargaHoraria}h - ${curso.area})`);
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }

  process.exit(0);
}

adicionarCursosFormacaoLivre();