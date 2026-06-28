export const formatTime = (ms) => {
  if (ms <= 0) return "Ready";

  const total = Math.floor(ms / 1000);
  const min = Math.floor(total / 60);
  const sec = total % 60;

  return `${min}:${sec.toString().padStart(2, "0")}`;
};