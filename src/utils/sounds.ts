const onSound = '/sfx/on.ogg';
const offSound = '/sfx/off.ogg';
const buttonSound = '/sfx/button.ogg';
const completeSound = '/sfx/complete.ogg';
const startSound = '/sfx/start.ogg';
const winSound = '/sfx/win.ogg';
const alertSound = '/sfx/alert.ogg';

/** Plays a one-shot SFX that survives React unmounts (e.g. after router.push). */
export function playSfx(src: string, volume = 1) {
  if (typeof window === 'undefined') return;
  const audio = new Audio(src);
  audio.volume = volume;
  void audio.play().catch(() => {});
}

export { onSound, offSound, buttonSound, completeSound, startSound, winSound, alertSound };