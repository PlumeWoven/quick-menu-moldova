import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Lang = "ro" | "ru";

type Dict = Record<string, string>;

const ro: Dict = {
  // common
  "app.name": "MenuQR",
  "app.tagline": "Meniu digital pentru restaurante din Moldova",
  "nav.features": "Funcții",
  "nav.pricing": "Prețuri",
  "nav.login": "Autentificare",
  "nav.getStarted": "Începe gratuit",
  "lang.switch": "Limbă",
  "common.loading": "Se încarcă...",
  "common.save": "Salvează",
  "common.cancel": "Anulează",
  "common.delete": "Șterge",
  "common.edit": "Editează",
  "common.add": "Adaugă",
  "common.back": "Înapoi",
  "common.confirm": "Confirmă",
  "common.optional": "opțional",
  "common.search": "Caută",
  "common.total": "Total",
  "common.status": "Status",
  "common.actions": "Acțiuni",
  "common.yes": "Da",
  "common.no": "Nu",

  // landing
  "landing.hero.eyebrow": "QR Menu • Made in Moldova",
  "landing.hero.title": "Meniul restaurantului tău,\nla o scanare distanță.",
  "landing.hero.subtitle":
    "Clienții scanează codul QR de pe masă, comandă direct și plătesc. Tu primești comenzile în timp real.",
  "landing.hero.cta": "Începe gratuit",
  "landing.hero.demo": "Vezi demo",
  "landing.features.title": "Tot ce ai nevoie ca să servești mai repede",
  "landing.f1.title": "Cod QR per masă",
  "landing.f1.body": "Generează coduri QR cu numărul mesei pre-completat. Imprimă, lipește, gata.",
  "landing.f2.title": "Comenzi în timp real",
  "landing.f2.body": "Comenzile apar instant pe panoul de administrare. Schimbi statusul cu un click.",
  "landing.f3.title": "Editor de meniu simplu",
  "landing.f3.body": "Adaugă categorii, produse, fotografii și prețuri. Activează/dezactivează cu un click.",
  "landing.f4.title": "Bilingv RO/RU",
  "landing.f4.body": "Toată interfața în română și rusă, pentru toți clienții tăi din Moldova.",
  "landing.pricing.title": "Prețuri simple",
  "landing.pricing.basic": "Basic",
  "landing.pricing.basicPrice": "Gratuit",
  "landing.pricing.basicDesc": "Până la 50 de produse, comenzi nelimitate",
  "landing.pricing.pro": "Pro",
  "landing.pricing.proPrice": "299 MDL/lună",
  "landing.pricing.proDesc": "Produse nelimitate, analiză avansată, suport prioritar",
  "landing.cta.title": "Gata să modernizezi restaurantul?",
  "landing.cta.body": "Configurare în 5 minute. Fără card de credit.",

  // menu
  "menu.add": "Adaugă",
  "menu.cart": "Coș",
  "menu.cart.empty": "Coșul este gol",
  "menu.cart.title": "Comanda ta",
  "menu.cart.table": "Numărul mesei",
  "menu.cart.name": "Numele tău",
  "menu.cart.phone": "Telefon",
  "menu.cart.notes": "Note pentru bucătărie",
  "menu.cart.place": "Plasează comanda",
  "menu.cart.placing": "Se trimite...",
  "menu.unavailable": "Indisponibil",
  "menu.notFound": "Restaurantul nu a fost găsit",
  "menu.empty": "Meniul este în curs de actualizare",
  "menu.qty": "Cantitate",

  // order status
  "order.status.title": "Comanda ta",
  "order.status.pending": "Așteaptă confirmare",
  "order.status.confirmed": "Confirmată",
  "order.status.preparing": "Se prepară",
  "order.status.ready": "Gata de servit",
  "order.status.completed": "Servită",
  "order.status.cancelled": "Anulată",
  "order.placed": "Comanda a fost plasată!",
  "order.id": "ID comandă",
  "order.table": "Masă",

  // admin
  "admin.login.title": "Conectare administrator",
  "admin.login.email": "Email",
  "admin.login.password": "Parolă",
  "admin.login.signin": "Conectare",
  "admin.login.signup": "Creează cont",
  "admin.login.toSignup": "Nu ai cont? Înregistrează-te",
  "admin.login.toSignin": "Ai deja cont? Conectează-te",
  "admin.login.success": "Bine ai venit!",
  "admin.signup.success": "Cont creat! Verifică emailul pentru confirmare.",

  "admin.nav.dashboard": "Panou",
  "admin.nav.menu": "Meniu",
  "admin.nav.orders": "Comenzi",
  "admin.nav.analytics": "Statistici",
  "admin.nav.settings": "Setări",
  "admin.nav.logout": "Deconectare",
  "admin.nav.viewMenu": "Vezi meniul public",

  "admin.dashboard.title": "Bună ziua",
  "admin.dashboard.ordersToday": "Comenzi azi",
  "admin.dashboard.revenueToday": "Venit azi",
  "admin.dashboard.activeItems": "Produse active",
  "admin.dashboard.recent": "Comenzi recente",
  "admin.dashboard.noOrders": "Nicio comandă încă",

  "admin.menu.title": "Editor meniu",
  "admin.menu.addCategory": "Adaugă categorie",
  "admin.menu.addItem": "Adaugă produs",
  "admin.menu.categoryName": "Nume categorie",
  "admin.menu.itemName": "Nume produs",
  "admin.menu.description": "Descriere",
  "admin.menu.price": "Preț (MDL)",
  "admin.menu.image": "Imagine",
  "admin.menu.upload": "Încarcă",
  "admin.menu.available": "Disponibil",
  "admin.menu.prepTime": "Timp pregătire (min)",
  "admin.menu.noCategories": "Începe prin a adăuga prima categorie.",
  "admin.menu.confirmDeleteCat": "Sigur ștergi categoria și toate produsele ei?",
  "admin.menu.confirmDeleteItem": "Sigur ștergi acest produs?",

  "admin.orders.title": "Comenzi",
  "admin.orders.filter.all": "Toate",
  "admin.orders.filter.active": "Active",
  "admin.orders.markPaid": "Marchează plătit",

  "admin.settings.title": "Setări restaurant",
  "admin.settings.name": "Nume restaurant",
  "admin.settings.slug": "URL public (slug)",
  "admin.settings.address": "Adresă",
  "admin.settings.phone": "Telefon",
  "admin.settings.logo": "Logo",
  "admin.settings.publicUrl": "URL public meniu",
  "admin.settings.qr": "Cod QR",
  "admin.settings.qr.download": "Descarcă QR (PNG)",
  "admin.settings.subscription": "Abonament",
  "admin.settings.theme": "Temă meniu public",
  "admin.settings.theme.light": "Luminos",
  "admin.settings.theme.dark": "Întunecat",
  "admin.settings.saved": "Setări salvate",

  "admin.analytics.title": "Statistici",
  "admin.analytics.last7": "Ultimele 7 zile",
  "admin.analytics.topItems": "Cele mai vândute produse",
  "admin.analytics.totalOrders": "Total comenzi",
  "admin.analytics.totalRevenue": "Venit total",
  "admin.analytics.avgOrder": "Comandă medie",
};

