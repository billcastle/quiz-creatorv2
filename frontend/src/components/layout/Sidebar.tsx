import { Link } from "@tanstack/react-router";
import {
  Folder,
  Home,
  PanelLeft,
  PanelLeftClose,
  SwatchBook,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";

// Nav links point ONLY to routes that exist today. Feature pages (Explore,
// builder, profile, settings, admin) are added with their own tickets.
interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: readonly NavItem[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/design-system", label: "Design System", icon: SwatchBook },
] as const;

// Static sample categories. Inert for now (Explore filtering is a later ticket).
// TODO: replace with backend categories (FR-34) via GET /api/categories.
const CATEGORIES: readonly string[] = [
  "General",
  "Science",
  "History",
  "Entertainment",
] as const;

/**
 * Lean custom sidebar (TICKET-005): a <nav> landmark with token-driven styling,
 * lucide icons, and a minimize toggle that collapses it to an icons-only rail.
 * Collapsed state is read from / written to the Zustand ui store (persisted).
 * Built custom (not the shadcn `sidebar` block) to avoid pulling Sheet/Tooltip/
 * Skeleton/provider plumbing — see TICKET-005 notes.
 */
export function Sidebar(): ReactElement {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  return (
    <nav
      aria-label="Main"
      data-collapsed={collapsed}
      className={cn(
        "flex h-full shrink-0 flex-col border-border border-r bg-card text-card-foreground transition-[width] duration-200",
        collapsed ? "w-16" : "w-60",
      )}
    >
      {/* Collapse toggle */}
      <div
        className={cn(
          "flex items-center p-2",
          collapsed ? "justify-center" : "justify-end",
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
        >
          {collapsed ? (
            <PanelLeft aria-hidden />
          ) : (
            <PanelLeftClose aria-hidden />
          )}
        </Button>
      </div>

      {/* Nav links */}
      <ul className="flex flex-col gap-1 px-2">
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              title={collapsed ? item.label : undefined}
              aria-label={collapsed ? item.label : undefined}
              activeProps={{
                "aria-current": "page",
                "data-active": "true",
              }}
              activeOptions={{ exact: item.to === "/" }}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-accent data-[active=true]:font-medium data-[active=true]:text-accent-foreground",
                collapsed && "justify-center px-0",
              )}
            >
              <item.icon className="size-4 shrink-0" aria-hidden />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          </li>
        ))}
      </ul>

      <Separator className="my-3" />

      {/* Categories (static sample; inert until Explore lands) */}
      <div className="flex min-h-0 flex-1 flex-col px-2">
        {!collapsed && (
          <span className="px-3 pb-1 font-medium text-muted-foreground text-xs uppercase tracking-wider">
            Categories
          </span>
        )}
        <ul className="flex flex-col gap-1">
          {CATEGORIES.map((category) => (
            <li key={category}>
              {/* Inert entry: no link target yet (Explore filtering is later). */}
              <span
                aria-disabled="true"
                title={collapsed ? category : undefined}
                aria-label={collapsed ? category : undefined}
                className={cn(
                  "flex cursor-default items-center gap-3 rounded-md px-3 py-2 text-muted-foreground text-sm",
                  collapsed && "justify-center px-0",
                )}
              >
                <Folder className="size-4 shrink-0" aria-hidden />
                {!collapsed && <span className="truncate">{category}</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
