import { Player, Team } from '../types/game';

export const MIN_TEAMS = 2;
export const MAX_TEAMS = 4;

/** Rebuilds ids, names and players' teamId from array order. */
const normalize = (teams: Team[]): Team[] =>
  teams.map((t, i) => ({
    ...t,
    id: i,
    name: `Équipe ${i + 1}`,
    players: t.players.map((p) => ({ ...p, teamId: i })),
  }));

const smallestIndex = (teams: Team[]) =>
  teams.reduce((best, t, i) => (t.players.length < teams[best].players.length ? i : best), 0);

const nextPlayerId = (teams: Team[]) =>
  Math.max(-1, ...teams.flatMap((t) => t.players.map((p) => p.id))) + 1;

export function addPlayer(teams: Team[], name: string): Team[] {
  const clean = name.trim();
  if (!clean) return teams;
  const target = smallestIndex(teams);
  const player: Player = { id: nextPlayerId(teams), name: clean, teamId: target };
  return teams.map((t, i) => (i === target ? { ...t, players: [...t.players, player] } : t));
}

export function removePlayer(teams: Team[], playerId: number): Team[] {
  return teams.map((t) => ({ ...t, players: t.players.filter((p) => p.id !== playerId) }));
}

export function movePlayer(teams: Team[], playerId: number, toTeamId: number, toIndex?: number): Team[] {
  const player = teams.flatMap((t) => t.players).find((p) => p.id === playerId);
  if (!player) return teams;
  const without = removePlayer(teams, playerId);
  return normalize(
    without.map((t) => {
      if (t.id !== toTeamId) return t;
      const players = [...t.players];
      players.splice(toIndex ?? players.length, 0, player);
      return { ...t, players };
    })
  );
}

export function addTeam(teams: Team[]): Team[] {
  if (teams.length >= MAX_TEAMS) return teams;
  return normalize([...teams, { id: teams.length, name: '', score: 0, players: [] }]);
}

export function removeTeam(teams: Team[], teamId: number): Team[] {
  if (teams.length <= MIN_TEAMS) return teams;
  const removed = teams.find((t) => t.id === teamId);
  if (!removed) return teams;
  let rest = teams.filter((t) => t.id !== teamId);
  for (const p of removed.players) {
    const target = smallestIndex(rest);
    rest = rest.map((t, i) => (i === target ? { ...t, players: [...t.players, p] } : t));
  }
  return normalize(rest);
}

export function shuffleTeams(teams: Team[], rand: () => number = Math.random): Team[] {
  const all = teams.flatMap((t) => t.players);
  // Fisher–Yates
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  const dealt = teams.map((t) => ({ ...t, players: [] as Player[] }));
  all.forEach((p, i) => dealt[i % dealt.length].players.push(p));
  return normalize(dealt);
}

export function canStart(teams: Team[]): boolean {
  return teams.length >= MIN_TEAMS && teams.every((t) => t.players.length > 0);
}

/** Advance the current team's own speaker, then hand over to the next team. */
export function nextTurn(
  teamIndex: number,
  playerIdx: number[],
  teams: Team[]
): { teamIndex: number; playerIdx: number[] } {
  const advanced = playerIdx.map((idx, i) =>
    i === teamIndex ? (idx + 1) % Math.max(1, teams[i].players.length) : idx
  );
  return { teamIndex: (teamIndex + 1) % teams.length, playerIdx: advanced };
}

export function defaultTeams(): Team[] {
  return normalize(
    [0, 1].map((i) => ({
      id: i,
      name: '',
      score: 0,
      players: [0, 1].map((j) => ({ id: i * 2 + j, name: `Joueur ${i * 2 + j + 1}`, teamId: i })),
    }))
  );
}
