import * as XLSX from 'xlsx';
import { neon } from '@neondatabase/serverless';

interface DadosCertificacao {
  status: string;
  aluno: string;
  cpf: string;
  dataSolicitacao: string;
  curso: string;
  financeiro: string;
  documentacao: string;
  atividadesPlataforma: string;
  praticasPedagogicas: string;
  dataLiberacao: string;
  observacao: string;
}

// Dados da planilha (extraídos do CSV)
const dadosCSV = `Status,Aluno,CPF,Data Solicitação,Curso,Financeiro,Documentação,Atividades Plataforma,Práticas Pedagógicas ,Data Liberação para/ Certificação,Observação
"Análise Concluída, Aluno certificado",Valéria Coelho dos Santos,401.580.458-90,20/01/2023,Segunda Licenciatura em Educação Especial,"Quitada, iniciou em 10/08/2023 contratou extensão e expira em 28/02/2025.",Entregue e deferida,Aluna finalizou todas as disciplinas,PPs Aprovadas,,Já inserido na planilha acompanhamento
Urgente,Antônio Alberto Prata Teodoro,020.967.886-09,22/01/2024,FORMAÇÃO PEDAGÓGICA EM SOCIOLOGIA - 56M,Iniciou o curso dia 20-07-2024 expira dia 20-07-2025 curso quitado,Entregue e deferida,"Aluno foi aprovado em todas as avaliações, ",PPs Aprovadas,,
Urgente,Antônio Alberto Prata Teodoro,020.967.886-09,22/01/2024,FORMAÇÃO PEDAGÓGICA EM FILOSOFIA - 62M,Iniciou o curso dia 20-07-2024 expira dia 20-07-2025 curso quitado,Entregue e deferida,"Aluno foi aprovado em todas as avaliações, ",PPs Aprovadas,,
Urgente,Antônio Alberto Prata Teodoro,020.967.886-09,22/01/2024,FORMAÇÃO PEDAGÓGICA EM CIÊNCIAS DA RELIGIÃO - 63M,Iniciou o curso dia 20-07-2024 expira dia 20-07-2025 curso quitado,Entregue e deferida,"Aluno foi aprovado em todas as avaliações, ",PPs Aprovadas,,
Urgente,Antônio Alberto Prata Teodoro,020.967.886-09,22/01/2024,FORMAÇÃO PEDAGÓGICA EM GEOGRAFIA - 64M,Iniciou o curso dia 20-07-2024 expira dia 20-07-2025 curso quitado,Entregue e deferida,"Aluno foi aprovado em todas as avaliações, ",PPs Aprovadas,,
Urgente,Antônio Alberto Prata Teodoro,020.967.886-09,22/01/2024,FORMAÇÃO PEDAGÓGICA EM ARTES VISUAIS - 67M,Iniciou o curso dia 20-07-2024 expira dia 20-07-2025 curso quitado,Entregue e deferida,"Aluno foi aprovado em todas as avaliações,",PPs Aprovadas,,
Urgente,Antônio Alberto Prata Teodoro,020.967.886-09,22/01/2024,FORMAÇÃO PEDAGÓGICA EM EDUCAÇÃO FÍSICA - 71M,Iniciou o curso dia 20-07-2024 expira dia 20-07-2025 curso quitado,Entregue e deferida,"Aluno foi aprovado em todas as avaliações,",PPs Aprovadas,,
"Urgente, Aluno certificado",Antônio Alberto Prata Teodoro,020.967.886-09,22/01/2024,PÓS-GRADUAÇÃO EM DIREITO DO TRABALHO E PROCESSUAL TRABALHISTA - 74M,Devido a contratação dos cursos de Formação pedagógica aluna ganhou esta pós de brinde,Entregue e deferida,"Aluno foi aprovado em todas as avaliações,",PPs Aprovadas,,
"Urgente, Análise Concluída",Benedito Garcia Rebouças Filho,010.842.461-80,22/01/2024,Segunda Licenciatura em Pedagogia,Iniciou dia 23/10/2023 e expirou em 21/01/2025 curso quitado,Entregue e deferida,Aluna finalizou todas as disciplinas,PPS aprovadas,,Encaminhado para Miguel 31/1
"Análise Concluída, Processo de certificação",Roberta Liliane Gonçalves,032.132.680-62,22/01/2024,Formação Livre Psicanálise,Iniciou dia 05/05/2023 e expirou em 05/09/2024 curso quitado,Entregue e deferida,Aluna finalizou todas as disciplinas,Não tem no curso,,
Urgente,Patrícia Cláudia Fonseca,032.138.536-58,22/01/2024,PÓS-GRADUAÇÃO EM TERAPIA DE CASAL,,,,Não tem no curso,,
"Análise Concluída, Aluno certificado",Suzana Moura da Silva Torres,595.278.032-68,23/01/2024,Segunda Licenciatura em Pedagogia,,,,,,
Urgente,Cleibe Martins de Souza,100.531.876-01,23/01/2024,FORMAÇÃO PEDAGÓGICA EM EDUCAÇÃO FÍSICA - 2024,Início dia 27/03/2024 e vai expirar 24/07/2025 curso quitado,Documentos incompletos,Aprovado em todas as disciplinas,Pré aprovado(falta regularização dos documentos),,
Urgente,Jonnhy Pierri Oliveira Mota ,574.558.135-20,23/01/2024,Formação Pedagógica em Pedagogia,Início dia 28/09/2023 e expira dia 28/01/2025 falta 3 parcelas para o aluno quitar o curso,Documentos incompletos,Aluno finalizou todas as disciplinas,PPs Aprovadas,,
"Análise Concluída, Aluno certificado",Marco Túlio de Abreu,576.466.946-49,27/01/2024,Segunda Licenciatura em Pedagogia,"Iniciou dia 17/08/2023 e expirou 17/12/2024 curso quitado dividido em 16x de 99,90",Entregue e Deferido - Drive,Aluno finalizou todas as disciplinas,PPs Aprovadas,,Encaminhado para Taís - Acompanha
Mediana,Geni Gomes da Rocha,089.349.486-04,27/01/2024,PÓS-GRADUAÇÃO EM ENSINO RELIGIOSO,,,,Não necessita,,
Urgente,Livia Tavares Silva Cabral,114.129.897-01,27/01/2024,Pedagogia para Bacharéis e Tecnólogos,Início em 23/09/2022 e expirou dia 23/01/2024 quitado no cartão de crédito!,Entregue e Deferido,"Sem acesso a plataforma( Eu creio que seja um erro pois não está dando para acessar o curso da aluna)
",TCC aprovado. ,,
Urgente,Davyson Vieira de Oliveira,107.588.068-84,27/01/2024,Segunda Licenciatura Letras - Inglês,"Início em 27/09/2023 e expirou dia 27/01/2024 curso quitado, aluno contratou extensão por 3 meses expira dia 21/04/2025",Entregue e Deferido,Aluno finalizou todas as disciplinas,"PPS pré aprovada, verificando se precisa de extensão",,
Urgente,Sandra Raquel de Siqueira Costa de Souza,,27/01/2024,Segunda Licenciatura Letras - Inglês,,,,Aguardando analise ,,
"Análise Concluída, Aluno certificado",Marco Túlio de Abreu,576.466.946-49,27/01/2024,Pós-Graduação em Inspeção Escolar,Iniciou dia 15/08/2023 e expirou em 15/12/2024 curso quitado,Entregue e Deferido - DRIVE,Aluno finalizou todas as disciplinas,Não precisa neste curso,,
Urgente,Marines Paifer martins,,21/11/2024,#FPT1-Pedagogia para Bacharéis e Tecnólogos (2022),"Quitada, iniciou em 12/01/2023 e expirou em 12/05/2024",Falta Título de Eleitor,Aluna foi aprovada em todas as disciplinas,Aprovada 06/01,,
Urgente,Thágyne Cristina Lima de Souza Silveira,,29/11/2024,#FPULPI- Formação Pedagógica em Letras – Português e Inglês,"Quitada, iniciou em 05/12/2023 e expirou em 05/04/2024",,Aluna com a plataforma completa,"Pré aprovada, falta enviar documentação.",,
"Análise Concluída, Aluno certificado",Luiz Henrique Soares Fontes,916.441.006-49,02/01/2025,Segunda Licenciatura em Música 1320 Horas,"Um financeiro localizado no asaas, sem descrição porém está quitado",Entregue e deferida,Aluna foi aprovada em todas as disciplinas,Aprovado 12/11/2024,,
"Análise Concluída, Aluno certificado",Marília Selva dos Santos,620.569.994-04,02/01/2025,Segunda Licenciatura em Letras Inglês disciplinas,"Um financeiro localizado no asaas, sem descrição porém está quitado",Entregue e deferida,Aluna foi aprovada em todas as disciplinas,Aprovada 14/01/2025,,Já inserido na planilha acompanhamento
Normal,Bruna Raquel de Oliveira Castello Branco,019.422.911-40,02/01/2025,Segunda Licenciatura em Pedagogia,"Dois financeiros localizados no asaas, um deles sem descrição porém quitado",Entregue e deferida,Aluna foi aprovada em todas as disciplinas,Não enviou o trabalho para correção,,
"Análise Concluída, Aluno certificado",Carlos Cleber Borges Silva,012.442.287-02,02/01/2025,#SLMF - Segunda Licenciatura em Música 1320 Horas,Quitado,Entregue e deferida,Aluno foi aprovado em todas as disciplinas,Aprovado 13/12/2024,Liberado em 13/01/2025,
Normal,Elisangela Maria da Silva,045.485.106-56,02/01/2025,Segunda Licenciatura em Geografia,"Quitado, curso pago no cartão de crédito",Entregue e deferida,Aluna foi aprovada em todas as disciplinas,Aprovada 10/01/2025,,
"Análise Concluída, Aluno certificado",Abrahão Nascimento Dos Santos,814.925.884-15,02/01/2025,Segunda Licenciatura em Música 1320 Horas,"Quitado, contratou extensão e expira em 02/02/2025.",Documentação entregue e deferida,Aluno foi aprovado em todas as disciplinas,Aprovado,Liberado em 07/01/2025,Já inserido na planilha acompanhamento
Mediana,Célio Gomes de Oliveira,,02/01/2025,Formação Livre em Psicanálise,Quitada ,Entregue e deferida ,Aluno foi aprovado em todas as disciplinas,Não exige ,,
Urgente,Rúbia de Souza Silva,,02/01/2025,Segunda Licenciatura em Sociologia,"Quitada, iniciou em 05/07/2024 expira 05/11/2025",Entregue e deferida ,Aluno foi aprovado em todas as disciplinas,Aprovado em 22 de maio de 2025,,
"Análise Concluída, Aluno certificado",Kelly Cristina Rodrigues da Silva,,02/01/2025,Segunda Licenciatura em Pedagogia,Fez um acordo para quitar o curso mais ainda tem duas parcelas para pagar,Entregue e deferida ,Aluna foi aprovada em todas as disciplinas,Aprovada em 02/01/2025,,Acompanha
Urgente,Silvania Corrêa Veloso,,02/01/2025,SEGUNDA LICENCIATURA EM LETRAS PORTUGUÊS/INGLÊS,"Quitada, pagou pelo curso à vista",Entregue e deferida ,Aluna ainda precisa concluir 4 disciplinas,Aprovada em 06/03/2025,,
Urgente,Silvania Corrêa Veloso,,02/01/2025,SEGUNDA LICENCIATURA EM LETRAS PORTUGUÊS - LIBRAS ,"Quitada, pagou pelo curso à vista",Entregue e deferida ,Aprovada em todas as disciplinas,Aprovada em 06/03/2025,,
"Urgente, Análise Concluída",Elizangela Coutinho da Cunha,,02/01/2025,SEGUNDA LICENCIATURA EM EDUCAÇÃO ESPECIAL,Boleto de Quitação no Cartão de crédito em 10 x para o dia 11/12/20224 referente ao curso de Segunda licenciatura em Educação Especial.,Documentação entregue e deferida - Histórico Ensino Superior no Drive,Aluna foi aprovada em todas as disciplinas,Aprovado,,Aluna em processo de certificação na planilha de Já inserido na planilha acompanhamentomento geral 13/2/25 - Adriana
"Análise Concluída, Aluno certificado",Cinthia Ferreira Arcanjo Silva,008.650.371-59,03/01/2025,Segunda Licenciatura Música 1200 Horas,"Um financeiro localizado no asaas, sem descrição porém está quitado",Documentação entregue e deferida,Aluna foi aprovada em todas as disciplinas,Aprovada 02/01/25,,
"Análise Concluída, Aluno certificado",Alexandre Lazarotto Lago,098.787.147-13,03/01/2025,Segunda Licenciatura em Pedagogia,Quitada,Documentação entregue e deferida,Aluno foi aprovado em todas as disciplinas,Aprovado 14/01/25,,
Mediana,Karla Patrícia Menezes Costa,804.899.403-82,03/01/2025,Segunda Licenciatura em Pedagogia,"Um financeiro localizado no asaas, sem descrição porém está quitado",Documentação entregue e deferida,Aluna foi aprovada em todas as disciplinas,Aprovado 03/01/25,,
Normal,Paulo Henrique Antonini,304.864.668-09,03/01/2025, Formação Pedagógica em Música 2022,Quitada,Documentação entregue e deferida,Aluno foi aprovado em todas as disciplinas,Aprovado em 10/03/2025,,
"Análise Concluída, Aluno certificado",Guilherme de Jesus Straccini,431.693.778-25,03/01/2025,Segunda Licenciatura em Música 1320 Horas,Iniciou dia 20/06/2023 expirou dia 20/10/2024 aluno pagou a vista,Documentação entregue e deferida,Aluna foi aprovada em todas as disciplinas,Aprovado 03/01/25,,
"Análise Concluída, Aluno certificado",Rosilaine Aparecida de Asunção,849.599.759-20,03/01/2025, Segunda Licenciatura em Música,Quitada ,Documentação entregue e deferida,Aluna foi aprovada em todas as disciplinas,,,
Mediana,Giovana Cristiane dos Santos Ferreira,051.778.176-01,03/01/2025,"Pós-Graduação em Neuropsicopedagogia Institucional, Clínica e Hospitalar 850h","Quitada, liberada até 13/06/2025",Documentação entregue e deferida,Aluna foi aprovada em todas as disciplinas,Aprovada no estágio,,
Mediana,Giovana Cristiane dos Santos Ferreira,051.778.176-01,03/01/2025,Pós-Graduação em Psicopedagogia Escolar,Aluna contratou o combo de curso dia 11/08/2023 e quitou dia 19/12/2024 expira dia 10/02/2025,Documentação entregue e deferida,Não realizou nenhuma disciplina,Não precisa entregar nenhum trabalho.,,
Mediana,Giovana Cristiane dos Santos Ferreira,051.778.176-01,03/01/2025,Pós-Graduação em Biblioteconomia,Aluna contratou o combo de curso dia 11/08/2023 e quitou dia 19/12/2024 expira dia 10/02/2025,Documentação entregue e deferida,Restam 9 disciplinas para concluir,Não precisa entregar nenhum trabalho.,,
Mediana,Giovana Cristiane dos Santos Ferreira,051.778.176-01,03/01/2025,Pós-Graduação Neurociência e Aprendizagem,Aluna contratou o combo de curso dia 11/08/2023 e quitou dia 19/12/2024 expira dia 10/02/2025,Documentação entregue e deferida,Não concluiu nenhuma disciplina,Não precisa entregar nenhum trabalho.,,
Mediana,Adilson Nei Menezes da Conceicao,,03/01/2025,Formação Pedagógica em Geografia,"Quitada, iniciou em 22/12/2023 e expira em 22/04/2025",*,Aprovado em todas as disciplinas.,Aprovado em 05/02/25 15:34:25,,
Falta Documentação,Adão Lima Felix,030.258.062-06,05/01/2025,Formação Pedagógica em Educação Física,Iniciou em 27/11/2023 e expira 27/03/2025 aluna pagou apenas 4 parcelas na lytex e não consegui encontrar o restante do parcelamento em lugar algum,Solicitado documentação complementar via chat 07/02/2025/ Reforçado dia 14/2,Aprovado em todas as disciplinas.,PPS aprovadas,,
"Falta Documentação, Falta Plataforma",Adão Lima Felix,030.258.062-06,05/01/2025,Pós-Graduação em Nutrição Esportiva,Iniciou em 27/11/2023 e expira 27/03/2025 aluna pagou apenas 4 parcelas na lytex e não consegui encontrar o restante do parcelamento em lugar algum,Solicitado documentação complementar via chat 07/02/2025/ Reforçado dia 14/2,Não fez nenhuma disciplina,Não possui no curso,,
Urgente,Jovanil da Silva Campos,280 271 671 91,05/01/2025,Segunda Licenciatura em Letras.,Aluno quitado iniciou em 25/02/2021 tendo até 25/06/2022. não localizei em nenhuma plataforma.,Solciitado documentação via chat 10/2/2025,,Júnio: pre aprovada PRAZO: 07/07/23,,Solicitado documentações via chat 10/2/25
Urgente,Elizabeth Cristina Sales pereira Ferraz,103.479.896-08,06/01/2025,Pós-graduação em Biblioteconomia,Aluna em dia iniciou curso em 21/12/2024. Expira em 21/04/2026,Documentação entregue e deferida,Aluna foi aprovada em todas as disciplinas,Não precisa entregar nenhum trabalho.,,
Mediana,Edmilson Barbosa Silvano,709.903.957-15 ,06/01/2025,Pós-Graduação em Psicanálise ,"Resta 2 parcelas, iniciou em 05/02/2024 expira 05/06/2025",Documentação entregue e deferida,Aluno foi aprovado em todas as disciplinas,Não precisa entregar nenhum trabalho.,,
"Análise Concluída, Aluno certificado",Luiz Alberto Leite da Silva,058.375.204-73,06/01/2025,SEGUNDA LICENCIATURA EM CIÊNCIAS DA RELIGIÃO,"Quitado, curso pago no cartão de crédito",Documentação entregue e deferida,Aluno foi aprovado em todas as disciplinas,Aprovado 05/02/2025,,
Normal,Antônio Alberto Prata Teodoro,020.967.886-09,06/01/2025,Formação Pedagógica História,Quitado,Documentação entregue e deferida,Aluno foi aprovado em todas as disciplinas,Aprovado nas práticas pedagógicas (Via e`;

