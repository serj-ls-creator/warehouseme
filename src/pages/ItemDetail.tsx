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
import { useI18n } from "@/hooks/usePreferences";

const ItemDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: item, isLoading } = useItem(id!);
  const { data: locations } = useLocations();
  const { data: categories } = useCategories();
  const deleteItem = useDeleteItem();
  const { toast } = useToast();
  const { t, locale } = useI18n();

  const handleDelete = async () => {
    await deleteItem.mutateAsync(id!);
    navigate("/items");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: t("common.copied") });
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
          <p className="text-muted-foreground">{t("itemDetail.notFound")}</p>
          <Button variant="outline" onClick={() => navigate("/items")} className="mt-4">
            {t("itemDetail.backToList")}
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

  const locationPath = item.location_id && locations
    ? getLocationPath(item.location_id, locations)
    : [];

  const isEmojiIcon = item.photo_url && item.photo_url.length <= 4 && /\p{Emoji}/u.test(item.photo_url);

  return (
    <AppLayout>
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={() => navigate(`/items/${id}/edit`)}>
          <Edit className="h-4 w-4 mr-1" /> {t("itemDetail.edit")}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("itemDetail.deleteTitle")}</AlertDialogTitle>
              <AlertDialogDescription>{t("itemDetail.deleteDescription")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>{t("common.delete")}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="w-full h-48 md:h-64 bg-muted rounded-xl flex items-center justify-center mb-6">
        {isEmojiIcon ? (
          <span className="text-6xl">{item.photo_url}</span>
        ) : item.photo_url ? (
          <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover rounded-xl" />
        ) : (
          <span className="text-6xl">{item.categories?.icon ?? "📦"}</span>
        )}
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{item.name}</h1>
        {item.category_id && categories && categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {getCategoryPath(item.category_id, categories).map((c) => (
              <Badge key={c.id} variant="secondary" style={{ borderColor: c.color ?? undefined }}>
                {c.icon} {c.name}
              </Badge>
            ))}
          </div>
        )}
        {item.description && <p className="text-muted-foreground mt-2">{item.description}</p>}
      </div>

      <div className="space-y-4">
        {locationPath.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground mb-2">{t("itemDetail.location")}</p>
                  <div className="space-y-1">
                    {locationPath.map((l, i) => (
                      <div key={l.id} className="flex items-center gap-1" style={{ paddingLeft: `${i * 16}px` }}>
                        {i > 0 && <span className="text-muted-foreground text-xs">└</span>}
                        <span className="text-sm font-medium text-foreground">{l.icon ?? "📍"} {l.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {(item.purchase_date || item.price) && (
          <Card>
            <CardContent className="p-4 space-y-3">
              {item.purchase_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t("itemDetail.purchaseDate")}</p>
                    <p className="font-medium text-foreground">{format(new Date(item.purchase_date), "dd.MM.yyyy")}</p>
                  </div>
                </div>
              )}
              {item.price && (
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t("itemDetail.price")}</p>
                    <p className="font-medium text-foreground">{item.price.toLocaleString(locale)} {getCurrencySymbol(item.currency)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {expiryStatus && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("itemDetail.expiry")}</p>
                  <p className="font-medium text-foreground">
                    {t("common.until")} {format(new Date(item.warranty_expires!), "dd.MM.yyyy")}
                  </p>
                </div>
                <Badge
                  className={`ml-auto ${
                    expiryStatus === "expired" ? "bg-muted text-muted-foreground"
                    : expiryStatus === "expiring" ? "bg-warning text-warning-foreground"
                    : "bg-success text-success-foreground"
                  }`}
                >
                  {expiryStatus === "expired" ? t("itemDetail.expired")
                    : expiryStatus === "expiring" ? t("itemDetail.expiring")
                    : t("itemDetail.active")}
                </Badge>
              </div>
              <Progress value={expiryProgress} className="h-2 mb-2" />
              {expiryDaysLeft !== null && expiryDaysLeft >= 0 && (
                <p className="text-3xl font-bold text-foreground text-center">
                  {expiryDaysLeft} <span className="text-sm font-normal text-muted-foreground">{t("itemDetail.daysLeft")}</span>
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {(item.serial_number || item.barcode) && (
          <Card>
            <CardContent className="p-4 space-y-3">
              {item.serial_number && (
                <div className="flex items-center gap-3">
                  <Hash className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">{t("itemDetail.serial")}</p>
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
                    <p className="text-xs text-muted-foreground">{t("itemDetail.barcode")}</p>
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

        {item.notes && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <StickyNote className="h-5 w-5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{t("itemDetail.notes")}</p>
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
