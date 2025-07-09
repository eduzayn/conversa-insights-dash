import { BotConversaService } from './server/services/botconversa.js';

// Teste da função extractCustomerName
const testSubscriber = {
  id: "770223940",
  phone: "+555194322735",
  name: null,
  email: null,
  full_name: "Aline Aline Conceição de Barros de Oliveira",
  first_name: "Aline",
  last_name: "Aline Conceição de Barros de Oliveira",
  custom_fields: {},
  variables: {},
  created_at: "2025-07-07T01:27:09.389785Z",
  updated_at: "2025-07-07T01:27:09.389785Z"
};

console.log('=== TESTE DE EXTRAÇÃO DE NOME ===\n');

// Usar reflexão para acessar método privado
const service = new BotConversaService();
const extractCustomerName = (service as any).extractCustomerName.bind(service);

const extractedName = extractCustomerName(testSubscriber);
console.log('Subscriber teste:', JSON.stringify(testSubscriber, null, 2));
console.log('\nNome extraído:', extractedName);

// Teste com subscriber vazio
const emptySubscriber = {
  id: "769829452",
  phone: "+5516997510930",
  name: null,
  email: null,
  full_name: "",
  first_name: "",
  last_name: "",
  custom_fields: {},
  variables: {},
  created_at: "2025-07-05T17:31:09.727287Z",
  updated_at: "2025-07-05T17:31:09.727287Z"
};

const extractedNameEmpty = extractCustomerName(emptySubscriber);
console.log('\nSubscriber vazio:', JSON.stringify(emptySubscriber, null, 2));
console.log('\nNome extraído:', extractedNameEmpty);

console.log('\n=== FIM DO TESTE ===');