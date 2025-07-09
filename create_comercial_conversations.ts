import { db } from './server/db';
import { conversations, leads } from './shared/schema';
import { eq } from 'drizzle-orm';

async function createComercialConversations() {
  console.log('Criando conversas da conta COMERCIAL para teste...');
  
  try {
    // Criar alguns leads para conversas comerciais
    const comercialLeads = [
      {
        name: 'Maria Silva',
        phone: '+55 31 98765-4321',
        email: 'maria.silva@email.com',
        course: 'Pós-graduação em Gestão',
        source: 'BotConversa COMERCIAL - Pós-graduação',
        status: 'interessado',
        companyAccount: 'COMERCIAL',
        teamId: 2 // Vendas
      },
      {
        name: 'João Santos',
        phone: '+55 11 99876-5432',
        email: 'joao.santos@email.com',
        course: 'MBA em Marketing',
        source: 'BotConversa COMERCIAL - MBA',
        status: 'proposta',
        companyAccount: 'COMERCIAL',
        teamId: 2 // Vendas
      },
      {
        name: 'Ana Costa',
        phone: '+55 21 98765-1234',
        email: 'ana.costa@email.com',
        course: 'Especialização em RH',
        source: 'BotConversa COMERCIAL - Especialização',
        status: 'novo',
        companyAccount: 'COMERCIAL',
        teamId: 2 // Vendas
      }
    ];
    
    // Inserir leads comerciais
    const insertedLeads = [];
    for (const leadData of comercialLeads) {
      const [lead] = await db
        .insert(leads)
        .values(leadData)
        .returning();
      insertedLeads.push(lead);
      console.log(`Lead comercial criado: ${lead.name}`);
    }
    
    // Criar conversas para esses leads
    const comercialConversations = [
      {
        leadId: insertedLeads[0].id,
        attendantId: 2, // Maria
        status: 'active',
        customerName: 'Maria Silva',
        customerPhone: '+55 31 98765-4321',
        companyAccount: 'COMERCIAL',
        botconversaManagerId: 1,
        botconversaManagerName: 'Yasmin Vitorino',
        botconversaManagerEmail: 'yasminvitorino.office@gmail.com'
      },
      {
        leadId: insertedLeads[1].id,
        attendantId: 3, // João
        status: 'active',
        customerName: 'João Santos',
        customerPhone: '+55 11 99876-5432',
        companyAccount: 'COMERCIAL',
        botconversaManagerId: 2,
        botconversaManagerName: 'Breno Dantas',
        botconversaManagerEmail: 'brenodantas28@gmail.com'
      },
      {
        leadId: insertedLeads[2].id,
        attendantId: 4, // Ana
        status: 'pending',
        customerName: 'Ana Costa',
        customerPhone: '+55 21 98765-1234',
        companyAccount: 'COMERCIAL',
        botconversaManagerId: 3,
        botconversaManagerName: 'Jhonata Pimentel',
        botconversaManagerEmail: 'jhonatapimenteljgc38@gmail.com'
      }
    ];
    
    // Inserir conversas comerciais
    for (const convData of comercialConversations) {
      const [conversation] = await db
        .insert(conversations)
        .values(convData)
        .returning();
      console.log(`Conversa comercial criada: ${conversation.customerName} (${conversation.companyAccount})`);
    }
    
    console.log(`✅ Criação concluída:`);
    console.log(`   - ${insertedLeads.length} leads comerciais criados`);
    console.log(`   - ${comercialConversations.length} conversas comerciais criadas`);
    
  } catch (error) {
    console.error('Erro ao criar conversas comerciais:', error);
  }
}

// Executar o script
createComercialConversations();