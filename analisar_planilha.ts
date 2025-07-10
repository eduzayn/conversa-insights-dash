import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

function analisarPlanilha(caminhoArquivo: string) {
  console.log(`🔍 Analisando estrutura da planilha: ${caminhoArquivo}`);
  
  if (!fs.existsSync(caminhoArquivo)) {
    console.log(`❌ Arquivo não encontrado: ${caminhoArquivo}`);
    return;
  }

  const workbook = XLSX.readFile(caminhoArquivo);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  console.log(`📋 Planilha: ${sheetName}`);
  
  // Converter para JSON para ver a estrutura
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  console.log('📊 Primeiras 5 linhas:');
  for (let i = 0; i < Math.min(5, jsonData.length); i++) {
    console.log(`Linha ${i + 1}:`, jsonData[i]);
  }
  
  // Análise dos cabeçalhos
  if (jsonData.length > 0) {
    console.log('\n📑 Cabeçalhos identificados:');
    const headers = jsonData[0];
    if (Array.isArray(headers)) {
      headers.forEach((header, index) => {
        console.log(`  Coluna ${index + 1}: ${header}`);
      });
    }
  }
  
  console.log(`\n📈 Total de linhas: ${jsonData.length}`);
  console.log(`📊 Total de colunas: ${Array.isArray(jsonData[0]) ? jsonData[0].length : 0}`);
}

// Analisar o arquivo mais recente
const arquivoTeste = 'attached_assets/ANÁLISES PARA CERTIFICAÇÃO e DECLARAÇÕES_____ (10)_1752171021515.xlsx';
analisarPlanilha(arquivoTeste);