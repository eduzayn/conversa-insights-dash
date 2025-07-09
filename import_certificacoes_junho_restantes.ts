import { db } from './server/db';
import { certifications } from './shared/schema';
import { sql } from 'drizzle-orm';

// Certificações que ainda não foram importadas do arquivo de junho
const certificacoesRestantes = [
  {
    inicio: "Mediana",
    aluno: "Divino Cesario da Silva",
    cpf: "045.188.836-75",
    modalidade: "Segunda licenciatura",
    curso: "Pedagogia",
    financeiro: "Inicio: 14/05/2020 Situação: Quitado",
    documentacao: "Não Localizado",
    plataforma: "Não Localizado",
    tutoria: "Não localizado",
    observacao: "Curso expirado em 14/09/2021",
    status: "concluido",
    cargaHoraria: "1600"
  },
  {
    inicio: "Mediana",
    aluno: "Renata Moreira Goulart da Silveira Guerra",
    cpf: "574.058.837-53",
    modalidade: "Segunda licenciatura",
    curso: "Música",
    financeiro: "Inicio: 22/12/2023 Situação: Quitada",
    documentacao: "Incompleto",
    plataforma: "Aprovado em todas disciplinas",
    tutoria: "Aprovada",
    observacao: "Expira em 22/04/2025",
    status: "concluido",
    cargaHoraria: "1600"
  },
  {
    inicio: "Mediana",
    aluno: "João Pedro Amorim de Oliveira Araújo",
    cpf: "114.501.706-17",
    modalidade: "Formação pedagógica",
    curso: "Matemática",
    financeiro: "Inicio: 14/02/2023 Situação: Quitado",
    documentacao: "Entregue e Deferida",
    plataforma: "Resta concluir 01 disciplina",
    tutoria: "PPI ok, falta enviar a PPII",
    observacao: "Contratou extensão: 20/05/2025 - 20/06/2025",
    status: "em_andamento",
    cargaHoraria: "1000"
  },
  {
    inicio: "Mediana",
    aluno: "Ruana Beth de Almeida",
    cpf: "129.821.847-02",
    modalidade: "Pós-graduação",
    curso: "Atendimento Educacional Especializado",
    financeiro: "Inicio: 12/06/2024 Situação: Quitada",
    documentacao: "Entregue e Deferida",
    plataforma: "Aprovado em todas disciplinas",
    tutoria: "Não exige",
    observacao: "Expira em 12/10/2025",
    status: "concluido",
    cargaHoraria: "360"
  },
  {
    inicio: "Mediana",
    aluno: "Giancarlo Lucena dos Santos",
    cpf: "659.791.094-05",
    modalidade: "Pós-graduação",
    curso: "Ensino de Geografia",
    financeiro: "Brinde, Inicio: 10/01/2024 Situação: Quitada",
    documentacao: "Incompleto",
    plataforma: "Resta concluir 09 disciplinas",
    tutoria: "Não exige",
    observacao: "Expira em 06/06/2025",
    status: "em_andamento",
    cargaHoraria: "360"
  },
  {
    inicio: "Mediana",
    aluno: "Thiago Alexandre Gomes Fávaris",
    cpf: "057.885.887-82",
    modalidade: "Formação pedagógica",
    curso: "Letras - Português e Espanhol",
    financeiro: "Iniciou em: 14/02/2024 Situação: Quitado",
    documentacao: "Entregue e Deferida",
    plataforma: "Aprovado em todas disciplinas",
    tutoria: "Aprovada",
    observacao: "Expira em 14/06/2025",
    status: "concluido",
    cargaHoraria: "1000"
  },
  {
    inicio: "Mediana",
    aluno: "Saara Vieira de Souza Bastos",
    cpf: "031.927.897-27",
    modalidade: "Pós-graduação",
    curso: "Psicanálise",
    financeiro: "Inicio: 13/09/2023 Situação: Pagou 08 de 16 parcelas",
    documentacao: "Não encaminhou nenhum documento",
    plataforma: "Concluiu apenas 01 disciplina",
    tutoria: "Não exige",
    observacao: "Expirou em 13/01/2025",
    status: "cancelado",
    cargaHoraria: "360"
  },
  {
    inicio: "Mediana",
    aluno: "Dannielle Harumi de Lucena Babachinas",
    cpf: "224.228.538-62",
    modalidade: "Diplomação por competência",
    curso: "Pedagogia para Bacharéis e Tecnólogos",
    financeiro: "Inicio: 23/11/2022 Situação: Quitada",
    documentacao: "Incompleto",
    plataforma: "Resta concluir 01 disciplina",
    tutoria: "Não localizado",
    observacao: "Expirou em 23/03/2024",
    status: "pendente",
    cargaHoraria: "1600"
  }
];

