import { db } from "./server/db";
import { asaasPayments } from "./shared/schema";

async function createTestPayments() {
  try {
    console.log("Criando dados de teste para cobranças...");

    const testPayments = [
      {
        asaasId: "pay_test_001",
        customerId: "cus_001",
        value: 15000, // R$ 150,00 em centavos
        description: "Mensalidade Curso de Pedagogia",
        billingType: "PIX",
        status: "RECEIVED",
        dueDate: new Date("2025-01-15"),
        dateCreated: new Date("2025-01-01"),
        paymentDate: new Date("2025-01-14"),
        customerName: "Maria Silva",
        customerEmail: "maria.silva@example.com",
        customerCpfCnpj: "123.456.789-00",
        customerPhone: "(11) 99999-1111",
      },
      {
        asaasId: "pay_test_002",
        customerId: "cus_002",
        value: 25000, // R$ 250,00 em centavos
        description: "Curso de Pós-Graduação",
        billingType: "BOLETO",
        status: "PENDING",
        dueDate: new Date("2025-02-15"),
        dateCreated: new Date("2025-01-15"),
        customerName: "João Santos",
        customerEmail: "joao.santos@example.com",
        customerCpfCnpj: "987.654.321-00",
        customerPhone: "(11) 99999-2222",
      },
      {
        asaasId: "pay_test_003",
        customerId: "cus_003",
        value: 30000, // R$ 300,00 em centavos
        description: "Segunda Licenciatura",
        billingType: "CREDIT_CARD",
        status: "OVERDUE",
        dueDate: new Date("2024-12-15"),
        dateCreated: new Date("2024-12-01"),
        customerName: "Ana Costa",
        customerEmail: "ana.costa@example.com",
        customerCpfCnpj: "456.789.123-00",
        customerPhone: "(11) 99999-3333",
      },
      {
        asaasId: "pay_test_004",
        customerId: "cus_004",
        value: 20000, // R$ 200,00 em centavos
        description: "Curso de Capacitação",
        billingType: "PIX",
        status: "RECEIVED",
        dueDate: new Date("2025-01-20"),
        dateCreated: new Date("2025-01-05"),
        paymentDate: new Date("2025-01-19"),
        customerName: "Carlos Oliveira",
        customerEmail: "carlos.oliveira@example.com",
        customerCpfCnpj: "789.123.456-00",
        customerPhone: "(11) 99999-4444",
      },
      {
        asaasId: "pay_test_005",
        customerId: "cus_005",
        value: 18000, // R$ 180,00 em centavos
        description: "EJA - Ensino Médio",
        billingType: "BOLETO",
        status: "PENDING",
        dueDate: new Date("2025-03-01"),
        dateCreated: new Date("2025-02-01"),
        customerName: "Fernanda Lima",
        customerEmail: "fernanda.lima@example.com",
        customerCpfCnpj: "321.654.987-00",
        customerPhone: "(11) 99999-5555",
      }
    ];

    for (const payment of testPayments) {
      await db.insert(asaasPayments).values({
        ...payment,
        lastSyncAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }).onConflictDoNothing();
    }

    console.log("✅ Dados de teste criados com sucesso!");
    console.log("Total de cobranças: 5");
    console.log("Valor total: R$ 930,00");
    console.log("Valores recebidos: R$ 350,00 (2 cobranças)");
    console.log("Valores pendentes: R$ 430,00 (2 cobranças)");
    console.log("Valores vencidos: R$ 300,00 (1 cobrança)");
    
  } catch (error) {
    console.error("❌ Erro ao criar dados de teste:", error);
  }
}

createTestPayments();