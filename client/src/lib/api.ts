import { apiRequest } from "./queryClient";

// API functions for the voting school system
export const api = {
  // Auth
  login: async (username: string, password: string) => {
    return apiRequest("POST", "/api/login", { username, password });
  },

  // Users
  getUsers: async () => {
    const response = await apiRequest("GET", "/api/users");
    return response.json();
  },

  createUser: async (data: any) => {
    return apiRequest("POST", "/api/users", data);
  },

  // Votaciones
  getVotaciones: async () => {
    const response = await apiRequest("GET", "/api/votaciones");
    return response.json();
  },

  getVotacionesByTipo: async (tipo: string) => {
    const response = await apiRequest("GET", `/api/votaciones/tipo/${tipo}`);
    return response.json();
  },

  createVotacion: async (data: any) => {
    return apiRequest("POST", "/api/votaciones", data);
  },

  // Biblioteca
  getBiblioteca: async () => {
    const response = await apiRequest("GET", "/api/biblioteca");
    return response.json();
  },

  getBibliotecaById: async (id: number) => {
    const response = await apiRequest("GET", `/api/biblioteca/${id}`);
    return response.json();
  },

  createLibro: async (data: any) => {
    return apiRequest("POST", "/api/biblioteca", data);
  },

  updateLibro: async (id: number, data: any) => {
    return apiRequest("PUT", `/api/biblioteca/${id}`, data);
  },

  deleteLibro: async (id: number) => {
    return apiRequest("DELETE", `/api/biblioteca/${id}`);
  },

  // Admin
  getAdmins: async () => {
    const response = await apiRequest("GET", "/api/admin");
    return response.json();
  },

  createAdmin: async (data: any) => {
    return apiRequest("POST", "/api/admin", data);
  },

  // Calendario
  getCalendario: async () => {
    const response = await apiRequest("GET", "/api/calendario");
    return response.json();
  },

  createEvento: async (data: any) => {
    return apiRequest("POST", "/api/calendario", data);
  },

  updateEvento: async (id: number, data: any) => {
    return apiRequest("PUT", `/api/calendario/${id}`, data);
  },

  deleteEvento: async (id: number) => {
    return apiRequest("DELETE", `/api/calendario/${id}`);
  },

  // Galeria
  getGaleria: async () => {
    const response = await apiRequest("GET", "/api/galeria");
    return response.json();
  },

  createImagen: async (data: any) => {
    return apiRequest("POST", "/api/galeria", data);
  },

  deleteImagen: async (id: number) => {
    return apiRequest("DELETE", `/api/galeria/${id}`);
  },

  // Articulos
  getArticulos: async () => {
    const response = await apiRequest("GET", "/api/articulos");
    return response.json();
  },

  getArticuloById: async (id: number) => {
    const response = await apiRequest("GET", `/api/articulos/${id}`);
    return response.json();
  },

  createArticulo: async (data: any) => {
    return apiRequest("POST", "/api/articulos", data);
  },

  updateArticulo: async (id: number, data: any) => {
    return apiRequest("PUT", `/api/articulos/${id}`, data);
  },

  deleteArticulo: async (id: number) => {
    return apiRequest("DELETE", `/api/articulos/${id}`);
  },

  // Candidatos
  getCandidatos: async () => {
    const response = await apiRequest("GET", "/api/candidatos");
    return response.json();
  },

  getCandidatosByTipo: async (tipo: string) => {
    const response = await apiRequest("GET", `/api/candidatos/tipo/${tipo}`);
    return response.json();
  },

  createCandidato: async (data: any) => {
    return apiRequest("POST", "/api/candidatos", data);
  },

  updateCandidato: async (id: number, data: any) => {
    return apiRequest("PUT", `/api/candidatos/${id}`, data);
  },

  deleteCandidato: async (id: number) => {
    return apiRequest("DELETE", `/api/candidatos/${id}`);
  },

  // Estadisticas
  getEstadisticas: async (params?: { anioSeccion?: string, tipoEleccion?: string }) => {
    let url = "/api/estadisticas";
    const query: string[] = [];
    if (params) {
      if (params.anioSeccion && params.anioSeccion !== "__all__") {
        if (params.anioSeccion.length === 2) {
          const anio = params.anioSeccion.charAt(0);
          const seccion = params.anioSeccion.charAt(1).toUpperCase();
          query.push(`anio=${encodeURIComponent(anio)}`);
          query.push(`seccion=${encodeURIComponent(seccion)}`);
        } else {
          query.push(`anioSeccion=${encodeURIComponent(params.anioSeccion)}`);
        }
      }
      if (params.tipoEleccion && params.tipoEleccion !== "__all__") {
        query.push(`tipoEleccion=${encodeURIComponent(params.tipoEleccion)}`);
      }
    }
    if (query.length > 0) {
      url += `?${query.join("&")}`;
    }
    const response = await apiRequest("GET", url);
    return response.json();
  },

  // Obtener años y secciones únicos
  getAniosSeccionesUnicos: async () => {
    const response = await apiRequest("GET", "/api/estudiantes/anioSeccion-unicos");
    return response.json();
  },
};