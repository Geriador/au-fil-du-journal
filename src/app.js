'use strict';
const $ = id => document.getElementById(id);
const history = [];
let pending = false;
let activeRequest = null;
let generation = 0;
let sessionToken = '';
let sessionExpires = 0;
const endpoint = APP_CONFIG.dialogueEndpoint || '';
if (endpoint && new URL(endpoint).protocol !== 'https:') throw new Error('Le service de dialogue doit utiliser HTTPS.');

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function sourceLink(id) {
  const source = corpus.sources[id];
  const link = node('a', '', source.institution + ' — ' + source.title + (source.language === 'en' ? ' (en anglais)' : ''));
  link.href = source.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  return link;
}

function appendMessage(role, text, reply = null, isWelcome = false) {
  const article = node('article', 'message ' + role + (isWelcome ? ' welcome' : ''));
  const speaker = role === 'user' ? 'Toi' : isWelcome ? 'Avant de commencer' : reply?.kind === 'history' ? 'Repère historique' : reply?.kind === 'guide' ? 'Pour poursuivre' : 'Anne · voix reconstituée';
  const author = node('div', 'message-author', speaker);
  if (reply?.quotation) author.append(node('span', 'message-kind', 'Citation'));
  article.append(author, node('p', 'message-text', text));
  if (reply?.sourceIds.length) {
    const references = node('details', 'references');
    references.append(node('summary', '', reply.quotation ? 'Vérifier la citation' : 'Voir la source' + (reply.sourceIds.length > 1 ? ' et les références' : '')));
    const content = node('div', 'reference-content');
    if (reply.journal) content.append(node('p', '', 'Dans le Journal : ' + reply.journal + '.'));
    if (reply.quotation) content.append(node('p', 'reference-qualifier', 'Extrait français cité par la Maison Anne Frank. La formulation et la page dans l’édition 2022 restent à vérifier dans le livre.'));
    else content.append(node('p', 'reference-qualifier', 'Reformulation pédagogique ; ce texte n’est pas une citation du Journal.'));
    reply.sourceIds.forEach(id => content.append(sourceLink(id)));
    references.append(content);
    article.append(references);
  }
  $('messages').append(article);
  $('messages').scrollTop = $('messages').scrollHeight;
}

function renderSuggestions() {
  $('starters').replaceChildren();
  suggestions(history).forEach(entry => {
    const button = node('button', 'starter', entry.question);
    button.type = 'button';
    button.disabled = pending;
    button.addEventListener('click', () => submitMessage(entry.question));
    $('starters').append(button);
  });
}

function busy(value) {
  pending = value;
  $('send').disabled = value;
  $('question').disabled = value;
  $('chat-form').setAttribute('aria-busy', String(value));
  $('starters').querySelectorAll('button').forEach(button => { button.disabled = value; });
}

function countInput() {
  $('input-count').textContent = Array.from($('question').value).length + ' / 1 000';
}

async function getReply(message, context, signal) {
  const selection = classify(message, context);
  // Moderation, greetings, requests for quotations and scope rules remain local.
  if (sessionToken && Date.now() >= sessionExpires) clearSession();
  if (!endpoint || !sessionToken || selection.confidence === 1 || selection.id.startsWith('citation_')) return assembleReply(selection.id);
  const result = await fetch(endpoint, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + sessionToken},
    credentials: 'omit',
    redirect: 'error',
    signal,
    body: JSON.stringify({version:1, message, history:context.slice(-8).map(turn => ({role:turn.role,text:turn.text,replyId:turn.id || null})), corpusVersion:corpus.version})
  });
  if (!result.ok) {
    if (result.status === 401) { clearSession(); throw new Error('session'); }
    if (result.status === 429) throw new Error('quota');
    throw new Error('service');
  }
  const raw = await result.text();
  if (raw.length > 4096) throw new Error('Réponse du service invalide');
  return acceptRemoteSelection(JSON.parse(raw));
}

async function submitMessage(raw) {
  const message = raw.trim();
  if (pending || !message) return;
  if (Array.from(message).length > 1000) { $('status').textContent = 'Raccourcis ton message à 1 000 caractères maximum.'; return; }
  const requestGeneration = generation;
  const context = history.slice();
  appendMessage('user', message);
  history.push({role:'user',text:message});
  $('question').value = '';
  countInput();
  busy(true);
  $('status').textContent = sessionToken ? 'Recherche dans les réponses documentées…' : '';
  activeRequest = new AbortController();
  const timeout = setTimeout(() => activeRequest?.abort(), 18000);
  let reply;
  try {
    reply = await getReply(message, context, activeRequest.signal);
    if (generation !== requestGeneration) return;
    $('status').textContent = '';
  } catch (error) {
    if (generation !== requestGeneration) return;
    reply = respond(message, context);
    const detail = error.message === 'session' ? 'Le code de classe doit être saisi à nouveau.' : error.message === 'quota' ? 'Le service a atteint une limite temporaire.' : 'Le service de dialogue est indisponible.';
    $('status').textContent = detail + ' Cette réponse vient de la banque documentaire.';
  } finally {
    clearTimeout(timeout);
    if (generation === requestGeneration) { activeRequest = null; busy(false); }
  }
  if (generation !== requestGeneration || !reply) return;
  appendMessage('assistant', reply.text, reply);
  history.push({role:'assistant',text:reply.text,id:reply.id});
  if (history.length > 100) history.splice(0, history.length - 100);
  renderSuggestions();
  $('question').focus({preventScroll:true});
}

