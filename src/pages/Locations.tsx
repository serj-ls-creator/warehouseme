import { useState } from "react";
import { useLocations, useCreateLocation, useDeleteLocation, useUpdateLocation, useItems } from "@/hooks/useData";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, ChevronRight, ChevronDown, Trash2, MapPin, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Location } from "@/hooks/useData";
import IconSelect from "@/components/IconSelect";

const defaultLocationEmojis = [
  "🏠", "🛋️", "🍳", "🛏️", "🚿", "🏪", "📦", "🗄️", "🚗", "🏢", "🌳", "🏗️", "🛒", "🎒",
  "🏡", "🏘️", "🏚️", "🏛️", "🏗️", "🏭", "🏬", "🏣", "🏤", "🏥", "🏦", "🏨", "🏩", "🏪",
  "🧳", "🛗", "🚪", "🪟", "🛖", "⛺", "🏕️", "🌆", "🌇", "🌃", "🌉", "🗼", "🗽", "⛪",
  "🕌", "🛕", "🏰", "🏯", "🎪", "🗺️", "🧭", "⛲", "🎡", "🎢", "🎠", "🅿️", "🚏", "🛤️",
  "🛣️", "🏞️", "🏔️", "⛰️", "🌋", "🗻", "🏝️", "🏖️", "🌊", "🚂", "✈️", "🚀", "🛸", "🚁",
  "🔧", "🔨", "🪛", "🪚", "📐", "📏", "🧰", "🗑️", "🪣", "🧊", "📮", "📬", "📫", "📪",
];

const LocationTree = ({ locations, parentId, items, onDelete, onEdit, navigate, level = 0 }: {
  locations: Location[];
  parentId: string | null;
  items: any[];
  onDelete: (id: string) => void;
  onEdit: (loc: Location) => void;
  navigate: any;
  level?: number;
}) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const children = locations.filter(l => l.parent_id === parentId);

  if (children.length === 0) return null;

  return (
    <div className={level > 0 ? "ml-4 border-l border-border pl-3" : ""}>
      {children.map((loc) => {
        const hasChildren = locations.some(l => l.parent_id === loc.id);
        const itemCount = items.filter(i => i.location_id === loc.id).length;
        const isExpanded = expanded[loc.id] ?? (level < 1);

        return (
          <div key={loc.id} className="mb-1">
            <Card className="hover:shadow-sm transition-shadow">
              <CardContent className="p-3 flex items-center gap-2">
                {hasChildren ? (
                  <button onClick={() => setExpanded(prev => ({ ...prev, [loc.id]: !prev[loc.id] }))} className="text-muted-foreground">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                ) : <span className="w-4" />}
                <span className="text-xl">{loc.icon}</span>
                <button
                  className="flex-1 text-left font-medium text-sm text-foreground hover:text-accent transition-colors min-w-0 truncate"
                  onClick={() => navigate(`/items?location=${loc.id}`)}
                >
                  {loc.name}
                </button>
                <Badge variant="secondary" className="text-xs flex-shrink-0">{itemCount}</Badge>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground flex-shrink-0" onClick={() => onEdit(loc)}>
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
                      <AlertDialogTitle>Удалить локацию?</AlertDialogTitle>
                      <AlertDialogDescription>Все подлокации тоже будут удалены.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Отмена</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(loc.id)}>Удалить</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
            {isExpanded && hasChildren && (
              <LocationTree locations={locations} parentId={loc.id} items={items} onDelete={onDelete} onEdit={onEdit} navigate={navigate} level={level + 1} />
            )}
          </div>
        );
      })}
    </div>
  );
};

const Locations = () => {
  const { user } = useAuth();
  const { data: locations, isLoading } = useLocations();
  const { data: items } = useItems();
  const createLocation = useCreateLocation();
  const deleteLocation = useDeleteLocation();
  const updateLocation = useUpdateLocation();
  const navigate = useNavigate();

  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📍");
  const [parentId, setParentId] = useState<string>("");

  // Edit state
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleAdd = async () => {
    if (!newName.trim() || !user) return;
    await createLocation.mutateAsync({
      user_id: user.id,
      name: newName.trim(),
      icon: newIcon,
      color: "#1E2A4A",
      parent_id: parentId || null,
    });
    setNewName("");
  };

  const handleEdit = (loc: Location) => {
    setEditingLocation(loc);
    setEditName(loc.name);
    setEditIcon(loc.icon ?? "📍");
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingLocation || !editName.trim()) return;
    await updateLocation.mutateAsync({ id: editingLocation.id, name: editName.trim(), icon: editIcon });
    setEditDialogOpen(false);
    setEditingLocation(null);
  };

  // Build nested options for parent select
  const getParentOptions = () => {
    if (!locations) return [];
    const result: { id: string; label: string }[] = [];
    const buildTree = (parentId: string | null, depth: number) => {
      const children = locations.filter(l => l.parent_id === parentId);
      children.forEach(child => {
        const prefix = "—".repeat(depth);
        result.push({ id: child.id, label: `${prefix} ${child.icon ?? "📍"} ${child.name}` });
        buildTree(child.id, depth + 1);
      });
    };
    buildTree(null, 0);
    return result;
  };

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">📍 Локации</h1>

      {/* Add form */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <IconSelect icons={defaultLocationEmojis} value={newIcon} onValueChange={setNewIcon} className="w-24 flex-shrink-0" />
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Название локации" className="flex-1 min-w-0" />
              <Button onClick={handleAdd} disabled={!newName.trim()} className="flex-shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Select value={parentId || "root"} onValueChange={(value) => setParentId(value === "root" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Корневая локация" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Корневая локация</SelectItem>
                {getParentOptions().map((l) => (
                  <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
        </div>
      ) : locations && locations.length > 0 ? (
        <LocationTree
          locations={locations}
          parentId={null}
          items={items ?? []}
          onDelete={(id) => deleteLocation.mutate(id)}
          onEdit={handleEdit}
          navigate={navigate}
        />
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Добавьте первую локацию</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать локацию</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <IconSelect icons={defaultLocationEmojis} value={editIcon} onValueChange={setEditIcon} className="w-24 flex-shrink-0" />
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Название" className="flex-1" />
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

export default Locations;
