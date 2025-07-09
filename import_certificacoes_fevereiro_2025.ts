import { db } from './server/db';
import { certifications } from './shared/schema';
import { eq, and } from 'drizzle-orm';
import fs from 'fs';

async function importarCertificacoesFevereiro2025() {
  console.log('📥 Importando certificações de fevereiro 2025...');
  
  try {
    // Carregar dados processados
    const dados = JSON.parse(fs.readFileSync('./dados_fevereiro_2025.json', 'utf-8'));
    const certificacoes = dados.certificacoes;
    
    console.log(`📊 Total de certificações para importar: ${certificacoes.length}`);
    
    let importadas = 0;
    let jaExistentes = 0;
    let erros = 0;
    
    for (const cert of certificacoes) {
      try {
        // Limpar CPF
        const cpfLimpo = limparCPF(cert.cpf);
        
        if (!validarCPF(cpfLimpo)) {
          console.log(`❌ CPF inválido: ${cert.cpf} - ${cert.aluno}`);
          erros++;
          continue;
        }
        
        // Limpar nome do curso
        const cursoLimpo = limparCurso(cert.curso);
        
        // Verificar se já existe
        const existente = await db
          .select()
          .from(certifications)
          .where(
            and(
              eq(certifications.cpf, cpfLimpo),
              eq(certifications.curso, cursoLimpo)
            )
          );
        
        if (existente.length > 0) {
          console.log(`⚠️  Já existe: ${cert.aluno} - ${cursoLimpo}`);
          jaExistentes++;
          continue;
        }
        
        // Extrair carga horária
        const cargaHoraria = extrairCargaHoraria(cert.curso);
        
        // Determinar categoria e subcategoria
        const categoria = getCategoria(cert.modalidade);
        const subcategoria = getSubcategoria(cert.modalidade, cert.curso);
        
        // Processar status das práticas pedagógicas
        const statusPP = extrairStatusPraticasPedagogicas(cert.praticasPedagogicas);
        
        // Processar disciplinas restantes
        const disciplinasRestantes = extrairDisciplinasRestantes(cert.plataforma);
        
        // Inferir situação da análise
        const situacaoAnalise = extrairSituacaoAnalise(cert.plataforma, cert.documentacao);
        
        // Preparar dados para inserção
        const dadosInsercao = {
          aluno: cert.aluno,
          cpf: cpfLimpo,
          modalidade: cert.modalidade,
          curso: cursoLimpo,
          status: cert.status,
          categoria: categoria,
          subcategoria: subcategoria,
          carga_horaria: cargaHoraria,
          data_inicio: cert.dataSolicitacao || null,
          data_conclusao: cert.dataLiberacao || null,
          observacoes: cert.observacao || null,
          // Campos financeiros
          situacao_financeira: cert.financeiro || null,
          // Campos acadêmicos
          situacao_documentacao: cert.documentacao || null,
          situacao_plataforma: cert.plataforma || null,
          situacao_praticas_pedagogicas: statusPP,
          situacao_analise: situacaoAnalise,
          disciplinas_restantes: disciplinasRestantes,
          // Campos de progresso
          progresso_tcc: 'nao_possui',
          progresso_estagio: 'nao_possui',
          // Timestamps
          created_at: new Date(),
          updated_at: new Date()
        };
        
        // Inserir no banco
        await db.insert(certifications).values(dadosInsercao);
        importadas++;
        
        if (importadas % 20 === 0) {
          console.log(`📋 Processadas ${importadas} certificações...`);
        }
        
      } catch (error) {
        console.error(`❌ Erro ao processar ${cert.aluno}:`, error);
        erros++;
      }
    }
    
    console.log('\n✅ Importação concluída!');
    console.log(`📊 Certificações importadas: ${importadas}`);
    console.log(`⚠️  Certificações já existentes: ${jaExistentes}`);
    console.log(`❌ Erros: ${erros}`);
    
    // Salvar relatório
    const relatorio = {
      data_importacao: new Date().toISOString(),
      arquivo_origem: dados.arquivo,
      certificacoes_processadas: certificacoes.length,
      certificacoes_importadas: importadas,
      certificacoes_ja_existentes: jaExistentes,
      certificacoes_com_erro: erros,
      sucesso_importacao: ((importadas / certificacoes.length) * 100).toFixed(1) + '%'
    };
    
    fs.writeFileSync('./relatorio_importacao_fevereiro_2025.json', JSON.stringify(relatorio, null, 2));
    console.log('\n📄 Relatório salvo em: relatorio_importacao_fevereiro_2025.json');
    
  } catch (error) {
    console.error('❌ Erro na importação:', error);
    throw error;
  }
}

function limparCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

function validarCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  cpf = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cpf.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  // Validação do primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;
  
  // Validação do segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  resto = 11 - (soma % 11);
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(10))) return false;
  
  return true;
}

function limparCurso(curso: string): string {
  return curso
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\-\(\)]/g, '')
    .trim();
}

function extrairCargaHoraria(curso: string): number | null {
  const match = curso.match(/(\d+)\s*(?:h|horas?|hora)/i);
  if (match) {
    return parseInt(match[1]);
  }
  return null;
}

