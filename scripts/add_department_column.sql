-- Add department column to support_tickets table
-- This enables routing tickets to the correct admin dashboard
-- Valid values: general, it, finance, hr, vendor, logistics

ALTER TABLE support_tickets 
ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'general';

-- Add a comment for documentation
COMMENT ON COLUMN support_tickets.department IS 'Department routing: general, it, finance, hr, vendor, logistics';
