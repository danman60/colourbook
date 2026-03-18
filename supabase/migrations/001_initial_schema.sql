-- Colourbook Initial Schema
-- All tables prefixed with cb_ to avoid conflicts in shared Supabase project

-- Enum types
CREATE TYPE cb_user_role AS ENUM ('user', 'admin');
CREATE TYPE cb_book_status AS ENUM ('draft', 'complete', 'ordered');
CREATE TYPE cb_generation_status AS ENUM ('pending', 'generating', 'complete', 'failed');
CREATE TYPE cb_order_status AS ENUM ('pending', 'paid', 'processing', 'printing', 'shipped', 'delivered', 'cancelled');

-- Profiles (extends auth.users)
CREATE TABLE cb_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  stripe_customer_id text,
  generation_credits int NOT NULL DEFAULT 20,
  role cb_user_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION cb_handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO cb_profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_cb
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION cb_handle_new_user();

-- Regions
CREATE TABLE cb_regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country text NOT NULL DEFAULT 'CA',
  province text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Print Partners
CREATE TABLE cb_print_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  website_url text,
  region_id uuid NOT NULL REFERENCES cb_regions(id),
  address text NOT NULL,
  city text NOT NULL,
  province text NOT NULL,
  postal_code text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  price_per_book_cents int NOT NULL DEFAULT 2999,
  price_per_extra_page_cents int NOT NULL DEFAULT 100,
  shipping_flat_rate_cents int NOT NULL DEFAULT 999,
  turnaround_days int NOT NULL DEFAULT 7,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_cb_print_partners_region ON cb_print_partners(region_id);

-- Family Members
CREATE TABLE cb_family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES cb_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  relationship text NOT NULL,
  original_photo_url text NOT NULL,
  thumbnail_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_cb_family_members_user ON cb_family_members(user_id);

-- Books
CREATE TABLE cb_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES cb_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  cover_image_url text,
  status cb_book_status NOT NULL DEFAULT 'draft',
  page_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_cb_books_user ON cb_books(user_id);

-- Pages (generated coloring pages)
CREATE TABLE cb_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES cb_profiles(id) ON DELETE CASCADE,
  family_member_id uuid REFERENCES cb_family_members(id) ON DELETE SET NULL,
  prompt text NOT NULL,
  scene_description text,
  original_image_url text,
  coloring_page_url text,
  thumbnail_url text,
  generation_status cb_generation_status NOT NULL DEFAULT 'pending',
  generation_error text,
  openai_request_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_cb_pages_user ON cb_pages(user_id);
CREATE INDEX idx_cb_pages_family_member ON cb_pages(family_member_id);
CREATE INDEX idx_cb_pages_status ON cb_pages(generation_status);

-- Book Pages (junction table for book <-> page ordering)
CREATE TABLE cb_book_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES cb_books(id) ON DELETE CASCADE,
  page_id uuid NOT NULL REFERENCES cb_pages(id) ON DELETE CASCADE,
  page_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(book_id, page_id)
);

CREATE INDEX idx_cb_book_pages_book ON cb_book_pages(book_id);

