import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/error-boundary";
import CyberpunkLayout from "@/components/cyberpunk-layout";
import NotFound from "@/pages/not-found";
import EnhancedHome from "@/pages/enhanced-home";
import Home from "@/pages/home";
import SettingsPage from "@/pages/settings";
import { SecurityDashboard } from "@/components/security/security-dashboard";

function Router() {
  return (
    <CyberpunkLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/security" component={SecurityDashboard} />
        <Route component={NotFound} />
      </Switch>
    </CyberpunkLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
