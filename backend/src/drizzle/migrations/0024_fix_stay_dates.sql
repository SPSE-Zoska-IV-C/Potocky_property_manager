ALTER TABLE "stays" ALTER COLUMN "checkIn" TYPE date USING "checkIn"::date;
ALTER TABLE "stays" ALTER COLUMN "checkOut" TYPE date USING "checkOut"::date; 