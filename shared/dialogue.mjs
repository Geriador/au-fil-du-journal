import { corpus } from './corpus.mjs';

export const welcome = 'Je suis une simulation pédagogique, pas la vraie Anne Frank. Mes réponses s’appuient sur des documents historiques. En cas de doute, consulte les sources et ton professeur. Tu peux m’interroger sur ma vie et mon Journal.';
export const specialReplies = {
  clarify: 'Peux-tu préciser ta question ou développer ton idée ? Tu peux nommer une personne, une date ou un passage du Journal pour m’aider à comprendre.',
  unknown: 'Je n’ai pas de réponse vérifiée dans cette banque pour cette question. Peux-tu reformuler ? Pour approfondir, consulte les sources ou demande à ton professeur.',
  greeting: 'Bonjour ! Tu peux me poser une question sur ma vie avant la clandestinité, sur l’Annexe ou sur mon Journal. Qu’aimerais-tu comprendre ?',
  thanks: 'Avec plaisir. Pour poursuivre, essaie de relier un fait découvert ici à un passage du Journal. Quelle question te poses-tu maintenant ?',
  respect: 'Restons respectueux dans cet échange. Tu peux exprimer une émotion ou un désaccord avec des mots adaptés. Reformule ton message pour poursuivre la discussion.',
  reflection: 'Tu proposes une interprétation. Quel fait précis ou passage du Journal peut l’appuyer ? Essaie de relier ton idée à cet exemple en expliquant pourquoi.',
  develop: 'Peux-tu développer un peu ? Explique ton idée en une ou deux phrases, puis appuie-la sur un fait ou un passage du Journal.',
  quoteHelp: 'Quelle entrée du Journal veux-tu citer ? Cette version propose deux courts extraits vérifiés, des 12 juin et 9 juillet 1942. Pour une autre date ou une page de l’édition 2022, consulte ton livre avec le professeur.',
  scope: 'Cet échange sert à découvrir Anne Frank et son Journal à partir de sources. Pose une question sur sa vie, la clandestinité ou le contexte historique.',
  simulation: 'Je ne suis pas la vraie Anne Frank : je suis une simulation pédagogique fondée sur des documents. Pour vérifier une réponse, ouvre sa source et échange avec ton professeur.',
  denial: 'La Shoah est un génocide établi par les archives et les témoignages. Les nazis et leurs collaborateurs ont assassiné six millions de Juifs. On peut examiner les preuves avec respect, en consultant les sources et le professeur.'
};

export function normalize(value) {
  return String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/œ/g, 'oe').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export const entryById = new Map(corpus.entries.map(entry => [entry.id, entry]));
const matchers = corpus.entries.map(entry => ({ entry, patterns: entry.patterns.map(([pattern, weight]) => [new RegExp('(?:^|\\s)(?:' + pattern + ')(?=\\s|$)', 'i'), weight]) }));
export const responseIds = [...entryById.keys(), ...Object.keys(specialReplies).map(id => 'special:' + id)];

export function assembleReply(id, follow = true) {
  if (id.startsWith('special:')) {
    const key = id.slice(8);
    if (!Object.hasOwn(specialReplies, key)) throw new Error('Réponse non autorisée');
    return { id, text: specialReplies[key], kind: key === 'denial' ? 'history' : 'guide', sourceIds: key === 'denial' ? ['shoah'] : [], journal: '', quotation: false, follow: false };
  }
  const entry = entryById.get(id);
  if (!entry) throw new Error('Réponse non autorisée');
  const text = entry.answer + (follow && entry.follow ? ' ' + entry.follow : '');
  if (Array.from(text).length > 300) throw new Error('Réponse trop longue');
  return { id: entry.id, text, kind: entry.kind, sourceIds: [...entry.sourceIds], journal: entry.journal, quotation: entry.quotation, follow: !!(follow && entry.follow) };
}

