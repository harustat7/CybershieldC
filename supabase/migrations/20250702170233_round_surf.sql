/*
  # Enhanced users table with proper triggers and OTP verification

  1. New Tables
    - `users` table with comprehensive user data
    - Proper triggers for auth events

  2. Security
    - Enable RLS on `users` table
    - Add policies for authenticated users

  3. Functions
    - Handle new user creation
    - Handle user updates on auth changes
    - Handle password resets
*/

-- Create users table with all necessary fields
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  email_verified boolean DEFAULT false,
  last_login timestamptz,
  password_reset_at timestamptz,
  otp_verified boolean DEFAULT false,
  profile_completed boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Drop existing functions and triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS handle_user_update();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO users (
    id, 
    email, 
    full_name, 
    email_verified,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    COALESCE(NEW.created_at, now()),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    email_verified = EXCLUDED.email_verified,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle user updates
CREATE OR REPLACE FUNCTION handle_user_update()
RETURNS trigger AS $$
BEGIN
  -- Update users table when auth.users is updated
  UPDATE users SET
    email = NEW.email,
    email_verified = COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    last_login = CASE 
      WHEN NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at 
      THEN NEW.last_sign_in_at 
      ELSE users.last_login 
    END,
    password_reset_at = CASE 
      WHEN NEW.updated_at IS DISTINCT FROM OLD.updated_at 
      AND NEW.encrypted_password IS DISTINCT FROM OLD.encrypted_password
      THEN now()
      ELSE users.password_reset_at 
    END,
    updated_at = now()
  WHERE id = NEW.id;
  
  -- If no row was updated, insert a new one
  IF NOT FOUND THEN
    INSERT INTO users (
      id, 
      email, 
      full_name, 
      email_verified,
      last_login,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
      NEW.last_sign_in_at,
      COALESCE(NEW.created_at, now()),
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_user_update();