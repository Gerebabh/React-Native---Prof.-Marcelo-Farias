# Modelo de empresas e usuários

Este documento registra a estrutura proposta para o Pool Day atender mais de uma empresa e permitir que cada empresa trabalhe com seus tratadores.

## Organização dos dados

Os registros de trabalho ficam dentro da empresa. Assim, cada consulta começa pelo identificador da empresa do usuário.

```text
usuarios/{usuarioId}
empresas/{empresaId}
  membros/{usuarioId}
  clientes/{clienteId}
  locais/{localId}
  piscinas/{piscinaId}
  visitas/{visitaId}
```

### Empresa

Documento `empresas/{empresaId}`:

- `nome`
- `responsavelUid`: UID do responsável principal no Firebase Authentication
- `criadaEm`

### Membro

Documento `empresas/{empresaId}/membros/{usuarioId}`:

- `nome`
- `email`
- `papel`: `responsavel` ou `tratador`
- `ativo`
- `criadoEm`

O ID do documento é o UID do Firebase Authentication. O membro pertence à empresa indicada pelo caminho.

O documento `usuarios/{usuarioId}` guarda `empresaId`, `nome` e `email`. Esse perfil permite localizar a empresa do usuário após o login. O papel e a situação do acesso são conferidos no documento do membro dentro da empresa.

### Cliente, local e piscina

- `clientes/{clienteId}` guarda os dados da pessoa ou empresa atendida, como nome e contato.
- `locais/{localId}` guarda o endereço e o `clienteId` relacionado. Pode haver mais de um local para o mesmo cliente.
- `piscinas/{piscinaId}` guarda o `localId`, o tipo de piscina e a litragem. O padrão de tratamento pode ser incluído em uma etapa posterior.

A periodicidade e a cobrança previstas na issue #36 ficam relacionadas ao local atendido.

### Visita

Documento `empresas/{empresaId}/visitas/{visitaId}`:

- `localId` e `piscinaId`
- data, serviço e status
- `criadaPorUid` e `tratadorUid`
- justificativa, quando houver
- horários, endereço e coordenadas de chegada e saída
- referências das fotos antes e depois, quando forem armazenadas na nuvem

O responsável acompanha as visitas da empresa. O tratador trabalha nas visitas atribuídas ao seu UID e acessa os dados do local e da piscina necessários para executá-las.

## Acesso e separação entre empresas

O caminho `empresas/{empresaId}` define o limite dos dados. As regras em `firestore.rules` confirmam que o usuário está autenticado e tem um documento de membro ativo dentro da empresa indicada no caminho. A interface também deve consultar apenas os documentos da empresa atual; as regras do Firebase são a proteção final contra acesso a outra empresa.

O responsável pode consultar e manter os dados da própria empresa. O tratador pode consultar clientes, locais e piscinas da empresa e só pode consultar as visitas atribuídas ao seu UID em `tratadorUid`. Ele pode atualizar os dados da execução da visita, como status, justificativa, horários, localização e fotos, mas não pode criar ou excluir visitas nem alterar a atribuição. As consultas de visitas do tratador precisam incluir o filtro `tratadorUid == uid`; as regras não filtram resultados de consultas.

## Situação dos dados atuais

O login usa Firebase Authentication e busca o perfil em `usuarios/{uid}`, a associação em `empresas/{empresaId}/membros/{uid}` e os dados da empresa em `empresas/{empresaId}`. Clientes, locais, piscinas e visitas são gravados nas coleções da empresa. O responsável consulta todas as visitas; o tratador consulta apenas as visitas em que `tratadorUid` corresponde ao próprio UID.

O responsável cria o convite pela tela Equipe. O app cria a conta em uma instância separada e temporária do Firebase Authentication, grava em lote o perfil `usuarios/{uid}` e o vínculo `empresas/{empresaId}/membros/{uid}`, e envia um e-mail do Firebase para definir a senha. A sessão separada evita desconectar o responsável durante o cadastro. As regras do Firestore permitem a gravação apenas quando o responsável está ativo na empresa.

## Conferências para as próximas etapas

- Um usuário da empresa A não pode consultar os registros da empresa B.
- Um tratador só pode trabalhar nas visitas atribuídas a ele.
- O responsável pode consultar as visitas e os cadastros da própria empresa.
- Uma visita aponta para o local, a piscina e o tratador corretos.

Os cenários e resultados esperados para conferir as regras estão em `docs/testes-regras-firestore.md`.
