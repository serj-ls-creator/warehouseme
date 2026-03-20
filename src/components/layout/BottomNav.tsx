import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Главная", emoji: "🏠" },
  { to: "/items", label: "Вещи", emoji: "📦" },
  { to: "/locations", label: "Локации", emoji: "📍" },
  { to: "/expiry", label: "Сроки", emoji: "⏰" },
  { to: "/settings", label: "Ещё", emoji: "⚙️" },
];

export const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to ||
            (item.to !== "/" && location.pathname.startsWith(item.to));
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs transition-colors",
                isActive
                  ? "text-accent"
                  : "text-muted-foreground"
              )}
            >
              <span className="text-xl">{item.emoji}</span>
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
