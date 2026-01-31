"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronDown,
  Settings,
  LogOut,
  User,
  CreditCard,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";

interface UserMenuProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
  };
  orgId?: string;
}

export function UserMenu({ user, orgId }: UserMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authClient.signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  const settingsPath = orgId ? `/dashboard/${orgId}/settings` : "/dashboard";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-secondary transition-colors"
      >
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || "User"}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
            {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
          </div>
        )}
        <div className="text-sm text-left hidden sm:block">
          <p className="font-medium">{user.name || "User"}</p>
          <p className="text-muted-foreground text-xs truncate max-w-[150px]">
            {user.email}
          </p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
          {/* User Info Header */}
          <div className="p-3 border-b border-border bg-secondary/30">
            <p className="font-medium text-sm truncate">{user.name || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <Link
              href="/account"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary transition-colors"
            >
              <User className="w-4 h-4 text-muted-foreground" />
              <span>Account Settings</span>
            </Link>

            {orgId && (
              <Link
                href={`/dashboard/${orgId}/settings`}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary transition-colors"
              >
                <Settings className="w-4 h-4 text-muted-foreground" />
                <span>Organization Settings</span>
              </Link>
            )}

            {orgId && (
              <Link
                href={`/dashboard/${orgId}/settings`}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary transition-colors"
              >
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <span>Billing</span>
              </Link>
            )}

            <Link
              href="/docs"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-muted-foreground" />
              <span>Documentation</span>
            </Link>
          </div>

          {/* Logout */}
          <div className="border-t border-border py-1">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary transition-colors text-red-500 disabled:opacity-50"
            >
              {isLoggingOut ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

