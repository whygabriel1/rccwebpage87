import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertVotacionSchema, 
  insertBibliotecaSchema,
  insertAdminSchema,
  insertCalendarioSchema,
  insertGaleriaSchema,
  insertArticuloSchema,
  insertCandidatoSchema
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import express from "express";
import fetch from "node-fetch";

export async function registerRoutes(app: Express): Promise<Server> {
  // Users routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "User with this username already exists" });
      }

      const user = await storage.createUser(validatedData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating user" });
    }
  });

  // Votaciones routes
  app.get("/api/votaciones", async (req, res) => {
    try {
      const votaciones = await storage.getVotaciones();
      res.json(votaciones);
    } catch (error) {
      res.status(500).json({ message: "Error fetching votaciones" });
    }
  });

  app.get("/api/votaciones/tipo/:tipo", async (req, res) => {
    try {
      const tipo = req.params.tipo;
      const votaciones = await storage.getVotacionesByTipo(tipo);
      res.json(votaciones);
    } catch (error) {
      res.status(500).json({ message: "Error fetching votaciones by tipo" });
    }
  });

  app.post("/api/votaciones", async (req, res) => {
    try {
      const validatedData = insertVotacionSchema.parse(req.body);
      // Validar si ya existe un voto con esa cédula y tipo de elección
      const yaVoto = await storage.getVotacionByCedulaYTipo(validatedData.cedula, validatedData.tipoEleccion);
      if (yaVoto) {
        return res.status(400).json({ message: "Este estudiante ya ha votado en esta elección." });
      }
      const votacion = await storage.createVotacion(validatedData);
      res.status(201).json(votacion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating votacion" });
    }
  });

  // Biblioteca routes
  app.get("/api/biblioteca", async (req, res) => {
    try {
      const biblioteca = await storage.getBiblioteca();
      res.json(biblioteca);
    } catch (error) {
      res.status(500).json({ message: "Error fetching biblioteca" });
    }
  });

  app.get("/api/biblioteca/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const libro = await storage.getBibliotecaById(id);
      if (!libro) {
        return res.status(404).json({ message: "Libro not found" });
      }
      res.json(libro);
    } catch (error) {
      res.status(500).json({ message: "Error fetching libro" });
    }
  });

  app.post("/api/biblioteca", async (req, res) => {
    try {
      const validatedData = insertBibliotecaSchema.parse(req.body);
      const libro = await storage.createLibro(validatedData);
      res.status(201).json(libro);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating libro" });
    }
  });

  app.put("/api/biblioteca/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertBibliotecaSchema.partial().parse(req.body);
      
      const libro = await storage.updateLibro(id, validatedData);
      if (!libro) {
        return res.status(404).json({ message: "Libro not found" });
      }
      res.json(libro);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating libro" });
    }
  });

  app.delete("/api/biblioteca/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteLibro(id);
      if (!deleted) {
        return res.status(404).json({ message: "Libro not found" });
      }
      res.json({ message: "Libro deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting libro" });
    }
  });

  // Admin routes
  app.get("/api/admin", async (req, res) => {
    try {
      const admins = await storage.getAdmins();
      res.json(admins);
    } catch (error) {
      res.status(500).json({ message: "Error fetching admins" });
    }
  });

  app.post("/api/admin", async (req, res) => {
    try {
      const validatedData = insertAdminSchema.parse(req.body);
      
      // Check if admin already exists
      const existingAdmin = await storage.getAdminByUsername(validatedData.nombreUsuario);
      if (existingAdmin) {
        return res.status(400).json({ message: "Admin with this username already exists" });
      }

      const admin = await storage.createAdmin(validatedData);
      res.status(201).json(admin);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating admin" });
    }
  });

  // Login route
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      console.log('Intento login:', username, password);
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      // Check admin first
      const admin = await storage.getAdminByUsername(username);
      console.log('Resultado admin:', admin);
      if (admin && admin.clave === password) {
        return res.json({ 
          success: true, 
          user: { id: admin.id, username: admin.nombreUsuario, role: 'admin' }
        });
      }

      // Check regular user
      const user = await storage.getUserByUsername(username);
      if (user && user.password === password) {
        return res.json({ 
          success: true, 
          user: { id: user.id, username: user.username, role: 'user' }
        });
      }

      res.status(401).json({ message: "Invalid credentials" });
    } catch (error) {
      res.status(500).json({ message: "Error during login" });
    }
  });

  // Calendario routes
  app.get("/api/calendario", async (req, res) => {
    try {
      const eventos = await storage.getCalendario();
      res.json(eventos);
    } catch (error) {
      res.status(500).json({ message: "Error fetching calendario" });
    }
  });

  app.post("/api/calendario", async (req, res) => {
    try {
      const validatedData = insertCalendarioSchema.parse(req.body);
      const evento = await storage.createEvento(validatedData);
      res.status(201).json(evento);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating evento" });
    }
  });

  app.put("/api/calendario/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCalendarioSchema.partial().parse(req.body);
      
      const evento = await storage.updateEvento(id, validatedData);
      if (!evento) {
        return res.status(404).json({ message: "Evento not found" });
      }
      res.json(evento);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating evento" });
    }
  });

  app.delete("/api/calendario/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteEvento(id);
      if (!deleted) {
        return res.status(404).json({ message: "Evento not found" });
      }
      res.json({ message: "Evento deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting evento" });
    }
  });

  // Galeria routes
  app.get("/api/galeria", async (req, res) => {
    try {
      const galeria = await storage.getGaleria();
      res.json(galeria);
    } catch (error) {
      res.status(500).json({ message: "Error fetching galeria" });
    }
  });

  app.post("/api/galeria", async (req, res) => {
    try {
      const validatedData = insertGaleriaSchema.parse(req.body);
      const imagen = await storage.createImagen(validatedData);
      res.status(201).json(imagen);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating imagen" });
    }
  });

  app.put("/api/galeria/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertGaleriaSchema.partial().parse(req.body);
      const imagen = await storage.updateImagen(id, validatedData);
      if (!imagen) {
        return res.status(404).json({ message: "Imagen not found" });
      }
      res.json(imagen);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating imagen" });
    }
  });

  app.delete("/api/galeria/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteImagen(id);
      if (!deleted) {
        return res.status(404).json({ message: "Imagen not found" });
      }
      res.json({ message: "Imagen deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting imagen" });
    }
  });

  // Articulos routes
  app.get("/api/articulos", async (req, res) => {
    try {
      const articulos = await storage.getArticulos();
      res.json(articulos);
    } catch (error) {
      res.status(500).json({ message: "Error fetching articulos" });
    }
  });

  app.get("/api/articulos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const articulo = await storage.getArticuloById(id);
      if (!articulo) {
        return res.status(404).json({ message: "Articulo not found" });
      }
      res.json(articulo);
    } catch (error) {
      res.status(500).json({ message: "Error fetching articulo" });
    }
  });

  app.post("/api/articulos", async (req, res) => {
    try {
      const validatedData = insertArticuloSchema.parse(req.body);
      const articulo = await storage.createArticulo(validatedData);
      res.status(201).json(articulo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating articulo" });
    }
  });

  app.put("/api/articulos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertArticuloSchema.partial().parse(req.body);
      
      const articulo = await storage.updateArticulo(id, validatedData);
      if (!articulo) {
        return res.status(404).json({ message: "Articulo not found" });
      }
      res.json(articulo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating articulo" });
    }
  });

  app.delete("/api/articulos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteArticulo(id);
      if (!deleted) {
        return res.status(404).json({ message: "Articulo not found" });
      }
      res.json({ message: "Articulo deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting articulo" });
    }
  });

  // Candidatos routes
  app.get("/api/candidatos", async (req, res) => {
    try {
      const candidatos = await storage.getCandidatos();
      res.json(candidatos);
    } catch (error) {
      res.status(500).json({ message: "Error fetching candidatos" });
    }
  });

  app.get("/api/candidatos/tipo/:tipo", async (req, res) => {
    try {
      const tipo = req.params.tipo;
      const candidatos = await storage.getCandidatosByTipo(tipo);
      res.json(candidatos);
    } catch (error) {
      res.status(500).json({ message: "Error fetching candidatos by tipo" });
    }
  });

  app.post("/api/candidatos", async (req, res) => {
    try {
      const validatedData = insertCandidatoSchema.parse(req.body);
      const candidato = await storage.createCandidato(validatedData);
      res.status(201).json(candidato);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating candidato" });
    }
  });

  app.put("/api/candidatos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCandidatoSchema.partial().parse(req.body);
      
      const candidato = await storage.updateCandidato(id, validatedData);
      if (!candidato) {
        return res.status(404).json({ message: "Candidato not found" });
      }
      res.json(candidato);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating candidato" });
    }
  });

  app.delete("/api/candidatos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCandidato(id);
      if (!deleted) {
        return res.status(404).json({ message: "Candidato not found" });
      }
      res.json({ message: "Candidato deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting candidato" });
    }
  });

  // Analytics/Statistics routes
  app.get("/api/estadisticas", async (req, res) => {
    try {
      // Puede recibir anioSeccion (ej: '5E') o anio y seccion por separado
      let { anioSeccion, anio, seccion, tipoEleccion } = req.query;
      let filtroAnio: string | undefined = undefined;
      let filtroSeccion: string | undefined = undefined;

      if (anioSeccion && typeof anioSeccion === 'string' && anioSeccion.length >= 2) {
        filtroAnio = anioSeccion.charAt(0);
        filtroSeccion = anioSeccion.charAt(1).toUpperCase();
      } else {
        if (anio && typeof anio === 'string') filtroAnio = anio;
        if (seccion && typeof seccion === 'string') filtroSeccion = seccion.toUpperCase();
      }

      console.log('[Estadisticas] Entrando a getEstadisticasVotacion con:', { filtroAnio, filtroSeccion, tipoEleccion });
      const estadisticas = await storage.getEstadisticasVotacion(filtroAnio, filtroSeccion, typeof tipoEleccion === 'string' ? tipoEleccion : undefined);
      console.log('[Estadisticas] Resultado:', estadisticas);
      res.json(estadisticas);
    } catch (error) {
      if (error instanceof Error) {
        console.error('[Estadisticas] Error:', error.message, error.stack);
        res.status(500).json({ message: "Error fetching estadisticas", error: error.message });
      } else {
        console.error('[Estadisticas] Error:', error);
        res.status(500).json({ message: "Error fetching estadisticas", error });
      }
    }
  });

  // Endpoint para buscar estudiante por cédula
  app.get("/api/estudiantes/cedula/:cedula", async (req, res) => {
    try {
      const cedula = req.params.cedula;
      const estudiante = await storage.getEstudianteByCedula(cedula);
      if (!estudiante) {
        return res.status(404).json({ message: "Estudiante no encontrado" });
      }
      res.json(estudiante);
    } catch (error) {
      res.status(500).json({ message: "Error buscando estudiante" });
    }
  });

  // Endpoint para obtener los valores únicos de año y sección
  app.get("/api/estudiantes/anioSeccion-unicos", async (req, res) => {
    try {
      const estudiantes = await storage.getEstudiantes();
      const unicos = Array.from(new Set(estudiantes.map(e => e.anioSeccion))).sort();
      res.json(unicos);
    } catch (error) {
      res.status(500).json({ message: "Error obteniendo años y secciones únicos" });
    }
  });

  // Elecciones routes
  app.get("/api/elecciones", async (req, res) => {
    try {
      const elecciones = await storage.getElecciones();
      res.json(elecciones);
    } catch (error) {
      res.status(500).json({ message: "Error fetching elecciones" });
    }
  });

  // Configura Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  // Cambia multer a memoryStorage para acceder al buffer
  const upload = multer({ storage: multer.memoryStorage() });

  // Endpoint para subir imágenes a Cloudinary
  app.post("/api/upload", upload.single("file"), async (req: any, res: any) => {
    if (!req.file) {
      return res.status(400).json({ message: "No se subió ningún archivo" });
    }
    try {
      const resourceType = req.file.mimetype === "application/pdf" ? "raw" : "auto";
      const result = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: resourceType },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });
      console.log(result); // Para debug: ver la URL y tipo de recurso
      res.json({ url: result.secure_url });
    } catch (error) {
      res.status(500).json({ message: "Error subiendo a Cloudinary", error });
    }
  });

  // Endpoint para descarga de PDF con nombre personalizado
  app.get("/api/download", async (req, res) => {
    const { url, filename } = req.query;
    if (!url || typeof url !== "string" || !filename || typeof filename !== "string") {
      return res.status(400).json({ error: "Faltan parámetros url o filename" });
    }
    try {
      const response = await fetch(url);
      if (!response.ok) {
        return res.status(404).json({ error: "No se pudo descargar el archivo remoto" });
      }
      res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);
      res.setHeader("Content-Type", response.headers.get("content-type") || "application/pdf");
      response.body.pipe(res);
    } catch (err) {
      res.status(500).json({ error: "Error al descargar el archivo" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}