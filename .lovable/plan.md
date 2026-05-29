# QR Menu System for Moldova — Build Plan

Tech mapping from your spec → this template:
- TanStack Start (React 19 + Vite) instead of Next.js
- Lovable Cloud (= Supabase under the hood) for DB, Auth, Storage, Realtime
- `createServerFn` + `src/routes/api/public/*` instead of Next route handlers
- `_authenticated` layout route + `beforeLoad` session gate instead of `middleware.ts`
- Romanian + Russian language toggle (persisted to localStorage)

## 1. Foundation
- Enable Lovable Cloud
- Migrations: `restaurants`, `categories`, `items`, `orders` tables + indexes
- RLS policies (public read on active rows; admin owns rows via `admin_id = auth.uid()`; public can INSERT orders only)
- Trigger to auto-create a `restaurants` row on signup (slug derived from email)
- Storage bucket `menu-images` (public read, authenticated write)
- Enable Realtime publication on `orders`

## 2. Design system & i18n
- Warm Mediterranean palette (terracotta + cream + sage) defined in `src/styles.css` as oklch tokens
- Typography: Instrument Serif (display) + Inter (body)
- `LanguageProvider` context + `useT()` hook, RO default, RU toggle, persisted

## 3. Public routes
- `/` — marketing landing (hero, features, pricing tiers, CTA to admin signup)
- `/menu/$slug` — customer menu (categories, items, cart in localStorage, table from `?table=`, customer name/phone, place order)
- `/order/$orderId` — live order status subscribed via Realtime

## 4. Auth + protected admin
- `/admin/login` — email/password + signup (Supabase Auth)
- `_authenticated` layout with session gate
- `/admin/dashboard` — today's orders, revenue, items count, recent orders + realtime
- `/admin/menu` — categories & items CRUD, image upload, availability toggle, reorder, bulk actions
- `/admin/orders` — full list, status transitions, filters, realtime
- `/admin/settings` — restaurant profile, logo upload, QR code download (PNG via `qrcode`)
- `/admin/analytics` — orders/revenue charts (Recharts), top items

## 5. Server functions (instead of Next API routes)
- `createOrder` (public, validates with Zod, inserts via admin client)
- `updateOrderStatus` (auth-protected)
- `getRestaurantOrders` (auth-protected)
- `upsertMenu` (auth-protected, bulk)
- `uploadImage` handled via direct Supabase Storage from client (authenticated)
- `getRestaurantBySlug` (public)

## 6. Polish
- Toaster for feedback, loading & empty states, mobile-first menu page, SEO `head()` per route, sitemap + robots

## Technical notes
- Path params use `$param` (TanStack convention), e.g. `src/routes/menu.$slug.tsx`
- Public routes call public server fns (admin-elevated, scoped by slug) — never `requireSupabaseAuth` on public loaders
- All amounts in MDL (Moldovan Leu)
- Currency formatting via `Intl.NumberFormat('ro-MD', { style: 'currency', currency: 'MDL' })`

This is ~30+ files. I'll build it in one pass; expect a few minutes of tool calls.
