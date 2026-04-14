import React, { memo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Check, Minus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type GameStatus } from "./StatusBadge";
import { type Game } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import GameDetailsModal from "./GameDetailsModal";
import GameDownloadDialog from "./GameDownloadDialog";
import { mapGameToInsertGame, isDiscoveryId, cn } from "@/lib/utils";
import { apiRequest, ApiError } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getConsoleChip, getOwnershipStatusChip } from "@/lib/game-card-presenter";
import { getGameCardSummaryText } from "@/lib/game-card-summary";

interface CompactGameCardProps {
  game: Game;
  onStatusChange?: (gameId: string, newStatus: GameStatus) => void;
  onViewDetails?: (gameId: string) => void;
  onToggleHidden?: (gameId: string, hidden: boolean) => void;
  onRequestSearch?: (gameId: string) => void;
  onRemoveRequest?: (gameId: string) => void;
  isDiscovery?: boolean;
  isRequestView?: boolean;
  density?: "comfortable" | "compact" | "ultra-compact";
}

const CompactGameCard = ({
  game,
  onStatusChange,
  onViewDetails,
  onToggleHidden: _onToggleHidden,
  onRequestSearch,
  onRemoveRequest,
  isDiscovery = false,
  isRequestView = false,
  density = "comfortable",
}: CompactGameCardProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const statusChip = getOwnershipStatusChip(game.status);
  const consoleChip = getConsoleChip(game);
  const StatusIcon = statusChip.icon === "check" ? Check : statusChip.icon === "minus" ? Minus : X;

  const [resolvedGame, setResolvedGame] = useState<Game>(game);

  useEffect(() => {
    setResolvedGame(game);
  }, [game]);

  const addGameMutation = useMutation<Game, Error, Game>({
    mutationFn: async (g: Game) => {
      const gameData = mapGameToInsertGame(g);

      try {
        const response = await apiRequest("POST", "/api/games", {
          ...gameData,
          status: "wanted",
        });
        return response.json() as Promise<Game>;
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
          const data = error.data as Record<string, unknown>;
          if (data?.game) {
            return data.game as Game;
          }
          return g;
        }
        throw error;
      }
    },
    onSuccess: (newGame) => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/sections"] });
      setResolvedGame(newGame);
    },
  });

  const setWantedMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/games/${game.id}/status`, {
        status: "wanted",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/sections"] });
      toast({ description: "Added to requests" });
    },
    onError: () => {
      toast({ description: "Could not update status", variant: "destructive" });
    },
  });

  const summaryText = getGameCardSummaryText(game);
  const alreadyRequested = !isDiscoveryId(game.id) && game.status === "wanted";
  const requestBusy = addGameMutation.isPending || setWantedMutation.isPending;

  const handleDetailsOpen = () => {
    setDetailsOpen(true);
    onViewDetails?.(game.id);
  };

  const coverWidth =
    density === "comfortable" ? "w-[92px]" : density === "compact" ? "w-[72px]" : "w-[60px]";

  const handleCoverClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("[data-card-action]")) return;
    handleDetailsOpen();
  };

  const handleCoverKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    handleDetailsOpen();
  };

  const handleDownloadClick = async () => {
    if (isDiscoveryId(resolvedGame.id)) {
      try {
        const gameInLibrary = await addGameMutation.mutateAsync(resolvedGame);
        setResolvedGame(gameInLibrary);
        setDownloadOpen(true);
      } catch {
        toast({
          description: "Failed to add game to library before downloading",
          variant: "destructive",
        });
      }
    } else {
      setDownloadOpen(true);
    }
  };

  const handleRequestSearch = async (e: React.MouseEvent) => {
    e.stopPropagation();
    onRequestSearch?.(game.id);
    await handleDownloadClick();
  };

  const handleRemoveRequest = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemoveRequest?.(game.id);
  };

  const handleRequestClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (requestBusy) return;

    if (alreadyRequested) {
      toast({ description: "Already in your requests" });
      return;
    }

    if (isDiscoveryId(resolvedGame.id)) {
      try {
        await addGameMutation.mutateAsync(resolvedGame);
        toast({ description: "Added to requests" });
      } catch {
        toast({ description: "Could not add game", variant: "destructive" });
      }
      return;
    }

    if (onStatusChange) {
      onStatusChange(game.id, "wanted");
    } else {
      setWantedMutation.mutate();
    }
  };

  return (
    <>
      <div
        className={cn(
          "group/list relative flex items-stretch transition-colors",
          density === "comfortable" &&
            "gap-3 rounded-[16px] border border-border/80 bg-card/95 p-2.5 text-card-foreground shadow-sm dark:border-white/10 dark:bg-slate-950/85",
          density === "compact" &&
            "gap-3 border-b border-border/70 bg-transparent py-2 pl-2 pr-3 dark:border-slate-700/50",
          density === "ultra-compact" &&
            "gap-2 border-b border-border/70 bg-transparent py-1.5 pl-2 pr-2 dark:border-slate-700/50",
          game.hidden && "opacity-60 grayscale"
        )}
        data-testid={`card-game-compact-${game.id}`}
      >
        <div
          role="button"
          tabIndex={0}
          aria-label={`${game.title}, details`}
          className={cn(
            "relative shrink-0 cursor-pointer overflow-hidden rounded-xl bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
            coverWidth
          )}
          onClick={handleCoverClick}
          onKeyDown={handleCoverKeyDown}
        >
          <div className="aspect-[11/16] w-full">
            <img
              src={game.coverUrl || "/placeholder-game-cover.jpg"}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
              data-testid={`img-cover-${game.id}`}
            />
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-1.5">
            <Badge
              variant="outline"
              className={cn(
                "max-w-[78%] truncate rounded-full font-semibold uppercase shadow-sm backdrop-blur-sm",
                density === "comfortable"
                  ? `h-[24px] px-2 text-[9px] ${consoleChip.className}`
                  : `h-[22px] px-1.5 text-[8px] ${consoleChip.className}`
              )}
            >
              {consoleChip.label}
            </Badge>
            {statusChip.visible && (
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full border-0 bg-white/95 p-0 shadow-md ring-1.5 backdrop-blur-sm flex items-center justify-center",
                  density === "comfortable"
                    ? `h-[24px] w-[24px] ${statusChip.className}`
                    : `h-[22px] w-[22px] ${statusChip.className}`
                )}
              >
                <StatusIcon
                  className={density === "comfortable" ? "h-3 w-3" : "h-2.5 w-2.5"}
                  strokeWidth={2.9}
                />
              </Badge>
            )}
          </div>

          <div
            className={cn(
              "pointer-events-none absolute inset-0 flex flex-col justify-end opacity-0 transition-opacity duration-200",
              "group-hover/list:pointer-events-auto group-hover/list:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
            )}
          >
            <div className="w-full bg-gradient-to-t from-background via-background/95 to-transparent px-1.5 pb-1.5 pt-8 dark:from-slate-950 dark:via-slate-950/95">
              <h3
                className={cn(
                  "line-clamp-2 text-left font-semibold leading-tight text-foreground dark:text-white",
                  density === "comfortable" ? "text-xs" : "text-[10px]"
                )}
                data-testid={`text-title-${game.id}`}
              >
                {game.title}
              </h3>
              <p
                className={cn(
                  "mb-1.5 mt-0.5 line-clamp-2 text-left text-muted-foreground dark:text-white/80",
                  density === "comfortable" ? "text-[10px] leading-snug" : "text-[9px] leading-snug"
                )}
              >
                {summaryText || "No description available."}
              </p>

              {isRequestView ? (
                <div className="flex gap-1">
                  <Button
                    data-card-action
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="h-7 w-7 bg-white/95 text-slate-900 hover:bg-white"
                    onClick={handleRequestSearch}
                    disabled={addGameMutation.isPending}
                    aria-label={`Open interactive search for ${game.title}`}
                  >
                    {addGameMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    data-card-action
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleRemoveRequest}
                    aria-label={`Remove ${game.title} from requests`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  data-card-action
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-7 w-full border border-violet-200/40 bg-violet-400/90 px-2 text-[10px] font-semibold text-violet-950 hover:bg-violet-300"
                  onClick={handleRequestClick}
                  disabled={requestBusy || alreadyRequested}
                  data-testid={
                    isDiscovery ? `button-track-${game.id}` : `button-request-${game.id}`
                  }
                >
                  {requestBusy ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : alreadyRequested ? (
                    "Requested"
                  ) : (
                    "Request"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1" aria-hidden />
      </div>

      {detailsOpen && (
        <GameDetailsModal game={resolvedGame} open={detailsOpen} onOpenChange={setDetailsOpen} />
      )}

      {downloadOpen && (
        <GameDownloadDialog
          game={resolvedGame}
          open={downloadOpen}
          onOpenChange={setDownloadOpen}
        />
      )}
    </>
  );
};

export default memo(CompactGameCard);
