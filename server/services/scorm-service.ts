import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { createWriteStream } from 'fs';
import { promisify } from 'util';
import { pipeline } from 'stream';
import AdmZip from 'adm-zip';

const pipelineAsync = promisify(pipeline);

interface ScormManifest {
  title: string;
  identifier: string;
  href: string;
  scormType: string;
}

export class ScormService {
  private static instance: ScormService;
  private scormCache: Map<string, ScormManifest> = new Map();
  private extractedContentPath = path.join(process.cwd(), 'temp', 'scorm');

  private constructor() {
    // Criar diretório de conteúdo SCORM se não existir
    if (!fs.existsSync(this.extractedContentPath)) {
      fs.mkdirSync(this.extractedContentPath, { recursive: true });
    }
  }

  static getInstance(): ScormService {
    if (!ScormService.instance) {
      ScormService.instance = new ScormService();
    }
    return ScormService.instance;
  }

  async extractScormFromDriveUrl(driveUrl: string): Promise<ScormManifest> {
    const fileId = this.extractDriveFileId(driveUrl);
    if (!fileId) {
      throw new Error('ID do arquivo do Google Drive não encontrado');
    }

    // Verificar se já está em cache
    if (this.scormCache.has(fileId)) {
      return this.scormCache.get(fileId)!;
    }

    try {
      // Tentar diferentes URLs de download do Google Drive
      const downloadUrls = [
        `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`,
        `https://drive.google.com/file/d/${fileId}/edit?usp=sharing&export=download`,
        `https://drive.google.com/uc?id=${fileId}&export=download`
      ];

      let success = false;
      let extractPath = path.join(this.extractedContentPath, fileId);

      for (const downloadUrl of downloadUrls) {
        try {
          console.log(`🔄 Tentando baixar de: ${downloadUrl}`);
          const zipPath = path.join(this.extractedContentPath, `${fileId}.zip`);
          
          // Baixar arquivo
          const response = await axios({
            method: 'GET',
            url: downloadUrl,
            responseType: 'stream',
            timeout: 30000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          await pipelineAsync(response.data, createWriteStream(zipPath));
          
          // Verificar se é um arquivo ZIP válido
          const stats = fs.statSync(zipPath);
          console.log(`📁 Arquivo baixado: ${stats.size} bytes`);
          
          if (stats.size < 1000) {
            console.log('⚠️ Arquivo muito pequeno, provavelmente não é um ZIP válido');
            fs.unlinkSync(zipPath);
            continue;
          }

          try {
            // Tentar extrair ZIP
            const zip = new AdmZip(zipPath);
            const entries = zip.getEntries();
            
            console.log(`📦 Encontradas ${entries.length} entradas no ZIP`);
            entries.forEach(entry => {
              console.log(`  - ${entry.entryName} (${entry.header.size} bytes)`);
            });
            
            // Verificar se tem conteúdo SCORM válido
            const hasManifest = entries.some(entry => entry.entryName.toLowerCase().includes('imsmanifest.xml'));
            const hasIndex = entries.some(entry => entry.entryName.toLowerCase().includes('index.html'));
            
            if (!hasManifest && !hasIndex) {
              console.log('⚠️ Arquivo ZIP não contém estrutura SCORM válida');
              fs.unlinkSync(zipPath);
              continue;
            }

            zip.extractAllTo(extractPath, true);
            success = true;
            fs.unlinkSync(zipPath);
            break;
            
          } catch (zipError) {
            console.log('❌ Erro ao extrair ZIP:', zipError);
            if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
            continue;
          }
          
        } catch (downloadError) {
          console.log(`❌ Erro no download da URL: ${downloadError}`);
          continue;
        }
      }

      if (!success) {
        throw new Error('Não foi possível baixar e extrair o conteúdo SCORM de nenhuma URL');
      }

      // Procurar pelo manifest
      const manifest = this.parseManifest(extractPath);
      
      // Salvar em cache
      this.scormCache.set(fileId, manifest);

      return manifest;
    } catch (error) {
      console.error('Erro ao extrair SCORM:', error);
      throw new Error('Falha ao processar conteúdo SCORM');
    }
  }

  private extractDriveFileId(url: string): string | null {
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9-_]+)/,
      /id=([a-zA-Z0-9-_]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  private parseManifest(extractPath: string): ScormManifest {
    console.log('🔍 Analisando diretório extraído:', extractPath);
    
    // Listar todos os arquivos para debug
    const allFiles = this.listFilesRecursively(extractPath);
    console.log('📁 Arquivos encontrados:', allFiles.map(f => path.relative(extractPath, f)));
    
    const manifestPath = path.join(extractPath, 'imsmanifest.xml');
    
    if (!fs.existsSync(manifestPath)) {
      console.log('❌ Manifest não encontrado, procurando index.html...');
      
      // Procurar index.html em qualquer lugar
      const indexFile = allFiles.find(file => path.basename(file).toLowerCase() === 'index.html');
      
      if (indexFile) {
        const relativePath = path.relative(extractPath, indexFile);
        console.log('✅ Index.html encontrado em:', relativePath);
        
        return {
          title: 'Conteúdo SCORM',
          identifier: path.basename(extractPath),
          href: relativePath.replace(/\\/g, '/'), // Normalizar separadores para web
          scormType: 'scorm_1_2'
        };
      }
      
      // Se não encontrou index.html, usar o primeiro arquivo HTML
      const htmlFile = allFiles.find(file => file.toLowerCase().endsWith('.html'));
      if (htmlFile) {
        const relativePath = path.relative(extractPath, htmlFile);
        console.log('📄 Arquivo HTML encontrado:', relativePath);
        
        return {
          title: 'Conteúdo SCORM',
          identifier: path.basename(extractPath),
          href: relativePath.replace(/\\/g, '/'),
          scormType: 'scorm_1_2'
        };
      }
      
      throw new Error('Nenhum arquivo HTML encontrado no pacote SCORM');
    }

    try {
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      console.log('✅ Manifest lido com sucesso');
      
      // Parse básico do XML para extrair informações essenciais
      const titleMatch = manifestContent.match(/<title[^>]*>([^<]+)<\/title>/i);
      const hrefMatch = manifestContent.match(/href="([^"]+)"/i);
      const identifierMatch = manifestContent.match(/identifier="([^"]+)"/i);

      const href = hrefMatch ? hrefMatch[1] : 'index.html';
      console.log('🎯 HREF do manifest:', href);

      return {
        title: titleMatch ? titleMatch[1] : 'Conteúdo SCORM',
        identifier: identifierMatch ? identifierMatch[1] : path.basename(extractPath),
        href: href,
        scormType: manifestContent.includes('scorm_12') ? 'scorm_1_2' : 'scorm_2004'
      };
    } catch (error) {
      console.error('❌ Erro ao analisar manifest:', error);
      throw new Error('Erro ao analisar manifest SCORM');
    }
  }

