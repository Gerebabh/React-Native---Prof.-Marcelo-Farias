# Prática 07 - Gerenciador de Despesas

Aplicativo simples em React Native com Expo, seguindo a organização das aulas 07 e 08.
Usa as versões do projeto local aula07.

## Executar

Na pasta do projeto:

```sh
npm install
npm start
```

Abra no Android ou iOS com um Expo Go compatível com o SDK 57 ou em um emulador.
O seletor de data utilizado nesta prática é nativo, para Android e iOS.

## Funcionalidades

- Abas Recentes e Todas, com botão + para cadastrar.
- Cadastro com descrição, valor, data e categoria.
- Valor com até duas casas decimais e validação dos campos obrigatórios.
- Categorias Alimentação, Transporte, Lazer e Contas, selecionadas com Pressable.
- Filtro por categoria em cada aba, incluindo a opção Todas.
- Componentes DespesaSaida, DespesaLista, DespesaItem e DespesaSumario.
- Soma com reduce e lista filtrada com filter.
- Categoria destacada no item e valores exibidos com R$ e toFixed(2).
- Toque em uma despesa para editar ou excluir.
- Recentes mostra hoje e os seis dias anteriores, sem incluir datas futuras.
- Bônus do enunciado: total acima de R$ 200,00 aparece em vermelho.

O estado fica no App.js com useState e é compartilhado por props.
As despesas ficam apenas na memória e são apagadas quando o aplicativo é reiniciado.
Não há banco de dados, busca ou tema escuro nesta prática.

## Conferência no celular

1. Tente salvar com campos vazios: deve aparecer um alerta.
2. Cadastre Alimentação de R$ 50,00 e Transporte de R$ 160,00 na data de hoje.
3. Em Todas, confira R$ 210,00 em vermelho. Filtre Alimentação: R$ 50,00 na cor padrão.
4. Edite o valor e a categoria de um item e confira a atualização da lista e do total.
5. Cadastre uma data futura e outra de oito dias atrás: ambas aparecem em Todas, mas não em Recentes.
6. Exclua uma despesa e confira o total. Cancele uma edição e confira que nada foi alterado.

Os arquivos estão diretamente em praticas/pratica07. A pasta Material foi preservada. Nenhuma operação de Git foi realizada.
