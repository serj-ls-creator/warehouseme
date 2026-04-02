import { useState, useMemo } from "react";
import { useItems, useCategories, getCurrencySymbol } from "@/hooks/useData";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, startOfYear, eachMonthOfInterval } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useI18n, formatMonthYearByLocale, formatMonthShortByLocale } from "@/hooks/usePreferences";

const COLORS = ["#1E2A4A", "#F5C518", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#EC4899", "#14B8A6"];

const Finance = () => {
  const { data: items, isLoading } = useItems();
  const { data: categories } = useCategories();
  const navigate = useNavigate();
  const { t, locale, currency } = useI18n();
  const now = new Date();

  const [viewMode, setViewMode] = useState<"month" | "year">("month");
  const [selectedMonth, setSelectedMonth] = useState(() => format(now, "yyyy-MM"));

  const allItems = useMemo(() => items ?? [], [items]);
  const itemsWithPrice = useMemo(() => allItems.filter(i => i.price && i.purchase_date), [allItems]);

  const totalSpent = allItems.reduce((s, i) => s + (i.price ?? 0), 0);
  const sym = getCurrencySymbol(currency);

  const monthStart = startOfMonth(new Date(selectedMonth + "-01"));
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const dailyData = daysInMonth.map(day => {
    const dayStr = format(day, "yyyy-MM-dd");
    const spent = itemsWithPrice
      .filter(i => i.purchase_date === dayStr)
      .reduce((s, i) => s + (i.price ?? 0), 0);
    return { day: format(day, "d"), spent };
  });

  const monthTotal = dailyData.reduce((s, d) => s + d.spent, 0);

  const yearStart = startOfYear(now);
  const months = eachMonthOfInterval({ start: yearStart, end: now });
  const monthlyData = months.map(m => {
    const mStart = startOfMonth(m);
    const mEnd = endOfMonth(m);
    const spent = itemsWithPrice
      .filter(i => {
        const d = new Date(i.purchase_date!);
        return d >= mStart && d <= mEnd;
      })
      .reduce((s, i) => s + (i.price ?? 0), 0);
    return { month: formatMonthShortByLocale(m, locale), spent };
  });

  const categorySpending = useMemo(() => {
    if (!categories) return [];
    const rootCats = categories.filter(c => !c.parent_id);
    const filteredItems = viewMode === "month"
      ? allItems.filter(i => {
          if (!i.purchase_date) return false;
          const d = new Date(i.purchase_date);
          return d >= monthStart && d <= monthEnd;
        })
      : allItems.filter(i => {
          if (!i.purchase_date) return false;
          const d = new Date(i.purchase_date);
          return d >= yearStart && d <= now;
        });

    return rootCats.map(c => {
      const childIds = categories.filter(ch => ch.parent_id === c.id).map(ch => ch.id);
      const allIds = [c.id, ...childIds];
      const spent = filteredItems
        .filter(i => i.category_id && allIds.includes(i.category_id))
        .reduce((s, i) => s + (i.price ?? 0), 0);
      return { name: `${c.icon ?? "📦"} ${c.name}`, value: spent };
    }).filter(c => c.value > 0).sort((a, b) => b.value - a.value);
  }, [allItems, categories, viewMode, selectedMonth]);

  const recentPurchases = [...itemsWithPrice]
    .sort((a, b) => new Date(b.purchase_date!).getTime() - new Date(a.purchase_date!).getTime())
    .slice(0, 10);

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const m = subMonths(now, i);
    return { value: format(m, "yyyy-MM"), label: formatMonthYearByLocale(m, locale) };
  });

  if (isLoading) {
    return (
      <AppLayout>
        <h1 className="text-2xl font-bold text-foreground mb-6">💰 {t("finance.title")}</h1>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-lg" />)}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">💰 {t("finance.title")}</h1>
      </div>

      <Card className="mb-6 bg-primary text-primary-foreground">
        <CardContent className="p-6 text-center">
          <p className="text-sm opacity-80">{t("finance.totalSpent")}</p>
          <p className="text-4xl font-bold mt-1">{totalSpent.toLocaleString(locale)} {sym}</p>
          <p className="text-sm opacity-80 mt-1">{allItems.length} {t("finance.purchases")}</p>
        </CardContent>
      </Card>

      <div className="flex gap-2 mb-4">
        <Button variant={viewMode === "month" ? "default" : "outline"} size="sm" onClick={() => setViewMode("month")}>
          {t("common.month")}
        </Button>
        <Button variant={viewMode === "year" ? "default" : "outline"} size="sm" onClick={() => setViewMode("year")}>
          {t("common.year")}
        </Button>
      </div>

      {viewMode === "month" ? (
        <>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="mb-4 bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-sm flex justify-between">
                <span>{t("finance.byDay")}</span>
                <span className="text-accent">{monthTotal.toLocaleString(locale)} {sym}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => `${v.toLocaleString(locale)} ${sym}`} />
                  <Bar dataKey="spent" fill="hsl(222, 42%, 21%)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-sm">{t("finance.byMonths", { year: format(now, "yyyy") })}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => `${v.toLocaleString(locale)} ${sym}`} />
                <Line type="monotone" dataKey="spent" stroke="hsl(45, 91%, 53%)" strokeWidth={2} dot={{ fill: "hsl(45, 91%, 53%)" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {categorySpending.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-sm">
              {t("finance.byCategories", { period: viewMode === "month" ? monthOptions.find(o => o.value === selectedMonth)?.label ?? "" : format(now, "yyyy") })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categorySpending} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  {categorySpending.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `${v.toLocaleString(locale)} ${sym}`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {categorySpending.map((c, i) => (
                <div key={c.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-foreground">{c.name}</span>
                  </div>
                  <span className="font-semibold text-foreground">{c.value.toLocaleString(locale)} {sym}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {recentPurchases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("finance.recent")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentPurchases.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2 border-b border-border last:border-0 cursor-pointer"
                onClick={() => navigate(`/items/${item.id}`)}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(item.purchase_date!), "dd.MM.yyyy")}</p>
                </div>
                <span className="text-sm font-semibold text-foreground ml-2">{item.price?.toLocaleString(locale)} {getCurrencySymbol(item.currency)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </AppLayout>
  );
};

export default Finance;
