/*
  Warnings:

  - A unique constraint covering the columns `[nombre,grupo,generacion]` on the table `grupos` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `grupo` to the `grupos` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "grupos_nombre_generacion_key";

-- AlterTable
ALTER TABLE "grupos" ADD COLUMN     "grupo" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "grupos_nombre_grupo_generacion_key" ON "grupos"("nombre", "grupo", "generacion");
