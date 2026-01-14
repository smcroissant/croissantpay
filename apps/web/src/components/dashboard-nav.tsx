"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Users,
  CreditCard,
  Settings,
  BarChart3,
  Bell,
  Tag,
  FlaskConical,
  ScrollText,
} from "lucide-react";

const navItems = [
  { href: "", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/apps", icon: Package, label: "Apps" },
  { href: "/subscribers", icon: Users, label: "Subscribers" },
  { href: "/products", icon: CreditCard, label: "Products" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/api-logs", icon: ScrollText, label: "API Logs" },
  { href: "/webhooks", icon: Bell, label: "Webhooks" },
  { href: "/promo-codes", icon: Tag, label: "Promo Codes" },
  { href: "/experiments", icon: FlaskConical, label: "Experiments" },
];

export function DashboardNav() {
  const pathname = usePathname();
  
  // Extract orgId from pathname: /dashboard/[orgId]/...
  const segments = pathname.split("/");
  const dashboardIndex = segments.indexOf("dashboard");
  const orgId = dashboardIndex >= 0 ? segments[dashboardIndex + 1] : null;

  // If no orgId, we're on /dashboard (redirect page), don't show nav
  if (!orgId || orgId === "") {
    return (
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            href="/dashboard"
            icon={item.icon}
            isActive={false}
          >
            {item.label}
          </NavLink>
        ))}
        <div className="pt-4 mt-4 border-t border-border">
          <NavLink href="/dashboard" icon={Settings} isActive={false}>
            Settings
          </NavLink>
        </div>
      </nav>
    );
  }

  const basePath = `/dashboard/${orgId}`;

  // Determine active state
  const isActive = (itemHref: string) => {
    const fullHref = basePath + itemHref;
    if (itemHref === "") {
      return pathname === basePath;
    }
    return pathname.startsWith(fullHref);
  };

  return (
    <nav className="flex-1 p-4 space-y-1">
      {navItems.map((item) => (
        <NavLink
          key={item.label}
          href={basePath + item.href}
          icon={item.icon}
          isActive={isActive(item.href)}
        >
          {item.label}
        </NavLink>
      ))}
      <div className="pt-4 mt-4 border-t border-border">
        <NavLink
          href={`${basePath}/settings`}
          icon={Settings}
          isActive={pathname.startsWith(`${basePath}/settings`)}
        >
          Settings
        </NavLink>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  icon: Icon,
  children,
  isActive,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{children}</span>
    </Link>
  );
}

