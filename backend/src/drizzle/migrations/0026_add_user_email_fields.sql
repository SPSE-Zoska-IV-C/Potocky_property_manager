-- Add email and emailVerified columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Update existing rows with a unique email based on username
UPDATE users 
SET email = username || '@temp.com' 
WHERE email IS NULL OR email = '';

-- Now that we have unique values, we can add NOT NULL and UNIQUE constraints
ALTER TABLE users
ALTER COLUMN email SET NOT NULL,
ADD CONSTRAINT users_email_unique UNIQUE (email);
