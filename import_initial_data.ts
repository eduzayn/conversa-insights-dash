import { db } from './server/db';
import { 
  users, 
  teams, 
  teamMembers, 
  leads, 
  conversations, 
  goals, 
  chats, 
  chatParticipants, 
  messages,
  preRegisteredCourses
} from './shared/schema';
import bcrypt from 'bcryptjs';

async function importInitialData() {
  console.log('🚀 Iniciando importação dos dados iniciais...');

  try {
    // 1. Criar usuários
    console.log('👥 Criando usuários...');
    const hashedPassword = await bcrypt.hash('password', 12);
    
    const insertedUsers = await db.insert(users).values([
      {
        username: 'admin',
        password: hashedPassword,
        email: 'admin@sistema.com',
        name: 'Administrador',
        role: 'admin',
        companyAccount: 'COMERCIAL',
        department: 'Administração',
        isActive: true,
      },
      {
        username: 'maria',
        password: hashedPassword,
        email: 'maria@sistema.com',
        name: 'Maria Silva',
        role: 'agent',
        companyAccount: 'COMERCIAL',
        department: 'Comercial',
        isActive: true,
      },
      {
        username: 'joao',
        password: hashedPassword,
        email: 'joao@sistema.com',
        name: 'João Santos',
        role: 'agent',
        companyAccount: 'SUPORTE',
        department: 'Suporte Técnico',
        isActive: true,
      },
      {
        username: 'ana',
        password: hashedPassword,
        email: 'ana@sistema.com',
        name: 'Ana Costa',
        role: 'agent',
        companyAccount: 'COMERCIAL',
        department: 'Relacionamento',
        isActive: true,
      }
    ]).returning();

    console.log(`✅ ${insertedUsers.length} usuários criados`);

    // 2. Criar equipes
    console.log('🏢 Criando equipes...');
    const insertedTeams = await db.insert(teams).values([
      {
        name: 'Atendimento',
        description: 'Equipe de atendimento ao cliente',
        icon: 'Users',
        isActive: true,
      },
      {
        name: 'Vendas',
        description: 'Equipe de vendas e captação',
        icon: 'Target',
        isActive: true,
      },
      {
        name: 'Suporte Técnico',
        description: 'Equipe de suporte técnico',
        icon: 'Settings',
        isActive: true,
      },
      {
        name: 'Relacionamento',
        description: 'Equipe de relacionamento com cliente',
        icon: 'Heart',
        isActive: true,
      }
    ]).returning();

    console.log(`✅ ${insertedTeams.length} equipes criadas`);

    // 3. Adicionar membros às equipes
    console.log('👨‍👩‍👧‍👦 Adicionando membros às equipes...');
    await db.insert(teamMembers).values([
      { teamId: insertedTeams[0].id, userId: insertedUsers[1].id, role: 'member' }, // Maria -> Atendimento
      { teamId: insertedTeams[1].id, userId: insertedUsers[1].id, role: 'leader' }, // Maria -> Vendas (líder)
      { teamId: insertedTeams[2].id, userId: insertedUsers[2].id, role: 'leader' }, // João -> Suporte (líder)
      { teamId: insertedTeams[3].id, userId: insertedUsers[3].id, role: 'leader' }, // Ana -> Relacionamento (líder)
    ]);

    // 4. Criar leads
    console.log('🎯 Criando leads...');
    const insertedLeads = await db.insert(leads).values([
      {
        name: 'Carlos Oliveira',
        email: 'carlos@email.com',
        phone: '(11) 99999-1111',
        course: 'Pós-graduação em Gestão Escolar',
        source: 'Facebook',
        status: 'novo',
        assignedTo: insertedUsers[1].id,
        teamId: insertedTeams[1].id,
        companyAccount: 'COMERCIAL',
        notes: 'Interessado em iniciar em fevereiro',
      },
      {
        name: 'Fernanda Lima',
        email: 'fernanda@email.com',
        phone: '(21) 88888-2222',
        course: 'Segunda Licenciatura em Matemática',
        source: 'Google Ads',
        status: 'contatado',
        assignedTo: insertedUsers[1].id,
        teamId: insertedTeams[1].id,
        companyAccount: 'COMERCIAL',
        notes: 'Retornar contato na próxima semana',
      },
      {
        name: 'Roberto Silva',
        email: 'roberto@email.com',
        phone: '(31) 77777-3333',
        course: 'Formação Pedagógica',
        source: 'Indicação',
        status: 'qualificado',
        assignedTo: insertedUsers[3].id,
        teamId: insertedTeams[3].id,
        companyAccount: 'COMERCIAL',
        notes: 'Possui graduação em Engenharia',
      },
      {
        name: 'Julia Santos',
        email: 'julia@email.com',
        phone: '(85) 66666-4444',
        course: 'Pós-graduação em Psicopedagogia',
        source: 'Instagram',
        status: 'proposta',
        assignedTo: insertedUsers[1].id,
        teamId: insertedTeams[1].id,
        companyAccount: 'COMERCIAL',
        notes: 'Proposta enviada, aguardando retorno',
      }
    ]).returning();

    console.log(`✅ ${insertedLeads.length} leads criados`);

    // 5. Criar conversas
    console.log('💬 Criando conversas...');
    const insertedConversations = await db.insert(conversations).values([
      {
        leadId: insertedLeads[0].id,
        attendantId: insertedUsers[1].id,
        status: 'em_andamento',
        customerName: 'Carlos Oliveira',
        customerPhone: '(11) 99999-1111',
      },
      {
        leadId: insertedLeads[1].id,
        attendantId: insertedUsers[1].id,
        status: 'novo',
        customerName: 'Fernanda Lima',
        customerPhone: '(21) 88888-2222',
      },
      {
        leadId: insertedLeads[2].id,
        attendantId: insertedUsers[3].id,
        status: 'em_andamento',
        customerName: 'Roberto Silva',
        customerPhone: '(31) 77777-3333',
      },
      {
        leadId: insertedLeads[3].id,
        attendantId: insertedUsers[1].id,
        status: 'finalizado',
        customerName: 'Julia Santos',
        customerPhone: '(85) 66666-4444',
        resultado: 'venda_ganha',
      }
    ]).returning();

    console.log(`✅ ${insertedConversations.length} conversas criadas`);

    // 6. Criar metas
    console.log('🎯 Criando metas...');
    const insertedGoals = await db.insert(goals).values([
      {
        title: 'Atendimentos Diários',
        description: 'Meta de atendimentos por dia',
        type: 'individual',
        indicator: 'atendimentos',
        target: 10,
        period: 'daily',
        userId: insertedUsers[1].id,
        reward: 50,
        isActive: true,
      },
      {
        title: 'Vendas Mensais',
        description: 'Meta de vendas da equipe por mês',
        type: 'team',
        indicator: 'vendas',
        target: 30,
        period: 'monthly',
        teamId: insertedTeams[1].id,
        reward: 500,
        isActive: true,
      },
      {
        title: 'Resoluções Semanais',
        description: 'Meta de resoluções de suporte por semana',
        type: 'individual',
        indicator: 'resolucoes',
        target: 25,
        period: 'weekly',
        userId: insertedUsers[2].id,
        reward: 100,
        isActive: true,
      },
      {
        title: 'Satisfação do Cliente',
        description: 'Meta de satisfação mensal',
        type: 'team',
        indicator: 'satisfacao',
        target: 95,
        period: 'monthly',
        teamId: insertedTeams[3].id,
        reward: 300,
        isActive: true,
      }
    ]).returning();

    console.log(`✅ ${insertedGoals.length} metas criadas`);

    // 7. Criar chats internos
    console.log('💬 Criando chats internos...');
    const insertedChats = await db.insert(chats).values([
      {
        name: 'Geral',
        type: 'general',
        createdBy: insertedUsers[0].id,
        isActive: true,
      },
      {
        name: 'Equipe Vendas',
        type: 'team',
        teamId: insertedTeams[1].id,
        createdBy: insertedUsers[1].id,
        isActive: true,
      },
      {
        name: 'Equipe Suporte',
        type: 'team',
        teamId: insertedTeams[2].id,
        createdBy: insertedUsers[2].id,
        isActive: true,
      },
      {
        name: 'Relacionamento',
        type: 'team',
        teamId: insertedTeams[3].id,
        createdBy: insertedUsers[3].id,
        isActive: true,
      }
    ]).returning();

    console.log(`✅ ${insertedChats.length} chats criados`);

    // 8. Adicionar participantes aos chats
    console.log('👥 Adicionando participantes aos chats...');
    await db.insert(chatParticipants).values([
      // Chat Geral - todos os usuários
      { chatId: insertedChats[0].id, userId: insertedUsers[0].id },
      { chatId: insertedChats[0].id, userId: insertedUsers[1].id },
      { chatId: insertedChats[0].id, userId: insertedUsers[2].id },
      { chatId: insertedChats[0].id, userId: insertedUsers[3].id },
      // Chat Vendas
      { chatId: insertedChats[1].id, userId: insertedUsers[1].id },
      { chatId: insertedChats[1].id, userId: insertedUsers[0].id },
      // Chat Suporte
      { chatId: insertedChats[2].id, userId: insertedUsers[2].id },
      { chatId: insertedChats[2].id, userId: insertedUsers[0].id },
      // Chat Relacionamento
      { chatId: insertedChats[3].id, userId: insertedUsers[3].id },
      { chatId: insertedChats[3].id, userId: insertedUsers[0].id },
    ]);

    // 9. Criar algumas mensagens de exemplo
    console.log('📝 Criando mensagens de exemplo...');
    await db.insert(messages).values([
      {
        chatId: insertedChats[0].id,
        senderId: insertedUsers[0].id,
        content: 'Bem-vindos ao sistema! 🎉',
        type: 'text',
      },
      {
        chatId: insertedChats[1].id,
        senderId: insertedUsers[1].id,
        content: 'Vamos focar nas metas deste mês!',
        type: 'text',
      },
      {
        chatId: insertedChats[2].id,
        senderId: insertedUsers[2].id,
        content: 'Lembrem-se de atualizar os tickets no sistema',
        type: 'text',
      },
    ]);

    console.log('✅ Dados básicos importados com sucesso!');

    // 10. Verificar se há cursos para importar
    console.log('📚 Verificando cursos pré-cadastrados...');
    
    // Criar alguns cursos básicos de exemplo
    await db.insert(preRegisteredCourses).values([
      {
        nome: 'Pós-graduação em Gestão Escolar',
        modalidade: 'Pós-graduação',
        categoria: 'pos_graduacao',
        cargaHoraria: 360,
        area: 'Gestão',
        ativo: true,
      },
      {
        nome: 'Segunda Licenciatura em Matemática',
        modalidade: 'Segunda licenciatura',
        categoria: 'segunda_graduacao',
        cargaHoraria: 1320,
        area: 'Ciências Exatas',
        ativo: true,
      },
      {
        nome: 'Formação Pedagógica em História',
        modalidade: 'Formação Pedagógica',
        categoria: 'segunda_graduacao',
        cargaHoraria: 1320,
        area: 'Ciências Humanas',
        ativo: true,
      },
      {
        nome: 'Pós-graduação em Psicopedagogia',
        modalidade: 'Pós-graduação',
        categoria: 'pos_graduacao',
        cargaHoraria: 360,
        area: 'Saúde Mental',
        ativo: true,
      },
      {
        nome: 'Capacitação em Libras',
        modalidade: 'Formação Livre',
        categoria: 'formacao_livre',
        cargaHoraria: 120,
        area: 'Educação Especial',
        ativo: true,
      }
    ]);

    console.log('✅ Cursos básicos criados');

    // Verificação final
    const userCount = await db.select().from(users);
    const teamCount = await db.select().from(teams);
    const leadCount = await db.select().from(leads);
    const conversationCount = await db.select().from(conversations);
    const goalCount = await db.select().from(goals);
    const courseCount = await db.select().from(preRegisteredCourses);

    console.log('\n📊 RESUMO DA IMPORTAÇÃO:');
    console.log(`👥 Usuários: ${userCount.length}`);
    console.log(`🏢 Equipes: ${teamCount.length}`);
    console.log(`🎯 Leads: ${leadCount.length}`);
    console.log(`💬 Conversas: ${conversationCount.length}`);
    console.log(`🎯 Metas: ${goalCount.length}`);
    console.log(`📚 Cursos: ${courseCount.length}`);

    console.log('\n🎉 Importação concluída com sucesso!');
    console.log('🔑 Credenciais de acesso:');
    console.log('   Username: admin');
    console.log('   Password: password');

  } catch (error) {
    console.error('❌ Erro durante a importação:', error);
    throw error;
  }
}

// Executar se chamado diretamente
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  importInitialData()
    .then(() => {
      console.log('✅ Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro na execução:', error);
      process.exit(1);
    });
}

export { importInitialData };