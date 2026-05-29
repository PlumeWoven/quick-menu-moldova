import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LangSwitch } from "@/components/LangSwitch";

export const Route = createFileRoute("/admin/login")({
  validateSearch: (s) => z.object({ signup: z.boolean().optional() }).parse(s),
  component: LoginPage,
});

function LoginPage() {
  const t = useT();
  const navigate = useNavigate();
  const { signup } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">(signup ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate({ to: "/admin/dashboard" });
    }
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/admin/dashboard` },
        });
        if (error) throw error;
        if (data.session) {
          toast.success(t("admin.signup.success"));
          navigate({ to: "/admin/dashboard" });
        } else {
          toast.success(t("admin.signup.checkEmail") || "Please check your email to confirm your account.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(t("admin.login.success"));
        navigate({ to: "/admin/dashboard" });
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-warm grid place-items-center px-4">
      <div className="absolute top-4 right-4"><LangSwitch /></div>
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2 justify-center mb-6">
          <div className="h-10 w-10 rounded-lg bg-gradient-hero grid place-items-center text-primary-foreground">
            <QrCode className="h-5 w-5" />
          </div>
          <span className="font-display text-2xl">MenuQR</span>
        </Link>
        <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
          <h1 className="font-display text-2xl mb-4">{t("admin.login.title")}</h1>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="text-sm font-medium">{t("admin.login.email")}</label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">{t("admin.login.password")}</label>
              <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full bg-gradient-hero" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {mode === "signup" ? t("admin.login.signup") : t("admin.login.signin")}
            </Button>
          </form>
          <button
            type="button"
            className="mt-3 text-sm text-muted-foreground hover:text-foreground w-full text-center"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? t("admin.login.toSignup") : t("admin.login.toSignin")}
          </button>
        </div>
      </div>
    </div>
  );
}
