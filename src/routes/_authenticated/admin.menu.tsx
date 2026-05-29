import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n, useT, formatMDL } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/admin/menu")({
  component: MenuEditor,
});

function MenuEditor() {
  const { user } = useAuth();
  const t = useT();
  const { lang } = useI18n();
  const qc = useQueryClient();

  const { data: restaurant } = useQuery({
    queryKey: ["my-restaurant", user?.id],
    enabled: !!user?.id,
    queryFn: async () => (await supabase.from("restaurants").select("*").eq("admin_id", user!.id).maybeSingle()).data,
  });

  const { data: categories, refetch } = useQuery({
    queryKey: ["categories", restaurant?.id],
    enabled: !!restaurant?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("*, items(*)")
        .eq("restaurant_id", restaurant!.id)
        .order("display_order");
      return data ?? [];
    },
  });

  const [newCat, setNewCat] = useState("");

  const addCategory = async () => {
    if (!newCat.trim() || !restaurant) return;
    const { error } = await supabase.from("categories").insert({ restaurant_id: restaurant.id, name: newCat.trim(), display_order: (categories?.length ?? 0) });
    if (error) toast.error(error.message); else { setNewCat(""); refetch(); }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm(t("admin.menu.confirmDeleteCat"))) return;
    await supabase.from("categories").delete().eq("id", id);
    refetch();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="font-display text-3xl mb-6">{t("admin.menu.title")}</h1>

      <div className="bg-card border border-border rounded-2xl p-4 mb-6 flex gap-2">
        <Input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder={t("admin.menu.categoryName")} />
        <Button onClick={addCategory} className="bg-gradient-hero shrink-0"><Plus className="h-4 w-4 mr-1" /> {t("admin.menu.addCategory")}</Button>
      </div>

      {(!categories || categories.length === 0) && (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">{t("admin.menu.noCategories")}</div>
      )}

      <div className="space-y-6">
        {categories?.map((cat) => (
          <CategoryBlock key={cat.id} cat={cat} onChange={refetch} onDelete={() => deleteCategory(cat.id)} lang={lang} t={t} />
        ))}
      </div>
    </div>
  );
}

function CategoryBlock({ cat, onChange, onDelete, lang, t }: any) {
  const items = (cat.items ?? []).sort((a: any, b: any) => a.display_order - b.display_order);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", description: "", price: "" });
  const [uploading, setUploading] = useState(false);

  const addItem = async () => {
    if (!draft.name || !draft.price) return;
    const { error } = await supabase.from("items").insert({
      category_id: cat.id,
      name: draft.name,
      description: draft.description || null,
      price: Number(draft.price),
      display_order: items.length,
    });
    if (error) toast.error(error.message);
    else { setDraft({ name: "", description: "", price: "" }); setAdding(false); onChange(); }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-2xl">{cat.name}</h2>
        <Button variant="ghost" size="sm" onClick={onDelete}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>

      <div className="space-y-2">
        {items.map((it: any) => <ItemRow key={it.id} item={it} onChange={onChange} lang={lang} t={t} />)}
      </div>

      {adding ? (
        <div className="mt-4 p-3 border border-dashed border-border rounded-lg space-y-2">
          <Input placeholder={t("admin.menu.itemName")} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <Textarea rows={2} placeholder={t("admin.menu.description")} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          <div className="grid grid-cols-1 gap-2">
            <Input type="number" step="0.01" placeholder={t("admin.menu.price")} value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={addItem} className="bg-gradient-hero">{t("common.save")}</Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>{t("common.cancel")}</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="mt-4" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4 mr-1" /> {t("admin.menu.addItem")}
        </Button>
      )}
    </div>
  );
}

function ItemRow({ item, onChange, lang, t }: any) {
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const path = `${item.category_id}/${item.id}-${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("menu-images").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
      await supabase.from("items").update({ image_url: data.publicUrl }).eq("id", item.id);
      onChange();
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  };

  const toggleAvail = async (v: boolean) => {
    await supabase.from("items").update({ is_available: v }).eq("id", item.id);
    onChange();
  };
  const del = async () => {
    if (!confirm(t("admin.menu.confirmDeleteItem"))) return;
    await supabase.from("items").delete().eq("id", item.id);
    onChange();
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border">
      {item.image_url ? (
        <img src={item.image_url} alt="" className="h-12 w-12 rounded object-cover" />
      ) : (
        <label className="h-12 w-12 rounded bg-muted grid place-items-center cursor-pointer hover:bg-muted/70">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 text-muted-foreground" />}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </label>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{item.name}</div>
        {item.description && <div className="text-xs text-muted-foreground truncate">{item.description}</div>}
      </div>
      <div className="font-medium">{formatMDL(Number(item.price), lang)}</div>
      <Switch checked={item.is_available} onCheckedChange={toggleAvail} />
      <Button variant="ghost" size="icon" onClick={del}><Trash2 className="h-4 w-4 text-destructive" /></Button>
    </div>
  );
}
