import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useItem, useCreateItem, useUpdateItem, useCategories, useLocations, useCreateCategory, useCreateLocation, useBarcodeLookup } from "@/hooks/useData";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check, Search, Loader2, Camera, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/hooks/usePreferences";
import { isEmoji } from "@/lib/isEmoji";
import IconSelect from "@/components/IconSelect";

const ICON_OPTIONS = [
  "📦", "💻", "📱", "🔧", "👕", "🍳", "🧸", "💊", "📚", "🎮",
  "🏠", "🎨", "🌱", "📄", "🏗️", "🎁", "🧴", "🏋️", "⚽", "🎸",
  "🔌", "🛋️", "🪑", "🛏️", "👟", "🧥", "📷", "🎧", "🪀", "🧩",
  "🚗", "✈️", "🏍️", "🚲", "⌚", "💍", "👜", "🎒", "🧳", "🪞",
  "🧲", "🔑", "🔒", "💡", "🔋", "🖨️", "🖥️", "⌨️", "🖱️", "📺",
  "📻", "🎥", "🎤", "🎹", "🥁", "🎯", "🏓", "🎾", "🏀", "🏈",
  "⛷️", "🏊", "🏕️", "🎣", "🔭", "🔬", "🧪", "💉", "🩺", "🩹",
  "👓", "🧤", "🧣", "👶", "🍽️", "🥘", "🍴", "☕", "🫖", "🧹",
  "🧼", "🪴", "🌿", "💧", "🪻", "🕯️", "🎀", "🎄", "🪪", "📋",
  "🧾", "💰", "🛡️", "🧱", "🔩", "🚰", "🧊", "📏", "🌾", "🏺",
];

const ItemForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id && id !== "new";
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currency: defaultCurrency, t } = useI18n();
  const { toast } = useToast();
  const { data: existingItem } = useItem(isEdit ? id : "");
  const { data: categories } = useCategories();
  const { data: locations } = useLocations();
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const createCategory = useCreateCategory();
  const createLocation = useCreateLocation();
  const barcodeLookup = useBarcodeLookup();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category_id: "",
    location_id: "",
    purchase_date: "",
    price: "",
    currency: defaultCurrency,
    hasExpiry: false,
    warranty_expires: "",
    serial_number: "",
    barcode: "",
    notes: "",
    icon: "",
  });

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newLocationName, setNewLocationName] = useState("");
  const [useIcon, setUseIcon] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEdit) {
      setForm((prev) => ({ ...prev, currency: defaultCurrency }));
    }
  }, [defaultCurrency, isEdit]);

  useEffect(() => {
    if (existingItem && isEdit) {
      const existingIsEmoji = isEmoji(existingItem.photo_url);
      setForm({
        name: existingItem.name,
        description: existingItem.description ?? "",
        category_id: existingItem.category_id ?? "",
        location_id: existingItem.location_id ?? "",
        purchase_date: existingItem.purchase_date ?? "",
        price: existingItem.price?.toString() ?? "",
        currency: (existingItem.currency === "EUR" || existingItem.currency === "UAH" || existingItem.currency === "USD"
          ? existingItem.currency
          : defaultCurrency),
        hasExpiry: !!existingItem.warranty_expires,
        warranty_expires: existingItem.warranty_expires ?? "",
        serial_number: existingItem.serial_number ?? "",
        barcode: existingItem.barcode ?? "",
        notes: existingItem.notes ?? "",
        icon: existingIsEmoji ? existingItem.photo_url! : "",
      });
      if (existingIsEmoji) {
        setUseIcon(true);
      } else if (existingItem.photo_url) {
        setPhotoPreview(existingItem.photo_url);
      }
    }
  }, [defaultCurrency, existingItem, isEdit]);

  const update = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleBarcodeLookup = async () => {
    if (!form.barcode.trim()) return;
    const result = await barcodeLookup.mutateAsync(form.barcode.trim());
    if (result.found) {
      if (result.name && !form.name) update("name", result.name);
      if (result.description && !form.description) update("description", result.description);
      if (result.brand) {
        const desc = form.description ? `${form.description}\nБренд: ${result.brand}` : `Бренд: ${result.brand}`;
        update("description", desc);
      }
      toast({ title: "Товар найден!", description: result.name || "Данные заполнены автоматически" });
    } else {
      toast({ title: "Товар не найден", description: "Попробуйте ввести данные вручную", variant: "destructive" });
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !user) return;
    const result = await createCategory.mutateAsync({ user_id: user.id, name: newCategoryName, icon: "📦", color: "#1E2A4A", parent_id: null });
    update("category_id", result.id);
    setNewCategoryName("");
  };

  const handleAddLocation = async () => {
    if (!newLocationName.trim() || !user) return;
    const result = await createLocation.mutateAsync({ user_id: user.id, name: newLocationName, parent_id: null, icon: "📍", color: "#1E2A4A" });
    update("location_id", result.id);
    setNewLocationName("");
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile || !user) return null;
    setUploading(true);
    try {
      const ext = photoFile.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("item-photos").upload(filePath, photoFile, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("item-photos").getPublicUrl(filePath);
      return urlData.publicUrl;
    } catch (err: any) {
      toast({ title: t("itemForm.uploadError"), description: err.message, variant: "destructive" });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: t("itemForm.fileTooLarge"), description: t("itemForm.fileTooLargeDescription"), variant: "destructive" });
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setUseIcon(false);
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!user || !form.name.trim()) return;

    let photoUrl: string | null = null;
    if (useIcon && form.icon) {
      photoUrl = form.icon;
    } else if (photoFile) {
      photoUrl = await uploadPhoto();
    } else if (photoPreview) {
      photoUrl = photoPreview;
    }

    const data = {
      user_id: user.id,
      name: form.name.trim(),
      description: form.description || null,
      photo_url: photoUrl,
      category_id: form.category_id || null,
      location_id: form.location_id || null,
      purchase_date: form.purchase_date || null,
      price: form.price ? parseFloat(form.price) : null,
      currency: form.currency || "UAH",
      warranty_expires: form.hasExpiry && form.warranty_expires ? form.warranty_expires : null,
      serial_number: form.serial_number || null,
      barcode: form.barcode || null,
      notes: form.notes || null,
    };

    if (isEdit) {
      await updateItem.mutateAsync({ id, ...data });
    } else {
      await createItem.mutateAsync(data);
    }
    navigate("/items");
  };

  const canNext = step === 0 ? form.name.trim().length > 0 : true;

  const getLocationOptions = () => {
    if (!locations) return [];
    const result: { id: string; label: string; depth: number }[] = [];
    const buildTree = (parentId: string | null, depth: number) => {
      const children = locations.filter(l => l.parent_id === parentId);
      children.forEach(child => {
        const prefix = "—".repeat(depth);
        result.push({ id: child.id, label: `${prefix} ${child.icon ?? "📍"} ${child.name}`, depth });
        buildTree(child.id, depth + 1);
      });
    };
    buildTree(null, 0);
    return result;
  };

  const getCategoryOptions = () => {
    if (!categories) return [];
    const result: { id: string; label: string; depth: number }[] = [];
    const buildTree = (parentId: string | null, depth: number) => {
      const children = categories.filter(c => c.parent_id === parentId);
      children.forEach(child => {
        const prefix = "—".repeat(depth);
        result.push({ id: child.id, label: `${prefix} ${child.icon ?? "📦"} ${child.name}`, depth });
        buildTree(child.id, depth + 1);
      });
    };
    buildTree(null, 0);
    return result;
  };

  return (
    <AppLayout>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">
          {isEdit ? t("itemForm.editTitle") : t("itemForm.addTitle")}
        </h1>
      </div>

      {/* Progress - fixed mobile spacing */}
      <div className="mb-6">
        <div className="flex justify-between gap-1.5 sm:gap-2 text-xs text-muted-foreground mb-2">
          {[t("itemForm.stepBasic"), t("itemForm.stepLocation"), t("itemForm.stepPurchase"), t("itemForm.stepNotes")].map((s, i) => (
            <span
              key={s}
              className={`text-center flex-1 px-1.5 py-1.5 rounded-md transition-colors whitespace-nowrap text-[10px] sm:text-xs ${
                i === step
                  ? "bg-primary text-primary-foreground font-medium"
                  : "bg-muted"
              }`}
            >
              {s}
            </span>
          ))}
        </div>
        <Progress value={((step + 1) / 4) * 100} className="h-1.5" />
      </div>

      <Card className="animate-fade-in">
        <CardContent className="p-4 space-y-4">
          {/* Step 1: Basic */}
          {step === 0 && (
            <>
              <div>
                <Label>{t("itemForm.name")}</Label>
                <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder={t("itemForm.namePlaceholder")} className="mt-1" />
              </div>
              <div>
                <Label>{t("itemForm.barcode")}</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={form.barcode}
                    onChange={(e) => update("barcode", e.target.value)}
                    placeholder={t("itemForm.barcodePlaceholder")}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={handleBarcodeLookup}
                    disabled={!form.barcode.trim() || barcodeLookup.isPending}
                  >
                    {barcodeLookup.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{t("itemForm.barcodeHint")}</p>
              </div>
              <div>
                <Label>{t("itemForm.description")}</Label>
                <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder={t("itemForm.descriptionPlaceholder")} className="mt-1" rows={3} />
              </div>

              {/* Photo upload */}
              <div>
                <Label className="mb-2 block">{t("itemForm.photo")}</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {photoPreview && !useIcon ? (
                  <div className="relative w-full h-40 bg-muted rounded-lg overflow-hidden mb-2">
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7"
                      onClick={removePhoto}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : !useIcon ? (
                  <div
                    className="w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 transition-colors mb-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{t("itemForm.uploadPhoto")}</p>
                    <p className="text-xs text-muted-foreground">{t("itemForm.maxFile")}</p>
                  </div>
                ) : null}
              </div>

              {/* Icon instead of photo */}
              <div className="flex items-center gap-3">
                <Switch
                  checked={useIcon}
                  onCheckedChange={(v) => {
                    setUseIcon(v);
                    if (v) removePhoto();
                  }}
                />
                <Label>{t("itemForm.useIcon")}</Label>
              </div>
              {useIcon && (
                <div>
                  <Label>{t("itemForm.itemIcon")}</Label>
                  <IconSelect
                    icons={ICON_OPTIONS}
                    value={form.icon || "📦"}
                    onValueChange={(value) => update("icon", value)}
                    className="mt-1"
                  />
                </div>
              )}

              <div>
                <Label>{t("itemForm.category")}</Label>
                <Select value={form.category_id} onValueChange={(v) => update("category_id", v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={t("itemForm.selectCategory")} />
                  </SelectTrigger>
                  <SelectContent>
                    {getCategoryOptions().map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <span style={{ paddingLeft: `${c.depth * 12}px` }}>{c.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2 mt-2">
                  <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder={t("itemForm.newCategory")} className="flex-1" />
                  <Button variant="outline" size="sm" onClick={handleAddCategory} disabled={!newCategoryName.trim()}>+</Button>
                </div>
              </div>
            </>
          )}

          {/* Step 2: Location */}
          {step === 1 && (
            <>
              <div>
                <Label>{t("itemForm.location")}</Label>
                <Select value={form.location_id} onValueChange={(v) => update("location_id", v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={t("itemForm.selectLocation")} />
                  </SelectTrigger>
                  <SelectContent>
                    {getLocationOptions().map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        <span style={{ paddingLeft: `${l.depth * 12}px` }}>{l.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2 mt-2">
                  <Input value={newLocationName} onChange={(e) => setNewLocationName(e.target.value)} placeholder={t("itemForm.newLocation")} className="flex-1" />
                  <Button variant="outline" size="sm" onClick={handleAddLocation} disabled={!newLocationName.trim()}>+</Button>
                </div>
              </div>
            </>
          )}

          {/* Step 3: Purchase & Expiry */}
          {step === 2 && (
            <>
              <div>
                <Label>Дата покупки</Label>
                <Input type="date" value={form.purchase_date} onChange={(e) => update("purchase_date", e.target.value)} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Цена</Label>
                  <Input type="number" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="0" className="mt-1" />
                </div>
                <div>
                  <Label>Валюта</Label>
                  <Select value={form.currency} onValueChange={(v) => update("currency", v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UAH">₴ Гривні</SelectItem>
                      <SelectItem value="USD">$ Долари</SelectItem>
                      <SelectItem value="EUR">€ Євро</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.hasExpiry} onCheckedChange={(v) => update("hasExpiry", v)} />
                <Label>Есть срок годности</Label>
              </div>
              {form.hasExpiry && (
                <div>
                  <Label>Дата окончания срока годности</Label>
                  <Input type="date" value={form.warranty_expires} onChange={(e) => update("warranty_expires", e.target.value)} className="mt-1" />
                </div>
              )}
              <div>
                <Label>Серийный номер</Label>
                <Input value={form.serial_number} onChange={(e) => update("serial_number", e.target.value)} placeholder="S/N" className="mt-1" />
              </div>
            </>
          )}

          {/* Step 4: Notes */}
          {step === 3 && (
            <>
              <div>
                <Label>Заметки</Label>
                <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Дополнительная информация..." className="mt-1" rows={6} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {step > 0 ? "Назад" : "Отмена"}
        </Button>
        {step < steps.length - 1 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
            Далее <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!form.name.trim() || createItem.isPending || updateItem.isPending || uploading}>
            {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
            {uploading ? "Загрузка..." : "Сохранить"}
          </Button>
        )}
      </div>
    </AppLayout>
  );
};

export default ItemForm;
