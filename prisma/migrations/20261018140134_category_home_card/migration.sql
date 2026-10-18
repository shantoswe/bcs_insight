-- AlterTable
ALTER TABLE "JobCategory" ADD COLUMN     "color" TEXT NOT NULL DEFAULT 'navy',
ADD COLUMN     "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "showOnHome" BOOLEAN NOT NULL DEFAULT true;

