/** @vitest-environment jsdom */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CompactGameCard from "../src/components/CompactGameCard";
import React from "react";
import { type Game } from "@shared/schema";
import "@testing-library/jest-dom";
import { TooltipProvider } from "@/components/ui/tooltip";

// Mocks
const { mockInvalidateQueries, mockMutateAsync, mockToast } = vi.hoisted(() => {
  return {
    mockInvalidateQueries: vi.fn(),
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

describe("CompactGameCard", () => {
  const mockGame: Game = {
    id: "1",
    title: "Test Game",
    coverUrl: "http://example.com/cover.jpg",
    status: "wanted",
    releaseDate: "2023-01-01",
    rating: 8.5,
    genres: ["Action", "Adventure"],
    summary: "Test summary",
    releaseStatus: "released",
    hidden: false,
    folderName: "Test Game",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

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
    expect(screen.getByTestId("button-request-1")).toHaveTextContent("Request");
  });

  it("shows fallback summary text when summary is empty", () => {
    const gameWithoutSummary = { ...mockGame, summary: "" };
    renderWithProviders(<CompactGameCard game={gameWithoutSummary} />);
    expect(screen.getByText("No description available.")).toBeInTheDocument();
  });

  it("calls onStatusChange with wanted when request button is clicked", () => {
    const onStatusChange = vi.fn();
    renderWithProviders(
      <CompactGameCard game={{ ...mockGame, status: "owned" }} onStatusChange={onStatusChange} />
    );

    const button = screen.getByTestId("button-request-1");
    fireEvent.click(button);

    expect(onStatusChange).toHaveBeenCalledWith("1", "wanted");
  });

  it("calls onViewDetails when cover is clicked", () => {
    const onViewDetails = vi.fn();
    renderWithProviders(<CompactGameCard game={mockGame} onViewDetails={onViewDetails} />);

    const cover = screen.getByRole("button", { name: `${mockGame.title}, details` });
    fireEvent.click(cover);

    expect(onViewDetails).toHaveBeenCalledWith("1");
  });

  it("disables request button when game is already requested", () => {
    renderWithProviders(<CompactGameCard game={mockGame} />);
    const button = screen.getByTestId("button-request-1");
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Requested");
  });
});
