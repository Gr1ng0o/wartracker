# WarTracker

Application privée de suivi et de débrief des parties Warhammer 40k et Flesh and Blood, construite avec Next.js, React, Prisma et PostgreSQL. Elle utilise un accès propriétaire unique ; il ne s’agit pas d’un service avec des comptes et historiques séparés par joueur.

## Installation

Prérequis : Node.js 22 ou supérieur et PostgreSQL.

1. Copier `.env.example` dans `.env`.
2. Renseigner les URL PostgreSQL et générer une clé d’accès :

   ```bash
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

   Placer cette valeur dans `ADMIN_KEY` (32 caractères minimum). Cette clé sert à la connexion et à signer les sessions. Ne jamais la préfixer par `NEXT_PUBLIC_` ni la commiter.

3. Installer et initialiser :

   ```bash
   npm ci
   npm run db:migrate
   npm run dev
   ```

4. Ouvrir `http://localhost:3000`, puis se connecter avec la clé d’accès.

`DATABASE_URL` est l’URL utilisée par l’application ; `DIRECT_URL` est une connexion directe utilisée par les migrations. Pour un PostgreSQL local sans pooler, les deux peuvent être identiques. `APP_URL` est facultative et permet de définir l’origine publique exacte derrière un reverse proxy ; sa valeur doit correspondre à l’adresse réellement utilisée dans le navigateur.

## Mise à jour d’une installation existante

Effectuer une sauvegarde PostgreSQL, puis lancer `npm run db:migrate` avec les variables du bon environnement avant de mettre en service cette version. La nouvelle migration ajoute les dates de partie, les métadonnées de mission et les textes de listes manquants. Elle conserve les colonnes déjà ajoutées manuellement et ne supprime aucune donnée. Les anciennes parties sans date jouée continuent d’afficher leur date d’enregistrement.

Les migrations ne sont pas exécutées automatiquement par `npm run build`, pour éviter qu’un build de prévisualisation modifie la base de production. Sur Vercel/Railway, configurer `ADMIN_KEY`, `DATABASE_URL` et `DIRECT_URL`, exécuter les migrations dans l’environnement ciblé, puis déployer. Sans clé d’au moins 32 caractères, les écritures sont désactivées et les données restent privées.

Les sessions durent sept jours, utilisent un cookie HttpOnly/SameSite=Strict et Secure en production (HTTPS requis). Changer `ADMIN_KEY` invalide les sessions existantes. Les lecteurs côté serveur et les API vérifient l’authentification indépendamment du proxy de navigation. Les appels automatisés peuvent utiliser l’en-tête `x-admin-key` ; la clé n’est jamais intégrée au code client.

## Parcours et données

- `/40k/add-game`, `/40k/games`, `/40k/games/[id]` : saisie, historique et débrief 40k, avec notes et liens Drive par tour.
- `/fab/add-game`, `/fab/games`, `/fab/games/[id]` : saisie, historique et notes FaB.
- `/games` : historique commun ; `/api/import` : import CSV privé.
- Les champs absents d’un PATCH sont conservés ; un `null` explicite vide le champ concerné.
- Les liens doivent utiliser HTTPS. Les fichiers restent sur Drive ; aucun téléversement de PDF n’est proposé par cette version.
- Une erreur de sauvegarde ne supprime pas de champs pour essayer d’obtenir un succès ; corriger les migrations si le serveur signale des colonnes manquantes.

## Import CSV

Limites : 2 Mo, 5 000 lignes. Le fichier est entièrement validé avant insertion. Réimporter un fichier crée de nouvelles parties ; aucune déduplication implicite n’est effectuée.

```csv
gameType,build,opponent,first,result,score,tag1,tag2,notes,createdAt
40k,Ultramarines,Orks,true,W,+12,GT,Test,Notes,2025-12-27T10:00:00Z
FaB,Enigma,Bravo,false,L,2,Armory,,,2025-12-26T20:00:00Z
```

`first` accepte `true`/`false` et `1`/`0`, `result` accepte `W`/`L`/`D`, les scores sont des entiers et les dates sont ISO 8601 avec fuseau horaire. `createdAt` peut être vide. `playedAt`, les métadonnées 40k et les autres champs reconnus par `lib/game-validation.ts` peuvent aussi être importés.

## Vérification

```bash
npm run check
npm run build
npm audit --omit=dev --audit-level=high
```

Les tests couvrent l’authentification, les sauvegardes partielles, les métadonnées, la validation et l’import CSV. PGlite exécute toute la chaîne des migrations et vérifie la correspondance avec le schéma Prisma, ainsi que la conservation des données existantes.

Le test PostgreSQL réel s’active avec `TEST_DATABASE_URL`, sur une base dédiée aux tests et déjà migrée. Il utilise des parties identifiées de manière unique et nettoie ses propres données. La CI GitHub Actions fournit son propre PostgreSQL, applique les migrations, puis lance lint, tests, TypeScript et compilation.

Les fichiers `.db`, `.dump` et `.env` ne doivent pas être suivis dans Git. Leur retrait de la version courante n’efface pas l’historique Git existant.

Au 15 octobre 2026, l’audit des dépendances de production ne signale aucune vulnérabilité. L’audit complet conserve une alerte amont sur `braces` (GHSA-vfj7-8cjw-p6xm), propagée à cinq paquets de la chaîne ESLint/Next. Aucune version corrigée de `braces` n’est disponible dans le registre à cette date ; ce code sert à l’analyse des fichiers pendant le développement. L’override ciblé de `deepmerge-ts` corrige séparément la dépendance de configuration de Prisma, sans changer la version majeure de Prisma.
