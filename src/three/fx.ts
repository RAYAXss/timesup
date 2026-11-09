export type Fx = 'confetti' | 'timeup';

const listeners = new Set<(fx: Fx) => void>();

export function emitFx(fx: Fx): void {
  listeners.forEach((cb) => cb(fx));
}

export function onFx(cb: (fx: Fx) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