function parseCSV(csv: string): DadosCertificacao[] {
  const lines = csv.split('\n');
  const headers = lines[0].split(',');
  const data: DadosCertificacao[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Parse CSV line (handles quoted fields)
    const values = parseCSVLine(line);
    if (values.length >= 11) {
      data.push({
        status: values[0] || '',
        aluno: values[1] || '',
        cpf: values[2] || '',
        dataSolicitacao: values[3] || '',
        curso: values[4] || '',
        financeiro: values[5] || '',
        documentacao: values[6] || '',
        atividadesPlataforma: values[7] || '',
        praticasPedagogicas: values[8] || '',
        dataLiberacao: values[9] || '',
        observacao: values[10] || ''
      });
    }
  }
  
  return data;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

function inferirModalidade(curso: string): string {
  const cursoLower = curso.toLowerCase();
  
  if (cursoLower.includes('segunda licenciatura')) {
    return 'Segunda licenciatura';
  } else if (cursoLower.includes('formação pedagógica') || cursoLower.includes('pedagogia para bacharéis')) {
    return 'Formação pedagógica';
  } else if (cursoLower.includes('pós-graduação')) {
    return 'Pós-graduação';
  } else if (cursoLower.includes('formação livre')) {
    return 'Formação livre';
  } else if (cursoLower.includes('graduação') && !cursoLower.includes('pós')) {
    return 'Graduação';
  } else if (cursoLower.includes('diplomação')) {
    return 'Diplomação por competência';
  } else if (cursoLower.includes('eja')) {
    return 'EJA';
  } else if (cursoLower.includes('capacitação')) {
    return 'Capacitação';
  } else if (cursoLower.includes('sequencial')) {
    return 'Sequencial';
  }
  
  return 'Pós-graduação'; // Default
}

function inferirSubcategoria(curso: string): string | null {
  const cursoLower = curso.toLowerCase();
  
  if (cursoLower.includes('segunda licenciatura')) {
    return 'segunda_licenciatura';
  } else if (cursoLower.includes('formação pedagógica') && !cursoLower.includes('pedagogia para bacharéis')) {
    return 'formacao_pedagogica';
  } else if (cursoLower.includes('pedagogia para bacharéis')) {
    return 'pedagogia_bachareis';
  }
  
  return null;
}

function inferirStatus(status: string): string {
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes('certificado') || statusLower.includes('concluída')) {
    return 'concluido';
  } else if (statusLower.includes('urgente')) {
    return 'em_andamento';
  } else if (statusLower.includes('falta')) {
    return 'pendente';
  } else if (statusLower.includes('cancelado')) {
    return 'cancelado';
  }
  
  return 'em_andamento'; // Default
}

