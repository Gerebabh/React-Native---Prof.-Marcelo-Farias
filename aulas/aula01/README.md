# 📚 Aula 01: O Mundo Mobile e o React Native

Nesta primeira aula, você entende **por que** desenvolvemos apps multiplataforma e **o que** é o React Native — sem ainda escrever código complexo. O objetivo é sair daqui sabendo o vocabulário e a lógica por trás do framework.

## 🎯 Objetivos da Aula

* Compreender a estratégia *Mobile First* e o desafio iOS × Android.
* Diferenciar desenvolvimento nativo, híbrido (WebView) e multiplataforma.
* Entender o que é React Native e como ele se relaciona com o React da web.
* Conhecer a ideia de “aprender uma vez, escrever em qualquer lugar”.
* Saber o papel do **Expo** como caminho recomendado para começar.

---

## 📱 Por que Mobile?

Hoje, grande parte do acesso à internet acontece pelo celular. Empresas precisam de presença em **iOS** e **Android**. Desenvolver dois apps separados (Swift/Kotlin de um lado, Java/Kotlin ou Swift do outro) exige mais tempo, mais ferramentas e, muitas vezes, equipes diferentes.

O desenvolvimento **multiplataforma** busca compartilhar a maior parte do código, mantendo a aparência e o desempenho próximos do nativo.

| Abordagem | Ideia | Exemplo |
| :--- | :--- | :--- |
| **Nativo** | Um app por sistema, com a linguagem da plataforma | Swift (iOS), Kotlin (Android) |
| **Híbrido** | App “embrulha” uma página web | WebView / Cordova |
| **Multiplataforma** | Um código principal, UI nativa real | **React Native**, Flutter |

---

## ⚛️ O que é React Native?

O **React Native** é um framework de código aberto criado pela **Meta** (2015). Ele permite criar apps para iOS e Android usando **JavaScript** e os conceitos do **React**.

Pontos importantes:

* A UI **não** é HTML no navegador: o React Native renderiza **componentes nativos** de cada sistema.
* A lógica de negócio roda em JavaScript; a tela é desenhada com elementos reais do celular.
* A filosofia é: **aprenda uma vez, escreva em qualquer lugar** — os padrões são os mesmos; a adaptação à plataforma acontece quando necessário.

Apps conhecidos que usam (ou usaram) React Native incluem Instagram, Microsoft Teams, Shopify, Discord, entre outros.

---

## 🆚 React (web) × React Native (mobile)

| | React (web) | React Native |
| :--- | :--- | :--- |
| Onde roda | Navegador | Celular (iOS / Android) |
| “Caixa” de layout | `<div>` | `<View>` |
| Texto | `<p>`, `<span>` | `<Text>` |
| Estilo | CSS / arquivos `.css` | JavaScript (`StyleSheet`) |
| Resultado visual | Elementos HTML (DOM) | Componentes nativos (ex.: `UIView` no iOS, `View` no Android) |

**Por que não usar `<div>`?**  
Porque no celular não existe DOM de navegador. O React Native mapeia seus componentes para a UI nativa de cada SO — por isso o app “parece” nativo (botões, campos de texto e listas seguem o visual do sistema).

---

## 🧠 Como funciona (visão simples)

1. Você escreve componentes em JavaScript/JSX (`View`, `Text`, etc.).
2. O React Native traduz isso para componentes nativos de cada plataforma.
3. A lógica (estado, cliques, regras) vive na **thread JavaScript**.
4. A interface é desenhada na **thread nativa** da UI.

Em versões antigas havia uma “ponte” de mensagens entre JS e nativo. Arquiteturas mais recentes usam a **JSI** (*JavaScript Interface*), permitindo comunicação mais direta e apps mais responsivos. Para o dia a dia do iniciante, basta lembrar: **JS controla a lógica; o sistema desenha a tela de verdade.**

---

## 🧰 E o Expo?

Criar um app React Native “do zero” (com Android Studio, Xcode, builds nativos) é trabalhoso no começo. O **Expo** é o caminho oficialmente recomendado pela Meta para começar:

* Todo projeto Expo **é** um projeto React Native, com ferramentas a mais.
* Facilita testar no celular sem compilar o app nativo a cada mudança.
* Oferece bibliotecas prontas (câmera, sensores, armazenamento, etc.).

Ferramentas que você vai ouvir ao longo do curso:

| Ferramenta | Para que serve |
| :--- | :--- |
| **Expo Go** | App no celular que abre seu projeto pelo QR Code |
| **Expo CLI** | Comandos no terminal (`npx expo start`, etc.) |
| **Expo SDK** | Bibliotecas oficiais do ecossistema Expo |
| **Expo Snack** | Playground no navegador para testar trechos de código |
| **EAS** | Builds e atualizações na nuvem (mais avançado) |

Nesta disciplina, trabalhamos com **Expo + Expo Go**: menos atrito, mais foco em aprender componentes e lógica.

---

## ✅ Checklist de compreensão

Antes da Prática 01, você deve conseguir responder:

1. Qual o problema de manter dois apps 100% nativos separados?
2. O React Native renderiza HTML ou componentes nativos?
3. Qual a diferença prática entre `<div>` e `<View>`?
4. Por que usamos Expo no início do curso?

---

## 📖 Para ir além

* [Documentação oficial do React Native](https://reactnative.dev/)
* [Documentação do Expo](https://docs.expo.dev/)

Na **Prática 01**, você configura o ambiente e cria o primeiro contato com um app rodando no celular.
