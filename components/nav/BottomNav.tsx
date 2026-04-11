"use client";

import { Home, MessageCircle, Lightbulb, Map } from "lucide-react";

type Tab = "home" | "chat" | "hints" | "map";

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
  chatUnread?: number;
}

const TABS: { id: Tab; icon: React.ElementType; label: string }[] = [
  { id: "home", icon: Home, label: "Játék" },
  { id: "chat", icon: MessageCircle, label: "Chat" },
  { id: "hints", icon: Lightbulb, label: "Tippek" },
  { id: "map", icon: Map, label: "Térkép" },
];

export function BottomNav({ active, onChange, chatUnread = 0 }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex pb-safe"
      style={{
        background: "rgba(10,14,26,0.95)",
        backdropFilter: "blur(16px)",
        borderTop: "1px solid var(--border-dim)",
      }}
    >
      {TABS.map(({ id, icon: Icon, label }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-3 relative"
            style={{
              color: isActive ? "var(--cyan)" : "var(--text-faint)",
              transition: "color 0.2s",
            }}
            aria-label={label}
          >
            <div className="relative">
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              {id === "chat" && chatUnread > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                  style={{ background: "var(--orange)", color: "#fff" }}
                >
                  {chatUnread > 9 ? "9+" : chatUnread}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{label}</span>
            {isActive && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                style={{ background: "var(--cyan)" }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
