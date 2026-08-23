-- CreateEnum
CREATE TYPE "TagKind" AS ENUM ('INCOME', 'EXPENSE');

-- AlterTable
ALTER TABLE "Debt" ADD COLUMN     "initialTransactionId" TEXT;

-- AlterTable (nullable first, backfill, then NOT NULL)
ALTER TABLE "Tag" ADD COLUMN     "kind" "TagKind";

-- Backfill: tags used by any INCOME transaction and never by EXPENSE become INCOME; everything else EXPENSE
UPDATE "Tag" t
SET "kind" = CASE
  WHEN EXISTS (
    SELECT 1 FROM "Transaction" tr WHERE tr."tagId" = t.id AND tr."type" = 'INCOME'
  ) AND NOT EXISTS (
    SELECT 1 FROM "Transaction" tr WHERE tr."tagId" = t.id AND tr."type" = 'EXPENSE'
  ) THEN 'INCOME'::"TagKind"
  ELSE 'EXPENSE'::"TagKind"
END;

ALTER TABLE "Tag" ALTER COLUMN "kind" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Debt" ADD CONSTRAINT "Debt_initialTransactionId_fkey" FOREIGN KEY ("initialTransactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
