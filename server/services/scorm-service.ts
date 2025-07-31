import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';

export class ScormService {
  private scormCache = new Map<string, any>();
  private static instance: ScormService;

  static getInstance(): ScormService {
    if (!ScormService.instance) {
      ScormService.instance = new ScormService();
    }
    return ScormService.instance;
  }

  // Extrai conteúdo SCORM de uma URL do Google Drive
  async extractScormFromDriveUrl(driveUrl: string): Promise<{
    id: string;
    launchUrl: string;
    title: string;
    manifestData: any;
  }> {
    try {
      // Gera ID único para o conteúdo SCORM baseado na URL
      const scormId = createHash('md5').update(driveUrl).digest('hex').substring(0, 12);
      
      // Verifica se já está em cache
      if (this.scormCache.has(scormId)) {
        return this.scormCache.get(scormId);
      }

      // Extrai ID do arquivo do Google Drive
      const driveFileId = this.extractDriveFileId(driveUrl);
      if (!driveFileId) {
        throw new Error('URL do Google Drive inválida');
      }

      // URL para download direto
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${driveFileId}`;
      
      // Simula extração do manifest SCORM (em produção, faria download e extração real)
      const scormData = {
        id: scormId,
        launchUrl: this.generateScormLaunchUrl(driveFileId, scormId),
        title: 'E-book Interativo - Relacionamento Interpessoal e Comunicação',
        manifestData: {
          version: '1.2',
          identifier: 'relacionamento-interpessoal-scorm',
          title: 'Relacionamento Interpessoal e Comunicação',
          launchPage: 'index.html',
          resources: [
            'index.html',
            'assets/',
            'resources/',
            'scripts/'
          ]
        }
      };

      // Adiciona ao cache
      this.scormCache.set(scormId, scormData);
      
      return scormData;
    } catch (error) {
      console.error('Erro ao extrair SCORM:', error);
      throw error;
    }
  }

  // Gera URL para executar SCORM
  private generateScormLaunchUrl(driveFileId: string, scormId: string): string {
    // Em produção, seria uma URL para o conteúdo extraído e hospedado
    // Por enquanto, retorna uma URL que simula o conteúdo SCORM
    return `/api/scorm/player/${scormId}?driveFileId=${driveFileId}`;
  }

  // Extrai ID do arquivo do Google Drive
  private extractDriveFileId(url: string): string | null {
    const patterns = [
      /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9-_]+)/,
      /https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9-_]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  }

  // Gera HTML do player SCORM
  generateScormPlayer(scormId: string, driveFileId: string): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Player SCORM - Relacionamento Interpessoal</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .scorm-container {
            width: 95%;
            max-width: 1200px;
            height: 85vh;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        
        .scorm-header {
            background: linear-gradient(90deg, #4f46e5, #7c3aed);
            color: white;
            padding: 15px 25px;
            display: flex;
            align-items: center;
            justify-content: between;
        }
        
        .scorm-title {
            font-size: 18px;
            font-weight: 600;
            margin: 0;
            flex-grow: 1;
        }
        
        .scorm-badge {
            background: rgba(255,255,255,0.2);
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .scorm-content {
            flex: 1;
            position: relative;
            background: #f8fafc;
        }
        
        .loading-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: #f8fafc;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 100;
        }
        
        .loading-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #e2e8f0;
            border-top: 4px solid #4f46e5;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .loading-text {
            color: #64748b;
            font-size: 16px;
            margin-bottom: 10px;
        }
        
        .loading-subtitle {
            color: #94a3b8;
            font-size: 14px;
            text-align: center;
            max-width: 400px;
        }
        
        .scorm-iframe {
            width: 100%;
            height: 100%;
            border: none;
            display: none;
        }
        
        .scorm-error {
            padding: 40px;
            text-align: center;
            color: #ef4444;
        }
        
        .progress-bar {
            width: 300px;
            height: 4px;
            background: #e2e8f0;
            border-radius: 2px;
            overflow: hidden;
            margin: 20px 0;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #4f46e5, #7c3aed);
            border-radius: 2px;
            width: 0%;
            animation: progress 3s ease-in-out;
        }
        
        @keyframes progress {
            0% { width: 0%; }
            50% { width: 60%; }
            100% { width: 100%; }
        }
    </style>
</head>
<body>
    <div class="scorm-container">
        <div class="scorm-header">
            <h1 class="scorm-title">📚 Relacionamento Interpessoal e Comunicação</h1>
            <div class="scorm-badge">SCORM 1.2</div>
        </div>
        
        <div class="scorm-content">
            <div class="loading-overlay" id="loadingOverlay">
                <div class="loading-spinner"></div>
                <div class="loading-text">Carregando conteúdo interativo...</div>
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
                <div class="loading-subtitle">
                    Preparando materiais educacionais estruturados com recursos multimídia e atividades interativas
                </div>
            </div>
            
            <iframe 
                id="scormFrame"
                class="scorm-iframe"
                src="https://drive.google.com/file/d/${driveFileId}/preview"
                allowfullscreen
                allow="autoplay; fullscreen; picture-in-picture"
            ></iframe>
        </div>
    </div>

    <script>
        // Simula carregamento do SCORM
        let progress = 0;
        const progressFill = document.querySelector('.progress-fill');
        const loadingOverlay = document.getElementById('loadingOverlay');
        const scormFrame = document.getElementById('scormFrame');
        
        // Simula progresso de carregamento
        const loadingInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(loadingInterval);
                
                // Oculta loading e mostra conteúdo
                setTimeout(() => {
                    loadingOverlay.style.display = 'none';
                    scormFrame.style.display = 'block';
                    
                    // Inicializa comunicação SCORM
                    initializeScorm();
                }, 500);
            }
        }, 200);
        
        // Funcionalidades básicas do SCORM API
        window.API = {
            LMSInitialize: function() {
                console.log('SCORM: LMSInitialize');
                return 'true';
            },
            LMSCommit: function() {
                console.log('SCORM: LMSCommit');
                return 'true';
            },
            LMSFinish: function() {
                console.log('SCORM: LMSFinish');
                return 'true';
            },
            LMSGetValue: function(element) {
                console.log('SCORM: LMSGetValue', element);
                switch(element) {
                    case 'cmi.core.student_name':
                        return 'Aluno do Sistema';
                    case 'cmi.core.lesson_status':
                        return 'not attempted';
                    default:
                        return '';
                }
            },
            LMSSetValue: function(element, value) {
                console.log('SCORM: LMSSetValue', element, value);
                return 'true';
            },
            LMSGetLastError: function() {
                return '0';
            },
            LMSGetErrorString: function(errorCode) {
                return 'No Error';
            },
            LMSGetDiagnostic: function(errorCode) {
                return 'No Error';
            }
        };
        
        function initializeScorm() {
            console.log('SCORM Player initialized successfully');
            
            // Adiciona eventos para monitorar progresso
            scormFrame.addEventListener('load', function() {
                console.log('SCORM content loaded');
                
                // Tenta injetar API SCORM no iframe (se mesmo domínio)
                try {
                    if (scormFrame.contentWindow) {
                        scormFrame.contentWindow.API = window.API;
                    }
                } catch (e) {
                    console.log('Cross-origin iframe - API SCORM externa');
                }
            });
        }
        
        // Escuta mensagens do iframe
        window.addEventListener('message', function(event) {
            if (event.data && event.data.type === 'scorm') {
                console.log('SCORM Message:', event.data);
                
                // Aqui poderia enviar dados para o servidor
                if (event.data.action === 'setScore') {
                    // Salvar pontuação do aluno
                }
                if (event.data.action === 'complete') {
                    // Marcar como concluído
                }
            }
        });
    </script>
</body>
</html>`;
  }

  // Obtém dados do SCORM
  getScormData(scormId: string) {
    return this.scormCache.get(scormId);
  }
}