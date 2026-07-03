import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TasksProvider } from "@/hooks/use-tasks";
import { HabitsProvider } from "@/hooks/use-habits";
import { ProjectsProvider } from "@/hooks/use-projects";
import { ClientsProvider } from "@/hooks/use-clients";
import { PeopleProvider } from "@/hooks/use-people";
import { TimeProvider } from "@/hooks/use-time";
import { HealthProvider } from "@/hooks/use-health";
import SignIn from "@/pages/SignIn";
import ProtoAppLive from "@/proto/ProtoAppLive";

const queryClient = new QueryClient();

function DataProviders({ children }: { children: React.ReactNode }) {
  return (
    <TasksProvider>
      <ProjectsProvider>
        <ClientsProvider>
          <PeopleProvider>
            <HabitsProvider>
              <TimeProvider>
                <HealthProvider>{children}</HealthProvider>
              </TimeProvider>
            </HabitsProvider>
          </PeopleProvider>
        </ClientsProvider>
      </ProjectsProvider>
    </TasksProvider>
  );
}

function AuthGate() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </main>
    );
  }
  if (!user) return <SignIn />;
  return (
    <DataProviders>
      <ProtoAppLive />
    </DataProviders>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthGate />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