const ru: Dict = {
  "app.name": "MenuQR",
  "app.tagline": "Цифровое меню для ресторанов Молдовы",
  "nav.features": "Функции",
  "nav.pricing": "Цены",
  "nav.login": "Вход",
  "nav.getStarted": "Начать бесплатно",
  "lang.switch": "Язык",
  "common.loading": "Загрузка...",
  "common.save": "Сохранить",
  "common.cancel": "Отмена",
  "common.delete": "Удалить",
  "common.edit": "Изменить",
  "common.add": "Добавить",
  "common.back": "Назад",
  "common.confirm": "Подтвердить",
  "common.optional": "необязательно",
  "common.search": "Поиск",
  "common.total": "Итого",
  "common.status": "Статус",
  "common.actions": "Действия",
  "common.yes": "Да",
  "common.no": "Нет",

  "landing.hero.eyebrow": "QR Меню • Сделано в Молдове",
  "landing.hero.title": "Меню вашего ресторана —\nв одно сканирование.",
  "landing.hero.subtitle":
    "Клиенты сканируют QR-код на столе, заказывают и оплачивают. Вы получаете заказы в реальном времени.",
  "landing.hero.cta": "Начать бесплатно",
  "landing.hero.demo": "Смотреть демо",
  "landing.features.title": "Всё, чтобы обслуживать быстрее",
  "landing.f1.title": "QR-код для каждого стола",
  "landing.f1.body": "Создавайте QR-коды с номером стола. Распечатайте, наклейте — готово.",
  "landing.f2.title": "Заказы в реальном времени",
  "landing.f2.body": "Заказы появляются мгновенно. Меняйте статус одним кликом.",
  "landing.f3.title": "Простой редактор меню",
  "landing.f3.body": "Категории, блюда, фото, цены. Включение/отключение одним кликом.",
  "landing.f4.title": "Двуязычный RO/RU",
  "landing.f4.body": "Весь интерфейс на румынском и русском — для всех клиентов Молдовы.",
  "landing.pricing.title": "Простые цены",
  "landing.pricing.basic": "Базовый",
  "landing.pricing.basicPrice": "Бесплатно",
  "landing.pricing.basicDesc": "До 50 позиций, безлимит заказов",
  "landing.pricing.pro": "Pro",
  "landing.pricing.proPrice": "299 MDL/мес",
  "landing.pricing.proDesc": "Безлимит позиций, продвинутая аналитика, приоритетная поддержка",
  "landing.cta.title": "Готовы модернизировать ресторан?",
  "landing.cta.body": "Настройка за 5 минут. Без карты.",

  "menu.add": "Добавить",
  "menu.cart": "Корзина",
  "menu.cart.empty": "Корзина пуста",
  "menu.cart.title": "Ваш заказ",
  "menu.cart.table": "Номер стола",
  "menu.cart.name": "Ваше имя",
  "menu.cart.phone": "Телефон",
  "menu.cart.notes": "Заметки для кухни",
  "menu.cart.place": "Оформить заказ",
  "menu.cart.placing": "Отправка...",
  "menu.unavailable": "Недоступно",
  "menu.notFound": "Ресторан не найден",
  "menu.empty": "Меню обновляется",
  "menu.qty": "Количество",

  "order.status.title": "Ваш заказ",
  "order.status.pending": "Ожидает подтверждения",
  "order.status.confirmed": "Подтверждён",
  "order.status.preparing": "Готовится",
  "order.status.ready": "Готов к подаче",
  "order.status.completed": "Подан",
  "order.status.cancelled": "Отменён",
  "order.placed": "Заказ оформлен!",
  "order.id": "ID заказа",
  "order.table": "Стол",

  "admin.login.title": "Вход для администратора",
  "admin.login.email": "Email",
  "admin.login.password": "Пароль",
  "admin.login.signin": "Войти",
  "admin.login.signup": "Создать аккаунт",
  "admin.login.toSignup": "Нет аккаунта? Зарегистрируйтесь",
  "admin.login.toSignin": "Уже есть аккаунт? Войдите",
  "admin.login.success": "Добро пожаловать!",
  "admin.signup.success": "Аккаунт создан! Проверьте email.",

  "admin.nav.dashboard": "Панель",
  "admin.nav.menu": "Меню",
  "admin.nav.orders": "Заказы",
  "admin.nav.analytics": "Статистика",
  "admin.nav.settings": "Настройки",
  "admin.nav.logout": "Выйти",
  "admin.nav.viewMenu": "Открыть публичное меню",

  "admin.dashboard.title": "Здравствуйте",
  "admin.dashboard.ordersToday": "Заказы сегодня",
  "admin.dashboard.revenueToday": "Выручка сегодня",
  "admin.dashboard.activeItems": "Активные позиции",
  "admin.dashboard.recent": "Последние заказы",
  "admin.dashboard.noOrders": "Заказов пока нет",

  "admin.menu.title": "Редактор меню",
  "admin.menu.addCategory": "Добавить категорию",
  "admin.menu.addItem": "Добавить позицию",
  "admin.menu.categoryName": "Название категории",
  "admin.menu.itemName": "Название позиции",
  "admin.menu.description": "Описание",
  "admin.menu.price": "Цена (MDL)",
  "admin.menu.image": "Изображение",
  "admin.menu.upload": "Загрузить",
  "admin.menu.available": "Доступно",
  "admin.menu.prepTime": "Время приготовления (мин)",
  "admin.menu.noCategories": "Начните с добавления первой категории.",
  "admin.menu.confirmDeleteCat": "Удалить категорию и все её позиции?",
  "admin.menu.confirmDeleteItem": "Удалить эту позицию?",

  "admin.orders.title": "Заказы",
  "admin.orders.filter.all": "Все",
  "admin.orders.filter.active": "Активные",
  "admin.orders.markPaid": "Отметить оплаченным",

  "admin.settings.title": "Настройки ресторана",
  "admin.settings.name": "Название ресторана",
  "admin.settings.slug": "Публичный URL (slug)",
  "admin.settings.address": "Адрес",
  "admin.settings.phone": "Телефон",
  "admin.settings.logo": "Логотип",
  "admin.settings.publicUrl": "Публичный URL меню",
  "admin.settings.qr": "QR-код",
  "admin.settings.qr.download": "Скачать QR (PNG)",
  "admin.settings.subscription": "Подписка",
  "admin.settings.theme": "Тема публичного меню",
  "admin.settings.theme.light": "Светлая",
  "admin.settings.theme.dark": "Тёмная",
  "admin.settings.saved": "Настройки сохранены",

  "admin.analytics.title": "Статистика",
  "admin.analytics.last7": "За 7 дней",
  "admin.analytics.topItems": "Самые продаваемые",
  "admin.analytics.totalOrders": "Всего заказов",
  "admin.analytics.totalRevenue": "Общая выручка",
  "admin.analytics.avgOrder": "Средний заказ",
};

const dicts: Record<Lang, Dict> = { ro, ru };

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ro");

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? (localStorage.getItem("lang") as Lang | null)
        : null;
    if (stored === "ro" || stored === "ru") setLangState(stored);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("lang", l);
  };

  const t = (key: string) => dicts[lang][key] ?? key;

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n outside provider");
  return ctx;
}

export function useT() {
  return useI18n().t;
}

export function formatMDL(value: number, lang: Lang = "ro") {
  return new Intl.NumberFormat(lang === "ru" ? "ru-MD" : "ro-MD", {
    style: "currency",
    currency: "MDL",
    minimumFractionDigits: 2,
  }).format(value);
}
