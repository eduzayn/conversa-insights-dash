import express from "express";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { promises as fs } from "fs";
import path from "path";
import QRCode from "qrcode";
import { insertTranscriptSchema } from "@shared/schema";
import { IStorage } from "./storage";

export function registerRoutes(app: express.Application, storage: IStorage) {
  const router = express.Router();

  // GET /api/transcripts
  router.get("/transcripts", async (req, res) => {
    try {
      const transcripts = await storage.getAllTranscripts();
      res.json(transcripts);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar históricos" });
    }
  });

  // POST /api/transcripts
  router.post("/transcripts", async (req, res) => {
    try {
      const validatedData = insertTranscriptSchema.parse(req.body);
      const transcript = await storage.createTranscript(validatedData);
      res.status(201).json(transcript);
    } catch (error) {
      console.error("Erro ao criar transcript:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Dados inválidos" });
    }
  });

  // GET /api/transcripts/:id/pdf - VERSÃO PROFISSIONAL OTIMIZADA
  router.get("/transcripts/:id/pdf", async (req, res) => {
    try {
      const transcript = await storage.getTranscript(req.params.id);
      if (!transcript) {
        return res.status(404).json({ message: "Histórico não encontrado" });
      }

      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]); // A4 retrato
      const { width, height } = page.getSize();

      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // ---- Configurações Otimizadas ----
      const MARGIN_LEFT = 35;
      const TABLE_X = MARGIN_LEFT;
      const TABLE_WIDTH = 525;
      const HEADER_H = 18;
      const ROW_H = 15;
      const TOP_Y = height - 35;
      const BOTTOM_MARGIN = 45;

      // Colunas otimizadas
      const columns = [
        { key: "period", label: "Período", width: 40 },
        { key: "curriculo", label: "Currículo", width: 50 },
        { key: "discipline", label: "Disciplinas", width: 180 },
        { key: "ch", label: "CH", width: 35 },
        { key: "nf", label: "N.F.", width: 30 },
        { key: "situacao", label: "Situação", width: 55 },
        { key: "docente", label: "Docente", width: 90 },
        { key: "titulacao", label: "Titulação", width: 45 },
      ];

      const pad = 2;

      // ---- Funções Auxiliares ----
      const centerInPage = (text: string, size: number, fnt = boldFont) =>
        (width - fnt.widthOfTextAtSize(text, size)) / 2;

      const centerInBox = (boxX: number, boxW: number, text: string, size: number, fnt = boldFont) =>
        boxX + (boxW - fnt.widthOfTextAtSize(text, size)) / 2;

      const normalizeText = (text: string) => {
        return text
          .replace(/[àáâãäå]/g, 'a')
          .replace(/[èéêë]/g, 'e')
          .replace(/[ìíîï]/g, 'i')
          .replace(/[òóôõö]/g, 'o')
          .replace(/[ùúûü]/g, 'u')
          .replace(/[ýÿ]/g, 'y')
          .replace(/[ñ]/g, 'n')
          .replace(/[ç]/g, 'c')
          .replace(/[ÀÁÂÃÄÅ]/g, 'A')
          .replace(/[ÈÉÊË]/g, 'E')
          .replace(/[ÌÍÎÏ]/g, 'I')
          .replace(/[ÒÓÔÕÖ]/g, 'O')
          .replace(/[ÙÚÛÜ]/g, 'U')
          .replace(/[Ñ]/g, 'N')
          .replace(/[Ç]/g, 'C');
      };

      const fit = (text: string, cellW: number, fnt: any, size: number) => {
        const normalizedText = normalizeText(text);
        const maxW = cellW - 2 * pad;
        if (fnt.widthOfTextAtSize(normalizedText, size) <= maxW) return normalizedText;
        let s = normalizedText ?? "";
        while (s.length && fnt.widthOfTextAtSize(s + "...", size) > maxW) s = s.slice(0, -1);
        return s + "...";
      };

      const toBR = (d: any) => {
        const date = typeof d === "string" ? new Date(d) : d instanceof Date ? d : new Date(String(d));
        const dd = String(date.getDate()).padStart(2, "0");
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const yyyy = date.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
      };

      // Função para criar boxes profissionais
      const drawInfoBox = (pg: any, x: number, y: number, w: number, h: number, 
                          title: string = "", isHeader: boolean = false) => {
        pg.drawRectangle({
          x, y: y - h, width: w, height: h,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
          color: isHeader ? rgb(0.85, 0.85, 0.85) : rgb(0.97, 0.97, 0.97),
        });

        if (title) {
          pg.drawText(title, {
            x: x + 5, y: y - 15,
            size: 10, font: boldFont,
          });
        }
        return y - h;
      };

      // Cabeçalho da tabela profissional
      const drawProfessionalTableHeader = (pg: any, y: number) => {
        pg.drawRectangle({
          x: TABLE_X, y: y - HEADER_H,
          width: TABLE_WIDTH, height: HEADER_H,
          borderColor: rgb(0, 0, 0), borderWidth: 1.5,
          color: rgb(0.8, 0.8, 0.8),
        });

        let cx = TABLE_X;
        for (const col of columns) {
          pg.drawLine({
            start: { x: cx, y: y - HEADER_H },
            end: { x: cx, y: y },
            thickness: 1.5, color: rgb(0, 0, 0),
          });

          pg.drawText(col.label, {
            x: cx + pad, y: y - HEADER_H + 6,
            size: 9, font: boldFont,
          });
          cx += col.width;
        }

        pg.drawLine({
          start: { x: TABLE_X + TABLE_WIDTH, y: y - HEADER_H },
          end: { x: TABLE_X + TABLE_WIDTH, y },
          thickness: 1.5, color: rgb(0, 0, 0),
        });

        return y - HEADER_H;
      };

      // Linha da tabela profissional
      const drawProfessionalRow = (pg: any, y: number, row: Record<string, any>, isEven: boolean) => {
        pg.drawRectangle({
          x: TABLE_X, y: y - ROW_H,
          width: TABLE_WIDTH, height: ROW_H,
          borderColor: rgb(0, 0, 0), borderWidth: 0.8,
          color: isEven ? rgb(0.98, 0.98, 0.98) : rgb(1, 1, 1),
        });

        let cx = TABLE_X;
        for (const col of columns) {
          pg.drawLine({
            start: { x: cx, y: y - ROW_H },
            end: { x: cx, y: y },
            thickness: 0.8, color: rgb(0, 0, 0),
          });

          const value = (row[col.key] ?? "").toString();
          const textToShow = col.key === "titulacao" ? value : fit(value, col.width, font, 8);

          pg.drawText(textToShow, {
            x: cx + pad, y: y - 10,
            size: 8, font,
          });
          cx += col.width;
        }

        pg.drawLine({
          start: { x: TABLE_X + TABLE_WIDTH, y: y - ROW_H },
          end: { x: TABLE_X + TABLE_WIDTH, y },
          thickness: 0.8, color: rgb(0, 0, 0),
        });

        return y - ROW_H;
      };

      // Nova página com cabeçalho
      const newPageWithTableHeader = () => {
        const newPg = pdfDoc.addPage([595, 842]);
        const { width: w, height: h } = newPg.getSize();
        let y = h - 40;

        // Logo (se existir)
        try {
          const logoPath = path.join(process.cwd(), "attached_assets", "Logo-FADYC_1755099201804.png");
          const logoBytes = await fs.readFile(logoPath);
          const logoImg = await pdfDoc.embedPng(logoBytes);
          const dims = logoImg.scale(0.04);
          newPg.drawImage(logoImg, { 
            x: 40, y: y - 35, 
            width: dims.width, height: dims.height 
          });
        } catch {}

        const ies = "FACULDADE DYNAMUS DE CAMPINAS - FADYC";
        newPg.drawText(ies, {
          x: centerInPage(ies, 14),
          y: y - 5, size: 14, font: boldFont,
        });
        y -= 35;

        const discText = "DISCIPLINAS CURSADAS";
        newPg.drawText(discText, {
          x: centerInPage(discText, 12),
          y, size: 12, font: boldFont,
        });
        y -= 15;

        y = drawProfessionalTableHeader(newPg, y);
        return { pg: newPg, y, w, h };
      };

      // ---- INÍCIO DO DOCUMENTO ----
      let y = TOP_Y;

      // Logo no cabeçalho
      try {
        const logoPath = path.join(process.cwd(), "attached_assets", "Logo-FADYC_1755099201804.png");
        const logoBytes = await fs.readFile(logoPath);
        const logoImg = await pdfDoc.embedPng(logoBytes);
        const dims = logoImg.scale(0.04);
        page.drawImage(logoImg, { 
          x: 40, y: y - 35, 
          width: dims.width, height: dims.height 
        });
      } catch {}

      // Título da IES
      const iesText = "FACULDADE DYNAMUS DE CAMPINAS - FADYC";
      page.drawText(iesText, {
        x: centerInPage(iesText, 14), y: y - 5,
        size: 14, font: boldFont,
      });
      y -= 40;

      // Informações institucionais compactas
      const inst1 = "Razão Social da Mantenedora da IES: ZAYN INSTITUTO MINEIRO DE FORMAÇÃO CONTINUADA";
      page.drawText(inst1, { x: centerInPage(inst1, 7, font), y, size: 7, font });
      y -= 10;

      const inst2 = "CNPJ da Mantenedora da IES: 18.572.302.0001/09";
      page.drawText(inst2, { x: centerInPage(inst2, 8, font), y, size: 8, font });
      y -= 10;

      const inst3 = "Credenciamento por Portaria nº 887 de 29/12/2016";
      page.drawText(inst3, { x: centerInPage(inst3, 7, font), y, size: 7, font });
      y -= 25;

      // Título do documento em box cinza
      drawInfoBox(page, TABLE_X, y, TABLE_WIDTH, 25, "", true);
      const docTitle = "HISTÓRICO ESCOLAR CURRÍCULO 102";
      page.drawText(docTitle, {
        x: centerInBox(TABLE_X, TABLE_WIDTH, docTitle, 14),
        y: y - 15, size: 14, font: boldFont,
      });
      y -= 35;

      // ---- Box do Curso ----
      const courseBoxY = drawInfoBox(page, TABLE_X, y, TABLE_WIDTH, 60);
      
      // Cabeçalho da seção curso
      page.drawRectangle({
        x: TABLE_X, y: y - 18,
        width: TABLE_WIDTH, height: 18,
        borderColor: rgb(0, 0, 0), borderWidth: 1,
        color: rgb(0.9, 0.9, 0.9),
      });
      
      page.drawText("CURSO:", {
        x: TABLE_X + 5, y: y - 12,
        size: 10, font: boldFont,
      });

      page.drawText("Tecnologia em Gestão Pública - Cód. MEC 1418453", {
        x: TABLE_X + 5, y: y - 32, size: 9, font
      });
      page.drawText("AUTORIZAÇÃO: Portaria nº 1042 de 08/12/2022, Publicado no D.O.U de 09/12/2022", {
        x: TABLE_X + 5, y: y - 44, size: 9, font
      });
      page.drawText("RECONHECIMENTO: Portaria nº 1042 de 08/12/2002", {
        x: TABLE_X + 5, y: y - 56, size: 9, font
      });
      y = courseBoxY - 10;

      // ---- Dados do Aluno ----
      drawInfoBox(page, TABLE_X, y, TABLE_WIDTH, 25);
      
      const nome = `NOME: ${normalizeText(transcript.studentName || "—")}`;
      page.drawText(fit(nome, 280, font, 9), { x: TABLE_X + 5, y: y - 12, size: 9, font });
      page.drawText(`CPF: ${transcript.cpf || "—"}`, { x: TABLE_X + 320, y: y - 12, size: 9, font });
      page.drawText(`MATRÍCULA: ${transcript.matricula || "—"}`, { x: TABLE_X + 440, y: y - 12, size: 9, font });
      y -= 35;

      // Documento de identidade
      page.drawText("DOCUMENTO DE IDENTIDADE", { x: TABLE_X + 5, y, size: 10, font: boldFont });
      y -= 12;
      const rgOrg = (transcript.rgOrgao || "").toString().trim().toUpperCase();
      page.drawText(`NÚMERO - ÓRGÃO EXPEDIDOR / UF: ${transcript.rg || "—"} - ${rgOrg}`, {
        x: TABLE_X + 5, y, size: 9, font,
      });
      y -= 18;

      // Dados pessoais em uma linha
      page.drawText(`DATA DE NASCIMENTO: ${toBR(transcript.birthDate)}`, { x: TABLE_X + 5, y, size: 9, font });
      page.drawText(`NATURAL: ${transcript.naturalidade}`, { x: TABLE_X + 220, y, size: 9, font });
      page.drawText(`NACIONALIDADE: ${transcript.nacionalidade}`, { x: TABLE_X + 380, y, size: 9, font });
      y -= 18;

      // Admissão
      page.drawText("FORMA DE ADMISSÃO: Seleção Simplificada", { x: TABLE_X + 5, y, size: 9, font });
      page.drawText("MÊS/ANO DO INGRESSO: 01/2025", { x: TABLE_X + 320, y, size: 9, font });
      y -= 25;

      // ---- Seção: Disciplinas ----
      const sectionTitle = "DISCIPLINAS CURSADAS";
      page.drawText(sectionTitle, { x: centerInPage(sectionTitle, 12), y, size: 12, font: boldFont });
      y -= 15;

      y = drawProfessionalTableHeader(page, y);

      // Dados das disciplinas
      const subjectGrades = Array.isArray(transcript.subjectGrades)
        ? transcript.subjectGrades
        : JSON.parse(transcript.subjectGrades || "[]");

      const periodYear = 
        (transcript.courseEndDate && String(transcript.courseEndDate).slice(0, 4)) ||
        (transcript.courseStartDate && String(transcript.courseStartDate).slice(0, 4)) ||
        "2025";

      let curriculoBase = 782;
      let currentPage = page;
      let currentY = y;

      const ensureSpace = (needed: number) => {
        const minLinesBeforeBreak = 3;
        const spaceFor3Lines = minLinesBeforeBreak * ROW_H;
        
        if (currentY - needed < BOTTOM_MARGIN || 
            (currentY - spaceFor3Lines < BOTTOM_MARGIN && needed > ROW_H)) {
          const np = newPageWithTableHeader();
          currentPage = np.pg;
          currentY = np.y;
        }
      };

      // Renderizar linhas da tabela
      subjectGrades.forEach((s: any, idx: number) => {
        ensureSpace(ROW_H);

        const gradeNum = typeof s.grade === "number" ? s.grade : Number(s.grade || 0);
        const situation = gradeNum >= 6 ? "Aprovado" : "Reprovado";
        const qual = (s.qualification || s.degree || "").toLowerCase();
        const titulacao = /dout/.test(qual) ? "Dout." : /mestr/.test(qual) ? "Mest." : "Esp.";

        const row = {
          period: periodYear,
          curriculo: (s.curriculumCode ?? curriculoBase + idx).toString(),
          discipline: s.name || "—",
          ch: (s.workload ?? s.hours ?? 0).toString(),
          nf: Number.isFinite(gradeNum) ? String(gradeNum) : "0",
          situacao: situation,
          docente: s.teacher || "—",
          titulacao,
        };

        currentY = drawProfessionalRow(currentPage, currentY, row, idx % 2 === 0);
      });

      // ---- SITUAÇÕES DISCENTES ----
      ensureSpace(80);
      currentY -= 25;

      const situacoesTitle = "SITUAÇÕES DISCENTES";
      currentPage.drawText(situacoesTitle, {
        x: centerInPage(situacoesTitle, 12),
        y: currentY, size: 12, font: boldFont,
      });
      currentY -= 20;

      // Box para situação atual
      drawInfoBox(currentPage, TABLE_X, currentY, TABLE_WIDTH, 25);
      currentPage.drawText(`Período Letivo: ${periodYear}`, { x: TABLE_X + 5, y: currentY - 12, size: 10, font });
      currentPage.drawText("Situação: Formado", { x: TABLE_X + 400, y: currentY - 12, size: 10, font: boldFont });
      currentY -= 35;

      // ---- Box das Datas Importantes ----
      const endDate = transcript.courseEndDate || "2025-01-10";
      
      drawInfoBox(currentPage, TABLE_X, currentY, TABLE_WIDTH, 50);
      
      // Cabeçalho das datas
      currentPage.drawRectangle({
        x: TABLE_X, y: currentY - 18,
        width: TABLE_WIDTH, height: 18,
        borderColor: rgb(0, 0, 0), borderWidth: 1,
        color: rgb(0.9, 0.9, 0.9),
      });
      
      currentPage.drawText("Situação atual: Formado", {
        x: centerInBox(TABLE_X, TABLE_WIDTH, "Situação atual: Formado", 12),
        y: currentY - 12, size: 12, font: boldFont,
      });

      // Grid de 3 colunas para as datas
      const dateColumns = [
        { title: "DATA DA CONCLUSÃO", value: toBR(endDate), x: TABLE_X + 15 },
        { title: "DATA DA COLAÇÃO DE GRAU", value: toBR(endDate), x: TABLE_X + 195 },
        { title: "DATA DA EXPEDIÇÃO DO DIPLOMA", value: toBR(endDate), x: TABLE_X + 375 }
      ];

      dateColumns.forEach(col => {
        currentPage.drawText(col.title, {
          x: col.x, y: currentY - 32, size: 8, font: boldFont,
        });
        currentPage.drawText(col.value, {
          x: col.x, y: currentY - 45, size: 10, font: boldFont,
        });
      });
      currentY -= 60;

      // Carga horária
      const totalHours = subjectGrades.reduce((acc: number, s: any) => acc + (s.workload ?? s.hours ?? 0), 0);
      currentPage.drawText(`Carga horária do curso: ${totalHours}h`, { x: TABLE_X + 5, y: currentY, size: 9, font });
      currentPage.drawText("Percentual da carga horária cumprida: 100%", { x: TABLE_X + 300, y: currentY, size: 9, font });
      currentY -= 12;
      currentPage.drawText(`Carga horária integralizada: ${totalHours}h`, { x: TABLE_X + 5, y: currentY, size: 9, font });
      currentY -= 20;

      // Texto sobre currículo
      const curriculumText = [
        "Currículo integralizado conforme organização curricular preconizada nos",
        "Capítulos III, V e VI da Resolução CNE/CP nº 2, de 20 de dezembro de 2019,",
        "que definiu as DCNS para a Formação Inicial de Professores para a",
        "Educação Básica e instituiu a BNC-Formação.",
      ];

      curriculumText.forEach((line) => {
        currentPage.drawText(line, { x: TABLE_X + 5, y: currentY, size: 8, font });
        currentY -= 10;
      });
      currentY -= 15;

      // ---- INFORMAÇÕES ADICIONAIS ----
      const infoTitle = "INFORMAÇÕES ADICIONAIS";
      currentPage.drawText(infoTitle, {
        x: centerInPage(infoTitle, 12), y: currentY,
        size: 12, font: boldFont,
      });
      currentY -= 15;

      currentPage.drawText("Para validação faça a leitura do QRCode ou acesse o site abaixo e digite o código.",
        { x: TABLE_X + 5, y: currentY, size: 8, font });
      currentY -= 10;

      currentPage.drawText("URL validação: https://validador.eduzayn.com.br/", 
        { x: TABLE_X + 5, y: currentY, size: 8, font });
      currentY -= 15;

      // QR Code
      const validationCode = Math.random().toString(36).substr(2, 15);
      let qrHeight = 35;
      
      try {
        const qrCodeDataURL = await QRCode.toDataURL(`https://validador.eduzayn.com.br/validate/${validationCode}`);
        const qrBase64 = qrCodeDataURL.replace("data:image/png;base64,", "");
        const qrImage = await pdfDoc.embedPng(Buffer.from(qrBase64, "base64"));
        const qrDims = qrImage.scale(0.4);
        qrHeight = qrDims.height;

        currentPage.drawImage(qrImage, {
          x: TABLE_X + 5, y: currentY - qrHeight,
          width: qrDims.width, height: qrDims.height,
        });

        currentPage.drawText(`Código: ${validationCode}`, { 
          x: TABLE_X + 100, y: currentY - 10, size: 9, font: boldFont 
        });
      } catch (error) {
        console.error("Erro ao gerar QR Code:", error);
        currentPage.drawText(`Código: ${validationCode}`, { 
          x: TABLE_X + 5, y: currentY - 10, size: 9, font: boldFont 
        });
      }

      // Data e hora de emissão
      const now = new Date();
      const emissionDateTime = `${now.getDate().toString().padStart(2, "0")}/${(now.getMonth() + 1).toString().padStart(2, "0")}/${now.getFullYear()}, ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

      currentPage.drawText(`Data e hora de emissão: ${emissionDateTime}`, {
        x: TABLE_X + 250, y: currentY - qrHeight / 2,
        size: 8, font,
      });

      // Gerar PDF final
      const pdfBytes = await pdfDoc.save();

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="historico_${transcript.studentName.replace(/\s+/g, "_")}_${Date.now()}.pdf"`);
      res.send(Buffer.from(pdfBytes));

    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      res.status(500).json({ message: "Erro ao gerar PDF" });
    }
  });

  // DELETE /api/transcripts/:id
  router.delete("/transcripts/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTranscript(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Histórico não encontrado" });
      }
      res.json({ message: "Histórico excluído com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir histórico" });
    }
  });

  app.use("/api", router);
}