# 💻 Prática 05: FlatList e App que Não Esquece

Nesta prática o To-Do ganha lista eficiente e persistência local. **Ainda não** vamos extrair componentes — isso é a Prática 06.

## 🎯 Objetivos

* Substituir `.map()` por `FlatList`.
* Salvar e carregar tarefas com AsyncStorage + `useEffect`.
* Validar que fechar e reabrir o app mantém os dados.

---

## 📦 Fluxo Git

1. Crie a Issue da **Prática 05**.
2. Branch:

```bash
git checkout -b feature/pratica05
```

3. Trabalhe em `praticas/pratica05` (evolua a base da Prática 04).

```bash
npm install
npx expo start
```

---

## 🛠️ Parte A — FlatList

1. Remova o `.map()` da lista.
2. Importe `FlatList` de `react-native`.
3. Configure:

* `data={tasks}`
* `keyExtractor={(item) => item.id}`
* `renderItem={...}` desenhando cada tarefa (card ainda pode ficar inline no `App`)

4. Teste adicionando **muitas** tarefas (15+) e confirme a rolagem suave.

---

## 🛠️ Parte B — AsyncStorage

1. Pare o bundler (Ctrl+C) e instale:

```bash
npx expo install @react-native-async-storage/async-storage
```

2. Crie `saveTasks` (async): grave a lista com `setItem` + `JSON.stringify`.
3. Chame `saveTasks` após adicionar e após deletar (com a lista já atualizada).
4. Crie `loadTasks` (async): leia com `getItem`, faça `JSON.parse` se houver valor, e use `setTasks`.
5. No `useEffect` com `[]`, chame `loadTasks()` na montagem.

### Teste extremo

Adicione 3 tarefas → feche o app por completo (remover dos recentes) → abra de novo → as tarefas devem continuar lá.

---

## ✅ Critérios de entrega

* [ ] `FlatList` rolando com muitos itens
* [ ] Persistência: fechar e reabrir mantém as tarefas
* [ ] Add e delete continuam funcionando
* [ ] Issue, branch `feature/pratica05`, commit, push e Pull Request

### Commit sugerido

```bash
git add .
git commit -m "Feat: Adiciona FlatList e AsyncStorage para persistir tarefas"
git push origin feature/pratica05
```

Na **Aula 06**, vamos **organizar o código**: extrair o card da tarefa para um componente reutilizável com props.
