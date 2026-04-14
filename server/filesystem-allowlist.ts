import fs from "fs";
import path from "path";

/**
 * Extra directory trees the authenticated filesystem browser may list (Docker volume mounts).
 * Comma- or semicolon-separated absolute paths, e.g. `/games,/downloads`.
 */
export function getFilesystemAllowedRootDirs(): string[] {
  const roots: string[] = [];

  const add = (raw: string) => {
    const normalized = path.normalize(raw.trim());
    if (!normalized) return;
    try {
      const rp = fs.realpathSync(normalized);
      if (!roots.includes(rp)) roots.push(rp);
    } catch {
      /* mount may not exist yet */
    }
  };

  add(process.cwd());

  const extra = process.env.QUESTARR_FILESYSTEM_EXTRA_ROOTS ?? "";
  for (const segment of extra.split(/[,;]/)) {
    if (segment.trim()) add(segment);
  }

  return roots;
}

export function pathIsUnderAllowedRoots(resolvedPath: string, roots: string[]): boolean {
  const normalized = path.normalize(resolvedPath);
  for (const root of roots) {
    const rootWithSep = root.endsWith(path.sep) ? root : root + path.sep;
    if (normalized === root || normalized.startsWith(rootWithSep)) {
      return true;
    }
  }
  return false;
}
