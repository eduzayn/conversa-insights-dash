import XLSX from 'xlsx';
import fs from 'fs';

async function processarExcelMaio() {
  console.log('📊 Processando arquivo Excel de maio de 2025...');
  
  try {
    // Ler o arquivo Excel
    const workbook = XLSX.readFile('./attached_assets/ANÁLISES PARA CERTIFICAÇÃO e DECLARAÇÕES_____ (2)_1752023230366.xlsx');
    
    // Listar as sheets disponíveis
    console.log('📋 Sheets disponíveis:', workbook.SheetNames);
    
    // Usar a sheet "Maio"
    const sheetName = workbook.SheetNames.find(name => name.toLowerCase() === 'maio') || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    console.log(`📄 Processando sheet: ${sheetName}`);
    
    // Converter para JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1, // Usar array de arrays
      raw: false, // Manter como string
      defval: '' // Valor padrão para células vazias
    });
    
    console.log(`📊 Total de linhas: ${jsonData.length}`);
    
    // Mostrar as primeiras linhas para entender a estrutura
    console.log('\n📋 Primeiras 5 linhas:');
    jsonData.slice(0, 5).forEach((row, index) => {
      console.log(`Linha ${index + 1}:`, row);
    });
    
    // Procurar pelo cabeçalho
    let headerRowIndex = -1;
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (Array.isArray(row)) {
        const rowStr = row.join('|').toLowerCase();
        if (rowStr.includes('início') || rowStr.includes('aluno') || rowStr.includes('cpf')) {
          headerRowIndex = i;
          console.log(`📋 Cabeçalho encontrado na linha ${i + 1}:`, row);
          break;
        }
      }
    }
    
    if (headerRowIndex === -1) {
      console.log('❌ Cabeçalho não encontrado, tentando com dados padrão');
      headerRowIndex = 0;
    }
    
    // Extrair dados a partir do cabeçalho
    const header = jsonData[headerRowIndex];
    const dataRows = jsonData.slice(headerRowIndex + 1);
    
    console.log(`\n📊 Cabeçalho identificado:`, header);
    console.log(`📊 Linhas de dados: ${dataRows.length}`);
    
    // Mapear colunas
    const colunas = {
      inicio: encontrarColuna(header, ['início', 'inicio']),
      aluno: encontrarColuna(header, ['aluno', 'nome']),
      cpf: encontrarColuna(header, ['cpf']),
      modalidade: encontrarColuna(header, ['modalidade']),
      curso: encontrarColuna(header, ['curso']),
      financeiro: encontrarColuna(header, ['financeiro']),
      documentacao: encontrarColuna(header, ['documentação', 'documentacao']),
      plataforma: encontrarColuna(header, ['plataforma']),
      tutoria: encontrarColuna(header, ['tutoria']),
      observacao: encontrarColuna(header, ['observação', 'observacao'])
    };
    
    console.log('\n📋 Mapeamento de colunas:', colunas);
    
    // Processar dados
    const certificacoes = [];
    
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      
      if (!Array.isArray(row) || row.length === 0) continue;
      
      // Verificar se tem dados relevantes
      const cpf = row[colunas.cpf]?.toString()?.trim() || '';
      const aluno = row[colunas.aluno]?.toString()?.trim() || '';
      
      if (!cpf || !aluno || cpf.length < 11) continue;
      
      const curso = row[colunas.curso]?.toString()?.trim() || '';
      const modalidade = inferirModalidade(curso);
      const status = inferirStatus(row[0]?.toString()?.trim() || ''); // Primeira coluna é Status
      
      const certificacao = {
        linha: i + headerRowIndex + 2, // +2 porque array começa em 0 e Excel em 1
        inicio: row[colunas.inicio]?.toString()?.trim() || 'Mediana',
        aluno: aluno,
        cpf: cpf,
        modalidade: modalidade,
        curso: curso,
        financeiro: row[colunas.financeiro]?.toString()?.trim() || '',
        documentacao: row[colunas.documentacao]?.toString()?.trim() || '',
        plataforma: row[colunas.plataforma]?.toString()?.trim() || '',
        tutoria: row[colunas.tutoria]?.toString()?.trim() || '',
        observacao: row[colunas.observacao]?.toString()?.trim() || '',
        status: status
      };
      
      certificacoes.push(certificacao);
    }
    
    console.log(`\n📊 Total de certificações extraídas: ${certificacoes.length}`);
    
    // Mostrar exemplos
    console.log('\n📋 Primeiras 3 certificações:');
    certificacoes.slice(0, 3).forEach((cert, index) => {
      console.log(`\n${index + 1}. ${cert.aluno}`);
      console.log(`   CPF: ${cert.cpf}`);
      console.log(`   Modalidade: ${cert.modalidade}`);
      console.log(`   Curso: ${cert.curso}`);
      console.log(`   Linha: ${cert.linha}`);
    });
    
    // Salvar dados processados
    const dados = {
      arquivo: 'ANÁLISES PARA CERTIFICAÇÃO e DECLARAÇÕES_____ (2)_1752023230366.xlsx',
      dataProcessamento: new Date().toISOString(),
      totalLinhas: jsonData.length,
      linhasCabecalho: headerRowIndex + 1,
      certificacoesExtraidas: certificacoes.length,
      mapeamentoColunas: colunas,
      certificacoes: certificacoes
    };
    
    fs.writeFileSync('./dados_maio_2025.json', JSON.stringify(dados, null, 2));
    console.log('\n💾 Dados salvos em: dados_maio_2025.json');
    
    // Estatísticas por modalidade
    const estatisticas = {};
    certificacoes.forEach(cert => {
      const modalidade = cert.modalidade || 'Não informado';
      if (!estatisticas[modalidade]) {
        estatisticas[modalidade] = 0;
      }
      estatisticas[modalidade]++;
    });
    
    console.log('\n📈 Estatísticas por modalidade:');
    Object.entries(estatisticas).forEach(([modalidade, count]) => {
      console.log(`${modalidade}: ${count} certificações`);
    });
    
    return certificacoes;
    
  } catch (error) {
    console.error('❌ Erro ao processar arquivo Excel:', error);
    throw error;
  }
}

