# 📚 Aula 03: Componentes Core, StyleSheet e Flexbox

Com o projeto rodando, chegou a hora de **desenhar interfaces de verdade**. Nesta aula você aprende o “HTML e o CSS” do React Native: componentes nativos, estilo em JavaScript e layouts com Flexbox.

## 🎯 Objetivos da Aula

* Mapear tags da web para componentes do React Native.
* Usar `View`, `Text`, `TextInput`, `TouchableOpacity`, `ScrollView` e `Image`.
* Estilizar com `StyleSheet.create` (camelCase, sem `px`).
* Entender Flexbox no mobile (`column` por padrão).

---

## 🧱 Componentes Core (o “HTML” do mobile)

No React Native você **importa** os componentes do pacote `react-native`. Não existem `<div>`, `<p>` ou `<button>` HTML.

| Web (React) | React Native | Para que serve |
| :--- | :--- | :--- |
| `<div>` | `<View>` | Container / agrupamento de elementos |
| `<p>`, `<h1>`, `<span>` | `<Text>` | Qualquer texto na tela |
| `<input type="text">` | `<TextInput>` | Campo de digitação |
| `<button>` | `<TouchableOpacity>` / `<Pressable>` | Área tocável (botão) |
| rolagem da página | `<ScrollView>` | Conteúdo que precisa rolar |
| `<img>` | `<Image>` | Exibir imagens |

### Regras de ouro para iniciantes

1. **Texto sempre dentro de `<Text>`.**
2. **Layout sempre com `<View>`** (ou listas especializadas, que virão depois).
3. Componentes precisam ser **importados**:

```javascript
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
```

### `TextInput` (digitação)

Props essenciais no início:

* `placeholder` — texto de dica
* `value` — valor controlado (quando usarmos estado)
* `onChangeText` — função chamada a cada letra digitada

### `TouchableOpacity` (toque)

Envolve o conteúdo do botão. A prop `onPress` define o que acontece no toque. Visualmente reduz a opacidade ao pressionar — feedback natural no mobile.

### `ScrollView`

Quando o conteúdo é maior que a tela, envolva-o em `ScrollView`. Para listas longas e dinâmicas, mais adiante usaremos `FlatList` (mais eficiente).

---

## 🎨 StyleSheet (o “CSS” do mobile)

Não há arquivos `.css` clássicos. Estilos são objetos JavaScript:

```javascript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
});
```

Uso:

```javascript
<View style={styles.container}>
  <Text style={styles.title}>Minhas Tarefas</Text>
</View>
```

Diferenças importantes em relação ao CSS da web:

* Propriedades em **camelCase**: `backgroundColor`, não `background-color`.
* Valores numéricos **sem `px`**: `fontSize: 16`.
* Unidades são independentes de densidade (o RN adapta ao celular).
* Você pode passar um array de estilos: `style={[styles.base, styles.destaque]}`.

---

## 📦 Flexbox no React Native

Flexbox é a forma principal de montar layout no RN.

### Diferença crucial em relação à web

| | Web (padrão) | React Native (padrão) |
| :--- | :--- | :--- |
| `flexDirection` | `row` (lado a lado) | **`column`** (um embaixo do outro) |

Isso combina com a tela do celular: conteúdo empilhado verticalmente.

### Propriedades mais usadas

* `flexDirection`: `'column'` | `'row'`
* `justifyContent`: alinha no **eixo principal** (`flex-start`, `center`, `space-between`, `space-around`, …)
* `alignItems`: alinha no **eixo cruzado**
* `flex: 1`: o elemento “cresce” para ocupar o espaço disponível
* `gap` (quando suportado no seu ambiente) ou `margin` para espaçamento

### Exemplo: input e botão na mesma linha

```javascript
<View style={{ flexDirection: 'row', alignItems: 'center' }}>
  <TextInput style={{ flex: 1 }} placeholder="Nova tarefa" />
  <TouchableOpacity>
    <Text>Add</Text>
  </TouchableOpacity>
</View>
```

A `View` externa usa `row`; o `TextInput` com `flex: 1` ocupa o espaço restante.

---

## 🖼️ Esqueleto mental de uma tela

```text
View (tela inteira, flex: 1, padding)
 ├── Text (título)
 ├── View (row: input + botão)
 │    ├── TextInput
 │    └── TouchableOpacity
 └── ScrollView / lista de cards
      ├── View (card)
      └── View (card)
```

---

## ✅ Checklist de compreensão

1. Por que não usamos `<div>` e `<p>` no React Native?
2. Qual a diferença de `flexDirection` padrão entre web e mobile?
3. Como criar um estilo reutilizável com `StyleSheet`?
4. Como colocar dois elementos lado a lado?

Na **Prática 03**, você aplica tudo isso montando a **interface estática** do app de tarefas (ainda sem lógica de adicionar/remover).