function resetConversation() {
  generation++;
  activeRequest?.abort();
  activeRequest = null;
  history.length = 0;
  $('messages').replaceChildren();
  $('question').value = '';
  $('status').textContent = '';
  countInput();
  busy(false);
  appendMessage('assistant', welcome, null, true);
  $('messages').scrollTop = 0;
  renderSuggestions();
}

$('chat-form').addEventListener('submit', event => { event.preventDefault(); submitMessage($('question').value); });
$('question').addEventListener('input', countInput);
$('question').addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && !pending) { event.preventDefault(); $('chat-form').requestSubmit(); }
});
$('open-sources').addEventListener('click', () => $('sources-dialog').showModal());
$('reset').addEventListener('click', () => $('reset-dialog').showModal());
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => $(button.dataset.close).close()));
$('confirm-reset').addEventListener('click', () => { $('reset-dialog').close(); resetConversation(); $('question').focus({preventScroll:true}); });
Object.entries(corpus.sources).forEach(([id, source]) => {
  const li = node('li');
  li.append(sourceLink(id));
  if (source.note) li.append(node('small', '', source.note));
  $('source-list').append(li);
});
function clearSession() {
  sessionToken = ''; sessionExpires = 0;
  $('mode-label').textContent = 'Version documentaire';
  $('class-access').textContent = 'Code de classe';
  $('mode-description').textContent = 'Entre le code du professeur pour activer l’aide à la compréhension.';
}
function updatePrivacy() {
  $('local-explanation').textContent = 'Le code de classe permet à une IA d’aider à comprendre les questions et leur contexte. Elle sélectionne une réponse de la banque vérifiée. Elle ne rédige pas de nouveaux faits ni de citations. Sans code, la banque documentaire fonctionne seule.';
  $('privacy-note').textContent = 'Une fois le code de classe activé, certaines questions et un contexte limité passent par le service Cloudflare de l’enseignant puis par OpenAI. N’indique ni nom, ni coordonnées, ni informations personnelles. Cette page et le serveur n’enregistrent pas les conversations ; le fournisseur applique sa propre politique de traitement. Fermer l’onglet efface la discussion et l’accès de classe.';
}
if (endpoint) {
  $('class-access').hidden = false;
  clearSession(); updatePrivacy();
  $('class-access').addEventListener('click', () => {
    if (sessionToken) { clearSession(); $('status').textContent = 'L’aide à la compréhension est désactivée. La discussion reste disponible.'; return; }
    $('access-status').textContent = ''; $('access-dialog').showModal();
  });
  $('access-dialog').addEventListener('close', () => { $('class-code').value = ''; });
  $('access-form').addEventListener('submit', async event => {
    event.preventDefault();
    const code = $('class-code').value;
    $('class-code').value = '';
    $('activate-class').disabled = true;
    $('access-status').textContent = 'Vérification du code…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const result = await fetch(new URL('/session',endpoint), {method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',redirect:'error',signal:controller.signal,body:JSON.stringify({code})});
      if (!result.ok) throw new Error(result.status === 401 ? 'code' : result.status === 429 ? 'quota' : 'service');
      const text = await result.text();
      if (text.length > 4096) throw new Error('service');
      const payload = JSON.parse(text);
      if (typeof payload.token !== 'string' || !payload.token || !Number.isFinite(payload.expiresAt) || payload.expiresAt <= Date.now()) throw new Error('service');
      sessionToken = payload.token; sessionExpires = payload.expiresAt;
      $('mode-label').textContent = 'Dialogue assisté';
      $('mode-description').textContent = 'L’IA aide à comprendre tes questions. Les réponses restent documentées.';
      $('class-access').textContent = 'Quitter la classe';
      $('access-dialog').close(); $('status').textContent = 'L’aide à la compréhension est activée pour deux heures.';
    } catch (error) {
      $('access-status').textContent = error.message === 'code' ? 'Ce code ne correspond pas. Vérifie-le avec ton professeur.' : error.message === 'quota' ? 'Trop de tentatives. Réessaie dans quelques instants.' : 'La connexion ne fonctionne pas pour le moment. La version documentaire reste disponible.';
    } finally { clearTimeout(timeout); $('activate-class').disabled = false; }
  });
}
resetConversation();
