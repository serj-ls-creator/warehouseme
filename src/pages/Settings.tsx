import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/usePreferences";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, User, Download, Upload } from "lucide-react";
import { useItems, useCategories, useLocations, getCategoryDisplayName, getLocationDisplayName, getCurrencySymbol } from "@/hooks/useData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const { currency, setCurrency, language, setLanguage, t } = useI18n();
  const { data: items } = useItems();
  const { data: categories } = useCategories();
  const { data: locations } = useLocations();
  const { toast } = useToast();

  const formatDate = (d: string | null) => (d ? new Date(d).toLocaleDateString() : "");

  const buildRows = () => {
    if (!items) return [];
    return items.map((i) => ({
      name: i.name,
      description: i.description ?? "",
      category: i.category_id && categories ? getCategoryDisplayName(i.category_id, categories).replace(/\s+/g, " ").trim() : "",
      location: i.location_id && locations ? (() => { const loc = locations.find(l => l.id === i.location_id); return loc ? getLocationDisplayName(loc, locations) : ""; })() : "",
      price: i.price != null ? `${i.price} ${getCurrencySymbol(i.currency)}` : "",
      purchase_date: formatDate(i.purchase_date),
      warranty_expires: formatDate(i.warranty_expires),
      serial_number: i.serial_number ?? "",
      barcode: i.barcode ?? "",
      notes: i.notes ?? "",
    }));
  };

  const handleExportCsv = () => {
    const rows = buildRows();
    if (!rows.length) {
      toast({ title: t("common.error"), description: t("dashboard.noItems"), variant: "destructive" });
      return;
    }
    const headers = ["Name", "Description", "Category", "Location", "Price", "Purchase Date", "Expiry Date", "Serial #", "Barcode", "Notes"];
    const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [
      headers.map(escape).join(","),
      ...rows.map(r => [r.name, r.description, r.category, r.location, r.price, r.purchase_date, r.warranty_expires, r.serial_number, r.barcode, r.notes].map(escape).join(",")),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `warehouseme-items-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: t("settings.exportCsv") + " ✓" });
  };

  const handleExportPdf = () => {
    const rows = buildRows();
    if (!rows.length) {
      toast({ title: t("common.error"), description: t("dashboard.noItems"), variant: "destructive" });
      return;
    }
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("WarehouseMe - Items", 14, 14);
    autoTable(doc, {
      startY: 20,
      head: [["Name", "Description", "Category", "Location", "Price", "Purchase", "Expiry", "Serial #"]],
      body: rows.map(r => [r.name, r.description, r.category, r.location, r.price, r.purchase_date, r.warranty_expires, r.serial_number]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 42, 74] },
    });
    doc.save(`warehouseme-items-${new Date().toISOString().split("T")[0]}.pdf`);
    toast({ title: t("settings.exportPdf") + " ✓" });
  };

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">⚙️ {t("settings.title")}</h1>

      <div className="space-y-4 max-w-lg">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("settings.profile")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <User className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {user?.user_metadata?.display_name || t("common.user")}
                </p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("settings.preferences")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{t("settings.defaultCurrency")}</p>
              <Select value={currency} onValueChange={(value) => setCurrency(value as "EUR" | "UAH" | "USD")}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите валюту" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">{t("currencies.EUR")}</SelectItem>
                  <SelectItem value="UAH">{t("currencies.UAH")}</SelectItem>
                  <SelectItem value="USD">{t("currencies.USD")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{t("settings.language")}</p>
              <Select value={language} onValueChange={(value) => setLanguage(value as "uk" | "ru" | "en")}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите язык" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uk">{t("languages.uk")}</SelectItem>
                  <SelectItem value="ru">{t("languages.ru")}</SelectItem>
                  <SelectItem value="en">{t("languages.en")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Data */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("settings.data")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" onClick={handleExportCsv}>
              <Download className="h-4 w-4 mr-2" /> {t("settings.exportCsv")}
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={handleExportPdf}>
              <Download className="h-4 w-4 mr-2" /> {t("settings.exportPdf")}
            </Button>
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardContent className="p-4">
            <Button variant="outline" className="w-full text-destructive" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" /> {t("settings.logout")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
