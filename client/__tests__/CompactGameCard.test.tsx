/** @vitest-environment jsdom */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CompactGameCard from "../src/components/CompactGameCard";
import React from "react";
import { type Game } from "@shared/schema";
import "@testing-library/jest-dom";
import { TooltipProvider } from "@/components/ui/tooltip";

// Mocks
const { mockInvalidateQueries, mockPrefetchQuery, mockMutateAsync, mockToast } = vi.hoisted(() => {
  return {
    mockInvalidateQueries: vi.fn(),
    mockPrefetchQuery: vi.fn().mockResolvedValue(undefined),
    mockMutateAsync: vi.fn(),
    mockToast: vi.fn(),
  };
});

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: mockInvalidateQueries,
      prefetchQuery: mockPrefetchQuery,
    }),
    useMutation: () => ({
      mutateAsync: mockMutateAsync,
      isPending: false,
    }),
    useQuery: () => ({
      data: undefined,
      isLoading: false,
      error: null,
    }),
  };
});

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock icons to avoid issues with rendering SVGs in jsdom
vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    Download: () => <div data-testid="icon-download" />,
    Info: () => <div data-testid="icon-info" />,
    Star: () => <div data-testid="icon-star" />,
    Calendar: () => <div data-testid="icon-calendar" />,
    Eye: () => <div data-testid="icon-eye" />,
    EyeOff: () => <div data-testid="icon-eye-off" />,
    Loader2: () => <div data-testid="icon-loader" />,
  };
});

const mockGame: Game = {
  id: "1",
  userId: "u1",
  title: "Test Game",
  coverUrl: "http://example.com/cover.jpg",
  status: "wanted",
  releaseDate: "2023-01-01",
  rating: 8.5,
  genres: ["Action", "Adventure"],
  summary: "Test summary",
  hidden: false,
  igdbId: null,
  platforms: null,
  publishers: null,
  developers: null,
  screenshots: null,
  originalReleaseDate: null,
  releaseStatus: "released",
  addedAt: null,
  completedAt: null,
};

describe("CompactGameCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(<TooltipProvider>{ui}</TooltipProvider>);
  };

  it("renders card and title", () => {
    renderWithProviders(<CompactGameCard game={mockGame} />);

    expect(screen.getByTestId("card-game-compact-1")).toBeInTheDocument();
    expect(screen.getByTestId("text-title-1")).toHaveTextContent("Test Game");
    expect(screen.getByRole("button", { name: "Mark Test Game as Owned" })).toBeInTheDocument();
  });

  it("prefetches IGDB game details on hover for discovery results", () => {
    const discoveryGame: Game = {
      ...mockGame,
      id: "igdb-99",
      igdbId: 99,
    };
    renderWithProviders(<CompactGameCard game={discoveryGame} isDiscovery />);

    const row = screen.getByTestId("card-game-compact-igdb-99");
    fireEvent.mouseEnter(row);
    expect(mockPrefetchQuery).toHaveBeenCalled();
  });

  it("calls onStatusChange when the status cycle button is clicked", () => {
    const onStatusChange = vi.fn();
    renderWithProviders(<CompactGameCard game={mockGame} onStatusChange={onStatusChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Mark Test Game as Owned" }));
    expect(onStatusChange).toHaveBeenCalledWith("1", "owned");
  });

  it("calls onViewDetails when cover is clicked", () => {
    const onViewDetails = vi.fn();
    renderWithProviders(<CompactGameCard game={mockGame} onViewDetails={onViewDetails} />);

    fireEvent.click(screen.getByTestId("img-cover-1"));
    expect(onViewDetails).toHaveBeenCalledWith("1");
  });
});
