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

O caminho `empresas/{empresaId}` define o limite dos dados. As regras do Firestore deverão confirmar que o usuário autenticado é membro daquela empresa e respeitar seu papel. A interface também consultará apenas os documentos da empresa atual, mas a separação precisa ser validada pelas regras do Firebase.

Uma visita atribuída a um tratador deve ter o UID dele em `tratadorUid`. A associação do usuário à empresa será verificada antes de permitir acesso à visita.

## Situação dos dados atuais

Atualmente, clientes, locais e visitas são mantidos no estado do React Native. O projeto ainda não usa Firebase Authentication, Firestore ou Firebase Storage, então não há registros persistidos na nuvem para migrar. Quando a persistência for implementada, a criação da empresa deverá anteceder os novos cadastros, que já serão salvos dentro do caminho da empresa.

## Conferências para as próximas etapas

- Um usuário da empresa A não pode consultar os registros da empresa B.
- Um tratador só pode trabalhar nas visitas atribuídas a ele.
- O responsável pode consultar as visitas e os cadastros da própria empresa.
- Uma visita aponta para o local, a piscina e o tratador corretos.

As conferências de acesso serão automatizadas junto com a implementação das regras na issue #43.
