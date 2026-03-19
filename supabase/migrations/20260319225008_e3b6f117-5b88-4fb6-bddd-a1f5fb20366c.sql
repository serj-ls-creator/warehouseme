
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📦',
  color TEXT DEFAULT '#1E2A4A',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categories" ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- Locations table (with parent_id for nesting)
CREATE TABLE public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📍',
  color TEXT DEFAULT '#1E2A4A',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own locations" ON public.locations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own locations" ON public.locations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own locations" ON public.locations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own locations" ON public.locations FOR DELETE USING (auth.uid() = user_id);

-- Items table
CREATE TABLE public.items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  photo_url TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  purchase_date DATE,
  price NUMERIC(12,2),
  currency TEXT DEFAULT 'RUB',
  warranty_expires DATE,
  serial_number TEXT,
  barcode TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own items" ON public.items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own items" ON public.items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own items" ON public.items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own items" ON public.items FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'other',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents" ON public.documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own documents" ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own documents" ON public.documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own documents" ON public.documents FOR DELETE USING (auth.uid() = user_id);

-- Storage buckets for photos and documents
INSERT INTO storage.buckets (id, name, public) VALUES ('item-photos', 'item-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('item-documents', 'item-documents', false);

CREATE POLICY "Users can view item photos" ON storage.objects FOR SELECT USING (bucket_id = 'item-photos');
CREATE POLICY "Users can upload item photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'item-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update item photos" ON storage.objects FOR UPDATE USING (bucket_id = 'item-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete item photos" ON storage.objects FOR DELETE USING (bucket_id = 'item-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own doc files" ON storage.objects FOR SELECT USING (bucket_id = 'item-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can upload own doc files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'item-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own doc files" ON storage.objects FOR UPDATE USING (bucket_id = 'item-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own doc files" ON storage.objects FOR DELETE USING (bucket_id = 'item-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Indexes
CREATE INDEX idx_items_user_id ON public.items(user_id);
CREATE INDEX idx_items_category_id ON public.items(category_id);
CREATE INDEX idx_items_location_id ON public.items(location_id);
CREATE INDEX idx_items_warranty_expires ON public.items(warranty_expires);
CREATE INDEX idx_locations_parent_id ON public.locations(parent_id);
CREATE INDEX idx_documents_item_id ON public.documents(item_id);
