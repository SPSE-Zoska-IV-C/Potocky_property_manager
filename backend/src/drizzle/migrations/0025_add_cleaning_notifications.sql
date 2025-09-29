-- Drop existing objects if they exist
DROP TRIGGER IF EXISTS update_cleaning_notifications_updated_at ON cleaning_notifications;
DROP FUNCTION IF EXISTS update_cleaning_notifications_updated_at();

-- Drop and recreate the table with new constraints
DROP TABLE IF EXISTS cleaning_notifications;

-- Create cleaning notifications table
CREATE TABLE IF NOT EXISTS cleaning_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES property("propertyId") ON DELETE CASCADE,
    assigned_to UUID NOT NULL REFERENCES users("id") ON DELETE CASCADE,
    stay_id UUID REFERENCES stays("stayId") ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    scheduled_date DATE NOT NULL,
    completed_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users("id") ON DELETE CASCADE,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_cleaning_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cleaning_notifications_updated_at
    BEFORE UPDATE ON cleaning_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_cleaning_notifications_updated_at(); 