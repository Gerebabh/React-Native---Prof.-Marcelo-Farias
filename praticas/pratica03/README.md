# 💻 Prática 03: Interface Estática do To-Do List

Chegou a hora de dar uma “cara” ao aplicativo. Nesta prática você constrói a **UI** da lista de tarefas usando componentes core, `StyleSheet` e Flexbox. **Ainda sem** adicionar/remover de verdade — o foco é layout.

## 🎯 Objetivos

* Aplicar `View`, `Text`, `TextInput` e `TouchableOpacity`.
* Organizar layout com Flexbox (`column` e `row`).
* Criar estilos com `StyleSheet.create`.
* Entregar uma tela legível no Expo Go.

---

## 📦 Fluxo Git

1. Crie a Issue da **Prática 03**.
2. Crie a branch:

```bash
git checkout -b feature/pratica03
```

3. Trabalhe no projeto Expo desta pasta (`praticas/pratica03`).  
   Se ainda não existir app aqui, crie com `npx create-expo-app@latest` (como nas práticas anteriores) **ou** copie a base da Prática 02 e continue evoluindo.

```bash
npm install
npx expo start
```

---

## 🤖 Executando no Android Emulator (Fedora)

O Android Emulator roda diretamente no Fedora. Para que o Expo consiga localizar
o emulador, execute também o Metro Bundler no Fedora, **fora do container
Docker**.

### 1. Configure o Android SDK no terminal

O Linux diferencia letras maiúsculas de minúsculas. Nesta instalação, o caminho
correto é `Android/Sdk`:

```bash
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
```

Confirme que o `adb` e a aceleração KVM estão disponíveis:

```bash
adb devices
emulator -accel-check
```

Para tornar a configuração permanente, adicione as variáveis ao Bash uma única
vez:

```bash
echo 'export ANDROID_HOME="$HOME/Android/Sdk"' >> ~/.bashrc
echo 'export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### 2. Inicie o aparelho virtual

Nesta máquina, o Android Studio foi instalado via Flatpak. Para abri-lo pelo
terminal:

```bash
flatpak run com.google.AndroidStudio
```

O AVD usado nesta prática é um **Pixel 4, API 35, x86_64**, com 2 GB de RAM. Ele
pode ser aberto pelo Device Manager do Android Studio. Se o emulador encerrar
com `Falha de segmentação` no Fedora com uma GPU Intel antiga, inicie-o pelo
terminal com Vulkan desabilitado:

```bash
LIBGL_ALWAYS_SOFTWARE=1 emulator @Pixel_4 \
  -no-snapshot \
  -noaudio \
  -gpu host \
  -feature -Vulkan
```

Mantenha esse terminal aberto enquanto estiver usando o emulador. Em outro
terminal, verifique a conexão:

```bash
adb devices
```

Continue somente quando aparecer `device`:

```text
List of devices attached
emulator-5554    device
```

Se aparecer `offline`, aguarde o Android terminar de iniciar. Se aparecer
`unauthorized`, desbloqueie o aparelho virtual e aceite a autorização de
depuração USB exibida na tela.

### 3. Inicie o projeto no Fedora

Abra outro terminal e execute:

```bash
cd ~/dev_local/IESB/React-Native---Prof.-Marcelo-Farias/praticas/pratica03/app
unset EXPO_OFFLINE
npm install
npx expo start
```

Quando o Metro Bundler estiver pronto, pressione `a` para instalar ou abrir o
Expo Go no emulador. Não é necessário entrar na Play Store.

> Se o Expo informar `spawn adb ENOENT`, confira `echo "$ANDROID_HOME"` e
> `which adb`. Se ele procurar o SDK em `/home/usuario/Android/sdk`, corrija o
> caminho para `/home/usuario/Android/Sdk`.

---

## 🛠️ O que construir na tela

Limpe o conteúdo padrão do arquivo principal e monte:

### 1. Cabeçalho

* Título grande e em negrito: **Minhas Tarefas**

### 2. Área de inserção

* Um `<TextInput>` com placeholder (ex.: `Digite uma tarefa...`)
* Ao lado, um botão (`TouchableOpacity`) com texto `+` ou `Add`
* Use uma `View` com `flexDirection: 'row'` para alinhá-los na mesma linha

### 3. Lista estática (hardcoded)

Crie **2 ou 3 cards** fixos no JSX (ainda sem array dinâmico). Cada card deve ter:

* Um texto de tarefa (pode ser longo, para testar quebra de linha)
* Um botão/texto `X` (lixeira simbólica) — ainda sem função real

---

## 💡 Dicas de estilização

* Na `View` raiz: `flex: 1` e `padding` para afastar das bordas.
* No `TextInput`: `borderWidth`, `borderColor`, `borderRadius`, `padding`, `flex: 1`.
* Nos cards: fundo claro, `borderRadius`, `padding`, `marginBottom`, e `flexDirection: 'row'` entre texto e `X`.
* Use `StyleSheet.create` — evite deixar todos os estilos “inline” se a tela crescer.

Esqueleto mental:

```text
View (container)
 ├── Text (Minhas Tarefas)
 ├── View (row)
 │    ├── TextInput
 │    └── TouchableOpacity (+)
 └── View (lista)
      ├── View (card) → Text + TouchableOpacity (X)
      ├── View (card)
      └── View (card)
```

---

## ✅ Critérios de entrega

* [ ] Layout agradável e legível no celular (Expo Go)
* [ ] Título, input+botão em linha, e pelo menos 2 cards estáticos
* [ ] Estilos via `StyleSheet`
* [ ] Issue, branch `feature/pratica03`, commit, push e Pull Request

### Commit sugerido

```bash
git add .
git commit -m "Feat: Cria interface estatica do app de tarefas"
git push origin feature/pratica03
```

Na **Aula 04**, a interface ganha vida com **estado (`useState`)**: digitar, adicionar e remover tarefas de verdade.
