import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookmarkCheck, LayoutGrid, List, Settings2 } from "lucide-react";
import { type Game } from "@shared/schema";
import { type GameStatus } from "@/components/StatusBadge";
import GameGrid from "@/components/GameGrid";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isRequestStatus } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function RequestsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    return (localStorage.getItem("requestsViewMode") as "grid" | "list") || "grid";
  });
  const [listDensity, setListDensity] = useState<"comfortable" | "compact" | "ultra-compact">(
    () => {
      return (
        (localStorage.getItem("requestsListDensity") as
          | "comfortable"
          | "compact"
          | "ultra-compact") || "comfortable"
      );
    }
  );

  useEffect(() => {
    localStorage.setItem("requestsViewMode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem("requestsListDensity", listDensity);
  }, [listDensity]);

  const { data: games = [], isLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });

  const requestGames = useMemo(() => {
    return games.filter((game) => isRequestStatus(game.status));
  }, [games]);

  const statusMutation = useMutation({
    mutationFn: async ({ gameId, status }: { gameId: string; status: GameStatus }) => {
      const response = await apiRequest("PATCH", `/api/games/${gameId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/sections"] });
      toast({ description: "Request status updated" });
    },
    onError: () => {
      toast({ description: "Failed to update request status", variant: "destructive" });
    },
  });

  const hiddenMutation = useMutation({
    mutationFn: async ({ gameId, hidden }: { gameId: string; hidden: boolean }) => {
      const response = await apiRequest("PATCH", `/api/games/${gameId}/hidden`, { hidden });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/sections"] });
    },
    onError: () => {
      toast({ description: "Failed to update visibility.", variant: "destructive" });
    },
  });

  return (
    <div className="h-full overflow-auto p-6">
      <div className="sticky top-0 z-30 -mx-2 mb-6 rounded-xl px-2 py-2 backdrop-blur-md">
        <div className="glass-surface rounded-xl px-4 py-3 md:px-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Requests</h1>
              <p className="text-muted-foreground">Wanted titles and active request queue</p>
            </div>
            <div className="flex items-center gap-2">
              {viewMode === "list" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1">
                      <Settings2 className="h-3.5 w-3.5" />
                      <span className="sr-only sm:not-sr-only sm:inline-block">
                        {listDensity === "comfortable"
                          ? "Comfortable"
                          : listDensity === "compact"
                            ? "Compact"
                            : "Ultra-compact"}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Row Density</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setListDensity("comfortable")}>
                      Comfortable
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setListDensity("compact")}>
                      Compact
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setListDensity("ultra-compact")}>
                      Ultra-compact
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={(value) => value && setViewMode(value as "grid" | "list")}
              >
                <ToggleGroupItem value="grid" aria-label="Grid View">
                  <LayoutGrid className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="List View">
                  <List className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </div>
      </div>

      {requestGames.length === 0 && !isLoading ? (
        <EmptyState
          icon={BookmarkCheck}
          title="No active requests"
          description="When you request games from Discover, they appear here."
          actionLabel="Discover Games"
          actionLink="/discover"
        />
      ) : (
        <GameGrid
          games={requestGames}
          onStatusChange={(gameId, status) => statusMutation.mutate({ gameId, status })}
          onToggleHidden={(gameId, hidden) => hiddenMutation.mutate({ gameId, hidden })}
          isLoading={isLoading}
          isRequestView
          detailsFromPath="/requests"
          viewMode={viewMode}
          density={listDensity}
        />
      )}
    </div>
  );
}
