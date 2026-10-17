/*
  Warnings:

  - You are about to drop the column `filePath` on the `WrittenAnswer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "WrittenAnswer" DROP COLUMN "filePath",
ADD COLUMN     "annotatedFileUrl" TEXT,
ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "voiceUrl" TEXT;

-- AlterTable
ALTER TABLE "WrittenExam" ADD COLUMN     "uploadWindowMinutes" INTEGER NOT NULL DEFAULT 10;
