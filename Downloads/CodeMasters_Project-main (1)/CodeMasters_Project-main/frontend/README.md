# BMP.tn – Frontend public (vitrine)

Interface publique : page d’accueil et vitrine de l’application, visible par tous.

- **frontend** (ce dossier) = site vitrine (Next.js) → **http://localhost:3000**
- **backend-react** = espace admin / tableau de bord → **http://localhost:5173**

## Lancer le frontend public

```bash
cd frontend
npm install
npm run dev
```

Ouvrir dans le navigateur : **http://localhost:3000**

## Tester le frontend (vitrine)

1. Depuis la racine du projet : `cd frontend`
2. `npm install` (si pas déjà fait)
3. `npm run dev`
4. Aller sur **http://localhost:3000** pour voir la page d’accueil BMP.tn.

## Login & Inscription

Le bouton **Login** de la barre de navigation redirige vers l’espace admin (backend-react).  
Par défaut : **http://localhost:5173/login**

Pour changer l’URL de l’admin (ex. en production), créer un fichier `.env.local` :

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_ADMIN_URL=http://localhost:5173
```

## Vidéo d’arrière-plan

La page d’accueil utilise une vidéo de fond. Si le fichier `public/videos/VD.mp4` n’existe pas, un dégradé est affiché à la place (comportement normal).
