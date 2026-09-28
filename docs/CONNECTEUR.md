# Service de dialogue — version 2

Le serveur est fourni dans `server/worker.mjs`. Il s’exécute dans Cloudflare Workers avec un Durable Object SQLite qui partage les quotas entre toutes les instances. Le site élève reste hébergé par GitHub Pages.

## État de livraison

Le service est **désactivé** (`ENABLE_AI: "false"`) et `config.json` ne contient pas d’adresse. Aucune clé API, aucun code de classe et aucun secret de session ne sont inclus. Les tests utilisent un fournisseur simulé. Aucun appel payant ni déploiement public n’a été effectué.

## Fonctionnement

1. L’élève ouvre la page : la banque documentaire est immédiatement utilisable.
2. Si une adresse de service est configurée, il peut saisir le code de classe communiqué par le professeur.
3. `/session` vérifie ce code et délivre un jeton signé valable deux heures. Le navigateur le garde uniquement en mémoire.
4. Les questions exactes et les rappels reconnus restent locaux. Les autres questions passent à `/dialogue` avec le contexte limité.
5. GPT-4.1 mini sélectionne un identifiant dans le corpus. Le serveur puis le navigateur valident cet identifiant. Le texte affiché et les sources viennent toujours des fichiers vérifiés.
6. Si le service échoue ou atteint une limite, le mode documentaire prend le relais avec un message explicite.

Ce choix aide à comprendre des formulations variées, mais ne crée pas de nouvelles connaissances. Le corpus couvre 45 réponses : une question absente doit conduire à une demande de reformulation ou à une reconnaissance de cette limite. Une mauvaise sélection reste possible ; la qualité sémantique doit être évaluée avant la séance de classe.

## Contrats HTTP

`POST /session`, JSON `{ "code": "code remis aux élèves" }` → `{ "token": "jeton signé", "expiresAt": 123456789 }`.

`POST /dialogue` nécessite `Authorization: Bearer <jeton>` et ce corps :

```json
{
  "version": 1,
  "corpusVersion": "1.0.0",
  "message": "Pourquoi fallait-il chuchoter ?",
  "history": [
    {"role": "user", "text": "Qui vivait avec toi ?", "replyId": null},
    {"role": "assistant", "text": "Texte affiché", "replyId": "habitants"}
  ]
}
```

Retour : `{ "replyId": "silence", "includeFollowUp": true, "mode": "assisted" }`.
Le serveur ignore les textes d’assistant reçus et reconstruit leur sens à partir d’identifiants autorisés. Il envoie au modèle les identifiants, la question (1 000 caractères maximum) et au plus 1 800 caractères des messages précédents de l’élève, chaque message étant limité à 600 caractères. Aucun nom ni compte élève n’est requis.

Les statuts 401, 409, 429 et 503 indiquent respectivement un accès à renouveler, un corpus incompatible, une limite atteinte et une indisponibilité. Aucun appel fournisseur n’est réessayé automatiquement.

## Accès et consommation

- Code de classe de 12 caractères minimum, conservé exclusivement côté serveur. Un code aléatoire de 16 caractères ou plus est conseillé.
- Secret de signature d’au moins 32 caractères, distinct du code de classe.
- Changer le code invalide les anciens jetons. Fermer la page efface l’accès de l’appareil.
- Origine autorisée : `https://geriador.github.io` ; la vérification du jeton est indépendante de CORS.
- Maximum 80 appels en cours, un par session ; 120 appels par minute pour l’ensemble du service.
- Maximum 1 800 appels par jour, 12 000 par mois et 100 par session de deux heures.
- Enveloppe mensuelle proposée : 1 000 cents USD, soit 10 USD, calculée au tarif du modèle vérifié le 28 septembre 2026.
- Avant chaque appel, une estimation prudente est réservée atomiquement. Les statistiques de consommation retournées par le fournisseur corrigent la réserve. Si elles manquent ou si l’appel échoue, la réserve reste débitée.
- Les compteurs persistent dans SQLite. Ni la rotation du code ni un redémarrage ne réinitialisent le budget mensuel.

L’enveloppe concerne **ce service et ce modèle**, pas les autres usages du compte OpenAI, les taxes ou l’hébergement. Vérifier les tarifs avant l’activation puis lors de leur évolution. La réservation utilise la taille UTF-8 de la requête comme majorant conservateur du nombre de tokens, avec une marge supplémentaire ; elle peut refuser un appel alors qu’un petit solde demeure.

Aucune limite par adresse IP n’empêche une classe de partager le réseau du collège. Le code collectif peut être partagé ; les quotas globaux limitent alors la consommation. Il ne permet pas d’identifier ou d’évaluer individuellement un élève.

## Données

L’application et son serveur n’écrivent ni les messages ni les réponses en base. Seuls des compteurs, des identifiants temporaires de session et des réservations sont conservés. Les compteurs expirés sont nettoyés lors de l’utilisation suivante. Les journaux du Worker sont désactivés dans la configuration et le code ne journalise aucun contenu.

Les messages envoyés au modèle transitent par Cloudflare puis OpenAI. `store: false` désactive le stockage applicatif des réponses OpenAI ; il ne signifie pas « aucune conservation chez le fournisseur ». La politique OpenAI prévoit notamment des journaux de surveillance des abus conservés par défaut jusqu’à 30 jours, avec exceptions indiquées dans sa documentation. Les élèves sont informés de la transmission avant la saisie du code ; ils ne doivent saisir aucune information personnelle.

## Documents techniques vérifiés

- Modèle et tarifs : https://developers.openai.com/api/docs/models/gpt-4.1-mini
- Schéma de sortie : https://developers.openai.com/api/docs/guides/structured-outputs
- Traitement des données : https://developers.openai.com/api/docs/guides/your-data
- Stockage et transactions : https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/
- Secrets : https://developers.cloudflare.com/workers/configuration/secrets/
- Hébergement : https://developers.cloudflare.com/durable-objects/platform/pricing/
