import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, ShoppingBag, X, ImageOff, Loader2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { useI18n, useT, formatMDL } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { LangSwitch } from "@/components/LangSwitch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string | null;
}

export const Route = createFileRoute("/menu/$slug")({
  validateSearch: (s) => z.object({ table: z.string().optional() }).parse(s),
  component: MenuPage,
});

function MenuPage() {
  const { slug } = Route.useParams();
  const { table } = Route.useSearch();
  const t = useT();
  const { lang } = useI18n();
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const cartKey = `cart:${slug}`;
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableNumber, setTableNumber] = useState(table ?? "");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Load restaurant and menu data
  useEffect(() => {
    async function loadMenu() {
      setLoading(true);
      // Fetch restaurant
      const { data: restaurantData, error: rErr } = await supabase
        .from("restaurants")
        .select("id, name, slug, address, phone, logo_url, is_active")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (rErr || !restaurantData) {
        setLoading(false);
        return;
      }
      setRestaurant(restaurantData);

      // Fetch categories with items
      const { data: cats, error: cErr } = await supabase
        .from("categories")
        .select("id, name, display_order, items(id, name, description, price, image_url, is_available, display_order)")
        .eq("restaurant_id", restaurantData.id)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (!cErr && cats) {
        const normalized = cats.map((c) => ({
          id: c.id,
          name: c.name,
          display_order: c.display_order,
          items: (c.items || [])
            .filter((i: any) => i.is_available)
            .map((i: any) => ({
              id: i.id,
              name: i.name,
              description: i.description,
              price: Number(i.price),
              image_url: i.image_url,
              display_order: i.display_order,
            }))
            .sort((a, b) => a.display_order - b.display_order),
        }));
        setCategories(normalized);
      }
      setLoading(false);
    }
    loadMenu();
  }, [slug]);

  // Cart localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(cartKey);
    if (raw) try { setCart(JSON.parse(raw)); } catch { }
  }, [cartKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(cartKey, JSON.stringify(cart));
  }, [cart, cartKey]);

  useEffect(() => { if (table) setTableNumber(table); }, [table]);

  const total = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const count = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

  const addToCart = (it: { id: string; name: string; price: number; image_url?: string | null }) => {
    setCart((c) => {
      const existing = c.find((x) => x.id === it.id);
      if (existing) return c.map((x) => x.id === it.id ? { ...x, quantity: x.quantity + 1 } : x);
      return [...c, { ...it, quantity: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((c) =>
      c.map((x) => x.id === id ? { ...x, quantity: Math.max(0, x.quantity + delta) } : x).filter((x) => x.quantity > 0)
    );
  };

  const removeItem = (id: string) => setCart((c) => c.filter((x) => x.id !== id));

  const submit = async () => {
    if (cart.length === 0 || !restaurant) return;
    setSubmitting(true);
    try {
      const orderItems = cart.map((c) => ({ id: c.id, name: c.name, price: c.price, quantity: c.quantity }));
      const { data: inserted, error } = await supabase
        .from("orders")
        .insert({
          restaurant_id: restaurant.id,
          table_number: tableNumber || null,
          customer_name: name || null,
          customer_phone: phone || null,
          items: orderItems,
          total: total,
          notes: notes || null,
          status: "pending",
          payment_status: "pending",
        })
        .select("id")
        .single();

      if (error) throw new Error(error.message);
      toast.success(t("order.placed"));
      setCart([]);
      localStorage.removeItem(cartKey);
      navigate({ to: "/order/$orderId", params: { orderId: inserted.id } });
    } catch (e: any) {
      toast.error(e.message ?? "Error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center">
        <div>
          <h1 className="font-display text-3xl mb-2">Restaurantul nu a fost găsit</h1>
          <Link to="/" className="text-primary underline">← Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-warm pb-32">
      <header className="bg-card border-b border-border sticky top-0 z-20">
        <div className="container mx-auto max-w-3xl px-4 py-4 flex items-center gap-3">
          {restaurant.logo_url ? (
            <img src={restaurant.logo_url} alt={restaurant.name} className="h-12 w-12 rounded-lg object-cover" />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-gradient-hero" />
          )}
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-xl truncate">{restaurant.name}</h1>
            {tableNumber && <p className="text-xs text-muted-foreground">Masa {tableNumber}</p>}
          </div>
          <LangSwitch />
        </div>
      </header>

      <div className="container mx-auto max-w-3xl px-4 py-6">
        {categories.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">Niciun produs disponibil momentan</div>
        )}
        {categories.map((cat) => (
          <section key={cat.id} className="mb-8">
            <h2 className="font-display text-2xl mb-3">{cat.name}</h2>
            <div className="grid gap-3">
              {cat.items.map((it) => (
                <div key={it.id} className="flex gap-3 p-3 bg-card rounded-xl border border-border shadow-soft">
                  {it.image_url ? (
                    <img src={it.image_url} alt={it.name} className="h-20 w-20 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="h-20 w-20 rounded-lg bg-muted grid place-items-center flex-shrink-0">
                      <ImageOff className="h-5 w-5 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{it.name}</div>
                    {it.description && <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{it.description}</div>}
                    <div className="mt-1.5 flex items-center justify-between">
                      <div className="font-semibold text-primary">{formatMDL(it.price, lang)}</div>
                      <Button size="sm" onClick={() => addToCart({ id: it.id, name: it.name, price: it.price, image_url: it.image_url })}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {count > 0 && (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 bg-primary text-primary-foreground rounded-full shadow-warm h-14 px-6 flex items-center gap-3 font-medium">
              <ShoppingBag className="h-5 w-5" />
              <span>{count} · {formatMDL(total, lang)}</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[90vh] overflow-y-auto rounded-t-2xl">
            <SheetHeader>
              <SheetTitle className="font-display text-2xl">Coșul meu</SheetTitle>
            </SheetHeader>
            <div className="space-y-3 mt-4">
              {cart.map((c) => (
                <div key={c.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{c.name}</div>
                    <div className="text-sm text-muted-foreground">{formatMDL(c.price, lang)}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQty(c.id, -1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm">{c.quantity}</span>
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQty(c.id, 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => removeItem(c.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-3">
              <div>
                <label className="text-sm font-medium">Numărul mesei</label>
                <Input value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} placeholder="12" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Numele tău <span className="text-xs text-muted-foreground">(opțional)</span></label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Telefon <span className="text-xs text-muted-foreground">(opțional)</span></label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Observații <span className="text-xs text-muted-foreground">(opțional)</span></label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Total</div>
                <div className="font-display text-2xl">{formatMDL(total, lang)}</div>
              </div>
              <Button size="lg" onClick={submit} disabled={submitting || cart.length === 0} className="bg-gradient-hero shadow-warm">
                {submitting ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Se plasează...</> : "Plasează comanda"}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}