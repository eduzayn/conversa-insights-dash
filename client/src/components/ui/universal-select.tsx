import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface UniversalSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface UniversalSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: UniversalSelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  selectKey?: string | number;
  children?: never; // Evita uso de children
}

/**
 * Componente Select universal que substitui todos os Selects problemáticos
 * Implementação nativa sem dependências do Radix UI para máxima compatibilidade
 * Resolve definitivamente problemas de texto embolado e renderização corrompida
 */
export const UniversalSelect = React.memo(({
  value = "",
  onValueChange,
  options = [],
  placeholder = "Selecione uma opção...",
  className,
  disabled = false,
  selectKey
}: UniversalSelectProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const selectRef = React.useRef<HTMLDivElement>(null);
  const optionsRef = React.useRef<HTMLDivElement>(null);
  
  // Key única para forçar re-render quando necessário
  const uniqueKey = React.useMemo(() => 
    selectKey ? `universal-select-${selectKey}` : `universal-select-${Math.random()}`,
    [selectKey]
  );

  // Encontrar opção selecionada
  const selectedOption = React.useMemo(() => 
    options.find(option => option.value === value),
    [options, value]
  );

  // Fechar dropdown ao clicar fora
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Navegação por teclado
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedIndex(prev => 
            prev < options.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : options.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < options.length) {
            const option = options[highlightedIndex];
            if (!option.disabled) {
              handleSelectOption(option.value);
            }
          }
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, highlightedIndex, options]);

  // Scroll para opção destacada
  React.useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && optionsRef.current) {
      const highlightedElement = optionsRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        // Destacar opção atual ao abrir
        const currentIndex = options.findIndex(opt => opt.value === value);
        setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
      }
    }
  };

  const handleSelectOption = (optionValue: string) => {
    onValueChange(optionValue);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const displayText = selectedOption?.label || placeholder;
  const hasSelection = !!selectedOption;

  return (
    <div 
      ref={selectRef}
      className={cn("relative", className)}
      key={uniqueKey}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50 transition-colors hover:bg-accent/5",
          isOpen && "ring-2 ring-ring ring-offset-2",
          className
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        role="combobox"
      >
        <span className={cn(
          "block truncate text-left",
          !hasSelection && "text-muted-foreground"
        )}>
          {displayText}
        </span>
        <ChevronDown 
          className={cn(
            "ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform duration-200",
            isOpen && "rotate-180"
          )} 
        />
      </button>

      {/* Dropdown Options */}
      {isOpen && (
        <div
          ref={optionsRef}
          className={cn(
            "absolute z-[9999] mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-lg",
            "animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
          )}
          role="listbox"
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground text-center">
              Nenhuma opção disponível
            </div>
          ) : (
            options.map((option, index) => (
              <div
                key={`${option.value}-${index}`}
                onClick={() => !option.disabled && handleSelectOption(option.value)}
                className={cn(
                  "relative flex cursor-pointer select-none items-center px-3 py-2 text-sm outline-none transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus:bg-accent focus:text-accent-foreground",
                  option.disabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
                  option.value === value && "bg-accent text-accent-foreground font-medium",
                  index === highlightedIndex && !option.disabled && "bg-accent/50"
                )}
                role="option"
                aria-selected={option.value === value}
                onMouseEnter={() => !option.disabled && setHighlightedIndex(index)}
              >
                <span className="block truncate pr-2">{option.label}</span>
                {option.value === value && (
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

UniversalSelect.displayName = "UniversalSelect";