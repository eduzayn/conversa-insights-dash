import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './utils/productionLogger'

// Limpeza preventiva específica para problema do usuário Erick Moreira
console.log('🔧 Modo desenvolvimento - todos os logs habilitados');
try {
  // Limpa localStorage preservando dados essenciais
  const essentialKeys = ['auth-token', 'user-session'];
  const backup: Record<string, string> = {};
  
  essentialKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) backup[key] = value;
  });
  
  localStorage.clear();
  sessionStorage.clear();
  
  // Restaura dados essenciais
  Object.entries(backup).forEach(([key, value]) => {
    localStorage.setItem(key, value);
  });
  
  console.log('Limpeza de cache e estado do navegador concluída');
} catch (error) {
  console.warn('Erro na limpeza preventiva:', error);
}

createRoot(document.getElementById("root")!).render(<App />);
