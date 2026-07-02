import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import SignIn from "@/pages/SignIn";
import Dashboard from "@/screens/Dashboard";
import Today from "@/screens/Today";
import Tasks from "@/screens/Tasks";
import Projects from "@/screens/Projects";
import Clients from "@/screens/Clients";
import People from "@/screens/People";
import Habits from "@/screens/Habits";
import Focus from "@/screens/Focus";
import Health from "@/screens/Health";
import Integrations from "@/screens/Integrations";
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
                <Route index element={<Dashboard />} />
                <Route path="today" element={<Today />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="projects" element={<Projects />} />
                <Route path="clients" element={<Clients />} />
                <Route path="people" element={<People />} />
                <Route path="habits" element={<Habits />} />
                <Route path="focus" element={<Focus />} />
                <Route path="health" element={<Health />} />
                <Route path="integrations" element={<Integrations />} />
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
