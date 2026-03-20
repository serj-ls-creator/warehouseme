import { useItems, useCategories, useLocations, getCurrencySymbol } from "@/hooks/useData";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { differenceInDays, format, startOfMonth, subMonths } from "date-fns";

const COLORS = ["#1E2A4A", "#F5C518", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];

const Statistics = () => {
  const { data: items, isLoading } = useItems();
  const { data: categories } = useCategories();
  const { data: locations } = useLocations();
  const now = new Date();

  if (isLoading) {
    return (
      <AppLayout>
        <h1 className="text-2xl font-bold text-foreground mb-6">📊 Статистика</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
        </div>
      </AppLayout>
    );
  }

  const allItems = items ?? [];
  const totalItems = allItems.length;
  const totalValue = allItems.reduce((sum, i) => sum + (i.price ?? 0), 0);
  const avgValue = totalItems > 0 ? totalValue / totalItems : 0;

  const categoryData = categories?.map(c => ({
    name: `${c.icon} ${c.name}`,
    count: allItems.filter(i => i.category_id === c.id).length,
    value: allItems.filter(i => i.category_id === c.id).reduce((s, i) => s + (i.price ?? 0), 0),
  })).filter(c => c.count > 0) ?? [];

  const locationData = locations?.map(l => ({
    name: `${l.icon} ${l.name}`,
    value: allItems.filter(i => i.location_id === l.id).length,
  })).filter(l => l.value > 0) ?? [];

  const monthData = Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(now, 5 - i);
    const start = startOfMonth(month);
    const end = startOfMonth(subMonths(now, 4 - i));
    return {
      name: format(month, "MMM"),
      count: allItems.filter(item => {
        const d = new Date(item.created_at);
        return d >= start && d < (i === 5 ? new Date(9999, 0) : end);
      }).length,
    };
  });

  const expiryItems = allItems.filter(i => i.warranty_expires);
  const activeExpiry = expiryItems.filter(i => differenceInDays(new Date(i.warranty_expires!), now) > 0).length;
  const expiringThisMonth = expiryItems.filter(i => {
    const d = differenceInDays(new Date(i.warranty_expires!), now);
    return d >= 0 && d <= 30;
  }).length;
  const expiredExpiry = expiryItems.filter(i => differenceInDays(new Date(i.warranty_expires!), now) < 0).length;

  const top5 = [...allItems].filter(i => i.price).sort((a, b) => (b.price ?? 0) - (a.price ?? 0)).slice(0, 5);

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">📊 Статистика</h1>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{totalItems}</p>
            <p className="text-xs text-muted-foreground">Всего вещей</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{totalValue.toLocaleString("uk")}</p>
            <p className="text-xs text-muted-foreground">Стоимость ₴</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{Math.round(avgValue).toLocaleString("uk")}</p>
            <p className="text-xs text-muted-foreground">Средняя ₴</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categoryData.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">По категориям</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={categoryData} layout="vertical" margin={{ left: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(222, 42%, 21%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {locationData.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">По локациям</CardTitle></CardHeader>
            <CardContent className="flex justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={locationData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                    {locationData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="text-sm">По месяцам</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="hsl(45, 91%, 53%)" strokeWidth={2} dot={{ fill: "hsl(45, 91%, 53%)" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Сроки годности</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">🟢 Годные</span>
              <span className="font-bold text-foreground">{activeExpiry}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">🟡 Заканчивается в этом месяце</span>
              <span className="font-bold text-foreground">{expiringThisMonth}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">🔴 Просрочено</span>
              <span className="font-bold text-foreground">{expiredExpiry}</span>
            </div>
          </CardContent>
        </Card>

        {top5.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader><CardTitle className="text-sm">🏆 Топ-5 самых дорогих</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {top5.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground w-6">{idx + 1}</span>
                    <span className="text-lg">{item.categories?.icon ?? "📦"}</span>
                    <span className="flex-1 text-sm font-medium text-foreground truncate">{item.name}</span>
                    <span className="text-sm font-bold text-foreground">{item.price?.toLocaleString("uk")} {getCurrencySymbol(item.currency)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Statistics;
