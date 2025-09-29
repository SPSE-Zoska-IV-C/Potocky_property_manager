CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $BODY$
BEGIN
    NEW."updatedAt" = now();
    RETURN NEW;
END;
$BODY$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_stays_updated_at ON "stays";
CREATE TRIGGER update_stays_updated_at
    BEFORE UPDATE ON "stays"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 