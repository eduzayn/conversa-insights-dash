import { Sidebar } from "@/components/Sidebar";

export default function CertificadosPos() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <div className="w-full h-[calc(100vh-64px)] p-4">
          <iframe
            src="https://form.eduzayn.com.br/"
            className="w-full h-full rounded border"
            title="Certificados de Pós-Graduação"
          />
        </div>
      </div>
    </div>
  );
}