  private listFilesRecursively(dir: string): string[] {
    const files: string[] = [];
    
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          files.push(...this.listFilesRecursively(fullPath));
        } else {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.error('Erro ao listar arquivos em:', dir, error);
    }
    
    return files;
  }

  generateScormPlayer(scormId: string, driveFileId: string): string {
    const contentPath = `/api/scorm/content/${driveFileId}`;
    
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Player SCORM</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            background: #f5f5f5;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            min-height: 100vh;
            overflow: hidden;
        }
        
        .scorm-container {
            width: 100%;
            height: 100vh;
            position: relative;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .scorm-header {
            background: rgba(255, 255, 255, 0.95);
            padding: 10px 20px;
            border-bottom: 1px solid #ddd;
            display: flex;
            justify-content: space-between;
            align-items: center;
            backdrop-filter: blur(10px);
            position: relative;
            z-index: 10;
        }
        
        .scorm-title {
            font-size: 16px;
            font-weight: 600;
            color: #333;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .scorm-badge {
            background: #10b981;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .scorm-progress {
            background: rgba(255, 255, 255, 0.9);
            padding: 8px 20px;
            border-bottom: 1px solid #ddd;
            display: flex;
            align-items: center;
            gap: 15px;
            font-size: 14px;
            color: #666;
        }
        
        .progress-bar {
            flex: 1;
            height: 6px;
            background: #e5e7eb;
            border-radius: 3px;
            overflow: hidden;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #10b981, #059669);
            width: 0%;
            transition: width 0.3s ease;
        }
        
        .scorm-iframe {
            width: 100%;
            height: calc(100vh - 100px);
            border: none;
            background: white;
            display: block;
        }
        
        .scorm-controls {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 255, 255, 0.95);
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            text-align: center;
            backdrop-filter: blur(10px);
            max-width: 400px;
            width: 90%;
        }
        
        .scorm-icon {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
        }
        
        .scorm-loading {
            font-size: 18px;
            font-weight: 600;
            color: #333;
            margin-bottom: 10px;
        }
        
        .scorm-description {
            color: #666;
            margin-bottom: 25px;
            line-height: 1.5;
        }
        
        .start-button {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s ease;
        }
        
        .start-button:hover {
            transform: translateY(-2px);
        }
        
        .hidden {
            display: none !important;
        }
    </style>
