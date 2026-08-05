# 💻 Prática 01: Ambiente Pronto e Hello World

Nesta prática você **configura as ferramentas** e valida que consegue rodar um app React Native com Expo. Não vamos construir o To-Do ainda — o foco é o primeiro sucesso: ver **sua mensagem** no celular.

## 🎯 Objetivos

* Instalar o ambiente mínimo para a disciplina.
* Criar (ou usar) o repositório a partir do template.
* Rodar um projeto Expo e alterar o texto da tela.
* Praticar o fluxo Git da disciplina (Issue → Branch → Commit → PR).

---

## 🛠️ Parte A — Ferramentas necessárias

Instale e confirme cada item:

| Ferramenta | O que é | Onde baixar |
| :--- | :--- | :--- |
| **Node.js (LTS)** | Executa o Metro Bundler e o npm | [nodejs.org](https://nodejs.org/pt-br/) |
| **Visual Studio Code** | Editor de código | [code.visualstudio.com](https://code.visualstudio.com/) |
| **Git** | Versionamento | [git-scm.com](https://git-scm.com/) |
| **Expo Go** | App para testar no celular | [expo.dev/go](https://expo.dev/go) |

### Conferência rápida no terminal

```bash
node -v
npm -v
git --version
```

Se os três comandos retornarem versões, a base está ok.

### Extensões sugeridas no VS Code

* Material Icon Theme (ícones de pastas/arquivos)
* ES7+ React/Redux/React-Native snippets (opcional, acelera digitação)

> **Nota:** Instalação completa com Android Studio / JDK é útil para emulador e builds nativos avançados. **Nesta disciplina o caminho principal é Expo Go no celular físico** (mesma Wi‑Fi do computador). Se precisar do emulador depois, o professor orientará a instalação do Android Studio.

---

## 📦 Parte B — Repositório e fluxo Git

1. Crie seu repositório a partir do **template** do professor (`Use this template`).
2. Clone o repositório na sua máquina.
3. Abra a pasta no VS Code.
4. No GitHub, crie a **Issue** da Prática 01 (use o template de entrega).
5. No terminal, na raiz do repositório:

```bash
git checkout -b feature/pratica01
```

---

## 🚀 Parte C — Criar o primeiro projeto Expo

Dentro da pasta desta prática (`praticas/pratica01`), crie um app Expo:

```bash
cd praticas/pratica01
npx create-expo-app@latest .
```

> Se a pasta não estiver vazia (por causa deste README), crie o app em uma subpasta `app` **ou** use `npx create-expo-app@latest meu-primeiro-app` e trabalhe dentro dela. O importante é ter um projeto Expo rodando nesta prática.

Depois:

```bash
npm install
npx expo start
```

1. Abra o **Expo Go** no celular.
2. Escaneie o QR Code do terminal (ou da página que abrir no navegador).
3. Espere o app carregar.

---

## ✏️ Parte D — Seu Hello World

1. Abra o arquivo principal da tela (`App.js`, `App.tsx` ou o arquivo indicado pelo template Expo atual).
2. Localize o texto padrão (ex.: “Open up App.js…”).
3. Troque por:

```text
Olá, [Seu Nome]! Meu primeiro App.
```

4. Salve o arquivo. Com o Expo, a tela no celular deve atualizar sozinha (*Fast Refresh*).
5. Confirme que o nome aparece corretamente.

### Desafio opcional (Snack)

Se quiser prototipar sem instalar nada local, abra o [Expo Snack](https://snack.expo.dev/), cole um `View` + `Text` com a mesma mensagem e teste no Expo Go. Depois, replique no projeto local.

---

## ✅ Critérios de entrega

* [ ] Node, npm e Git funcionando no terminal
* [ ] Expo Go abre o projeto pelo QR Code
* [ ] Texto personalizado com o **seu nome** na tela
* [ ] Issue criada, branch `feature/pratica01`, commit, push e **Pull Request** abertos

### Commit sugerido

```bash
git add .
git commit -m "Feat: Configura ambiente e exibe Hello World no Expo"
git push origin feature/pratica01
```

Abra o Pull Request da `feature/pratica01` para a branch principal e envie o link conforme a orientação da disciplina.

---

## 🆘 Problemas comuns

| Sintoma | O que tentar |
| :--- | :--- |
| QR Code não conecta | Celular e PC na mesma rede Wi‑Fi; tente o modo *Tunnel* no Expo (`npx expo start --tunnel`) |
| `npx` lento ou falha | Confirme Node LTS; limpe cache ou tente de novo |
| Tela não atualiza | Salve o arquivo; recarregue no Expo Go (shake → Reload) |

Na **Aula 02**, vamos entender a **anatomia do projeto** (para que serve cada arquivo) e os primeiros componentes `View` e `Text` com mais profundidade.
