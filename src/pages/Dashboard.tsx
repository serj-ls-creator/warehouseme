import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useItems, useCategories, useLocations, getLocationPath, getCurrencySymbol } from "@/hooks/useData";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Package, DollarSign, Clock, CalendarPlus } from "lucide-react";
import { isEmoji } from "@/lib/isEmoji";
import { differenceInDays, startOfMonth } from "date-fns";
import { formatNumberByLocale, useI18n } from "@/hooks/usePreferences";

const Dashboard = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { data: items, isLoading } = useItems({ search: search || undefined });
  const { data: locations } = useLocations();
  const { locale, t } = useI18n();

  const now = new Date();
  const thisMonth = startOfMonth(now);

  const totalItems = items?.length ?? 0;
  const totalValue = items?.reduce((sum, item) => sum + (item.price ?? 0), 0) ?? 0;
  const addedThisMonth = items?.filter(i => new Date(i.created_at) >= thisMonth).length ?? 0;

  const expiringItems = items?.filter(i => {
    if (!i.warranty_expires) return false;
    const days = differenceInDays(new Date(i.warranty_expires), now);
    return days <= 90;
  }).sort((a, b) => new Date(a.warranty_expires!).getTime() - new Date(b.warranty_expires!).getTime()) ?? [];

  const recentItems = items?.slice(0, 4) ?? [];

  const getExpiryBadge = (expiresDate: string) => {
    const days = differenceInDays(new Date(expiresDate), now);
    if (days < 0) return { label: t("dashboard.expired"), variant: "destructive" as const, color: "border-destructive text-destructive" };
    if (days < 7) return { label: `${days} ${t("dashboard.daysShort")}`, variant: "destructive" as const, color: "border-destructive text-destructive" };
    if (days < 30) return { label: `${days} ${t("dashboard.daysShort")}`, variant: "warning" as const, color: "border-warning text-warning" };
    return { label: `${days} ${t("dashboard.daysShort")}`, variant: "success" as const, color: "border-success text-success" };
  };

  const stats = [
    { label: t("dashboard.totalItems"), value: totalItems, icon: Package, iconClassName: "text-primary", cardClassName: "bg-stat-blue", onClick: () => navigate("/items") },
    { label: t("dashboard.totalValue"), value: `${formatNumberByLocale(totalValue, locale)} ₴`, icon: DollarSign, iconClassName: "text-success", cardClassName: "bg-stat-green", onClick: () => navigate("/finance") },
    { label: t("dashboard.expiry"), value: expiringItems.length, icon: Clock, iconClassName: "text-warning", cardClassName: "bg-stat-yellow", onClick: () => navigate("/expiry") },
    { label: t("dashboard.thisMonth"), value: addedThisMonth, icon: CalendarPlus, iconClassName: "text-foreground", cardClassName: "bg-stat-purple", onClick: undefined },
  ];

  return (
    <AppLayout>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input placeholder={t("dashboard.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-11 h-12 text-base bg-card" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className={`animate-fade-in border-transparent ${stat.cardClassName} ${stat.onClick ? "cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]" : ""}`}
            onClick={stat.onClick}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-xl bg-background/60">
                  <stat.icon className={`h-6 w-6 ${stat.iconClassName}`} />
                </div>
              </div>
              {isLoading ? (
                <Skeleton className="h-10 w-24 mb-1" />
              ) : (
                <p className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">{stat.value}</p>
              )}
              <span className="text-xs font-medium text-muted-foreground mt-1 block">{stat.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {expiringItems.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">⏰ {t("dashboard.expiringTitle")}</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/expiry")}>{t("dashboard.viewAll")}</Button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {expiringItems.map((item) => {
              const badge = getExpiryBadge(item.warranty_expires!);
              return (
                <Card key={item.id} className="min-w-[200px] cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/items/${item.id}`)}>
                  <CardContent className="p-4">
                    <div className="w-full h-24 bg-muted rounded-lg flex items-center justify-center mb-3">
                      {item.photo_url && !isEmoji(item.photo_url) ? (
                        <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <span className="text-3xl">{isEmoji(item.photo_url) ? item.photo_url : (item.categories?.icon ?? "📦")}</span>
                      )}
                    </div>
                    <p className="font-medium text-sm text-foreground truncate">{item.name}</p>
                    <Badge
                      variant={badge.variant === "warning" ? "outline" : badge.variant === "success" ? "secondary" : "destructive"}
                      className={badge.variant === "warning" ? `${badge.color} mt-1` : "mt-1"}
                    >
                      {badge.label}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">📦 {t("dashboard.recentTitle")}</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate("/items")}>{t("dashboard.viewAll")}</Button>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-40 rounded-lg" />)}
          </div>
        ) : recentItems.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {recentItems.map((item) => {
              const locationBreadcrumb = item.location_id && locations
                ? getLocationPath(item.location_id, locations).map(l => `${l.icon ?? "📍"} ${l.name}`).join(" → ")
                : null;
              return (
                <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow animate-fade-in" onClick={() => navigate(`/items/${item.id}`)}>
                  <CardContent className="p-3">
                    <div className="w-full h-24 bg-muted rounded-lg flex items-center justify-center mb-2">
                      {item.photo_url && !isEmoji(item.photo_url) ? (
                        <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <span className="text-3xl">{isEmoji(item.photo_url) ? item.photo_url : (item.categories?.icon ?? "📦")}</span>
                      )}
                    </div>
                    <p className="font-medium text-sm text-foreground truncate">{item.name}</p>
                    {locationBreadcrumb && (
                      <p className="text-xs text-muted-foreground truncate">{locationBreadcrumb}</p>
                    )}
                    {item.price && (
                      <p className="text-sm font-semibold text-foreground mt-1">{formatNumberByLocale(item.price, locale)} {getCurrencySymbol(item.currency)}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-3">{t("dashboard.noItems")}</p>
              <Button onClick={() => navigate("/items/new")}>
                <Plus className="h-4 w-4 mr-2" /> {t("dashboard.addFirstItem")}
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      <Button
        onClick={() => navigate("/items/new")}
        className="fixed bottom-24 md:bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-accent text-accent-foreground hover:bg-accent/90 z-40"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </AppLayout>
  );
};

export default Dashboard;
