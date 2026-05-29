import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import QRCode from "qrcode";
import { Download, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const t = useT();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", address: "", phone: "", logo_url: "", theme: "light" });
  const [qr, setQr] = useState("");

  const { data: restaurant, refetch } = useQuery({
    queryKey: ["my-restaurant", user?.id],
    enabled: !!user?.id,
    queryFn: async () => (await supabase.from("restaurants").select("*").eq("admin_id", user!.id).maybeSingle()).data,
  });

  useEffect(() => {
    if (restaurant) {
      setForm({
        name: restaurant.name || "",
        slug: restaurant.slug || "",
        address: restaurant.address || "",
        phone: restaurant.phone || "",
        logo_url: restaurant.logo_url || "",
        theme: restaurant.theme || "light",
      });
    }
  }, [restaurant]);

  const publicUrl = typeof window !== "undefined" && form.slug ? `${window.location.origin}/menu/${form.slug}` : "";

  useEffect(() => {
    if (!publicUrl) return;
    QRCode.toDataURL(publicUrl, { width: 512, margin: 2, color: { dark: "#5a2f1c", light: "#fdfbf6" } }).then(setQr);
  }, [publicUrl]);

  const save = async () => {
    if (!restaurant) return;
    setSaving(true);
    const { error } = await supabase.from("restaurants").update({
      name: form.name, slug: form.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      address: form.address || null, phone: form.phone || null, logo_url: form.logo_url || null,
      theme: form.theme,
    }).eq("id", restaurant.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success(t("admin.settings.saved")); refetch(); }
  };

  const uploadLogo = async (file: File) => {
    const path = `logos/${restaurant!.id}-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("menu-images").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
    setForm((f) => ({ ...f, logo_url: data.publicUrl }));
  };

  const downloadQR = () => {
    if (!qr) return;
    const a = document.createElement("a");
    a.href = qr; a.download = `qr-${form.slug}.png`; a.click();
  };

  if (!restaurant) return <div className="p-6"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="font-display text-3xl mb-6">{t("admin.settings.title")}</h1>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-soft space-y-4 mb-6">
        <div>
          <label className="text-sm font-medium">{t("admin.settings.name")}</label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium">{t("admin.settings.slug")}</label>
          <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <p className="text-xs text-muted-foreground mt-1">{publicUrl}</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">{t("admin.settings.address")}</label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">{t("admin.settings.phone")}</label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium block mb-2">{t("admin.settings.logo")}</label>
          <div className="flex items-center gap-3">
            {form.logo_url && <img src={form.logo_url} alt="logo" className="h-14 w-14 rounded-lg object-cover" />}
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-background hover:bg-accent text-sm"><Upload className="h-4 w-4" /> {t("admin.menu.upload")}</span>
            </label>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">{t("admin.settings.theme")}</label>
          <select 
            value={form.theme} 
            onChange={(e) => setForm({ ...form, theme: e.target.value })}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="light">{t("admin.settings.theme.light")}</option>
            <option value="dark">{t("admin.settings.theme.dark")}</option>
          </select>
        </div>
        <Button onClick={save} disabled={saving} className="bg-gradient-hero">
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{t("common.save")}
        </Button>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
        <h2 className="font-display text-2xl mb-3">{t("admin.settings.qr")}</h2>
        <p className="text-sm text-muted-foreground mb-4">{t("admin.settings.publicUrl")}: <a href={publicUrl} target="_blank" rel="noreferrer" className="text-primary underline">{publicUrl}</a></p>
        {qr && (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <img src={qr} alt="QR" className="h-48 w-48 rounded-lg border border-border" />
            <Button onClick={downloadQR} className="bg-gradient-hero"><Download className="h-4 w-4 mr-2" /> {t("admin.settings.qr.download")}</Button>
          </div>
        )}
      </div>
    </div>
  );
}
