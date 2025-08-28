-- Create user roles enum
CREATE TYPE app_role AS ENUM ('admin', 'sales', 'merchandiser', 'marketing', 'creatives', 'franchise', 'customer');

-- Create company settings table
CREATE TABLE company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL DEFAULT 'Cutiepaw',
  company_email TEXT,
  company_phone TEXT,
  company_address TEXT,
  header_logo_url TEXT,
  sidebar_logo_url TEXT,
  auth_logo_url TEXT,
  favicon_url TEXT,
  logo_size_header INTEGER DEFAULT 150,
  logo_size_sidebar INTEGER DEFAULT 120,
  logo_size_auth INTEGER DEFAULT 200,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role app_role NOT NULL DEFAULT 'customer',
  department TEXT,
  designation TEXT,
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create departments table
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  head_user_id UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create designations table
CREATE TABLE designations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department_id UUID REFERENCES departments(id),
  level INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  customer_code TEXT UNIQUE,
  company_name TEXT,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  pincode TEXT,
  gst_number TEXT,
  customer_type TEXT DEFAULT 'retail',
  credit_limit DECIMAL(12,2) DEFAULT 0,
  credit_days INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create franchise_partners table
CREATE TABLE franchise_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  franchise_code TEXT UNIQUE,
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  territory TEXT,
  investment_amount DECIMAL(12,2),
  agreement_date DATE,
  status TEXT DEFAULT 'active',
  commission_rate DECIMAL(5,2) DEFAULT 10.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_number TEXT UNIQUE,
  customer_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  company_name TEXT,
  source TEXT,
  status TEXT DEFAULT 'new',
  priority TEXT DEFAULT 'medium',
  assigned_to UUID REFERENCES profiles(id),
  estimated_value DECIMAL(12,2),
  expected_close_date DATE,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create quotes table
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number TEXT UNIQUE,
  customer_id UUID REFERENCES customers(id),
  lead_id UUID REFERENCES leads(id),
  quote_date DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  status TEXT DEFAULT 'draft',
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  terms_conditions TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE,
  customer_id UUID REFERENCES customers(id),
  quote_id UUID REFERENCES quotes(id),
  order_date DATE DEFAULT CURRENT_DATE,
  delivery_date DATE,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'normal',
  payment_status TEXT DEFAULT 'pending',
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  shipping_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  shipping_address TEXT,
  billing_address TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create product categories table
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  parent_category_id UUID REFERENCES product_categories(id),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sizes table
CREATE TABLE sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT UNIQUE,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create fabrics table
CREATE TABLE fabrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT,
  composition TEXT,
  care_instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create warehouses table
CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  address TEXT,
  city TEXT,
  state TEXT,
  manager_id UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES product_categories(id),
  fabric_id UUID REFERENCES fabrics(id),
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_price DECIMAL(10,2) DEFAULT 0,
  weight DECIMAL(8,3),
  dimensions TEXT,
  color_options TEXT[],
  image_urls TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE designations ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fabrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create function to check user role
CREATE OR REPLACE FUNCTION check_user_role(required_role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = required_role
  );
$$;

-- Create RLS policies
CREATE POLICY "Company settings accessible to all authenticated users"
ON company_settings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can modify company settings"
ON company_settings FOR ALL
TO authenticated
USING (check_user_role('admin'));

CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid() OR check_user_role('admin'));

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Only admins can create profiles"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (check_user_role('admin'));

-- Basic policies for other tables (admins and relevant roles can access)
CREATE POLICY "Admin access to departments"
ON departments FOR ALL
TO authenticated
USING (check_user_role('admin'));

CREATE POLICY "Admin access to designations"
ON designations FOR ALL
TO authenticated
USING (check_user_role('admin'));

CREATE POLICY "CRM access to customers"
ON customers FOR ALL
TO authenticated
USING (check_user_role('admin') OR check_user_role('sales') OR check_user_role('marketing'));

CREATE POLICY "Franchise access"
ON franchise_partners FOR ALL
TO authenticated
USING (check_user_role('admin') OR check_user_role('franchise') OR user_id = auth.uid());

-- Insert default company settings
INSERT INTO company_settings (company_name) VALUES ('Cutiepaw');

-- Create profile trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'customer')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create update function for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();