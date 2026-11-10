# Pool Day

Aplicativo mobile para ajudar no planejamento e no registro do tratamento de piscinas.

## Executar o projeto

Instale as dependências com `npm install` e inicie o Expo com `npx expo start`.

## Testes

Execute os testes com `npm test`.

## Configurar Firebase

1. Crie um app Web no projeto Firebase e copie os valores para um arquivo `.env.local`, usando o `.env.example` como modelo.
2. No Firebase Authentication, habilite o método de acesso por e-mail e senha.
3. Crie a conta de teste no Firebase Authentication. O acesso ao app não tem cadastro público.
4. O perfil precisa estar vinculado à empresa no Firestore: `usuarios/{uid}`, `empresas/{empresaId}` e `empresas/{empresaId}/membros/{uid}`. O membro deve ter `papel` como `responsavel` ou `tratador` e `ativo: true`.
5. Reinicie o Expo depois de preencher o `.env.local`.

As regras seguras para esses dados serão implementadas na issue #43. Não libere leitura e escrita do Firestore para qualquer usuário.

## Documentação

- [Modelo de empresas e usuários](docs/modelo-empresas-usuarios.md)
