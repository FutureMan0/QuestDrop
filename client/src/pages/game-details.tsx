import { useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { type QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Download, Star, Tag, Monitor, ArrowLeft, Trash2 } from "lucide-react";
import { type Game } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import GameDownloadDialog from "@/components/GameDownloadDialog";
import { isDiscoveryId } from "@/lib/utils";

function parseIgdbId(routeId: string): number | null {
  if (routeId.startsWith("igdb-")) {
    const parsed = Number(routeId.replace("igdb-", ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  const parsed = Number(routeId);
  return Number.isFinite(parsed) ? parsed : null;
}

async function fetchLocalGame(id: string): Promise<Game | null> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const response = await fetch(`/api/games/${id}`, { headers });
  if (!response.ok) return null;
  return response.json();
}

function findCachedSearchGame(queryClient: QueryClient, routeId: string): Game | null {
  const querySources: ReadonlyArray<ReadonlyArray<unknown>> = [
    ["/api/metadata/screenscraper/search", "global-search-screenscraper"],
    ["/api/igdb/search", "global-search-igdb"],
    ["/api/games/discover"],
  ];

  for (const queryKey of querySources) {
    const cachedEntries = queryClient.getQueriesData<Game[]>({ queryKey });
    for (const [, data] of cachedEntries) {
      if (!Array.isArray(data)) continue;
      const matched = data.find((game) => String(game.id) === routeId);
      if (matched) return matched;
    }
  }

  return null;
}

export default function GameDetailsPage() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute<{ id: string }>("/games/:id");
  const routeId = match ? params.id : "";
  const igdbId = parseIgdbId(routeId);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: game, isLoading } = useQuery<Game | null>({
    queryKey: ["/game-details", routeId],
    enabled: !!routeId,
    queryFn: async () => {
      const localGame = await fetchLocalGame(routeId);
      if (localGame) return localGame;
      const cachedSearchGame = findCachedSearchGame(queryClient, routeId);
      if (cachedSearchGame) return cachedSearchGame;
      if (!igdbId) return null;
      const response = await apiRequest("GET", `/api/igdb/game/${igdbId}`);
      return response.json();
    },
  });

  const removeGameMutation = useMutation({
    mutationFn: async (gameId: string) => {
      await apiRequest("DELETE", `/api/games/${gameId}`);
    },
    onSuccess: () => {
      toast({ description: "Game removed from collection" });
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      navigate("/library");
    },
    onError: () => {
      toast({ description: "Failed to remove game", variant: "destructive" });
    },
  });

  const releaseDateLabel = useMemo(() => {
    if (!game?.releaseDate) return "TBA";
    return new Date(game.releaseDate).toLocaleDateString();
  }, [game?.releaseDate]);

  if (isLoading) {
    return (
      <div className="h-full overflow-auto p-6">
        <div className="text-muted-foreground">Loading game details...</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="h-full overflow-auto p-6 space-y-4">
        <Button variant="outline" size="sm" onClick={() => navigate("/discover")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Discover
        </Button>
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold">Game not found</h2>
            <p className="mt-2 text-muted-foreground">The requested game could not be loaded.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <Button variant="outline" size="sm" onClick={() => navigate("/discover")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <section className="rounded-[24px] border border-white/10 bg-slate-950/70 p-5">
          <div className="grid gap-6 md:grid-cols-[220px_1fr]">
            <img
              src={game.coverUrl || "/placeholder-game-cover.jpg"}
              alt={`${game.title} cover`}
              className="w-full rounded-xl border border-white/15 object-cover"
              style={{ aspectRatio: "2 / 3" }}
            />

            <div className="space-y-4">
              <h1 className="text-3xl font-bold">{game.title}</h1>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="secondary">{game.status || "Unknown"}</Badge>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {releaseDateLabel}
                </span>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Star className="h-4 w-4" />
                  {game.rating ? `${game.rating}/10` : "N/A"}
                </span>
              </div>
              {game.summary && (
                <p className="text-muted-foreground leading-relaxed">{game.summary}</p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setDownloadOpen(true)} className="gap-2">
                  <Download className="h-4 w-4" />
                  Request
                </Button>
                {!isDiscoveryId(game.id) && (
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => removeGameMutation.mutate(game.id)}
                    disabled={removeGameMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                    {removeGameMutation.isPending ? "Removing..." : "Remove"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  Genres
                </h3>
                <div className="flex flex-wrap gap-2">
                  {game.genres?.length ? (
                    game.genres.map((genre) => (
                      <Badge key={genre} variant="outline">
                        {genre}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No genres available</span>
                  )}
                </div>
              </div>
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase text-muted-foreground">
                  <Monitor className="h-4 w-4" />
                  Platforms
                </h3>
                <div className="flex flex-wrap gap-2">
                  {game.platforms?.length ? (
                    game.platforms.map((platform) => (
                      <Badge key={platform} variant="outline">
                        {platform}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No platforms available</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">
                Screenshots
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {game.screenshots?.length ? (
                  game.screenshots.slice(0, 6).map((screenshot, idx) => (
                    <button
                      type="button"
                      key={`${screenshot}-${idx}`}
                      className="overflow-hidden rounded-lg border border-white/10"
                      onClick={() => setSelectedScreenshot(screenshot)}
                    >
                      <img
                        src={screenshot}
                        alt={`${game.title} screenshot ${idx + 1}`}
                        className="h-28 w-full object-cover"
                      />
                    </button>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No screenshots available</span>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      <GameDownloadDialog game={game} open={downloadOpen} onOpenChange={setDownloadOpen} />

      {selectedScreenshot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedScreenshot(null)}
        >
          <img
            src={selectedScreenshot}
            alt={`${game.title} screenshot`}
            className="max-h-[85vh] max-w-[95vw] rounded-xl object-contain"
          />
        </div>
      )}
    </div>
  );
}
