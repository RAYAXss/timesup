# Time's Up! 🎮

Jeu Time's Up multijoueur interactif développé avec React, TypeScript et Tailwind CSS.

## 📖 Description

Time's Up est un jeu de société où les équipes doivent faire deviner des mots/personnages en 3 rounds avec des contraintes différentes :
- **Round 1** : Description libre
- **Round 2** : Un seul mot
- **Round 3** : Mime

## ✨ Fonctionnalités

- 🎯 3 niveaux de difficulté (facile, moyen, difficile)
- 👥 2 à 4 équipes de 2 à 4 joueurs
- ⏱️ Timer configurable (30s, 45s ou 60s)
- 📱 Interface responsive (mobile, tablette, desktop)
- 🎨 Design moderne avec animations
- ✋ Swipe sur mobile (glisser à droite = trouvé, à gauche = passer)
- ⌨️ Raccourcis clavier (← / →)
- 🔊 Effets sonores (Web Audio API)
- 📊 Scores détaillés par équipe et par round

## 🚀 Installation

```bash
# Cloner le dépôt
git clone https://github.com/votre-username/timesup.git
cd timesup

# Installer les dépendances
npm install
```

## 🧪 Lancer en mode test/développement

```bash
# Serveur de développement (hot reload)
npm run dev
```

Le jeu sera accessible sur **http://localhost:5173**

## 🏗️ Build de production

```bash
# Créer le build optimisé
npm run build

# Prévisualiser le build
npm run preview
```

## 🎮 Comment jouer

1. **Configuration** : Choisissez le nombre d'équipes, de joueurs, la difficulté et le temps par tour
2. **Noms** : Entrez les noms des joueurs pour chaque équipe
3. **Lancer** : Cliquez sur "Lancer la partie"
4. **Jouer** :
   - Chaque joueur a son tour avec un timer
   - Faire deviner le mot affiché selon les règles du round
   - **Mobile** : Swiper à droite (trouvé) ou à gauche (passer)
   - **Desktop** : Cliquer sur les boutons ou utiliser ← / →
5. **Rounds** : 3 rounds avec les mêmes cartes mais des règles différentes
6. **Résultats** : L'équipe avec le plus de points gagne !

## 📦 Technologies

- **React 18** - Framework UI
- **TypeScript** - Typage statique
- **Vite** - Build tool ultra-rapide
- **Tailwind CSS** - Styling utilitaire
- **Lucide React** - Icônes
- **Web Audio API** - Sons synthétisés

## 📝 Scripts disponibles

```bash
npm run dev        # Serveur de développement
npm run build      # Build de production
npm run preview    # Prévisualiser le build
npm run lint       # Linter ESLint
npm run typecheck  # Vérification TypeScript
```

## 🃏 Base de données de cartes

Le jeu contient **500+ cartes** réparties en catégories :
- Objets du quotidien
- Nourriture & boissons
- Animaux
- Sports & activités
- Musique & instruments
- Nature & météo
- Transports
- Métiers
- Lieux
- Jeux & loisirs
- Émotions & sensations
- Vêtements & accessoires
- Personnages fictifs & pop culture
- Tech & science
- Fêtes & célébrations
- Actions & situations
- Et bien plus...

## 🎨 Personnalisation

Les cartes sont définies dans `src/data/cards.ts`. Chaque carte a 3 niveaux de difficulté.

Structure d'une carte :
```typescript
{
  id: number,
  facile: string,
  moyen: string,
  difficile: string
}
```

## 📄 Licence

MIT

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.
