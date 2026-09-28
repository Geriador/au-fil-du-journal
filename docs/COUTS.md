# Estimation du coût

État : aucun service payant activé. Modèle prévu : **gpt-4.1-mini-2025-04-14**. Tarifs consultés le 28 septembre 2026 : 0,40 USD par million de tokens d’entrée et 1,60 USD par million de tokens de sortie. Source : https://developers.openai.com/api/docs/models/gpt-4.1-mini

Hypothèse indicative : 6 000 tokens d’entrée pour le catalogue, les consignes et le contexte, et 40 tokens de sortie par sélection. La sortie est limitée à 128 tokens. Aucun rabais de cache n’est supposé. La consommation réelle dépend des questions ; les tests n’ont pas appelé le modèle réel.

| Usage si toutes les questions passent par l’IA | Appels | Estimation OpenAI |
| --- | ---: | ---: |
| 60 élèves × 10 questions | 600 | 1,48 USD |
| 60 élèves × 20 questions | 1 200 | 2,96 USD |
| Quatre séances de 20 questions par élève | 4 800 | 11,83 USD |

Calcul : appels × (6 000 × 0,40 + 40 × 1,60) / 1 000 000. Les questions exactes et les réponses de guidage reconnues n’utilisent pas l’API : leur part réduit ce coût.

L’enveloppe proposée dans le serveur est **10 USD par mois**, soit environ 4 058 sélections dans cette hypothèse. Les réservations prudentes peuvent arrêter le service un peu plus tôt. La banque documentaire reste disponible quand l’IA s’arrête. Cette enveloppe n’est pas un forfait et ne couvre ni taxes ni autres usages du compte.

Cloudflare propose une offre gratuite compatible avec les Durable Objects SQLite, dans les limites de son offre ; les dépassements de cette offre gratuite entraînent des erreurs. Aucune offre payante d’hébergement n’a été souscrite. Source : https://developers.cloudflare.com/durable-objects/platform/pricing/

Pour 60 élèves, vérifier aussi les limites de tokens par minute du projet OpenAI. À titre d’ordre de grandeur, 60 questions de 6 000 tokens arrivant dans la même minute représentent 360 000 tokens d’entrée : un faible palier API peut les limiter. Le repli local évite de bloquer la discussion, mais il faut une séance pilote pour mesurer ce comportement.
