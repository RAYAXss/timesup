import { useState, useEffect, useRef } from 'react';
import { Timer, Trophy, Users, X } from 'lucide-react';
import { GameSettings, Team, GameState } from '../types/game';
import { cardDatabase } from '../data/cards';
import { nextTurn } from '../game/teams';
import { emitFx } from '../three/fx';
import { soundEngine } from '../game/sound';
import { CURRENT_KEY, save } from '../game/storage';

interface GameScreenProps {
  settings: GameSettings;
  teams: Team[];
  initialState?: GameState; // resumed game from storage
  onGameEnd: (finalTeams: Team[], roundScores: number[][]) => void;
  onQuit: () => void;
}

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
    <div className="flex flex-col gap-4 w-full">
      {/* Card */}
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
          <span className="text-xs font-semibold tracking-widest uppercase text-blue-600 bg-sky-50 px-4 py-1.5 rounded-full mb-6 sm:mb-8">
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

      {/* Action buttons */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => !disabled && flyOut('left', onSkip)}
          disabled={disabled}
          className="flex-1 max-w-[160px] bg-gradient-to-br from-red-500 to-red-600 text-white py-4 px-6 rounded-2xl font-bold text-lg hover:shadow-xl active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ✗ Passer
        </button>
        <button
          onClick={() => !disabled && flyOut('right', onSuccess)}
          disabled={disabled}
          className="flex-1 max-w-[160px] bg-gradient-to-br from-green-500 to-green-600 text-white py-4 px-6 rounded-2xl font-bold text-lg hover:shadow-xl active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ✓ Trouvé
        </button>
      </div>
    </div>
  );
}

// ─── GameScreen ───────────────────────────────────────────────────────────────

