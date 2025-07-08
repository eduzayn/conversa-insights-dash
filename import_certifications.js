import { pool } from './server/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Dados da planilha Excel fornecida
const certificationData = [
  {
    aluno: "ADRIANA MACIEL DOS ANJOS",
    cpf: "120.098.607-76",
    modalidade: "Pós-Graduação",
    curso: "Ensino de Ciências exatas",
    telefone: "13975096433",
    inicio: "OUTUBRO/2024",
    status: "em_analise",
    categoria: "pos_graduacao",
    financeiro: "OK",
    documentacao: "OK",
    plataforma: "EM ANÁLISE",
    tutoria: "OK",
    prioridade: "mediana",
    observacao: "Formada em Física, 2024"
  },
  {
    aluno: "AMANDA COSTA BATISTA",
    cpf: "133.804.677-93",
    modalidade: "Pós-Graduação",
    curso: "Ensino de Ciências exatas",
    telefone: "13982765006",
    inicio: "OUTUBRO/2024",
    status: "em_analise",
    categoria: "pos_graduacao",
    financeiro: "OK",
    documentacao: "OK",
    plataforma: "EM ANÁLISE",
    tutoria: "OK",
    prioridade: "mediana",
    observacao: "Formada em Física, 2024"
  },
  {
    aluno: "ALEXANDRE BENTO FERREIRA",
    cpf: "128.965.177-24",
    modalidade: "Pós-Graduação",
    curso: "Ensino de Ciências exatas",
    telefone: "13996479880",
    inicio: "OUTUBRO/2024",
    status: "em_analise",
    categoria: "pos_graduacao",
    financeiro: "OK",
    documentacao: "OK",
    plataforma: "EM ANÁLISE",
    tutoria: "OK",
    prioridade: "mediana",
    observacao: "Formado em Física, 2024"
  },
  {
    aluno: "ANDERSON APARECIDO VIANNA",
    cpf: "290.623.978-54",
    modalidade: "Pós-Graduação",
    curso: "Ensino de Ciências exatas",
    telefone: "13988152133",
    inicio: "OUTUBRO/2024",
    status: "em_analise",
    categoria: "pos_graduacao",
    financeiro: "OK",
    documentacao: "OK",
    plataforma: "EM ANÁLISE",
    tutoria: "OK",
    prioridade: "mediana",
    observacao: "Formado em Física, 2024"
  },
  {
    aluno: "BENEDITO RODRIGUES JUNIOR",
    cpf: "112.776.298-52",
    modalidade: "Pós-Graduação",
    curso: "Ensino de Ciências exatas",
    telefone: "13988248484",
    inicio: "OUTUBRO/2024",
    status: "em_analise",
    categoria: "pos_graduacao",
    financeiro: "OK",
    documentacao: "OK",
    plataforma: "EM ANÁLISE",
    tutoria: "OK",
    prioridade: "mediana",
    observacao: "Formado em Física, 2024"
  },
  {
    aluno: "CARLOS ALBERTO PAIVA",
    cpf: "103.701.468-40",
    modalidade: "Pós-Graduação",
    curso: "Ensino de Ciências exatas",
    telefone: "13982825262",
    inicio: "OUTUBRO/2024",
    status: "em_analise",
    categoria: "pos_graduacao",
    financeiro: "OK",
    documentacao: "OK",
    plataforma: "EM ANÁLISE",
    tutoria: "OK",
    prioridade: "mediana",
    observacao: "Formado em Física, 2024"
  },
  {
    aluno: "DAIANE PEREIRA CAMARGO",
    cpf: "359.952.018-05",
    modalidade: "Pós-Graduação",
    curso: "Ensino de Ciências exatas",
    telefone: "13996847800",
    inicio: "OUTUBRO/2024",
    status: "em_analise",
    categoria: "pos_graduacao",
    financeiro: "OK",
    documentacao: "OK",
    plataforma: "EM ANÁLISE",
    tutoria: "OK",
    prioridade: "mediana",
    observacao: "Formada em Física, 2024"
  },
  {
    aluno: "DIEGO PEREIRA SANTOS",
    cpf: "470.623.928-40",
    modalidade: "Pós-Graduação",
    curso: "Ensino de Ciências exatas",
    telefone: "13997344000",
    inicio: "OUTUBRO/2024",
    status: "em_analise",
    categoria: "pos_graduacao",
    financeiro: "OK",
    documentacao: "OK",
    plataforma: "EM ANÁLISE",
    tutoria: "OK",
    prioridade: "mediana",
    observacao: "Formado em Física, 2024"
  },
  {
    aluno: "EDILTON SOUZA OLIVEIRA",
    cpf: "283.095.188-98",
    modalidade: "Pós-Graduação",
    curso: "Ensino de Ciências exatas",
    telefone: "13988037676",
    inicio: "OUTUBRO/2024",
    status: "em_analise",
    categoria: "pos_graduacao",
    financeiro: "OK",
    documentacao: "OK",
    plataforma: "EM ANÁLISE",
    tutoria: "OK",
    prioridade: "mediana",
    observacao: "Formado em Física, 2024"
  },
  {
    aluno: "GUILHERME DIAS VIEIRA",
    cpf: "429.924.658-54",
    modalidade: "Pós-Graduação",
    curso: "Ensino de Ciências exatas",
    telefone: "13997099449",
    inicio: "OUTUBRO/2024",
    status: "em_analise",
    categoria: "pos_graduacao",
    financeiro: "OK",
    documentacao: "OK",
    plataforma: "EM ANÁLISE",
    tutoria: "OK",
    prioridade: "mediana",
    observacao: "Formado em Física, 2024"
  },
  {
    aluno: "HELDER SANTOS MIRANDA",
    cpf: "318.529.588-91",
    modalidade: "Pós-Graduação",
    curso: "Ensino de Ciências exatas",
    telefone: "13998033545",
    inicio: "OUTUBRO/2024",
    status: "em_analise",
    categoria: "pos_graduacao",
    financeiro: "OK",
    documentacao: "OK",
    plataforma: "EM ANÁLISE",
    tutoria: "OK",
    prioridade: "mediana",
    observacao: "Formado em Física, 2024"
  },
  {
    aluno: "HUMBERTO FERREIRA ROSA",
    cpf: "311.715.058-48",
    modalidade: "Pós-Graduação",
    curso: "Ensino de Ciências exatas",
    telefone: "13987062826",
    inicio: "OUTUBRO/2024",
    status: "em_analise",
    categoria: "pos_graduacao",
    financeiro: "OK",
    documentacao: "OK",
    plataforma: "EM ANÁLISE",
    tutoria: "OK",
    prioridade: "mediana",
    observacao: "Formado em Física, 2024"
  },
  {
    aluno: "JAIRO CRUZ LIMA",
    cpf: "127.772.098-90",
    modalidade: "Pós-Graduação",
    curso: "Ensino de Ciências exatas",
    telefone: "13982814443",
    inicio: "OUTUBRO/2024",
    status: "em_analise",
    categoria: "pos_graduacao",
    financeiro: "OK",
    documentacao: "OK",
    plataforma: "EM ANÁLISE",
    tutoria: "OK",
    prioridade: "mediana",
    observacao: "Formado em Física, 2024"
  },
  {
    aluno: "JÉSSICA FERNANDES MEDEIROS",
    cpf: "404.456.518-13",
    modalidade: "Pós-Graduação",
    curso: "Ensino de Ciências exatas",
    telefone: "13988177877",
    inicio: "OUTUBRO/2024",
    status: "em_analise",
    categoria: "pos_graduacao",
    financeiro: "OK",
    documentacao: "OK",
    plataforma: "EM ANÁLISE",
    tutoria: "OK",
    prioridade: "mediana",
    observacao: "Formada em Física, 2024"
  },
  {
    aluno: "JULIANA VIANA BESSA",
    cpf: "344.055.238-74",
    modalidade: "Pós-Graduação",
    curso: "Ensino de Ciências exatas",
    telefone: "13997344000",
    inicio: "OUTUBRO/2024",
    status: "em_analise",
    categoria: "pos_graduacao",
    financeiro: "OK",
    documentacao: "OK",
    plataforma: "EM ANÁLISE",
    tutoria: "OK",
    prioridade: "mediana",
    observacao: "Formada em Física, 2024"
  },
  {
    aluno: "MATHEUS BARBOSA OLIVEIRA",
    cpf: "473.547.698-08",
    modalidade: "Pós-Graduação",
    curso: "Ensino de Ciências exatas",
    telefone: "13996479880",
    inicio: "OUTUBRO/2024",
    status: "em_analise",
    categoria: "pos_graduacao",
    financeiro: "OK",
    documentacao: "OK",
    plataforma: "EM ANÁLISE",
    tutoria: "OK",
    prioridade: "mediana",
    observacao: "Formado em Física, 2024"
  },
  {
    aluno: "MAURO RODRIGUES VIEIRA",
    cpf: "200.827.728-24",
    modalidade: "Pós-Graduação",
    curso: "Ensino de Ciências exatas",
    telefone: "13997344000",
    inicio: "OUTUBRO/2024",
    status: "em_analise",
    categoria: "pos_graduacao",
    financeiro: "OK",
    documentacao: "OK",
    plataforma: "EM ANÁLISE",
    tutoria: "OK",
    prioridade: "mediana",
    observacao: "Formado em Física, 2024"
  },
  {
    aluno: "NICOLAS GUSTAVO NOGUEIRA",
    cpf: "359.669.868-03",
    modalidade: "Pós-Graduação",
    curso: "Ensino de Ciências exatas",
    telefone: "13988003045",
    inicio: "OUTUBRO/2024",
    status: "em_analise",
    categoria: "pos_graduacao",
    financeiro: "OK",
    documentacao: "OK",
    plataforma: "EM ANÁLISE",
    tutoria: "OK",
    prioridade: "mediana",
    observacao: "Formado em Física, 2024"
  },
  {
    aluno: "RODRIGO OLIVEIRA LOPES",
    cpf: "360.649.058-49",
    modalidade: "Pós-Graduação",
    curso: "Ensino de Ciências exatas",
    telefone: "13997344000",
    inicio: "OUTUBRO/2024",
    status: "em_analise",
    categoria: "pos_graduacao",
    financeiro: "OK",
    documentacao: "OK",
    plataforma: "EM ANÁLISE",
    tutoria: "OK",
    prioridade: "mediana",
    observacao: "Formado em Física, 2024"
  },
  {
    aluno: "ROSIMEIRE NASCIMENTO SANTOS",
    cpf: "252.424.378-37",
    modalidade: "Pós-Graduação",
    curso: "Ensino de Ciências exatas",
    telefone: "13997344000",
    inicio: "OUTUBRO/2024",
    status: "em_analise",
    categoria: "pos_graduacao",
    financeiro: "OK",
    documentacao: "OK",
    plataforma: "EM ANÁLISE",
    tutoria: "OK",
    prioridade: "mediana",
    observacao: "Formada em Física, 2024"
  },
  {
    aluno: "SILVIA HELENA PIRES",
    cpf: "158.738.538-05",
    modalidade: "Pós-Graduação",
    curso: "Ensino de Ciências exatas",
    telefone: "13996479880",
    inicio: "OUTUBRO/2024",
    status: "em_analise",
    categoria: "pos_graduacao",
    financeiro: "OK",
    documentacao: "OK",
    plataforma: "EM ANÁLISE",
    tutoria: "OK",
    prioridade: "mediana",
    observacao: "Formada em Física, 2024"
  },
  {
    aluno: "VALTER ALVES MOREIRA JUNIOR",
    cpf: "319.344.798-93",
    modalidade: "Pós-Graduação",
    curso: "Ensino de Ciências exatas",
    telefone: "13997344000",
    inicio: "OUTUBRO/2024",
    status: "em_analise",
    categoria: "pos_graduacao",
    financeiro: "OK",
    documentacao: "OK",
    plataforma: "EM ANÁLISE",
    tutoria: "OK",
    prioridade: "mediana",
    observacao: "Formado em Física, 2024"
  },
  {
    aluno: "VANESSA FERREIRA MOREIRA",
    cpf: "355.894.008-77",
    modalidade: "Pós-Graduação",
    curso: "Ensino de Ciências exatas",
    telefone: "13997344000",
    inicio: "OUTUBRO/2024",
    status: "em_analise",
    categoria: "pos_graduacao",
    financeiro: "OK",
    documentacao: "OK",
    plataforma: "EM ANÁLISE",
    tutoria: "OK",
    prioridade: "mediana",
    observacao: "Formada em Física, 2024"
  },
  {
    aluno: "WELLINGTON LUIZ LOPES",
    cpf: "359.607.748-00",
    modalidade: "Pós-Graduação",
    curso: "Ensino de Ciências exatas",
    telefone: "13997344000",
    inicio: "OUTUBRO/2024",
    status: "em_analise",
    categoria: "pos_graduacao",
    financeiro: "OK",
    documentacao: "OK",
    plataforma: "EM ANÁLISE",
    tutoria: "OK",
    prioridade: "mediana",
    observacao: "Formado em Física, 2024"
  },
  {
    aluno: "WILLIAM SANTOS FERREIRA",
    cpf: "442.421.848-57",
    modalidade: "Pós-Graduação",
    curso: "Ensino de Ciências exatas",
    telefone: "13997344000",
    inicio: "OUTUBRO/2024",
    status: "em_analise",
    categoria: "pos_graduacao",
    financeiro: "OK",
    documentacao: "OK",
    plataforma: "EM ANÁLISE",
    tutoria: "OK",
    prioridade: "mediana",
    observacao: "Formado em Física, 2024"
  }
];