function extrairStatusPraticasPedagogicas(praticasPedagogicas: string): string {
  const texto = praticasPedagogicas.toLowerCase();
  
  if (texto.includes('aprovad') || texto.includes('pps aprovadas')) {
    return 'aprovado';
  }
  if (texto.includes('reprovad') || texto.includes('pendente')) {
    return 'reprovado';
  }
  if (texto.includes('correção') || texto.includes('análise')) {
    return 'em_correcao';
  }
  if (texto.includes('não precisa') || texto.includes('não necessita') || texto.includes('desnecessário')) {
    return 'nao_possui';
  }
  
  return 'nao_possui';
}

function extrairDisciplinasRestantes(plataforma: string): number | null {
  const texto = plataforma.toLowerCase();
  
  // Procurar por padrões como "faltam 3 disciplinas", "restam 2", etc.
  const matchFaltam = texto.match(/faltam?\s*(\d+)\s*disciplinas?/i);
  if (matchFaltam) {
    return parseInt(matchFaltam[1]);
  }
  
  const matchRestam = texto.match(/restam?\s*(\d+)\s*disciplinas?/i);
  if (matchRestam) {
    return parseInt(matchRestam[1]);
  }
  
  const matchApenas = texto.match(/apenas\s*(\d+)\s*disciplinas?/i);
  if (matchApenas) {
    return parseInt(matchApenas[1]);
  }
  
  // Se menciona "todas" ou "aprovado em todas"
  if (texto.includes('todas') || texto.includes('aprovado em todas')) {
    return 0;
  }
  
  // Se menciona "nenhuma disciplina"
  if (texto.includes('nenhuma disciplina')) {
    return null;
  }
  
  return null;
}

function extrairSituacaoAnalise(plataforma: string, documentacao: string): string {
  const textoPlataforma = plataforma.toLowerCase();
  const textoDocumentacao = documentacao.toLowerCase();
  
  // Verificar se está aprovado/concluído
  if (textoPlataforma.includes('aprovado em todas') || textoPlataforma.includes('concluído')) {
    if (textoDocumentacao.includes('deferido') || textoDocumentacao.includes('aprovado')) {
      return 'aprovado';
    }
  }
  
  // Verificar se há pendências
  if (textoDocumentacao.includes('incompleto') || textoDocumentacao.includes('pendente')) {
    return 'pendente_documentacao';
  }
  
  if (textoPlataforma.includes('não realizou') || textoPlataforma.includes('apenas uma disciplina')) {
    return 'pendente_plataforma';
  }
  
  // Verificar se foi reprovado
  if (textoDocumentacao.includes('reprovado') || textoDocumentacao.includes('indeferido')) {
    return 'reprovado';
  }
  
  return 'em_analise';
}

function getCategoria(modalidade: string): string {
  const modalidadeLower = modalidade.toLowerCase();
  
  if (modalidadeLower.includes('pós-graduação') || modalidadeLower.includes('pos graduacao')) {
    return 'pos_graduacao';
  }
  if (modalidadeLower.includes('segunda licenciatura') || modalidadeLower.includes('2ª licenciatura')) {
    return 'segunda_graduacao';
  }
  if (modalidadeLower.includes('formação pedagógica') || modalidadeLower.includes('formacao pedagogica')) {
    return 'formacao_livre';
  }
  if (modalidadeLower.includes('eja')) {
    return 'eja';
  }
  if (modalidadeLower.includes('diplomação')) {
    return 'diplomacao_competencia';
  }
  if (modalidadeLower.includes('graduação') && !modalidadeLower.includes('pós')) {
    return 'graduacao';
  }
  if (modalidadeLower.includes('formação livre') || modalidadeLower.includes('curso livre')) {
    return 'formacao_livre';
  }
  if (modalidadeLower.includes('capacitação')) {
    return 'capacitacao';
  }
  if (modalidadeLower.includes('sequencial')) {
    return 'sequencial';
  }
  
  return 'formacao_livre';
}

function getSubcategoria(modalidade: string, curso: string): string {
  const modalidadeLower = modalidade.toLowerCase();
  const cursoLower = curso.toLowerCase();
  
  if (modalidadeLower.includes('pós-graduação')) {
    if (cursoLower.includes('educação') || cursoLower.includes('pedagogia')) {
      return 'educacao';
    }
    if (cursoLower.includes('psicologia') || cursoLower.includes('terapia')) {
      return 'psicologia';
    }
    if (cursoLower.includes('gestão') || cursoLower.includes('administração')) {
      return 'gestao';
    }
    if (cursoLower.includes('saúde') || cursoLower.includes('enfermagem')) {
      return 'saude';
    }
    return 'outras';
  }
  
  if (modalidadeLower.includes('segunda licenciatura')) {
    if (cursoLower.includes('pedagogia')) {
      return 'pedagogia';
    }
    if (cursoLower.includes('história')) {
      return 'historia';
    }
    if (cursoLower.includes('letras') || cursoLower.includes('português')) {
      return 'letras';
    }
    if (cursoLower.includes('matemática')) {
      return 'matematica';
    }
    if (cursoLower.includes('música')) {
      return 'artes';
    }
    return 'outras';
  }
  
  return 'geral';
}

// Executar se for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  importarCertificacoesFevereiro2025()
    .then(() => {
      console.log('\n🎉 Importação de fevereiro 2025 concluída com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro na importação:', error);
      process.exit(1);
    });
}

export { importarCertificacoesFevereiro2025 };