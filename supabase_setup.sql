-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Categories Table
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE
);

-- 2. Products Table
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  price numeric(10, 2) NOT NULL,
  dimensions jsonb,
  model_url text,
  thumbnail_url text,
  category_id uuid REFERENCES public.categories(id)
);

-- 3. Product Variants Table
CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  color_name text NOT NULL,
  color_hex text NOT NULL,
  material_name text
);

-- 4. Profiles Table
-- This table will store public user data.
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  updated_at timestamp with time zone
);

-- Function to automatically create a profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Cart Items Table
CREATE TABLE public.cart_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  CONSTRAINT unique_user_variant UNIQUE (user_id, variant_id)
);

-- 6. Orders Table
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_amount numeric(10, 2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 7. Order Items Table
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES public.product_variants(id),
  quantity integer NOT NULL,
  price_at_purchase numeric(10, 2) NOT NULL
);


-- ROW LEVEL SECURITY (RLS) POLICIES

-- 1. Enable RLS for all relevant tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 2. Policies for `profiles` table
-- Users can view any profile (public data).
CREATE POLICY "Allow public read access to profiles" ON public.profiles
  FOR SELECT USING (true);
-- Users can only insert and update their own profile.
CREATE POLICY "Allow individual insert access to profiles" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow individual update access to profiles" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 3. Policies for `cart_items` table
-- Users can only view, insert, update, and delete their own cart items.
CREATE POLICY "Allow individual access to cart_items" ON public.cart_items
  FOR ALL USING (auth.uid() = user_id);

-- 4. Policies for `orders` and `order_items` tables
-- Users can only view their own orders.
CREATE POLICY "Allow individual read access to orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);
-- Users can only create orders for themselves.
CREATE POLICY "Allow individual insert access to orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only view items belonging to their own orders.
CREATE POLICY "Allow individual read access to order_items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    )
  );
-- Users can only insert items into their own orders.
CREATE POLICY "Allow individual insert access to order_items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    )
  );

-- 5. Public tables (`products`, `categories`, `product_variants`)
-- These tables should be readable by everyone, including unauthenticated users.
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.product_variants FOR SELECT USING (true);
