import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogOut, User, Download } from "lucide-react";

const SettingsPage = () => {
  const { user, signOut } = useAuth();

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">⚙️ Настройки</h1>

      <div className="space-y-4 max-w-lg">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Профиль</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <User className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {user?.user_metadata?.display_name || "Пользователь"}
                </p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Данные</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" disabled>
              <Download className="h-4 w-4 mr-2" /> Экспорт в CSV (скоро)
            </Button>
            <Button variant="outline" className="w-full justify-start" disabled>
              <Download className="h-4 w-4 mr-2" /> Экспорт в PDF (скоро)
            </Button>
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardContent className="p-4">
            <Button variant="outline" className="w-full text-destructive" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" /> Выйти из аккаунта
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
