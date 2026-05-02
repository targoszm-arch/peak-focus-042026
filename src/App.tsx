import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import * as P from "./pages";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import SignIn from "@/pages/SignIn";

const queryClient = new QueryClient();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </main>
    );
  }
  if (!user) return <SignIn />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthGate>
            <Routes>
              <Route element={<AppLayout />}>
                <Route index element={<P.Index />} />
                <Route path="home" element={<P.Index />} />

                <Route path="focus">
                  <Route index element={<P.Focus />} />
                  <Route path="timer-settings" element={<P.FocusSettings />} />
                </Route>

                <Route path="mountains">
                  <Route index element={<P.Mountains />} />
                  <Route path=":id" element={<P.MountainDetail />} />
                </Route>

                <Route path="capture">
                  <Route index element={<P.Capture />} />
                  <Route path="new" element={<P.CaptureNew />} />
                </Route>

                <Route path="progress">
                  <Route index element={<P.Progress />} />
                  <Route path=":period" element={<P.ProgressPeriod />} />
                </Route>

                <Route path="tasks" element={<P.Tasks />} />
                <Route path="habits" element={<P.Habits />} />

                <Route path="settings">
                  <Route index element={<P.Settings />} />
                  <Route path="notifications" element={<P.SettingsNotifications />} />
                </Route>

                <Route path="*" element={<P.NotFound />} />
              </Route>
            </Routes>
          </AuthGate>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
