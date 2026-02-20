import { useState, useEffect, useRef } from 'react';
import { Timer, Trophy, Users } from 'lucide-react';
import { GameSettings, Team, Card, GameState } from '../types/game';
import { cardDatabase } from '../data/cards';

interface GameScreenProps {
  settings: GameSettings;
  teams: Team[];
  onGameEnd: (finalTeams: Team[], roundScores: number[][]) => void;
}

// ─── Web Audio Sound Engine ───────────────────────────────────────────────────

function createSoundEngine() {
  let ctx: AudioContext | null = null;

  const getCtx = () => {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    return ctx;
  };

  const playSuccess = () => {
    try {
      const ac = getCtx();
      // Joyful ascending arpeggio: C5 – E5 – G5
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ac.currentTime + i * 0.1);
        gain.gain.setValueAtTime(0, ac.currentTime + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.25, ac.currentTime + i * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i * 0.1 + 0.25);
        osc.start(ac.currentTime + i * 0.1);
        osc.stop(ac.currentTime + i * 0.1 + 0.3);
      });
    } catch (_) {}
  };

  const playSkip = () => {
    try {
      const ac = getCtx();
      // Short descending "woosh"
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ac.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ac.currentTime + 0.18);
      gain.gain.setValueAtTime(0.15, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.2);
      osc.start(ac.currentTime);
      osc.stop(ac.currentTime + 0.22);
    } catch (_) {}
  };

  const playTick = () => {
    try {
      const ac = getCtx();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, ac.currentTime);
      gain.gain.setValueAtTime(0.08, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.06);
      osc.start(ac.currentTime);
      osc.stop(ac.currentTime + 0.07);
    } catch (_) {}
  };

  const playTimeUp = () => {
    try {
      const ac = getCtx();
      [440, 330].forEach((freq, i) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, ac.currentTime + i * 0.18);
        gain.gain.setValueAtTime(0.18, ac.currentTime + i * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i * 0.18 + 0.16);
        osc.start(ac.currentTime + i * 0.18);
        osc.stop(ac.currentTime + i * 0.18 + 0.18);
      });
    } catch (_) {}
  };

  return { playSuccess, playSkip, playTick, playTimeUp };
}

const soundEngine = createSoundEngine();

// ─── Swipeable Card ──────────────────────────────────────────────────────────

interface SwipeCardProps {
  word: string;
  round: number;
  roundName: string;
  onSuccess: () => void;
  onSkip: () => void;
  disabled: boolean;
}