async function importCertifications() {
  try {
    console.log('Iniciando importação de certificações...');
    
    // Limpar dados existentes
    await pool.query('DELETE FROM certifications');
    console.log('Dados antigos removidos');
    
    // Preparar query de inserção
    const insertQuery = `
      INSERT INTO certifications (
        aluno, cpf, modalidade, curso, telefone, inicio, status, categoria,
        financeiro, documentacao, plataforma, tutoria, prioridade, observacao
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `;
    
    // Inserir cada certificação
    for (const cert of certificationData) {
      await pool.query(insertQuery, [
        cert.aluno,
        cert.cpf,
        cert.modalidade,
        cert.curso,
        cert.telefone,
        cert.inicio,
        cert.status,
        cert.categoria,
        cert.financeiro,
        cert.documentacao,
        cert.plataforma,
        cert.tutoria,
        cert.prioridade,
        cert.observacao
      ]);
    }
    
    console.log(`✅ Importação concluída! ${certificationData.length} certificações inseridas.`);
    
    // Verificar dados inseridos
    const result = await pool.query('SELECT COUNT(*) as total FROM certifications');
    console.log(`Total de certificações no banco: ${result.rows[0].total}`);
    
  } catch (error) {
    console.error('Erro na importação:', error);
  } finally {
    await pool.end();
  }
}

importCertifications();