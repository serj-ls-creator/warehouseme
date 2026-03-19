import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useItems, useCategories, useLocations } from "@/hooks/useData";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Package, DollarSign, Shield, CalendarPlus } from "lucide-react";
import { differenceInDays, format, startOfMonth } from "date-fns";

const Dashboard = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { data: items, isLoading } = useItems({ search: search || undefined });
  const { data: categories } = useCategories();
  const { data: locations } = useLocations();

  const now = new Date();
  const thisMonth = startOfMonth(now);

  const totalItems = items?.length ?? 0;
  const totalValue = items?.reduce((sum, item) => sum + (item.price ?? 0), 0) ?? 0;
  const addedThisMonth = items?.filter(i => new Date(i.created_at) >= thisMonth).length ?? 0;

  const expiringWarranties = items?.filter(i => {
    if (!i.warranty_expires) return false;
    const days = differenceInDays(new Date(i.warranty_expires), now);
    return days >= 0 && days <= 30;
  }) ?? [];

  const recentItems = items?.slice(0, 4) ?? [];

  const getWarrantyBadge = (expiresDate: string) => {
    const days = differenceInDays(new Date(expiresDate), now);
    if (days < 7) return { label: `${days} дн.`, variant: "destructive" as const };
    if (days < 30) return { label: `${days} дн.`, variant: "warning" as const };
    return { label: `${days} дн.`, variant: "success" as const };
  };

  const stats = [
    { label: "Всего вещей", value: totalItems, icon: Package, color: "text-primary" },
    { label: "Общая стоимость", value: `${totalValue.toLocaleString("ru")} ₽`, icon: DollarSign, color: "text-success" },
    { label: "Гарантий истекает", value: expiringWarranties.length, icon: Shield, color: "text-warning" },
    { label: "Добавлено в этом месяце", value: addedThisMonth, icon: CalendarPlus, color: "text-accent" },
  ];

  return (
    <AppLayout>
      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Поиск по всем вещам..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-11 h-12 text-base bg-card"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} className="animate-fade-in">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              {isLoading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Expiring Warranties */}
      {expiringWarranties.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">🛡️ Гарантии истекают</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/warranties")}>
              Все →
            </Button>
          </div>
          <div className="flex gap-3 overflow-x-auto scroll-snap-x pb-2">
            {expiringWarranties.map((item) => {
              const badge = getWarrantyBadge(item.warranty_expires!);
              return (
                <Card
                  key={item.id}
                  className="min-w-[200px] cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/items/${item.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="w-full h-24 bg-muted rounded-lg flex items-center justify-center mb-3">
                      {item.photo_url ? (
                        <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <span className="text-3xl">{item.categories?.icon ?? "📦"}</span>
                      )}
                    </div>
                    <p className="font-medium text-sm text-foreground truncate">{item.name}</p>
                    <Badge
                      variant={badge.variant === "warning" ? "outline" : badge.variant === "success" ? "secondary" : "destructive"}
                      className={badge.variant === "warning" ? "border-warning text-warning mt-1" : "mt-1"}
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

      {/* Recently Added */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">📦 Недавно добавленные</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate("/items")}>
            Все →
          </Button>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))}
          </div>
        ) : recentItems.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {recentItems.map((item) => (
              <Card
                key={item.id}
                className="cursor-pointer hover:shadow-md transition-shadow animate-fade-in"
                onClick={() => navigate(`/items/${item.id}`)}
              >
                <CardContent className="p-3">
                  <div className="w-full h-24 bg-muted rounded-lg flex items-center justify-center mb-2">
                    {item.photo_url ? (
                      <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <span className="text-3xl">{item.categories?.icon ?? "📦"}</span>
                    )}
                  </div>
                  <p className="font-medium text-sm text-foreground truncate">{item.name}</p>
                  {item.locations && (
                    <p className="text-xs text-muted-foreground truncate">
                      {item.locations.icon} {item.locations.name}
                    </p>
                  )}
                  {item.price && (
                    <p className="text-sm font-semibold text-foreground mt-1">
                      {item.price.toLocaleString("ru")} ₽
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-3">Пока нет вещей</p>
              <Button onClick={() => navigate("/items/new")}>
                <Plus className="h-4 w-4 mr-2" /> Добавить первую вещь
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      {/* FAB */}
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
