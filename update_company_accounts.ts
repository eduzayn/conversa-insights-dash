import { db } from './server/db';
import { conversations } from './shared/schema';
import { eq, isNull } from 'drizzle-orm';

async function updateCompanyAccounts() {
  console.log('Atualizando campo companyAccount nas conversas existentes...');
  
  try {
    // Buscar todas as conversas que não têm companyAccount definido
    const conversationsToUpdate = await db
      .select()
      .from(conversations)
      .where(isNull(conversations.companyAccount));
    
    console.log(`Encontradas ${conversationsToUpdate.length} conversas para atualizar`);
    
    // Emails da conta COMERCIAL para referência
    const comercialEmails = [
      'yasminvitorino.office@gmail.com',
      'brenodantas28@gmail.com', 
      'jhonatapimenteljgc38@gmail.com'
    ];
    
    let comercialCount = 0;
    let suporteCount = 0;
    
    // Atualizar cada conversa
    for (const conv of conversationsToUpdate) {
      let companyAccount = 'SUPORTE'; // Default
      
      // Se temos o email do manager, verificar se é da conta comercial
      if (conv.botconversaManagerEmail && comercialEmails.includes(conv.botconversaManagerEmail)) {
        companyAccount = 'COMERCIAL';
        comercialCount++;
      } else {
        suporteCount++;
      }
      
      // Atualizar a conversa
      await db
        .update(conversations)
        .set({ companyAccount })
        .where(eq(conversations.id, conv.id));
      
      console.log(`Conversa ${conv.id} atualizada para ${companyAccount}`);
    }
    
    console.log(`✅ Atualização concluída:`);
    console.log(`   - ${comercialCount} conversas marcadas como COMERCIAL`);
    console.log(`   - ${suporteCount} conversas marcadas como SUPORTE`);
    
  } catch (error) {
    console.error('Erro ao atualizar conversas:', error);
  }
}

// Executar o script
updateCompanyAccounts();