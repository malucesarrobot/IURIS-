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
- Você ajuda a RASCUNHAR peças, resumir processos, analisar arquivos anexados, e organizar o raciocínio jurídico.
- Todo rascunho que você produzir é um PONTO DE PARTIDA — deve ser sempre revisado por um advogado antes de protocolar. Deixe isso claro quando gerar uma peça.
- Você não tem acesso à internet nesta conversa (a menos que seja avisado do contrário), então NUNCA cite número de processo, ementa, ou jurisprudência específica de memória — se não tiver certeza absoluta, diga que não tem certeza e recomende conferir na fonte oficial.
- Seja direto e objetivo, no tom formal-técnico usado na advocacia brasileira.
- Responda sempre em português do Brasil.`;

const PROMPT_DATA_VENIA = `\n\nModo "Data Venia" ativado: o usuário está pedindo uma SEGUNDA OPINIÃO crítica sobre uma decisão, classificação ou rascunho já feito (pelo usuário ou por você antes). Comece sua resposta com "⚖️ Data Venia:" e analise com espírito crítico genuíno — aponte riscos, alternativas e pontos fracos, não apenas concorde. Se a decisão original parecer sólida, diga isso também, mas justifique.`;

const TAMANHO_MAX_ANEXO = 20 * 1024 * 1024; // 20MB (arquivos maiores ficam pesados demais pra essa via)

async function baixarComoBase64(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('Não consegui baixar o arquivo anexado (' + resp.status + ')');
  const contentLength = resp.headers.get('content-length');
  if (contentLength && Number(contentLength) > TAMANHO_MAX_ANEXO) {
    throw new Error('Arquivo maior que 20MB — grande demais pra análise pelo assistente.');
  }
  const buffer = Buffer.from(await resp.arrayBuffer());
  if (buffer.length > TAMANHO_MAX_ANEXO) {
    throw new Error('Arquivo maior que 20MB — grande demais pra análise pelo assistente.');
  }
  return buffer.toString('base64');
}

exports.chatComAssistente = onCall({ secrets: [ANTHROPIC_API_KEY], region: 'southamerica-east1', timeoutSeconds: 120, memory: '512MiB' }, async (request) => {
  if (!request.auth || !request.auth.token.email) {
    throw new HttpsError('unauthenticated', 'Faça login para usar o assistente.');
  }
  const email = request.auth.token.email.toLowerCase();
  if (!EMAILS_AUTORIZADOS.map(e => e.toLowerCase()).includes(email)) {
    throw new HttpsError('permission-denied', 'Este e-mail não tem acesso ao assistente do Iuris.');
  }

  const { mensagem, historico, contextoProcesso, preferenciasUsuario, modo, anexo } = request.data || {};
  if (!mensagem || typeof mensagem !== 'string') {
    throw new HttpsError('invalid-argument', 'Mensagem vazia.');
  }

  let systemPrompt = PROMPT_BASE;
  if (modo === 'dataVenia') systemPrompt += PROMPT_DATA_VENIA;
  if (preferenciasUsuario) systemPrompt += `\n\nPreferências de estilo deste usuário (aplique quando fizer sentido):\n${preferenciasUsuario}`;
  if (contextoProcesso) systemPrompt += `\n\nContexto do processo em aberto no app:\n${contextoProcesso}`;

  // Monta o conteúdo da mensagem do usuário — texto, e opcionalmente um arquivo anexado.
  let userContent = mensagem;
  if (anexo && anexo.url && anexo.tipo) {
    try {
      const base64 = await baixarComoBase64(anexo.url);
      const blocoArquivo = anexo.tipo.startsWith('image/')
        ? { type: 'image', source: { type: 'base64', media_type: anexo.tipo, data: base64 } }
        : { type: 'document', source: { type: 'base64', media_type: anexo.tipo, data: base64 } };
      userContent = [
        blocoArquivo,
        { type: 'text', text: mensagem + `\n\n[Arquivo anexado: ${anexo.nome}]` }
      ];
    } catch (e) {
      console.error('Erro ao processar anexo:', e.message);
      throw new HttpsError('invalid-argument', e.message);
    }
  }

  const mensagens = [
    ...(Array.isArray(historico) ? historico : []),
    { role: 'user', content: userContent }
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
      max_tokens: 4096,
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
