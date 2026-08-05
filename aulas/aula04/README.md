# 📚 Aula 04: Estado, Interatividade e Imutabilidade

Na aula anterior a tela *parece* um app de tarefas, mas digitar e tocar no botão **não muda nada de verdade**. Interfaces React são declarativas: elas mostram o que está no **estado**. Sem estado, a UI é só um desenho estático.

## 🎯 Objetivos da Aula

* Diferenciar variável comum de estado (`useState`).
* Entender re-renderização: por que a tela atualiza.
* Capturar texto do usuário com `TextInput` controlado.
* Aplicar a regra da **imutabilidade** em listas.

---

## 🧠 O problema da variável comum

```javascript
let nome = 'Maria';
nome = 'João'; // a variável muda, a tela NÃO
```

O React Native **não fica olhando** variáveis soltas. Ele só redesenha a interface quando um **estado** muda por meio da função setter.

---

## 🎣 Hook `useState`

```javascript
import { useState } from 'react';

const [taskText, setTaskText] = useState('');
const [tasks, setTasks] = useState([]);
```

| Parte | Significado |
| :--- | :--- |
| `taskText` | Valor atual (o que está digitado) |
| `setTaskText` | Função que atualiza o valor **e** pede novo desenho da tela |
| `useState('')` | Valor inicial |

### Input controlado

Ligue o campo ao estado:

```javascript
<TextInput
  value={taskText}
  onChangeText={setTaskText}
  placeholder="Digite uma tarefa..."
/>
```

Agora o que aparece no campo **é** o estado — e o estado reflete o que o usuário digita.

---

## ➕ Adicionar itens em uma lista

Cada tarefa deve ser um objeto com identificação única, por exemplo:

```javascript
{
  id: Date.now().toString(),
  title: 'Estudar React Native',
}
```

Para adicionar **sem mutar** o array antigo:

```javascript
const handleAdd = () => {
  if (taskText.trim() === '') return;

  const newTask = {
    id: Date.now().toString(),
    title: taskText.trim(),
  };

  setTasks([...tasks, newTask]); // nova lista = cópia + item novo
  setTaskText(''); // limpa o campo
};
```

O operador spread (`...`) cria um **novo** array. Isso é essencial para o React perceber a mudança.

---

## 🛡️ Regra de ouro: imutabilidade

**Nunca altere o estado diretamente.** Substitua por um valor novo.

```javascript
// ❌ ERRADO — mutação; a tela pode não atualizar
tasks.push(newTask);

// ✅ CERTO — novo array
setTasks([...tasks, newTask]);

// ✅ Remover pelo id — novo array filtrado
setTasks(tasks.filter((item) => item.id !== idClicked));
```

### Por que `.filter` para deletar?

`filter` devolve um **array novo** só com os itens que passam no teste. Ideal para “remover” sem `splice` no array original.

---

## 🖼️ Renderizar a lista com `.map()`

Enquanto a lista for pequena, podemos fazer:

```javascript
{tasks.map((item) => (
  <View key={item.id}>
    <Text>{item.title}</Text>
    <TouchableOpacity onPress={() => handleDelete(item.id)}>
      <Text>X</Text>
    </TouchableOpacity>
  </View>
))}
```

* `key` ajuda o React a identificar cada item.
* Se a lista crescer muito, a rolagem/performance sofrem — na próxima aula entra a `FlatList`.

---

## 🔁 Ciclo mental da interatividade

```text
Usuário digita → onChangeText → setTaskText → tela redesenha o input
Usuário toca + → handleAdd → setTasks([...]) → tela redesenha a lista
Usuário toca X → handleDelete → setTasks(filter) → item some da tela
```

---

## ✅ Checklist de compreensão

1. Por que `let x = 1` não atualiza a UI?
2. O que `setTasks` faz além de guardar o valor?
3. Por que `push` no array de estado é problema?
4. Como ligar `TextInput` ao estado?

Na **Prática 04**, você conecta a UI da Prática 03 a essa lógica: adicionar e deletar tarefas de verdade.
