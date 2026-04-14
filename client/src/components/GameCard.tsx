import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Check, Minus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type GameStatus } from "./StatusBadge";
import { type Game } from "@shared/schema";
import { useState, memo, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import GameDetailsModal from "./GameDetailsModal";
import GameDownloadDialog from "./GameDownloadDialog";
import { mapGameToInsertGame, isDiscoveryId } from "@/lib/utils";
import { apiRequest, ApiError } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getConsoleChip, getOwnershipStatusChip } from "@/lib/game-card-presenter";
import { getGameCardSummaryText } from "@/lib/game-card-summary";

interface GameCardProps {
  game: Game;
  onStatusChange?: (gameId: string, newStatus: GameStatus) => void;
  onViewDetails?: (gameId: string) => void;
  onTrackGame?: (game: Game) => void;
  onToggleHidden?: (gameId: string, hidden: boolean) => void;
  onRequestSearch?: (gameId: string) => void;
  onRemoveRequest?: (gameId: string) => void;
  isDiscovery?: boolean;
  isRequestView?: boolean;
  layout?: "grid" | "carousel";
}

const GameCard = ({
  game,
  onStatusChange,
  onViewDetails,
  onTrackGame: _onTrackGame,
  onToggleHidden: _onToggleHidden,
  onRequestSearch,
  onRemoveRequest,
  isDiscovery = false,
  isRequestView = false,
  layout = "grid",
}: GameCardProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
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

  const statusChip = getOwnershipStatusChip(game.status);
  const consoleChip = getConsoleChip(game);
  const isCarouselLayout = layout === "carousel";
  const StatusIcon = statusChip.icon === "check" ? Check : statusChip.icon === "minus" ? Minus : X;

  const summaryText = getGameCardSummaryText(game);
  const alreadyRequested = !isDiscoveryId(game.id) && game.status === "wanted";

  const handleDetailsOpen = () => {
    setDetailsOpen(true);
    onViewDetails?.(game.id);
  };

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("[data-card-action]")) return;
    handleDetailsOpen();
  };

  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
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
    if (addGameMutation.isPending || setWantedMutation.isPending) return;

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

  const requestBusy = addGameMutation.isPending || setWantedMutation.isPending;

  return (
    <Card
      ref={cardRef}
      role="button"
      tabIndex={0}
      aria-label={`${game.title}, details`}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      className={`group mx-auto flex h-full w-full cursor-pointer flex-col overflow-hidden border border-border/80 bg-card/95 shadow-md shadow-black/8 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg hover:shadow-black/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 dark:border-white/10 dark:bg-slate-950/90 dark:shadow-[0_18px_34px_-26px_rgba(0,0,0,0.92)] dark:hover:border-white/22 dark:hover:shadow-[0_24px_44px_-28px_rgba(0,0,0,0.95)] ${
        isCarouselLayout ? "max-w-[198px] rounded-[20px]" : "max-w-[198px] rounded-[16px]"
      } ${game.hidden ? "opacity-60 grayscale" : ""}`}
      data-testid={`card-game-${game.id}`}
    >
      <div className="relative overflow-hidden rounded-[inherit]">
        <img
          src={game.coverUrl || "/placeholder-game-cover.jpg"}
          alt=""
          className="aspect-[11/16] w-full object-cover"
          loading="lazy"
          data-testid={`img-cover-${game.id}`}
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-2">
          <Badge
            variant="outline"
            className={`pointer-events-none h-7 rounded-full px-2.5 text-[10px] font-semibold uppercase tracking-normal shadow-sm backdrop-blur-sm ${consoleChip.className}`}
          >
            {consoleChip.label}
          </Badge>
          {statusChip.visible && (
            <Badge
              variant="outline"
              className={`pointer-events-none h-7 w-7 rounded-full border-0 bg-white/95 p-0 text-[10px] shadow-md ring-1.5 backdrop-blur-sm flex items-center justify-center ${statusChip.className}`}
            >
              <StatusIcon className="h-4 w-4" strokeWidth={2.9} />
            </Badge>
          )}
        </div>

        <div
          className={`pointer-events-none absolute inset-0 flex flex-col justify-end opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100`}
        >
          <div className="w-full bg-gradient-to-t from-background via-background/95 to-background/15 px-2.5 pb-2.5 pt-12 dark:from-slate-950 dark:via-slate-950/95 dark:to-slate-950/20">
            <h3
              className="line-clamp-2 text-left text-[13px] font-semibold leading-tight text-foreground dark:text-white"
              data-testid={`text-title-${game.id}`}
            >
              {game.title}
            </h3>
            <p className="mb-2 mt-1 line-clamp-3 text-left text-[11px] leading-snug text-muted-foreground dark:text-white/80">
              {summaryText || "No description available."}
            </p>

            {isRequestView ? (
              <div className="flex gap-2">
                <Button
                  data-card-action
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 shrink-0 bg-white/95 text-slate-900 hover:bg-white"
                  onClick={handleRequestSearch}
                  disabled={addGameMutation.isPending}
                  data-testid={`button-request-search-${game.id}`}
                  aria-label={`Open interactive search for ${game.title}`}
                >
                  {addGameMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  data-card-action
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={handleRemoveRequest}
                  data-testid={`button-request-remove-${game.id}`}
                  aria-label={`Remove ${game.title} from requests`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                data-card-action
                type="button"
                size="sm"
                variant="secondary"
                className="h-8 w-full border border-violet-200/40 bg-violet-400/90 text-xs font-semibold text-violet-950 hover:bg-violet-300"
                onClick={handleRequestClick}
                disabled={requestBusy || alreadyRequested}
                data-testid={isDiscovery ? `button-track-${game.id}` : `button-request-${game.id}`}
              >
                {requestBusy ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />…
                  </>
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
    </Card>
  );
};

export default memo(GameCard);
