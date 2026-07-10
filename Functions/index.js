const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');

const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');

// E-mails autorizados a usar o assistente (mesma lista das regras do Firestore/Storage).
const EMAILS_AUTORIZADOS = [
  'malu.cesar@gmail.com',
  'lizianeaparecidasilva@gmail.com'
];

const PROMPT_BASE = `Você é Lex, o assistente jurídico do escritório dentro do aplicativo Iuris.

Regras importantes:
- Você ajuda a RASCUNHAR peças, resumir processos, e organizar o raciocínio jurídico.
- Todo rascunho que você produzir é um PONTO DE PARTIDA — deve ser sempre revisado por um advogado antes de protocolar. Deixe isso claro quando gerar uma peça.
- Você não tem acesso à internet nesta conversa (a menos que seja avisado do contrário), então NUNCA cite número de processo, ementa, ou jurisprudência específica de memória — se não tiver certeza absoluta, diga que não tem certeza e recomende conferir na fonte oficial.
- Seja direto e objetivo, no tom formal-técnico usado na advocacia brasileira.
- Responda sempre em português do Brasil.`;

const PROMPT_DATA_VENIA = `\n\nModo "Data Venia" ativado: o usuário está pedindo uma SEGUNDA OPINIÃO crítica sobre uma decisão, classificação ou rascunho já feito (pelo usuário ou por você antes). Analise com espírito crítico genuíno — aponte riscos, alternativas e pontos fracos, não apenas concorde. Se a decisão original parecer sólida, diga isso também, mas justifique.`;

exports.chatComAssistente = onCall({ secrets: [ANTHROPIC_API_KEY], region: 'southamerica-east1' }, async (request) => {
  if (!request.auth || !request.auth.token.email) {
    throw new HttpsError('unauthenticated', 'Faça login para usar o assistente.');
  }
  const email = request.auth.token.email.toLowerCase();
  if (!EMAILS_AUTORIZADOS.map(e => e.toLowerCase()).includes(email)) {
    throw new HttpsError('permission-denied', 'Este e-mail não tem acesso ao assistente do Iuris.');
  }

  const { mensagem, historico, contextoProcesso, preferenciasUsuario, modo } = request.data || {};
  if (!mensagem || typeof mensagem !== 'string') {
    throw new HttpsError('invalid-argument', 'Mensagem vazia.');
  }

  let systemPrompt = PROMPT_BASE;
  if (modo === 'dataVenia') systemPrompt += PROMPT_DATA_VENIA;
  if (preferenciasUsuario) systemPrompt += `\n\nPreferências de estilo deste usuário (aplique quando fizer sentido):\n${preferenciasUsuario}`;
  if (contextoProcesso) systemPrompt += `\n\nContexto do processo em aberto no app:\n${contextoProcesso}`;

  const mensagens = [
    ...(Array.isArray(historico) ? historico : []),
    { role: 'user', content: mensagem }
  ];

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY.value(),
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 2048,
      system: systemPrompt,
      messages: mensagens
    })
  });

  if (!resp.ok) {
    const erro = await resp.text();
    console.error('Erro Anthropic API:', resp.status, erro);
    throw new HttpsError('internal', 'Erro ao consultar o assistente (' + resp.status + ').');
  }

  const data = await resp.json();
  const texto = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');

  return { resposta: texto };
});
