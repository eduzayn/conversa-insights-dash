import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

interface StableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  options: Array<{ value: string; label: string; key?: string }>;
  selectKey?: string | number;
}

/**
 * Componente Select estável que resolve problemas de renderização DOM
 * Implementa keys únicas e força re-render quando necessário
 */
export const StableSelect = React.memo(({
  value,
  onValueChange,
  placeholder = "Selecione...",
  className,
  disabled = false,
  options,
  selectKey
}: StableSelectProps) => {
  // Força re-render quando necessário através da key
  const stableKey = selectKey ? `stable-select-${selectKey}` : `stable-select-${value}`;
  
  return (
    <div className={className}>
      <Select 
        key={stableKey}
        value={value || ""}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option, index) => (
            <SelectItem 
              key={option.key || `${option.value}-${index}`} 
              value={option.value}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});

StableSelect.displayName = "StableSelect";