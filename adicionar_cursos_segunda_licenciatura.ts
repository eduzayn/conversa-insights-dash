import { db } from './server/db';
import { preRegisteredCourses } from './shared/schema';
import { eq, and } from 'drizzle-orm';

async function adicionarCursosSegundaLicenciatura() {
  console.log('📚 Adicionando cursos de Segunda Licenciatura...');
  
  const cursosSegundaLicenciatura = [
    {
      nome: 'Educação Especial',
      modalidade: 'Segunda licenciatura',
      categoria: 'segunda_graduacao',
      carga_horaria: 1320,
      area: 'Educação',
      ativo: true
    },
    {
      nome: 'Educação Física para Licenciados (12 meses)',
      modalidade: 'Segunda licenciatura',
      categoria: 'segunda_graduacao',
      carga_horaria: 1320,
      area: 'Educação Física',
      ativo: true
    },
    {
      nome: 'Ciências da Religião',
      modalidade: 'Segunda licenciatura',
      categoria: 'segunda_graduacao',
      carga_horaria: 1320,
      area: 'Ciências Humanas',
      ativo: true
    },
    {
      nome: 'Filosofia',
      modalidade: 'Segunda licenciatura',
      categoria: 'segunda_graduacao',
      carga_horaria: 1320,
      area: 'Ciências Humanas',
      ativo: true
    },
    {
      nome: 'Geografia',
      modalidade: 'Segunda licenciatura',
      categoria: 'segunda_graduacao',
      carga_horaria: 1320,
      area: 'Ciências Humanas',
      ativo: true
    },
    {
      nome: 'Letras (Português/Inglês)',
      modalidade: 'Segunda licenciatura',
      categoria: 'segunda_graduacao',
      carga_horaria: 1320,
      area: 'Letras',
      ativo: true
    },
    {
      nome: 'Letras (Português/Espanhol)',
      modalidade: 'Segunda licenciatura',
      categoria: 'segunda_graduacao',
      carga_horaria: 1320,
      area: 'Letras',
      ativo: true
    },
    {
      nome: 'Letras (Libras)',
      modalidade: 'Segunda licenciatura',
      categoria: 'segunda_graduacao',
      carga_horaria: 1320,
      area: 'Letras',
      ativo: true
    },
    {
      nome: 'Matemática',
      modalidade: 'Segunda licenciatura',
      categoria: 'segunda_graduacao',
      carga_horaria: 1320,
      area: 'Ciências Exatas',
      ativo: true
    },
    {
      nome: 'Sociologia',
      modalidade: 'Segunda licenciatura',
      categoria: 'segunda_graduacao',
      carga_horaria: 1320,
      area: 'Ciências Humanas',
      ativo: true
    },
    {
      nome: 'Artes Visuais',
      modalidade: 'Segunda licenciatura',
      categoria: 'segunda_graduacao',
      carga_horaria: 1320,
      area: 'Artes',
      ativo: true
    },
    {
      nome: 'História',
      modalidade: 'Segunda licenciatura',
      categoria: 'segunda_graduacao',
      carga_horaria: 1320,
      area: 'Ciências Humanas',
      ativo: true
    },
    {
      nome: 'Ciências Biológicas',
      modalidade: 'Segunda licenciatura',
      categoria: 'segunda_graduacao',
      carga_horaria: 1320,
      area: 'Ciências Biológicas',
      ativo: true
    },
    {
      nome: 'Artes',
      modalidade: 'Segunda licenciatura',
      categoria: 'segunda_graduacao',
      carga_horaria: 1320,
      area: 'Artes',
      ativo: true
    },
    {
      nome: 'Física',
      modalidade: 'Segunda licenciatura',
      categoria: 'segunda_graduacao',
      carga_horaria: 1320,
      area: 'Ciências Exatas',
      ativo: true
    },
    {
      nome: 'Química',
      modalidade: 'Segunda licenciatura',
      categoria: 'segunda_graduacao',
      carga_horaria: 1320,
      area: 'Ciências Exatas',
      ativo: true
    },
    {
      nome: 'Música',
      modalidade: 'Segunda licenciatura',
      categoria: 'segunda_graduacao',
      carga_horaria: 1320,
      area: 'Artes',
      ativo: true
    }
  ];

  try {
    let adicionados = 0;
    let jaExistentes = 0;

    for (const curso of cursosSegundaLicenciatura) {
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
          created_at: new Date(),
          updated_at: new Date()
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
    console.log(`📚 Total de cursos processados: ${cursosSegundaLicenciatura.length}`);

    // Verificar total de cursos no sistema
    const totalCursos = await db.select().from(preRegisteredCourses);
    console.log(`🎯 Total de cursos no sistema: ${totalCursos.length}`);

    console.log('\n✅ Operação concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro na operação:', error);
    throw error;
  }
}

// Executar se for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  adicionarCursosSegundaLicenciatura()
    .then(() => {
      console.log('\n🎉 Cursos de Segunda Licenciatura adicionados com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro:', error);
      process.exit(1);
    });
}

export { adicionarCursosSegundaLicenciatura };