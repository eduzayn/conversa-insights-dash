
import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';

const INACTIVITY_TIMEOUT = 7 * 60 * 1000; // 7 minutos em millisegundos

export const useActivityMonitor = () => {
  const { logout, user } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      console.log('Usuário inativo por 7 minutos. Fazendo logout automático...');
      
      // Registrar o logout automático com timestamp
      const logoutTime = new Date().toISOString();
      localStorage.setItem('lastAutoLogout', logoutTime);
      
      // Fazer logout
      logout();
    }, INACTIVITY_TIMEOUT);

    lastActivityRef.current = Date.now();
  };

  const handleActivity = () => {
    resetTimer();
  };

  useEffect(() => {
    if (!user) return;

    // Registrar login timestamp
    const loginTime = new Date().toISOString();
    localStorage.setItem('lastLoginTime', loginTime);
    console.log('Login registrado:', loginTime);

    // Eventos que indicam atividade do usuário
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    // Adicionar listeners para todos os eventos de atividade
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Iniciar o timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [user, logout]);

  useEffect(() => {
    // Registrar logout quando o componente for desmontado
    return () => {
      if (user) {
        const logoutTime = new Date().toISOString();
        localStorage.setItem('lastLogoutTime', logoutTime);
        console.log('Logout registrado:', logoutTime);
      }
    };
  }, [user]);
};
