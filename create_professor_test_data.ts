import { db } from "./server/db";
import { users, subjects, professorSubjects } from "./shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function createProfessorTestData() {
  console.log("Criando dados de teste para o Portal do Professor...");

  try {
    // Hash da senha "professor123"
    const hashedPassword = await bcrypt.hash("professor123", 10);

    // Verificar se professor já existe
    let professor = await db
      .select()
      .from(users)
      .where(eq(users.username, "prof.joao"))
      .then(rows => rows[0]);

    if (!professor) {
      // Criar usuário professor
      const [newProfessor] = await db
        .insert(users)
        .values({
          username: "prof.joao",
          password: hashedPassword,
          email: "joao.silva@instituicao.edu.br",
          name: "Prof. João Silva",
          role: "professor",
          department: "Ciência da Computação",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      professor = newProfessor;
      console.log("✓ Professor criado:", professor.name);
    } else {
      console.log("✓ Professor já existe:", professor.name);
    }

    // Criar disciplinas
    const disciplinas = [
      {
        nome: "Algoritmos e Estruturas de Dados I",
        codigo: "AED001",
        descricao: "Introdução aos conceitos fundamentais de algoritmos e estruturas de dados",
        cargaHoraria: 80,
        area: "Ciência da Computação"
      },
      {
        nome: "Programação Orientada a Objetos",
        codigo: "POO001", 
        descricao: "Conceitos e práticas de programação orientada a objetos",
        cargaHoraria: 60,
        area: "Ciência da Computação"
      },
      {
        nome: "Banco de Dados",
        codigo: "BD001",
        descricao: "Fundamentos de sistemas de gerenciamento de banco de dados",
        cargaHoraria: 60,
        area: "Ciência da Computação"
      }
    ];

    for (const disciplinaData of disciplinas) {
      const [disciplina] = await db
        .insert(subjects)
        .values({
          ...disciplinaData,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Associar professor à disciplina
      await db
        .insert(professorSubjects)
        .values({
          professorId: professor.id,
          subjectId: disciplina.id,
          canEdit: true,
          createdAt: new Date(),
        });

      console.log("✓ Disciplina criada e associada:", disciplina.nome);
    }

    console.log("\n🎉 Dados de teste do Portal do Professor criados com sucesso!");
    console.log("\nCredenciais de acesso:");
    console.log("Email: joao.silva@instituicao.edu.br");
    console.log("Senha: professor123");
    console.log("URL: /professor-login");

  } catch (error) {
    console.error("❌ Erro ao criar dados de teste:", error);
  }
}

createProfessorTestData();