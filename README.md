# BlogNode

Application de blog avec authentification, articles, profils et commentaires, développée avec Node.js, Express, React (Vite) et MySQL.

**Site en ligne :** https://blognode.maako.fr

## Lancer le projet en local

Prérequis : Node.js 22 et Docker. Lance toutes les commandes depuis la racine du projet.

1. Lance MySQL :

   ```bash
   docker compose -f server/docker-compose.yml up -d
   ```

2. Crée le fichier de configuration du serveur :

   ```bash
   cp server/.env.example server/.env
   ```

3. Génère une clé, puis colle-la dans `JWT_SECRET` dans `server/.env` :

   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

   Le serveur refuse de démarrer sans cette valeur.

4. Installe les dépendances :

   ```bash
   npm install
   npm install --prefix server
   npm install --prefix client
   ```

5. Lance le serveur et le front :

   ```bash
   npm run dev
   ```

| Service | Adresse locale |
|---|---|
| Application | http://localhost:5173 |
| API | http://localhost:5030 |
| MySQL | `localhost:3307` |

Vite transmet `/api` et `/uploads` à l'API : utilise l'application sur le port 5173.

### Lancer uniquement le serveur

```bash
npm run server
```

L'API répond alors sur http://localhost:5030. MySQL doit être lancé, et la base est créée au premier démarrage.

Redémarre le serveur après chaque modification de son code, car il ne se recharge pas automatiquement.

### Arrêter MySQL

```bash
docker compose -f server/docker-compose.yml down
```

Les données sont conservées pour le prochain lancement.

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

## Production

L'application est déployée sur https://blognode.maako.fr.

Le fichier `compose.yaml` décrit la production.
