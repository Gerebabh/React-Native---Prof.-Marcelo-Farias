# Pool Day

Aplicativo mobile para ajudar no planejamento e no registro do tratamento de piscinas.

## Executar o projeto

Instale as dependências com `npm install` e inicie o Expo com `npx expo start`.

## Testes

Execute os testes do aplicativo com `npm test`, os testes de autenticação e convite com `npm run test:firebase` e os testes das regras do Firestore com `npm run test:regras`.

## Configurar Firebase

1. Crie um app Web no projeto Firebase e copie os valores para um arquivo `.env.local`, usando o `.env.example` como modelo.
2. No Firebase Authentication, habilite o método de acesso por e-mail e senha.
3. O acesso ao app não tem cadastro público. O responsável convida tratadores pela tela Equipe; cada tratador recebe um e-mail para definir a senha.
4. O perfil precisa estar vinculado à empresa no Firestore: `usuarios/{uid}`, `empresas/{empresaId}` e `empresas/{empresaId}/membros/{uid}`. O membro deve ter `papel` como `responsavel` ou `tratador` e `ativo: true`.
5. Reinicie o Expo depois de preencher o `.env.local`.

O responsável pode convidar tratadores e atribuir visitas. O convite cria a conta em uma sessão separada do Firebase Authentication, grava o perfil e o vínculo de membro em uma única operação no Firestore e envia um e-mail para definir a senha. O responsável continua conectado no próprio aparelho. A lista do tratador consulta apenas visitas atribuídas ao UID conectado.

O envio usa o e-mail de redefinição de senha do Firebase Authentication e está sujeito aos limites do plano Firebase em uso. Não é necessário publicar Cloud Functions para cadastrar um tratador.

## Documentação

- [Modelo de empresas e usuários](docs/modelo-empresas-usuarios.md)
- [Testes das regras do Firestore](docs/testes-regras-firestore.md)
