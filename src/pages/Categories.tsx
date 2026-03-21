import { useState } from "react";
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory, useItems } from "@/hooks/useData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Tags, Edit, ChevronRight, ChevronDown } from "lucide-react";
import type { Category } from "@/hooks/useData";

const defaultEmojis = ["💻", "🔧", "👕", "📚", "🧸", "🏠", "🍳", "💊", "📄", "🎮", "📦", "🎧", "🚗", "⚽", "🎨", "🧴", "🌱", "🏗️", "🎁", "🏋️"];

const CategoryTree = ({ categories, parentId, items, onDelete, onEdit, onAddSub, navigate, level = 0 }: {
  categories: Category[];
  parentId: string | null;
  items: any[];
  onDelete: (id: string) => void;
  onEdit: (cat: Category) => void;
  onAddSub: (parentId: string) => void;
  navigate: any;
  level?: number;
}) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const children = categories.filter(c => c.parent_id === parentId);

  if (children.length === 0) return null;

  return (
    <div className={level > 0 ? "ml-4 border-l border-border pl-3" : ""}>
      {children.map((cat) => {
        const hasChildren = categories.some(c => c.parent_id === cat.id);
        const count = items.filter(i => i.category_id === cat.id).length;
        const isExpanded = expanded[cat.id] ?? (level < 1);

        return (
          <div key={cat.id} className="mb-1">
            <Card className="hover:shadow-sm transition-shadow">
              <CardContent className="p-3 flex items-center gap-2">
                {hasChildren ? (
                  <button onClick={() => setExpanded(prev => ({ ...prev, [cat.id]: !prev[cat.id] }))} className="text-muted-foreground">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                ) : <span className="w-4" />}
                <span className="text-xl">{cat.icon}</span>
                <button
                  className="flex-1 text-left font-medium text-sm text-foreground hover:text-accent transition-colors min-w-0 truncate"
                  onClick={() => navigate(`/items?category=${cat.id}`)}
                >
                  {cat.name}
                </button>
                <Badge variant="secondary" className="text-xs flex-shrink-0">{count}</Badge>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground flex-shrink-0" onClick={() => onAddSub(cat.id)} title="Добавить подкатегорию">
                  <Plus className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground flex-shrink-0" onClick={() => onEdit(cat)}>
                  <Edit className="h-3 w-3" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Удалить категорию?</AlertDialogTitle>
                      <AlertDialogDescription>Подкатегории тоже будут удалены. Вещи останутся без категории.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Отмена</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(cat.id)}>Удалить</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
            {isExpanded && hasChildren && (
              <CategoryTree categories={categories} parentId={cat.id} items={items} onDelete={onDelete} onEdit={onEdit} onAddSub={onAddSub} navigate={navigate} level={level + 1} />
            )}
          </div>
        );
      })}
    </div>
  );
};

const Categories = () => {
  const { user } = useAuth();
  const { data: categories, isLoading } = useCategories();
  const { data: items } = useItems();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const updateCategory = useUpdateCategory();
  const navigate = useNavigate();

  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📦");
  const [newParentId, setNewParentId] = useState<string>("");

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleAdd = async () => {
    if (!newName.trim() || !user) return;
    await createCategory.mutateAsync({
      user_id: user.id,
      name: newName.trim(),
      icon: newIcon,
      color: "#1E2A4A",
      parent_id: newParentId || null,
    });
    setNewName("");
    setNewParentId("");
  };

  const handleAddSub = (parentId: string) => {
    setNewParentId(parentId);
    setNewName("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEdit = (cat: Category) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditIcon(cat.icon ?? "📦");
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingCategory || !editName.trim()) return;
    await updateCategory.mutateAsync({ id: editingCategory.id, name: editName.trim(), icon: editIcon });
    setEditDialogOpen(false);
    setEditingCategory(null);
  };

  // Build parent options for select
  const getParentOptions = () => {
    if (!categories) return [];
    const result: { id: string; label: string }[] = [];
    const buildTree = (parentId: string | null, depth: number) => {
      const children = categories.filter(c => c.parent_id === parentId);
      children.forEach(child => {
        const prefix = "—".repeat(depth);
        result.push({ id: child.id, label: `${prefix} ${child.icon ?? "📦"} ${child.name}` });
        buildTree(child.id, depth + 1);
      });
    };
    buildTree(null, 0);
    return result;
  };

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">🏷️ Категории</h1>

      {/* Add form */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Input value={newIcon} onChange={(e) => setNewIcon(e.target.value)} className="w-14 text-center flex-shrink-0" maxLength={2} />
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Название категории" className="flex-1 min-w-0" />
              <Button onClick={handleAdd} disabled={!newName.trim()} className="flex-shrink-0">
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
            <select
              value={newParentId}
              onChange={(e) => setNewParentId(e.target.value)}
              className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground w-full"
            >
              <option value="">Корневая категория</option>
              {getParentOptions().map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
        </div>
      ) : categories && categories.length > 0 ? (
        <CategoryTree
          categories={categories}
          parentId={null}
          items={items ?? []}
          onDelete={(id) => deleteCategory.mutate(id)}
          onEdit={handleEdit}
          onAddSub={handleAddSub}
          navigate={navigate}
        />
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Tags className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Добавьте первую категорию</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать категорию</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input value={editIcon} onChange={(e) => setEditIcon(e.target.value)} className="w-14 text-center" maxLength={2} />
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Название" className="flex-1" />
            </div>
            <div className="flex flex-wrap gap-1">
              {defaultEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setEditIcon(emoji)}
                  className={`w-8 h-8 rounded text-lg flex items-center justify-center transition-colors ${
                    editIcon === emoji ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <Button onClick={handleSaveEdit} disabled={!editName.trim()} className="w-full">
              Сохранить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Categories;
