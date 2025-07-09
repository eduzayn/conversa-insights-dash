import { db } from './server/db';
import { certifications } from './shared/schema';
import { sql } from 'drizzle-orm';
import fs from 'fs';

async function importarCertificacoesMarco2025() {
  console.log('📥 Importando certificações de março 2025...');
  
  try {
    // Ler os dados processados
    const dados = JSON.parse(fs.readFileSync('./dados_marco_2025.json', 'utf8'));
    const certificacoes = dados.certificacoes;
    
    console.log(`📊 Total de certificações para importar: ${certificacoes.length}`);
    
    let importadas = 0;
    let jaExistentes = 0;
    let erros = 0;
    const errosDetalhados = [];
    
    for (const cert of certificacoes) {
      try {
        // Limpar e validar CPF
        const cpfLimpo = limparCPF(cert.cpf);
        
        if (!cpfLimpo || !validarCPF(cpfLimpo)) {
          console.log(`⚠️  CPF inválido: ${cert.cpf} - ${cert.aluno}`);
          erros++;
          errosDetalhados.push({
            tipo: 'CPF inválido',
            cpf: cert.cpf,
            aluno: cert.aluno,
            linha: cert.linha
          });
          continue;
        }
        
        // Verificar se já existe (por CPF + curso)
        const existingCert = await db.select()
          .from(certifications)
          .where(
            sql`cpf = ${cpfLimpo} AND lower(curso) = lower(${cert.curso})`
          );
        
        if (existingCert.length > 0) {
          console.log(`⚠️  Já existe: ${cert.aluno} - ${cert.curso}`);
          jaExistentes++;
          continue;
        }
        
        // Processar dados para inserção
        const cargaHoraria = extrairCargaHoraria(cert.curso);
        const dadosCertificacao = {
          inicio: 'Mediana',
          aluno: cert.aluno,
          cpf: cpfLimpo,
          modalidade: cert.modalidade || 'Não informado',
          curso: limparCurso(cert.curso),
          financeiro: cert.financeiro || '',
          documentacao: cert.documentacao || '',
          plataforma: cert.plataforma || '',
          tutoria: cert.praticasPedagogicas || '',
          observacao: cert.observacao || '',
          status: cert.status || 'pendente',
          cargaHoraria: cargaHoraria,
          categoria: getCategoria(cert.modalidade),
          subcategoria: getSubcategoria(cert.modalidade, cert.curso),
          tcc: 'nao_possui',
          praticasPedagogicas: extrairStatusPraticasPedagogicas(cert.praticasPedagogicas),
          estagio: 'nao_possui',
          situacaoAnalise: extrairSituacaoAnalise(cert.plataforma, cert.documentacao),
          dataInicio: null,
          dataExpiracao: null,
          telefone: null,
          disciplinasRestantes: extrairDisciplinasRestantes(cert.plataforma),
          extensaoContratada: cert.financeiro?.toLowerCase().includes('extensão') || false
        };
        
        // Inserir certificação
        await db.insert(certifications).values(dadosCertificacao);
        
        importadas++;
        
        if (importadas % 20 === 0) {
          console.log(`📋 Processadas ${importadas} certificações...`);
        }
        
      } catch (error) {
        erros++;
        errosDetalhados.push({
          tipo: 'Erro de inserção',
          cpf: cert.cpf,
          aluno: cert.aluno,
          linha: cert.linha,
          erro: error.message
        });
        console.error(`❌ Erro ao importar ${cert.aluno} - ${cert.curso}:`, error.message);
      }
    }
    
    console.log(`\n📊 RESULTADO DA IMPORTAÇÃO:`);
    console.log(`✅ Importadas: ${importadas}`);
    console.log(`⚠️  Já existentes: ${jaExistentes}`);
    console.log(`❌ Erros: ${erros}`);
    console.log(`📋 Total processadas: ${certificacoes.length}`);
    
    // Estatísticas por modalidade das importadas
    const estatisticasImportadas = {};
    
    // Contar apenas as que foram efetivamente importadas
    const certImportadas = certificacoes.filter(cert => {
      const cpfLimpo = limparCPF(cert.cpf);
      return cpfLimpo && validarCPF(cpfLimpo);
    }).slice(0, importadas);
    
    certImportadas.forEach(cert => {
      const modalidade = cert.modalidade || 'Não informado';
      if (!estatisticasImportadas[modalidade]) {
        estatisticasImportadas[modalidade] = 0;
      }
      estatisticasImportadas[modalidade]++;
    });
    
    console.log('\n📈 ESTATÍSTICAS POR MODALIDADE (importadas):');
    Object.entries(estatisticasImportadas).forEach(([modalidade, count]) => {
      console.log(`${modalidade}: ${count} certificações`);
    });
    
    // Mostrar erros detalhados se houver
    if (errosDetalhados.length > 0) {
      console.log('\n❌ ERROS DETALHADOS:');
      errosDetalhados.slice(0, 10).forEach((erro, index) => {
        console.log(`${index + 1}. ${erro.tipo}: ${erro.aluno} (CPF: ${erro.cpf}) - Linha ${erro.linha}`);
        if (erro.erro) {
          console.log(`   Erro: ${erro.erro}`);
        }
      });
      
      if (errosDetalhados.length > 10) {
        console.log(`... e mais ${errosDetalhados.length - 10} erros`);
      }
    }
    
    // Salvar relatório
    const relatorio = {
      arquivo: 'ANÁLISES PARA CERTIFICAÇÃO e DECLARAÇÕES_____ (4)_1752023930428.xlsx',
      sheet: 'Março',
      dataImportacao: new Date().toISOString(),
      totalProcessadas: certificacoes.length,
      importadas: importadas,
      jaExistentes: jaExistentes,
      erros: erros,
      estatisticasModalidade: estatisticasImportadas,
      errosDetalhados: errosDetalhados
    };
    
    fs.writeFileSync('./relatorio_importacao_marco_2025.json', JSON.stringify(relatorio, null, 2));
    console.log('\n💾 Relatório salvo em: relatorio_importacao_marco_2025.json');
    
  } catch (error) {
    console.error('❌ Erro geral na importação:', error);
    throw error;
  }
}