</head>
<body>
    <div class="scorm-container">
        <!-- Header -->
        <div class="scorm-header">
            <div class="scorm-title">
                <span>📚</span>
                E-book Interativo SCORM
            </div>
            <div class="scorm-badge">SCORM Ativo</div>
        </div>
        
        <!-- Progress Bar -->
        <div class="scorm-progress">
            <span>Progresso:</span>
            <div class="progress-bar">
                <div class="progress-fill" id="progressFill"></div>
            </div>
            <span id="progressText">0%</span>
        </div>
        
        <!-- Start Screen -->
        <div class="scorm-controls" id="startScreen">
            <div class="scorm-icon">🎓</div>
            <div class="scorm-loading">Relacionamento Interpessoal e Comunicação</div>
            <div class="scorm-description">
                Conteúdo interativo SCORM com acompanhamento de progresso e avaliações integradas.
            </div>
            <button class="start-button" onclick="startScorm()">
                ✨ Iniciar Conteúdo
            </button>
        </div>
        
        <!-- SCORM Content -->
        <iframe 
            id="scormFrame"
            class="scorm-iframe hidden"
            src="${contentPath}/index.html"
            allow="autoplay; fullscreen; microphone; camera; clipboard-read; clipboard-write"
            allowfullscreen>
        </iframe>
    </div>

    <script>
        // Estado do SCORM
        let scormData = {
            initialized: false,
            lessonStatus: 'not attempted',
            score: 0,
            completionStatus: 'incomplete',
            successStatus: 'unknown',
            sessionTime: 0,
            totalTime: 0,
            suspendData: '',
            studentName: 'Aluno do Sistema'
        };
        
        // SCORM 1.2 API Implementation
        window.API = {
            LMSInitialize: function(param) {
                console.log('🚀 SCORM: LMSInitialize called');
                scormData.initialized = true;
                updateProgress(5);
                return "true";
            },
            
            LMSFinish: function(param) {
                console.log('✅ SCORM: LMSFinish called');
                scormData.initialized = false;
                updateProgress(100);
                return "true";
            },
            
            LMSGetValue: function(element) {
                console.log('📖 SCORM: LMSGetValue called for', element);
                
                switch(element) {
                    case "cmi.core.student_id":
                        return "student_001";
                    case "cmi.core.student_name":
                        return scormData.studentName;
                    case "cmi.core.lesson_location":
                        return "0";
                    case "cmi.core.lesson_status":
                        return scormData.lessonStatus;
                    case "cmi.core.score.raw":
                        return scormData.score.toString();
                    case "cmi.core.score.max":
                        return "100";
                    case "cmi.core.score.min":
                        return "0";
                    case "cmi.core.total_time":
                        return scormData.totalTime.toString();
                    case "cmi.core.lesson_mode":
                        return "normal";
                    case "cmi.core.credit":
                        return "credit";
                    case "cmi.core.entry":
                        return "ab-initio";
                    case "cmi.suspend_data":
                        return scormData.suspendData;
                    default:
                        return "";
                }
            },
            
            LMSSetValue: function(element, value) {
                console.log('💾 SCORM: LMSSetValue called', element, '=', value);
                
                switch(element) {
                    case "cmi.core.lesson_status":
                        scormData.lessonStatus = value;
                        if (value === "completed" || value === "passed") {
                            updateProgress(100);
                        } else if (value === "incomplete") {
                            updateProgress(50);
                        }
                        break;
                    case "cmi.core.score.raw":
                        scormData.score = parseInt(value) || 0;
                        updateProgress(Math.min(scormData.score, 100));
                        break;
                    case "cmi.core.lesson_location":
                        // Atualizar localização da lição
                        break;
                    case "cmi.suspend_data":
                        scormData.suspendData = value;
                        break;
                    case "cmi.core.session_time":
                        scormData.sessionTime = value;
                        break;
                }
                
                return "true";
            },
            
            LMSCommit: function(param) {
                console.log('💿 SCORM: LMSCommit called - Salvando dados...');
                // Aqui você pode salvar os dados no banco se necessário
                return "true";
            },
            
            LMSGetLastError: function() { 
                return "0"; 
            },
            
            LMSGetErrorString: function(errorCode) { 
                return "No Error"; 
            },
            
            LMSGetDiagnostic: function(errorCode) { 
                return ""; 
            }
        };
        
        // SCORM 2004 API (Alias)
        window.API_1484_11 = window.API;
        
        // Funções auxiliares
        function startScorm() {
            document.getElementById('startScreen').classList.add('hidden');
            document.getElementById('scormFrame').classList.remove('hidden');
            updateProgress(10);
        }
        
        function updateProgress(percentage) {
            const fill = document.getElementById('progressFill');
            const text = document.getElementById('progressText');
            
            if (fill && text) {
                fill.style.width = percentage + '%';
                text.textContent = percentage + '%';
            }
        }
        
        // Monitorar eventos do iframe
        window.addEventListener('message', function(event) {
            if (event.data && event.data.type === 'scorm') {
                console.log('📡 Mensagem SCORM recebida:', event.data);
                
                if (event.data.action === 'progress') {
                    updateProgress(event.data.value);
                }
            }
        });
        
        // Inicialização automática após alguns segundos se não houver interação
        setTimeout(function() {
            const startScreen = document.getElementById('startScreen');
            if (startScreen && !startScreen.classList.contains('hidden')) {
                startScorm();
            }
        }, 3000);
        
        console.log('🎯 SCORM Player carregado e pronto para uso!');
    </script>
