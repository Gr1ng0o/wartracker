# WarTracker V2 — activation

Cette version remplace le formulaire historique et ajoute une médiathèque privée. PostgreSQL contient les informations des parties et des fichiers ; Supabase Storage contient leurs octets. La migration ajoute des tables et colonnes sans effacer les parties. La remise à zéro est une étape EXPLICITE séparée, demandée par le propriétaire.

## Variables serveur

- DATABASE_URL : connexion PostgreSQL (pooler si nécessaire).
- DIRECT_URL : connexion directe pour Prisma Migrate.
- SUPABASE_URL : URL du projet Supabase.
- SUPABASE_SERVICE_ROLE_KEY : clé serveur, jamais NEXT_PUBLIC, jamais dans le navigateur.
- SUPABASE_MEDIA_BUCKET : optionnel, wartracker-media par défaut ; bucket dédié et privé.
- ADMIN_KEY : code d’accès aléatoire d’au moins 24 caractères, à saisir dans la médiathèque. Session HTTP-only de 8 heures.

Ces variables se définissent dans Vercel, ou dans .env.local pour les commandes locales. Pour Prisma CLI, fournir DATABASE_URL et DIRECT_URL dans l’environnement ou dans .env (ignoré par Git). Ne pas partager de secrets dans une conversation.

## Mise en service

1. Créer un projet Supabase ou réutiliser un projet autorisé. Le projet peut aussi héberger PostgreSQL, mais il est possible de garder Railway pour les parties.
2. Renseigner les variables. Exécuter npm ci puis npm run db:deploy sur la base cible. Sur une base existante dont l’historique diffère, résoudre l’historique Prisma avant de continuer ; ne pas utiliser db push --accept-data-loss sur une base partagée.
3. Exécuter npm run media:setup : crée/configure le bucket privé, limite à 50 Mo et restreint les types. Aucune politique publique Storage ne doit autoriser ce bucket. Aucun fichier n’est public ; lecture par liens signés d’une heure. Vérifier les limites du forfait Supabase utilisé.
4. Pour le départ à zéro demandé, arrêter les écritures de l’ancienne application et exécuter npm run data:reset -- --confirm=EFFACER_WARTRACKER avec les variables de la BASE CIBLE. Cela efface toutes les parties, toutes les entrées Media et les objets référencés du bucket. Les fichiers Google Drive externes ne sont pas effacés : leurs liens disparaissent de la base, leur suppression se fait dans Drive.
5. Déployer la branche V2 sur Vercel puis vérifier création de partie, upload photo/vidéo, classement, lecture, édition, suppression, déconnexion et refus d’accès sans session. Les binaires transitent directement du navigateur vers le bucket, jamais via Vercel Functions.
6. Fusionner en production après cette vérification, puis arrêter/supprimer l’ancien déploiement depuis son hébergeur.

Le code n’exécute jamais la remise à zéro pendant le build. Les aperçus doivent utiliser une base et un bucket distincts de la production.

## Utilisation

Enregistrer une partie ouvre sa médiathèque. Sélectionner plusieurs fichiers ou les déposer, choisir le tour, puis ajouter légendes et classement. Les transferts incomplets restent visibles : valider de nouveau si le fichier est déjà transféré, sinon supprimer l’entrée puis renvoyer le fichier. Une suppression de fichier est définitive ; une suppression de partie conserve les médias dans la bibliothèque sans partie.

Limites : 50 Mo par fichier, transfert standard sans reprise automatique, pas de transcodage des vidéos (MOV dépend du navigateur). Les jetons de transfert Supabase restent valables deux heures ; éviter d’utiliser le reset pendant des transferts. Les objets non référencés après un transfert interrompu/reset se nettoient dans le bucket dédié. Les suppressions stockage et base ne sont pas atomiques : les entrées restent supprimables en cas d’échec du stockage, et un reset partiel se relance.

Les anciennes sauvegardes SQL/SQLite ont été retirées de l’état courant du dépôt. Elles restent dans l’historique Git ; cette version ne réécrit pas l’historique et n’efface pas les sauvegardes externes.

## Import ALN et statistiques d’unités

Exécuter db:deploy avant de déployer la fonctionnalité /40k/lists. La migration ajoute ArmyRoster et RosterUnit, sans modifier les parties existantes. Le code d’accès est le même que celui de la médiathèque. Le parsing ne nécessite pas Supabase : il nécessite ADMIN_KEY ; l’enregistrement et les statistiques nécessitent PostgreSQL migré.

Le PDF ALN texte avec tableaux M / E / SV / PV / CD / CO est analysé en mémoire (4 Mo, 40 pages maximum), sans conserver le binaire ni appeler un service IA. Les points, effectifs, profils, équipements, optimisations et lignes d’armes sont conservés. L’utilisateur vérifie l’aperçu et peut corriger noms, points, effectifs, faction et attachements avant enregistrement. Les scans/OCR, listes abrégées sans profil et autres générateurs ne sont pas pris en charge. Une variante ALN peut nécessiter des adaptations : les totaux incohérents sont signalés. Les liens de meneur sont déduits de la proximité des fiches ; vérifier leur affectation dans l’aperçu.

Un exemplaire de chaque unité est conservé, même lorsque plusieurs portent le même nom. Les meneurs ont des fiches séparées et une position d’attachement. Une liste peut être enregistrée sans partie puis copiée dans une partie. Une seule liste par camp et par partie ; le remplacement doit être explicitement coché et se fait en transaction. Les imports utilisent une clé pour éviter le double enregistrement d’un clic répété. Seules les 100 listes les plus récentes sont affichées dans la bibliothèque ; les statistiques utilisent toutes les listes rattachées à une partie.

Les statistiques distinguent les factions et les camps. Une unité présente plusieurs fois compte une seule présence par partie ; les copies et les points sont additionnés. Le taux de victoire exclut les nuls et résultats inconnus. Les listes sans partie sont exclues. Le score moyen est celui de l’armée, aucune élimination ni performance individuelle n’est inférée du PDF. La suppression d’une partie conserve ses listes hors statistiques, la remise à zéro les efface aussi.

Validation : npm run test:aln. Pour tester le document local réel, définir ALN_SAMPLE_PDF vers son chemin avant la commande ; le PDF utilisateur n’est pas publié dans le dépôt.

Le test local via HTTP peut être bloqué par l’isolation réseau du sandbox. Valider le parcours complet dans un aperçu avec PostgreSQL migré ; la lecture directe du PDF réel est couverte par le test optionnel.