export default function GameScreen({ settings, teams, initialState, onGameEnd, onQuit }: GameScreenProps) {
  const [gameState, setGameState] = useState<GameState>(() => {
    if (initialState) return initialState;
    const totalPlayers = teams.reduce((n, t) => n + t.players.length, 0);
    const deckSize = totalPlayers * 10;
    const shuffledCards = [...cardDatabase]
      .sort(() => Math.random() - 0.5)
      .slice(0, deckSize);

    return {
      teams: teams.map((team) => ({ ...team, score: 0 })),
      currentTeamIndex: 0,
      playerIdx: teams.map(() => 0),
      currentRound: 1,
      deck: shuffledCards,
      usedCards: [],
      roundScores: [[], [], []],
    };
  });

  const [showPlayerModal, setShowPlayerModal] = useState(true);
  const [isNewRound, setIsNewRound] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(settings.timePerPlayer);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [roundScore, setRoundScore] = useState(0);
  // while the quit popup is open the countdown and timer are frozen
  const [confirmQuit, setConfirmQuit] = useState(false);

  const currentTeam = gameState.teams[gameState.currentTeamIndex];
  const currentPlayer = currentTeam.players[gameState.playerIdx[gameState.currentTeamIndex]];
  const currentCard = gameState.deck[currentCardIndex];

  // save at each turn start: a reload mid-turn replays that turn, so no half-counted points
  useEffect(() => {
    if (showPlayerModal) save(CURRENT_KEY, { settings, state: gameState });
  }, [showPlayerModal, gameState, settings]);

  // browser/phone back button: stay on /partie and ask before quitting
  useEffect(() => {
    const onBack = () => {
      history.pushState(null, '', '/partie');
      setConfirmQuit(true);
    };
    window.addEventListener('popstate', onBack);
    return () => window.removeEventListener('popstate', onBack);
  }, []);

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
    if (countdown === null || confirmQuit) return;
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    } else {
      setCountdown(null);
      setIsPlaying(true);
    }
  }, [countdown, confirmQuit]);

  // timer + tick sound in last 10 seconds
  useEffect(() => {
    if (!isPlaying || confirmQuit) return;
    if (timeLeft > 0) {
      if (timeLeft <= 10) soundEngine.playTick();
      const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
      return () => clearTimeout(t);
    } else {
      soundEngine.playTimeUp();
      emitFx('timeup');
      handleTurnEnd();
    }
  }, [isPlaying, timeLeft, confirmQuit]);

  const handleReady = () => {
    setShowPlayerModal(false);
    setCountdown(3);
  };

  const handleTurnEnd = (overrideScore?: number, overrideState?: typeof gameState) => {
    setIsPlaying(false);

    const score = overrideScore ?? roundScore;
    const state = overrideState ?? gameState;

    // ── Si le temps est écoulé, on remet la carte courante à la fin du deck ──
    const currentCardStillInDeck = state.deck[currentCardIndex];
    let finalDeck = [...state.deck];
    if (currentCardStillInDeck && overrideScore === undefined) {
      // Retire la carte de sa position actuelle et la met à la fin
      finalDeck.splice(currentCardIndex, 1);
      finalDeck.push(currentCardStillInDeck);
    }

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

    const { teamIndex: nextTeamIndex, playerIdx: nextPlayerIdx } = nextTurn(
      state.currentTeamIndex,
      state.playerIdx,
      state.teams
    );

    if (finalDeck.length === 0) {
      if (state.currentRound < 3) {
        const newDeck = [...state.usedCards].sort(() => Math.random() - 0.5);
        setGameState({
          ...state,
          teams: updatedTeams,
          currentTeamIndex: nextTeamIndex,
          playerIdx: nextPlayerIdx,
          currentRound: state.currentRound + 1,
          deck: newDeck,
          usedCards: [],
          roundScores: updatedRoundScores,
        });
        setCurrentCardIndex(0);
        setRoundScore(0);
        setTimeLeft(settings.timePerPlayer);
        setIsNewRound(true);
        setShowPlayerModal(true);
      } else {
        onGameEnd(updatedTeams, updatedRoundScores);
      }
    } else {
      setGameState({
        ...state,
        teams: updatedTeams,
        currentTeamIndex: nextTeamIndex,
        playerIdx: nextPlayerIdx,
        deck: finalDeck,
        roundScores: updatedRoundScores,
      });
      setCurrentCardIndex(0);
      setRoundScore(0);
      setTimeLeft(settings.timePerPlayer);
      setIsNewRound(false);
      setShowPlayerModal(true);
    }
  };

  const handleCardSuccess = () => {
    if (!isPlaying || confirmQuit) return;
    soundEngine.playSuccess(); // 🎵 arpège montant
    emitFx('confetti');

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
    if (!isPlaying || confirmQuit) return;
    soundEngine.playSkip(); // 🎵 woosh descendant

    const newDeck = [...gameState.deck];
    const [card] = newDeck.splice(currentCardIndex, 1);
    newDeck.push(card);

    setGameState({ ...gameState, deck: newDeck });
  };

  const getCardWord = () => {
    if (!currentCard) return '';
    return currentCard[settings.difficulty] ?? '';
  };

  const getRoundName = (round: number) => getRound(round).short;

  const timerColor = timeLeft <= 10 ? '#ef4444' : timeLeft <= 20 ? '#f97316' : '#2563eb';
  const timerPct = timeLeft / settings.timePerPlayer;

  const renderBody = () => {
  // ── Player modal ──
  if (showPlayerModal) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-yellow-400 to-blue-600 rounded-full mx-auto flex items-center justify-center mb-4">
              <Users className="text-white" size={36} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">À ton tour !</h2>
            <p className="text-lg sm:text-xl text-blue-600 font-semibold mb-1">{currentPlayer.name}</p>
            <p className="text-gray-600">{currentTeam.name}</p>
          </div>
          <div className="bg-gradient-to-r from-yellow-50 to-sky-50 rounded-2xl p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">Round {gameState.currentRound}/3</p>
            <p className="text-lg font-semibold text-gray-800">{getRoundName(gameState.currentRound)}</p>
            <p className="text-sm text-gray-600 mt-2">{gameState.deck.length} cartes restantes</p>
          </div>
          <button
            onClick={handleReady}
            className="w-full bg-gradient-to-r from-yellow-400 via-sky-400 to-blue-600 text-white py-4 rounded-2xl font-bold text-xl hover:shadow-2xl active:scale-95 transition-all duration-200"
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-9xl font-bold animate-pulse">{countdown}</div>
      </div>
    );
  }

  // ── Game ──
  return (
    <div
      className="min-h-screen p-3 sm:p-4 pt-14 sm:pt-14 flex flex-col"
      style={{ overscrollBehavior: 'none', touchAction: 'none' }}
    >
      <div className="max-w-2xl mx-auto w-full flex flex-col flex-1 gap-3 sm:gap-4">

        {/* Header */}
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg px-4 sm:px-5 py-3">
          <div className="flex justify-between items-center mb-3">
            {/* Player */}
            <div className="flex items-center gap-2 min-w-0">
              <Users className="text-blue-500 shrink-0" size={18} />
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
                <Trophy className="text-yellow-400" size={18} />
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
                    ? { background: 'linear-gradient(135deg,#facc15,#38bdf8,#2563eb)', color: '#fff' }
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
                disabled={!isPlaying || confirmQuit}
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
  };

  return (
    <>
      <button
        onClick={() => setConfirmQuit(true)}
        aria-label="Quitter la partie"
        className="fixed top-3 left-3 z-40 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-gray-600 hover:text-red-500 active:scale-95 transition-all"
      >
        <X size={22} />
      </button>

      {confirmQuit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={() => setConfirmQuit(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="quit-title"
            className="sheet-up bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-5xl mb-3">⏸️</div>
            <h2 id="quit-title" className="text-xl font-black text-gray-800 mb-2">
              Êtes-vous sûr de vouloir quitter la partie ?
            </h2>
            <p className="text-sm text-gray-500 mb-6">Les scores de cette partie seront perdus.</p>
            <div className="flex gap-3">
              <button
                autoFocus
                onClick={() => setConfirmQuit(false)}
                className="flex-1 py-3 rounded-2xl font-bold bg-gray-100 text-gray-700 active:scale-95 transition-transform"
              >
                Annuler
              </button>
              <button
                onClick={onQuit}
                className="flex-1 py-3 rounded-2xl font-bold bg-gradient-to-r from-red-500 to-red-600 text-white active:scale-95 transition-transform"
              >
                Quitter
              </button>
            </div>
          </div>
        </div>
      )}

      {renderBody()}
    </>
  );
}
