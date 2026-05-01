import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import * as P from "./pages";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
