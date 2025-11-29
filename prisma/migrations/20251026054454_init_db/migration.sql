/*
  Warnings:

  - You are about to drop the `Questionnaire` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `audit_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `class_teachers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `classes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `enrollments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `recommendations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `responses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_profile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `trait_scores` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('student', 'teacher');

-- CreateEnum
CREATE TYPE "NivelRasgo" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "Rasgo" AS ENUM ('extraversion', 'agreeableness', 'conscientiousness', 'emotional_stability', 'openness');

-- DropForeignKey
ALTER TABLE "public"."audit_logs" DROP CONSTRAINT "audit_logs_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."class_teachers" DROP CONSTRAINT "class_teachers_classId_fkey";

-- DropForeignKey
ALTER TABLE "public"."class_teachers" DROP CONSTRAINT "class_teachers_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "public"."enrollments" DROP CONSTRAINT "enrollments_classId_fkey";

-- DropForeignKey
ALTER TABLE "public"."enrollments" DROP CONSTRAINT "enrollments_studentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."recommendations" DROP CONSTRAINT "recommendations_traitScoresId_fkey";

-- DropForeignKey
ALTER TABLE "public"."responses" DROP CONSTRAINT "responses_questionnaireId_fkey";

-- DropForeignKey
ALTER TABLE "public"."responses" DROP CONSTRAINT "responses_studentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."student_profile" DROP CONSTRAINT "student_profile_primaryClassId_fkey";

-- DropForeignKey
ALTER TABLE "public"."student_profile" DROP CONSTRAINT "student_profile_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."trait_scores" DROP CONSTRAINT "trait_scores_classId_fkey";

-- DropForeignKey
ALTER TABLE "public"."trait_scores" DROP CONSTRAINT "trait_scores_questionnaireId_fkey";

-- DropForeignKey
ALTER TABLE "public"."trait_scores" DROP CONSTRAINT "trait_scores_studentId_fkey";

-- DropTable
DROP TABLE "public"."Questionnaire";

-- DropTable
DROP TABLE "public"."User";

-- DropTable
DROP TABLE "public"."audit_logs";

-- DropTable
DROP TABLE "public"."class_teachers";

-- DropTable
DROP TABLE "public"."classes";

-- DropTable
DROP TABLE "public"."enrollments";

-- DropTable
DROP TABLE "public"."recommendations";

-- DropTable
DROP TABLE "public"."responses";

-- DropTable
DROP TABLE "public"."student_profile";

-- DropTable
DROP TABLE "public"."trait_scores";

-- DropEnum
DROP TYPE "public"."Level";

-- DropEnum
DROP TYPE "public"."Role";

-- DropEnum
DROP TYPE "public"."Trait";

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "rol" "RolUsuario" NOT NULL,
    "fecha_registro" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfil_alumno" (
    "usuario_id" TEXT NOT NULL,
    "boleta" TEXT NOT NULL,
    "nombre" TEXT,
    "apellido" TEXT,

    CONSTRAINT "perfil_alumno_pkey" PRIMARY KEY ("usuario_id")
);

-- CreateTable
CREATE TABLE "grupos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "generacion" TEXT,

    CONSTRAINT "grupos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grupo_docente" (
    "id" SERIAL NOT NULL,
    "docente_id" TEXT NOT NULL,
    "grupo_id" INTEGER NOT NULL,

    CONSTRAINT "grupo_docente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscripciones" (
    "id" SERIAL NOT NULL,
    "grupo_id" INTEGER NOT NULL,
    "alumno_id" TEXT NOT NULL,

    CONSTRAINT "inscripciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuestionarios" (
    "id" SERIAL NOT NULL,
    "version" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cuestionarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "respuestas" (
    "id" SERIAL NOT NULL,
    "cuestionario_id" INTEGER NOT NULL,
    "alumno_id" TEXT NOT NULL,
    "respuestas_raw" JSONB NOT NULL,
    "fecha_evaluacion" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "respuestas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfiles" (
    "id" SERIAL NOT NULL,
    "respuesta_id" INTEGER NOT NULL,
    "grupo_id" INTEGER NOT NULL,
    "extraversion_score" DOUBLE PRECISION,
    "agreeableness_score" DOUBLE PRECISION,
    "conscientiousness_score" DOUBLE PRECISION,
    "emotional_stability_score" DOUBLE PRECISION,
    "openness_score" DOUBLE PRECISION,
    "nivel_extraversion" "NivelRasgo",
    "nivel_agreeableness" "NivelRasgo",
    "nivel_conscientiousness" "NivelRasgo",
    "nivel_emotional_stability" "NivelRasgo",
    "nivel_openness" "NivelRasgo",
    "model_version" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "perfiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recomendaciones" (
    "id" SERIAL NOT NULL,
    "perfil_id" INTEGER NOT NULL,
    "rasgo" "Rasgo" NOT NULL,
    "estrategia" TEXT,
    "habilidad_blanda" TEXT,
    "fuente" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recomendaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bitacora" (
    "id" SERIAL NOT NULL,
    "usuario_id" TEXT,
    "accion" TEXT NOT NULL,
    "meta" JSONB,
    "fecha" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bitacora_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "perfil_alumno_boleta_key" ON "perfil_alumno"("boleta");

-- CreateIndex
CREATE UNIQUE INDEX "grupos_nombre_generacion_key" ON "grupos"("nombre", "generacion");

-- CreateIndex
CREATE UNIQUE INDEX "grupo_docente_docente_id_grupo_id_key" ON "grupo_docente"("docente_id", "grupo_id");

-- CreateIndex
CREATE UNIQUE INDEX "inscripciones_grupo_id_alumno_id_key" ON "inscripciones"("grupo_id", "alumno_id");

-- CreateIndex
CREATE UNIQUE INDEX "respuestas_cuestionario_id_alumno_id_key" ON "respuestas"("cuestionario_id", "alumno_id");

-- CreateIndex
CREATE INDEX "perfiles_grupo_id_created_at_idx" ON "perfiles"("grupo_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "perfiles_respuesta_id_idx" ON "perfiles"("respuesta_id");

-- CreateIndex
CREATE INDEX "recomendaciones_perfil_id_idx" ON "recomendaciones"("perfil_id");

-- AddForeignKey
ALTER TABLE "perfil_alumno" ADD CONSTRAINT "perfil_alumno_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupo_docente" ADD CONSTRAINT "grupo_docente_docente_id_fkey" FOREIGN KEY ("docente_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupo_docente" ADD CONSTRAINT "grupo_docente_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_alumno_id_fkey" FOREIGN KEY ("alumno_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuestas" ADD CONSTRAINT "respuestas_cuestionario_id_fkey" FOREIGN KEY ("cuestionario_id") REFERENCES "cuestionarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuestas" ADD CONSTRAINT "respuestas_alumno_id_fkey" FOREIGN KEY ("alumno_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfiles" ADD CONSTRAINT "perfiles_respuesta_id_fkey" FOREIGN KEY ("respuesta_id") REFERENCES "respuestas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfiles" ADD CONSTRAINT "perfiles_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recomendaciones" ADD CONSTRAINT "recomendaciones_perfil_id_fkey" FOREIGN KEY ("perfil_id") REFERENCES "perfiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bitacora" ADD CONSTRAINT "bitacora_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
