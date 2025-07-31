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
      // Baixar arquivo do Google Drive
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      const zipPath = path.join(this.extractedContentPath, `${fileId}.zip`);
      const extractPath = path.join(this.extractedContentPath, fileId);

      // Baixar arquivo
      const response = await axios({
        method: 'GET',
        url: downloadUrl,
        responseType: 'stream'
      });

      await pipelineAsync(response.data, createWriteStream(zipPath));

      // Extrair ZIP
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(extractPath, true);

      // Procurar pelo manifest
      const manifest = this.parseManifest(extractPath);
      
      // Salvar em cache
      this.scormCache.set(fileId, manifest);

      // Limpar arquivo ZIP
      fs.unlinkSync(zipPath);

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
    const manifestPath = path.join(extractPath, 'imsmanifest.xml');
    
    if (!fs.existsSync(manifestPath)) {
      // Se não há manifest, procurar por index.html
      const indexPath = path.join(extractPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        return {
          title: 'Conteúdo SCORM',
          identifier: path.basename(extractPath),
          href: 'index.html',
          scormType: 'scorm_1_2'
        };
      }
      throw new Error('Manifest SCORM não encontrado');
    }

    try {
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      
      // Parse básico do XML para extrair informações essenciais
      const titleMatch = manifestContent.match(/<title[^>]*>([^<]+)<\/title>/i);
      const hrefMatch = manifestContent.match(/href="([^"]+)"/i);
      const identifierMatch = manifestContent.match(/identifier="([^"]+)"/i);

      return {
        title: titleMatch ? titleMatch[1] : 'Conteúdo SCORM',
        identifier: identifierMatch ? identifierMatch[1] : path.basename(extractPath),
        href: hrefMatch ? hrefMatch[1] : 'index.html',
        scormType: manifestContent.includes('scorm_12') ? 'scorm_1_2' : 'scorm_2004'
      };
    } catch (error) {
      throw new Error('Erro ao analisar manifest SCORM');
    }
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
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .player-header {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            padding: 1rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        .player-header h1 {
            font-size: 1.2rem;
            font-weight: 600;
        }
        .status-badge {
            background: rgba(34, 197, 94, 0.2);
            color: #22c55e;
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-size: 0.75rem;
            font-weight: 500;
            border: 1px solid rgba(34, 197, 94, 0.3);
        }
        .content-frame {
            flex: 1;
            background: white;
            margin: 1rem;
            border-radius: 0.5rem;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            overflow: hidden;
            position: relative;
        }
        .loading-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 10;
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f4f6;
            border-top: 4px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 1rem;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .scorm-iframe {
            width: 100%;
            height: 100%;
            border: none;
            background: white;
        }
        .error-message {
            text-align: center;
            color: #ef4444;
            padding: 2rem;
        }
    </style>
</head>
<body>
    <div class="player-header">
        <div>
            <h1>📚 Player SCORM Integrado</h1>
        </div>
        <div class="status-badge">
            ✅ Executando
        </div>
    </div>
    
    <div class="content-frame">
        <div class="loading-overlay" id="loading">
            <div class="spinner"></div>
            <p>Carregando conteúdo SCORM...</p>
        </div>
        
        <iframe 
            id="scormFrame"
            class="scorm-iframe"
            src="${contentPath}/index.html"
            allow="autoplay; fullscreen; microphone; camera"
            allowfullscreen>
        </iframe>
    </div>

    <script>
        // SCORM API Wrapper
        window.API = {
            LMSInitialize: function(param) {
                console.log('SCORM: LMSInitialize called');
                return "true";
            },
            LMSFinish: function(param) {
                console.log('SCORM: LMSFinish called');
                return "true";
            },
            LMSGetValue: function(element) {
                console.log('SCORM: LMSGetValue called for', element);
                if (element === "cmi.core.student_name") return "Aluno do Sistema";
                if (element === "cmi.core.lesson_status") return "not attempted";
                return "";
            },
            LMSSetValue: function(element, value) {
                console.log('SCORM: LMSSetValue called', element, value);
                return "true";
            },
            LMSCommit: function(param) {
                console.log('SCORM: LMSCommit called');
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

        // SCORM 2004 API
        window.API_1484_11 = window.API;

        // Ocultar loading quando iframe carregar
        document.getElementById('scormFrame').onload = function() {
            document.getElementById('loading').style.display = 'none';
        };

        // Tratar erros de carregamento
        document.getElementById('scormFrame').onerror = function() {
            document.getElementById('loading').innerHTML = 
                '<div class="error-message"><h3>Erro ao carregar conteúdo</h3><p>Não foi possível carregar o conteúdo SCORM.</p></div>';
        };
    </script>
</body>
</html>`;
  }

  getScormData(scormId: string): ScormManifest | null {
    const fileId = scormId.replace('scorm-', '');
    return this.scormCache.get(fileId) || null;
  }

  getContentPath(driveFileId: string, relativePath: string = ''): string {
    return path.join(this.extractedContentPath, driveFileId, relativePath);
  }

  contentExists(driveFileId: string): boolean {
    const contentPath = path.join(this.extractedContentPath, driveFileId);
    return fs.existsSync(contentPath);
  }
}