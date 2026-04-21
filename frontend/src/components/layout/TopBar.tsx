"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  Bell,
  Search,
  MessageCircle,
  Settings,
  LogOut,
  ChevronDown,
  X,
} from "lucide-react";
import type { BMPUser } from "@/lib/auth";
import { clearStoredUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { getApiBaseUrl } from "@/lib/api-base";

interface TopBarProps {
  user: BMPUser | null;
  onMenuClick: () => void;
}

const API_URL = getApiBaseUrl();

export function TopBar({ user, onMenuClick }: TopBarProps) {
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const initials = user?.nom
    ? user.nom
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  const fetchUnread = useCallback(async () => {
    if (!user?._id) return;
    try {
      const res = await fetch(`${API_URL}/messages/unread-count`, {
        headers: { "x-user-id": user._id },
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as { count?: number };
        setUnread(typeof data?.count === "number" ? data.count : 0);
      }
    } catch {
      /* silent */
    }
  }, [user?._id]);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 45_000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  const handleLogout = () => {
    clearStoredUser();
    router.push("/login");
  };

  return (
    <header
      className="sticky top-0 z-30 flex h-[60px] shrink-0 items-center gap-3 px-4 sm:px-6 backdrop-blur-md"
      style={{
        background: "rgba(13,17,23,0.95)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={onMenuClick}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:text-white lg:hidden"
        style={{ background: "rgba(255,255,255,0.04)" }}
        aria-label="Menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search trigger */}
      <button
        type="button"
        className="hidden sm:flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm text-gray-400 transition hover:text-gray-200"
        style={{
          borderColor: "rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
        }}
      >
        <Search className="h-3.5 w-3.5" />
        <span>Rechercher dans BMP...</span>
        <kbd
          className="ml-6 hidden rounded px-1.5 py-0.5 font-mono text-[10px] sm:block"
          style={{ background: "rgba(255,255,255,0.06)", color: "#6b7280" }}
        >
          ⌘K
        </kbd>
      </button>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-1.5">
        {/* Messages */}
        <Link
          href="/messages"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:text-white"
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.background =
              "rgba(255,255,255,0.06)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.background = "")
          }
          title="Messages"
        >
          <MessageCircle className="h-[18px] w-[18px]" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-gray-900">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>

        {/* Notifications */}
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:text-white"
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.background =
              "rgba(255,255,255,0.06)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.background = "")
          }
          title="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span
            className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
            style={{ background: "#f59e0b" }}
          />
        </button>

        {/* Divider */}
        <div
          className="mx-1 h-5"
          style={{ width: "1px", background: "rgba(255,255,255,0.08)" }}
        />

        {/* User menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:text-white"
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background =
                "rgba(255,255,255,0.05)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "")
            }
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/80 to-amber-600/50 text-[11px] font-bold text-gray-900">
              {initials}
            </div>
            <span className="hidden text-[13px] font-medium text-gray-300 sm:block">
              {user?.nom?.split(" ")[0] ?? "Compte"}
            </span>
            <ChevronDown
              className={cn(
                "hidden h-3.5 w-3.5 text-gray-500 transition-transform sm:block",
                userMenuOpen && "rotate-180",
              )}
            />
          </button>

          {/* Dropdown */}
          {userMenuOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-10"
                onClick={() => setUserMenuOpen(false)}
                aria-label="Fermer le menu"
              />
              <div
                className="absolute right-0 top-full z-20 mt-1.5 w-52 rounded-xl py-1.5 shadow-2xl"
                style={{
                  background: "#161b25",
                  border: "1px solid rgba(255,255,255,0.09)",
                  boxShadow:
                    "0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
                }}
              >
                <div
                  className="px-3 py-2.5"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <p className="text-[13px] font-semibold text-white">
                    {user?.nom}
                  </p>
                  <p className="text-[11px] text-gray-500">{user?.email}</p>
                </div>

                <div className="py-1">
                  <Link
                    href="/messages"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-300 transition hover:text-white"
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.background =
                        "rgba(255,255,255,0.05)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.background = "")
                    }
                  >
                    <MessageCircle className="h-4 w-4 text-gray-500" />
                    Messages
                    {unread > 0 && (
                      <span className="ml-auto rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-gray-900">
                        {unread}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/contact"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-300 transition hover:text-white"
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.background =
                        "rgba(255,255,255,0.05)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.background = "")
                    }
                  >
                    <Settings className="h-4 w-4 text-gray-500" />
                    Paramètres
                  </Link>
                </div>

                <div
                  className="py-1"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] text-red-400 transition"
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.background =
                        "rgba(239,68,68,0.1)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.background = "")
                    }
                  >
                    <LogOut className="h-4 w-4" />
                    Se déconnecter
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
