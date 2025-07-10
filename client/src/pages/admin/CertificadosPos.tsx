import { Sidebar } from "@/components/Sidebar";

export default function CertificadosPos() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-1">
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