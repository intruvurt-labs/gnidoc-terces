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

function Router() {
  return (
    <CyberpunkLayout>
      <Switch>
        <Route path="/" component={EnhancedHome} />
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
