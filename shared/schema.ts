import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const votaciones = pgTable("votaciones", {
  id: serial("id").primaryKey(),
  cedula: varchar("cedula", { length: 20 }).notNull(),
  nombre: text("nombre").notNull(),
  apellido: text("apellido").notNull(),
  rol: text("rol").notNull(),
  anioSeccion: text("anio_seccion").notNull(),
  direccion: text("direccion").notNull(),
  candidatoId: integer("candidato_id").notNull().references(() => candidatos.id),
  eleccionId: integer("eleccion_id").references(() => elecciones.id),
  tipoEleccion: text("tipo_eleccion").notNull(),
  fechaVoto: timestamp("fecha_voto").defaultNow(),
});

export const biblioteca = pgTable("biblioteca", {
  id: serial("id").primaryKey(),
  nombreLibro: text("nombre_libro").notNull(),
  autor: text("autor").notNull(),
  portada: text("portada"), // URL to cover image
  pdf: text("pdf"), // URL to PDF file
  materia: text("materia").notNull(),
  fechaCreacion: timestamp("fecha_creacion").defaultNow(),
});

export const admin = pgTable("admin", {
  id: serial("id").primaryKey(),
  nombreUsuario: text("nombre_usuario").notNull().unique(),
  clave: text("clave").notNull(),
});

export const calendario = pgTable("calendario", {
  id: serial("id").primaryKey(),
  evento: text("evento").notNull(),
  fecha: timestamp("fecha").notNull(),
  categoria: text("categoria").notNull(),
  imagen: text("imagen"),
  descripcion: text("descripcion"),
});

export const galeria = pgTable("galeria", {
  id: serial("id").primaryKey(),
  imagen: text("imagen").notNull(), // URL to image
  categoria: text("categoria").notNull(),
  nombre: text("nombre").notNull(),
  fechaCreacion: timestamp("fecha_creacion").defaultNow(),
});

export const articulos = pgTable("articulos", {
  id: serial("id").primaryKey(),
  titulo: text("titulo").notNull(),
  contenido: text("contenido").notNull(),
  autor: text("autor").notNull(),
  categoria: text("categoria").notNull(),
  imagen: text("imagen"), // URL to image
  fechaCreacion: timestamp("fecha_creacion").defaultNow(),
});

export const candidatos = pgTable("candidatos", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  apellido: text("apellido").notNull(),
  grado: text("grado").notNull(),
  seccion: text("seccion").notNull(),
  tipoEleccion: text("tipo_eleccion").notNull(), // 'estudiantiles', 'carnaval', 'vocero'
  activo: boolean("activo").default(true),
});

export const estudiantes = pgTable("estudiantes", {
  id: serial("id").primaryKey(),
  cedula: varchar("cedula", { length: 20 }).notNull().unique(),
  nombre: text("nombre").notNull(),
  apellido: text("apellido").notNull(),
  anioSeccion: text("anio_seccion").notNull(),
  direccion: text("direccion").notNull(),
});

// Nueva tabla de elecciones (opcional, pero recomendada)
export const elecciones = pgTable("elecciones", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(), // Ej: "Elección Estudiantil 2024"
  descripcion: text("descripcion"),
  fecha: timestamp("fecha").defaultNow(),
});

// Relations
export const votacionesRelations = relations(votaciones, ({ one }) => ({
  candidato: one(candidatos, {
    fields: [votaciones.candidatoId],
    references: [candidatos.id],
  }),
}));

export const candidatosRelations = relations(candidatos, ({ many }) => ({
  votos: many(votaciones),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertVotacionSchema = createInsertSchema(votaciones).omit({
  id: true,
  fechaVoto: true,
});

export const insertBibliotecaSchema = createInsertSchema(biblioteca).omit({
  id: true,
  fechaCreacion: true,
});

export const insertAdminSchema = createInsertSchema(admin).omit({
  id: true,
});

export const insertCalendarioSchema = createInsertSchema(calendario, {
  fecha: z.coerce.date(),
  imagen: z.string().optional(),
  descripcion: z.string().optional(),
}).omit({
  id: true,
});

export const insertGaleriaSchema = createInsertSchema(galeria).omit({
  id: true,
  fechaCreacion: true,
});

export const insertArticuloSchema = createInsertSchema(articulos).omit({
  id: true,
  fechaCreacion: true,
});

export const insertCandidatoSchema = createInsertSchema(candidatos).omit({
  id: true,
});

export const insertEstudianteSchema = createInsertSchema(estudiantes).omit({
  id: true,
});

export const insertEleccionSchema = createInsertSchema(elecciones).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Votacion = typeof votaciones.$inferSelect;
export type InsertVotacion = z.infer<typeof insertVotacionSchema>;

export type Biblioteca = typeof biblioteca.$inferSelect;
export type InsertBiblioteca = z.infer<typeof insertBibliotecaSchema>;

export type Admin = typeof admin.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;

export type Calendario = typeof calendario.$inferSelect;
export type InsertCalendario = z.infer<typeof insertCalendarioSchema>;

export type Galeria = typeof galeria.$inferSelect;
export type InsertGaleria = z.infer<typeof insertGaleriaSchema>;

export type Articulo = typeof articulos.$inferSelect;
export type InsertArticulo = z.infer<typeof insertArticuloSchema>;

export type Candidato = typeof candidatos.$inferSelect;
export type InsertCandidato = z.infer<typeof insertCandidatoSchema>;

export type Estudiante = typeof estudiantes.$inferSelect;
export type InsertEstudiante = z.infer<typeof insertEstudianteSchema>;

export type Eleccion = typeof elecciones.$inferSelect;
export type InsertEleccion = z.infer<typeof insertEleccionSchema>;