function inferirPraticasPedagogicas(praticas: string): string {
  const praticasLower = praticas.toLowerCase();
  
  if (praticasLower.includes('aprovada') || praticasLower.includes('aprovado')) {
    return 'aprovado';
  } else if (praticasLower.includes('pré') || praticasLower.includes('pre')) {
    return 'em_correcao';
  } else if (praticasLower.includes('não') || praticasLower.includes('nao')) {
    return 'nao_possui';
  }
  
  return 'nao_possui'; // Default
}

function parsearData(dataStr: string): string | null {
  if (!dataStr || dataStr.trim() === '') return null;
  
  // Formato DD/MM/YYYY
  const match = dataStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    const [_, dia, mes, ano] = match;
    return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }
  
  return null;
}

function extrairCargaHoraria(curso: string): number {
  // Procura por padrões como "1320 Horas", "850h", etc.
  const match = curso.match(/(\d+)\s*[hH]?(?:oras?)?/);
  if (match) {
    return parseInt(match[1]);
  }
  
  // Valores padrão baseados no tipo de curso
  const cursoLower = curso.toLowerCase();
  if (cursoLower.includes('pós-graduação')) {
    return 360;
  } else if (cursoLower.includes('segunda licenciatura')) {
    return 1320;
  } else if (cursoLower.includes('formação pedagógica')) {
    return 540;
  } else if (cursoLower.includes('formação livre')) {
    return 180;
  }
  
  return 360; // Default
}

