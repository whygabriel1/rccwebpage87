import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { LogOut, Plus, Eye, Edit, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import { api } from "@/lib/api";
GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.3.31/pdf.worker.min.mjs";

type AdminTab = "biblioteca" | "votaciones" | "articulos" | "galeria" | "calendario";

interface AdminUser {
  id: number;
  nombreUsuario: string;
}

interface Libro {
  id: number;
  nombreLibro: string;
  autor: string;
  portada?: string;
  pdf?: string;
  materia: string;
  fechaCreacion: string;
}

interface Candidato {
  id: number;
  nombre: string;
  apellido: string;
  grado: string;
  seccion: string;
  tipoEleccion: string;
  activo: boolean;
}

interface Evento {
  id: number;
  evento: string;
  fecha: string;
  categoria: string;
  imagen?: string;
  descripcion?: string;
}

interface Imagen {
  id: number;
  imagen: string;
  categoria: string;
  nombre: string;
  fechaCreacion: string;
}

function PdfThumbnail({ pdfUrl, width = 300, height = 200 }: { pdfUrl: string, width?: number, height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function renderPdf() {
      try {
        const loadingTask = getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1 });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext("2d");
        canvas.width = width;
        canvas.height = height;
        const scale = Math.min(width / viewport.width, height / viewport.height);
        const scaledViewport = page.getViewport({ scale });
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        await page.render({ canvasContext: context!, viewport: scaledViewport }).promise;
      } catch (e) {
        if (!cancelled) setError("No se pudo cargar la miniatura del PDF");
      }
    }
    if (pdfUrl) renderPdf();
    return () => { cancelled = true; };
  }, [pdfUrl, width, height]);

  if (error) return <div className="flex items-center justify-center w-full h-full text-gray-400 text-xs">{error}</div>;
  return <canvas ref={canvasRef} className="w-full h-full object-cover rounded-t-lg bg-gray-100" style={{ display: error ? "none" : "block" }} />;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<AdminTab>("biblioteca");
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const { toast } = useToast();

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [bookForm, setBookForm] = useState({
    nombreLibro: "",
    autor: "",
    portada: "",
    pdf: "",
    materia: ""
  });
  const [candidateForm, setCandidateForm] = useState({
    nombre: "",
    apellido: "",
    grado: "1",
    seccion: "A",
    tipoEleccion: ""
  });
  const [eventForm, setEventForm] = useState({
    evento: "",
    fecha: "",
    categoria: "",
    imagen: "",
    descripcion: ""
  });
  const [imageForm, setImageForm] = useState({
    imagen: "",
    categoria: "",
    nombre: ""
  });
  const [articleForm, setArticleForm] = useState({
    titulo: "",
    contenido: "",
    autor: "",
    categoria: "",
    imagen: ""
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // 1. Estado para edición y eliminación
  const [editImageId, setEditImageId] = useState<number | null>(null);
  const [editImageForm, setEditImageForm] = useState({ imagen: "", categoria: "", nombre: "" });

  // Estado para el diálogo de confirmación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<number | null>(null);

  // Estado para edición de eventos del calendario
  const [editEventId, setEditEventId] = useState<number | null>(null);
  const [editEventForm, setEditEventForm] = useState({ evento: "", fecha: "", categoria: "", imagen: "", descripcion: "" });

  // Estado para eliminación de eventos del calendario
  const [deleteEventDialogOpen, setDeleteEventDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<number | null>(null);

  // 1. Estados para edición de libros
  const [editBookId, setEditBookId] = useState<number | null>(null);
  const [editBookForm, setEditBookForm] = useState({
    nombreLibro: "",
    autor: "",
    portada: "",
    pdf: "",
    materia: ""
  });
  const [showEditForm, setShowEditForm] = useState(false);

  // Estado para abrir PDF en visor
  const [openPdf, setOpenPdf] = useState<{ url: string; title: string } | null>(null);

  // Estados para edición y eliminación de artículos
  const [editArticleId, setEditArticleId] = useState<number | null>(null);
  const [editArticleForm, setEditArticleForm] = useState({
    titulo: "",
    contenido: "",
    autor: "",
    categoria: "",
    imagen: ""
  });
  const [showEditArticleForm, setShowEditArticleForm] = useState(false);
  const [deleteArticleDialogOpen, setDeleteArticleDialogOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<number | null>(null);

  // Estados para edición y eliminación de candidatos
  const [editCandidateId, setEditCandidateId] = useState<number | null>(null);
  const [editCandidateForm, setEditCandidateForm] = useState({
    nombre: "",
    apellido: "",
    grado: "1",
    seccion: "A",
    tipoEleccion: ""
  });
  const [showEditCandidateForm, setShowEditCandidateForm] = useState(false);
  const [deleteCandidateDialogOpen, setDeleteCandidateDialogOpen] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<number | null>(null);

  // Filtros separados de año y sección para recuento de votos
  const [filtroAnio, setFiltroAnio] = useState<string>("__all__");
  const [filtroSeccion, setFiltroSeccion] = useState<string>("__all__");
  const [filtroTipoEleccion, setFiltroTipoEleccion] = useState<string>("__all__");
  // Combinar año y sección para formar el filtro anioSeccion
  const anioSeccionFiltro = (filtroAnio !== "__all__" && filtroSeccion !== "__all__") ? `${filtroAnio}${filtroSeccion}` : "__all__";
  // Filtro para tipo de elección
  const tipoEleccionFiltro = filtroTipoEleccion;
  const { data: aniosSeccionesUnicos = [], isLoading: loadingAniosSecciones } = useQuery({
    queryKey: ["/api/estudiantes/anioSeccion-unicos"],
    queryFn: api.getAniosSeccionesUnicos,
    enabled: activeTab === "votaciones"
  });

  // Data fetching queries
  const { data: libros = [], refetch: refetchLibros } = useQuery({
    queryKey: ["/api/biblioteca"],
    enabled: activeTab === "biblioteca"
  });

  const { data: candidatos = [], refetch: refetchCandidatos } = useQuery({
    queryKey: ["/api/candidatos"],
    enabled: activeTab === "votaciones"
  });

  const { data: eventos = [], refetch: refetchEventos } = useQuery({
    queryKey: ["/api/calendario"],
    enabled: activeTab === "calendario"
  });

  const { data: imagenes = [], refetch: refetchImagenes } = useQuery({
    queryKey: ["/api/galeria"],
    enabled: activeTab === "galeria"
  });

  const { data: articulos = [], refetch: refetchArticulos } = useQuery({
    queryKey: ["/api/articulos"],
    enabled: activeTab === "articulos"
  });

  // Consulta de estadísticas de votación (con filtro)
  const { data: estadisticas, isLoading: loadingEstadisticas, error: errorEstadisticas, refetch: refetchEstadisticas } = useQuery({
    queryKey: ["/api/estadisticas", anioSeccionFiltro, tipoEleccionFiltro],
    queryFn: () => {
      // Modifico la llamada para pasar tipoEleccion si está filtrado
      let params: any = {};
      if (anioSeccionFiltro !== "__all__") params.anioSeccion = anioSeccionFiltro;
      if (tipoEleccionFiltro !== "__all__") params.tipoEleccion = tipoEleccionFiltro;
      return api.getEstadisticas(params);
    },
    enabled: activeTab === "votaciones"
  });

  // Mutations
  const addBookMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/biblioteca", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
        }
      });
      if (!response.ok) throw new Error("Failed to add book");
      return response.json();
    },
    onSuccess: () => {
      refetchLibros();
      setShowAddForm(false);
      setBookForm({ nombreLibro: "", autor: "", portada: "", pdf: "", materia: "" });
      toast({ title: "Libro agregado", description: "El libro se ha agregado exitosamente." });
    }
  });

  const addCandidateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/candidatos", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
        }
      });
      if (!response.ok) throw new Error("Failed to add candidate");
      return response.json();
    },
    onSuccess: () => {
      refetchCandidatos();
      setShowAddForm(false);
      setCandidateForm({ nombre: "", apellido: "", grado: "1", seccion: "A", tipoEleccion: "" });
      toast({ title: "Candidato agregado", description: "El candidato se ha agregado exitosamente." });
    }
  });

  const addEventMutation = useMutation({
    mutationFn: async (data: any) => {
      // Convertir fecha a formato ISO si viene de un input datetime-local
      const fechaISO = data.fecha ? new Date(data.fecha).toISOString() : null;
      const payload = { ...data, fecha: fechaISO };
      const response = await fetch("/api/calendario", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
        }
      });
      if (!response.ok) throw new Error("Failed to add event");
      return response.json();
    },
    onSuccess: () => {
      refetchEventos();
      setShowAddForm(false);
      setEventForm({ evento: "", fecha: "", categoria: "", imagen: "", descripcion: "" });
      toast({ title: "Evento agregado", description: "El evento se ha agregado exitosamente." });
    }
  });

  const addImageMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/galeria", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
        }
      });
      if (!response.ok) throw new Error("Failed to add image");
      return response.json();
    },
    onSuccess: () => {
      refetchImagenes();
      setShowAddForm(false);
      setImageForm({ imagen: "", categoria: "", nombre: "" });
      toast({ title: "Imagen agregada", description: "La imagen se ha agregado exitosamente." });
    }
  });

  const addArticleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/articulos", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
        }
      });
      if (!response.ok) throw new Error("Failed to add article");
      return response.json();
    },
    onSuccess: () => {
      refetchArticulos();
      setShowAddForm(false);
      setArticleForm({ titulo: "", contenido: "", autor: "", categoria: "", imagen: "" });
      toast({ title: "Artículo agregado", description: "El artículo se ha agregado exitosamente." });
    }
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/galeria/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
        }
      });
      if (!response.ok) throw new Error("Error eliminando imagen");
      return response.json();
    },
    onSuccess: () => {
      refetchImagenes();
      toast({ title: "Imagen eliminada", description: "La imagen se ha eliminado exitosamente." });
    }
  });

  const updateImageMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!editImageId) throw new Error("No hay imagen seleccionada para editar");
      const response = await fetch(`/api/galeria/${editImageId}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
        }
      });
      if (!response.ok) throw new Error("Error actualizando imagen");
      return response.json();
    },
    onSuccess: () => {
      refetchImagenes();
      setEditImageId(null);
      toast({ title: "Imagen actualizada", description: "La imagen se ha actualizado exitosamente." });
    }
  });

  const updateEventMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!editEventId) throw new Error("No hay evento seleccionado para editar");
      const fechaISO = data.fecha ? new Date(data.fecha).toISOString() : null;
      const payload = { ...data, fecha: fechaISO };
      const response = await fetch(`/api/calendario/${editEventId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
        }
      });
      if (!response.ok) throw new Error("Error actualizando evento");
      return response.json();
    },
    onSuccess: () => {
      refetchEventos();
      setEditEventId(null);
      toast({ title: "Evento actualizado", description: "El evento se ha actualizado exitosamente." });
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/calendario/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
        }
      });
      if (!response.ok) throw new Error("Error eliminando evento");
      return response.json();
    },
    onSuccess: () => {
      refetchEventos();
      toast({ title: "Evento eliminado", description: "El evento se ha eliminado exitosamente." });
    }
  });

  // 2. Mutación para editar libro
  const editBookMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const response = await fetch(`/api/biblioteca/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
        }
      });
      if (!response.ok) throw new Error("Error al editar libro");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Libro editado", description: "El libro se actualizó correctamente." });
      setShowEditForm(false);
      setEditBookId(null);
      refetchLibros();
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo editar el libro", variant: "destructive" });
    }
  });

  // Mutación para editar artículo
  const editArticleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const response = await fetch(`/api/articulos/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
        }
      });
      if (!response.ok) throw new Error("Error al editar artículo");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Artículo editado", description: "El artículo se actualizó correctamente." });
      setShowEditArticleForm(false);
      setEditArticleId(null);
      refetchArticulos();
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo editar el artículo", variant: "destructive" });
    }
  });

  // Mutación para eliminar artículo
  const deleteArticleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/articulos/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
        }
      });
      if (!response.ok) throw new Error("Error al eliminar artículo");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Artículo eliminado", description: "El artículo fue eliminado correctamente." });
      setDeleteArticleDialogOpen(false);
      setArticleToDelete(null);
      refetchArticulos();
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo eliminar el artículo", variant: "destructive" });
    }
  });

  // Mutación para editar candidato
  const editCandidateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const response = await fetch(`/api/candidatos/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
        }
      });
      if (!response.ok) throw new Error("Error al editar candidato");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Candidato editado", description: "El candidato se actualizó correctamente." });
      setShowEditCandidateForm(false);
      setEditCandidateId(null);
      refetchCandidatos();
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo editar el candidato", variant: "destructive" });
    }
  });

  // Mutación para eliminar candidato
  const deleteCandidateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/candidatos/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
        }
      });
      if (!response.ok) throw new Error("Error al eliminar candidato");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Candidato eliminado", description: "El candidato fue eliminado correctamente." });
      setDeleteCandidateDialogOpen(false);
      setCandidateToDelete(null);
      refetchCandidatos();
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo eliminar el candidato", variant: "destructive" });
    }
  });

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const user = localStorage.getItem("adminUser");
    
    if (!token || !user) {
      setLocation("/admin");
      return;
    }
    
    try {
      setAdminUser(JSON.parse(user));
    } catch {
      setLocation("/admin");
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    setLocation("/");
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente.",
    });
  };

  const tabs = [
    { key: "biblioteca", label: "Biblioteca Digital" },
    { key: "votaciones", label: "Votaciones" },
    { key: "articulos", label: "Artículos" },
    { key: "galeria", label: "Galería" },
    { key: "calendario", label: "Calendario" },
  ] as const;

  if (!adminUser) {
    return (
      <div className="pt-16 min-h-screen bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="pt-28 sm:pt-24 min-h-screen bg-gradient-to-br from-blue-600 to-blue-500 p-2 sm:p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <Card className="mb-4 sm:mb-8">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <div className="text-center sm:text-left w-full">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Panel de Administración</h1>
                <p className="text-gray-600">Bienvenido.</p>
              </div>
              <div className="w-full sm:w-auto flex justify-center sm:justify-end">
                <Button
                  variant="destructive"
                  onClick={handleLogout}
                  className="w-full sm:w-auto"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Navigation Tabs */}
        <Card className="mb-4 sm:mb-8">
          <CardContent className="p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 text-center mb-4 sm:mb-6">
              Administrar
            </h2>
            <div className="flex flex-wrap sm:flex-nowrap flex-col sm:flex-row justify-center gap-2 sm:gap-4">
              {tabs.map((tab) => (
                <Button
                  key={tab.key}
                  variant={activeTab === tab.key ? "default" : "outline"}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full sm:w-auto ${activeTab === tab.key ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
        {/* Content */}
        <div className="space-y-4 sm:space-y-6">
          {activeTab === "biblioteca" && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-2 sm:gap-0">
                <h3 className="text-xl sm:text-2xl font-bold text-white text-center sm:text-left">Gestión de Biblioteca</h3>
                <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Libro
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Agregar Nuevo Libro</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="nombreLibro">Nombre del Libro</Label>
                        <Input
                          id="nombreLibro"
                          value={bookForm.nombreLibro}
                          onChange={(e) => setBookForm({...bookForm, nombreLibro: e.target.value})}
                          placeholder="Ej: Álgebra de Baldor"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="autor">Autor</Label>
                        <Input
                          id="autor"
                          value={bookForm.autor}
                          onChange={(e) => setBookForm({...bookForm, autor: e.target.value})}
                          placeholder="Ej: Aurelio Baldor"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="materia">Materia</Label>
                        <Select value={bookForm.materia} onValueChange={(value) => setBookForm({...bookForm, materia: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar materia" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Matemáticas">Matemáticas</SelectItem>
                            <SelectItem value="Ciencias">Ciencias</SelectItem>
                            <SelectItem value="Historia">Historia</SelectItem>
                            <SelectItem value="Literatura">Literatura</SelectItem>
                            <SelectItem value="Inglés">Inglés</SelectItem>
                            <SelectItem value="Física">Física</SelectItem>
                            <SelectItem value="Química">Química</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="portada">URL de Portada</Label>
                        <Input
                          id="portada"
                          value={bookForm.portada}
                          onChange={(e) => setBookForm({...bookForm, portada: e.target.value})}
                          placeholder="https://ejemplo.com/portada.jpg"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="pdf">URL del PDF (o sube un archivo)</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            id="pdf"
                            value={bookForm.pdf}
                            onChange={(e) => setBookForm({...bookForm, pdf: e.target.value})}
                            placeholder="https://ejemplo.com/libro.pdf"
                            className="flex-1"
                          />
                          <input
                            type="file"
                            accept="application/pdf"
                            style={{ display: "none" }}
                            ref={fileInputRef}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploadingImage(true);
                              const formData = new FormData();
                              formData.append("file", file);
                              try {
                                const res = await fetch("/api/upload", {
                                  method: "POST",
                                  body: formData,
                                });
                                const data = await res.json();
                                setBookForm((prev) => ({ ...prev, pdf: data.url }));
                              } catch {
                                toast({ title: "Error", description: "No se pudo subir el PDF", variant: "destructive" });
                              } finally {
                                setUploadingImage(false);
                              }
                            }}
                          />
                          <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
                            {uploadingImage ? "Subiendo..." : "Subir PDF"}
                          </Button>
                        </div>
                        {bookForm.pdf && (
                          <a href={bookForm.pdf} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs mt-1 underline">Ver PDF</a>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowAddForm(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={() => addBookMutation.mutate(bookForm)} disabled={addBookMutation.isPending}>
                        {addBookMutation.isPending ? "Agregando..." : "Agregar"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
                {(libros as Libro[]).map((libro) => (
                  <Card key={libro.id} className="bg-white w-full">
                    <div className="aspect-[3/4] overflow-hidden rounded-t-lg bg-gray-100 flex items-center justify-center">
                      {libro.portada ? (
                        <img
                          src={libro.portada}
                          alt={libro.nombreLibro}
                          className="w-full h-full object-cover max-h-60 sm:max-h-80"
                        />
                      ) : libro.pdf ? (
                        <PdfThumbnail pdfUrl={libro.pdf} width={300} height={400} />
                      ) : (
                        <span className="text-gray-300 text-5xl"><svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor' className='w-16 h-16'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 7v10a4 4 0 004 4h10a4 4 0 004-4V7M16 3v4M8 3v4m-5 4h18' /></svg></span>
                      )}
                    </div>
                    <CardContent className="p-3 sm:p-4">
                      <h3 className="font-semibold text-gray-800 mb-1 sm:mb-2 text-base sm:text-lg">{libro.nombreLibro}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Por: {libro.autor}</p>
                      <Badge className="mb-2 sm:mb-4">{libro.materia}</Badge>
                      <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
                        {libro.pdf && (
                          <Button size="sm" className="w-full sm:flex-1 bg-green-500 hover:bg-green-600" onClick={() => setOpenPdf({ url: libro.pdf ?? '', title: libro.nombreLibro })}>
                            <Eye className="mr-2 h-4 w-4" />
                            Leer
                          </Button>
                        )}
                        <Button size="sm" className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => {
                          setEditBookId(libro.id);
                          setEditBookForm({
                            nombreLibro: libro.nombreLibro,
                            autor: libro.autor,
                            portada: libro.portada || "",
                            pdf: libro.pdf || "",
                            materia: libro.materia || ""
                          });
                          setShowEditForm(true);
                        }}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === "votaciones" && (
            <div>
              {/* Filtros de año y sección */}
              <div className="mb-4 flex flex-col sm:flex-row items-center gap-2">
                <Label className="text-white">Filtrar por Año:</Label>
                <Select value={filtroAnio} onValueChange={setFiltroAnio}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="Año" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos</SelectItem>
                    {[1,2,3,4,5].map((anio) => (
                      <SelectItem key={anio} value={anio.toString()}>{anio}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Label className="text-white">Sección:</Label>
                <Select value={filtroSeccion} onValueChange={setFiltroSeccion}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="Sección" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todas</SelectItem>
                    {["A","B","C","D","E","F","G"].map((sec) => (
                      <SelectItem key={sec} value={sec}>{sec}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Label className="text-white">Tipo de Elección:</Label>
                <Select value={filtroTipoEleccion} onValueChange={setFiltroTipoEleccion}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Tipo de Elección" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos</SelectItem>
                    <SelectItem value="estudiantiles">Estudiantiles</SelectItem>
                    <SelectItem value="carnaval">Reina del Carnaval</SelectItem>
                    <SelectItem value="vocero">Vocero Estudiantil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Recuento de votos */}
              <div className="mb-6">
                <h4 className="text-lg sm:text-xl font-semibold text-white mb-2">Recuento de Votos</h4>
                {loadingEstadisticas ? (
                  <div className="text-gray-200">Cargando recuento...</div>
                ) : errorEstadisticas ? (
                  <div className="text-red-400">Error al cargar el recuento de votos</div>
                ) : estadisticas && estadisticas.votosPorCandidato && estadisticas.votosPorCandidato.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-[400px] w-full text-sm text-left text-gray-700 bg-white rounded shadow">
                      <thead className="bg-blue-100">
                        <tr>
                          <th className="px-3 py-2">Nombre</th>
                          <th className="px-3 py-2">Apellido</th>
                          <th className="px-3 py-2">Año</th>
                          <th className="px-3 py-2">Sección</th>
                          <th className="px-3 py-2">Elección</th>
                          <th className="px-3 py-2">Votos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {estadisticas.votosPorCandidato.map((item: any, idx: number) => (
                            <tr key={idx} className="border-b last:border-b-0">
                              <td className="px-3 py-2">{item.nombre}</td>
                              <td className="px-3 py-2">{item.apellido}</td>
                              <td className="px-3 py-2">{item.grado}</td>
                              <td className="px-3 py-2">{item.seccion}</td>
                            <td className="px-3 py-2">{item.eleccionNombre}</td>
                              <td className="px-3 py-2 font-bold">{item.count}</td>
                            </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-gray-200">No hay votos registrados aún.</div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-2 sm:gap-0">
                <h3 className="text-xl sm:text-2xl font-bold text-white text-center sm:text-left">Gestión de Candidatos</h3>
                <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Candidato
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Agregar Nuevo Candidato</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="nombre">Nombre</Label>
                        <Input
                          id="nombre"
                          value={candidateForm.nombre}
                          onChange={(e) => setCandidateForm({...candidateForm, nombre: e.target.value})}
                          placeholder="Nombre del candidato"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="apellido">Apellido</Label>
                        <Input
                          id="apellido"
                          value={candidateForm.apellido}
                          onChange={(e) => setCandidateForm({...candidateForm, apellido: e.target.value})}
                          placeholder="Apellido del candidato"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="grado">Año</Label>
                        <Select value={candidateForm.grado} onValueChange={(value) => setCandidateForm({...candidateForm, grado: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar año" />
                          </SelectTrigger>
                          <SelectContent>
                            {["1","2","3","4","5"].map((anio) => (
                              <SelectItem key={anio} value={anio}>{anio}° año</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="seccion">Sección</Label>
                        <Select value={candidateForm.seccion} onValueChange={(value) => setCandidateForm({...candidateForm, seccion: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar sección" />
                          </SelectTrigger>
                          <SelectContent>
                            {["A","B","C","D","E","F","G"].map((sec) => (
                              <SelectItem key={sec} value={sec}>{sec}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="tipoEleccion">Tipo de Elección</Label>
                        <Select value={candidateForm.tipoEleccion} onValueChange={(value) => setCandidateForm({...candidateForm, tipoEleccion: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="estudiantiles">Elecciones Estudiantiles</SelectItem>
                            <SelectItem value="carnaval">Reina del Carnaval</SelectItem>
                            <SelectItem value="vocero">Vocero Estudiantil</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowAddForm(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={() => addCandidateMutation.mutate(candidateForm)} disabled={addCandidateMutation.isPending}>
                        {addCandidateMutation.isPending ? "Agregando..." : "Agregar"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
                {(candidatos as Candidato[]).map((candidato) => (
                  <Card key={candidato.id} className="bg-white w-full">
                    <CardContent className="p-3 sm:p-4">
                      <h3 className="font-semibold text-gray-800 mb-1 sm:mb-2 text-base sm:text-lg">{candidato.nombre} {candidato.apellido}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Año: {candidato.grado}° | Sección: {candidato.seccion}</p>
                      <Badge className="mb-2 sm:mb-4">
                        {candidato.tipoEleccion === "estudiantiles" ? "Estudiantiles" : candidato.tipoEleccion === "carnaval" ? "Reina del Carnaval" : candidato.tipoEleccion === "vocero" ? "Vocero" : candidato.tipoEleccion}
                      </Badge>
                      <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
                        <Button size="sm" className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => {
                          setEditCandidateId(candidato.id);
                          setEditCandidateForm({
                            nombre: candidato.nombre,
                            apellido: candidato.apellido,
                            grado: candidato.grado,
                            seccion: candidato.seccion,
                            tipoEleccion: candidato.tipoEleccion
                          });
                          setShowEditCandidateForm(true);
                        }}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                        <Button size="sm" variant="destructive" className="w-full sm:flex-1" onClick={() => {
                          setCandidateToDelete(candidato.id);
                          setDeleteCandidateDialogOpen(true);
                        }}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === "calendario" && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-2 sm:gap-0">
                <h3 className="text-xl sm:text-2xl font-bold text-white text-center sm:text-left">Gestión de Eventos</h3>
                <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Evento
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Agregar Nuevo Evento</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="evento">Nombre del Evento</Label>
                        <Input
                          id="evento"
                          value={eventForm.evento}
                          onChange={(e) => setEventForm({...eventForm, evento: e.target.value})}
                          placeholder="Ej: Día del Estudiante"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="fecha">Fecha</Label>
                        <Input
                          id="fecha"
                          type="datetime-local"
                          value={eventForm.fecha}
                          onChange={(e) => setEventForm({...eventForm, fecha: e.target.value})}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="categoria">Categoría</Label>
                        <Select value={eventForm.categoria} onValueChange={(value) => setEventForm({...eventForm, categoria: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Académico">Académico</SelectItem>
                            <SelectItem value="Cultural">Cultural</SelectItem>
                            <SelectItem value="Deportivo">Deportivo</SelectItem>
                            <SelectItem value="Institucional">Institucional</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="imagen">URL de la Imagen (o sube una imagen)</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            id="imagen"
                            value={eventForm.imagen}
                            onChange={(e) => setEventForm({...eventForm, imagen: e.target.value})}
                            placeholder="https://ejemplo.com/imagen.jpg"
                            className="flex-1"
                          />
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg"
                            ref={fileInputRef}
                            style={{ display: "none" }}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploadingImage(true);
                              const formData = new FormData();
                              formData.append("file", file);
                              try {
                                const res = await fetch("/api/upload", {
                                  method: "POST",
                                  body: formData,
                                });
                                const data = await res.json();
                                setEventForm((prev) => ({ ...prev, imagen: data.url }));
                              } catch {
                                toast({ title: "Error", description: "No se pudo subir la imagen", variant: "destructive" });
                              } finally {
                                setUploadingImage(false);
                              }
                            }}
                          />
                          <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
                            {uploadingImage ? "Subiendo..." : "Subir Imagen"}
                          </Button>
                        </div>
                      </div>
                      {eventForm.imagen && (
                        <img src={eventForm.imagen} alt="Previsualización" className="mt-2 rounded max-h-40" />
                      )}
                      <div className="grid gap-2">
                        <Label htmlFor="descripcion">Descripción</Label>
                        <textarea
                          id="descripcion"
                          value={eventForm.descripcion}
                          onChange={(e) => setEventForm({...eventForm, descripcion: e.target.value})}
                          placeholder="Descripción del evento"
                          className="border rounded px-3 py-2 min-h-[80px] resize-y"
                          maxLength={400}
                        />
                        <span className="text-xs text-gray-400 text-right">{eventForm.descripcion.length}/400</span>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowAddForm(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={() => addEventMutation.mutate(eventForm)} disabled={addEventMutation.isPending}>
                        {addEventMutation.isPending ? "Agregando..." : "Agregar"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
                {(eventos as Evento[]).map((evento) => (
                  <Card key={evento.id} className="bg-white w-full">
                    <CardContent className="p-3 sm:p-4">
                      <h3 className="font-semibold text-gray-800 mb-1 sm:mb-2 text-base sm:text-lg">{evento.evento}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">
                        {new Date(evento.fecha).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <Badge className="mb-2 sm:mb-4">{evento.categoria}</Badge>
                      <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
                        <Button size="sm" className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => {
                          setEditEventId(evento.id);
                          setEditEventForm({
                            evento: evento.evento,
                            fecha: evento.fecha ? new Date(evento.fecha).toISOString().slice(0, 16) : "",
                            categoria: evento.categoria,
                            imagen: evento.imagen || "",
                            descripcion: evento.descripcion || ""
                          });
                        }}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="w-full sm:flex-1"
                          onClick={() => { setEventToDelete(evento.id); setDeleteEventDialogOpen(true); }}
                          disabled={deleteEventMutation.isPending}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {deleteEventMutation.isPending ? "Eliminando..." : "Eliminar"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {/* Modal de edición de evento */}
              <Dialog open={editEventId !== null} onOpenChange={() => setEditEventId(null)}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Editar Evento</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="evento-edit">Nombre del Evento</Label>
                      <Input
                        id="evento-edit"
                        value={editEventForm.evento}
                        onChange={(e) => setEditEventForm({...editEventForm, evento: e.target.value})}
                        placeholder="Ej: Día del Estudiante"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="fecha-edit">Fecha</Label>
                      <Input
                        id="fecha-edit"
                        type="datetime-local"
                        value={editEventForm.fecha}
                        onChange={(e) => setEditEventForm({...editEventForm, fecha: e.target.value})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="categoria-edit">Categoría</Label>
                      <Select value={editEventForm.categoria} onValueChange={(value) => setEditEventForm({...editEventForm, categoria: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Académico">Académico</SelectItem>
                          <SelectItem value="Cultural">Cultural</SelectItem>
                          <SelectItem value="Deportivo">Deportivo</SelectItem>
                          <SelectItem value="Institucional">Institucional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="imagen-edit">URL de la Imagen (o sube una imagen)</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          id="imagen-edit"
                          value={editEventForm.imagen}
                          onChange={(e) => setEditEventForm({...editEventForm, imagen: e.target.value})}
                          placeholder="https://ejemplo.com/imagen.jpg"
                          className="flex-1"
                        />
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg"
                          ref={fileInputRef}
                          style={{ display: "none" }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploadingImage(true);
                            const formData = new FormData();
                            formData.append("file", file);
                            try {
                              const res = await fetch("/api/upload", {
                                method: "POST",
                                body: formData,
                              });
                              const data = await res.json();
                              setEditEventForm((prev) => ({ ...prev, imagen: data.url }));
                            } catch {
                              toast({ title: "Error", description: "No se pudo subir la imagen", variant: "destructive" });
                            } finally {
                              setUploadingImage(false);
                            }
                          }}
                        />
                        <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
                          {uploadingImage ? "Subiendo..." : "Subir Imagen"}
                        </Button>
                      </div>
                    </div>
                    {editEventForm.imagen && (
                      <img src={editEventForm.imagen} alt="Previsualización" className="mt-2 rounded max-h-40" />
                    )}
                    <div className="grid gap-2">
                      <Label htmlFor="descripcion-edit">Descripción</Label>
                      <textarea
                        id="descripcion-edit"
                        value={editEventForm.descripcion}
                        onChange={(e) => setEditEventForm({...editEventForm, descripcion: e.target.value})}
                        placeholder="Descripción del evento"
                        className="border rounded px-3 py-2 min-h-[80px] resize-y"
                        maxLength={400}
                      />
                      <span className="text-xs text-gray-400 text-right">{editEventForm.descripcion.length}/400</span>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setEditEventId(null)}>
                      Cancelar
                    </Button>
                    <Button onClick={() => updateEventMutation.mutate(editEventForm)} disabled={updateEventMutation.isPending}>
                      {updateEventMutation.isPending ? "Guardando..." : "Guardar"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              {/* AlertDialog para eliminar evento */}
              <AlertDialog open={deleteEventDialogOpen} onOpenChange={setDeleteEventDialogOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro de que quieres eliminar este evento?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. El evento será eliminado permanentemente del calendario.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        if (eventToDelete !== null) {
                          deleteEventMutation.mutate(eventToDelete);
                          setDeleteEventDialogOpen(false);
                          setEventToDelete(null);
                        }
                      }}
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {activeTab === "galeria" && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-2 sm:gap-0">
                <h3 className="text-xl sm:text-2xl font-bold text-white text-center sm:text-left">Gestión de Galería</h3>
                <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Imagen
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Agregar Nueva Imagen</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="nombre">Nombre</Label>
                        <Input
                          id="nombre"
                          value={imageForm.nombre}
                          onChange={(e) => setImageForm({...imageForm, nombre: e.target.value})}
                          placeholder="Nombre de la imagen"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="imagen">URL de la Imagen (o sube una imagen)</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            id="imagen"
                            value={imageForm.imagen}
                            onChange={(e) => setImageForm({...imageForm, imagen: e.target.value})}
                            placeholder="https://ejemplo.com/imagen.jpg"
                            className="flex-1"
                          />
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg"
                            ref={fileInputRef}
                            style={{ display: "none" }}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploadingImage(true);
                              const formData = new FormData();
                              formData.append("file", file);
                              try {
                                const res = await fetch("/api/upload", {
                                  method: "POST",
                                  body: formData,
                                });
                                const data = await res.json();
                                setImageForm((prev) => ({ ...prev, imagen: data.url }));
                              } catch {
                                toast({ title: "Error", description: "No se pudo subir la imagen", variant: "destructive" });
                              } finally {
                                setUploadingImage(false);
                              }
                            }}
                          />
                          <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
                            {uploadingImage ? "Subiendo..." : "Subir Imagen"}
                          </Button>
                        </div>
                      </div>
                      {imageForm.imagen && (
                        <img src={imageForm.imagen} alt="Previsualización" className="mt-2 rounded max-h-40" />
                      )}
                      <div className="grid gap-2">
                        <Label htmlFor="categoria">Categoría</Label>
                        <Select value={imageForm.categoria} onValueChange={(value) => setImageForm({...imageForm, categoria: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Eventos">Eventos</SelectItem>
                            <SelectItem value="Graduaciones">Graduaciones</SelectItem>
                            <SelectItem value="Deportes">Deportes</SelectItem>
                            <SelectItem value="Actividades">Actividades</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowAddForm(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={() => addImageMutation.mutate(imageForm)} disabled={addImageMutation.isPending}>
                        {addImageMutation.isPending ? "Agregando..." : "Agregar"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
                {(imagenes as Imagen[]).map((imagen) => (
                  <Card key={imagen.id} className="bg-white w-full">
                    <div className="aspect-square overflow-hidden rounded-t-lg">
                      <img
                        src={imagen.imagen}
                        alt={imagen.nombre}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-3 sm:p-4">
                      <h3 className="font-semibold text-gray-800 mb-1 sm:mb-2 text-base sm:text-lg">{imagen.nombre}</h3>
                      <Badge className="mb-2 sm:mb-4">{imagen.categoria}</Badge>
                      <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
                        <Button size="sm" className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => {
                          setEditImageId(imagen.id);
                          setEditImageForm({ imagen: imagen.imagen, categoria: imagen.categoria, nombre: imagen.nombre });
                        }}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                        <Button size="sm" variant="destructive" className="w-full sm:flex-1" onClick={() => { setImageToDelete(imagen.id); setDeleteDialogOpen(true); }} disabled={deleteImageMutation.isPending}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {/* Modal de edición */}
              <Dialog open={editImageId !== null} onOpenChange={() => setEditImageId(null)}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Editar Imagen</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="nombre-edit">Nombre</Label>
                      <Input
                        id="nombre-edit"
                        value={editImageForm.nombre}
                        onChange={(e) => setEditImageForm({ ...editImageForm, nombre: e.target.value })}
                        placeholder="Nombre de la imagen"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="imagen-edit">URL de la Imagen (o sube una imagen)</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          id="imagen-edit"
                          value={editImageForm.imagen}
                          onChange={(e) => setEditImageForm({ ...editImageForm, imagen: e.target.value })}
                          placeholder="https://ejemplo.com/imagen.jpg"
                          className="flex-1"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          ref={fileInputRef}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploadingImage(true);
                            const formData = new FormData();
                            formData.append("file", file);
                            try {
                              const res = await fetch("/api/upload", {
                                method: "POST",
                                body: formData,
                              });
                              const data = await res.json();
                              setEditImageForm((prev) => ({ ...prev, imagen: data.url }));
                            } catch {
                              toast({ title: "Error", description: "No se pudo subir la imagen", variant: "destructive" });
                            } finally {
                              setUploadingImage(false);
                            }
                          }}
                        />
                        <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
                          {uploadingImage ? "Subiendo..." : "Subir Imagen"}
                        </Button>
                      </div>
                      {editImageForm.imagen && (
                        <img src={editImageForm.imagen} alt="Previsualización" className="mt-2 rounded max-h-40" />
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="categoria-edit">Categoría</Label>
                      <Select value={editImageForm.categoria} onValueChange={(value) => setEditImageForm({ ...editImageForm, categoria: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Eventos">Eventos</SelectItem>
                          <SelectItem value="Graduaciones">Graduaciones</SelectItem>
                          <SelectItem value="Deportes">Deportes</SelectItem>
                          <SelectItem value="Actividades">Actividades</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setEditImageId(null)}>
                      Cancelar
                    </Button>
                    <Button onClick={async () => {
                      await updateImageMutation.mutateAsync({
                        imagen: editImageForm.imagen,
                        categoria: editImageForm.categoria,
                        nombre: editImageForm.nombre
                      });
                    }} disabled={updateImageMutation.isPending}>
                      {updateImageMutation.isPending ? "Guardando..." : "Guardar"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro de que quieres eliminar esta imagen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. La imagen será eliminada permanentemente de la galería.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        if (imageToDelete !== null) {
                          deleteImageMutation.mutate(imageToDelete);
                          setDeleteDialogOpen(false);
                          setImageToDelete(null);
                        }
                      }}
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {activeTab === "articulos" && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-2 sm:gap-0">
                <h3 className="text-xl sm:text-2xl font-bold text-white text-center sm:text-left">Gestión de Artículos</h3>
                <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Artículo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                      <DialogTitle>Agregar Nuevo Artículo</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="titulo">Título</Label>
                        <Input
                          id="titulo"
                          value={articleForm.titulo}
                          onChange={(e) => setArticleForm({...articleForm, titulo: e.target.value})}
                          placeholder="Título del artículo"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="contenido">Contenido</Label>
                        <Textarea
                          id="contenido"
                          value={articleForm.contenido}
                          onChange={(e) => setArticleForm({...articleForm, contenido: e.target.value})}
                          placeholder="Contenido del artículo"
                          rows={5}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="autor">Autor</Label>
                        <Input
                          id="autor"
                          value={articleForm.autor}
                          onChange={(e) => setArticleForm({...articleForm, autor: e.target.value})}
                          placeholder="Nombre del autor"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="categoria">Categoría</Label>
                        <Input
                          id="categoria"
                          value={articleForm.categoria}
                          onChange={(e) => setArticleForm({...articleForm, categoria: e.target.value})}
                          placeholder="Ej: Noticias, Opinión, Eventos..."
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="imagen">URL de la Imagen (o sube una imagen)</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            id="imagen"
                            value={articleForm.imagen}
                            onChange={(e) => setArticleForm({...articleForm, imagen: e.target.value})}
                            placeholder="https://ejemplo.com/imagen.jpg"
                            className="flex-1"
                          />
                          <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            style={{ display: "none" }}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploadingImage(true);
                              const formData = new FormData();
                              formData.append("file", file);
                              try {
                                const res = await fetch("/api/upload", {
                                  method: "POST",
                                  body: formData,
                                });
                                const data = await res.json();
                                setArticleForm((prev) => ({ ...prev, imagen: data.url }));
                              } catch {
                                toast({ title: "Error", description: "No se pudo subir la imagen", variant: "destructive" });
                              } finally {
                                setUploadingImage(false);
                              }
                            }}
                          />
                          <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
                            {uploadingImage ? "Subiendo..." : "Subir Imagen"}
                          </Button>
                        </div>
                      </div>
                      {articleForm.imagen && (
                        <img src={articleForm.imagen} alt="Previsualización" className="mt-2 rounded max-h-40" />
                      )}
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowAddForm(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={() => addArticleMutation.mutate(articleForm)} disabled={addArticleMutation.isPending}>
                        {addArticleMutation.isPending ? "Agregando..." : "Agregar"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
                {(articulos as any[]).map((articulo) => (
                  <Card key={articulo.id} className="bg-white w-full">
                    <div className="aspect-[3/2] overflow-hidden rounded-t-lg bg-gray-100 flex items-center justify-center">
                      {articulo.imagen ? (
                        <img
                          src={articulo.imagen}
                          alt={articulo.titulo}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-300 text-5xl"><svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor' className='w-16 h-16'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 7v10a4 4 0 004 4h10a4 4 0 004-4V7M16 3v4M8 3v4m-5 4h18' /></svg></span>
                      )}
                    </div>
                    <CardContent className="flex flex-col flex-1 p-3 sm:p-4">
                      <h3 className="font-semibold text-gray-800 mb-1 sm:mb-2 text-base sm:text-lg">{articulo.titulo}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2 line-clamp-3 min-h-[48px]">{articulo.contenido}</p>
                      <div className="flex flex-wrap gap-2 mb-2 sm:mb-4">
                        <Badge>{articulo.categoria}</Badge>
                        <span className="text-xs sm:text-sm text-gray-500">Por: {articulo.autor}</span>
                      </div>
                      <div className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">
                        {articulo.fechaCreacion && new Date(articulo.fechaCreacion).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="flex-1"></div>
                      <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 sm:mt-4">
                        <Button size="sm" className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => {
                          setEditArticleId(articulo.id);
                          setEditArticleForm({
                            titulo: articulo.titulo,
                            contenido: articulo.contenido,
                            autor: articulo.autor,
                            categoria: articulo.categoria,
                            imagen: articulo.imagen || ""
                          });
                          setShowEditArticleForm(true);
                        }}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                        <Button size="sm" variant="destructive" className="w-full sm:flex-1" onClick={() => {
                          setArticleToDelete(articulo.id);
                          setDeleteArticleDialogOpen(true);
                        }}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Modal de edición de libro */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Libro</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nombreLibro-edit">Título</Label>
              <Input
                id="nombreLibro-edit"
                value={editBookForm.nombreLibro}
                onChange={(e) => setEditBookForm({ ...editBookForm, nombreLibro: e.target.value })}
                placeholder="Título del libro"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="autor-edit">Autor</Label>
              <Input
                id="autor-edit"
                value={editBookForm.autor}
                onChange={(e) => setEditBookForm({ ...editBookForm, autor: e.target.value })}
                placeholder="Autor del libro"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="materia-edit">Materia</Label>
              <Select value={editBookForm.materia} onValueChange={(value) => setEditBookForm({ ...editBookForm, materia: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar materia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Matemáticas">Matemáticas</SelectItem>
                  <SelectItem value="Ciencias">Ciencias</SelectItem>
                  <SelectItem value="Historia">Historia</SelectItem>
                  <SelectItem value="Literatura">Literatura</SelectItem>
                  <SelectItem value="Inglés">Inglés</SelectItem>
                  <SelectItem value="Física">Física</SelectItem>
                  <SelectItem value="Química">Química</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="portada-edit">URL de Portada</Label>
              <Input
                id="portada-edit"
                value={editBookForm.portada}
                onChange={(e) => setEditBookForm({ ...editBookForm, portada: e.target.value })}
                placeholder="https://ejemplo.com/portada.jpg"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pdf-edit">URL del PDF (o sube un archivo)</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="pdf-edit"
                  value={editBookForm.pdf}
                  onChange={(e) => setEditBookForm({ ...editBookForm, pdf: e.target.value })}
                  placeholder="https://ejemplo.com/libro.pdf"
                  className="flex-1"
                />
                <input
                  type="file"
                  accept="application/pdf"
                  style={{ display: "none" }}
                  ref={fileInputRef}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingImage(true);
                    const formData = new FormData();
                    formData.append("file", file);
                    try {
                      const res = await fetch("/api/upload", {
                        method: "POST",
                        body: formData,
                      });
                      const data = await res.json();
                      setEditBookForm((prev) => ({ ...prev, pdf: data.url }));
                    } catch {
                      toast({ title: "Error", description: "No se pudo subir el PDF", variant: "destructive" });
                    } finally {
                      setUploadingImage(false);
                    }
                  }}
                />
                <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
                  {uploadingImage ? "Subiendo..." : "Subir PDF"}
                </Button>
              </div>
              {editBookForm.pdf && (
                <a href={editBookForm.pdf} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs mt-1 underline">Ver PDF</a>
              )}
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowEditForm(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              if (editBookId !== null) {
                editBookMutation.mutate({ id: editBookId, data: editBookForm });
              }
            }} disabled={editBookMutation.isPending}>
              {editBookMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Dialog para visualizar PDF */}
      <Dialog open={!!openPdf} onOpenChange={(open) => !open && setOpenPdf(null)}>
        <DialogContent className="max-w-3xl w-full">
          <DialogHeader>
            <DialogTitle>{openPdf?.title}</DialogTitle>
          </DialogHeader>
          {openPdf?.url && (
            <div className="w-full" style={{ height: "70vh" }}>
              <iframe
                src={`https://docs.google.com/gview?url=${encodeURIComponent(openPdf.url)}&embedded=true`}
                title={openPdf.title}
                className="w-full h-full rounded border"
                style={{ minHeight: 500 }}
                allowFullScreen
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Modal de edición de artículo */}
      <Dialog open={showEditArticleForm} onOpenChange={setShowEditArticleForm}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Editar Artículo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="titulo-edit">Título</Label>
              <Input
                id="titulo-edit"
                value={editArticleForm.titulo}
                onChange={(e) => setEditArticleForm({ ...editArticleForm, titulo: e.target.value })}
                placeholder="Título del artículo"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contenido-edit">Contenido</Label>
              <Textarea
                id="contenido-edit"
                value={editArticleForm.contenido}
                onChange={(e) => setEditArticleForm({ ...editArticleForm, contenido: e.target.value })}
                placeholder="Contenido del artículo"
                rows={5}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="autor-edit">Autor</Label>
              <Input
                id="autor-edit"
                value={editArticleForm.autor}
                onChange={(e) => setEditArticleForm({ ...editArticleForm, autor: e.target.value })}
                placeholder="Nombre del autor"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="categoria-edit">Categoría</Label>
              <Input
                id="categoria-edit"
                value={editArticleForm.categoria}
                onChange={(e) => setEditArticleForm({ ...editArticleForm, categoria: e.target.value })}
                placeholder="Ej: Noticias, Opinión, Eventos..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="imagen-edit">URL de la Imagen (o sube una imagen)</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="imagen-edit"
                  value={editArticleForm.imagen}
                  onChange={(e) => setEditArticleForm({ ...editArticleForm, imagen: e.target.value })}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="flex-1"
                />
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingImage(true);
                    const formData = new FormData();
                    formData.append("file", file);
                    try {
                      const res = await fetch("/api/upload", {
                        method: "POST",
                        body: formData,
                      });
                      const data = await res.json();
                      setEditArticleForm((prev) => ({ ...prev, imagen: data.url }));
                    } catch {
                      toast({ title: "Error", description: "No se pudo subir la imagen", variant: "destructive" });
                    } finally {
                      setUploadingImage(false);
                    }
                  }}
                />
                <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
                  {uploadingImage ? "Subiendo..." : "Subir Imagen"}
                </Button>
              </div>
              {editArticleForm.imagen && (
                <img src={editArticleForm.imagen} alt="Previsualización" className="mt-2 rounded max-h-40" />
              )}
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowEditArticleForm(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              if (editArticleId !== null) {
                editArticleMutation.mutate({ id: editArticleId, data: editArticleForm });
              }
            }} disabled={editArticleMutation.isPending}>
              {editArticleMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Diálogo de confirmación para eliminar artículo */}
      <AlertDialog open={deleteArticleDialogOpen} onOpenChange={setDeleteArticleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de que quieres eliminar este artículo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El artículo será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (articleToDelete !== null) {
                  deleteArticleMutation.mutate(articleToDelete);
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Modal de edición de candidato */}
      <Dialog open={showEditCandidateForm} onOpenChange={setShowEditCandidateForm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Candidato</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre-edit">Nombre</Label>
              <Input
                id="nombre-edit"
                value={editCandidateForm.nombre}
                onChange={(e) => setEditCandidateForm({ ...editCandidateForm, nombre: e.target.value })}
                placeholder="Nombre del candidato"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="apellido-edit">Apellido</Label>
              <Input
                id="apellido-edit"
                value={editCandidateForm.apellido}
                onChange={(e) => setEditCandidateForm({ ...editCandidateForm, apellido: e.target.value })}
                placeholder="Apellido del candidato"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="grado-edit">Año</Label>
              <Select value={editCandidateForm.grado} onValueChange={(value) => setEditCandidateForm({...editCandidateForm, grado: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar año" />
                </SelectTrigger>
                <SelectContent>
                  {["1","2","3","4","5"].map((anio) => (
                    <SelectItem key={anio} value={anio}>{anio}° año</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="seccion-edit">Sección</Label>
              <Select value={editCandidateForm.seccion} onValueChange={(value) => setEditCandidateForm({ ...editCandidateForm, seccion: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar sección" />
                </SelectTrigger>
                <SelectContent>
                  {["A","B","C","D","E","F","G"].map((sec) => (
                    <SelectItem key={sec} value={sec}>{sec}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tipoEleccion-edit">Tipo de Elección</Label>
              <Select value={editCandidateForm.tipoEleccion} onValueChange={(value) => setEditCandidateForm({ ...editCandidateForm, tipoEleccion: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="estudiantiles">Elecciones Estudiantiles</SelectItem>
                  <SelectItem value="carnaval">Reina del Carnaval</SelectItem>
                  <SelectItem value="vocero">Vocero Estudiantil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowEditCandidateForm(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              if (editCandidateId !== null) {
                editCandidateMutation.mutate({ id: editCandidateId, data: editCandidateForm });
              }
            }} disabled={editCandidateMutation.isPending}>
              {editCandidateMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Diálogo de confirmación para eliminar candidato */}
      <AlertDialog open={deleteCandidateDialogOpen} onOpenChange={setDeleteCandidateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de que quieres eliminar este candidato?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El candidato será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (candidateToDelete !== null) {
                  deleteCandidateMutation.mutate(candidateToDelete);
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}