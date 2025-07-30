import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface EnhancedSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  selectKey?: string | number;
}

/**
 * Componente Select personalizado que resolve problemas de renderização
 * Usa implementação nativa sem Radix UI para evitar conflitos de DOM
 */
export const EnhancedSelect = React.memo(({
  value = "",
  onValueChange,
  options,
  placeholder = "Selecione...",
  className,
  disabled = false,
  selectKey
}: EnhancedSelectProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState(value);
  const selectRef = React.useRef<HTMLDivElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Sincronizar valor interno com prop externa
  React.useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Fechar dropdown ao clicar fora
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Fechar dropdown ao pressionar Escape
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const selectedOption = options.find(option => option.value === internalValue);
  const displayValue = selectedOption?.label || placeholder;

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (optionValue: string) => {
    setInternalValue(optionValue);
    onValueChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div 
      ref={selectRef}
      className={cn("relative", className)}
      key={selectKey ? `enhanced-select-${selectKey}` : undefined}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isOpen && "ring-2 ring-ring ring-offset-2"
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={cn(
          "truncate text-left",
          !selectedOption && "text-muted-foreground"
        )}>
          {displayValue}
        </span>
        <ChevronDown 
          className={cn(
            "ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform duration-200",
            isOpen && "rotate-180"
          )} 
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={cn(
            "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md",
            "animate-in fade-in-0 zoom-in-95"
          )}
          role="listbox"
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Nenhuma opção disponível
            </div>
          ) : (
            options.map((option, index) => (
              <div
                key={`${option.value}-${index}`}
                onClick={() => !option.disabled && handleSelect(option.value)}
                className={cn(
                  "relative flex cursor-pointer select-none items-center px-3 py-2 text-sm outline-none",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus:bg-accent focus:text-accent-foreground",
                  option.disabled && "cursor-not-allowed opacity-50",
                  option.value === internalValue && "bg-accent text-accent-foreground"
                )}
                role="option"
                aria-selected={option.value === internalValue}
              >
                <span className="truncate">{option.label}</span>
                {option.value === internalValue && (
                  <Check className="ml-auto h-4 w-4 shrink-0" />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
});

EnhancedSelect.displayName = "EnhancedSelect";