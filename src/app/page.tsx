import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import { Editor } from "./editor";
import type { Cv, History } from "./types";

// Read at request time rather than imported, so saving doesn't trigger a hot
// reload. Edited cv.json by hand? Reload the page.
async function loadCv(): Promise<Cv> {
  return JSON.parse(await readFile(path.join(process.cwd(), "cv.json"), "utf8"));
}

// No history file yet (or an unreadable one)? Start with an empty history.
async function loadHistory(): Promise<History> {
  try {
    return JSON.parse(await readFile(path.join(process.cwd(), "cv.history.json"), "utf8"));
  } catch {
    return { past: [], future: [] };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: `${(await loadCv()).name} — CV` };
}

export default async function Page() {
  return <Editor initial={await loadCv()} history={await loadHistory()} canSave={process.env.NODE_ENV === "development"} />;
}
