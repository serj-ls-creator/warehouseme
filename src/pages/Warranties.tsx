import { useItems } from "@/hooks/useData";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, AlertTriangle } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { isEmoji } from "@/lib/isEmoji";

const ExpiryPage = () => {
  const { data: items, isLoading } = useItems();
  const navigate = useNavigate();
  const now = new Date();

  const expiryItems = items?.filter(i => i.warranty_expires) ?? [];

  const expiringSoon = expiryItems.filter(i => {
    const days = differenceInDays(new Date(i.warranty_expires!), now);
    return days >= 0 && days <= 90;
  }).sort((a, b) => new Date(a.warranty_expires!).getTime() - new Date(b.warranty_expires!).getTime());

  const active = expiryItems.filter(i => {
    const days = differenceInDays(new Date(i.warranty_expires!), now);
    return days > 90;
  }).sort((a, b) => new Date(a.warranty_expires!).getTime() - new Date(b.warranty_expires!).getTime());

  const expired = expiryItems.filter(i => {
    return differenceInDays(new Date(i.warranty_expires!), now) < 0;
  }).sort((a, b) => new Date(b.warranty_expires!).getTime() - new Date(a.warranty_expires!).getTime());

  const critical = expiringSoon.filter(i => differenceInDays(new Date(i.warranty_expires!), now) < 7);

  const ExpiryCard = ({ item }: { item: typeof expiryItems[0] }) => {
    const daysLeft = differenceInDays(new Date(item.warranty_expires!), now);
    const progress = item.purchase_date
      ? Math.min(100, Math.max(0, (differenceInDays(now, new Date(item.purchase_date)) / differenceInDays(new Date(item.warranty_expires!), new Date(item.purchase_date))) * 100))
      : daysLeft < 0 ? 100 : 50;

    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow animate-fade-in" onClick={() => navigate(`/items/${item.id}`)}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
              {item.photo_url && !isEmoji(item.photo_url) ? (
                <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <span className="text-xl">{isEmoji(item.photo_url) ? item.photo_url : (item.categories?.icon ?? "📦")}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                до {format(new Date(item.warranty_expires!), "dd.MM.yyyy")}
              </p>
              <Progress value={progress} className="h-1.5 mt-2" />
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`text-2xl font-bold ${daysLeft < 0 ? "text-muted-foreground" : daysLeft < 7 ? "text-destructive" : daysLeft < 30 ? "text-warning" : daysLeft < 90 ? "text-success" : "text-foreground"}`}>
                {daysLeft < 0 ? "—" : daysLeft}
              </p>
              <p className="text-xs text-muted-foreground">{daysLeft < 0 ? "просрочено" : "дней"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">⏰ Сроки годности</h1>

      {/* Critical banner */}
      {critical.length > 0 && (
        <Card className="mb-6 border-destructive bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
            <p className="text-sm text-foreground">
              <strong>{critical.length}</strong> {critical.length === 1 ? "вещь просрочивается" : "вещей просрочиваются"} менее чем через 7 дней!
            </p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      ) : (
        <Tabs defaultValue="expiring">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="expiring" className="flex-1">🔴 Заканчивается ({expiringSoon.length})</TabsTrigger>
            <TabsTrigger value="active" className="flex-1">🟢 Годные ({active.length})</TabsTrigger>
            <TabsTrigger value="expired" className="flex-1">⚫ Просрочено ({expired.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="expiring" className="space-y-2">
            {expiringSoon.length > 0 ? expiringSoon.map(item => <ExpiryCard key={item.id} item={item} />) : (
              <Card><CardContent className="p-8 text-center text-muted-foreground">Нет вещей с заканчивающимся сроком</CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-2">
            {active.length > 0 ? active.map(item => <ExpiryCard key={item.id} item={item} />) : (
              <Card><CardContent className="p-8 text-center text-muted-foreground">Нет вещей с активным сроком годности</CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="expired" className="space-y-2">
            {expired.length > 0 ? expired.map(item => <ExpiryCard key={item.id} item={item} />) : (
              <Card><CardContent className="p-8 text-center text-muted-foreground">Нет просроченных вещей</CardContent></Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </AppLayout>
  );
};

export default ExpiryPage;
