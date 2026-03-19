import { useState } from "react";
import { useCategories, useCreateCategory, useDeleteCategory, useItems } from "@/hooks/useData";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Tags } from "lucide-react";

const defaultEmojis = ["💻", "🔧", "👕", "📚", "🧸", "🏠", "🍳", "💊", "📄", "🎮", "📦", "🎧", "🚗", "⚽"];

const Categories = () => {
  const { user } = useAuth();
  const { data: categories, isLoading } = useCategories();
  const { data: items } = useItems();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const navigate = useNavigate();

  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📦");

  const handleAdd = async () => {
    if (!newName.trim() || !user) return;
    await createCategory.mutateAsync({
      user_id: user.id,
      name: newName.trim(),
      icon: newIcon,
      color: "#1E2A4A",
    });
    setNewName("");
  };

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">🏷️ Категории</h1>

      {/* Add form */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-2 mb-3">
            <Input value={newIcon} onChange={(e) => setNewIcon(e.target.value)} className="w-14 text-center" maxLength={2} />
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Название категории" className="flex-1" />
            <Button onClick={handleAdd} disabled={!newName.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {defaultEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setNewIcon(emoji)}
                className={`w-8 h-8 rounded text-lg flex items-center justify-center transition-colors ${
                  newIcon === emoji ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
      ) : categories && categories.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categories.map((cat) => {
            const count = items?.filter(i => i.category_id === cat.id).length ?? 0;
            return (
              <Card key={cat.id} className="animate-fade-in hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <button
                      onClick={() => navigate(`/items?category=${cat.id}`)}
                      className="text-left flex-1"
                    >
                      <span className="text-3xl block mb-2">{cat.icon}</span>
                      <p className="font-medium text-sm text-foreground">{cat.name}</p>
                      <Badge variant="secondary" className="mt-1 text-xs">{count} вещей</Badge>
                    </button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Удалить категорию?</AlertDialogTitle>
                          <AlertDialogDescription>Вещи в этой категории останутся без категории.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Отмена</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteCategory.mutate(cat.id)}>Удалить</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Tags className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Добавьте первую категорию</p>
          </CardContent>
        </Card>
      )}
    </AppLayout>
  );
};

export default Categories;
