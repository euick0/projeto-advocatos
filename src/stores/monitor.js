import { writable } from "svelte/store";

export const paused = writable(false);
export const tick = writable(0);

let intervalId = null;

export const startTicker = () => {
  if (intervalId) return;
  intervalId = setInterval(() => tick.update((t) => t + 1), 1000);
};

export const stopTicker = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

paused.subscribe((p) => {
  if (p) stopTicker();
  else startTicker();
});
