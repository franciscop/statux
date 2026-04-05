// Suppress jsdom unimplemented errors that don't affect test correctness
const originalConsoleError = console.error.bind(console);
console.error = (...args: any[]) => {
  const msg = String(args[0]?.message ?? args[0] ?? "");
  if (msg.includes("Not implemented")) return;
  originalConsoleError(...args);
};
