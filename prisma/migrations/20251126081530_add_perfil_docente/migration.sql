/*
  Warnings:

  - A unique constraint covering the columns `[version]` on the table `cuestionarios` will be added. If there are existing duplicate values, this will fail.
  - Made the column `nombre` on table `perfil_alumno` required. This step will fail if there are existing NULL values in that column.
  - Made the column `apellido` on table `perfil_alumno` required. This step will fail if there are existing NULL values in that column.
  - Made the column `password_hash` on table `usuarios` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "perfil_alumno" ALTER COLUMN "nombre" SET NOT NULL,
ALTER COLUMN "apellido" SET NOT NULL;

-- AlterTable
ALTER TABLE "usuarios" ALTER COLUMN "password_hash" SET NOT NULL;

-- CreateTable
CREATE TABLE "perfil_docente" (
    "usuario_id" TEXT NOT NULL,
    "empleado_numero" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,

    CONSTRAINT "perfil_docente_pkey" PRIMARY KEY ("usuario_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "perfil_docente_empleado_numero_key" ON "perfil_docente"("empleado_numero");

-- CreateIndex
CREATE UNIQUE INDEX "cuestionarios_version_key" ON "cuestionarios"("version");

-- AddForeignKey
ALTER TABLE "perfil_docente" ADD CONSTRAINT "perfil_docente_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