async function importarCertificacoesJunhoRestantes() {
  console.log('📥 Importando certificações restantes de junho...');
  
  let importadas = 0;
  let erros = 0;
  
  for (const cert of certificacoesRestantes) {
    try {
      console.log(`\n📋 Importando: ${cert.aluno} - ${cert.curso}`);
      
      // Verificar se já existe (por CPF + curso)
      const existingCert = await db.select()
        .from(certifications)
        .where(
          // Usando SQL direto para comparação mais precisa
          sql`cpf = ${cert.cpf} AND lower(curso) = lower(${cert.curso})`
        );
      
      if (existingCert.length > 0) {
        console.log(`⚠️  Certificação já existe: ${cert.aluno} - ${cert.curso}`);
        continue;
      }
      
      // Inserir nova certificação
      await db.insert(certifications).values({
        inicio: cert.inicio,
        aluno: cert.aluno,
        cpf: cert.cpf,
        modalidade: cert.modalidade,
        curso: cert.curso,
        financeiro: cert.financeiro,
        documentacao: cert.documentacao,
        plataforma: cert.plataforma,
        tutoria: cert.tutoria,
        observacao: cert.observacao,
        status: cert.status,
        cargaHoraria: cert.cargaHoraria,
        categoria: getCategoria(cert.modalidade),
        subcategoria: getSubcategoria(cert.modalidade, cert.curso)
      });
      
      importadas++;
      console.log(`✅ Importada: ${cert.aluno} - ${cert.curso}`);
      
    } catch (error) {
      erros++;
      console.error(`❌ Erro ao importar ${cert.aluno} - ${cert.curso}:`, error);
    }
  }
  
  console.log(`\n📊 RESULTADO DA IMPORTAÇÃO:`);
  console.log(`✅ Importadas: ${importadas}`);
  console.log(`❌ Erros: ${erros}`);
  console.log(`📋 Total processadas: ${certificacoesRestantes.length}`);
}

function getCategoria(modalidade: string): string {
  switch (modalidade.toLowerCase()) {
    case 'segunda licenciatura':
      return 'segunda';
    case 'formação pedagógica':
      return 'formacao_pedagogica';
    case 'pós-graduação':
      return 'pos_graduacao';
    case 'formação livre':
      return 'formacao_livre';
    case 'diplomação por competência':
      return 'diplomacao';
    case 'eja':
      return 'eja';
    default:
      return 'outras';
  }
}

function getSubcategoria(modalidade: string, curso: string): string {
  if (modalidade.toLowerCase() === 'segunda licenciatura') {
    return 'segunda_licenciatura';
  }
  if (modalidade.toLowerCase() === 'formação pedagógica') {
    return 'formacao_pedagogica';
  }
  if (modalidade.toLowerCase() === 'diplomação por competência') {
    return 'pedagogia_bachareis';
  }
  return '';
}

// Executar se for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  importarCertificacoesJunhoRestantes()
    .then(() => {
      console.log('\n✅ Importação concluída!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro na importação:', error);
      process.exit(1);
    });
}

export { importarCertificacoesJunhoRestantes };