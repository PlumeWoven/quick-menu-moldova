import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n, useT, formatMDL } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: Orders,
});

const STATUSES = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"] as const;

function Orders() {
  const { user } = useAuth();
  const t = useT();
  const { lang } = useI18n();
  const [filter, setFilter] = useState<"all" | "active">("active");
  const [tick, setTick] = useState(0);

  const { data: restaurant } = useQuery({
    queryKey: ["my-restaurant", user?.id],
    enabled: !!user?.id,
    queryFn: async () => (await supabase.from("restaurants").select("*").eq("admin_id", user!.id).maybeSingle()).data,
  });

  const { data: orders } = useQuery({
    queryKey: ["orders-all", restaurant?.id, filter, tick],
    enabled: !!restaurant?.id,
    queryFn: async () => {
      let q = supabase.from("orders").select("*").eq("restaurant_id", restaurant!.id).order("created_at", { ascending: false }).limit(200);
      if (filter === "active") q = q.in("status", ["pending", "confirmed", "preparing", "ready"]);
      const { data } = await q;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!restaurant?.id) return;
    const ch = supabase.channel(`orders-${restaurant.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurant.id}` }, () => setTick(x => x + 1))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [restaurant?.id]);

  const update = async (id: string, patch: { status?: string; payment_status?: string; payment_method?: string }) => {
    await supabase.from("orders").update(patch as any).eq("id", id);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl">{t("admin.orders.title")}</h1>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <button onClick={() => setFilter("active")} className={`px-3 py-1.5 text-sm rounded-md ${filter === "active" ? "bg-card shadow-sm" : ""}`}>{t("admin.orders.filter.active")}</button>
          <button onClick={() => setFilter("all")} className={`px-3 py-1.5 text-sm rounded-md ${filter === "all" ? "bg-card shadow-sm" : ""}`}>{t("admin.orders.filter.all")}</button>
        </div>
      </div>

      <div className="space-y-3">
        {orders?.map((o) => (
          <div key={o.id} className="bg-card border border-border rounded-2xl p-4 shadow-soft">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-medium">#{o.id.slice(0, 8)}</span>
              {o.table_number && <span className="text-xs px-2 py-0.5 rounded bg-muted">{t("order.table")} {o.table_number}</span>}
              <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">{t(`order.status.${o.status}`)}</span>
              {o.payment_status === "paid" && <span className="text-xs px-2 py-0.5 rounded bg-success/15 text-success">{t("admin.orders.markPaid")}</span>}
              <span className="text-xs text-muted-foreground ml-auto">{new Date(o.created_at).toLocaleTimeString(lang === "ru" ? "ru-MD" : "ro-MD")}</span>
            </div>
            {(o.customer_name || o.customer_phone) && (
              <div className="text-xs text-muted-foreground mb-2">{o.customer_name} {o.customer_phone && `· ${o.customer_phone}`}</div>
            )}
            <div className="text-sm">
              {((o.items as any[]) ?? []).map((i: any, idx) => (
                <div key={idx}>{i.quantity}× {i.name} <span className="text-muted-foreground">— {formatMDL(i.price * i.quantity, lang)}</span></div>
              ))}
            </div>
            {o.notes && <div className="text-xs text-muted-foreground mt-2 italic">"{o.notes}"</div>}
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border">
              <div className="font-display text-lg mr-auto">{formatMDL(Number(o.total), lang)}</div>
              <select value={o.status} onChange={(e) => update(o.id, { status: e.target.value })} className="text-sm border border-border rounded-md px-2 py-1.5 bg-background">
                {STATUSES.map(s => <option key={s} value={s}>{t(`order.status.${s}`)}</option>)}
              </select>
              {o.payment_status !== "paid" && (
                <Button size="sm" variant="outline" onClick={() => update(o.id, { payment_status: "paid", payment_method: "cash" })}>
                  {t("admin.orders.markPaid")}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
