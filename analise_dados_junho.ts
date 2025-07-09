import { db } from './server/db';
import { certifications } from './shared/schema';

// Dados extraídos do PDF fornecido pelo usuário
const dadosJunho = [
  {
    aluno: "Felipe Nazário da Silva",
    cpf: "074.168.709-76",
    modalidade: "Segunda Licenciatura",
    curso: "Música",
    status: "Análise Concluída"
  },
  {
    aluno: "Hellane de Sena Oliveira",
    cpf: "099.663.967-56",
    modalidade: "Segunda Licenciatura",
    curso: "Pedagogia",
    status: "Análise Concluída, Falta Documentação"
  },
  {
    aluno: "Divino Cesario da Silva",
    cpf: "045.188.836-75",
    modalidade: "Segunda Licenciatura",
    curso: "Pedagogia",
    status: "Análise Concluída"
  },
  {
    aluno: "Renata Moreira Goulart da Silveira Guerra",
    cpf: "574.058.837-53",
    modalidade: "Segunda Licenciatura",
    curso: "Música",
    status: "Análise Concluída"
  },
  {
    aluno: "Vinicius Barros Noman",
    cpf: "126.977.116-78",
    modalidade: "EJA",
    curso: "EJA",
    status: "Análise Concluída"
  },
  {
    aluno: "Yana Valena Fernandes Nicácio",
    cpf: "031.762.122-08",
    modalidade: "Pós-Graduação",
    curso: "Ensino de Geografia",
    status: "Análise Concluída"
  },
  {
    aluno: "João Pedro Amorim de Oliveira Araújo",
    cpf: "114.501.706-17",
    modalidade: "Formação Pedagógica",
    curso: "Matemática",
    status: "Análise Concluída"
  },
  {
    aluno: "Jefferson da Costa Rato",
    cpf: "262.038.008-13",
    modalidade: "Formação Pedagógica",
    curso: "Educação Física",
    status: "Análise Concluída"
  },
  {
    aluno: "Cintia Carla Natale Purisco Alves",
    cpf: "320.967.148-69",
    modalidade: "Formação Pedagógica",
    curso: "Matemática",
    status: "Análise Concluída"
  },
  {
    aluno: "Cintia Carla Natale Purisco Alves",
    cpf: "320.967.148-69",
    modalidade: "Formação Pedagógica",
    curso: "História",
    status: "Análise Concluída"
  },
  {
    aluno: "Rafaela Macedo de Araújo",
    cpf: "015.078.382-55",
    modalidade: "Pós-Graduação",
    curso: "Neuropsicologia Clínica",
    status: "Análise Concluída"
  },
  {
    aluno: "Gineide Barbosa dos Santos",
    cpf: "045.791.717-21",
    modalidade: "Formação Livre",
    curso: "Psicanálise",
    status: "Análise Concluída"
  },
  {
    aluno: "Lais Pinheiro Assumpção",
    cpf: "345.237.068-24",
    modalidade: "Pós-Graduação",
    curso: "Psicologia Educacional",
    status: "Análise Concluída"
  },
  {
    aluno: "Flávio Luiz Souza dos Santos",
    cpf: "141.502.267-41",
    modalidade: "Segunda Licenciatura",
    curso: "Música",
    status: "Análise Concluída"
  },
  {
    aluno: "Márcia Pires de Almeida Santos",
    cpf: "010.391.961-95",
    modalidade: "Segunda Licenciatura",
    curso: "Pedagogia",
    status: "Análise Concluída"
  },
  {
    aluno: "Ruana Beth de Almeida",
    cpf: "129.821.847-02",
    modalidade: "Pós-Graduação",
    curso: "Atendimento Educacional Especializado",
    status: "Análise Concluída"
  },
  {
    aluno: "Sonia Izabel Forcelli",
    cpf: "089.651.148-02",
    modalidade: "Formação Pedagógica",
    curso: "Música",
    status: "Análise Concluída"
  },
  {
    aluno: "Giancarlo Lucena dos Santos",
    cpf: "659.791.094-04",
    modalidade: "Formação Pedagógica",
    curso: "Geografia",
    status: "Análise Concluída"
  },
  {
    aluno: "Giancarlo Lucena dos Santos",
    cpf: "659.791.094-05",
    modalidade: "Pós-Graduação",
    curso: "Ensino de Geografia",
    status: "Análise Concluída"
  },
  {
    aluno: "Graziele Damaceno de Azevedo",
    cpf: "056.223.167-66",
    modalidade: "Formação Livre",
    curso: "Psicanálise",
    status: "Análise Concluída"
  },
  {
    aluno: "Bianca Clemencia Teixeira da Silva de Freitas",
    cpf: "056.203.607-50",
    modalidade: "Segunda Licenciatura",
    curso: "Pedagogia",
    status: "Análise Concluída"
  },
  {
    aluno: "Gilmar Rodrigues",
    cpf: "039.985.886-55",
    modalidade: "Pós-Graduação",
    curso: "Neuropsicanálise Clínica",
    status: "Análise Concluída"
  },
  {
    aluno: "Gilmar Rodrigues",
    cpf: "039.985.886-55",
    modalidade: "Pós-Graduação",
    curso: "Psicanálise",
    status: "Análise Concluída"
  },
  {
    aluno: "Renata Vilhena Lisboa de Almeida",
    cpf: "004.045.392-89",
    modalidade: "Formação Livre",
    curso: "Sexologia",
    status: "Análise Concluída"
  },
  {
    aluno: "Thiago Alexandre Gomes Fávaris",
    cpf: "057.885.887-82",
    modalidade: "Formação Pedagógica",
    curso: "Letras– Português e Espanhol",
    status: "Análise Concluída"
  },
  {
    aluno: "Janaína Marchioretto Mella",
    cpf: "004.912.910-43",
    modalidade: "Pós-Graduação",
    curso: "Arteterapia",
    status: "Análise Concluída"
  },
  {
    aluno: "Saara Vieira de Souza Bastos",
    cpf: "031.927.897-27",
    modalidade: "Pós-Graduação",
    curso: "Psicanálise",
    status: "Análise Concluída"
  },
  {
    aluno: "Dannielle Harumi de Lucena Babachinas",
    cpf: "224.228.538-62",
    modalidade: "Diplomação por Competência",
    curso: "Pedagogia para Bacharéis e Tecnólogos",
    status: "Análise Concluída"
  }
];

