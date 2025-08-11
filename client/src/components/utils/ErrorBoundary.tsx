import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Verifica se é um erro específico de removeChild/DOM
    if (error.name === 'NotFoundError' || 
        error.message?.includes('removeChild') ||
        error.message?.includes('appendChild') ||
        error.message?.includes('Node') ||
        error.message?.includes('child of this node')) {
      // Para esses erros específicos, apenas resetamos sem mostrar erro
      console.warn('Erro DOM capturado pelo ErrorBoundary e suprimido:', error.message);
      return { hasError: false };
    }
    
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log apenas erros que não são do tipo DOM removeChild
    if (!(error.name === 'NotFoundError' || 
          error.message?.includes('removeChild') ||
          error.message?.includes('appendChild') ||
          error.message?.includes('Node') ||
          error.message?.includes('child of this node'))) {
      console.error('ErrorBoundary capturou um erro:', error, errorInfo);
    } else {
      // Para erros DOM, apenas logamos como warning
      console.warn('Erro DOM suprimido:', error.message);
    }
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">Algo deu errado</h2>
            <p className="text-muted-foreground mb-4">
              Recarregue a página para continuar
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Recarregar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;