import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const OrderItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  quantity: z.number().int().min(1).max(99),
  price: z.number().min(0).max(100000),
  special_instructions: z.string().max(500).optional(),
});

const CreateOrderSchema = z.object({
  slug: z.string().min(1).max(100),
  table_number: z.string().max(20).optional().nullable(),
  customer_name: z.string().max(100).optional().nullable(),
  customer_phone: z.string().max(30).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  items: z.array(OrderItemSchema).min(1).max(50),
});

export const getRestaurantBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) =>
    z.object({ slug: z.string().min(1).max(100) }).parse(input),
  )
  .handler(async ({ data }) => {
    console.log("[getRestaurantBySlug] called with slug:", data.slug);

    const { data: restaurant, error } = await supabaseAdmin
      .from("restaurants")
      .select("id, name, slug, address, phone, logo_url, is_active")
      .eq("slug", data.slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("[getRestaurantBySlug] error fetching restaurant:", error);
      throw new Error(error.message);
    }

    console.log("[getRestaurantBySlug] restaurant found:", restaurant);

    if (!restaurant) {
      console.log("[getRestaurantBySlug] no restaurant found, returning empty");
      return { restaurant: null, categories: [] };
    }

    const { data: categories, error: cErr } = await supabaseAdmin
      .from("categories")
      .select("id, name, display_order, items(id, name, description, price, image_url, is_available, preparation_time_minutes, display_order)")
      .eq("restaurant_id", restaurant.id)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (cErr) {
      console.error("[getRestaurantBySlug] error fetching categories:", cErr);
      throw new Error(cErr.message);
    }

    console.log("[getRestaurantBySlug] categories count:", categories?.length);

    const normalized = (categories ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      display_order: c.display_order,
      items: ((c.items as any[]) ?? [])
        .filter((i) => i.is_available)
        .map((i) => ({
          id: i.id,
          name: i.name,
          description: i.description,
          price: Number(i.price),
          image_url: i.image_url,
          preparation_time_minutes: i.preparation_time_minutes,
          display_order: i.display_order,
        }))
        .sort((a, b) => a.display_order - b.display_order),
    }));

    console.log("[getRestaurantBySlug] returning restaurant and normalized categories");
    return { restaurant, categories: normalized };
  });

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CreateOrderSchema.parse(input))
  .handler(async ({ data }) => {
    const { data: restaurant, error: rErr } = await supabaseAdmin
      .from("restaurants")
      .select("id, is_active")
      .eq("slug", data.slug)
      .maybeSingle();
    if (rErr) throw new Error(rErr.message);
    if (!restaurant || !restaurant.is_active) throw new Error("Restaurant not available");

    const total = data.items.reduce((s, it) => s + it.price * it.quantity, 0);

    const { data: inserted, error: oErr } = await supabaseAdmin
      .from("orders")
      .insert({
        restaurant_id: restaurant.id,
        table_number: data.table_number || null,
        customer_name: data.customer_name || null,
        customer_phone: data.customer_phone || null,
        items: data.items as any,
        total,
        notes: data.notes || null,
        status: "pending",
        payment_status: "pending",
      })
      .select("id")
      .single();
    if (oErr) throw new Error(oErr.message);
    return { id: inserted.id };
  });

export const getOrder = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id, table_number, items, total, status, payment_status, created_at, restaurant:restaurants(name, slug)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { order };
  });