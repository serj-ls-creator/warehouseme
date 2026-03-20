import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useItem, useCreateItem, useUpdateItem, useCategories, useLocations, useCreateCategory, useCreateLocation, getLocationPath } from "@/hooks/useData";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

const steps = ["Основное", "Местонахождение", "Покупка и срок годности", "Заметки"];

const ItemForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id && id !== "new";
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: existingItem } = useItem(isEdit ? id : "");
  const { data: categories } = useCategories();
  const { data: locations } = useLocations();
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const createCategory = useCreateCategory();
  const createLocation = useCreateLocation();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category_id: "",
    location_id: "",
    purchase_date: "",
    price: "",
    currency: "UAH",
    hasExpiry: false,
    warranty_expires: "",
    serial_number: "",
    barcode: "",
    notes: "",
  });

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newLocationName, setNewLocationName] = useState("");

  useEffect(() => {
    if (existingItem && isEdit) {
      setForm({
        name: existingItem.name,
        description: existingItem.description ?? "",
        category_id: existingItem.category_id ?? "",
        location_id: existingItem.location_id ?? "",
        purchase_date: existingItem.purchase_date ?? "",
        price: existingItem.price?.toString() ?? "",
        currency: existingItem.currency ?? "UAH",
        hasExpiry: !!existingItem.warranty_expires,
        warranty_expires: existingItem.warranty_expires ?? "",
        serial_number: existingItem.serial_number ?? "",
        barcode: existingItem.barcode ?? "",
        notes: existingItem.notes ?? "",
      });
    }
  }, [existingItem, isEdit]);

  const update = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !user) return;
    const result = await createCategory.mutateAsync({ user_id: user.id, name: newCategoryName, icon: "📦", color: "#1E2A4A" });
    update("category_id", result.id);
    setNewCategoryName("");
  };

  const handleAddLocation = async () => {
    if (!newLocationName.trim() || !user) return;
    const result = await createLocation.mutateAsync({ user_id: user.id, name: newLocationName, parent_id: null, icon: "📍", color: "#1E2A4A" });
    update("location_id", result.id);
    setNewLocationName("");
  };

  const handleSubmit = async () => {
    if (!user || !form.name.trim()) return;

    const data = {
      user_id: user.id,
      name: form.name.trim(),
      description: form.description || null,
      photo_url: null,
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

  // Build nested location options
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

  return (
    <AppLayout>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">
          {isEdit ? "Редактировать вещь" : "Добавить вещь"}
        </h1>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          {steps.map((s, i) => (
            <span key={s} className={i === step ? "text-foreground font-medium" : ""}>{s}</span>
          ))}
        </div>
        <Progress value={((step + 1) / steps.length) * 100} className="h-1.5" />
      </div>

      <Card className="animate-fade-in">
        <CardContent className="p-4 space-y-4">
          {/* Step 1: Basic */}
          {step === 0 && (
            <>
              <div>
                <Label>Название *</Label>
                <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Например: MacBook Pro" className="mt-1" />
              </div>
              <div>
                <Label>Описание</Label>
                <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Описание вещи" className="mt-1" rows={3} />
              </div>
              <div>
                <Label>Категория</Label>
                <Select value={form.category_id} onValueChange={(v) => update("category_id", v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2 mt-2">
                  <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Новая категория" className="flex-1" />
                  <Button variant="outline" size="sm" onClick={handleAddCategory} disabled={!newCategoryName.trim()}>+</Button>
                </div>
              </div>
            </>
          )}

          {/* Step 2: Location */}
          {step === 1 && (
            <>
              <div>
                <Label>Локация</Label>
                <Select value={form.location_id} onValueChange={(v) => update("location_id", v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Выберите локацию" />
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
                  <Input value={newLocationName} onChange={(e) => setNewLocationName(e.target.value)} placeholder="Новая локация" className="flex-1" />
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
              <div>
                <Label>Штрихкод</Label>
                <Input value={form.barcode} onChange={(e) => update("barcode", e.target.value)} placeholder="Штрихкод" className="mt-1" />
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
          <Button onClick={handleSubmit} disabled={!form.name.trim() || createItem.isPending || updateItem.isPending}>
            <Check className="h-4 w-4 mr-1" /> Сохранить
          </Button>
        )}
      </div>
    </AppLayout>
  );
};

export default ItemForm;
