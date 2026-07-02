import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import SignIn from "@/pages/SignIn";
import Today from "@/screens/Today";
import Tasks from "@/screens/Tasks";
import Placeholder from "@/screens/Placeholder";

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
                <Route index element={<Today />} />
                <Route path="today" element={<Today />} />
                <Route path="tasks" element={<Tasks />} />
                <Route
                  path="projects"
                  element={<Placeholder title="Projects" icon="FolderProperty1Linear" />}
                />
                <Route
                  path="clients"
                  element={
                    <Placeholder
                      title="Clients"
                      icon="CategoryProperty1Linear"
                      blurb="Client workspace from the design system — pending a clients data model."
                    />
                  }
                />
                <Route
                  path="people"
                  element={
                    <Placeholder
                      title="People"
                      icon="Profile2userProperty1Linear"
                      blurb="Team directory from the design system — pending a people data model."
                    />
                  }
                />
                <Route
                  path="habits"
                  element={<Placeholder title="Habits" icon="StarProperty1Linear" />}
                />
                <Route
                  path="focus"
                  element={<Placeholder title="Focus" icon="TimerProperty1Linear" />}
                />
                <Route
                  path="health"
                  element={<Placeholder title="Health" icon="ChartProperty1Linear" />}
                />
                <Route
                  path="integrations"
                  element={<Placeholder title="Integrations" icon="Element3Property1Linear" />}
                />
                <Route
                  path="settings"
                  element={<Placeholder title="Settings" icon="Setting2Property1Linear" />}
                />
                <Route path="*" element={<Placeholder title="Not found" />} />
              </Route>
            </Routes>
          </AuthGate>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
