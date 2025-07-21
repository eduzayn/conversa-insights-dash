import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './utils/productionLogger'
import { setupDOMErrorHandler, cleanupPortals } from './utils/domErrorHandler'
import { performBrowserCleanup, setupAutoRecovery } from './utils/cacheCleanup'

// Executa limpeza completa de cache e estado problemático
performBrowserCleanup();

// Configura proteções contra erros de DOM
setupDOMErrorHandler();

// Configura sistema de recuperação automática
setupAutoRecovery();

// Limpa portais órfãos antes de inicializar
cleanupPortals();

// Limpa periodicamente portais órfãos (a cada 30 segundos)
setInterval(cleanupPortals, 30000);

createRoot(document.getElementById("root")!).render(<App />);
