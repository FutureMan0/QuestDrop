import { type Game } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export function igdbGameDetailsQueryKey(igdbId: number) {
  return ["/api/igdb/game", igdbId] as const;
}

export async function fetchIgdbGameById(igdbId: number): Promise<Game> {
  const response = await apiRequest("GET", `/api/igdb/game/${igdbId}`);
  return (await response.json()) as Game;
}
