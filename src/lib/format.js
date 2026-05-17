export const fmtEuro = (n, decimals = 2) =>
  Number(n).toLocaleString("pt-PT", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }) + " €";

export const fmtNumber = (n, decimals = 1) =>
  Number(n).toLocaleString("pt-PT", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

export const fmtSecondsAsHHMMSS = (s) => {
  s = Math.max(0, Math.floor(Number(s) || 0));
  const h = Math.floor(s / 3600).toString().padStart(2, "0");
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${h}:${m}:${sec}`;
};

export const fmtSecondsAsHM = (s) => {
  s = Math.max(0, Math.floor(Number(s) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
};
