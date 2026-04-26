import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import Header from "@/components/Header";
import GlobalSearchResults from "@/components/GlobalSearchResults";
import { useBackgroundNotifications } from "@/hooks/use-background-notifications";
import { AuthProvider } from "@/lib/auth";
import { Suspense, lazy, useEffect, useState } from "react";
import LoadingFallback from "@/components/LoadingFallback";
import { ThemeProvider } from "next-themes";
import { BRAND, EVENTS } from "@/lib/brand";

// ⚡ Bolt: Code splitting with React.lazy
// This reduces the initial bundle size by loading pages only when needed.
const Dashboard = lazy(() => import("@/components/Dashboard"));
const DiscoverPage = lazy(() => import("@/pages/discover"));
const SearchPage = lazy(() => import("@/pages/search"));
const DownloadsPage = lazy(() => import("@/pages/downloads"));
const RequestsPage = lazy(() => import("@/pages/requests"));
const IndexersPage = lazy(() => import("@/pages/indexers"));
const DownloadersPage = lazy(() => import("@/pages/downloaders"));
const SettingsPage = lazy(() => import("@/pages/settings"));
const NotFound = lazy(() => import("@/pages/not-found"));
const LibraryPage = lazy(() => import("@/pages/library"));
const XrelReleasesPage = lazy(() => import("@/pages/xrel-releases"));
const RssPage = lazy(() => import("@/pages/rss"));
const LoginPage = lazy(() => import("@/pages/auth/login"));
const SetupPage = lazy(() => import("@/pages/auth/setup"));
const GameDetailsPage = lazy(() => import("@/pages/game-details"));

function Router() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route path="/setup" component={SetupPage} />
        <Route path="/" component={Dashboard} />
        <Route path="/discover" component={DiscoverPage} />
        <Route path="/search" component={SearchPage} />
        <Route path="/downloads" component={DownloadsPage} />
        <Route path="/requests" component={RequestsPage} />
        <Route path="/indexers" component={IndexersPage} />
        <Route path="/downloaders" component={DownloadersPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/library" component={LibraryPage} />
        <Route path="/games/:id" component={GameDetailsPage} />
        <Route path="/xrel" component={XrelReleasesPage} />
        <Route path="/rss" component={RssPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AppContent() {
  // Enable background notifications for downloads
  useBackgroundNotifications();

  return <Router />;
}

function App() {
  const [location, navigate] = useLocation();
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const searchableRoutes = new Set(["/", "/discover", "/requests", "/library", "/downloads"]);
  const canShowGlobalSearchResults =
    searchableRoutes.has(location) && globalSearchQuery.trim().length > 0;

  // Custom sidebar width for the application
  const style = {
    "--sidebar-width": "16rem", // 256px for navigation
    "--sidebar-width-icon": "4rem", // default icon width
  };

  const getPageTitle = (path: string) => {
    if (path.startsWith("/games/")) return "Game Details";

    switch (path) {
      case "/":
        return "Dashboard";
      case "/discover":
        return "Discover";
      case "/search":
        return "Search";
      case "/downloads":
        return "Downloads";
      case "/requests":
        return "Requests";
      case "/indexers":
        return "Indexers";
      case "/downloaders":
        return "Downloaders";
      case "/settings":
        return "Settings";
      case "/library":
        return "Library";
      case "/xrel":
        return "xREL.to releases";
      case "/rss":
        return "RSS Feeds";
      default:
        return BRAND.name;
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setGlobalSearchQuery(params.get("q") || "");
  }, [location]);

  useEffect(() => {
    const handleGlobalSearch = (event: Event) => {
      const customEvent = event as CustomEvent<{ query?: string }>;
      setGlobalSearchQuery(customEvent.detail?.query ?? "");
    };
    window.addEventListener(EVENTS.globalSearch, handleGlobalSearch);
    return () => {
      window.removeEventListener(EVENTS.globalSearch, handleGlobalSearch);
    };
  }, []);

  // If on login or setup page, render simplified layout without sidebar/header
  if (location === "/login" || location === "/setup") {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            <Router />
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <AuthProvider>
          <TooltipProvider>
            <SidebarProvider style={style as React.CSSProperties}>
              <div className="flex h-screen w-full overflow-hidden">
                <AppSidebar activeItem={location} onNavigate={navigate} />
                <div className="flex min-w-0 flex-1 flex-col bg-gradient-to-b from-transparent via-slate-950/30 to-slate-950/45">
                  <Header title={getPageTitle(location)} />
                  <main className="flex-1 overflow-hidden">
                    {canShowGlobalSearchResults ? (
                      <GlobalSearchResults query={globalSearchQuery.trim()} />
                    ) : (
                      <AppContent />
                    )}
                  </main>
                </div>
              </div>
            </SidebarProvider>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