async function analisarDadosJunho() {
  console.log('🔍 Analisando dados de junho contra o banco de dados...');
  
  // Buscando todas as certificações existentes
  const existingCertifications = await db.select().from(certifications);
  console.log(`💾 Total de certificações no banco: ${existingCertifications.length}`);
  
  // Criando mapas para busca rápida
  const existingCPFs = new Set(existingCertifications.map(cert => cert.cpf));
  const existingCombos = new Set(existingCertifications.map(cert => `${cert.cpf}-${cert.curso}`));
  
  console.log(`📋 Total de registros no arquivo de junho: ${dadosJunho.length}`);
  
  // Analisando cada registro
  let jaImportadas = 0;
  let naoImportadas = 0;
  const naoImportadasDetalhes = [];
  
  for (const registro of dadosJunho) {
    const comboKey = `${registro.cpf}-${registro.curso}`;
    const jaImportado = existingCombos.has(comboKey);
    
    if (jaImportado) {
      jaImportadas++;
    } else {
      naoImportadas++;
      naoImportadasDetalhes.push(registro);
    }
  }
  
  // Relatório
  console.log('\n📊 RELATÓRIO DE ANÁLISE:');
  console.log(`✅ Já importadas: ${jaImportadas}`);
  console.log(`❌ Não importadas: ${naoImportadas}`);
  console.log(`📋 Total analisadas: ${dadosJunho.length}`);
  
  if (naoImportadasDetalhes.length > 0) {
    console.log('\n📋 CERTIFICAÇÕES NÃO IMPORTADAS:');
    naoImportadasDetalhes.forEach((cert, index) => {
      console.log(`\n${index + 1}. ${cert.aluno}`);
      console.log(`   CPF: ${cert.cpf}`);
      console.log(`   Modalidade: ${cert.modalidade}`);
      console.log(`   Curso: ${cert.curso}`);
      console.log(`   Status: ${cert.status}`);
    });
    
    // Também verificar se o CPF existe mas com curso diferente
    console.log('\n🔍 VERIFICAÇÃO DE CPFs EXISTENTES:');
    for (const cert of naoImportadasDetalhes) {
      if (existingCPFs.has(cert.cpf)) {
        const existingCerts = existingCertifications.filter(existing => existing.cpf === cert.cpf);
        console.log(`\n⚠️  CPF ${cert.cpf} (${cert.aluno}) já existe no sistema com outro(s) curso(s):`);
        existingCerts.forEach(existing => {
          console.log(`   - ${existing.curso} (${existing.modalidade})`);
        });
      }
    }
  }
  
  // Estatísticas por modalidade
  console.log('\n📈 ESTATÍSTICAS POR MODALIDADE:');
  const modalidadeStats = {};
  
  for (const registro of dadosJunho) {
    if (!modalidadeStats[registro.modalidade]) {
      modalidadeStats[registro.modalidade] = { total: 0, importadas: 0 };
    }
    modalidadeStats[registro.modalidade].total++;
    
    const comboKey = `${registro.cpf}-${registro.curso}`;
    if (existingCombos.has(comboKey)) {
      modalidadeStats[registro.modalidade].importadas++;
    }
  }
  
  for (const [modalidade, stats] of Object.entries(modalidadeStats)) {
    console.log(`${modalidade}: ${stats.importadas}/${stats.total} importadas`);
  }
}

// Executar se for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  analisarDadosJunho()
    .then(() => {
      console.log('\n✅ Análise concluída!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro na análise:', error);
      process.exit(1);
    });
}

export { analisarDadosJunho };