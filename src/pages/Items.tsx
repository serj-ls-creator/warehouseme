import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useItems, useCategories, useLocations, getLocationPath, getCategoryPath, getCurrencySymbol } from "@/hooks/useData";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, LayoutGrid, List, Package } from "lucide-react";
import { differenceInDays } from "date-fns";

const Items = () => {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const navigate = useNavigate();

  const { data: items, isLoading } = useItems({
    search: search || undefined,
    category_id: categoryFilter || undefined,
    location_id: locationFilter || undefined,
  });
  const { data: categories } = useCategories();
  const { data: locations } = useLocations();

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value === "all" ? "" : value);
  };

  const handleLocationChange = (value: string) => {
    setLocationFilter(value === "all" ? "" : value);
  };

  const sortedItems = [...(items ?? [])].sort((a, b) => {
    switch (sortBy) {
      case "name": return a.name.localeCompare(b.name);
      case "price": return (b.price ?? 0) - (a.price ?? 0);
      case "expiry": return (a.warranty_expires ?? "9999").localeCompare(b.warranty_expires ?? "9999");
      default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const now = new Date();

  const getExpiryBadge = (expiresDate: string | null) => {
    if (!expiresDate) return null;
    const days = differenceInDays(new Date(expiresDate), now);
    if (days < 0) return { label: "Просрочено", className: "bg-muted text-muted-foreground" };
    if (days < 7) return { label: `${days} дн.`, className: "bg-danger text-danger-foreground" };
    if (days < 30) return { label: `${days} дн.`, className: "bg-warning text-warning-foreground" };
    if (days < 90) return { label: `${days} дн.`, className: "bg-success text-success-foreground" };
    return null;
  };

  const getLocationBreadcrumb = (locationId: string | null) => {
    if (!locationId || !locations) return null;
    const path = getLocationPath(locationId, locations);
    if (path.length === 0) return null;
    return path.map(l => `${l.icon ?? "📍"} ${l.name}`).join(" → ");
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">📦 Все вещи</h1>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto scroll-snap-x pb-1">
          <Select value={categoryFilter || "all"} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[150px] flex-shrink-0 bg-card">
              <SelectValue placeholder="Категория" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все категории</SelectItem>
              {categories?.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={locationFilter || "all"} onValueChange={handleLocationChange}>
            <SelectTrigger className="w-[150px] flex-shrink-0 bg-card">
              <SelectValue placeholder="Локация" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все локации</SelectItem>
              {locations?.map((l) => (
                <SelectItem key={l.id} value={l.id}>{l.icon} {l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px] flex-shrink-0 bg-card">
              <SelectValue placeholder="Сортировка" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">По дате</SelectItem>
              <SelectItem value="name">По имени</SelectItem>
              <SelectItem value="price">По цене</SelectItem>
              <SelectItem value="expiry">По сроку годности</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Items */}
      {isLoading ? (
        <div className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3" : "space-y-2"}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className={viewMode === "grid" ? "h-48 rounded-lg" : "h-20 rounded-lg"} />
          ))}
        </div>
      ) : sortedItems.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-3">Нет вещей</p>
            <Button onClick={() => navigate("/items/new")}>
              <Plus className="h-4 w-4 mr-2" /> Добавить вещь
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {sortedItems.map((item) => {
            const expiry = getExpiryBadge(item.warranty_expires);
            const locationBreadcrumb = getLocationBreadcrumb(item.location_id);
            return (
              <Card
                key={item.id}
                className="cursor-pointer hover:shadow-md transition-shadow animate-fade-in"
                onClick={() => navigate(`/items/${item.id}`)}
              >
                <CardContent className="p-3">
                  <div className="w-full h-28 bg-muted rounded-lg flex items-center justify-center mb-2">
                    {item.photo_url ? (
                      <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <span className="text-3xl">{item.categories?.icon ?? "📦"}</span>
                    )}
                  </div>
                  <p className="font-medium text-sm text-foreground truncate">{item.name}</p>
                  {locationBreadcrumb && (
                    <p className="text-xs text-muted-foreground truncate">
                      {locationBreadcrumb}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    {item.price && (
                      <span className="text-sm font-semibold text-foreground">{item.price.toLocaleString("uk")} {getCurrencySymbol(item.currency)}</span>
                    )}
                    {expiry && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${expiry.className}`}>
                        {expiry.label}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {sortedItems.map((item) => {
            const expiry = getExpiryBadge(item.warranty_expires);
            const locationBreadcrumb = getLocationBreadcrumb(item.location_id);
            return (
              <Card
                key={item.id}
                className="cursor-pointer hover:shadow-md transition-shadow animate-fade-in"
                onClick={() => navigate(`/items/${item.id}`)}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    {item.photo_url ? (
                      <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <span className="text-xl">{item.categories?.icon ?? "📦"}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{item.name}</p>
                    {locationBreadcrumb && (
                      <p className="text-xs text-muted-foreground truncate">{locationBreadcrumb}</p>
                    )}
                    {item.purchase_date && (
                      <p className="text-xs text-muted-foreground">Куплено: {new Date(item.purchase_date).toLocaleDateString("uk")}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {item.price && (
                      <p className="text-sm font-semibold text-foreground">{item.price.toLocaleString("uk")} {getCurrencySymbol(item.currency)}</p>
                    )}
                    {expiry && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${expiry.className}`}>
                        {expiry.label}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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

export default Items;
