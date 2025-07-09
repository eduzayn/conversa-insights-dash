import { db } from './server/db';
import { preRegisteredCourses } from './shared/schema';
import { eq, and } from 'drizzle-orm';

async function adicionarCursosDiplomacao() {
  console.log('📚 Adicionando cursos de Diplomação por Competência...');
  
  const cursosDiplomacao = [
    {
      nome: 'Música',
      modalidade: 'Diplomação por competência',
      categoria: 'diplomacao_competencia',
      cargaHoraria: 800,
      area: 'Artes',
      ativo: true
    },
    {
      nome: 'Educação Física',
      modalidade: 'Diplomação por competência',
      categoria: 'diplomacao_competencia',
      cargaHoraria: 800,
      area: 'Educação Física',
      ativo: true
    },
    {
      nome: 'Pedagogia',
      modalidade: 'Diplomação por competência',
      categoria: 'diplomacao_competencia',
      cargaHoraria: 800,
      area: 'Educação',
      ativo: true
    }
  ];

  try {
    let adicionados = 0;
    let jaExistentes = 0;

    for (const curso of cursosDiplomacao) {
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
    console.log(`📚 Total de cursos processados: ${cursosDiplomacao.length}`);

    // Verificar total de cursos de diplomação no sistema
    const totalDiplomacao = await db
      .select()
      .from(preRegisteredCourses)
      .where(eq(preRegisteredCourses.modalidade, 'Diplomação por competência'));
    
    console.log(`🎯 Total de cursos de Diplomação por Competência: ${totalDiplomacao.length}`);
    
    console.log('\n🔍 Cursos de Diplomação por Competência no sistema:');
    totalDiplomacao.forEach(curso => {
      console.log(`- ${curso.nome} (${curso.cargaHoraria}h - ${curso.area})`);
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }

  process.exit(0);
}

adicionarCursosDiplomacao();