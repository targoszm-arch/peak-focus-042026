import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TasksProvider } from "@/hooks/use-tasks";
import { HabitsProvider } from "@/hooks/use-habits";
import { ProjectsProvider } from "@/hooks/use-projects";
import { ClientsProvider } from "@/hooks/use-clients";
import { PeopleProvider } from "@/hooks/use-people";
import { TimeProvider } from "@/hooks/use-time";
import { HealthProvider } from "@/hooks/use-health";
import { FocusQueueProvider } from "@/hooks/use-focus-queue";
import { useKeyboardSnapback } from "@/hooks/use-keyboard-snapback";
import SignIn from "@/pages/SignIn";
import ResetPassword from "@/pages/ResetPassword";

function DataProviders({ children }: { children: React.ReactNode }) {
  return (
    <TasksProvider>
      <ProjectsProvider>
        <ClientsProvider>
          <PeopleProvider>
            <HabitsProvider>
              <TimeProvider>
                <HealthProvider>
                  <FocusQueueProvider>{children}</FocusQueueProvider>
                </HealthProvider>
              </TimeProvider>
            </HabitsProvider>
          </PeopleProvider>
        </ClientsProvider>
      </ProjectsProvider>
    </TasksProvider>
  );
}
import Dashboard from "@/screens/Dashboard";
import Today from "@/screens/Today";
import Tasks from "@/screens/Tasks";
import Projects from "@/screens/Projects";
import ProjectDetail from "@/screens/ProjectDetail";
import Clients from "@/screens/Clients";
import People from "@/screens/People";
import Habits from "@/screens/Habits";
import Focus from "@/screens/Focus";
import Health from "@/screens/Health";
import Integrations from "@/screens/Integrations";
import Settings from "@/screens/Settings";
import Placeholder from "@/screens/Placeholder";

const queryClient = new QueryClient();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, passwordRecovery } = useAuth();
  useKeyboardSnapback();
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </main>
    );
  }
  // A password-recovery link establishes a session on its own — intercept it
  // here so the user sets a new password before landing in the app.
  if (passwordRecovery) return <ResetPassword />;
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
            <DataProviders>
            <Routes>
              <Route element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="today" element={<Today />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="projects" element={<Projects />} />
                <Route path="projects/:id" element={<ProjectDetail />} />
                <Route path="clients" element={<Clients />} />
                <Route path="people" element={<People />} />
                <Route path="habits" element={<Habits />} />
                <Route path="focus" element={<Focus />} />
                <Route path="health" element={<Health />} />
                <Route path="integrations" element={<Integrations />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<Placeholder title="Not found" />} />
              </Route>
            </Routes>
            </DataProviders>
          </AuthGate>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
