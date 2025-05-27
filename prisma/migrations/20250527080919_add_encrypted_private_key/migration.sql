/*
  Warnings:

  - Added the required column `encryptedPrivateKey` to the `Wallet` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "encryptedPrivateKey" TEXT NOT NULL,
ALTER COLUMN "encryptedPhrase" DROP NOT NULL;
