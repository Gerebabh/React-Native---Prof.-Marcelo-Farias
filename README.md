# 📱 Programação para Dispositivos Móveis (React Native)

Repositório base destinado às aulas teóricas e às atividades práticas da disciplina. Ao longo do semestre, utilizaremos este ambiente para construir, passo a passo, um **Aplicativo de Lista de Tarefas (To-Do List)** — começando pelos conceitos fundamentais do React Native e do Expo.

## 🛠️ Ambiente de Desenvolvimento

Para acompanhar a disciplina, você precisará das seguintes ferramentas:

| Ferramenta | O que é? | Recomendação |
| :--- | :--- | :--- |
| **Editor de código** | Ambiente onde você escreverá seu código (JS, JSX, TSX). | [Visual Studio Code](https://code.visualstudio.com/) |
| **Ambiente de Execução** | Necessário para rodar o Metro Bundler e gerenciar pacotes. | [Node.js (versão LTS)](https://nodejs.org/pt-br/) |
| **Versionador** | Controla e registra o histórico de alterações do código. | [Git](https://git-scm.com/) |
| **Testes Físicos** | App para espelhar o código do seu computador direto no celular. | [Expo Go (Android/iOS)](https://expo.dev/go) |

## 📂 Estrutura de Pastas

Este repositório está organizado da seguinte forma:

- **`aulas/`**: Resumos teóricos e conceitos de cada encontro (leia **antes** da prática correspondente).
- **`praticas/`**: Enunciados e o código das atividades (nosso App de Tarefas evoluindo a cada prática).

### Trilha sugerida (conceito → prática)

| # | Aula (conceito) | Prática (aplicar) |
| :---: | :--- | :--- |
| 01 | Mundo mobile, React Native e Expo | Ambiente + Hello World |
| 02 | Anatomia do projeto Expo + `View`/`Text` | Criar projeto e explorar arquivos |
| 03 | Componentes core, StyleSheet e Flexbox | Interface estática do To-Do |
| 04 | Estado (`useState`) e imutabilidade | Adicionar e deletar tarefas |
| 05 | FlatList e AsyncStorage | Lista eficiente + persistência |
| 06 | Componentização e props | Extrair `TaskCard` |

## 🚀 Fluxo de Trabalho Acadêmico

As atividades seguem um fluxo de trabalho profissional baseado no modelo [GitFlow](https://www.atlassian.com/br/git/tutorials/comparing-workflows/gitflow-workflow).

### 1. Configuração Inicial (realizar apenas uma vez)

1. **Criar Repositório**: Clique no botão verde `Use this template`, no topo desta página, e escolha `Create a new repository` para criar a sua cópia.
2. **Clonar Repositório**: Faça o clone do *seu* repositório para a sua máquina:

```bash
git clone https://github.com/SEU_USUARIO/NOME_DO_SEU_REPOSITORIO.git
```

3. **Configurar Git**: Certifique-se de que seu nome e e-mail estão corretos:

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"
```

## Ciclo de Cada Prática (repetir a cada aula)

Para cada nova funcionalidade do nosso App, siga este fluxo:

1. **Leia a aula** correspondente em `aulas/aulaXX`.
2. **Crie a Issue:** Acesse a aba Issues no seu GitHub, clique em New issue e use o template da prática do dia.
3. **Crie a Branch:** A partir da branch main (ou develop), crie uma nova branch para a funcionalidade:

```bash
git checkout -b feature/praticaXX
```

4. **Rode o Projeto:** Acesse a pasta correspondente em `praticas/praticaXX`, instale as dependências e inicie o Expo (nas primeiras práticas você também **cria** o projeto com `create-expo-app`, conforme o enunciado):

```bash
npm install
npx expo start
```

### Rodando com Docker

Se estiver usando o `compose.yaml`, o serviço já entra na pasta do app da Prática 01:

```bash
docker compose run --rm --service-ports react-native npm run start:lan
```

Para abrir no celular pelo Expo Go, o computador e o celular precisam estar na mesma rede Wi-Fi. Se o QR Code mostrar `localhost`, defina o IP do computador antes de subir:

```bash
REACT_NATIVE_PACKAGER_HOSTNAME=SEU_IP_NA_REDE docker compose run --rm --service-ports react-native npm run start:lan
```

Se ainda não conectar, use o túnel:

```bash
docker compose run --rm --service-ports react-native npm run start:tunnel
```

### Windows (laboratório, sem Node.js instalado)

Este modo requer apenas que o **Docker Desktop com contêineres Linux/WSL 2 já
esteja instalado e liberado pela equipe de TI**. Node.js, npm, Expo CLI e ngrok
rodam dentro do contêiner. No celular, instale o Expo Go pela loja de
aplicativos.

No PowerShell, entre na raiz deste repositório (onde está o arquivo
`compose.windows.yaml`) e execute:

```powershell
docker compose -f compose.windows.yaml up --build
```

Na primeira execução, aguarde a instalação das dependências e a mensagem
`Tunnel ready`. Depois, abra o Expo Go no celular e leia o QR Code exibido no
terminal. O celular e o computador precisam ter acesso à internet, mas não
precisam estar na mesma rede Wi-Fi quando o túnel está ativo.

As alterações salvas em `praticas/pratica01/app` são detectadas pelo Expo e
atualizadas no celular. Para encerrar, pressione `Ctrl+C`. Para iniciar de novo:

```powershell
docker compose -f compose.windows.yaml up
```

Para recriar somente os caches e dependências do ambiente, sem apagar o código:

```powershell
docker compose -f compose.windows.yaml down --volumes
docker compose -f compose.windows.yaml up --build
```

> **Limitação das máquinas bloqueadas:** o Compose elimina a necessidade de
> instalar as ferramentas JavaScript, mas não consegue contornar políticas da
> instituição. Docker Desktop, WSL 2, virtualização e acesso ao serviço de túnel
> precisam estar previamente autorizados pela equipe de TI. Para essas práticas
> com Expo Go em celular físico, Android Studio não é necessário.

5. **Desenvolva e Teste:** Escreva o código solicitado na prática e teste no seu celular usando o Expo Go.
6. **Salve e Envie (Commit & Push):**

```bash
git add .
git commit -m "Feat: Finaliza a implementacao da Pratica XX"
git push origin feature/praticaXX
```

7. **Solicite a Revisão (Pull Request):** No GitHub, abra um Pull Request da sua branch `feature/praticaXX` para a branch principal.

- ⚠️ Atenção!
- Se o check ✅ não aparecer no `Pull Request`, há erros que precisam ser corrigidos antes da avaliação.

## Feedback e Avaliação

Envie o link do seu Pull Request pela plataforma de ensino. A avaliação usará o sistema de **Code Review:**

- **Approve (Aprovado):** Código cumpre os requisitos. Faça o merge!
- **Request Changes (Solicitação de Ajustes):** Há bugs ou melhorias necessárias. Corrija localmente, faça um novo commit e push na mesma branch, e avise no PR para nova revisão.
