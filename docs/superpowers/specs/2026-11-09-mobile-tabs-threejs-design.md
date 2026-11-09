# Time's Up — navigation mobile à onglets + animations Three.js

Date : 2026-11-09

## Intention

Le jeu se joue sur téléphone, passé de main en main. L'écran de configuration actuel (`SetupScreen.tsx`) est une longue page unique. On veut une app qui ressemble à un vrai jeu mobile : un menu principal animé aux couleurs Time's Up (bleu et jaune), des réglages rangés dans des onglets accessibles au pouce, une gestion d'équipes simple au doigt, et la possibilité de quitter une partie en cours.

## Objectifs

1. **Barre d'onglets en bas** (3 onglets), navigation aussi par swipe horizontal entre onglets.
   - **Milieu = menu principal** (onglet par défaut) : titre « Time's Up! » animé, choix de la difficulté (facile / moyen / difficile), gros bouton Play, bouton « Règles ».
   - **Gauche = réglages de la partie** : joueurs, équipes, temps par manche.
   - **Droite = paramètres de l'app** : son, etc.
2. **Règles** accessibles uniquement depuis l'onglet du milieu, via un bouton qui ouvre la modale. Elles sont refaites avec des visuels clairs (illustrations des 3 manches, du swipe gauche/droite, de la rotation des joueurs) pour comprendre le jeu d'un coup d'œil.
3. **Équipes en drag & drop** :
   - ajout rapide d'un joueur (champ + bouton +, validation par Entrée) ;
   - chaque joueur est une pastille qu'on glisse d'une équipe à l'autre au doigt ;
   - ajout/suppression d'équipe (2 à 4 équipes) ;
   - suppression d'un joueur ;
   - bouton « Mélanger » qui répartit les joueurs au hasard de façon équilibrée.
   - Les équipes **peuvent avoir des tailles différentes**.
4. **Rotation des joueurs** : les équipes alternent, et chaque équipe fait tourner ses propres joueurs indépendamment. Exemple : équipe 1 = A, B, C ; équipe 2 = D, E → A, D, B, E, C, D, A, E, …
5. **Quitter en cours de partie** : un bouton toujours visible en jeu ouvre une pop-up « Êtes-vous sûr de vouloir quitter la partie ? » (Annuler / Quitter). Quitter ramène au menu principal sans résultat. Le chrono est mis en pause pendant que la pop-up est ouverte.
6. **Animations Three.js** (approche A) :
   - une scène plein écran derrière l'interface : cartes jaunes et bleues qui flottent et tournent, un sablier, des particules ;
   - animation plus vive sur le menu, plus calme pendant la partie ;
   - effets ponctuels : explosion de confettis quand un mot est trouvé, flash/secousse quand le temps est écoulé.

## Non-objectifs

- Pas de mode en ligne / multi-appareils.
- Pas de nouvelles cartes ni de changement des 3 manches.
- Pas de refonte de l'écran de résultats (il hérite seulement du fond animé).

## Anti-objectifs (échec même si « ça marche »)

- La 3D gêne la lecture du mot ou rend le swipe des cartes saccadé sur un téléphone moyen.
- Le drag & drop ne fonctionne pas au doigt.
- On peut quitter une partie par erreur sans confirmation.

## Contraintes

