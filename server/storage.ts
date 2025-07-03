import { db } from "./db";
import { 
  users, 
  votaciones, 
  biblioteca, 
  admin, 
  calendario, 
  galeria, 
  articulos,
  candidatos,
  type User, 
  type InsertUser,
  type Votacion,
  type InsertVotacion,
  type Biblioteca,
  type InsertBiblioteca,
  type Admin,
  type InsertAdmin,
  type Calendario,
  type InsertCalendario,
  type Galeria,
  type InsertGaleria,
  type Articulo,
  type InsertArticulo,
  type Candidato,
  type InsertCandidato,
  type Estudiante,
  estudiantes,
  elecciones
} from "@shared/schema";
import { eq, sql, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Votaciones
  getVotaciones(): Promise<Votacion[]>;
  getVotacion(id: number): Promise<Votacion | undefined>;
  createVotacion(votacion: InsertVotacion): Promise<Votacion>;
  getVotacionesByTipo(tipo: string): Promise<Votacion[]>;
  getVotacionByCedulaYTipo(cedula: string, tipoEleccion: string): Promise<Votacion | undefined>;

  // Biblioteca
  getBiblioteca(): Promise<Biblioteca[]>;
  getBibliotecaById(id: number): Promise<Biblioteca | undefined>;
  createLibro(libro: InsertBiblioteca): Promise<Biblioteca>;
  updateLibro(id: number, libro: Partial<InsertBiblioteca>): Promise<Biblioteca | undefined>;
  deleteLibro(id: number): Promise<boolean>;

  // Admin
  getAdmins(): Promise<Admin[]>;
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;

  // Calendario
  getCalendario(): Promise<Calendario[]>;
  createEvento(evento: InsertCalendario): Promise<Calendario>;
  updateEvento(id: number, evento: Partial<InsertCalendario>): Promise<Calendario | undefined>;
  deleteEvento(id: number): Promise<boolean>;

  // Galeria
  getGaleria(): Promise<Galeria[]>;
  createImagen(imagen: InsertGaleria): Promise<Galeria>;
  deleteImagen(id: number): Promise<boolean>;
  updateImagen(id: number, imagen: Partial<InsertGaleria>): Promise<Galeria | undefined>;

  // Articulos
  getArticulos(): Promise<Articulo[]>;
  getArticuloById(id: number): Promise<Articulo | undefined>;
  createArticulo(articulo: InsertArticulo): Promise<Articulo>;
  updateArticulo(id: number, articulo: Partial<InsertArticulo>): Promise<Articulo | undefined>;
  deleteArticulo(id: number): Promise<boolean>;

  // Candidatos
  getCandidatos(): Promise<Candidato[]>;
  getCandidatosByTipo(tipo: string): Promise<Candidato[]>;
  createCandidato(candidato: InsertCandidato): Promise<Candidato>;
  updateCandidato(id: number, candidato: Partial<InsertCandidato>): Promise<Candidato | undefined>;
  deleteCandidato(id: number): Promise<boolean>;

  // Analytics/Stats
  getEstadisticasVotacion(anio?: string, seccion?: string, tipoEleccion?: string): Promise<any>;

  // Estudiantes
  getEstudiantes(): Promise<Estudiante[]>;
  getEstudianteByCedula(cedula: string): Promise<Estudiante | undefined>;

  // Elecciones
  getElecciones(): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount! > 0;
  }

  // Votaciones
  async getVotaciones(): Promise<Votacion[]> {
    return await db.select().from(votaciones);
  }

  async getVotacion(id: number): Promise<Votacion | undefined> {
    const result = await db.select().from(votaciones).where(eq(votaciones.id, id));
    return result[0];
  }

  async createVotacion(votacion: InsertVotacion): Promise<Votacion> {
    const result = await db.insert(votaciones).values(votacion).returning();
    return result[0];
  }

  async getVotacionesByTipo(tipo: string): Promise<Votacion[]> {
    return await db.select().from(votaciones).where(eq(votaciones.tipoEleccion, tipo));
  }

  async getVotacionByCedulaYTipo(cedula: string, tipoEleccion: string): Promise<Votacion | undefined> {
    const result = await db.select().from(votaciones).where(
      and(
        eq(votaciones.cedula, cedula),
        eq(votaciones.tipoEleccion, tipoEleccion)
      )
    );
    return result[0];
  }

  // Biblioteca
  async getBiblioteca(): Promise<Biblioteca[]> {
    return await db.select().from(biblioteca);
  }

  async getBibliotecaById(id: number): Promise<Biblioteca | undefined> {
    const result = await db.select().from(biblioteca).where(eq(biblioteca.id, id));
    return result[0];
  }

  async createLibro(libro: InsertBiblioteca): Promise<Biblioteca> {
    const result = await db.insert(biblioteca).values(libro).returning();
    return result[0];
  }

  async updateLibro(id: number, libro: Partial<InsertBiblioteca>): Promise<Biblioteca | undefined> {
    const result = await db.update(biblioteca).set(libro).where(eq(biblioteca.id, id)).returning();
    return result[0];
  }

  async deleteLibro(id: number): Promise<boolean> {
    const result = await db.delete(biblioteca).where(eq(biblioteca.id, id));
    return result.rowCount! > 0;
  }

  // Admin
  async getAdmins(): Promise<Admin[]> {
    return await db.select().from(admin);
  }

  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    try {
      console.log('Entrando a getAdminByUsername con:', username);
      const result = await db.select().from(admin).where(eq(admin.nombreUsuario, username));
      console.log('Consulta admin:', result);
      return result[0];
    } catch (error) {
      console.error('Error en getAdminByUsername:', error);
      throw error;
    }
  }

  async createAdmin(adminData: InsertAdmin): Promise<Admin> {
    const result = await db.insert(admin).values(adminData).returning();
    return result[0];
  }

  // Calendario
  async getCalendario(): Promise<Calendario[]> {
    return await db.select().from(calendario);
  }

  async createEvento(evento: InsertCalendario): Promise<Calendario> {
    const result = await db.insert(calendario).values(evento).returning();
    return result[0];
  }

  async updateEvento(id: number, evento: Partial<InsertCalendario>): Promise<Calendario | undefined> {
    const result = await db.update(calendario).set(evento).where(eq(calendario.id, id)).returning();
    return result[0];
  }

  async deleteEvento(id: number): Promise<boolean> {
    const result = await db.delete(calendario).where(eq(calendario.id, id));
    return result.rowCount! > 0;
  }

  // Galeria
  async getGaleria(): Promise<Galeria[]> {
    return await db.select().from(galeria);
  }

  async createImagen(imagen: InsertGaleria): Promise<Galeria> {
    const result = await db.insert(galeria).values(imagen).returning();
    return result[0];
  }

  async deleteImagen(id: number): Promise<boolean> {
    const result = await db.delete(galeria).where(eq(galeria.id, id));
    return result.rowCount! > 0;
  }

  async updateImagen(id: number, imagen: Partial<InsertGaleria>): Promise<Galeria | undefined> {
    const result = await db.update(galeria).set(imagen).where(eq(galeria.id, id)).returning();
    return result[0];
  }

  // Articulos
  async getArticulos(): Promise<Articulo[]> {
    return await db.select().from(articulos);
  }

  async getArticuloById(id: number): Promise<Articulo | undefined> {
    const result = await db.select().from(articulos).where(eq(articulos.id, id));
    return result[0];
  }

  async createArticulo(articulo: InsertArticulo): Promise<Articulo> {
    const result = await db.insert(articulos).values(articulo).returning();
    return result[0];
  }

  async updateArticulo(id: number, articulo: Partial<InsertArticulo>): Promise<Articulo | undefined> {
    const result = await db.update(articulos).set(articulo).where(eq(articulos.id, id)).returning();
    return result[0];
  }

  async deleteArticulo(id: number): Promise<boolean> {
    const result = await db.delete(articulos).where(eq(articulos.id, id));
    return result.rowCount! > 0;
  }

  // Candidatos
  async getCandidatos(): Promise<Candidato[]> {
    return await db.select().from(candidatos);
  }

  async getCandidatosByTipo(tipo: string): Promise<Candidato[]> {
    return await db.select().from(candidatos).where(eq(candidatos.tipoEleccion, tipo));
  }

  async createCandidato(candidato: InsertCandidato): Promise<Candidato> {
    const result = await db.insert(candidatos).values(candidato).returning();
    return result[0];
  }

  async updateCandidato(id: number, candidato: Partial<InsertCandidato>): Promise<Candidato | undefined> {
    const result = await db.update(candidatos).set(candidato).where(eq(candidatos.id, id)).returning();
    return result[0];
  }

  async deleteCandidato(id: number): Promise<boolean> {
    const result = await db.delete(candidatos).where(eq(candidatos.id, id));
    return result.rowCount! > 0;
  }

  // Analytics/Stats
  async getEstadisticasVotacion(anio?: string, seccion?: string, tipoEleccion?: string): Promise<any> {
    // Unir votaciones con candidatos y elecciones
    let query: any = db
      .select({
        id: candidatos.id,
        candidatoId: votaciones.candidatoId,
        nombre: candidatos.nombre,
        apellido: candidatos.apellido,
        grado: candidatos.grado,
        seccion: candidatos.seccion,
        tipoEleccion: candidatos.tipoEleccion,
        eleccionId: votaciones.eleccionId,
        eleccionNombre: elecciones.nombre,
        count: sql`count(*)`
      })
      .from(votaciones)
      .innerJoin(candidatos, eq(votaciones.candidatoId, candidatos.id))
      .leftJoin(elecciones, eq(votaciones.eleccionId, elecciones.id));
    // Filtros
    const filtros = [];
    if (anio) filtros.push(eq(candidatos.grado, anio));
    if (seccion) filtros.push(eq(candidatos.seccion, seccion));
    if (tipoEleccion) filtros.push(eq(votaciones.tipoEleccion, tipoEleccion));
    if (filtros.length > 0) {
      query = query.where(and(...filtros));
    }
    // Agrupar por candidato y elección
    const votosPorCandidato = await query.groupBy(
      candidatos.id,
      votaciones.candidatoId,
      candidatos.nombre,
      candidatos.apellido,
      candidatos.grado,
      candidatos.seccion,
      candidatos.tipoEleccion,
      votaciones.eleccionId,
      elecciones.nombre
    );
    return {
      votosPorCandidato
    };
  }

  // Estudiantes
  async getEstudiantes(): Promise<Estudiante[]> {
    return await db.select().from(estudiantes);
  }

  async getEstudianteByCedula(cedula: string): Promise<Estudiante | undefined> {
    const result = await db.select().from(estudiantes).where(eq(estudiantes.cedula, cedula));
    return result[0];
  }

  // Elecciones
  async getElecciones() {
    return await db.select().from(elecciones);
  }
}

export const storage = new DatabaseStorage();