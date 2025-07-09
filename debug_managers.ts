import { BotConversaService } from './server/services/botconversa.js';

async function debugManagers() {
  const service = new BotConversaService();
  
  console.log('=== TESTANDO DETECÇÃO DE MANAGERS ===\n');
  
  // Buscar managers das duas contas
  const supporteManagers = await service.getManagers('SUPORTE');
  const comercialManagers = await service.getManagers('COMERCIAL');
  
  console.log('MANAGERS SUPORTE:', supporteManagers.length);
  supporteManagers.forEach(m => {
    console.log(`- ${m.full_name} (${m.email}) - ID: ${m.id} - assign_chat: ${m.assign_chat}`);
  });
  
  console.log('\nMANAGERS COMERCIAL:', comercialManagers.length);
  comercialManagers.forEach(m => {
    console.log(`- ${m.full_name} (${m.email}) - ID: ${m.id} - assign_chat: ${m.assign_chat}`);
  });
  
  // Buscar subscribers e verificar se algum tem manager atribuído
  const supporteSubscribers = await service.getSubscribers('SUPORTE');
  const comercialSubscribers = await service.getSubscribers('COMERCIAL');
  
  console.log('\n=== VERIFICANDO SUBSCRIBERS ===');
  console.log('SUPORTE - Exemplo de subscriber:', JSON.stringify(supporteSubscribers[0] || {}, null, 2));
  console.log('COMERCIAL - Exemplo de subscriber:', JSON.stringify(comercialSubscribers[0] || {}, null, 2));
  
  // Testar detecção de manager
  if (supporteSubscribers.length > 0) {
    const detectAssignedManager = (service as any).detectAssignedManager.bind(service);
    const testManager = await detectAssignedManager(supporteSubscribers[0], 'SUPORTE');
    console.log('\nTESTE DETECÇÃO SUPORTE - Manager detectado:', testManager);
  }
  
  if (comercialSubscribers.length > 0) {
    const detectAssignedManager = (service as any).detectAssignedManager.bind(service);
    const testManager = await detectAssignedManager(comercialSubscribers[0], 'COMERCIAL');
    console.log('\nTESTE DETECÇÃO COMERCIAL - Manager detectado:', testManager);
  }
  
  console.log('\n=== FIM DO DEBUG ===');
}

debugManagers().catch(console.error);