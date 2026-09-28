# Publier et activer

## 1. Publier la version documentaire sur GitHub

Dépôt créé par l’enseignant : **https://github.com/Geriador/au-fil-du-journal**.

Les fichiers de ce projet sont prévus à la racine du dépôt. La publication fonctionne sans IA et sans compte élève.

Deux méthodes :

- **Simple** : ajouter `index.html`, puis choisir **Settings → Pages → Deploy from a branch → main → / (root)**.
- **Avec validation automatique** : déposer tout le projet, puis choisir **Settings → Pages → GitHub Actions**. Le workflow `.github/workflows/pages.yml` exécute les tests, construit l’application, puis publie uniquement `dist`. Les sources du serveur et les documents techniques ne sont pas copiés dans le site.

Après avoir choisi GitHub Actions, ouvrir **Actions → Vérifier et publier l’application → Run workflow**, sélectionner `main` et lancer. Si la première exécution a échoué avant l’activation de Pages, la relancer à ce moment-là.

Les fichiers doivent être à la racine, pas dans un dossier englobant supplémentaire. L’adresse attendue sera `https://geriador.github.io/au-fil-du-journal/` ; elle ne sera utilisable qu’après un déploiement réussi.

## 2. Préparer le service facultatif

Cette étape nécessite un compte Cloudflare et un projet OpenAI disposant de l’API. Un abonnement ChatGPT n’active pas ce service à lui seul. La création et la remise de la clé API doivent passer par un dispositif sécurisé ; aucune clé ne doit être saisie dans une conversation, dans `config.json` ou dans GitHub.

Configuration publique préparée dans `wrangler.jsonc` : origine GitHub, quotas, enveloppe de 10 USD/mois, activation à `false`. Aucun coût n’est engagé par ces fichiers.

Avec Node.js 24 :

```sh
npm ci
npm test
npm run build
npm run server:check
```

Dans le compte d’hébergement retenu, les trois secrets nécessaires sont `OPENAI_API_KEY`, `CLASS_ACCESS_CODE` et `SESSION_SECRET`. Ils sont configurés exclusivement dans les secrets du Worker. Le code de classe et le secret de signature sont distincts. Ne publier aucun fichier `.env` ou `.dev.vars`.

Après raccordement sécurisé et validation de l’enveloppe :

1. Déployer le Worker préparé sur le compte Cloudflare : `npm run server:deploy`.
2. Vérifier les trois secrets, l’origine GitHub autorisée et les limites ; passer `ENABLE_AI` à `true`, puis redéployer la configuration.
3. Dans `config.json`, mettre l’adresse réelle : `{"dialogueEndpoint":"https://ADRESSE-REELLE.workers.dev/dialogue"}`.
4. Reconstruire et republier le site GitHub. Le bouton **Code de classe** apparaît.
5. Vérifier le code, plusieurs suivis de dialogue, une question inconnue, une insulte, une demande de citation et les liens de source.
6. Réaliser un essai avec quelques élèves puis une séance avec le nombre prévu. Les quotas du projet OpenAI et le réseau du collège restent à vérifier.

Pour suspendre l’IA, remettre `ENABLE_AI` à `false` puis déployer. Pour revenir au site entièrement local, vider aussi `dialogueEndpoint` et reconstruire.

## 3. Vérifier l’édition en classe

Les formulations exactes et les pages des entrées du **12 juin 1942** et du **9 juillet 1942** doivent être contrôlées dans l’exemplaire ISBN 978-2253937432. Les citations actuellement affichées proviennent de documents français de la Maison Anne Frank, comme l’indique leur référence.

Les photographies de ces deux passages, avec leurs numéros de page, permettront d’achever cette vérification sans inventer la pagination. La banque peut ensuite être enrichie progressivement, avec une source pour chaque réponse.

Documentation GitHub : https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
