import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { LayoutDashboard, UtensilsCrossed, ClipboardList, BarChart3, Settings, LogOut, ExternalLink, Loader2, QrCode } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";
import { LangSwitch } from "@/components/LangSwitch";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({
  component: AuthedLayout,
});

function AuthedLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const t = useT();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/admin/login" });
  }, [user, loading, navigate]);

  const { data: restaurant } = useQuery({
    queryKey: ["my-restaurant", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurants").select("*").eq("admin_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (loading || !user) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const nav = [
    { to: "/admin/dashboard", icon: LayoutDashboard, label: t("admin.nav.dashboard") },
    { to: "/admin/menu", icon: UtensilsCrossed, label: t("admin.nav.menu") },
    { to: "/admin/orders", icon: ClipboardList, label: t("admin.nav.orders") },
    { to: "/admin/analytics", icon: BarChart3, label: t("admin.nav.analytics") },
    { to: "/admin/settings", icon: Settings, label: t("admin.nav.settings") },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-60 bg-sidebar border-r border-sidebar-border flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-hero grid place-items-center text-primary-foreground"><QrCode className="h-5 w-5" /></div>
            <span className="font-display text-xl">MenuQR</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((n) => {
            const Icon = n.icon;
            const active = path.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${active ? "bg-primary text-primary-foreground" : "hover:bg-sidebar-accent text-sidebar-foreground"}`}>
                <Icon className="h-4 w-4" /> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border space-y-2">
          {restaurant?.slug && (
            <a href={`/menu/${restaurant.slug}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
              <ExternalLink className="h-3 w-3" /> {t("admin.nav.viewMenu")}
            </a>
          )}
          <LangSwitch className="w-full justify-start" />
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/admin/login" }); }}>
            <LogOut className="h-4 w-4 mr-2" /> {t("admin.nav.logout")}
          </Button>
        </div>
      </aside>
      <main className="md:ml-60 min-h-screen">
        <div className="md:hidden border-b border-border bg-card p-3 flex items-center justify-between">
          <Link to="/" className="font-display text-xl">MenuQR</Link>
          <div className="flex items-center gap-1">
            <LangSwitch />
            <Button variant="ghost" size="sm" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/admin/login" }); }}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="md:hidden border-b border-border bg-card overflow-x-auto">
          <div className="flex gap-1 p-2 min-w-max">
            {nav.map((n) => {
              const Icon = n.icon;
              const active = path.startsWith(n.to);
              return (
                <Link key={n.to} to={n.to} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs whitespace-nowrap ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                  <Icon className="h-3.5 w-3.5" /> {n.label}
                </Link>
              );
            })}
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