-- Orders
CREATE TABLE cb_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES cb_profiles(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES cb_books(id),
  print_partner_id uuid NOT NULL REFERENCES cb_print_partners(id),
  status cb_order_status NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  amount_cents int NOT NULL,
  currency text NOT NULL DEFAULT 'cad',
  shipping_name text NOT NULL,
  shipping_address_line1 text NOT NULL,
  shipping_address_line2 text,
  shipping_city text NOT NULL,
  shipping_province text NOT NULL,
  shipping_postal_code text NOT NULL,
  shipping_country text NOT NULL DEFAULT 'CA',
  tracking_number text,
  estimated_delivery timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_cb_orders_user ON cb_orders(user_id);
CREATE INDEX idx_cb_orders_status ON cb_orders(status);
CREATE INDEX idx_cb_orders_book ON cb_orders(book_id);

-- Prompt Suggestions
CREATE TABLE cb_prompt_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  prompt_text text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_cb_prompt_suggestions_category ON cb_prompt_suggestions(category);

-- RLS Policies
ALTER TABLE cb_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cb_family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE cb_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE cb_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cb_book_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cb_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE cb_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cb_print_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE cb_prompt_suggestions ENABLE ROW LEVEL SECURITY;

-- Profiles: users see only their own
CREATE POLICY "Users can view own profile" ON cb_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON cb_profiles FOR UPDATE USING (auth.uid() = id);

-- Family members: users see only their own
CREATE POLICY "Users can view own family members" ON cb_family_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own family members" ON cb_family_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own family members" ON cb_family_members FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own family members" ON cb_family_members FOR DELETE USING (auth.uid() = user_id);

-- Books: users see only their own
CREATE POLICY "Users can view own books" ON cb_books FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own books" ON cb_books FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own books" ON cb_books FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own books" ON cb_books FOR DELETE USING (auth.uid() = user_id);

-- Pages: users see only their own
CREATE POLICY "Users can view own pages" ON cb_pages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pages" ON cb_pages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pages" ON cb_pages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pages" ON cb_pages FOR DELETE USING (auth.uid() = user_id);

-- Book pages: users can manage pages in their own books
CREATE POLICY "Users can view book pages" ON cb_book_pages FOR SELECT USING (
  EXISTS (SELECT 1 FROM cb_books WHERE id = book_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert book pages" ON cb_book_pages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM cb_books WHERE id = book_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update book pages" ON cb_book_pages FOR UPDATE USING (
  EXISTS (SELECT 1 FROM cb_books WHERE id = book_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete book pages" ON cb_book_pages FOR DELETE USING (
  EXISTS (SELECT 1 FROM cb_books WHERE id = book_id AND user_id = auth.uid())
);

-- Orders: users see only their own
CREATE POLICY "Users can view own orders" ON cb_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own orders" ON cb_orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Regions and print partners: publicly readable
CREATE POLICY "Anyone can view active regions" ON cb_regions FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view active print partners" ON cb_print_partners FOR SELECT USING (is_active = true);

-- Prompt suggestions: publicly readable
CREATE POLICY "Anyone can view active suggestions" ON cb_prompt_suggestions FOR SELECT USING (is_active = true);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('family-photos', 'family-photos', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('coloring-pages', 'coloring-pages', true) ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload family photos" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'family-photos' AND auth.uid() IS NOT NULL
);
CREATE POLICY "Anyone can view family photos" ON storage.objects FOR SELECT USING (
  bucket_id = 'family-photos'
);
CREATE POLICY "Users can upload coloring pages" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'coloring-pages' AND auth.uid() IS NOT NULL
);
CREATE POLICY "Anyone can view coloring pages" ON storage.objects FOR SELECT USING (
  bucket_id = 'coloring-pages'
);

-- Seed: Prompt Suggestions
INSERT INTO cb_prompt_suggestions (category, prompt_text, sort_order) VALUES
  ('outdoor', '{{name}} having a picnic in a sunny meadow with butterflies', 1),
  ('outdoor', '{{name}} riding a bicycle through a neighborhood', 2),
  ('outdoor', '{{name}} playing in the snow and building a snowman', 3),
  ('holiday', '{{name}} decorating a Christmas tree with ornaments', 1),
  ('holiday', '{{name}} carving a pumpkin for Halloween', 2),
  ('holiday', '{{name}} hunting for Easter eggs in a garden', 3),
  ('fantasy', '{{name}} as a brave knight riding a friendly dragon', 1),
  ('fantasy', '{{name}} exploring an enchanted forest with fairy friends', 2),
  ('fantasy', '{{name}} as a superhero flying over the city', 3),
  ('everyday', '{{name}} cooking pancakes in the kitchen', 1),
  ('everyday', '{{name}} reading a bedtime story with a pet', 2),
  ('everyday', '{{name}} watering flowers in a garden', 3),
  ('sports', '{{name}} scoring a goal in a soccer game', 1),
  ('sports', '{{name}} swimming with dolphins in the ocean', 2),
  ('sports', '{{name}} doing gymnastics at the park', 3),
  ('animals', '{{name}} at the zoo feeding friendly giraffes', 1),
  ('animals', '{{name}} playing fetch with a puppy in the backyard', 2),
  ('animals', '{{name}} riding a horse through a countryside trail', 3),
  ('adventure', '{{name}} exploring a pirate ship on the high seas', 1),
  ('adventure', '{{name}} camping under the stars with a cozy campfire', 2);

-- Seed: Regions
INSERT INTO cb_regions (name, country, province) VALUES
  ('Southern Ontario', 'CA', 'ON'),
  ('Greater Toronto Area', 'CA', 'ON');

-- Seed: Print Partners (sample)
INSERT INTO cb_print_partners (name, contact_email, region_id, address, city, province, postal_code, price_per_book_cents, price_per_extra_page_cents, shipping_flat_rate_cents, turnaround_days)
SELECT
  'Maple Leaf Print Co.',
  'orders@mapleleafprint.example.com',
  id,
  '123 King Street West',
  'Hamilton',
  'ON',
  'L8P 1A2',
  2999,
  100,
  999,
  7
FROM cb_regions WHERE name = 'Southern Ontario'
LIMIT 1;

INSERT INTO cb_print_partners (name, contact_email, region_id, address, city, province, postal_code, price_per_book_cents, price_per_extra_page_cents, shipping_flat_rate_cents, turnaround_days)
SELECT
  'Toronto Bindery',
  'hello@torontobindery.example.com',
  id,
  '456 Queen Street East',
  'Toronto',
  'ON',
  'M5A 1T1',
  3499,
  125,
  799,
  5
FROM cb_regions WHERE name = 'Greater Toronto Area'
LIMIT 1;
