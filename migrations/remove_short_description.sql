-- Migration: Remove short_description column from product table
-- Date: 2025-12-22
-- Description: Removes the short_description field from the product table as it's no longer needed

-- Remove the short_description column
ALTER TABLE product DROP COLUMN IF EXISTS short_description;
