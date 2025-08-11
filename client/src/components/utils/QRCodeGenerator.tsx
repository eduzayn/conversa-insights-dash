interface QRCodeGeneratorProps {
  value: string;
  size?: number;
}

export function QRCodeGenerator({ value, size = 120 }: QRCodeGeneratorProps) {
  // Usando QR Server API para gerar QR Code
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;
  
  return (
    <img
      src={qrCodeUrl}
      alt="QR Code"
      width={size}
      height={size}
      className="block"
    />
  );
}