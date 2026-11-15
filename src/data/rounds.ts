import { Difficulty } from '../types/game';

export interface RoundInfo {
  round: number;
  /** Nom court affiché dans les badges (header, résultats) */
  short: string;
  /** Titre accrocheur affiché sur l'écran d'intro */
  title: string;
  emoji: string;
  /** Explication claire de la règle du round */
  rule: string;
  /** Classes tailwind du dégradé d'accent du round */
  accent: string;
}

export const ROUNDS: RoundInfo[] = [
  {
    round: 1,
    short: 'Description',
    title: 'Décris le mot',
    emoji: '🗣️',
    rule: "Fais deviner en parlant : dis tout ce que tu veux, SAUF le mot lui-même et ses dérivés. Pas de limite de tentatives !",
    accent: 'from-amber-400 to-orange-500',
  },
  {
    round: 2,
    short: 'Un seul mot',
    title: 'Un seul mot',
    emoji: '🤫',
    rule: "Un SEUL mot autorisé par carte pour faire deviner. Choisis-le bien ! (mêmes cartes qu'au round 1)",
    accent: 'from-sky-400 to-indigo-500',
  },
  {
    round: 3,
    short: 'Mime',
    title: 'Mime !',
    emoji: '🙌',
    rule: "Aucun son, aucun mot : uniquement les gestes et le mime. Toujours les mêmes cartes !",
    accent: 'from-fuchsia-500 to-pink-500',
  },
];

export const getRound = (round: number): RoundInfo =>
  ROUNDS[round - 1] ?? ROUNDS[0];

export interface Preset {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  numberOfTeams: number;
  playersPerTeam: number;
  difficulty: Difficulty;
  timePerPlayer: number;
}

export const PRESETS: Preset[] = [
  {
    id: 'decouverte',
    name: 'Découverte',
    emoji: '🌱',
    tagline: 'Idéal pour une première partie, tout en douceur.',
    numberOfTeams: 2,
    playersPerTeam: 2,
    difficulty: 'facile',
    timePerPlayer: 45,
  },
  {
    id: 'classique',
    name: 'Classique',
    emoji: '🎯',
    tagline: "L'expérience Time's Up équilibrée.",
    numberOfTeams: 2,
    playersPerTeam: 2,
    difficulty: 'moyen',
    timePerPlayer: 30,
  },
  {
    id: 'soiree',
    name: 'Soirée',
    emoji: '🎉',
    tagline: 'Grand groupe, rythme rapide, cartes corsées.',
    numberOfTeams: 4,
    playersPerTeam: 3,
    difficulty: 'difficile',
    timePerPlayer: 30,
  },
];
