import fs from 'fs';
import { db } from './server/db';
import { certifications } from './shared/schema';
import { eq } from 'drizzle-orm';

async function verificarImportacaoJunho() {
  console.log('🔍 Verificando importação das certificações de junho...');
  
  // Lendo o arquivo PDF convertido
  const pdfContent = fs.readFileSync('./attached_assets/ANÁLISES PARA CERTIFICAÇÃO e DECLARAÇÕES_____ - Junho_1752022935465.pdf', 'utf8');
  
  // Buscando todas as certificações existentes no banco
  const existingCertifications = await db.select().from(certifications);
  console.log(`💾 Total de certificações no banco: ${existingCertifications.length}`);
  
  // Criando um mapa dos CPFs existentes
  const existingCPFs = new Set(existingCertifications.map(cert => cert.cpf));
  
  // Extraindo todos os CPFs do arquivo PDF
  const cpfRegex = /(\d{3}\.\d{3}\.\d{3}-\d{2})/g;
  const cpfsEncontrados = [];
  let match;
  
  while ((match = cpfRegex.exec(pdfContent)) !== null) {
    cpfsEncontrados.push(match[1]);
  }
  
  // Removendo duplicatas
  const cpfsUnicos = [...new Set(cpfsEncontrados)];
  console.log(`📋 CPFs únicos encontrados no arquivo: ${cpfsUnicos.length}`);
  
  // Analisando cada CPF
  const analiseCompleta = [];
  let jaImportadas = 0;
  let naoImportadas = 0;
  
  for (const cpf of cpfsUnicos) {
    try {
      // Procurando a linha completa que contém este CPF
      const linhaCompleta = pdfContent.split('\n').find(line => line.includes(cpf));
      
      if (linhaCompleta) {
        let aluno = '';
        let modalidade = '';
        let curso = '';
        
        // Tentando extrair o nome do aluno
        const alunoMatch = linhaCompleta.match(/([A-Z][a-zA-Z\s]+?)(?=\s+\d{3}\.\d{3}\.\d{3}-\d{2})/);
        if (alunoMatch) {
          aluno = alunoMatch[1].trim();
        }
        
        // Tentando extrair modalidade
        const modalidades = ['Segunda Licenciatura', 'Formação Pedagógica', 'Pós-Graduação', 'Formação Livre', 'Diplomação por Competência', 'EJA', 'Ensino Fundamental e Médio'];
        for (const mod of modalidades) {
          if (linhaCompleta.includes(mod)) {
            modalidade = mod;
            break;
          }
        }
        
        // Tentando extrair curso
        const modalidadeIndex = linhaCompleta.indexOf(modalidade);
        if (modalidadeIndex > -1) {
          const afterModalidade = linhaCompleta.substring(modalidadeIndex + modalidade.length);
          const cursoMatch = afterModalidade.match(/\s+([A-Za-z\sÀ-ÿ\-–]+?)(?=\s+Inicio:|Brinde|Quitado|Pagou)/);
          if (cursoMatch) {
            curso = cursoMatch[1].trim();
          }
        }
        
        const jaImportado = existingCPFs.has(cpf);
        
        analiseCompleta.push({
          cpf,
          aluno,
          modalidade,
          curso,
          jaImportado,
          linha: linhaCompleta.substring(0, 150) + '...' // Primeiros 150 caracteres para referência
        });
        
        if (jaImportado) {
          jaImportadas++;
        } else {
          naoImportadas++;
        }
      }
    } catch (error) {
      console.error(`❌ Erro ao processar CPF: ${cpf}`);
      console.error(error);
    }
  }
  
  // Relatório final
  console.log('\n📊 RELATÓRIO DE IMPORTAÇÃO:');
  console.log(`✅ Já importadas: ${jaImportadas}`);
  console.log(`❌ Não importadas: ${naoImportadas}`);
  console.log(`📋 Total analisadas: ${analiseCompleta.length}`);
  
  // Detalhes das não importadas
  console.log('\n📋 CERTIFICAÇÕES NÃO IMPORTADAS:');
  const naoImportadasDetalhes = analiseCompleta.filter(cert => !cert.jaImportado);
  
  naoImportadasDetalhes.forEach((cert, index) => {
    console.log(`\n${index + 1}. ${cert.aluno || 'Nome não identificado'}`);
    console.log(`   CPF: ${cert.cpf}`);
    console.log(`   Modalidade: ${cert.modalidade || 'Não identificada'}`);
    console.log(`   Curso: ${cert.curso || 'Não identificado'}`);
  });
  
  // Salvando relatório detalhado
  const relatorio = {
    dataAnalise: new Date().toISOString(),
    totalCPFs: cpfsUnicos.length,
    totalBanco: existingCertifications.length,
    jaImportadas,
    naoImportadas,
    detalhes: analiseCompleta
  };
  
  fs.writeFileSync('./relatorio_importacao_junho.json', JSON.stringify(relatorio, null, 2));
  console.log('\n💾 Relatório salvo em: relatorio_importacao_junho.json');
}

// Executar se for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  verificarImportacaoJunho()
    .then(() => {
      console.log('✅ Análise concluída!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro na análise:', error);
      process.exit(1);
    });
}

export { verificarImportacaoJunho };