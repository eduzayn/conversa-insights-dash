import puppeteer from 'puppeteer';
import { DatabaseStorage } from '../lib/storage';

export interface CertificateData {
  nomeAluno: string;
  cpfAluno: string;
  nomeCurso: string;
  areaCurso: string;
  cargaHoraria: string;
  dataInicio: string;
  dataConclusao: string;
  dataEmissao: string;
  numeroRegistro: string;
  livro: string;
  folha: string;
  instituicao: string;
  instituicaoEndereco: string;
  disciplinas?: Array<{
    nome: string;
    corpo_docente: string;
    titulacao: string;
    carga_horaria: number;
    frequencia: number;
    aproveitamento: string;
  }>;
  assinaturas?: {
    coordenador?: string;
    secretario?: string;
  };
}

export class PDFService {
  private storage: DatabaseStorage;

  constructor(storage: DatabaseStorage) {
    this.storage = storage;
  }

  async generateCertificatePDF(
    certificateId: number,
    templateId: number
  ): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    try {
      // Buscar dados do certificado
      const certificate = await this.storage.getAcademicCertificateById(certificateId);
      if (!certificate) {
        throw new Error('Certificado não encontrado');
      }

      // Buscar template
      const template = await this.storage.getCertificateTemplateById(templateId);
      if (!template) {
        throw new Error('Template não encontrado');
      }

      // Buscar dados do aluno e curso
      const student = await this.storage.getAcademicStudentById(certificate.studentId);
      const course = await this.storage.getAcademicCourseById(certificate.courseId);

      if (!student || !course) {
        throw new Error('Dados do aluno ou curso não encontrados');
      }

      // Preparar dados para substituição
      const certificateData: CertificateData = {
        nomeAluno: student.nome,
        cpfAluno: student.cpf,
        nomeCurso: course.nome,
        areaCurso: course.area || 'Educação',
        cargaHoraria: String(course.cargaHoraria),
        dataInicio: course.dataInicio || new Date().toLocaleDateString('pt-BR'),
        dataConclusao: new Date().toLocaleDateString('pt-BR'),
        dataEmissao: certificate.dataEmissao || new Date().toLocaleDateString('pt-BR'),
        numeroRegistro: certificate.numeroRegistro || `CERT-${Date.now()}`,
        livro: certificate.livro || '001',
        folha: certificate.folha || String(certificate.id).padStart(3, '0'),
        instituicao: template.instituicaoNome,
        instituicaoEndereco: template.instituicaoEndereco || '',
        disciplinas: [
          {
            nome: 'Educação Especial e Inclusiva',
            corpo_docente: 'Prof. Dr. Maria Silva',
            titulacao: 'Doutora em Educação',
            carga_horaria: 60,
            frequencia: 100,
            aproveitamento: 'Aprovado'
          },
          {
            nome: 'Metodologias de Ensino',
            corpo_docente: 'Prof. Ms. João Santos',
            titulacao: 'Mestre em Pedagogia',
            carga_horaria: 80,
            frequencia: 95,
            aproveitamento: 'Aprovado'
          },
          {
            nome: 'Psicologia da Aprendizagem',
            corpo_docente: 'Prof. Dra. Ana Costa',
            titulacao: 'Doutora em Psicologia',
            carga_horaria: 60,
            frequencia: 100,
            aproveitamento: 'Aprovado'
          },
          {
            nome: 'Gestão Educacional',
            corpo_docente: 'Prof. Dr. Carlos Lima',
            titulacao: 'Doutor em Administração',
            carga_horaria: 40,
            frequencia: 90,
            aproveitamento: 'Aprovado'
          },
          {
            nome: 'Avaliação Educacional',
            corpo_docente: 'Prof. Ms. Paula Oliveira',
            titulacao: 'Mestre em Educação',
            carga_horaria: 50,
            frequencia: 100,
            aproveitamento: 'Aprovado'
          }
        ],
        assinaturas: {
          coordenador: 'Prof. Dr. Roberto Coordenador',
          secretario: 'Maria Secretária Acadêmica'
        }
      };

      // Substituir variáveis no HTML da frente
      let htmlFrente = this.replaceVariables(template.htmlTemplate, certificateData);
      
      // Substituir variáveis no HTML do verso
      let htmlVerso = this.replaceVariables(template.templateVerso, certificateData);

      // Criar HTML completo com orientação paisagem obrigatória
      const htmlCompleto = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Certificado - ${certificateData.nomeAluno}</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 20mm;
            }
            
            body {
              margin: 0;
              padding: 0;
              font-family: 'Times New Roman', serif;
              font-size: 12pt;
              line-height: 1.4;
              color: #000;
              background: white;
            }
            
            .page {
              width: 100%;
              height: 100vh;
              page-break-after: always;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              padding: 40px;
              box-sizing: border-box;
            }
            
            .page:last-child {
              page-break-after: avoid;
            }
            
            /* Estilos para frente do certificado */
            .certificate-front {
              text-align: center;
              max-width: 800px;
              margin: 0 auto;
            }
            
