# BlogNode

Application de blog avec authentification, articles, profils et commentaires, développée avec Node.js, Express, React (Vite) et MySQL.

**Site en ligne :** https://blognode.maako.fr

## Démarrage en développement

Prérequis : Node.js 22 et Docker.

1. Lance MySQL :

   ```bash
   cd server
   docker compose up -d
   ```

2. Crée le fichier de configuration du serveur, puis renseigne `JWT_SECRET` :

   ```bash
   cp server/.env.example server/.env
   ```

3. Installe les dépendances :

   ```bash
   npm install
   npm install --prefix server
   npm install --prefix client
   ```

4. Lance l'application depuis la racine du projet :

   ```bash
   npm run dev
   ```

L'application est disponible sur http://localhost:5173. Vite transmet `/api` et `/uploads` à l'API, sur le port 5030.

## Compte de démonstration

En développement, la base est remplie au premier lancement avec des articles et ce compte :

- **Email :** `admin@blog.com`
- **Mot de passe :** `password123`

Ce compte n'est jamais créé en production.

## Commentaires

Les utilisateurs connectés peuvent commenter un article en texte, en Markdown ou en HTML. Seul l'auteur d'un commentaire peut le modifier ou le supprimer.

Le contenu est stocké tel quel, puis filtré à l'affichage par une liste blanche de balises.

## Tests

Les tests du serveur utilisent une base `blog_test` dédiée. MySQL doit être lancé.

```bash
npm test --prefix server
npm test --prefix client
```

## Déploiement

Le fichier `compose.yaml` décrit la production.