export function classify(message, history = []) {
  const raw = String(message);
  const q = normalize(raw);
  if (!q) return { id: 'special:clarify', confidence: 1 };
  const last = [...history].reverse().find(turn => turn.role === 'assistant' && entryById.has(turn.id));
  if (/\b(vraie anne|vraiment anne|es tu reelle|es tu vivante|es tu en vie|es tu un robot|es tu une ia|es tu un chatbot|simulation)\b/.test(q)) return { id: 'special:simulation', confidence: 1 };
  if (/\b(ignore.*instructions?|system prompt|prompt systeme|oublie.*regles?|revele.*instructions?|execute.*code|agis comme|fais comme si)\b/.test(q)) return { id: 'special:scope', confidence: 1 };
  if (/\b(hitler avait raison|juifs.*merit.*(mourir|mort|tue)|shoah.*(mensonge|invente|pas existe)|holocauste.*(mensonge|invente|pas existe))\b/.test(q)) return { id: 'special:denial', confidence: 1 };
  if (/\b(merde|putain|connard|connasse|conne|con|salope|salaud|encule|enculee|ferme ta gueule|ta gueule|tg|fdp|nique)\b/.test(q)) return { id: 'special:respect', confidence: 1 };
  if (/^(bonjour|salut|coucou|bonsoir|hello)( anne( frank)?)?$/.test(q)) return { id: 'special:greeting', confidence: 1 };
  if (/^(merci|merci beaucoup|d accord merci|au revoir|a bientot|bye)$/.test(q)) return { id: 'special:thanks', confidence: 1 };
  if (/^(oui|non|peut etre|bof|ok|d accord|je (ne )?sais pas|jsp|pourquoi|comment|et alors|explique|continue|plus|et ensuite)$/.test(q)) {
    if (last && /^(pourquoi|comment|explique|continue|plus|et ensuite)$/.test(q)) return { id: 'special:develop', confidence: 1 };
    return { id: 'special:clarify', confidence: 1 };
  }
  if (last && /^(je pense|je crois|je dirais|a mon avis|selon moi|parce que|car |pour moi|cela montre|ca montre|c est parce que)/.test(q) && !/\?/.test(raw)) return { id: 'special:reflection', confidence: .9 };

  const exact = corpus.entries.find(entry => normalize(entry.question) === q);
  if (exact) return { id: exact.id, confidence: 1 };
  const citationRequest = /\b(cit.*|passage exact|mots exacts|extrait|page \d+)\b/.test(q);
  if (citationRequest) {
    if (/\b(9 juillet( 1942)?|depart.*annexe|sens dessus dessous)\b/.test(q)) return { id: 'citation_annexe', confidence: 1 };
    if (/\b(12 juin( 1942)?|debut du journal|confier)\b/.test(q)) return { id: 'citation_confier', confidence: 1 };
    return { id: 'special:quoteHelp', confidence: 1 };
  }

  // Give composite questions an explicit, documented meaning before scoring words.
  if (/\b(pourquoi|comment)\b/.test(q) && /\b(ecris|ecrire|ecrivais|ecrit|ecriture)\b/.test(q)) return { id: 'pourquoi_ecrire', confidence: .95 };
  if (/\b(apres l arrestation|apres ton arrestation|apres votre arrestation|ensuite apres)\b/.test(q)) return { id: 'deportation', confidence: .95 };
  if (/\b(cacher|cachee|caches|cache|cachiez|clandestinite)\b/.test(q) && /\b(pourquoi|raison|raisons)\b/.test(q)) return { id: 'pourquoi_cache', confidence: .95 };
  if (/\b(retrouve|sauve|conserve|recupere)\b/.test(q) && /\b(journal|ecrits|cahiers)\b/.test(q)) return { id: 'sauvetage', confidence: .95 };
  if (/\b(denonce|denoncee|denonciation|trahi|trahie|denonciateur|traitre)\b/.test(q)) return { id: 'denonciation', confidence: .95 };
  if (/\b(juifs|juif|juive)\b/.test(q) && /\b(pourquoi|haine|deteste|detestaient|persecutaient)\b/.test(q)) return { id: 'antisemitisme', confidence: .95 };
  if (/\b(etudier|etudies|etudes|apprends|apprendre|lecons|devoirs)\b/.test(q)) return { id: 'etudier', confidence: .9 };
  if (/\b(journal|ecrire|ecris)\b/.test(q) && /\b(langue|langage|neerlandais|francais|allemand)\b/.test(q)) return { id: 'langue', confidence: .95 };

  const ranked = matchers.map(({entry, patterns}) => ({id:entry.id, score:patterns.reduce((sum,[pattern,weight]) => sum + (pattern.test(q) ? weight : 0), 0)})).sort((a,b) => b.score-a.score);
  const first = ranked[0];
  if (!first || first.score < 10) return { id: q.split(' ').length < 3 ? 'special:clarify' : 'special:unknown', confidence: 0 };
  return { id: first.id, confidence: Math.min(.9, first.score / 40) };
}

export function respond(message, history = []) {
  return assembleReply(classify(message, history).id);
}

export function suggestions(history = [], count = 3) {
  const last = [...history].reverse().find(turn => turn.role === 'assistant' && entryById.has(turn.id));
  const seen = new Set(history.filter(turn => turn.role === 'assistant').map(turn => turn.id));
  const initial = ['pourquoi_cache', 'kitty', 'journee'];
  if (!last) return initial.map(id => entryById.get(id));
  const entry = entryById.get(last.id);
  const relatives = corpus.entries.filter(item => item.group === entry.group && !seen.has(item.id));
  const rest = initial.map(id => entryById.get(id)).filter(item => !seen.has(item.id) && !relatives.includes(item));
  const others = corpus.entries.filter(item => !seen.has(item.id) && !relatives.includes(item) && !rest.includes(item));
  return [...relatives, ...rest, ...others].slice(0, count);
}

export function acceptRemoteSelection(payload) {
  // The service may SELECT a reviewed response, never supply arbitrary text or URLs.
  if (!payload || typeof payload.replyId !== 'string' || !responseIds.includes(payload.replyId)) throw new Error('Réponse du service invalide');
  return assembleReply(payload.replyId, payload.includeFollowUp !== false);
}
