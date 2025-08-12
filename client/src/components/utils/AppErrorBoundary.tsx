import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class AppErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Suprimir erros relacionados a workspace_iframe e similares
    const suppressedErrors = [
      'workspace_iframe', 'allowfullscreen', 'navigation-override',
      'sandbox', 'x-frame-options', 'chrome-error'
    ];
    
    const errorMessage = error.message?.toLowerCase() || '';
    const errorStack = error.stack?.toLowerCase() || '';
    
    if (!suppressedErrors.some(err => 
      errorMessage.includes(err) || errorStack.includes(err)
    )) {
      console.error('Uncaught error:', error, errorInfo);
    }
  }

  public render() {
    if (this.state.hasError) {
      // Interface de erro simples que sempre funciona
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#f8fafc',
          fontFamily: 'system-ui, sans-serif',
          padding: '2rem'
        }}>
          <h1 style={{ color: '#16a34a', marginBottom: '1rem' }}>
            ERP EdunexIA
          </h1>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>
            Recarregando aplicação...
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Recarregar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;