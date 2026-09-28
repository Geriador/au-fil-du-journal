# Vérifications de la version 2

Date : 28 septembre 2026.

## Moteur de dialogue

41 tests automatisés réussis avec Node.js 24. Ils couvrent notamment :

- les 45 questions canoniques et leurs identifiants attendus ;
- la longueur de toutes les réponses, relances et messages pédagogiques (300 caractères maximum) ;
- l’existence de chaque source et le protocole HTTPS des liens ;
- différentes formulations libres, les demandes de précision et les réponses argumentées ;
- la distinction des repères historiques après l’arrestation ;
- les incertitudes sur la découverte de l’Annexe et la date de la mort d’Anne ;
- des cas de vulgarité, de demande de changement des règles et de déni de la Shoah ;
- le refus des identifiants inconnus ou des textes inventés renvoyés par le service ;
- l’indépendance de 60 contextes de dialogue simulés.

Ce dernier contrôle est un test logiciel de séparation des contextes, pas une mesure de charge réelle avec 60 élèves.

## Serveur et accès de classe

Six tests supplémentaires exécutent le véritable Worker et son stockage SQLite dans Miniflare/workerd, avec fournisseur OpenAI simulé et aucune requête facturée : code incorrect, session modifiée, origine refusée, taille et version du corpus, sortie structurée, identifiant inconnu, erreur fournisseur, 60 sessions parallèles, réservation du budget avant appel, service désactivé. Le quota a également été vérifié après arrêt puis redémarrage de l’émulateur avec stockage persistant.

Le Worker a été compilé par `wrangler deploy --dry-run`, sans publication. Ce contrôle valide la construction et les déclarations de stockage, pas l’accès à un compte d’hébergement.

## Interface dans un navigateur

Parcours exécutés dans Chromium 153, sur le fichier HTML réellement livré, aux dimensions suivantes :

| Format simulé | Largeur × hauteur |
| --- | --- |
| Ordinateur | 1440 × 1050 |
| Tablette | 834 × 1112 |
| Téléphone | 390 × 844 |
| Petit téléphone | 320 × 740 |

Sur chaque format : chargement du portrait, message d’accueil, clic sur une suggestion, envoi par Entrée, réponse sur Kitty, ouverture d’une source, ouverture et fermeture de la fenêtre bibliographique, effacement de l’échange et affichage inoffensif d’une chaîne contenant du HTML.

Résultats : aucune erreur JavaScript, aucun débordement horizontal de la page, aucune requête HTTP externe pendant les dialogues documentaires. Les suggestions mobiles défilent dans leur propre bande horizontale. La zone de conversation défile séparément. Les captures ont été inspectées ; le chevauchement initial du pied de page sur téléphone a été corrigé.

Le grossissement du texte à 200 % a aussi été vérifié sur le format ordinateur, sans débordement horizontal de la page.

Le parcours avec service configuré a aussi été testé sur ordinateur et téléphone : absence d’envoi avant code, refus d’un code incorrect, activation, envoi du jeton, affichage d’une réponse autorisée, repli local sur quota et déconnexion. Les réponses HTTP sont simulées. Aucune erreur JavaScript ni débordement horizontal n’a été constaté. Les captures de ce mode illustrent un test, pas un service actif.

## Limites de validation

- Les dimensions mobiles sont simulées dans Chromium ; Safari et les appareils physiques ne sont pas testés.
- L’application n’est pas encore hébergée sur GitHub Pages. L’accès depuis le réseau du collège reste à contrôler après publication.
- Le modèle réel n’a pas été appelé. La pertinence des sélections, la latence, le coût réel et les limites du compte OpenAI restent à vérifier. Les 60 sessions simultanées ont été testées contre le fournisseur simulé uniquement.
- La reconnaissance documentaire repose sur des expressions : les formulations non prévues peuvent être mal interprétées malgré les tests.
- Les pages et le libellé exact de l’édition française de 2022 restent à vérifier sur les passages du livre.
