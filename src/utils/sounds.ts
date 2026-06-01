export const SOUND_ASSETS_URL = process.env.NEXT_PUBLIC_R2_ASSETS_URL;

const onSound = `${SOUND_ASSETS_URL}/sfx/on.ogg`;
const offSound = `${SOUND_ASSETS_URL}/sfx/off.ogg`;
const buttonSound = `${SOUND_ASSETS_URL}/sfx/button.ogg`;
const completeSound = `${SOUND_ASSETS_URL}/sfx/complete.ogg`;
const startSound = `${SOUND_ASSETS_URL}/sfx/start.ogg`;
const winSound = `${SOUND_ASSETS_URL}/sfx/win.ogg`;
const alertSound = `${SOUND_ASSETS_URL}/sfx/alert.ogg`;

/** Plays a one-shot SFX that survives React unmounts (e.g. after router.push). */
export function playSfx(src: string, volume = 1) {
  if (typeof window === 'undefined') return;
  const audio = new Audio(src);
  audio.volume = volume;
  void audio.play().catch(() => {});
}

export { onSound, offSound, buttonSound, completeSound, startSound, winSound, alertSound };