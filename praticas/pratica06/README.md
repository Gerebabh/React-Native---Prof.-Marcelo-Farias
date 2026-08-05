# 💻 Prática 06: Arrumando a Casa (Componentização)

Nesta prática o app **não ganha funcionalidade nova** para o usuário final. O objetivo é melhorar a **qualidade do código**: extrair o visual da tarefa para um componente separado, deixando o `App` mais limpo.

## 🎯 Objetivos

* Criar a estrutura `src/components`.
* Extrair o card da tarefa para `TaskCard` com props.
* Manter FlatList, add/delete e persistência funcionando (teste de regressão).

---

## 📦 Fluxo Git

1. Crie a Issue da **Prática 06**.
2. Branch:

```bash
git checkout -b feature/pratica06
```

3. Trabalhe em `praticas/pratica06` (evolua a base da Prática 05).

```bash
npm install
npx expo start
```

---

## 🛠️ O que fazer

### 1. Estrutura de pastas

Na raiz do projeto Expo, crie:

```text
src/components/
```

### 2. Criar `TaskCard`

1. Crie `src/components/TaskCard.js` (ou `.jsx`).
2. Recorte o JSX do card (a `View`, o `Text` e o `TouchableOpacity` do `X`) que está dentro do `renderItem` no `App`.
3. Leve junto os estilos (`StyleSheet`) referentes ao card.
4. Exporte o componente recebendo props `{ title, onDelete }`.

Exemplo de forma do filho:

```javascript
export function TaskCard({ title, onDelete }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity onPress={onDelete}>
        <Text>X</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### 3. Usar no `App`

```javascript
import { TaskCard } from './src/components/TaskCard';

// na FlatList:
renderItem={({ item }) => (
  <TaskCard
    title={item.title}
    onDelete={() => handleDelete(item.id)}
  />
)}
```

> Se na prática anterior o campo se chamava `task` em vez de `title`, padronize para `title` **ou** adapte o nome da prop — pai e filho precisam falar a mesma língua.

### 4. O que NÃO precisa mudar

* Lógica de `handleAdd` / `handleDelete`
* AsyncStorage e `useEffect`
* Estrutura da `FlatList` (`data`, `keyExtractor`)

Só a **forma** de desenhar cada item muda.

---

## 🧪 Teste de regressão

No Expo Go, confirme que o app continua:

1. Adicionando tarefas
2. Removendo pelo `X`
3. Rolando a lista
4. Mantendo dados após fechar e reabrir o app

Se algo parou, revise as props e o caminho do `import`.

---

## ✅ Critérios de entrega

* [ ] `TaskCard` em `src/components` com props `{ title, onDelete }`
* [ ] `FlatList` usando o novo componente
* [ ] Add, delete e persistência intactos
* [ ] Issue, branch `feature/pratica06`, commit, push e Pull Request

### Commit sugerido

```bash
git add .
git commit -m "Refactor: Extrai interface da tarefa para componente TaskCard"
git push origin feature/pratica06
```

Parabéns: ao final desta trilha você saiu do zero até um To-Do multiplataforma com persistência e código organizado em componentes.
