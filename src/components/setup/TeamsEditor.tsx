import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Shuffle, X, ArrowRightLeft, UserPlus } from 'lucide-react';
import { Player, Team } from '../../types/game';
import {
  MAX_TEAMS,
  MIN_TEAMS,
  addPlayer,
  addTeam,
  movePlayer,
  removePlayer,
  removeTeam,
  renamePlayer,
  shuffleTeams,
} from '../../game/teams';

const TEAM_COLORS = ['#facc15', '#38bdf8', '#2563eb', '#f97316'];

interface TeamsEditorProps {
  teams: Team[];
  setTeams: (teams: Team[]) => void;
}

const pid = (id: number) => `p-${id}`;
const tid = (id: number) => `team-${id}`;

function PlayerChip({
  player,
  color,
  teams,
  setTeams,
}: {
  player: Player;
  color: string;
  teams: Team[];
  setTeams: (t: Team[]) => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: pid(player.id) });
  const nextTeam = (player.teamId + 1) % teams.length;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, borderLeftColor: color }}
      className={`flex items-center gap-1 bg-white rounded-xl border border-gray-200 border-l-4 pl-1 pr-1 py-1 ${
        isDragging ? 'opacity-40' : ''
      } shadow-sm`}
    >
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Glisser ${player.name}`}
        className="p-2 text-gray-400 cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      >
        <GripVertical size={18} />
      </button>
      <input
        value={player.name}
        onChange={(e) => setTeams(renamePlayer(teams, player.id, e.target.value))}
        aria-label="Nom du joueur"
        className="flex-1 min-w-0 bg-transparent px-1 py-1 text-base font-medium text-gray-800 focus:outline-none focus:bg-sky-50 rounded"
      />
      <button
        onClick={() => setTeams(movePlayer(teams, player.id, nextTeam))}
        aria-label={`Déplacer ${player.name} vers Équipe ${nextTeam + 1}`}
        title={`Vers Équipe ${nextTeam + 1}`}
        className="p-2 text-sky-500 hover:bg-sky-50 rounded-lg"
      >
        <ArrowRightLeft size={16} />
      </button>
      <button
        onClick={() => setTeams(removePlayer(teams, player.id))}
        aria-label={`Retirer ${player.name}`}
        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
      >
        <X size={16} />
      </button>
    </li>
  );
}

function TeamColumn({ team, teams, setTeams }: { team: Team; teams: Team[]; setTeams: (t: Team[]) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: tid(team.id) });
  const color = TEAM_COLORS[team.id % TEAM_COLORS.length];
  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl p-3 border-2 transition-colors ${
        isOver ? 'border-sky-400 bg-sky-50/80' : 'border-transparent bg-white/70'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: color }} />
          {team.name}
          <span className="text-xs font-medium text-gray-500">({team.players.length})</span>
        </h3>
        {teams.length > MIN_TEAMS && (
          <button
            onClick={() => setTeams(removeTeam(teams, team.id))}
            aria-label={`Supprimer ${team.name}`}
            className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg"
          >
            <X size={16} />
          </button>
        )}
      </div>
      <SortableContext items={team.players.map((p) => pid(p.id))} strategy={verticalListSortingStrategy}>
        <ul className="space-y-1.5 min-h-[44px]">
          {team.players.map((p) => (
            <PlayerChip key={p.id} player={p} color={color} teams={teams} setTeams={setTeams} />
          ))}
          {team.players.length === 0 && (
            <li className="text-sm text-gray-400 italic text-center py-2.5 border-2 border-dashed border-gray-200 rounded-xl">
              Glisse un joueur ici
            </li>
          )}
        </ul>
      </SortableContext>
    </div>
  );
}

export default function TeamsEditor({ teams, setTeams }: TeamsEditorProps) {
  const [newName, setNewName] = useState('');
  const [activeId, setActiveId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const allPlayers = teams.flatMap((t) => t.players);
  const active = allPlayers.find((p) => p.id === activeId);

  const submit = () => {
    if (!newName.trim()) return;
    setTeams(addPlayer(teams, newName));
    setNewName('');
  };

  const onDragStart = (e: DragStartEvent) => setActiveId(Number(String(e.active.id).slice(2)));

  const onDragEnd = ({ active: a, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over) return;
    const playerId = Number(String(a.id).slice(2));
    const overId = String(over.id);
    if (overId.startsWith('team-')) {
      setTeams(movePlayer(teams, playerId, Number(overId.slice(5))));
      return;
    }
    const target = allPlayers.find((p) => pid(p.id) === overId);
    if (!target || target.id === playerId) return;
    const team = teams[target.teamId];
    // same semantics as arrayMove: the dragged player takes the target's slot
    const index = team.players.findIndex((p) => p.id === target.id);
    setTeams(movePlayer(teams, playerId, target.teamId, index));
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Nom du joueur"
          aria-label="Nom du nouveau joueur"
          enterKeyHint="done"
          className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-gray-200 bg-white text-base focus:ring-2 focus:ring-sky-400 focus:outline-none"
        />
        <button
          onClick={submit}
          aria-label="Ajouter le joueur"
          className="px-4 rounded-xl bg-gradient-to-r from-yellow-400 to-sky-400 text-white font-bold active:scale-95 transition-transform"
        >
          <UserPlus size={22} />
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTeams(shuffleTeams(teams))}
          disabled={allPlayers.length < 2}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/80 border border-gray-200 font-semibold text-gray-700 active:scale-95 transition-transform disabled:opacity-40"
        >
          <Shuffle size={18} /> Mélanger
        </button>
        <button
          onClick={() => setTeams(addTeam(teams))}
          disabled={teams.length >= MAX_TEAMS}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/80 border border-gray-200 font-semibold text-gray-700 active:scale-95 transition-transform disabled:opacity-40"
        >
          <Plus size={18} /> Équipe
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {teams.map((team) => (
            <TeamColumn key={team.id} team={team} teams={teams} setTeams={setTeams} />
          ))}
        </div>
        <DragOverlay>
          {active ? (
            <div
              className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 border-l-4 px-3 py-2.5 shadow-2xl scale-105 font-medium text-gray-800"
              style={{ borderLeftColor: TEAM_COLORS[active.teamId % TEAM_COLORS.length] }}
            >
              <GripVertical size={18} className="text-gray-400" />
              {active.name}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
