# Pool Day

Aplicativo mobile para ajudar no planejamento e no registro do tratamento de piscinas.

## Executar o projeto

Instale as dependências com `npm install` e inicie o Expo com `npx expo start`.

## Testes

Execute os testes da interface com `npm test`, os testes das regras do Firestore com `npm run test:regras` e os testes da função de convite com `npm run test:funcoes`.

## Configurar Firebase

1. Crie um app Web no projeto Firebase e copie os valores para um arquivo `.env.local`, usando o `.env.example` como modelo.
2. No Firebase Authentication, habilite o método de acesso por e-mail e senha.
3. O acesso ao app não tem cadastro público. O responsável convida tratadores pela tela Equipe; cada tratador recebe um e-mail para definir a senha.
4. O perfil precisa estar vinculado à empresa no Firestore: `usuarios/{uid}`, `empresas/{empresaId}` e `empresas/{empresaId}/membros/{uid}`. O membro deve ter `papel` como `responsavel` ou `tratador` e `ativo: true`.
5. Instale as dependências do backend com `npm install --prefix functions`.
6. Reinicie o Expo depois de preencher o `.env.local`.

O responsável pode convidar tratadores e atribuir visitas. A lista do tratador consulta apenas visitas atribuídas ao UID conectado. A função `convidarTratador` cria as contas e os vínculos no backend; não permita que o app crie membros diretamente no Firestore.

Para testar as funções no emulador, configure Auth, Firestore e Functions no Firebase Local Emulator Suite. Para publicar a função no projeto Firebase, o projeto precisa estar no plano Blaze. A implantação não foi feita como parte desta alteração.

## Documentação

- [Modelo de empresas e usuários](docs/modelo-empresas-usuarios.md)
- [Testes das regras do Firestore](docs/testes-regras-firestore.md)
