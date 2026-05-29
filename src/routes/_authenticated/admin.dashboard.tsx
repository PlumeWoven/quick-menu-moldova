import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, DollarSign, UtensilsCrossed } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n, useT, formatMDL } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  component: Dashboard,
});

const STATUSES = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"] as const;

function Dashboard() {
  const { user } = useAuth();
  const t = useT();
  const { lang } = useI18n();
  const [tick, setTick] = useState(0);

  const { data: restaurant } = useQuery({
    queryKey: ["my-restaurant", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("restaurants").select("*").eq("admin_id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: orders } = useQuery({
    queryKey: ["orders-today", restaurant?.id, tick],
    enabled: !!restaurant?.id,
    queryFn: async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from("orders").select("*")
        .eq("restaurant_id", restaurant!.id)
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: itemCount } = useQuery({
    queryKey: ["item-count", restaurant?.id],
    enabled: !!restaurant?.id,
    queryFn: async () => {
      const { data: cats } = await supabase.from("categories").select("id").eq("restaurant_id", restaurant!.id);
      const ids = (cats ?? []).map((c) => c.id);
      if (ids.length === 0) return 0;
      const { count } = await supabase.from("items").select("id", { count: "exact", head: true })
        .in("category_id", ids).eq("is_available", true);
      return count ?? 0;
    },
  });

  useEffect(() => {
    if (!restaurant?.id) return;
    const ch = supabase
      .channel(`dash-${restaurant.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurant.id}` }, () => setTick((x) => x + 1))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [restaurant?.id]);

  const revenue = useMemo(() => (orders ?? []).filter(o => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0), [orders]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("orders").update({ status }).eq("id", id);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="font-display text-3xl mb-1">{t("admin.dashboard.title")}{restaurant?.name ? `, ${restaurant.name}` : ""}</h1>
      <p className="text-sm text-muted-foreground mb-6">{new Date().toLocaleDateString(lang === "ru" ? "ru-MD" : "ro-MD", { weekday: "long", day: "numeric", month: "long" })}</p>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Stat icon={ClipboardList} label={t("admin.dashboard.ordersToday")} value={String(orders?.length ?? 0)} />
        <Stat icon={DollarSign} label={t("admin.dashboard.revenueToday")} value={formatMDL(revenue, lang)} />
        <Stat icon={UtensilsCrossed} label={t("admin.dashboard.activeItems")} value={String(itemCount ?? 0)} />
      </div>

      <h2 className="font-display text-xl mb-3">{t("admin.dashboard.recent")}</h2>
      {(!orders || orders.length === 0) ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">{t("admin.dashboard.noOrders")}</div>
      ) : (
        <div className="space-y-2">
          {orders.slice(0, 10).map((o) => (
            <div key={o.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">#{o.id.slice(0, 6)}</span>
                  {o.table_number && <span className="text-xs px-2 py-0.5 rounded bg-muted">{t("order.table")} {o.table_number}</span>}
                  <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">{t(`order.status.${o.status}`)}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{((o.items as any[]) ?? []).map((i: any) => `${i.quantity}× ${i.name}`).join(", ")}</div>
              </div>
              <div className="font-display text-lg">{formatMDL(Number(o.total), lang)}</div>
              <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)} className="text-sm border border-border rounded-md px-2 py-1 bg-background">
                {STATUSES.map(s => <option key={s} value={s}>{t(`order.status.${s}`)}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-4 w-4" /> {label}</div>
      <div className="font-display text-3xl mt-1">{value}</div>
    </div>
  );
}
