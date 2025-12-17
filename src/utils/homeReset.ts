export const HOME_RESET_EVENT = 'vk:home-reset';

export function dispatchHomeReset(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(HOME_RESET_EVENT));
}

export function onHomeReset(handler: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const listener = () => {
    handler();
  };

  window.addEventListener(HOME_RESET_EVENT, listener);
  return () => {
    window.removeEventListener(HOME_RESET_EVENT, listener);
  };
}
