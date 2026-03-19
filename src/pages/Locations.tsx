import { useState } from "react";
import { useLocations, useCreateLocation, useDeleteLocation, useItems } from "@/hooks/useData";
import { useAuth } from "@/hooks/useAuth";
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
import { Plus, ChevronRight, ChevronDown, Trash2, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Location } from "@/hooks/useData";

const LocationTree = ({ locations, parentId, items, onDelete, navigate, level = 0 }: {
  locations: Location[];
  parentId: string | null;
  items: any[];
  onDelete: (id: string) => void;
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
        const isExpanded = expanded[loc.id];

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
                  className="flex-1 text-left font-medium text-sm text-foreground hover:text-accent transition-colors"
                  onClick={() => navigate(`/items?location=${loc.id}`)}
                >
                  {loc.name}
                </button>
                <Badge variant="secondary" className="text-xs">{itemCount}</Badge>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
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
            {isExpanded && (
              <LocationTree locations={locations} parentId={loc.id} items={items} onDelete={onDelete} navigate={navigate} level={level + 1} />
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
  const navigate = useNavigate();

  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📍");
  const [parentId, setParentId] = useState<string>("");

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

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">📍 Локации</h1>

      {/* Add form */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input value={newIcon} onChange={(e) => setNewIcon(e.target.value)} className="w-14 text-center" maxLength={2} />
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Название локации" className="flex-1" />
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="border border-input rounded-md px-2 text-sm bg-card text-foreground"
            >
              <option value="">Корневая</option>
              {locations?.map((l) => (
                <option key={l.id} value={l.id}>{l.icon} {l.name}</option>
              ))}
            </select>
            <Button onClick={handleAdd} disabled={!newName.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
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
    </AppLayout>
  );
};

export default Locations;
