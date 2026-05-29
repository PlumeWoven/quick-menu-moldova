import { Languages } from "lucide-react";
import { useI18n, type Lang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export function LangSwitch({ className }: { className?: string }) {
  const { lang, setLang } = useI18n();
  const other: Lang = lang === "ro" ? "ru" : "ro";
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLang(other)}
      className={className}
      aria-label="Switch language"
    >
      <Languages className="h-4 w-4 mr-1" />
      <span className="font-medium uppercase">{lang}</span>
    </Button>
  );
}
