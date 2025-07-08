import { db } from './server/db';
import { certifications } from './shared/schema';
import { eq } from 'drizzle-orm';

async function importFormacaoLivre() {
  try {
    // Dados do aluno de Formação Livre identificado na planilha PDF - linha 123
    const novoAluno = {
      inicio: 'Análise Concluída',
      aluno: 'Herber Moabia Chaves Santos',
      cpf: '690.558.822-91',
      modalidade: 'Formação Livre',
      curso: 'Sexologia',
      financeiro: 'Quitada, iniciou em 27/07/2022 e expirou 27/11/2023',
      documentacao: 'Não encaminhou nenhum documento',
      plataforma: 'Falta Plataforma',
      tutoria: 'Falta Financeiro, Falta Plataforma',
      observacao: 'Não localizado',
      inicioCertificacao: '2022-07-27',
      dataPrevista: '2023-11-27', // Data de expiração
      dataEntrega: null,
      diploma: null,
      status: 'concluido', // Já expirou, análise concluída
      categoria: 'formacao_livre',
      subcategoria: null,
      prioridade: 'normal'
    };

    // Verificar se o aluno já existe
    const existingStudent = await db.select()
      .from(certifications)
      .where(eq(certifications.cpf, novoAluno.cpf));

    if (existingStudent.length > 0) {
      console.log(`Aluno ${novoAluno.aluno} já existe no banco de dados`);
      return;
    }

    // Inserir novo aluno
    await db.insert(certifications).values(novoAluno);
    console.log(`✅ Importado: ${novoAluno.aluno} - ${novoAluno.curso}`);
    
    // Verificar total de certificações de Formação Livre
    const totalFormacaoLivre = await db.select()
      .from(certifications)
      .where(eq(certifications.categoria, 'formacao_livre'));
    
    console.log(`\n📊 Total de certificações de Formação Livre: ${totalFormacaoLivre.length}`);
    
  } catch (error) {
    console.error('Erro ao importar:', error);
  }
}

// Executar a importação
importFormacaoLivre()
  .then(() => {
    console.log('\n✅ Importação de Formação Livre concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro na importação:', error);
    process.exit(1);
  });