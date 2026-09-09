# Prática 05 — MetasSemestre

**Disciplina:** Programação para Dispositivos Móveis (React Native / Expo)

**Professor:** Marcelo Alves Farias — IESB

**Aulas relacionadas:** 05 e 06

**Pasta de desenvolvimento:** `pratica05`

## 1. Objetivo

Aplicar `useState`, props, componentização, `Pressable`, `useEffect` e `AsyncStorage` em um app de metas acadêmicas com persistência local.

## 2. Contexto do app

Evoluir ou recriar o app **MetasSemestre**.

O aluno cadastra metas de estudo, remove itens e os dados sobrevivem ao fechar o aplicativo.

## 3. Preparação

```bash
npx create-expo-app@latest MetasSemestre --template blank
cd MetasSemestre
npx expo install @react-native-async-storage/async-storage react-native-safe-area-context
```

## 4. Requisitos obrigatórios

### A) Estado e lista

- [ ] Usar `useState` para o texto do input e para o array de metas.
- [ ] Representar cada meta como um objeto: `{ id, texto, criadaEm }`.
- [ ] Gerar um `id` único com `Date.now().toString()` ou similar.

### B) Componentização

Criar os componentes na pasta `components/`:

- [ ] `MetaInput.js`: `TextInput` e botão/`Pressable` de adicionar.
  - Props sugeridas: `value`, `onChangeText`, `onAdd`.
- [ ] `MetaList.js`: lista de metas.
  - Props sugeridas: `metas`, `onDelete`.

### C) Eventos

- [ ] Adicionar metas e impedir texto vazio, usando `Alert`.
- [ ] Remover metas com `Pressable` e `filter` por `id`.
- [ ] Oferecer feedback visual no Android com `android_ripple`, quando fizer sentido.

### D) Persistência

- [ ] Usar `useEffect` para carregar as metas do `AsyncStorage` na montagem.
- [ ] Usar a chave `@metas_semestre`.
- [ ] Usar `useEffect` para salvar sempre que a lista mudar.
- [ ] Usar `JSON.stringify` e `JSON.parse`.
- [ ] Tratar erros com `try/catch` e mensagem amigável.

### E) Interface

- [ ] Usar `SafeAreaProvider` e `SafeAreaView`.
- [ ] Criar cabeçalho com `Image` local em `assets/` e título.
- [ ] Implementar lista rolável, preferencialmente com `FlatList`.

## 5. Desafio opcional — Nota extra

- [ ] Marcar metas como concluídas usando o campo `concluida: boolean` e estilo riscado.
- [ ] Exibir no cabeçalho o contador: “X pendentes / Y concluídas”.

## 6. Entrega

- [ ] Link do Pull Request (PR).
- [ ] README com prints da lista vazia, com itens e após reabrir o app.
- [ ] Breve explicação no README de onde estão o `useEffect` de carga e o de salvamento.

## 7. Critérios de avaliação

| Critério | Pontuação |
| --- | ---: |
| Componentização clara (`MetaInput` + `MetaList`) | 2,0 |
| `useState`, IDs únicos e remoção com `filter` | 2,0 |
| Persistência correta com `AsyncStorage` e `useEffect` | 3,0 |
| Validação e UX (`Alert`, ripple/pressed) | 1,5 |
| README e organização do código | 1,5 |
| **Total** | **10,0** |
