# 📚 Aula 06: Componentização e Props

Até aqui o To-Do já adiciona, remove, rola com `FlatList` e persiste no aparelho. O próximo salto não é uma funcionalidade nova para o usuário — é **qualidade de código**: o `App.js` tende a ficar grande, misturando estado, storage e visual do card.

Nesta aula você aprende a pensar em “blocos de Lego”: componentes reutilizáveis que se comunicam por **props**.

## 🎯 Objetivos da Aula

* Entender o que é **componentização** e por que ela importa.
* Estruturar pastas em um projeto real (`src/components`).
* Usar **props** para passar dados e funções do pai para o filho.
* Separar responsabilidade: `App` orquestra; `TaskCard` desenha.

---

## 🧱 O que é componentização?

No React, um componente é uma função JavaScript que retorna UI. Em vez de um arquivo com centenas de linhas, quebramos a interface em pedaços menores, reutilizáveis e independentes.

| Antes | Depois |
| :--- | :--- |
| Card da tarefa copiado/colado dentro do `renderItem` | Arquivo `TaskCard.js` importado onde precisar |
| Mudar borda do card = caçar JSX no meio do `App` | Mudar estilos só no `TaskCard` |
| Difícil testar/ler | Cada arquivo tem uma responsabilidade clara |

---

## 📂 Estrutura de pastas sugerida

No mercado, não deixamos tudo solto na raiz. Uma organização comum:

```text
src/
  components/   → pedaços de UI (TaskCard, Botões, Inputs)
  screens/      → telas inteiras (Home, Login) — quando o app crescer
  services/     → storage, APIs — quando fizer sentido extrair
```

Nesta aula/prática o foco é `src/components/TaskCard`.

---

## 🤝 Props: comunicação entre arquivos

Quando o card sai do `App`, surge a pergunta: o estado `tasks` e o `handleDelete` ficaram no pai — como o filho apaga um item?

**Props** são como parâmetros de função no mundo React: o pai envia valores e callbacks; o filho só usa o que recebe.

### No pai (`App.js`)

```javascript
<TaskCard
  title={item.title}
  onDelete={() => handleDelete(item.id)}
/>
```

### No filho (`TaskCard.js`)

```javascript
export function TaskCard({ title, onDelete }) {
  return (
    <View>
      <Text>{title}</Text>
      <TouchableOpacity onPress={onDelete}>
        <Text>X</Text>
      </TouchableOpacity>
    </View>
  );
}
```

Fluxo:

```text
App (tem o estado e handleDelete)
  └── FlatList
        └── TaskCard (recebe title + onDelete)
              └── toque no X → chama onDelete → pai atualiza a lista
```

O filho **não precisa** conhecer AsyncStorage nem o array completo — só o texto e “o que fazer ao deletar”.

---

## 🧩 O que costuma ir para o `TaskCard`

* JSX do card (`View`, `Text`, botão `X`)
* `StyleSheet` específico do card
* Props mínimas: `title`, `onDelete` (e outras se precisar depois)

O que **fica** no `App` (nesta etapa):

* `useState` / `useEffect`
* `handleAdd` / `handleDelete`
* `saveTasks` / `loadTasks`
* A `FlatList` e a área de input

---

## ✅ Checklist de compreensão

1. Qual problema a componentização resolve?
2. O que são props na relação pai → filho?
3. Por que o `TaskCard` não precisa importar o AsyncStorage?
4. O que deve ficar em `src/components/`?

Na **Prática 06**, você refatora o app da Prática 05 extraindo o `TaskCard` — o comportamento para o usuário deve permanecer o mesmo.
