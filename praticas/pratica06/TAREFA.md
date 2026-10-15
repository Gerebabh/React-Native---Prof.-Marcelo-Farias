================================================================================
ATIVIDADE INTEGRADORA — App "RotinaIESB"
Disciplina: Programação para Dispositivos Móveis (React Native / Expo)
Professor: Marcelo Alves Farias — IESB
Aulas relacionadas: 02, 03, 04, 05 e 06
Desenvolver na pasta pratica06
Criar uma nova branch para entregar esta atividade. Sugestão de nome feature/atividade03
comando git para criar a branch: git checkout -b feature/atividade03

================================================================================

1. OBJETIVO
-----------
Consolidar, em um único app funcional, os assuntos das aulas 02 a 06:
criação e estrutura de projeto Expo, import/export, Core Components,
StyleSheet, Flexbox, useState, props, componentização, Pressable,
useEffect, AsyncStorage e persistência com JSON.


2. CONTEXTO DO APP
------------------
Desenvolver o app "RotinaIESB": um organizador simples da rotina acadêmica
do aluno no IESB.

O aluno cadastra compromissos do dia (aula, estudo, trabalho, lazer),
visualiza a lista, remove itens e mantém os dados após fechar o app.

Não é necessário navegação multi-tela (isso entra nas aulas seguintes).
Tudo deve caber em uma tela bem organizada.


3. CONTEÚDOS QUE DEVEM APARECER NO CÓDIGO
-----------------------------------------
Aula 02 — Estrutura do projeto
  • Projeto Expo (template blank)
  • Identificar e usar corretamente App.js, app.json, package.json e assets/

Aula 03 — Import/export, componentes e estilos
  • Arquivo de rótulos com export nomeado
  • View, Text, TextInput, Image, StyleSheet
  • Estilos via StyleSheet.create (evitar só inline)

Aula 04 — Layout e Flexbox
  • flexDirection: 'row' e 'column'
  • flex, width percentual, justifyContent e alignItems
  • Separação clara: cabeçalho / formulário / lista

Aula 05 — Estado e componentização
  • useState (texto do input + lista)
  • Funções / arrow functions para eventos
  • Props entre pai e filhos
  • Pasta components/ com pelo menos 2 componentes

Aula 06 — Eventos e persistência
  • Identificadores únicos + remoção com .filter
  • Pressable (e android_ripple no Android, se aplicável)
  • SafeAreaProvider + SafeAreaView (react-native-safe-area-context)
  • useEffect + AsyncStorage + JSON.stringify / JSON.parse


4. PREPARAÇÃO DO AMBIENTE
-------------------------
1) Confirme Node.js LTS (>= 22.11):
   node -v

2) Crie o projeto:
   npx create-expo-app@latest RotinaIESB --template blank

3) Entre na pasta e instale dependências:
   cd RotinaIESB
   npx expo install @react-native-async-storage/async-storage react-native-safe-area-context

4) Inicie:
   npx expo start
   (emulador Android ou Expo Go)


5. ESTRUTURA MÍNIMA ESPERADA
----------------------------
RotinaIESB/
  App.js
  labels.js
  assets/
    logo.png          (imagem local do aluno — pode ser logo IESB ou ícone próprio)
  components/
    CompromissoInput.js
    CompromissoList.js
  package.json
  app.json
  README.md


6. REQUISITOS OBRIGATÓRIOS
--------------------------
A) Organização e rótulos (Aulas 02 e 03)
   - Crie labels.js exportando constantes, por exemplo:
     • tituloApp
     • placeholderCompromisso
     • botaoAdicionar
     • tituloLista
     • listaVazia
   - Importe esses rótulos em App.js (e/ou nos componentes).

B) Interface e layout (Aulas 03 e 04)
   - SafeAreaProvider envolvendo o app; SafeAreaView na tela principal.
   - Cabeçalho em linha (flexDirection: 'row') com:
     • Image local (require('./assets/...'))
     • Text com o título do app
   - Área de cadastro em linha:
     • TextInput (~65–70% de largura ou flex)
     • Pressable/Botão de adicionar (~25–30%)
   - Área da lista com flex: 1 (ocupar o restante da tela).
   - StyleSheet.create com estilos nomeados (container, header, input,
     item, etc.). Demonstre pelo menos:
     • um uso de width percentual (%)
     • um uso de flex
     • justifyContent OU alignItems com intenção clara

