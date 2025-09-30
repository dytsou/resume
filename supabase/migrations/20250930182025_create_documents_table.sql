/*
  # Create Documents Tracking System

  ## Overview
  This migration creates a comprehensive system for tracking LaTeX document conversions,
  their metadata, and conversion history.

  ## New Tables

  ### `documents`
  Stores metadata about each LaTeX document in the system
  - `id` (uuid, primary key) - Unique identifier for each document
  - `filename` (text, unique) - Original LaTeX filename
  - `title` (text) - Document title extracted from LaTeX
  - `author` (text) - Author(s) extracted from LaTeX
  - `abstract` (text, nullable) - Document abstract if available
  - `created_at` (timestamptz) - When the document was first added
  - `updated_at` (timestamptz) - Last modification timestamp

  ### `conversion_logs`
  Tracks the history of conversion attempts for each document
  - `id` (uuid, primary key) - Unique identifier for each conversion attempt
  - `document_id` (uuid, foreign key) - Reference to the document
  - `status` (text) - Conversion status: 'success', 'failure', 'in_progress'
  - `error_message` (text, nullable) - Error details if conversion failed
  - `html_output_path` (text, nullable) - Path to the generated HTML file
  - `conversion_duration_ms` (integer, nullable) - Time taken for conversion
  - `created_at` (timestamptz) - When the conversion was attempted

  ## Security
  - Enable RLS on both tables
  - Public read access for viewing documents and conversion status
  - No write access through RLS (managed by backend processes)

  ## Notes
  - Documents are tracked automatically by the conversion script
  - Conversion logs provide debugging and monitoring capabilities
  - Default values ensure data consistency
*/

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text UNIQUE NOT NULL,
  title text NOT NULL DEFAULT 'Untitled Document',
  author text NOT NULL DEFAULT 'Unknown Author',
  abstract text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create conversion_logs table
CREATE TABLE IF NOT EXISTS conversion_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'in_progress',
  error_message text,
  html_output_path text,
  conversion_duration_ms integer,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT valid_status CHECK (status IN ('success', 'failure', 'in_progress'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_filename ON documents(filename);
CREATE INDEX IF NOT EXISTS idx_conversion_logs_document_id ON conversion_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_conversion_logs_status ON conversion_logs(status);
CREATE INDEX IF NOT EXISTS idx_conversion_logs_created_at ON conversion_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to documents"
  ON documents
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public read access to conversion logs"
  ON conversion_logs
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
