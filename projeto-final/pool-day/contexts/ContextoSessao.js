import { createContext, useContext } from 'react';

export const ContextoSessao = createContext(null);

export function usarSessao() {
  const sessao = useContext(ContextoSessao);
  if (!sessao) throw new Error('A sessão do usuário não está disponível.');
  return sessao;
}
