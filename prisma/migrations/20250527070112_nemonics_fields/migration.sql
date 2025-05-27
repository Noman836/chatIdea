/*
  Warnings:

  - A unique constraint covering the columns `[publicAddress]` on the table `Wallet` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `encryptedPhrase` to the `Wallet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `publicAddress` to the `Wallet` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "encryptedPhrase" TEXT NOT NULL,
ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'bip39',
ADD COLUMN     "publicAddress" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_publicAddress_key" ON "Wallet"("publicAddress");
