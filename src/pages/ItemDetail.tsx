import { useParams, useNavigate } from "react-router-dom";
import { useItem, useDeleteItem, useLocations, useCategories, getLocationPath, getCategoryPath, getCurrencySymbol } from "@/hooks/useData";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Edit, Trash2, Copy, MapPin, Calendar, DollarSign, Clock, Hash, StickyNote } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const ItemDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: item, isLoading } = useItem(id!);
  const { data: locations } = useLocations();
  const { data: categories } = useCategories();
  const deleteItem = useDeleteItem();
  const { toast } = useToast();

  const handleDelete = async () => {
    await deleteItem.mutateAsync(id!);
    navigate("/items");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Скопировано" });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <Skeleton className="h-64 rounded-lg mb-4" />
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </AppLayout>
    );
  }

  if (!item) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Вещь не найдена</p>
          <Button variant="outline" onClick={() => navigate("/items")} className="mt-4">
            Вернуться к списку
          </Button>
        </div>
      </AppLayout>
    );
  }

  const now = new Date();
  const expiryDaysLeft = item.warranty_expires ? differenceInDays(new Date(item.warranty_expires), now) : null;
  const expiryProgress = item.purchase_date && item.warranty_expires
    ? Math.min(100, Math.max(0, (differenceInDays(now, new Date(item.purchase_date)) / differenceInDays(new Date(item.warranty_expires), new Date(item.purchase_date))) * 100))
    : 0;

  const expiryStatus = expiryDaysLeft === null ? null
    : expiryDaysLeft < 0 ? "expired"
    : expiryDaysLeft < 30 ? "expiring"
    : "active";

  // Location path
  const locationPath = item.location_id && locations
    ? getLocationPath(item.location_id, locations)
    : [];

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={() => navigate(`/items/${id}/edit`)}>
          <Edit className="h-4 w-4 mr-1" /> Редактировать
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить вещь?</AlertDialogTitle>
              <AlertDialogDescription>Это действие нельзя отменить.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Удалить</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Photo */}
      <div className="w-full h-48 md:h-64 bg-muted rounded-xl flex items-center justify-center mb-6">
        {item.photo_url ? (
          <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover rounded-xl" />
        ) : (
          <span className="text-6xl">{item.categories?.icon ?? "📦"}</span>
        )}
      </div>

      {/* Name & Category */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{item.name}</h1>
        {item.categories && (
          <Badge variant="secondary" className="mt-2" style={{ borderColor: item.categories.color ?? undefined }}>
            {item.categories.icon} {item.categories.name}
          </Badge>
        )}
        {item.description && <p className="text-muted-foreground mt-2">{item.description}</p>}
      </div>

      <div className="space-y-4">
        {/* Location with full path */}
        {locationPath.length > 0 && (
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Местонахождение</p>
                <p className="font-medium text-foreground truncate">
                  {locationPath.map(l => `${l.icon ?? "📍"} ${l.name}`).join(" → ")}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Purchase */}
        {(item.purchase_date || item.price) && (
          <Card>
            <CardContent className="p-4 space-y-3">
              {item.purchase_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Дата покупки</p>
                    <p className="font-medium text-foreground">{format(new Date(item.purchase_date), "dd.MM.yyyy")}</p>
                  </div>
                </div>
              )}
              {item.price && (
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Цена</p>
                    <p className="font-medium text-foreground">{item.price.toLocaleString("uk")} {getCurrencySymbol(item.currency)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Expiry Date */}
        {expiryStatus && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Срок годности</p>
                  <p className="font-medium text-foreground">
                    до {format(new Date(item.warranty_expires!), "dd.MM.yyyy")}
                  </p>
                </div>
                <Badge
                  className={`ml-auto ${
                    expiryStatus === "expired" ? "bg-muted text-muted-foreground"
                    : expiryStatus === "expiring" ? "bg-warning text-warning-foreground"
                    : "bg-success text-success-foreground"
                  }`}
                >
                  {expiryStatus === "expired" ? "Просрочено"
                    : expiryStatus === "expiring" ? "Заканчивается"
                    : "Годен"}
                </Badge>
              </div>
              <Progress value={expiryProgress} className="h-2 mb-2" />
              {expiryDaysLeft !== null && expiryDaysLeft >= 0 && (
                <p className="text-3xl font-bold text-foreground text-center">
                  {expiryDaysLeft} <span className="text-sm font-normal text-muted-foreground">дней осталось</span>
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Serial / Barcode */}
        {(item.serial_number || item.barcode) && (
          <Card>
            <CardContent className="p-4 space-y-3">
              {item.serial_number && (
                <div className="flex items-center gap-3">
                  <Hash className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Серийный номер</p>
                    <p className="font-mono text-sm text-foreground">{item.serial_number}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(item.serial_number!)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {item.barcode && (
                <div className="flex items-center gap-3">
                  <Hash className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Штрихкод</p>
                    <p className="font-mono text-sm text-foreground">{item.barcode}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(item.barcode!)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {item.notes && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <StickyNote className="h-5 w-5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Заметки</p>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{item.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default ItemDetail;
