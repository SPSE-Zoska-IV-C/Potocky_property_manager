ALTER TABLE "payment" ALTER COLUMN id TYPE uuid USING id::uuid;
ALTER TABLE "payment" ALTER COLUMN "userId" SET DATA TYPE uuid;