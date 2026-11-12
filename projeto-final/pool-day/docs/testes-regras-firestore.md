# Conferência das regras do Firestore

As regras estão em `firestore.rules`. O projeto está configurado para usar esse arquivo no emulador local por meio de `firebase.json`.

## Cenários de acesso

Use dois usuários autenticados, cada um com empresa e documento de membro ativos. Inclua também um tratador na empresa A e visitas atribuídas a ele e a outro tratador.

| Cenário | Resultado esperado |
| --- | --- |
| Sem login, ler ou gravar qualquer documento | Negado |
| Usuário A consultar o perfil `usuarios/{uidA}` | Permitido |
| Usuário A consultar o perfil `usuarios/{uidB}` | Negado |
| Membro ativo consultar a própria empresa e o próprio documento de membro | Permitido |
| Usuário A consultar dados da empresa B | Negado |
| Responsável consultar e alterar clientes, locais, piscinas e visitas da própria empresa | Permitido |
| Tratador consultar clientes, locais e piscinas da própria empresa | Permitido |
| Tratador criar ou excluir cliente, local, piscina ou visita | Negado |
| Tratador consultar visita atribuída ao próprio UID | Permitido |
| Tratador consultar visita atribuída a outro UID | Negado |
| Tratador atualizar status, justificativa, horários, localização e fotos da visita atribuída | Permitido |
| Tratador mudar `tratadorUid` ou os dados de agendamento da visita | Negado |
| Membro inativo ou papel diferente de `responsavel`/`tratador` | Negado |

## Consultas de visitas

As regras não funcionam como filtros: se uma consulta puder retornar uma visita não atribuída ao tratador, toda a consulta é negada. Ao listar visitas como tratador, filtrar por `tratadorUid == uid` e consultar dentro de `empresas/{empresaId}/visitas`. O responsável pode listar as visitas da própria empresa sem esse filtro.

## Execução automatizada

Os testes automatizados das regras usam o Firebase Local Emulator Suite e `@firebase/rules-unit-testing`. Instale o Firebase CLI (`npm install --global firebase-tools`) e Java 21 ou superior para usar a versão atual do emulador. Depois execute `npm run test:regras`. A configuração do emulador aponta para `firestore.rules` e usa a porta 8080.

Os testes da criação de convites ficam em `functions/test` e podem ser executados com `npm run test:funcoes`. A função exige que o usuário conectado seja responsável ativo da empresa e cria o tratador apenas nessa empresa.
