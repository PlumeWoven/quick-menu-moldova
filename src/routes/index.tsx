import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, QrCode, Zap, Edit3, Languages, Check } from "lucide-react";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { LangSwitch } from "@/components/LangSwitch";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MenuQR — Meniu digital QR pentru restaurante din Moldova" },
      { name: "description", content: "Clienții scanează codul QR, comandă direct de la masă, tu primești comenzile în timp real. Setup în 5 minute. RO/RU." },
      { property: "og:title", content: "MenuQR — Meniu QR pentru restaurante" },
      { property: "og:description", content: "Comenzi în timp real, editor de meniu simplu, în română și rusă." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const t = useT();
  return (
    <div className="min-h-screen bg-gradient-warm">
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/60 sticky top-0 z-30">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-6xl">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-hero grid place-items-center text-primary-foreground">
              <QrCode className="h-5 w-5" />
            </div>
            <span className="font-display text-xl">{t("app.name")}</span>
          </Link>
          <div className="flex items-center gap-2">
            <LangSwitch />
            <Link to="/admin/login">
              <Button variant="ghost" size="sm">{t("nav.login")}</Button>
            </Link>
            <Link to="/admin/login" search={{ signup: true }}>
              <Button size="sm" className="bg-gradient-hero shadow-warm">
                {t("nav.getStarted")}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 max-w-6xl pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/15 text-accent-foreground text-xs font-medium mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          {t("landing.hero.eyebrow")}
        </div>
        <h1 className="font-display text-5xl md:text-7xl leading-[1.05] tracking-tight whitespace-pre-line">
          {t("landing.hero.title")}
        </h1>
        <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          {t("landing.hero.subtitle")}
        </p>
        <div className="mt-10 flex flex-wrap gap-3 justify-center">
          <Link to="/admin/login" search={{ signup: true }}>
            <Button size="lg" className="bg-gradient-hero shadow-warm h-12 px-6">
              {t("landing.hero.cta")} <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/menu/$slug" params={{ slug: "demo" }}>
            <Button size="lg" variant="outline" className="h-12 px-6">
              {t("landing.hero.demo")}
            </Button>
          </Link>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-6xl py-16">
        <h2 className="font-display text-3xl md:text-4xl text-center mb-12">
          {t("landing.features.title")}
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: QrCode, t: "landing.f1.title", b: "landing.f1.body" },
            { icon: Zap, t: "landing.f2.title", b: "landing.f2.body" },
            { icon: Edit3, t: "landing.f3.title", b: "landing.f3.body" },
            { icon: Languages, t: "landing.f4.title", b: "landing.f4.body" },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.t} className="p-6 rounded-2xl bg-card border border-border shadow-soft">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-xl mb-2">{t(f.t)}</h3>
                <p className="text-sm text-muted-foreground">{t(f.b)}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-4xl py-16">
        <h2 className="font-display text-3xl md:text-4xl text-center mb-12">
          {t("landing.pricing.title")}
        </h2>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="p-8 rounded-2xl bg-card border border-border">
            <div className="text-sm font-medium text-muted-foreground">{t("landing.pricing.basic")}</div>
            <div className="font-display text-4xl mt-2">{t("landing.pricing.basicPrice")}</div>
            <p className="text-sm text-muted-foreground mt-2">{t("landing.pricing.basicDesc")}</p>
          </div>
          <div className="p-8 rounded-2xl bg-gradient-hero text-primary-foreground shadow-warm">
            <div className="text-sm font-medium opacity-90">{t("landing.pricing.pro")}</div>
            <div className="font-display text-4xl mt-2">{t("landing.pricing.proPrice")}</div>
            <p className="text-sm opacity-90 mt-2">{t("landing.pricing.proDesc")}</p>
            <ul className="mt-4 space-y-1 text-sm">
              {["Unlimited items", "Analytics", "Priority support"].map((x) => (
                <li key={x} className="flex items-center gap-2"><Check className="h-4 w-4" /> {x}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-3xl py-20 text-center">
        <h2 className="font-display text-4xl md:text-5xl">{t("landing.cta.title")}</h2>
        <p className="mt-4 text-muted-foreground">{t("landing.cta.body")}</p>
        <Link to="/admin/login" search={{ signup: true }} className="inline-block mt-8">
          <Button size="lg" className="bg-gradient-hero shadow-warm h-12 px-8">
            {t("landing.hero.cta")} <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </section>

      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 max-w-6xl text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} MenuQR · {t("app.tagline")}
        </div>
      </footer>
    </div>
  );
}