async function importarDados() {
  console.log('🔄 Iniciando importação dos dados de análise de certificação...');
  
  // Parse dos dados CSV
  const dadosParseados = parseCSV(dadosCSV);
  console.log(`📊 Dados parseados: ${dadosParseados.length} registros encontrados`);
  
  // Conexão com o banco
  const sql = neon(process.env.DATABASE_URL!);
  
  let sucessos = 0;
  let erros = 0;
  let duplicatas = 0;
  
  for (const dado of dadosParseados) {
    try {
      // Verificar se já existe (por CPF + curso)
      const cpfLimpo = dado.cpf.replace(/\D/g, '');
      if (!cpfLimpo) {
        console.log(`⚠️ CPF inválido para ${dado.aluno}, pulando...`);
        continue;
      }
      
      const existingQuery = `
        SELECT id FROM certifications 
        WHERE cpf = $1 AND curso = $2
      `;
      const existingResult = await sql(existingQuery, [cpfLimpo, dado.curso]);
      
      if (existingResult.length > 0) {
        duplicatas++;
        continue;
      }
      
      // Preparar dados para inserção
      const modalidade = inferirModalidade(dado.curso);
      const subcategoria = inferirSubcategoria(dado.curso);
      const status = inferirStatus(dado.status);
      const praticasPedagogicas = inferirPraticasPedagogicas(dado.praticasPedagogicas);
      const dataSolicitacao = parsearData(dado.dataSolicitacao);
      const dataLiberacao = parsearData(dado.dataLiberacao);
      const cargaHoraria = extrairCargaHoraria(dado.curso);
      
      // Inserir no banco
      const insertQuery = `
        INSERT INTO certifications (
          aluno, cpf, modalidade, curso, status, financeiro, documentacao, 
          plataforma, tutoria, observacao, subcategoria, carga_horaria,
          data_prevista, data_entrega, tcc, praticas_pedagogicas, estagio
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
        )
      `;
      
      const values = [
        dado.aluno,
        cpfLimpo,
        modalidade,
        dado.curso,
        status,
        dado.financeiro || 'Em análise',
        dado.documentacao || 'Pendente',
        dado.atividadesPlataforma || 'Em andamento',
        'Não informado',
        `${dado.observacao || ''} [Status original: ${dado.status}] [Práticas: ${dado.praticasPedagogicas}]`.trim(),
        subcategoria,
        cargaHoraria,
        dataSolicitacao,
        dataLiberacao,
        'nao_possui',
        praticasPedagogicas,
        'nao_possui'
      ];
      
      await sql(insertQuery, values);
      sucessos++;
      
      if (sucessos % 10 === 0) {
        console.log(`✅ Processados ${sucessos} registros...`);
      }
      
    } catch (error) {
      console.error(`❌ Erro ao processar ${dado.aluno}:`, error);
      erros++;
    }
  }
  
  console.log('\n📈 Relatório da Importação:');
  console.log(`✅ Sucessos: ${sucessos}`);
  console.log(`⚠️ Duplicatas: ${duplicatas}`);
  console.log(`❌ Erros: ${erros}`);
  console.log(`📊 Total processado: ${dadosParseados.length}`);
  
  console.log('🎉 Importação concluída!');
}

// Executar se chamado diretamente
importarDados().catch(console.error);

export { importarDados };