            .certificate-front h1 {
              font-size: 28pt;
              font-weight: bold;
              margin: 20px 0;
              color: #1a472a;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            
            .certificate-front h2 {
              font-size: 20pt;
              margin: 15px 0;
              color: #2c5530;
            }
            
            .certificate-front .institution {
              font-size: 16pt;
              font-weight: bold;
              margin: 10px 0;
              color: #1a472a;
            }
            
            .certificate-front .content {
              font-size: 14pt;
              line-height: 1.8;
              text-align: justify;
              margin: 30px 0;
              padding: 0 40px;
            }
            
            .certificate-front .signatures {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 80px;
              margin-top: 60px;
              text-align: center;
            }
            
            .signature-block {
              border-top: 2px solid #000;
              padding-top: 10px;
              font-size: 12pt;
            }
            
            .qr-code {
              position: absolute;
              bottom: 30px;
              right: 30px;
              width: 80px;
              height: 80px;
              border: 1px solid #ccc;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10pt;
            }
            
            /* Estilos para verso do certificado (histórico) */
            .certificate-back {
              max-width: 850px;
              margin: 0 auto;
              padding: 20px;
            }
            
            .certificate-back h1 {
              text-align: center;
              font-size: 20pt;
              font-weight: bold;
              margin-bottom: 30px;
              color: #1a472a;
              text-transform: uppercase;
            }
            
            .student-info {
              margin-bottom: 30px;
              font-size: 12pt;
            }
            
            .student-info table {
              width: 100%;
              border-collapse: collapse;
            }
            
            .student-info td {
              padding: 5px 10px;
              border: 1px solid #ddd;
            }
            
            .disciplines-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              font-size: 10pt;
            }
            
            .disciplines-table th,
            .disciplines-table td {
              border: 1px solid #000;
              padding: 8px 4px;
              text-align: center;
            }
            
            .disciplines-table th {
              background-color: #f0f0f0;
              font-weight: bold;
              font-size: 9pt;
            }
            
            .criteria {
              margin-top: 30px;
              font-size: 10pt;
              line-height: 1.4;
            }
            
            .criteria h3 {
              font-size: 12pt;
              font-weight: bold;
              margin-bottom: 10px;
            }
            
            .criteria ul {
              margin-left: 20px;
            }
            
            .back-signatures {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 60px;
              margin-top: 40px;
              text-align: center;
              font-size: 10pt;
            }
          </style>
        </head>
        <body>
          <!-- PÁGINA 1 - FRENTE DO CERTIFICADO -->
          <div class="page">
            <div class="certificate-front">
              ${htmlFrente}
            </div>
          </div>
          
          <!-- PÁGINA 2 - VERSO DO CERTIFICADO (HISTÓRICO) -->
          <div class="page">
            <div class="certificate-back">
              ${htmlVerso}
            </div>
          </div>
        </body>
        </html>
      `;

      const page = await browser.newPage();
      await page.setContent(htmlCompleto, { waitUntil: 'networkidle0' });

      // Gerar PDF com orientação paisagem obrigatória
      const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape: true, // ORIENTAÇÃO PAISAGEM OBRIGATÓRIA
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: '20mm',
          bottom: '20mm',
          left: '20mm',
          right: '20mm'
        }
      });

      return pdfBuffer;
    } finally {
      await browser.close();
    }
  }

  private replaceVariables(html: string, data: CertificateData): string {
    let result = html;
    
    // Substituir variáveis básicas
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'string' || typeof value === 'number') {
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, String(value));
      }
    });

    // Substituir tabela de disciplinas se existir
    if (data.disciplinas && result.includes('{{tabelaDisciplinas}}')) {
      const tabelaHTML = this.generateDisciplinesTable(data.disciplinas);
      result = result.replace(/{{tabelaDisciplinas}}/g, tabelaHTML);
    }

    // Substituir QR Code se existir
    if (result.includes('{{qrCode}}')) {
      const qrCodeHTML = `<div class="qr-code">QR Code<br>${data.numeroRegistro}</div>`;
      result = result.replace(/{{qrCode}}/g, qrCodeHTML);
    }

    return result;
  }

  private generateDisciplinesTable(disciplinas: any[]): string {
    const rows = disciplinas.map(disc => `
      <tr>
        <td>${disc.nome}</td>
        <td>${disc.corpo_docente}</td>
        <td>${disc.titulacao}</td>
        <td>${disc.carga_horaria}h</td>
        <td>${disc.frequencia}%</td>
        <td>${disc.aproveitamento}</td>
      </tr>
    `).join('');

    return `
      <table class="disciplines-table">
        <thead>
          <tr>
            <th>DISCIPLINAS</th>
            <th>CORPO DOCENTE</th>
            <th>TITULAÇÃO</th>
            <th>CARGA HORÁRIA</th>
            <th>FREQUÊNCIA</th>
            <th>APROVEITAMENTO</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }
}