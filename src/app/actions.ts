"use server";

import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { Cv, History } from "./types";

// Writes the CV back to cv.json, and its undo history to cv.history.json so it
// survives a reload. Server Functions are reachable by any POST, so this only
// works under `npm run dev` on your own machine.
export async function saveCv(cv: Cv, history: History) {
  if (process.env.NODE_ENV !== "development") throw new Error("Saving is only available in development");
  if (typeof cv?.name !== "string" || !Array.isArray(cv.sections) || !Array.isArray(cv.address)) throw new Error("Not a CV");
  if (!Array.isArray(history?.past) || !Array.isArray(history.future)) throw new Error("Not a history");
  await Promise.all([
    writeFile(path.join(process.cwd(), "cv.json"), JSON.stringify(cv, null, 2) + "\n"),
    writeFile(path.join(process.cwd(), "cv.history.json"), JSON.stringify(history) + "\n"),
  ]);
}