function encontrarColuna(header: any[], termos: string[]): number {
  for (let i = 0; i < header.length; i++) {
    const cellValue = header[i]?.toString()?.toLowerCase() || '';
    for (const termo of termos) {
      if (cellValue.includes(termo.toLowerCase())) {
        return i;
      }
    }
  }
  return -1; // Não encontrado
}

function inferirModalidade(curso: string): string {
  const cursoLower = curso.toLowerCase();
  
  if (cursoLower.includes('segunda licenciatura') || cursoLower.includes('2ª licenciatura')) {
    return 'Segunda licenciatura';
  }
  if (cursoLower.includes('pós-graduação') || cursoLower.includes('pos graduacao') || cursoLower.includes('especialização')) {
    return 'Pós-graduação';
  }
  if (cursoLower.includes('formação pedagógica') || cursoLower.includes('formacao pedagogica')) {
    return 'Formação pedagógica';
  }
  if (cursoLower.includes('eja') || cursoLower.includes('educação de jovens e adultos')) {
    return 'EJA';
  }
  if (cursoLower.includes('diplomação') || cursoLower.includes('competência')) {
    return 'Diplomação por competência';
  }
  if (cursoLower.includes('graduação') && !cursoLower.includes('pós')) {
    return 'Graduação';
  }
  if (cursoLower.includes('curso livre') || cursoLower.includes('formação livre')) {
    return 'Formação livre';
  }
  if (cursoLower.includes('capacitação')) {
    return 'Capacitação';
  }
  if (cursoLower.includes('sequencial')) {
    return 'Sequencial';
  }
  
  // Tentar inferir pela duração em horas
  if (curso.includes('360') || curso.includes('400') || curso.includes('620')) {
    return 'Pós-graduação';
  }
  if (curso.includes('1320') || curso.includes('1600')) {
    return 'Segunda licenciatura';
  }
  if (curso.includes('1000')) {
    return 'Formação pedagógica';
  }
  
  return 'Não informado';
}

function inferirStatus(statusText: string): string {
  const statusLower = statusText.toLowerCase();
  
  if (statusLower.includes('concluída') || statusLower.includes('certificado')) {
    return 'concluido';
  }
  if (statusLower.includes('em andamento') || statusLower.includes('processo')) {
    return 'em_andamento';
  }
  if (statusLower.includes('pendente') || statusLower.includes('aguardando')) {
    return 'pendente';
  }
  if (statusLower.includes('cancelado') || statusLower.includes('expirado')) {
    return 'cancelado';
  }
  
  return 'pendente'; // Padrão
}

// Executar se for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  processarExcelMaio()
    .then(() => {
      console.log('\n✅ Processamento concluído!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro no processamento:', error);
      process.exit(1);
    });
}

export { processarExcelMaio };