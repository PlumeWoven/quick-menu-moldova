import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Check, Clock, Loader2, UtensilsCrossed } from "lucide-react";
import { getOrder } from "@/lib/public.functions";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, useT, formatMDL } from "@/lib/i18n";
import { LangSwitch } from "@/components/LangSwitch";

export const Route = createFileRoute("/order/$orderId")({
  component: OrderStatusPage,
});

const STEPS = ["pending", "confirmed", "preparing", "ready", "completed"] as const;

function OrderStatusPage() {
  const { orderId } = Route.useParams();
  const t = useT();
  const { lang } = useI18n();
  const fetchOrder = useServerFn(getOrder);
  const [version, setVersion] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["order", orderId, version],
    queryFn: () => fetchOrder({ data: { id: orderId } }),
    refetchInterval: 8000,
  });

  useEffect(() => {
    const ch = supabase
      .channel(`order-${orderId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` }, () => setVersion((v) => v + 1))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [orderId]);

  if (isLoading) return <div className="min-h-screen grid place-items-center"><Loader2 className="animate-spin h-6 w-6" /></div>;
  if (!data?.order) return <div className="min-h-screen grid place-items-center">404</div>;

  const order = data.order;
  const status = order.status as typeof STEPS[number] | "cancelled";
  const items = (order.items as any[]) ?? [];
  const currentIdx = STEPS.indexOf(status as any);

  return (
    <div className="min-h-screen bg-gradient-warm">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto max-w-2xl px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-display text-xl">MenuQR</Link>
          <LangSwitch />
        </div>
      </header>
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 rounded-full bg-success/10 text-success items-center justify-center mb-3">
            <Check className="h-7 w-7" />
          </div>
          <h1 className="font-display text-3xl">{t("order.placed")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("order.id")}: {order.id.slice(0, 8)}</p>
          {order.table_number && <p className="text-sm text-muted-foreground">{t("order.table")} {order.table_number}</p>}
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-soft mb-6">
          <h2 className="font-medium mb-4 flex items-center gap-2"><Clock className="h-4 w-4" /> {t("common.status")}</h2>
          {status === "cancelled" ? (
            <div className="text-destructive font-medium">{t("order.status.cancelled")}</div>
          ) : (
            <div className="space-y-3">
              {STEPS.map((s, i) => {
                const reached = i <= currentIdx;
                const current = i === currentIdx;
                return (
                  <div key={s} className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full grid place-items-center text-xs font-semibold ${reached ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {reached ? <Check className="h-4 w-4" /> : i + 1}
                    </div>
                    <span className={`${current ? "font-medium" : ""} ${reached ? "" : "text-muted-foreground"}`}>
                      {t(`order.status.${s}`)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
          <h2 className="font-medium mb-4 flex items-center gap-2"><UtensilsCrossed className="h-4 w-4" /> {t("menu.cart.title")}</h2>
          <div className="space-y-2">
            {items.map((it, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{it.quantity}× {it.name}</span>
                <span className="text-muted-foreground">{formatMDL(it.price * it.quantity, lang)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border flex justify-between font-display text-xl">
            <span>{t("common.total")}</span>
            <span>{formatMDL(Number(order.total), lang)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
