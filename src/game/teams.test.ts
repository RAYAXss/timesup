import { describe, it, expect } from 'vitest';
import { Team } from '../types/game';
import {
  addPlayer,
  removePlayer,
  renamePlayer,
  movePlayer,
  addTeam,
  removeTeam,
  shuffleTeams,
  canStart,
  nextTurn,
  defaultTeams,
} from './teams';

let nextId = 0;
const mk = (names: string[][]): Team[] => {
  nextId = 0;
  return names.map((players, i) => ({
    id: i,
    name: `Équipe ${i + 1}`,
    score: 0,
    players: players.map((name) => ({ id: nextId++, name, teamId: i })),
  }));
};
const sizes = (teams: Team[]) => teams.map((t) => t.players.length);

describe('nextTurn', () => {
  it('alternates teams and cycles each team independently', () => {
    const teams = mk([['A', 'B', 'C'], ['D', 'E']]);
    let state = { teamIndex: 0, playerIdx: [0, 0] };
    const speakers: string[] = [];
    for (let i = 0; i < 8; i++) {
      speakers.push(teams[state.teamIndex].players[state.playerIdx[state.teamIndex]].name);
      state = nextTurn(state.teamIndex, state.playerIdx, teams);
    }
    expect(speakers.join(' ')).toBe('A D B E C D A E');
  });
});

describe('addPlayer', () => {
  it('adds to the smallest team with a fresh id', () => {
    const out = addPlayer(mk([['A', 'B', 'C'], ['D', 'E']]), '  F ');
    expect(sizes(out)).toEqual([3, 3]);
    const f = out[1].players[2];
    expect(f).toEqual({ id: 5, name: 'F', teamId: 1 });
  });
  it('ignores empty names', () => {
    const teams = mk([['A'], ['B']]);
    expect(addPlayer(teams, '   ')).toBe(teams);
  });
});

describe('removePlayer', () => {
  it('removes by id', () => {
    const out = removePlayer(mk([['A', 'B'], ['C']]), 1);
    expect(out[0].players.map((p) => p.name)).toEqual(['A']);
  });
});

describe('movePlayer', () => {
  it('moves a player to another team at an index', () => {
    const out = movePlayer(mk([['A', 'B'], ['C']]), 0, 1, 0);
    expect(out[0].players.map((p) => p.name)).toEqual(['B']);
    expect(out[1].players.map((p) => p.name)).toEqual(['A', 'C']);
    expect(out[1].players[0].teamId).toBe(1);
  });
  it('appends when no index is given', () => {
    const out = movePlayer(mk([['A', 'B'], ['C']]), 0, 1);
    expect(out[1].players.map((p) => p.name)).toEqual(['C', 'A']);
  });
});

describe('addTeam / removeTeam', () => {
  it('adds a named team up to 4', () => {
    const out = addTeam(mk([['A'], ['B']]));
    expect(out.map((t) => t.name)).toEqual(['Équipe 1', 'Équipe 2', 'Équipe 3']);
    const four = mk([['A'], ['B'], ['C'], ['D']]);
    expect(addTeam(four)).toBe(four);
  });
  it('redistributes players and renumbers on remove', () => {
    const out = removeTeam(mk([['A', 'B'], ['C', 'D'], ['E', 'F']]), 1);
    expect(out).toHaveLength(2);
    expect(sizes(out).reduce((a, b) => a + b)).toBe(6);
    expect(out.map((t) => t.id)).toEqual([0, 1]);
    expect(out.map((t) => t.name)).toEqual(['Équipe 1', 'Équipe 2']);
    out.forEach((t) => t.players.forEach((p) => expect(p.teamId).toBe(t.id)));
  });
  it('keeps at least 2 teams', () => {
    const two = mk([['A'], ['B']]);
    expect(removeTeam(two, 0)).toBe(two);
  });
});

describe('shuffleTeams', () => {
  it('balances sizes and keeps every player', () => {
    const teams = mk([['A', 'B', 'C', 'D', 'E'], []]);
    const out = shuffleTeams(teams, () => 0.42);
    expect(sizes(out).sort()).toEqual([2, 3]);
    const ids = out.flatMap((t) => t.players.map((p) => p.id)).sort();
    expect(ids).toEqual([0, 1, 2, 3, 4]);
    out.forEach((t) => t.players.forEach((p) => expect(p.teamId).toBe(t.id)));
  });
});

describe('canStart', () => {
  it('needs 2+ teams each with a player', () => {
    expect(canStart(mk([['A'], ['B']]))).toBe(true);
    expect(canStart(mk([['A', 'B'], []]))).toBe(false);
    expect(canStart(mk([['A', 'B']]))).toBe(false);
  });
});

describe('defaultTeams', () => {
  it('gives 2 teams of 2', () => {
    const t = defaultTeams();
    expect(sizes(t)).toEqual([2, 2]);
    expect(t[0].players[0].name).toBe('Joueur 1');
    expect(canStart(t)).toBe(true);
  });
});

describe('renamePlayer', () => {
  it('renames by id without trimming while typing', () => {
    const out = renamePlayer(mk([['A'], ['B']]), 1, 'Bob ');
    expect(out[1].players[0].name).toBe('Bob ');
    expect(out[0].players[0].name).toBe('A');
  });
});
