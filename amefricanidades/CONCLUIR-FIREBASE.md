# Entrega administrativa — Amefricanidades

## Estado atual

O site está publicado: https://malucesarrobot.github.io/IURIS-/amefricanidades/

Código: `malucesarrobot/IURIS-`, branch `main`, pasta `amefricanidades`. A raiz do Iuris foi preservada. A publicação pelo GitHub Pages já está funcionando.

A configuração administrativa do Firebase ainda precisa ser feita. O navegador do Codex recebeu erro 502 antes de abrir o login do Google. A usuária confirmou que consegue abrir o console em seu próprio navegador e autorizou o Claude a concluir essa etapa.

Conta administrativa: `malu.cesar@gmail.com`. O aplicativo também aceita `prof.malufc@gmail.com`, conforme configuração já usada no Planejamento.

## Projeto e caminhos exatos

O aplicativo usa Firebase Realtime Database no projeto **leciona-eaa56**. O ramo do concurso é **amefricanidades_2026**. Preserve a configuração em `config.js`: ela já corresponde ao projeto que tem as chamadas do Planejamento.

- Banco: `https://leciona-eaa56-default-rtdb.firebaseio.com`.
- Concurso: `/amefricanidades_2026`.
- Obras: `/amefricanidades_2026/catalog`.
- Chamadas copiadas para o concurso: `/amefricanidades_2026/roster`.
- Votos: `/amefricanidades_2026/ballots`.
- Abertura: `/amefricanidades_2026/settings/open`.
- Fonte preferida das chamadas: `/leciona/planejamento_gradebook/2026b4`.
- Fonte alternativa, se a primeira não tiver alunos: `/leciona/turmas` e `/leciona/alunos`.

O Firebase antigo do Iuris é **iuris-f02dc** e utiliza Firestore. Não basta trocar o `projectId` no aplicativo: isso exigiria adaptar o banco e trazer as chamadas de outro projeto. Para concluir esta entrega, mantenha o Realtime Database do Leciona.

## Ações no Firebase

1. Abra o projeto **leciona-eaa56** com a conta administrativa.
2. Em Authentication, confira os provedores Google e Anonymous. A votação utiliza acesso anônimo automático; somente a professora precisa entrar com Google. Não altere provedores já usados por outros aplicativos.
3. Confira se `malucesarrobot.github.io` está nos domínios autorizados. Autorize-o se estiver ausente.
4. Leia e guarde uma cópia das regras atuais do Realtime Database.
5. Adicione a propriedade `amefricanidades_2026` de `database.rules.fragment.json` dentro do objeto `rules`, preservando todos os demais ramos. Não use o arquivo `database.rules.test.json` para substituir regras de um projeto existente.
6. Confira permissões herdadas: um `.read` ou `.write` amplo em um ancestral pode conceder acesso que a regra mais restrita do concurso não revoga. Resolva isso sem quebrar Leciona, Planejamento ou outros aplicativos.
7. Publique as regras integradas e confirme ausência de erro de compilação.

## Importar as chamadas

1. Abra o site → Professora → Entrar com Google.
2. Use `malu.cesar@gmail.com`.
3. Toque em Importar chamadas.
4. Confira presença de alunos nas sete turmas: 1ª A, 1ª B, 2ª A, 2ª B, 3ª A, 3ª B e 3ª C.
5. Confira ausência do 9º ano. O código consolida registros por matrícula para não duplicar a mesma pessoa por disciplina. As matrículas são usadas para gerar um identificador opaco e não são copiadas para o cadastro do concurso.

Não publique as chamadas em arquivos do repositório GitHub. O aplicativo carrega os nomes pelo Firebase.

## Cadastro das obras

Foto da máscara; número de 1 a 9999; título opcional; texto de apresentação obrigatório; turma e um autor obrigatório; segundo autor opcional, inclusive de outra turma. A mesma pessoa não pode ocupar as duas autorias. A foto é reduzida no aparelho antes do envio.

A usuária enviará uma primeira máscara para calibrar e cadastrará outras posteriormente. Não crie máscaras fictícias na produção.

## Conferência final

- Acesso da professora autorizado e acesso administrativo negado a outras contas.
- Cadastro e edição de foto, texto e autoria; persistência após recarregar.
- Galeria atualizada em outro dispositivo.
- Exatamente três máscaras diferentes por voto.
- Voto repetido para o mesmo estudante recusado pelo banco, também de outro dispositivo.
- Máscara inexistente ou oculta recusada pelo banco.
- Votação fechada recusando novos votos.
- Ranking atualizado em dois dispositivos, três escolhas por estudante e empates preservados.
- QR code abrindo o endereço de produção.
- Exportação de resultados em CSV, sem nomes dos votantes.

Use um ambiente separado para testes com dados fictícios. Não deixe votos de teste no concurso real. A professora decide quando abrir a votação; mantenha-a fechada até haver três máscaras reais e a conferência estar concluída.

O prazo de **14 de outubro** no cartaz é a entrega das obras, não encerramento automático da votação.

## Limite da identificação simples

Turma e nome permitem uma participação por cadastro, mas não comprovam que a pessoa que escolheu o nome é a titular dele. A usuária pediu entrada simples, sem códigos individuais. Não apresente o sistema como prova de identidade.

## Finalização

Se houver correção de código, atualize somente a pasta `amefricanidades`, preserve a configuração do projeto e confirme o Pages. Informe a conclusão das etapas e qualquer pendência. Não abra a votação nem substitua o banco existente sem necessidade.

## Verificações já concluídas pelo Codex em 13/10/2026

- Sete testes locais de lógica passaram: escolhas distintas, totalização, empates, consolidação das chamadas por matrícula, exclusão do 9º ano, homônimos e exportação CSV.
- Dezoito verificações passaram no emulador oficial do Firebase Realtime Database, projeto isolado `demo-amefricanidades`: catálogo público; chamadas exigindo autenticação; leitura autenticada; proibição de cadastro por estudante; restrição administrativa por conta; cadastro completo pela professora; exclusão do 9º ano; recusa de escolhas repetidas, máscara inexistente, máscara oculta, campos extras, estudante inexistente e voto sem autenticação; aceitação de três escolhas distintas; recusa de sobrescrita de voto em outro dispositivo; recusa de exclusão do voto; encerramento pela professora; recusa de votos com votação fechada.
- Sintaxe JavaScript, IDs dos controles HTML e existência dos recursos locais conferidos.
- Cartaz A4 com QR code gerado, renderizado e revisado visualmente.
- A versão inicial foi publicada e respondeu HTTP 200, com os arquivos principais disponíveis.

Esses resultados conferem as regras isoladas. A integração com as regras atuais do projeto real, o acesso às chamadas, o login da professora e a atualização entre dispositivos em produção continuam pendentes de configuração e teste pelo Claude. Não declare a votação pronta antes dessas etapas.
