# 📚 Aula 05: Listas Eficientes e Persistência Local

Com o To-Do interativo, aparecem dois problemas típicos de app real:

1. Listas grandes com `.map()` pesam na performance e na rolagem.
2. Fechar o app **apaga** tudo (estado vive só na memória).

Nesta aula resolvemos isso com `FlatList`, AsyncStorage e `useEffect`. A organização do código em componentes fica para a **Aula 06**.

## 🎯 Objetivos da Aula

* Entender por que `.map()` não escala bem em listas longas no mobile.
* Usar `<FlatList>` para rolagem eficiente.
* Persistir dados com `@react-native-async-storage/async-storage`.
* Carregar dados na abertura do app com `useEffect`.

---

## 📜 Por que `FlatList`?

Na web, `.map()` é comum. No mobile, uma lista com centenas de itens tenta desenhar **tudo de uma vez** e pode travar a UI.

A `FlatList` usa virtualização: renderiza sob demanda, aproximadamente o que está visível na tela. Ao rolar, recicla itens que saíram da área visível.

### Props essenciais

| Prop | Função |
| :--- | :--- |
| `data={tasks}` | Array de origem |
| `keyExtractor={(item) => item.id}` | Identificador único de cada item |
| `renderItem={({ item }) => ...}` | Como desenhar cada linha |

```javascript
<FlatList
  data={tasks}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <View>
      <Text>{item.title}</Text>
      <TouchableOpacity onPress={() => handleDelete(item.id)}>
        <Text>X</Text>
      </TouchableOpacity>
    </View>
  )}
/>
```

Por enquanto o card pode continuar **dentro** do `renderItem` no `App.js`. Na próxima aula vamos extrair isso para um componente.

---

## 💾 AsyncStorage (persistência local)

`useState` mora na RAM: fechou o app, perdeu os dados.

O AsyncStorage funciona como um **gaveteiro chave → valor** no aparelho. Só grava **strings**.

* Salvar objeto/array: `JSON.stringify(...)`
* Ler de volta: `JSON.parse(...)`
* Operações são **assíncronas** (`async` / `await`)

Instalação no projeto Expo:

```bash
npx expo install @react-native-async-storage/async-storage
```

Ideia geral:

```javascript
await AsyncStorage.setItem('@tasks', JSON.stringify(tasks));

const raw = await AsyncStorage.getItem('@tasks');
const parsed = raw ? JSON.parse(raw) : [];
```

---

## ⏱️ `useEffect` — carregar ao abrir

Para buscar as tarefas salvas **quando a tela monta**:

```javascript
import { useEffect } from 'react';

useEffect(() => {
  loadTasks();
}, []); // [] = executar uma vez na montagem
```

Boas práticas neste exercício:

* `loadTasks` no `useEffect` com `[]`.
* `saveTasks` sempre que a lista mudar (após add e após delete), com a lista **já atualizada**.

---

## 🔁 Fluxo mental

```text
App abre → useEffect → loadTasks → setTasks → FlatList desenha
Usuário adiciona → setTasks → saveTasks → disco atualizado
Usuário fecha o app → RAM zera, disco mantém
App abre de novo → loadTasks restaura a lista
```

---

## ✅ Checklist de compreensão

1. Quais 3 props básicas a `FlatList` exige?
2. Por que AsyncStorage precisa de `JSON.stringify`?
3. O que o array `[]` no `useEffect` significa?
4. Quando chamar `saveTasks` neste exercício?

Na **Prática 05**, você troca `.map()` por `FlatList` e faz o app **lembrar** das tarefas após fechar.