function SwipeCard({ word, round, roundName, onSuccess, onSkip, disabled }: SwipeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const currentXRef = useRef(0);
  const animatingRef = useRef(false);

  const applyTransform = (x: number, rotate: number, opacity: number, transition = '') => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transition = transition;
    el.style.transform = `translateX(${x}px) rotate(${rotate}deg)`;
    el.style.opacity = String(opacity);
  };

  const flyOut = (direction: 'left' | 'right', callback: () => void) => {
    if (animatingRef.current) return;
    animatingRef.current = true;
    const x = direction === 'right' ? 600 : -600;
    const rotate = direction === 'right' ? 20 : -20;
    applyTransform(x, rotate, 0, 'transform 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease');
    setTimeout(() => {
      animatingRef.current = false;
      callback();
    }, 350);
  };

  // ── Block browser scroll when swiping horizontally ────────────────────────
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const onTouchMove = (e: TouchEvent) => {
      // If a horizontal swipe is in progress, prevent page scroll
      if (startXRef.current !== null) {
        const t = e.touches[0];
        const dx = Math.abs(t.clientX - startXRef.current);
        const dy = Math.abs(t.clientY - (startYRef.current ?? t.clientY));
        if (dx > dy) e.preventDefault();
      }
    };

    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', onTouchMove);
  }, []);

  // ── Pointer events ─────────────────────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled || animatingRef.current) return;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    currentXRef.current = 0;
    cardRef.current?.setPointerCapture(e.pointerId);
    applyTransform(0, 0, 1, '');
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (startXRef.current === null || disabled || animatingRef.current) return;
    const dx = e.clientX - startXRef.current;
    currentXRef.current = dx;
    const rotate = dx / 18;
    const opacity = Math.max(0.6, 1 - Math.abs(dx) / 400);
    applyTransform(dx, rotate, opacity, '');

    const el = cardRef.current;
    if (el) {
      const successHint = el.querySelector<HTMLElement>('.hint-success');
      const skipHint = el.querySelector<HTMLElement>('.hint-skip');
      if (successHint) successHint.style.opacity = dx > 40 ? Math.min(1, (dx - 40) / 80).toString() : '0';
      if (skipHint) skipHint.style.opacity = dx < -40 ? Math.min(1, (-dx - 40) / 80).toString() : '0';
    }
  };

  const onPointerUp = () => {
    if (startXRef.current === null || disabled || animatingRef.current) return;
    startXRef.current = null;
    const dx = currentXRef.current;

    if (dx > 100) {
      flyOut('right', onSuccess);
    } else if (dx < -100) {
      flyOut('left', onSkip);
    } else {
      applyTransform(0, 0, 1, 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease');
      const el = cardRef.current;
      if (el) {
        el.querySelector<HTMLElement>('.hint-success')!.style.opacity = '0';
        el.querySelector<HTMLElement>('.hint-skip')!.style.opacity = '0';
      }
    }
  };

  // keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (disabled || animatingRef.current) return;
      if (e.key === 'ArrowRight') flyOut('right', onSuccess);
      if (e.key === 'ArrowLeft') flyOut('left', onSkip);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [disabled, onSuccess, onSkip]);

  // reset card position when word changes
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transition = 'none';
    el.style.transform = 'translateX(0) rotate(0deg)';
    el.style.opacity = '1';
    const sh = el.querySelector<HTMLElement>('.hint-success');
    const sk = el.querySelector<HTMLElement>('.hint-skip');
    if (sh) sh.style.opacity = '0';
    if (sk) sk.style.opacity = '0';
    animatingRef.current = false;
  }, [word]);

  return (
    <div
      ref={cardRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="relative cursor-grab active:cursor-grabbing"
      style={{
        willChange: 'transform, opacity',
        // Désactive toute sélection de texte (tous navigateurs)
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        // Coupe les actions touch natives (scroll, zoom, highlight)
        touchAction: 'none',
        WebkitTapHighlightColor: 'transparent',
        // Désactive le callout iOS (long press menu)
        WebkitTouchCallout: 'none',
      } as React.CSSProperties}
    >
      {/* Success hint */}
      <div
        className="hint-success pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-3xl"
        style={{
          opacity: 0,
          background: 'linear-gradient(135deg, rgba(34,197,94,0.18) 0%, rgba(34,197,94,0.04) 100%)',
          border: '3px solid rgba(34,197,94,0.7)',
          transition: 'opacity 0.1s',
        }}
      >
        <span className="text-green-500 font-black text-5xl tracking-tight drop-shadow">✓</span>
      </div>

      {/* Skip hint */}
      <div
        className="hint-skip pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-3xl"
        style={{
          opacity: 0,
          background: 'linear-gradient(135deg, rgba(239,68,68,0.18) 0%, rgba(239,68,68,0.04) 100%)',
          border: '3px solid rgba(239,68,68,0.7)',
          transition: 'opacity 0.1s',
        }}
      >
        <span className="text-red-500 font-black text-5xl tracking-tight drop-shadow">✗</span>
      </div>

      {/* Card body */}
      <div
        className="bg-white rounded-3xl shadow-2xl flex flex-col items-center justify-center p-6 sm:p-10"
        style={{
          minHeight: 'min(56vh, 420px)',
          maxHeight: 'min(60vh, 460px)',
          width: '100%',
        }}
      >
        <span className="text-xs font-semibold tracking-widest uppercase text-purple-500 bg-purple-50 px-4 py-1.5 rounded-full mb-6 sm:mb-8">
          Round {round} · {roundName}
        </span>
        <h2
          className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 text-center leading-tight px-2"
          style={{ fontFamily: "'Georgia', serif", letterSpacing: '-0.02em' }}
        >
          {word}
        </h2>
        <p className="mt-8 sm:mt-10 text-gray-300 text-xs sm:text-sm font-medium tracking-wide">
          ← Passer &nbsp;&nbsp;|&nbsp;&nbsp; Trouvé →
        </p>
      </div>
    </div>
  );
}

// ─── GameScreen ───────────────────────────────────────────────────────────────

