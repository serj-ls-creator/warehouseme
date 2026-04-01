import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/hooks/usePreferences";
import { Package, Mail, Lock, User, ArrowRight } from "lucide-react";

type AuthMode = "login" | "register" | "reset";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      } else if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({
          title: t("auth.registerSuccess"),
          description: t("auth.welcome"),
        });
        navigate("/");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({
          title: t("auth.emailSent"),
          description: t("auth.checkEmail"),
        });
      }
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Package className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">WarehouseMe</span>
          </div>
          <p className="text-muted-foreground">{t("auth.subtitle")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {mode === "login" && t("auth.loginTitle")}
              {mode === "register" && t("auth.registerTitle")}
              {mode === "reset" && t("auth.resetTitle")}
            </CardTitle>
            <CardDescription>
              {mode === "login" && t("auth.loginDescription")}
              {mode === "register" && t("auth.registerDescription")}
              {mode === "reset" && t("auth.resetDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div className="space-y-2">
                    <Label htmlFor="name">{t("auth.name")}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                        placeholder={t("auth.yourName")}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              {mode !== "reset" && (
                <div className="space-y-2">
                    <Label htmlFor="password">{t("auth.password")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("common.loading") : (
                  <>
                    {mode === "login" && t("auth.login")}
                    {mode === "register" && t("auth.register")}
                    {mode === "reset" && t("auth.sendLink")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm space-y-2">
              {mode === "login" && (
                <>
                  <button
                    onClick={() => setMode("reset")}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t("auth.forgotPassword")}
                  </button>
                  <div>
                    <span className="text-muted-foreground">{t("auth.noAccount")} </span>
                    <button
                      onClick={() => setMode("register")}
                      className="text-accent font-medium hover:underline"
                    >
                      {t("auth.signUp")}
                    </button>
                  </div>
                </>
              )}
              {mode === "register" && (
                <div>
                  <span className="text-muted-foreground">{t("auth.haveAccount")} </span>
                  <button
                    onClick={() => setMode("login")}
                    className="text-accent font-medium hover:underline"
                  >
                      {t("auth.signIn")}
                  </button>
                </div>
              )}
              {mode === "reset" && (
                <button
                  onClick={() => setMode("login")}
                  className="text-accent font-medium hover:underline"
                >
                  {t("auth.backToLogin")}
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
