import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/hooks/usePreferences";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";

export interface Item {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  photo_url: string | null;
  category_id: string | null;
  location_id: string | null;
  purchase_date: string | null;
  price: number | null;
  currency: string | null;
  warranty_expires: string | null;
  serial_number: string | null;
  barcode: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  categories?: { name: string; icon: string | null; color: string | null } | null;
  locations?: { name: string; icon: string | null } | null;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  color: string | null;
  parent_id: string | null;
  created_at: string;
}

export interface Location {
  id: string;
  user_id: string;
  parent_id: string | null;
  name: string;
  icon: string | null;
  color: string | null;
  created_at: string;
}

// Helper: build full location path
export const getLocationPath = (locationId: string | null, locations: Location[]): Location[] => {
  if (!locationId || !locations.length) return [];
  const path: Location[] = [];
  let current = locations.find(l => l.id === locationId);
  while (current) {
    path.unshift(current);
    current = current.parent_id ? locations.find(l => l.id === current!.parent_id) : undefined;
  }
  return path;
};

export const getLocationDisplayName = (location: Location, locations: Location[]): string => {
  const path = getLocationPath(location.id, locations);
  return path.map(l => l.name).join(" → ");
};

// Helper: build full category path
export const getCategoryPath = (categoryId: string | null, categories: Category[]): Category[] => {
  if (!categoryId || !categories.length) return [];
  const path: Category[] = [];
  let current = categories.find(c => c.id === categoryId);
  while (current) {
    path.unshift(current);
    current = current.parent_id ? categories.find(c => c.id === current!.parent_id) : undefined;
  }
  return path;
};

export const getCategoryDisplayName = (categoryId: string | null, categories: Category[]): string => {
  const path = getCategoryPath(categoryId, categories);
  return path.map(c => `${c.icon ?? ''} ${c.name}`).join(" → ");
};

export const getCurrencySymbol = (currency: string | null): string => {
  switch (currency) {
    case "UAH": return "₴";
    case "USD": return "$";
    case "EUR": return "€";
    default: return "€";
  }
};

export const useItems = (filters?: { category_id?: string; location_id?: string; location_ids?: string[]; search?: string }) => {
  return useQuery({
    queryKey: ["items", filters],
    queryFn: async () => {
      let query = supabase
        .from("items")
        .select("*, categories(name, icon, color), locations(name, icon)")
        .order("created_at", { ascending: false });

      if (filters?.category_id) query = query.eq("category_id", filters.category_id);
      if (filters?.location_ids?.length) query = query.in("location_id", filters.location_ids);
      else if (filters?.location_id) query = query.eq("location_id", filters.location_id);
      if (filters?.search) query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,serial_number.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);

      const { data, error } = await query;
      if (error) throw error;
      return data as Item[];
    },
  });
};

export const useItem = (id: string) => {
  return useQuery({
    queryKey: ["item", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*, categories(name, icon, color), locations(name, icon)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Item;
    },
    enabled: !!id,
  });
};

export const useCreateItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();
  const { isOnline, enqueue } = useOfflineQueue();

  return useMutation({
    mutationFn: async (item: Omit<Item, "id" | "created_at" | "updated_at" | "categories" | "locations">) => {
      if (!isOnline) {
        enqueue({ type: "create", table: "items", payload: item });
        return { id: crypto.randomUUID(), ...item } as any;
      }
      const { data, error } = await supabase.from("items").insert(item).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast({ title: isOnline ? t("toasts.itemAdded") : t("toasts.savedOffline") });
    },
    onError: (e: Error) => {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    },
  });
};

export const useUpdateItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Item> & { id: string }) => {
      const { categories, locations, ...cleanUpdates } = updates as any;
      const { data, error } = await supabase.from("items").update(cleanUpdates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["item", data.id] });
      toast({ title: t("toasts.itemUpdated") });
    },
    onError: (e: Error) => {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    },
  });
};

export const useDeleteItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast({ title: t("toasts.itemDeleted") });
    },
    onError: (e: Error) => {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    },
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data as Category[];
    },
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();

  return useMutation({
    mutationFn: async (cat: Omit<Category, "id" | "created_at">) => {
      const { data, error } = await supabase.from("categories").insert(cat).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: t("toasts.categoryCreated") });
    },
    onError: (e: Error) => {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Category> & { id: string }) => {
      const { data, error } = await supabase.from("categories").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast({ title: t("toasts.categoryUpdated") });
    },
    onError: (e: Error) => {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: t("toasts.categoryDeleted") });
    },
  });
};

export const useLocations = () => {
  return useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("locations").select("*").order("name");
      if (error) throw error;
      return data as Location[];
    },
  });
};

export const useCreateLocation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();

  return useMutation({
    mutationFn: async (loc: Omit<Location, "id" | "created_at">) => {
      const { data, error } = await supabase.from("locations").insert(loc).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast({ title: t("toasts.locationCreated") });
    },
    onError: (e: Error) => {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    },
  });
};

export const useUpdateLocation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Location> & { id: string }) => {
      const { data, error } = await supabase.from("locations").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast({ title: t("toasts.locationUpdated") });
    },
    onError: (e: Error) => {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    },
  });
};

export const useDeleteLocation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("locations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast({ title: t("toasts.locationDeleted") });
    },
  });
};

// Barcode lookup
export const useBarcodeLookup = () => {
  const { toast } = useToast();
  const { t } = useI18n();

  return useMutation({
    mutationFn: async (barcode: string) => {
      const { data, error } = await supabase.functions.invoke('barcode-lookup', {
        body: { barcode },
      });
      if (error) throw error;
      return data as {
        found: boolean;
        name?: string;
        description?: string;
        brand?: string;
        image_url?: string;
        barcode: string;
      };
    },
    onError: (e: Error) => {
      toast({ title: t("toasts.lookupError"), description: e.message, variant: "destructive" });
    },
  });
};