C) Estado, props e componentização (Aula 05)
   - useState para o texto digitado e para o array de compromissos.
   - Cada compromisso deve ser um objeto:
     { id, texto, criadoEm }
     (id único: Date.now().toString() ou similar)
   - CompromissoInput.js
     Props sugeridas: value, onChangeText, onAdd, labels
   - CompromissoList.js
     Props sugeridas: itens, onDelete, tituloLista, listaVazia
   - Renderizar a lista com .map OU FlatList (FlatList é bem-vindo).
   - Se usar .map dentro de ScrollView, a View pai deve limitar a altura
     (como nas aulas).

D) Eventos e remoção (Aula 06)
   - Adicionar: não permitir texto vazio (Alert.alert).
   - Remover: Pressable no item + filter por id.
   - Feedback de toque: android_ripple (Android) e/ou estilo pressed.
   - key estável baseada no id (não usar index como identidade do item).

E) Persistência (Aula 06)
   - Chave AsyncStorage: '@rotina_iesb_compromissos'
   - useEffect (montagem) para CARREGAR a lista (JSON.parse).
   - useEffect (dependência da lista) para SALVAR (JSON.stringify).
   - try/catch com mensagem amigável em caso de erro.
   - Ao fechar e reabrir o app, a lista deve permanecer.


7. DESAFIOS OPCIONAIS (nota extra — escolha até 2)
--------------------------------------------------
O1. Campo "categoria" (aula / estudo / trabalho / lazer) com filtro
    por categoria (pode ser com Pressable ou Switch).
O2. Marcar compromisso como concluído (campo concluido: boolean) e
    estilo riscado no texto.
O3. Contador no cabeçalho: "X pendentes".
O4. Trocar ScrollView/.map por FlatList com ListEmptyComponent.


8. ENTREGA
----------
- Repositório Git Link do Pull Request PR (sem node_modules e sem .expo).
- README.md contendo:
  1) comando usado para criar o projeto;
  2) prints: tela vazia, com itens, e após reabrir o app;
  3) breve mapa: onde está o useEffect de carga e o de salvamento;
  4) lista dos arquivos criados em components/ e labels.js.


9. CRITÉRIOS DE AVALIAÇÃO (10 pontos)
-------------------------------------
- Projeto sobe com npx expo start                          (1,0)
- labels.js + import/export corretos                       (1,0)
- Layout Flexbox coerente (header + form + lista)          (2,0)
- Componentização (Input + List) e props                   (2,0)
- useState, ids únicos, add/remove com filter              (1,5)
- Persistência AsyncStorage + useEffect + JSON             (2,0)
- README com prints e organização do código                (0,5)

Desafios opcionais: até +1,0 (não ultrapassa 10 na nota base;
pode compensar pequena falha em outro critério, a critério do professor).


10. ROTEIRO SUGERIDO EM SALA (aprox. 2 encontros)
-------------------------------------------------
Encontro A (estrutura + UI)
  1. Criar projeto e instalar libs
  2. Montar labels.js e esqueleto visual com Flexbox
  3. Extrair CompromissoInput e CompromissoList (ainda sem persistência)

Encontro B (estado + eventos + persistência)
  4. Ligar useState, adicionar e remover
  5. Pressable + ripple
  6. useEffect + AsyncStorage
  7. Testar reabertura do app e finalizar README


11. CHECKLIST RÁPIDO DO ALUNO
-----------------------------
[ ] npx create-expo-app@latest RotinaIESB --template blank
[ ] npx expo install async-storage e safe-area-context
[ ] labels.js com exports
[ ] SafeAreaProvider + SafeAreaView
[ ] Image + título no header
[ ] Flexbox: row no form, flex:1 na lista
[ ] components/CompromissoInput.js e CompromissoList.js
[ ] add com validação + remove com filter por id
[ ] Pressable nos itens
[ ] AsyncStorage carrega e salva com JSON
[ ] README com prints (incluindo “após reabrir”)


12. ERROS COMUNS (evitar)
-------------------------
- Usar SafeAreaView antigo de 'react-native' (preferir safe-area-context).
- Instalar AsyncStorage só com npm install (use npx expo install).
- Mutar o array (push/splice) em vez de setState com novo array.
- Usar index como id estável para remoção.
- Salvar no AsyncStorage só no onPress e esquecer o useEffect de carga.
- Esquecer JSON.stringify / JSON.parse.
- Entregar node_modules no ZIP/repositório.


13. RELAÇÃO COM AS DEMAIS ATIVIDADES DO CURSO
---------------------------------------------
- Atividade 01 (UI/Layout) e Atividade 02 (Estado/Persistência) podem
  ser usadas como preparação parcial.
- Esta atividade INTEGRADORA fecha o bloco das aulas 02–06 em um único
  entregável avaliativo.
- O Projeto Final (CampusGo) amplia depois com navegação, listas avançadas
  e módulos extras — não substitua este entregável pelo projeto final.