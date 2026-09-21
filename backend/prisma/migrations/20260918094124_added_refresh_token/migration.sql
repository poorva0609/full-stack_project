/*
  Warnings:

  - A unique constraint covering the columns `[jti]` on the table `refreshToken` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `jti` to the `refreshToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "refreshToken" ADD COLUMN     "jti" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "refreshToken_jti_key" ON "refreshToken"("jti");
