import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  File, 
  Image, 
  Video, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle,
  Download
} from "lucide-react";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
  status: "uploading" | "completed" | "error";
  progress: number;
}

interface FileUploadProps {
  onFileUpload: (file: UploadedFile) => void;
  acceptedTypes?: string[];
  maxSize?: number; // em MB
  multiple?: boolean;
  className?: string;
}

export function FileUpload({ 
  onFileUpload, 
  acceptedTypes = ["*"], 
  maxSize = 50, 
  multiple = false,
  className = ""
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="h-5 w-5 text-blue-600" />;
    if (type.startsWith("video/")) return <Video className="h-5 w-5 text-red-600" />;
    if (type.includes("pdf")) return <FileText className="h-5 w-5 text-red-800" />;
    return <File className="h-5 w-5 text-gray-600" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const simulateUpload = (file: File): Promise<UploadedFile> => {
    return new Promise((resolve, reject) => {
      const uploadedFile: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file), // Para preview local
        uploadedAt: new Date().toISOString(),
        status: "uploading",
        progress: 0
      };

      setUploadedFiles(prev => [...prev, uploadedFile]);

      // Simular progresso de upload
      const interval = setInterval(() => {
        uploadedFile.progress += Math.random() * 30;
        if (uploadedFile.progress >= 100) {
          uploadedFile.progress = 100;
          uploadedFile.status = "completed";
          uploadedFile.url = `https://example.com/uploads/${uploadedFile.id}/${file.name}`;
          clearInterval(interval);
          setUploading(false);
          setUploadProgress(0);
          resolve(uploadedFile);
        }
        setUploadedFiles(prev => 
          prev.map(f => f.id === uploadedFile.id ? { ...uploadedFile } : f)
        );
        setUploadProgress(uploadedFile.progress);
      }, 200);

      // Simular possível erro (5% de chance)
      if (Math.random() < 0.05) {
        setTimeout(() => {
          clearInterval(interval);
          uploadedFile.status = "error";
          setUploadedFiles(prev => 
            prev.map(f => f.id === uploadedFile.id ? { ...uploadedFile } : f)
          );
          setUploading(false);
          reject(new Error("Falha no upload"));
        }, 2000);
      }
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      // Validar tamanho
      if (file.size > maxSize * 1024 * 1024) {
        alert(`Arquivo ${file.name} é muito grande. Máximo: ${maxSize}MB`);
        continue;
      }

      // Validar tipo
      if (acceptedTypes[0] !== "*" && !acceptedTypes.some(type => file.type.includes(type))) {
        alert(`Tipo de arquivo não suportado: ${file.type}`);
        continue;
      }

      setUploading(true);
      try {
        const uploadedFile = await simulateUpload(file);
        onFileUpload(uploadedFile);
      } catch (error) {
        console.error("Erro no upload:", error);
      }
    }

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const downloadFile = (file: UploadedFile) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    link.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Arquivos
          </CardTitle>
          <CardDescription>
            Formatos aceitos: {acceptedTypes[0] === "*" ? "Todos" : acceptedTypes.join(", ")}
            {" "}• Tamanho máximo: {maxSize}MB
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700">
              Clique para selecionar arquivos
            </p>
            <p className="text-sm text-gray-500">
              ou arraste e solte aqui
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            multiple={multiple}
            accept={acceptedTypes[0] === "*" ? undefined : acceptedTypes.join(",")}
          />

          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Enviando arquivo...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Arquivos Enviados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadedFiles.map(file => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getFileIcon(file.type)}
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {file.status === "uploading" && (
                      <div className="flex items-center gap-2">
                        <Progress value={file.progress} className="w-20" />
                        <span className="text-xs">{Math.round(file.progress)}%</span>
                      </div>
                    )}
                    
                    {file.status === "completed" && (
                      <>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Concluído
                        </Badge>
                        <Button variant="ghost" size="sm" onClick={() => downloadFile(file)}>
                          <Download className="h-3 w-3" />
                        </Button>
                      </>
                    )}

                    {file.status === "error" && (
                      <Badge variant="outline" className="bg-red-50 text-red-700">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Erro
                      </Badge>
                    )}

                    <Button variant="ghost" size="sm" onClick={() => removeFile(file.id)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}