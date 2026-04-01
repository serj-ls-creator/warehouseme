import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/usePreferences";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, User, Download } from "lucide-react";

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const { currency, setCurrency, language, setLanguage, t } = useI18n();

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
            <Button variant="outline" className="w-full justify-start" disabled>
              <Download className="h-4 w-4 mr-2" /> {t("settings.exportCsv")}
            </Button>
            <Button variant="outline" className="w-full justify-start" disabled>
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
