import { type Game } from "@shared/schema";

/** Plain-text snippet for card overlays (strips simple HTML tags from IGDB summaries). */
export function getGameCardSummaryText(game: Game, maxLen = 220): string {
  const raw = game.summary ?? "";
  const plain = raw
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!plain) return "";
  if (plain.length <= maxLen) return plain;
  return `${plain.slice(0, maxLen).trim()}…`;
}
