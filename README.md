# Au fil du Journal

Application pédagogique de dialogue autour d’Anne Frank, destinée aux élèves de troisième. Portrait fourni par l’enseignant, présentation inspirée d’un journal, interface pour ordinateur, tablette et smartphone.

## Ouvrir l’application

Ouvrir **index.html** dans un navigateur récent. Le fichier contient l’application et le portrait : il fonctionne aussi sans connexion, une fois téléchargé. Une connexion reste nécessaire pour consulter les liens des sources.

Sur certains smartphones, l’application de fichiers affiche le HTML sans exécuter JavaScript. Le lien GitHub Pages est la voie conseillée sur téléphone et tablette.

## Ce qui fonctionne

- 45 réponses préparées à partir de 18 références institutionnelles ou éditoriales.
- Questions libres reconnues par des expressions et mots-clés, suggestions et quelques suivis de conversation.
- Réponses de 300 caractères maximum, relance comprise ; références accessibles séparément.
- Avertissement initial sur la simulation et rappel du rôle du professeur.
- Réponses au « je » explicitement présentées comme des reformulations pédagogiques.
- Narrateur historique pour les événements après l’arrestation et les analyses des historiens.
- Demandes de précision, encouragement à justifier, rappel du respect en cas de vulgarités reconnues.
- Sources consultables sous les réponses ; aucune page du livre ni citation inventée.
- Conversation conservée uniquement en mémoire dans l’onglet. Un rechargement ou « Nouvel échange » l’efface.
- Pas de compte élève, de traceur, de police distante ni de service d’IA activé dans la version livrée.

## La limite à connaître

**La version livrée fonctionne immédiatement avec la banque documentaire. Le service d’IA est fourni mais reste désactivé.** Son analyse par mots-clés peut mal comprendre une formulation ou attribuer un mauvais sujet. Les boutons de suggestions couvrent les questions prévues. Il ne remplace ni le livre ni la vérification du professeur.

Le serveur Cloudflare et le raccordement à OpenAI sont maintenant fournis : code de classe, sessions de deux heures, quotas persistants, enveloppe mensuelle proposée de 10 USD et retour local en cas de panne. Aucun secret n’est inclus et aucun appel payant n’a été effectué. Voir `docs/CONNECTEUR.md`, `docs/COUTS.md` et `docs/PUBLICATION.md`.

## L’édition de référence

*Le Journal d’Anne Frank*, Anne Frank, Calmann-Lévy / Le Livre de Poche, 2022, ISBN **978-2253937432**, traduction de Philippe Noble et Isabelle Rosselin-Bobulesco.

La notice de l’éditeur a été vérifiée. L’exemplaire intégral de 2022 n’a pas été fourni : ses formulations et sa pagination ne sont donc pas validées. Les renvois indiquent la **date de l’entrée**, jamais un numéro de page supposé.

Les deux courts extraits français, des 12 juin et 9 juillet 1942, sont vérifiés dans des documents de la Maison Anne Frank. Leur provenance est indiquée dans l’application. Les extraits photographiés du livre de 2022 permettront de confirmer le texte et d’ajouter les pages avant un usage qui exige cette édition mot pour mot.

## Mettre en ligne sur GitHub Pages

Dépôt du projet : https://github.com/Geriador/au-fil-du-journal

L’application documentaire est fournie dans `index.html`. Le service d’IA reste désactivé.

Pour activer la publication depuis le dépôt complet :

1. Ouvrir **Settings → Pages**.
2. Sous **Build and deployment → Source**, sélectionner **GitHub Actions**.
3. Ouvrir **Actions → Vérifier et publier l’application**.
4. Lancer **Run workflow → main → Run workflow**, ou relancer le premier workflow si Pages n’était pas encore activé lors de son exécution.
5. Attendre la réussite des étapes de vérification et de publication.
6. Ouvrir l’adresse affichée dans **Settings → Pages**, puis vérifier une question et sa source.

Adresse attendue après publication réussie : **https://geriador.github.io/au-fil-du-journal/**.

Les mises à jour de la branche `main` déclenchent ensuite les tests, la construction et la publication du dossier `dist`. Aucun secret n’est nécessaire pour cette version documentaire. Voir `docs/PUBLICATION.md` pour le raccordement facultatif à l’IA.

Documentation officielle : https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

## Environ 60 élèves simultanément

Dans le mode documentaire livré, chaque navigateur calcule ses réponses localement. Il n’existe pas de serveur de dialogue partagé qui mette les 60 élèves en attente. L’hébergement sert un fichier d’environ 225 ko par ouverture ; les échanges suivants n’appellent pas de serveur.

Le bon fonctionnement dépend aussi de l’accès du collège à GitHub Pages et du réseau utilisé. Le serveur fourni a passé un essai local de 60 sessions simultanées avec fournisseur simulé. Les limites de tokens du compte OpenAI doivent encore être vérifiées ; voir `docs/COUTS.md`. Aucun test avec 60 appareils physiques ou sur l’hébergement public n’a été effectué.

## Modifier et reconstruire

Le fichier `index.html` est prêt à l’emploi. Pour les modifications, les sources sont séparées :

| Fichier | Rôle |
| --- | --- |
| `src/template.html` | Structure et textes fixes de l’interface |
| `src/style.css` | Présentation et adaptations aux écrans |
| `src/app.js` | Discussion, boutons, affichage sûr des messages |
| `shared/corpus.mjs` | Réponses, références et expressions reconnues |
| `shared/dialogue.mjs` | Analyse des messages, réponses pédagogiques et limite de longueur |
| `assets/anne-frank.jpg` | Portrait fourni |
| `config.json` | Adresse facultative du service de dialogue |
| `scripts/build.mjs` | Fabrication du fichier HTML autonome |
| `tests/dialogue.test.mjs` | Vérifications des réponses et des garde-fous |

Avec Node.js 24, pour vérifier également le serveur :

```sh
npm ci
npm test
npm run build
```

Après une modification, reconstruire puis remplacer `index.html` sur GitHub. Le fichier construit est autonome ; les élèves n’installent rien.

## Mise à jour du corpus

Chaque réponse associe un identifiant, une question, une reformulation, une relance éventuelle et des identifiants de sources. Une citation exacte porte `quotation: true` et renvoie à son document d’origine. Toute modification doit préserver ces références et le maximum de 300 caractères, contrôlé par les tests.

Les événements après l’arrestation et les analyses historiques portent `kind: "history"`. Les faits incertains restent formulés avec prudence : la cause exacte de la découverte de la cachette et le jour de la mort d’Anne ne sont pas présentés comme établis.

Consulter `docs/SOURCES.md` pour les références et `docs/VALIDATION.md` pour les vérifications réalisées.

## Version 2

Le workflow GitHub Actions vérifie puis publie le site. Le serveur de sélection, son accès classe et ses tests sont inclus. Cette version ne génère toujours pas de nouveaux faits : elle prépare une meilleure compréhension des questions à partir du corpus vérifié.

## Crédits

Portrait : photographie transmise par l’enseignant. Les documents et traductions cités restent attribués à leurs auteurs et éditeurs. Application pédagogique indépendante, sans affiliation à la Maison Anne Frank.
