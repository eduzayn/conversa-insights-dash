import { BotConversaService } from './server/services/botconversa';

async function testFiltersData() {
  console.log('=== TESTE ENDPOINT FILTERS-DATA ===\n');
  
  const botConversaService = new BotConversaService();
  
  try {
    // Buscar managers das duas contas
    const [supporteManagers, comercialManagers] = await Promise.all([
      botConversaService.getManagers('SUPORTE'),
      botConversaService.getManagers('COMERCIAL')
    ]);
    
    console.log('MANAGERS SUPORTE:', supporteManagers.length);
    supporteManagers.forEach(m => {
      console.log(`- ${m.full_name} (${m.email})`);
    });
    
    console.log('\nMANAGERS COMERCIAL:', comercialManagers.length);
    comercialManagers.forEach(m => {
      console.log(`- ${m.full_name} (${m.email})`);
    });
    
    // Combinar e processar managers
    const allManagers = [...supporteManagers, ...comercialManagers];
    const atendentes = [...new Set(allManagers.map(m => m.full_name))].filter(Boolean).sort();
    
    console.log('\nATENDENTES ÚNICOS:', atendentes.length);
    atendentes.forEach(a => console.log(`- ${a}`));
    
    // Mapear emails para equipes
    const emailToTeam = {
      'cobrancazayn22@gmail.com': 'Cobrança',
      'elainezaynfinanceiro@gmail.com': 'Financeiro', 
      'juliazayn2018@gmail.com': 'Atendimento',
      'miguelmourazayn@gmail.com': 'Atendimento',
      'camilacobrancazayn24@gmail.com': 'Cobrança',
      'ericktrabalhofamiliar@gmail.com': 'Relacionamento',
      'danielatovarzayn@gmail.com': 'Relacionamento',
      'carla-diniz@eduzayn.com.br': 'Atendimento',
      'pedagogico@grupozayneducacional.com.br': 'Pedagógico',
      'kamilledigital23@gmail.com': 'Marketing',
      'amanda_monyck@hotmail.com': 'Suporte',
      'zayn65675@gmail.com': 'Suporte',
      'yasminvitorino.office@gmail.com': 'Comercial',
      'brenodantas28@gmail.com': 'Comercial',
      'jhonatapimenteljgc38@gmail.com': 'Comercial'
    };
    
    // Extrair equipes dos managers
    const equipesFromManagers = new Set<string>();
    allManagers.forEach(manager => {
      const equipe = emailToTeam[manager.email] || 'Atendimento';
      equipesFromManagers.add(equipe);
    });
    
    equipesFromManagers.add('Não atribuído');
    const equipes = Array.from(equipesFromManagers).sort();
    
    console.log('\nEQUIPES ENCONTRADAS:', equipes.length);
    equipes.forEach(e => console.log(`- ${e}`));
    
    const result = {
      atendentes: [...atendentes, 'Não atribuído'].sort(),
      equipes: equipes,
      status: ['Em andamento', 'Concluído', 'Pendente'],
      managersData: allManagers.map(m => ({
        id: m.id,
        name: m.full_name,
        email: m.email,
        equipe: emailToTeam[m.email] || 'Atendimento',
        assign_chat: m.assign_chat
      }))
    };
    
    console.log('\nRESULTADO FINAL:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
  }
}

testFiltersData().catch(console.error);