function limparCPF(cpf: string): string {
  if (!cpf) return '';
  
  // Remover caracteres não numéricos
  let cpfLimpo = cpf.replace(/[^\d]/g, '');
  
  // Casos especiais
  if (cpf.includes(';')) {
    cpfLimpo = cpf.replace(/;/g, '').replace(/[^\d]/g, '');
  }
  
  // Adicionar zeros à esquerda se necessário
  cpfLimpo = cpfLimpo.padStart(11, '0');
  
  // Formatar CPF
  if (cpfLimpo.length === 11) {
    return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  
  return '';
}

function validarCPF(cpf: string): boolean {
  const cpfLimpo = cpf.replace(/[^\d]/g, '');
  
  if (cpfLimpo.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;
  
  return true;
}

function limparCurso(curso: string): string {
  if (!curso) return '';
  
  return curso.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
}

function extrairCargaHoraria(curso: string): number | null {
  if (!curso) return null;
  
  const match = curso.match(/(\d+)\s*(?:Horas|H)/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  
  const cursoLower = curso.toLowerCase();
  if (cursoLower.includes('segunda licenciatura')) return 1600;
  if (cursoLower.includes('pós-graduação')) return 360;
  if (cursoLower.includes('formação pedagógica')) return 1000;
  if (cursoLower.includes('diplomação')) return 800;
  if (cursoLower.includes('formação livre')) return 200;
  
  return null;
}

function extrairStatusPraticasPedagogicas(praticasPedagogicas: string): string {
  if (!praticasPedagogicas) return 'nao_possui';
  
  const texto = praticasPedagogicas.toLowerCase();
  if (texto.includes('aprovado') || texto.includes('aprovadas') || texto.includes('pré aprovadas')) return 'aprovado';
  if (texto.includes('reprovado') || texto.includes('reprovadas')) return 'reprovado';
  if (texto.includes('correção') || texto.includes('aguardando correção')) return 'em_correcao';
  if (texto.includes('não') || texto.includes('nao') || texto.includes('não necessita')) return 'nao_possui';
  
  return 'nao_possui';
}

function extrairDisciplinasRestantes(plataforma: string): number | null {
  if (!plataforma) return null;
  
  const match = plataforma.match(/(?:resta|restam)\s+(?:concluir\s+)?(\d+)\s+disciplinas?/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  
  return null;
}

function extrairSituacaoAnalise(plataforma: string, documentacao: string): string {
  if (!plataforma && !documentacao) return 'Em análise';
  
  const textoCompleto = `${plataforma} ${documentacao}`.toLowerCase();
  
  if (textoCompleto.includes('aprovado em todas') && textoCompleto.includes('entregues e deferidos')) {
    return 'Análise Concluída';
  }
  if (textoCompleto.includes('resta') || textoCompleto.includes('aguardando')) {
    return 'Em análise';
  }
  if (textoCompleto.includes('entregues e deferidos')) {
    return 'Documentação OK';
  }
  
  return 'Em análise';
}

function getCategoria(modalidade: string): string {
  if (!modalidade) return 'outras';
  
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
    case 'graduação':
      return 'graduacao';
    case 'capacitação':
      return 'capacitacao';
    case 'sequencial':
      return 'sequencial';
    default:
      return 'outras';
  }
}

function getSubcategoria(modalidade: string, curso: string): string {
  if (!modalidade) return '';
  
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
  importarCertificacoesMarco2025()
    .then(() => {
      console.log('\n✅ Importação concluída!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro na importação:', error);
      process.exit(1);
    });
}

export { importarCertificacoesMarco2025 };