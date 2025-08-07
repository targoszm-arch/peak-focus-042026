import { Outlet, NavLink } from "react-router-dom";
import { Home, Timer, Mountain, Camera, BarChart2, Settings as Cog } from "lucide-react";

function NavIconLink({ to, label, end, children }: { to: string; label: string; end?: boolean; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end={end}
      aria-label={label}
      className={({ isActive }) =>
        "flex h-12 w-12 items-center justify-center rounded-md transition-colors " +
        (isActive ? "text-primary" : "text-muted-foreground hover:text-foreground")
      }
    >
      {children}
    </NavLink>
  );
}

export default function AppLayout() {
  return (
    <>
      <div className="pb-16">
        <Outlet />
      </div>

      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-md items-center justify-around">
          <NavIconLink to="/" label="Home" end>
            <Home className="h-5 w-5" />
          </NavIconLink>
          <NavIconLink to="/focus" label="Focus">
            <Timer className="h-5 w-5" />
          </NavIconLink>
          <NavIconLink to="/mountains" label="Mountains">
            <Mountain className="h-5 w-5" />
          </NavIconLink>
          <NavIconLink to="/capture" label="Capture">
            <Camera className="h-5 w-5" />
          </NavIconLink>
          <NavIconLink to="/progress" label="Progress">
            <BarChart2 className="h-5 w-5" />
          </NavIconLink>
          <NavIconLink to="/settings" label="Settings">
            <Cog className="h-5 w-5" />
          </NavIconLink>
        </div>
      </nav>
    </>
  );
}