export default function GameScreen({ settings, teams, onGameEnd }: GameScreenProps) {
  const [gameState, setGameState] = useState<GameState>(() => {
    const totalPlayers = settings.numberOfTeams * settings.playersPerTeam;
    const deckSize = totalPlayers * 10;
    const shuffledCards = [...cardDatabase]
      .sort(() => Math.random() - 0.5)
      .slice(0, deckSize);

    return {
      teams: teams.map((team) => ({ ...team, score: 0 })),
      currentTeamIndex: 0,
      currentPlayerIndex: 0,
      currentRound: 1,
      deck: shuffledCards,
      usedCards: [],
      roundScores: [[], [], []],
    };
  });

  const [showPlayerModal, setShowPlayerModal] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(settings.timePerPlayer);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [roundScore, setRoundScore] = useState(0);

  const currentTeam = gameState.teams[gameState.currentTeamIndex];
  const currentPlayer = currentTeam.players[gameState.currentPlayerIndex];
  const currentCard = gameState.deck[currentCardIndex];

  // ── Block body scroll while game is active ────────────────────────────────
  useEffect(() => {
    if (!isPlaying) {
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';
      return;
    }
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    return () => {
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';
    };
  }, [isPlaying]);

  // countdown
  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    } else {
      setCountdown(null);
      setIsPlaying(true);
    }
  }, [countdown]);

  // timer + tick sound in last 10 seconds
  useEffect(() => {
    if (!isPlaying) return;
    if (timeLeft > 0) {
      if (timeLeft <= 10) soundEngine.playTick();
      const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
      return () => clearTimeout(t);
    } else {
      soundEngine.playTimeUp();
      handleTurnEnd();
    }
  }, [isPlaying, timeLeft]);

  const handleReady = () => {
    setShowPlayerModal(false);
    setCountdown(3);
  };

  const handleTurnEnd = (overrideScore?: number, overrideState?: typeof gameState) => {
    setIsPlaying(false);

    const score = overrideScore ?? roundScore;
    const state = overrideState ?? gameState;

    const updatedTeams = state.teams.map((t, i) =>
      i === state.currentTeamIndex ? { ...t, score: t.score + score } : t
    );

    const updatedRoundScores = state.roundScores.map((r, ri) =>
      ri === state.currentRound - 1
        ? r.map((s, ti) => (ti === state.currentTeamIndex ? (s ?? 0) + score : s))
        : r
    );
    if (!updatedRoundScores[state.currentRound - 1][state.currentTeamIndex]) {
      updatedRoundScores[state.currentRound - 1][state.currentTeamIndex] = score;
    }

    const nextTeamIndex = (state.currentTeamIndex + 1) % settings.numberOfTeams;
    const nextPlayerIndex =
      nextTeamIndex === 0
        ? (state.currentPlayerIndex + 1) % settings.playersPerTeam
        : state.currentPlayerIndex;

    if (state.deck.length === 0 || state.deck.length <= currentCardIndex + 1 - score) {
      if (state.currentRound < 3) {
        const newDeck = [...state.usedCards].sort(() => Math.random() - 0.5);
        setGameState({
          ...state,
          teams: updatedTeams,
          currentTeamIndex: nextTeamIndex,
          currentPlayerIndex: nextPlayerIndex,
          currentRound: state.currentRound + 1,
          deck: newDeck,
          usedCards: [],
          roundScores: updatedRoundScores,
        });
        setCurrentCardIndex(0);
        setRoundScore(0);
        setTimeLeft(settings.timePerPlayer);
        setShowPlayerModal(true);
      } else {
        onGameEnd(updatedTeams, updatedRoundScores);
      }
    } else {
      setGameState({
        ...state,
        teams: updatedTeams,
        currentTeamIndex: nextTeamIndex,
        currentPlayerIndex: nextPlayerIndex,
        roundScores: updatedRoundScores,
      });
      setCurrentCardIndex(0);
      setRoundScore(0);
      setTimeLeft(settings.timePerPlayer);
      setShowPlayerModal(true);
    }
  };

  const handleCardSuccess = () => {
    if (!isPlaying) return;
    soundEngine.playSuccess(); // 🎵 arpège montant

    const newUsedCards = [...gameState.usedCards, currentCard];
    const newDeck = gameState.deck.filter((_, i) => i !== currentCardIndex);
    const newScore = roundScore + 1;

    if (newDeck.length === 0) {
      const newState = { ...gameState, deck: newDeck, usedCards: newUsedCards };
      setGameState(newState);
      setRoundScore(newScore);
      handleTurnEnd(newScore, newState);
      return;
    }

    setGameState({ ...gameState, deck: newDeck, usedCards: newUsedCards });
    setRoundScore(newScore);
    setCurrentCardIndex(Math.min(currentCardIndex, newDeck.length - 1));
  };

  const handleCardSkip = () => {
    if (!isPlaying) return;
    soundEngine.playSkip(); // 🎵 woosh descendant

    const newDeck = [...gameState.deck];
    const [card] = newDeck.splice(currentCardIndex, 1);
    newDeck.push(card);

    setGameState({ ...gameState, deck: newDeck });
  };

  const getCardWord = () => {
    if (!currentCard) return '';
    return (currentCard as any)[settings.difficulty] ?? currentCard.easy ?? '';
  };

  const getRoundName = (round: number) => ['Description', 'Un seul mot', 'Mime'][round - 1] ?? `Round ${round}`;

  const timerColor = timeLeft <= 10 ? '#ef4444' : timeLeft <= 20 ? '#f97316' : '#6d28d9';
  const timerPct = timeLeft / settings.timePerPlayer;

  // ── Player modal ──
  if (showPlayerModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto flex items-center justify-center mb-4">
              <Users className="text-white" size={36} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">À ton tour !</h2>
            <p className="text-lg sm:text-xl text-purple-600 font-semibold mb-1">{currentPlayer.name}</p>
            <p className="text-gray-600">{currentTeam.name}</p>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">Round {gameState.currentRound}/3</p>
            <p className="text-lg font-semibold text-gray-800">{getRoundName(gameState.currentRound)}</p>
            <p className="text-sm text-gray-600 mt-2">{gameState.deck.length} cartes restantes</p>
          </div>
          <button
            onClick={handleReady}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-2xl font-bold text-xl hover:shadow-2xl active:scale-95 transition-all duration-200"
          >
            Prêt !
          </button>
        </div>
      </div>
    );
  }

  // ── Countdown ──
  if (countdown !== null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-9xl font-bold animate-pulse">{countdown}</div>
      </div>
    );
  }

  // ── Game ──
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-3 sm:p-4 flex flex-col"
      style={{ overscrollBehavior: 'none', touchAction: 'none' }}
    >
      <div className="max-w-2xl mx-auto w-full flex flex-col flex-1 gap-3 sm:gap-4">

        {/* Header */}
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg px-4 sm:px-5 py-3">
          <div className="flex justify-between items-center mb-3">
            {/* Player */}
            <div className="flex items-center gap-2 min-w-0">
              <Users className="text-purple-600 shrink-0" size={18} />
              <div className="min-w-0">
                <p className="text-xs text-gray-500 leading-none truncate">{currentTeam.name}</p>
                <p className="font-bold text-gray-800 leading-tight truncate">{currentPlayer.name}</p>
              </div>
            </div>

            {/* Timer + score */}
            <div className="flex items-center gap-4 sm:gap-5 shrink-0">
              <div className="flex items-center gap-1.5">
                <Timer size={18} style={{ color: timerColor }} />
                <span
                  className="text-xl sm:text-2xl font-black tabular-nums"
                  style={{ color: timerColor, transition: 'color 0.3s' }}
                >
                  {timeLeft}s
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Trophy className="text-yellow-500" size={18} />
                <span className="text-xl sm:text-2xl font-black text-gray-800 tabular-nums">{roundScore}</span>
              </div>
            </div>
          </div>

          {/* Timer bar */}
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${timerPct * 100}%`, background: timerColor }}
            />
          </div>

          {/* Team scores */}
          <div className="flex gap-2">
            {gameState.teams.map((team, index) => (
              <div
                key={team.id}
                className="flex-1 text-center py-1 rounded-xl text-xs font-semibold transition-all truncate px-1"
                style={
                  index === gameState.currentTeamIndex
                    ? { background: 'linear-gradient(135deg,#7c3aed,#db2777)', color: '#fff' }
                    : { background: '#f3f4f6', color: '#6b7280' }
                }
              >
                {team.name}: {team.score + (index === gameState.currentTeamIndex ? roundScore : 0)}
              </div>
            ))}
          </div>
        </div>

        {/* Card area */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {currentCard ? (
            <div className="w-full max-w-sm mx-auto">
              <SwipeCard
                key={`${currentCard.id ?? getCardWord()}-${currentCardIndex}`}
                word={getCardWord()}
                round={gameState.currentRound}
                roundName={getRoundName(gameState.currentRound)}
                onSuccess={handleCardSuccess}
                onSkip={handleCardSkip}
                disabled={!isPlaying}
              />
            </div>
          ) : (
            <div className="text-white text-center text-2xl font-bold">Plus de cartes !</div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center text-white/70 text-xs sm:text-sm pb-2">
          {gameState.deck.length} carte{gameState.deck.length > 1 ? 's' : ''} restante{gameState.deck.length > 1 ? 's' : ''}
          &nbsp;·&nbsp;
          <kbd className="bg-white/20 px-1.5 py-0.5 rounded text-xs">←→</kbd> clavier aussi
        </div>
      </div>
    </div>
  );
}