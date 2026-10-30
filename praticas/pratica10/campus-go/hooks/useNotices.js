import { useEffect, useState } from 'react';
import { api } from '../services/api';

export function useNotices() {
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadNotices() {
      try {
        const data = await api.get('posts?_limit=10');
        if (!Array.isArray(data)) throw new Error('A resposta do mural não é uma lista.');
        if (active) setNotices(data);
      } catch {
        if (active) setError('Não foi possível carregar os avisos. Confira sua conexão e tente novamente.');
      } finally {
        if (active) setIsLoading(false);
      }
    }
    loadNotices();
    // Ignora a resposta se a tela sair ou se uma nova busca começar.
    return () => { active = false; };
  }, [reloadCount]);

  function reload() {
    setIsLoading(true);
    setError('');
    setReloadCount(value => value + 1);
  }

  return { notices, isLoading, error, reload };
}
