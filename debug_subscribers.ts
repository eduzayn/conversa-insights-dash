import { BotConversaService } from './server/services/botconversa.js';

async function debugSubscribers() {
  const service = new BotConversaService();
  
  console.log('=== ANÁLISE DE DADOS DOS SUBSCRIBERS ===\n');
  
  // Testar ambas as contas
  for (const account of ['SUPORTE', 'COMERCIAL'] as const) {
    console.log(`\n📊 CONTA: ${account}`);
    console.log('=' + '='.repeat(30));
    
    try {
      // Buscar subscribers
      const subscribers = await service.getSubscribers(account);
      console.log(`✅ Total de subscribers: ${subscribers.length}`);
      
      if (subscribers.length > 0) {
        // Analisar primeiro subscriber em detalhes
        const firstSubscriber = subscribers[0];
        console.log('\n📋 PRIMEIRO SUBSCRIBER:');
        console.log(`ID: ${firstSubscriber.id}`);
        console.log(`Phone: ${firstSubscriber.phone}`);
        console.log(`Name: ${firstSubscriber.name || 'VAZIO'}`);
        console.log(`Email: ${firstSubscriber.email || 'VAZIO'}`);
        console.log(`Created: ${firstSubscriber.created_at}`);
        console.log(`Updated: ${firstSubscriber.updated_at}`);
        
        // Analisar tags
        if (firstSubscriber.tags && firstSubscriber.tags.length > 0) {
          console.log(`Tags: ${firstSubscriber.tags.join(', ')}`);
        } else {
          console.log('Tags: NENHUMA');
        }
        
        // Analisar campos personalizados
        if (firstSubscriber.custom_fields && Object.keys(firstSubscriber.custom_fields).length > 0) {
          console.log('\n🔧 CAMPOS PERSONALIZADOS:');
          Object.entries(firstSubscriber.custom_fields).forEach(([key, value]) => {
            console.log(`  ${key}: ${value}`);
          });
        } else {
          console.log('\n🔧 CAMPOS PERSONALIZADOS: NENHUM');
        }
        
        // Tentar buscar detalhes específicos do subscriber
        console.log('\n🔍 BUSCANDO DETALHES ESPECÍFICOS...');
        const details = await service.getSubscriberById(firstSubscriber.id, account);
        if (details) {
          console.log('✅ Detalhes específicos encontrados');
          if (details.custom_fields) {
            console.log('🔧 Campos personalizados nos detalhes:');
            Object.entries(details.custom_fields).forEach(([key, value]) => {
              console.log(`  ${key}: ${value}`);
            });
          }
        } else {
          console.log('❌ Não foi possível obter detalhes específicos');
        }
      }
      
      // Estatísticas gerais
      console.log('\n📈 ESTATÍSTICAS:');
      const withNames = subscribers.filter(s => s.name && s.name.trim() !== '').length;
      const withEmails = subscribers.filter(s => s.email && s.email.trim() !== '').length;
      const withCustomFields = subscribers.filter(s => s.custom_fields && Object.keys(s.custom_fields).length > 0).length;
      
      console.log(`  Subscribers com nome: ${withNames}/${subscribers.length} (${Math.round(withNames/subscribers.length*100)}%)`);
      console.log(`  Subscribers com email: ${withEmails}/${subscribers.length} (${Math.round(withEmails/subscribers.length*100)}%)`);
      console.log(`  Subscribers com campos personalizados: ${withCustomFields}/${subscribers.length} (${Math.round(withCustomFields/subscribers.length*100)}%)`);
      
    } catch (error) {
      console.error(`❌ Erro ao analisar ${account}:`, error);
    }
  }
  
  console.log('\n=== FIM DA ANÁLISE ===');
}

debugSubscribers().catch(console.error);