/**
 * IMPORTANTE: As abas de categoria são renderizadas EXCLUSIVAMENTE por CertificationTabs.
 * Não adicionar outro <TabsList>/<TabsTrigger> aqui ou em filhos.
 */

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ReactNode } from 'react';

type Props = {
  value: string;
  onValueChange: (v: string) => void;
  children: ReactNode; // conteúdo do TabsContent fica por conta do pai
};

const TABS = [
  { value: 'pos',                 label: 'Pós-graduação',        minW: 'min-w-[120px]' },
  { value: 'segunda',             label: 'Segunda licenciatura', minW: 'min-w-[140px]' },
  { value: 'formacao_pedagogica', label: 'Form. Pedagógica',     minW: 'min-w-[130px]' },
  { value: 'formacao_livre',      label: 'Form. Livre',          minW: 'min-w-[110px]' },
  { value: 'diplomacao',          label: 'Diplom. Competência',  minW: 'min-w-[140px]' },
  { value: 'eja',                 label: 'EJA',                  minW: 'min-w-[110px]' },
  { value: 'graduacao',           label: 'Graduação',            minW: 'min-w-[120px]' },
  { value: 'capacitacao',         label: 'Capacitação',          minW: 'min-w-[120px]' },
  { value: 'sequencial',          label: 'Sequencial',           minW: 'min-w-[120px]' },
] as const;

export default function CertificationTabs({ value, onValueChange, children }: Props) {
  return (
    <div className="certification-tabs-container">
      <Tabs value={value} onValueChange={onValueChange} className="w-full max-w-full overflow-hidden">
        <TabsList
          aria-label="Categorias de certificação"
          className="certification-tabs-list w-full flex flex-wrap gap-1 p-1 h-auto min-h-[48px] bg-gray-100 rounded-lg justify-start"
        >
          {TABS.map(tab => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={`flex-1 ${tab.minW} px-3 py-2 text-xs lg:text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm`}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

        {/* O pai injeta um único TabsContent com "value" controlado externamente */}
        <TabsContent value={value} className="space-y-4 relative w-full">
          {children}
        </TabsContent>
      </Tabs>
    </div>
  );
}