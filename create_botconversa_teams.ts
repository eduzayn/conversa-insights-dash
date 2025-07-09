import { db } from './server/db';
import { teams } from './shared/schema';
import { eq } from 'drizzle-orm';

async function createBotConversaTeams() {
  console.log('🔧 Criando equipes reais do BotConversa...');
  
  // Equipes baseadas nos departamentos reais identificados no BotConversa
  const equipesReais = [
    { name: 'Comercial', description: 'Departamento Comercial - Vendas e prospecção' },
    { name: 'Cobrança', description: 'Departamento de Cobrança - Gestão financeira' },
    { name: 'Tutoria', description: 'Departamento de Tutoria - Suporte acadêmico' },
    { name: 'Secretaria Pós', description: 'Secretaria de Pós-Graduação' },
    { name: 'Secretaria Segunda', description: 'Secretaria de Segunda Licenciatura' },
    { name: 'Documentação', description: 'Departamento de Documentação' },
    { name: 'Análise Certificação', description: 'Departamento de Análise de Certificação' },
    { name: 'Suporte', description: 'Departamento de Suporte Técnico' },
    { name: 'Financeiro', description: 'Departamento Financeiro' }
  ];
  
  let created = 0;
  let existing = 0;
  
  for (const equipe of equipesReais) {
    try {
      // Verificar se a equipe já existe
      const existingTeam = await db.select().from(teams).where(eq(teams.name, equipe.name));
      
      if (existingTeam.length === 0) {
        // Criar nova equipe
        await db.insert(teams).values({
          name: equipe.name,
          description: equipe.description
        });
        console.log(`✅ Equipe criada: ${equipe.name}`);
        created++;
      } else {
        console.log(`⚪ Equipe já existe: ${equipe.name}`);
        existing++;
      }
    } catch (error) {
      console.error(`❌ Erro ao criar equipe ${equipe.name}:`, error);
    }
  }
  
  console.log(`\n📊 Resumo:`);
  console.log(`   - Equipes criadas: ${created}`);
  console.log(`   - Equipes já existentes: ${existing}`);
  console.log(`   - Total de equipes BotConversa: ${equipesReais.length}`);
  
  // Listar todas as equipes no banco
  const allTeams = await db.select().from(teams);
  console.log(`\n📋 Equipes no banco de dados (${allTeams.length} total):`);
  allTeams.forEach(team => {
    console.log(`   - ${team.name} (ID: ${team.id})`);
  });
}

// Executar o script
createBotConversaTeams()
  .then(() => {
    console.log('\n🎉 Script concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro no script:', error);
    process.exit(1);
  });