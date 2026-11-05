# Déploiement sur Coolify

Déploie le blog sur `https://blognode.maako.fr` à partir du dépôt GitHub public.

## Architecture

Seul le service `web` reçoit du trafic externe. L'API et MySQL ne publient aucun port.

```text
Navigateur → Proxy Coolify (HTTPS) → nginx (web) → API Express → MySQL
```

## 1. Préparer le DNS

Crée un enregistrement `A` pour `blognode.maako.fr` vers l'adresse IP du serveur Coolify.

## 2. Créer la ressource

1. Pousse le code sur la branche `main`.
2. Dans Coolify, sélectionne **+ New**, puis la source de dépôt public.
3. Colle `https://github.com/MaeRiz/LC-bloc_blanc-3`, puis sélectionne **Check Repository**.
4. Dans **General > Build pipeline**, choisis **Compose** comme **Build strategy**.
5. Laisse **Base Directory** sur la racine du dépôt.
6. Indique `compose.yaml` dans **Docker Compose Location**.
7. Enregistre.

## 3. Renseigner les variables

Coolify détecte ces variables dans `compose.yaml` et bloque le déploiement tant qu'elles sont vides.

| Variable | Rôle |
|---|---|
| `DB_ROOT_PASSWORD` | Mot de passe root de MySQL |
| `DB_PASSWORD` | Mot de passe de l'utilisateur `blog` |
| `JWT_SECRET` | Clé de signature des sessions |

Génère une valeur différente pour chacune :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`DB_PASSWORD` et `DB_ROOT_PASSWORD` ne s'appliquent qu'à la création du volume MySQL. Les modifier plus tard ne change pas les mots de passe de la base existante.

`TRUST_PROXY` vaut 2 par défaut : le proxy Coolify, puis nginx. Si un autre proxy est placé devant, comme Cloudflare en mode proxy, ajoute `TRUST_PROXY` avec la valeur 3.

## 4. Attribuer le domaine

1. Ouvre **Domains**, puis sélectionne **Add domain**.
2. Choisis le service `web`.
3. Saisis `https://blognode.maako.fr`.

Le service écoute sur le port 80, il n'y a donc pas de port à ajouter au domaine.

## 5. Déployer

Sélectionne **Deploy**, puis suis les journaux de déploiement.

La production démarre sans compte ni article. Crée ton compte et ton premier article depuis le site.

## 6. Vérifier le déploiement

- [ ] Le site s'ouvre en HTTPS.
- [ ] Une page ouverte directement, comme `/login`, s'affiche après un rechargement.
- [ ] L'inscription, la connexion et la création d'un article avec image fonctionnent.
- [ ] Un commentaire peut être créé, modifié et supprimé.
- [ ] Le compte `admin@blog.com` n'existe pas.
- [ ] L'image et le commentaire sont toujours là après un redéploiement.

### Vérifier la limitation des connexions

Ce test vérifie que le blocage ne peut pas être contourné avec un faux en-tête `X-Forwarded-For`. Il dépend du proxy réel et doit donc être lancé sur le site déployé.

```bash
for i in $(seq 1 11); do
  curl -s -o /dev/null -w "%{http_code} " -X POST https://blognode.maako.fr/api/auth/login \
    -H "Content-Type: application/json" \
    -H "X-Forwarded-For: 1.2.3.$i" \
    -d '{"email":"test@test.local","password":"faux"}'
done
```

**Résultat attendu :** la dernière réponse est `429`.

Si toutes les réponses restent à `401`, `TRUST_PROXY` est trop élevé. Ce test bloque ton adresse IP sur la connexion pendant 15 minutes.
