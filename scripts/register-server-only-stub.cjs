/**
 * No-op stub for `server-only` when running Node CLI scripts (tsx workers/cron).
 * Next.js uses this package to block client imports; it throws outside the bundler.
 */
const Module = require("module");

const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (request === "server-only") {
    return {};
  }
  return originalLoad.call(this, request, parent, isMain);
};
