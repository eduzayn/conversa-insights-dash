import { useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Download, Share2 } from "lucide-react";

interface QRCodeGeneratorProps {
  data: string;
  title: string;
  description?: string;
  size?: number;
  className?: string;
}

export function QRCodeGenerator({ 
  data, 
  title, 
  description, 
  size = 200, 
  className = "" 
}: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Função simples para gerar QR Code (usando canvas)
  const generateQRCode = (text: string, canvas: HTMLCanvasElement, size: number) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar canvas
    canvas.width = size;
    canvas.height = size;
    
    // Fundo branco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    
    // QR Code básico (matriz 25x25)
    const moduleSize = size / 25;
    const modules = generateQRMatrix(text);
    
    ctx.fillStyle = '#000000';
    for (let row = 0; row < modules.length; row++) {
      for (let col = 0; col < modules[row].length; col++) {
        if (modules[row][col]) {
          ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize);
        }
      }
    }
  };

  // Gerar matriz QR simplificada
  const generateQRMatrix = (text: string): boolean[][] => {
    const size = 25;
    const matrix: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));
    
    // Padrões de posicionamento (cantos)
    const addFinderPattern = (startRow: number, startCol: number) => {
      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 7; col++) {
          const isOuter = row === 0 || row === 6 || col === 0 || col === 6;
          const isInner = row >= 2 && row <= 4 && col >= 2 && col <= 4;
          if (isOuter || isInner) {
            matrix[startRow + row][startCol + col] = true;
          }
        }
      }
    };

    // Adicionar padrões de posicionamento
    addFinderPattern(0, 0); // Canto superior esquerdo
    addFinderPattern(0, 18); // Canto superior direito
    addFinderPattern(18, 0); // Canto inferior esquerdo

    // Adicionar dados baseados no texto (simplificado)
    const textHash = text.split('').reduce((hash, char) => hash + char.charCodeAt(0), 0);
    for (let i = 8; i < 17; i++) {
      for (let j = 8; j < 17; j++) {
        matrix[i][j] = ((i + j + textHash) % 3) === 0;
      }
    }

    return matrix;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      generateQRCode(data, canvas, size);
    }
  }, [data, size]);

  const downloadQR = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `qr-${title.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const shareQR = async () => {
    const canvas = canvasRef.current;
    if (canvas && navigator.share) {
      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], `qr-${title}.png`, { type: 'image/png' });
          try {
            await navigator.share({
              title: `QR Code - ${title}`,
              text: description || title,
              files: [file]
            });
          } catch (error) {
            console.log('Erro ao compartilhar:', error);
          }
        }
      });
    } else {
      // Fallback: copiar URL para clipboard
      navigator.clipboard.writeText(data);
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <QrCode className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            className="border border-gray-200 rounded-lg"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>
        
        <div className="text-center text-xs text-gray-500 font-mono break-all bg-gray-50 p-2 rounded">
          {data}
        </div>

        <div className="flex gap-2 justify-center">
          <Button variant="outline" size="sm" onClick={downloadQR}>
            <Download className="h-3 w-3 mr-1" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={shareQR}>
            <Share2 className="h-3 w-3 mr-1" />
            Compartilhar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}