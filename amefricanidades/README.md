# Amefricanidades — concurso de máscaras

Site estático para GitHub Pages, com Firebase Realtime Database e Google Authentication para a professora. A configuração inicial utiliza o Firebase do Leciona, em um ramo próprio chamado `amefricanidades_2026`. Não há alteração dos dados do Planejamento ou do Leciona.

## Fluxo dos estudantes

Turma → nome na chamada → três máscaras diferentes → confirmação. Cada máscara escolhida recebe um voto. A identificação não exige senha ou código. O acesso anônimo do Firebase ocorre automaticamente, sem tela de login para estudantes.

O voto só aparece como confirmado após o banco aceitar a gravação. Repetições do mesmo estudante são bloqueadas pelas regras do banco, inclusive em celulares diferentes. A escolha pelo nome não comprova a identidade: alguém pode selecionar outro estudante. Este é um limite deliberado do fluxo simples solicitado.

As turmas são 1ª A, 1ª B, 2ª A, 2ª B, 3ª A, 3ª B e 3ª C. Não há 9º ano. Ao importar as chamadas, matrículas e registros de disciplinas são consolidados para evitar votos múltiplos do mesmo estudante; o aplicativo só mantém nome e turma, com identificador opaco. Matrículas, notas e frequência não são copiadas para o concurso.

## Área da professora

1. Entrar com uma das contas Google já autorizadas no Leciona.
2. Importar chamadas. O primeiro caminho é o caderno de notas/chamadas do Planejamento; o Leciona original é alternativa quando o caderno não tem estudantes.
3. Adicionar foto, número, título opcional e texto. Selecionar um ou dois autores na chamada, inclusive dupla de turmas diferentes.
4. Salvar cada máscara. A foto é reduzida no aparelho antes do envio e armazenada com a obra, sem necessidade de Firebase Storage ou contratação de um plano pago para fotos.
5. Abrir a votação quando houver pelo menos três máscaras. O cadastro pode continuar aberto e a professora pode encerrar a votação sem apagar dados.

Máscaras com votos não podem ser ocultadas pelo painel. O ranking preserva empates, usa o número da máscara apenas para ordenar a exibição de empatadas e permite projeção em tela cheia. Os resultados podem ser baixados em CSV. A tela de resultados gera um QR code localmente para o endereço real do site; pode ser baixado como imagem.

## Configuração administrativa pendente

1. Criar o repositório `amefricanidades` na conta `malucesarrobot` e enviar os arquivos. Ativar GitHub Pages na branch principal, pasta raiz.
2. Em Firebase Authentication, autorizar o domínio do GitHub Pages e conferir os provedores Google e Anonymous. Evitar alterações em provedores já utilizados pelos outros aplicativos.
3. Ler as regras existentes do Realtime Database e adicionar somente a propriedade de `database.rules.fragment.json` dentro de `rules`. Preservar todos os demais ramos. O arquivo `database.rules.test.json` é exclusivamente para um projeto vazio/emulador: NÃO substitui as regras atuais do Leciona.
4. Verificar se algum `.read` ou `.write` do projeto existente em um ancestral concede permissões mais amplas, pois regras de filhos não revogam concessões em ancestrais. Não publicar sem conferir esse ponto.
5. Conferir o login, importar as chamadas atuais, cadastrar a primeira máscara e testar voto repetido e atualização entre dois dispositivos. A votação deve permanecer fechada até a conferência.

O QR code usa o endereço onde a página foi aberta. `voteUrl` em `config.js` pode fixar o endereço de produção. A data de 14/10 indicada no cartaz é prazo de entrega das obras, não data automática de encerramento da votação.

## Verificações locais

`node --test core.test.cjs`

`node --check app.js`

Os testes cobrem escolhas distintas, totalização, empates, exclusão do 9º ano, consolidação por matrícula e homônimos. A inspeção de regras em arquivo não substitui teste no emulador/Firebase. Os testes em produção exigem sessão administrativa ativa.

## Dependências

Firebase Web SDK 10.12.0 (mesma versão do Planejamento), arquivos compat locais; qrcode-generator 1.4.4 (MIT), local. Fontes Barlow Condensed e DM Sans via Google Fonts, com fontes de sistema alternativas. O cartaz foi fornecido pela organização.

## Estrutura

- `index.html`, `style.css`, `app.js`: interface e interação.
- `core.js`: seleção, apuração e consolidação das chamadas.
- `config.js`: configuração web pública; não contém senha da professora.
- `cartaz.jpg`: identidade visual fornecida.
- `vendor/`: SDKs e gerador de QR.
- `database.rules.fragment.json`: ramo de regras a integrar ao projeto existente.

Não existe simulação automática ou gravação local de votos usada como resultado real. Se o banco estiver indisponível, a página informa a falha e não confirma o voto.
