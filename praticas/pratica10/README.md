# Prática 10 — CampusGo

**Disciplina:** Programação para Dispositivos Móveis — IESB

**Professor:** Marcelo Alves Farias

## Proposta

O CampusGo é um novo app, em `campus-go/`, criado com o template blank e configurado com Expo Router. Ele dá continuidade à prática 09 reaproveitando `store/expenses-context.js` e a paleta de cores, mas usa outra navegação, como pede o enunciado.

O projeto continua em JavaScript, com componentes funcionais, StyleSheet, estado local, Context API e AsyncStorage. Os nomes do código seguem o padrão em inglês da Aula 09; os textos da interface ficam em português.

## Como executar

Na pasta `praticas/pratica10`:

```bash
cd campus-go
npm install
```

Crie o arquivo de ambiente se ele ainda não existir. No PowerShell:

```powershell
Copy-Item .env.example .env
```

No Git Bash:

```bash
cp .env.example .env
```

Depois:

```bash
npx expo start
```

Abra no Expo Go compatível com o **SDK 57**, a mesma versão principal usada na prática 09. Computador e celular devem estar na mesma rede para abrir pelo QR Code. O `.env` já foi criado localmente, mas não entra no Git. Depois de alterar esse arquivo, pare o Expo e execute `npx expo start --clear` novamente; reabra o app para usar o novo endereço.

## O que foi implementado

| Parte | Arquivos principais | Funcionamento |
| --- | --- | --- |
| Navegação | `app/_layout.js`, `app/(tabs)/_layout.js` | Stack e quatro abas com ícones: Início, Tarefas, Bolso e Perfil |
| Detalhe e modal | `app/task/[id].js`, `app/new-task.js` | O detalhe lê o id da URL; o modal e o detalhe voltam com `router.back()` |
| Bolso | `app/(tabs)/wallet.js`, `store/expenses-context.js` | Total com `reduce`, duas casas decimais e compartilhamento com `Share.share` |
| Foto | `app/(tabs)/profile.js`, `services/media.js` | Avatar abre a galeria; botão abre a câmera; negativa oferece Abrir ajustes |
| Persistência da foto | `services/media.js`, `app/(tabs)/profile.js` | Cópia da imagem para documentos do app e URI no AsyncStorage em `@profile-photo` |
| Check-in | `services/location.js`, `app/(tabs)/tasks.js` | Permissão em primeiro plano, endereço ou coordenadas; aviso se não houver permissão |
| Lembrete | `services/notifications.js`, `app/(tabs)/tasks.js` | Permissão e notificação local em 10 segundos; usa o canal padrão do Expo Go |
| Conclusão | `app/(tabs)/tasks.js` | Haptics com Success e Alert, mesmo se a vibração não estiver disponível |
| Mural | `services/api.js`, `hooks/useNotices.js`, `app/(tabs)/index.js` | Dez posts, carregando, erro, tentar novamente, lista vazia e puxar para atualizar |
| Animação | `components/FadeIn.js` | Surgimento dos avisos com Animated do React Native |

Não há NavigationContainer declarado no projeto nem registro de token para notificação push. O lembrete é somente local.

### Observações sobre a atividade

- A tarefa 42 e o modal são os exemplos de navegação pedidos. O enunciado não pede cadastro ou persistência de tarefas nesta etapa.
- O Bolso começa com `R$ 0.00` quando não há despesas salvas. O contexto da prática 09 foi copiado, mas dados de outro app não são transferidos automaticamente. Não foram adicionadas despesas fictícias. A aba lê a lista do contexto e compartilha o total atual.
- A lista, os títulos e os textos dos avisos vêm do JSONPlaceholder. A URL está somente no ambiente; `services/api.js` lê `process.env.EXPO_PUBLIC_API_URL`.
- O serviço da API verifica `response.ok` e tem um limite de espera. O hook desliga o carregamento no `finally` e ignora respostas antigas.
- O FadeIn usa somente Animated. Reanimated e Worklets estão nas versões compatíveis com o SDK por serem dependências utilizadas pelo Router.
- Os dois bônus opcionais (criar aviso e ícone pulsando) não foram implementados. O foco desta entrega são os requisitos obrigatórios.

## Estrutura

```text
campus-go/
├── app/
│   ├── _layout.js
│   ├── new-task.js
│   ├── task/[id].js
│   └── (tabs)/
│       ├── _layout.js
│       ├── index.js
│       ├── tasks.js
│       ├── wallet.js
│       └── profile.js
├── components/
│   ├── ActionButton.js
│   └── FadeIn.js
├── constants/theme.js
├── hooks/useNotices.js
├── services/
│   ├── api.js
│   ├── location.js
│   ├── media.js
│   └── notifications.js
├── store/expenses-context.js
├── .env.example
├── app.json
└── package.json
```

## Testes feitos no celular

- [x] Abrir o app e conferir as quatro abas.
- [x] Abrir e fechar o modal Nova tarefa; o campo vazio mostra uma mensagem e não cadastra.
- [x] Abrir o detalhe de uma tarefa e voltar. A captura mostra o exemplo com id 42.
- [x] Compartilhar o resumo do Bolso com o WhatsApp. A captura mostra o menu do sistema.
- [x] Tirar uma foto com a câmera e selecionar/trocar uma foto pela galeria. A troca pela galeria funcionou depois de reabrir o app.
- [x] Tocar em Estudei aqui e conferir o endereço retornado pelo aparelho.
- [x] Agendar o lembrete local e receber a notificação em cerca de 10 segundos.
- [x] Concluir uma tarefa e conferir que continua marcada como concluída.
- [x] Conferir os temas claro e escuro.
- [x] Puxar o mural para atualizar. O gesto é aceito; a lista pode permanecer igual porque a API devolve os mesmos avisos.
- [x] Conferir no celular a tela de erro do mural e o botão Tentar novamente.

## Prints

As nove capturas abaixo foram feitas no aparelho e estão em campus-go/screenshots:

- Início / mural carregado: [mural-api.png](campus-go/screenshots/mural-api.png)
- Tarefas: [minhas-tarefas.jpg](campus-go/screenshots/minhas-tarefas.jpg)
- Detalhe mostrando o id 42: [visualizar-tarefas.jpg](campus-go/screenshots/visualizar-tarefas.jpg)
- Bolso com total e botão de compartilhamento: [bolso.jpg](campus-go/screenshots/bolso.jpg)
- Perfil com foto: [perfil.jpg](campus-go/screenshots/perfil.jpg)
- Check-in com endereço: [check-in-localizacao.png](campus-go/screenshots/check-in-localizacao.png)
- Modal Nova tarefa: [nova-tarefa.jpg](campus-go/screenshots/nova-tarefa.jpg)
- Menu nativo de compartilhamento: [compartilhamento.jpg](campus-go/screenshots/compartilhamento.jpg)
- Mural em estado de erro: [mural-erro.jpg](campus-go/screenshots/mural-erro.jpg)

## Entrega

Branch: feature/pratica10. Antes de abrir o PR, confira se a descrição contém seu nome e matrícula e inclua as nove capturas desta pasta. Não envie .env, node_modules, .expo ou pastas de exportação de teste; esses arquivos estão no .gitignore.

## Verificações no computador

- ESLint: aprovado.
- Verificação de tipos: aprovada.
- Exportação do app e consulta ao JSONPlaceholder: aprovadas.
