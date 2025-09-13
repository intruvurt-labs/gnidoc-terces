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
import AuthPage from "@/pages/auth";
import { SecurityDashboard } from "@/components/security/security-dashboard";
import React from "react";

function OAuthRedirect({ provider }: { provider: 'google' | 'github' }) {
  React.useEffect(() => {
    // Force full navigation to server route for OAuth
    window.location.href = `/auth/${provider}`;
  }, [provider]);
  return (
    <div className="p-6 text-center text-sm text-gray-400">Redirecting to {provider}…</div>
  );
}

function Router() {
  return (
    <CyberpunkLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/security" component={SecurityDashboard} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/auth/google">{() => <OAuthRedirect provider="google" />}</Route>
        <Route path="/auth/github">{() => <OAuthRedirect provider="github" />}</Route>
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
