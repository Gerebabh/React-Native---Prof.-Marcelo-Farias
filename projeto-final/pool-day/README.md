# Pool Day

Aplicativo mobile para ajudar no planejamento e no registro do tratamento de piscinas.

## Executar o projeto

Instale as dependências com `npm install` e inicie o Expo com `npx expo start`.

## Testes

Execute os testes do aplicativo com `npm test`, os testes de autenticação e convite com `npm run test:firebase` e os testes das regras do Firestore com `npm run test:regras`.

## Configurar Firebase

1. Crie um app Web no projeto Firebase e copie os valores para um arquivo `.env.local`, usando o `.env.example` como modelo.
2. No Firebase Authentication, habilite o método de acesso por e-mail e senha.
3. Publique as regras de `firestore.rules` no Firestore antes de testar o cadastro.
4. Na tela inicial, toque em **Cadastre-se** e informe o nome do responsável, o nome da empresa, o e-mail e uma senha. O app cria a conta e vincula perfil, empresa e responsável no Firestore.
5. Depois de entrar, o responsável pode convidar tratadores pela tela Equipe; cada tratador recebe um e-mail para definir a senha.
6. Reinicie o Expo depois de preencher o `.env.local`.

O cadastro inicial cria o responsável e uma nova empresa em uma única operação no Firestore. O responsável pode convidar tratadores e atribuir visitas. O convite cria a conta em uma sessão separada do Firebase Authentication, grava o perfil e o vínculo de membro em uma única operação no Firestore e envia um e-mail para definir a senha. A lista do tratador consulta apenas visitas atribuídas ao UID conectado.

O envio usa o e-mail de redefinição de senha do Firebase Authentication e está sujeito aos limites do plano Firebase em uso. Não é necessário publicar Cloud Functions para cadastrar um tratador.

## Documentação

- [Modelo de empresas e usuários](docs/modelo-empresas-usuarios.md)
- [Testes das regras do Firestore](docs/testes-regras-firestore.md)
