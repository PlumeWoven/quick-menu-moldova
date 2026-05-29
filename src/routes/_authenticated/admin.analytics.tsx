import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n, useT, formatMDL } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: Analytics,
});

function Analytics() {
  const { user } = useAuth();
  const t = useT();
  const { lang } = useI18n();

  const { data: restaurant } = useQuery({
    queryKey: ["my-restaurant", user?.id],
    enabled: !!user?.id,
    queryFn: async () => (await supabase.from("restaurants").select("*").eq("admin_id", user!.id).maybeSingle()).data,
  });

  const { data: orders } = useQuery({
    queryKey: ["analytics-orders", restaurant?.id],
    enabled: !!restaurant?.id,
    queryFn: async () => {
      const since = new Date(); since.setDate(since.getDate() - 7);
      const { data } = await supabase.from("orders").select("*")
        .eq("restaurant_id", restaurant!.id)
        .gte("created_at", since.toISOString())
        .neq("status", "cancelled");
      return data ?? [];
    },
  });

  const stats = useMemo(() => {
    if (!orders) return { total: 0, revenue: 0, avg: 0, days: [] as { day: string; orders: number; revenue: number }[], top: [] as { name: string; qty: number }[] };
    const total = orders.length;
    const revenue = orders.reduce((s, o) => s + Number(o.total), 0);
    const avg = total ? revenue / total : 0;

    const byDay = new Map<string, { orders: number; revenue: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      byDay.set(d.toISOString().slice(0, 10), { orders: 0, revenue: 0 });
    }
    orders.forEach((o) => {
      const k = o.created_at.slice(0, 10);
      const cur = byDay.get(k);
      if (cur) { cur.orders++; cur.revenue += Number(o.total); }
    });
    const days = Array.from(byDay.entries()).map(([day, v]) => ({
      day: new Date(day).toLocaleDateString(lang === "ru" ? "ru-MD" : "ro-MD", { weekday: "short" }),
      ...v,
    }));

    const itemMap = new Map<string, number>();
    orders.forEach((o) => ((o.items as any[]) ?? []).forEach((i: any) => itemMap.set(i.name, (itemMap.get(i.name) ?? 0) + i.quantity)));
    const top = Array.from(itemMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, qty]) => ({ name, qty }));

    return { total, revenue, avg, days, top };
  }, [orders, lang]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="font-display text-3xl mb-1">{t("admin.analytics.title")}</h1>
      <p className="text-sm text-muted-foreground mb-6">{t("admin.analytics.last7")}</p>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card label={t("admin.analytics.totalOrders")} value={String(stats.total)} />
        <Card label={t("admin.analytics.totalRevenue")} value={formatMDL(stats.revenue, lang)} />
        <Card label={t("admin.analytics.avgOrder")} value={formatMDL(stats.avg, lang)} />
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 shadow-soft mb-6">
        <h2 className="font-medium mb-4">{t("admin.analytics.last7")}</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.days}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.018 75)" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="orders" fill="oklch(0.58 0.16 38)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
        <h2 className="font-medium mb-4">{t("admin.analytics.topItems")}</h2>
        {stats.top.length === 0 ? (
          <p className="text-sm text-muted-foreground">—</p>
        ) : (
          <div className="space-y-2">
            {stats.top.map((it, i) => (
              <div key={it.name} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                <span className="flex-1">{it.name}</span>
                <span className="font-medium">{it.qty}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-display text-3xl mt-1">{value}</div>
    </div>
  );
}
