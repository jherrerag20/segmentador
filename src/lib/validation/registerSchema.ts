import { z } from "zod";

export const grupoSchema = z.object({
  nombre: z.string().min(1, "El nombre del grupo es obligatorio"),
  generacion: z.string().optional().nullable(),
});

export const alumnoSchema = z.object({
  boleta: z.string().min(1, "La boleta es obligatoria"),
  grupo: grupoSchema,
});

export const docenteSchema = z.object({
  opcion: z.enum(["crear", "unirme"], {
    message: "Selecciona una opción",
  }),
  grupo: grupoSchema,
});

export const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  nombres: z.string().optional().nullable(),
  apellidos: z.string().optional().nullable(),
  rol: z.enum(["student", "teacher"], {
    message: "Selecciona un rol",
  }),
  consent: z.literal(true, {
    message: "Debes aceptar el consentimiento",
  }),
  alumno: alumnoSchema.optional(),
  docente: docenteSchema.optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;