- Stack existante : React 18, Vite, TypeScript, Tailwind, `lucide-react`.
- Le swipe des cartes en jeu (`SwipeCard` dans `GameScreen.tsx`) et le moteur de son Web Audio restent en place.
- Le swipe entre onglets ne doit pas être déclenché pendant un drag de joueur ni pendant la partie (les onglets n'existent pas en jeu).

## Approches considérées

| | Approche | Compromis |
|---|---|---|
| **A (choisie)** | Three.js pur en scène de fond + effets ponctuels ; UI en React/HTML ; onglets en CSS scroll-snap ; drag & drop avec `@dnd-kit` | 2 dépendances. Texte et boutons nets, swipe existant conservé, risque perf maîtrisé. |
| B | Idem avec `@react-three/fiber` | Plus agréable si la 3D grossit, mais plus de dépendances et un bundle plus lourd. |
| C | Cartes de jeu en vraie 3D | Le plus spectaculaire, mais texte WebGL moins net, plus lourd sur mobile, swipe à refaire. |

Choix de l'utilisateur : **A**, pour un rendu animé sans risque pour la lisibilité ni la fluidité en partie.

## Décisions prises avec l'utilisateur

- Contenu des 3 onglets et onglet du milieu par défaut (voir Objectifs 1).
- Règles accessibles uniquement depuis l'onglet du milieu.
- Tailles d'équipes libres, rotation par équipe (Objectif 4).
- Pop-up de confirmation pour quitter.
- Approche A.

## Choix faits par l'assistant (à vérifier)

- **Ordinateur (décision utilisateur)** : on garde l'interface actuelle en page unique (titre + bouton Règles, équipes, difficulté, temps, Lancer), avec des retouches visuelles autorisées et le fond 3D. Les onglets et la barre du bas sont réservés au mobile (< 768 px, breakpoint `md` de Tailwind). Choix de l'assistant : les deux mises en page réutilisent les mêmes blocs (équipes en drag & drop, difficulté, temps, son), seule leur disposition change ; sur ordinateur, le bloc son apparaît en bas de la page unique.
- **Paramètres (onglet droit)** : son on/off, volume, vibration au mot trouvé (Android ; masquée si `navigator.vibrate` n'existe pas), animations 3D on/off (pour les téléphones lents ; l'interface reste identique sans 3D). Sauvegardés dans `localStorage`.
- **Réglages de partie et joueurs** sauvegardés dans `localStorage`, pour qu'on retrouve sa liste au prochain lancement.
- **Pas de « banc »** : tout joueur appartient à une équipe. Un joueur ajouté va dans l'équipe la moins remplie. Supprimer une équipe renvoie ses joueurs dans les autres.
- **Temps par manche** : on garde les choix 30 / 45 / 60 s actuels, en boutons segmentés. Le libellé devient « Temps par tour ».
- **Validation avant Play** : au moins 2 équipes, chacune avec au moins 1 joueur (idéalement 2). Sinon le bouton Play est désactivé et un message renvoie vers l'onglet gauche.
- **Taille du paquet** : 10 cartes × nombre total de joueurs, comme aujourd'hui, en comptant les joueurs réels et non plus `équipes × joueurs par équipe`.
- **Joueurs par défaut** au premier lancement : 4 joueurs répartis en 2 équipes.
- **Accessibilité** : la scène 3D est décorative (`aria-hidden`), on respecte `prefers-reduced-motion` (animations ralenties ou coupées), le drag & drop a une alternative au clavier/tap (bouton « déplacer vers… » sur chaque pastille).
- **Performance** : rendu limité au pixel ratio ≤ 2, rendu en pause quand l'onglet du navigateur est caché, confettis en `Points` instanciés.

## Ce qui change dans le code (repères)

- `App.tsx` : l'écran « setup » devient le conteneur à onglets ; état des réglages remonté ici pour survivre au changement d'onglet ; ajout de `onQuit` vers `GameScreen`.
- `SetupScreen.tsx` : découpé en onglet Partie (gauche) et menu principal (milieu) ; nouvel onglet Paramètres (droite).
- `types/game.ts` : `GameSettings.playersPerTeam` disparaît ; `GameState.currentPlayerIndex` devient un index par équipe (`number[]`).
- `GameScreen.tsx` : rotation par équipe, taille du paquet, bouton Quitter + pop-up avec pause du chrono, son conditionné aux paramètres, déclenchement des effets 3D.
- `RulesModal.tsx` : refonte visuelle.
- Nouveau : scène Three.js de fond + moyen pour le jeu de déclencher confettis / flash.

## Laissé au constructeur

- Modélisation 3D exacte (formes des cartes, du sablier), palette précise dans le bleu/jaune existant, timings des animations.
- Structure interne des nouveaux composants.
- Détail des illustrations des règles (SVG/emoji/HTML), tant qu'elles montrent les 3 manches, le swipe et la rotation.
