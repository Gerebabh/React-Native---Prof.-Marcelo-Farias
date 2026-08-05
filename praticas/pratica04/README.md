# 💻 Prática 04: Dando Vida ao App (Adicionar e Deletar)

Vamos conectar a interface ao React. Ao final, você digita uma tarefa, adiciona à lista e remove pelo `X`.

## 🎯 Objetivos

* Criar estados para o texto do input e para a lista.
* Implementar `handleAdd` e `handleDelete` com imutabilidade.
* Trocar cards estáticos por renderização com `.map()`.
* Validar o fluxo no Expo Go.

---

## 📦 Fluxo Git

1. Crie a Issue da **Prática 04**.
2. Branch:

```bash
git checkout -b feature/pratica04
```

3. Continue o app em `praticas/pratica04` (crie o Expo se ainda não existir, ou evolua a cópia da Prática 03).

```bash
npm install
npx expo start
```

---

## 🛠️ O que implementar

### 1. Estados

No componente principal:

* `taskText` — string do que está sendo digitado (`useState('')`)
* `tasks` — array de tarefas (`useState([])`)

### 2. Capturar digitação

No `TextInput`:

* `value={taskText}`
* `onChangeText={setTaskText}`

### 3. Função `handleAdd`

* Ignore texto vazio (`trim`).
* Crie objeto `{ id, title }` (`id` com `Date.now().toString()` é suficiente neste exercício).
* Atualize a lista com spread: `setTasks([...tasks, newTask])`.
* Limpe o input: `setTaskText('')`.
* Ligue essa função no `onPress` do botão `+`.

### 4. Renderizar com `.map()`

* Remova os cards hardcoded.
* Use `tasks.map(...)` para desenhar cada card.
* Não esqueça a prop `key={item.id}`.

### 5. Função `handleDelete(id)`

* Use `filter` para gerar nova lista sem o id clicado.
* Passe a função ao `onPress` do `X` de cada card.

---

## 🧪 Como testar

1. Adicione 3 tarefas diferentes.
2. Delete a do meio.
3. Confirme que o input limpa após adicionar.
4. (Esperado) Com muitas tarefas, a tela **pode não rolar bem** — isso será resolvido na próxima aula com `FlatList`.

---

## ✅ Critérios de entrega

* [ ] Adicionar e deletar funcionando no celular
* [ ] Estados + imutabilidade (sem `push`/`splice` no estado)
* [ ] Lista renderizada com `.map()`
* [ ] Issue, branch `feature/pratica04`, commit, push e Pull Request

### Commit sugerido

```bash
git add .
git commit -m "Feat: Implementa useState para adicionar e remover tarefas"
git push origin feature/pratica04
```

Na **Aula 05**, vamos melhorar listas (`FlatList`) e persistir dados no aparelho (`AsyncStorage`). A organização em componentes fica para a Aula 06.
