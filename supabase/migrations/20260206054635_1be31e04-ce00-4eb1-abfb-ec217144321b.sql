-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'operator');

-- Create unit_system enum
CREATE TYPE public.unit_system AS ENUM ('metric', 'imperial');

-- Create project_status enum
CREATE TYPE public.project_status AS ENUM ('draft', 'in_progress', 'completed', 'cancelled');

-- Create shape_type enum for parts
CREATE TYPE public.shape_type AS ENUM ('rectangle', 'l_shape', 'circle', 'arc');

-- Create edge_profile enum
CREATE TYPE public.edge_profile AS ENUM ('raw', 'polished', 'bullnose', 'bevel', 'eased', 'ogee', 'waterfall');

-- User Roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'operator',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  preferred_units unit_system NOT NULL DEFAULT 'metric',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_name TEXT,
  address TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stock Slabs table
CREATE TABLE public.stock_slabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stone_type TEXT NOT NULL,
  stone_name TEXT NOT NULL,
  primary_color TEXT,
  secondary_color TEXT,
  width_mm NUMERIC NOT NULL,
  length_mm NUMERIC NOT NULL,
  thickness_mm NUMERIC NOT NULL DEFAULT 20,
  quantity INTEGER NOT NULL DEFAULT 1,
  cost_per_unit NUMERIC,
  charge_per_unit NUMERIC,
  location TEXT,
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Off-cuts table (remnants from slabs)
CREATE TABLE public.off_cuts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_slab_id UUID REFERENCES public.stock_slabs(id) ON DELETE SET NULL,
  stone_type TEXT NOT NULL,
  stone_name TEXT NOT NULL,
  primary_color TEXT,
  secondary_color TEXT,
  width_mm NUMERIC NOT NULL,
  length_mm NUMERIC NOT NULL,
  thickness_mm NUMERIC NOT NULL DEFAULT 20,
  quantity INTEGER NOT NULL DEFAULT 1,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  room_location TEXT,
  status project_status NOT NULL DEFAULT 'draft',
  kerf_width_mm NUMERIC NOT NULL DEFAULT 3,
  assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Parts table
CREATE TABLE public.parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  width_mm NUMERIC NOT NULL,
  length_mm NUMERIC NOT NULL,
  shape_type shape_type NOT NULL DEFAULT 'rectangle',
  shape_data JSONB,
  cutout_data JSONB,
  edge_profiles JSONB,
  allow_rotation BOOLEAN NOT NULL DEFAULT true,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  assigned_slab_id UUID REFERENCES public.stock_slabs(id) ON DELETE SET NULL,
  assigned_offcut_id UUID REFERENCES public.off_cuts(id) ON DELETE SET NULL,
  position_x NUMERIC,
  position_y NUMERIC,
  rotation_degrees NUMERIC DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Job Settings table (per-project settings)
CREATE TABLE public.job_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL UNIQUE,
  default_edge_profile edge_profile NOT NULL DEFAULT 'raw',
  blade_kerf_mm NUMERIC NOT NULL DEFAULT 3,
  unit_preference unit_system NOT NULL DEFAULT 'metric',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_slabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.off_cuts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_settings ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user has any role (is authenticated and registered)
CREATE OR REPLACE FUNCTION public.is_registered_user(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
  )
$$;

-- Trigger function to auto-create profile and role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  -- Assign default operator role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'operator');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers to all tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stock_slabs_updated_at
  BEFORE UPDATE ON public.stock_slabs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_off_cuts_updated_at
  BEFORE UPDATE ON public.off_cuts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parts_updated_at
  BEFORE UPDATE ON public.parts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_settings_updated_at
  BEFORE UPDATE ON public.job_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins and managers can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- RLS Policies for clients (all registered users can view, admins/managers can modify)
CREATE POLICY "Registered users can view clients"
  ON public.clients FOR SELECT
  TO authenticated
  USING (public.is_registered_user(auth.uid()));

CREATE POLICY "Admins and managers can manage clients"
  ON public.clients FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- RLS Policies for stock_slabs (all registered can view, admins can modify)
CREATE POLICY "Registered users can view slabs"
  ON public.stock_slabs FOR SELECT
  TO authenticated
  USING (public.is_registered_user(auth.uid()));

CREATE POLICY "Admins can manage slabs"
  ON public.stock_slabs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for off_cuts
CREATE POLICY "Registered users can view offcuts"
  ON public.off_cuts FOR SELECT
  TO authenticated
  USING (public.is_registered_user(auth.uid()));

CREATE POLICY "Admins can manage offcuts"
  ON public.off_cuts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for projects
CREATE POLICY "Registered users can view projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (public.is_registered_user(auth.uid()));

CREATE POLICY "Admins and managers can create projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins, managers, and assigned users can update projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'manager') OR 
    assigned_user_id = auth.uid()
  );

CREATE POLICY "Admins can delete projects"
  ON public.projects FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for parts
CREATE POLICY "Registered users can view parts"
  ON public.parts FOR SELECT
  TO authenticated
  USING (public.is_registered_user(auth.uid()));

CREATE POLICY "Registered users can manage parts"
  ON public.parts FOR ALL
  TO authenticated
  USING (public.is_registered_user(auth.uid()))
  WITH CHECK (public.is_registered_user(auth.uid()));

-- RLS Policies for job_settings
CREATE POLICY "Registered users can view job settings"
  ON public.job_settings FOR SELECT
  TO authenticated
  USING (public.is_registered_user(auth.uid()));

CREATE POLICY "Admins and managers can manage job settings"
  ON public.job_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- Create indexes for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_projects_client_id ON public.projects(client_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_parts_project_id ON public.parts(project_id);
CREATE INDEX idx_off_cuts_parent_slab ON public.off_cuts(parent_slab_id);
CREATE INDEX idx_stock_slabs_type ON public.stock_slabs(stone_type);
CREATE INDEX idx_stock_slabs_name ON public.stock_slabs(stone_name);