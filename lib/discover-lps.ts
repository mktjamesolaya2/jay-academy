import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { landingPages } from "./landing-pages";

const IGNORED = new Set([
  "portal",
  "node_modules",
  ".git",
  ".next",
  ".vscode",
  ".idea",
  "dist",
  "build",
  "out",
]);

export async function discoverFolders(): Promise<string[]> {
  const root = path.resolve(process.cwd(), "..");

  let entries;
  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch {
    return [];
  }

  const registered = new Set(
    landingPages.map((lp) => lp.localPath.split(/[/\\]/)[0])
  );

  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter(
      (name) =>
        !name.startsWith(".") &&
        !IGNORED.has(name) &&
        !registered.has(name)
    )
    .sort();
}