</body>
</html>`;
  }

  getScormData(scormId: string): ScormManifest | null {
    const fileId = scormId.replace('scorm-', '');
    return this.scormCache.get(fileId) || null;
  }

  getContentPath(driveFileId: string, relativePath: string = ''): string {
    const fullPath = path.join(this.extractedContentPath, driveFileId, relativePath);
    console.log('🔍 Buscando arquivo:', {
      driveFileId,
      relativePath,
      fullPath,
      exists: fs.existsSync(fullPath)
    });
    
    // Se o arquivo não existe, listar o que existe no diretório
    if (!fs.existsSync(fullPath)) {
      const baseDir = path.join(this.extractedContentPath, driveFileId);
      if (fs.existsSync(baseDir)) {
        console.log('📁 Arquivos disponíveis no diretório base:', fs.readdirSync(baseDir));
        
        // Se está procurando index.html, procurar recursivamente
        if (relativePath === 'index.html' || relativePath === '') {
          const allFiles = this.listFilesRecursively(baseDir);
          const indexFile = allFiles.find(file => path.basename(file).toLowerCase() === 'index.html');
          
          if (indexFile) {
            console.log('✅ Index.html encontrado em:', indexFile);
            return indexFile;
          }
          
          // Se não encontrou index.html, usar primeiro HTML
          const htmlFile = allFiles.find(file => file.toLowerCase().endsWith('.html'));
          if (htmlFile) {
            console.log('📄 Usando arquivo HTML:', htmlFile);
            return htmlFile;
          }
        }
      }
    }
    
    return fullPath;
  }

  contentExists(driveFileId: string): boolean {
    const contentPath = path.join(this.extractedContentPath, driveFileId);
    const exists = fs.existsSync(contentPath);
    console.log('🔍 Verificando existência do conteúdo:', {
      driveFileId,
      contentPath,
      exists
    });
    return exists;
  }
}