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
  grado: string;
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
    grado: "",
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
      setCandidateForm({ nombre: "", grado: "", tipoEleccion: "" });
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
    <div className="pt-16 min-h-screen bg-gradient-to-br from-blue-600 to-blue-500 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Panel de Administración</h1>
                <p className="text-gray-600">Bienvenido, {adminUser.nombreUsuario}</p>
              </div>
              <Button
                variant="destructive"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Tabs */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
              Administrar
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {tabs.map((tab) => (
                <Button
                  key={tab.key}
                  variant={activeTab === tab.key ? "default" : "outline"}
                  onClick={() => setActiveTab(tab.key)}
                  className={activeTab === tab.key ? "bg-blue-600 hover:bg-blue-700" : ""}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === "biblioteca" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Gestión de Biblioteca</h3>
                <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(libros as Libro[]).map((libro) => (
                  <Card key={libro.id} className="bg-white">
                    <div className="aspect-[3/4] overflow-hidden rounded-t-lg bg-gray-100 flex items-center justify-center">
                      {libro.portada ? (
                        <img
                          src={libro.portada}
                          alt={libro.nombreLibro}
                          className="w-full h-full object-cover"
                        />
                      ) : libro.pdf ? (
                        <PdfThumbnail pdfUrl={libro.pdf} width={300} height={400} />
                      ) : (
                        <span className="text-gray-300 text-5xl"><svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor' className='w-16 h-16'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 7v10a4 4 0 004 4h10a4 4 0 004-4V7M16 3v4M8 3v4m-5 4h18' /></svg></span>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-2">{libro.nombreLibro}</h3>
                      <p className="text-sm text-gray-600 mb-2">Por: {libro.autor}</p>
                      <Badge className="mb-4">{libro.materia}</Badge>
                      <div className="flex space-x-2">
                        {libro.pdf && (
                          <Button size="sm" className="flex-1 bg-green-500 hover:bg-green-600" asChild>
                            <a href={libro.pdf} target="_blank" rel="noopener noreferrer">
                              <Eye className="mr-2 h-4 w-4" />
                              Leer
                            </a>
                          </Button>
                        )}
                        <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
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
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Gestión de Candidatos</h3>
                <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
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
                        <Label htmlFor="grado">Grado</Label>
                        <Input
                          id="grado"
                          value={candidateForm.grado}
                          onChange={(e) => setCandidateForm({...candidateForm, grado: e.target.value})}
                          placeholder="Ej: 5to año"
                        />
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(candidatos as Candidato[]).map((candidato) => (
                  <Card key={candidato.id} className="bg-white">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-2">{candidato.nombre}</h3>
                      <p className="text-sm text-gray-600 mb-2">Grado: {candidato.grado}</p>
                      <Badge className="mb-4">{candidato.tipoEleccion}</Badge>
                      <div className="flex space-x-2">
                        <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                        <Button size="sm" variant="destructive" className="flex-1">
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
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Gestión de Eventos</h3>
                <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(eventos as Evento[]).map((evento) => (
                  <Card key={evento.id} className="bg-white">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-2">{evento.evento}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {new Date(evento.fecha).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <Badge className="mb-4">{evento.categoria}</Badge>
                      <div className="flex space-x-2">
                        <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => {
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
                          className="flex-1"
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
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Gestión de Galería</h3>
                <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(imagenes as Imagen[]).map((imagen) => (
                  <Card key={imagen.id} className="bg-white">
                    <div className="aspect-square overflow-hidden rounded-t-lg">
                      <img
                        src={imagen.imagen}
                        alt={imagen.nombre}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-2">{imagen.nombre}</h3>
                      <Badge className="mb-4">{imagen.categoria}</Badge>
                      <div className="flex space-x-2">
                        <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => {
                          setEditImageId(imagen.id);
                          setEditImageForm({ imagen: imagen.imagen, categoria: imagen.categoria, nombre: imagen.nombre });
                        }}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                        <Button size="sm" variant="destructive" className="flex-1" onClick={() => { setImageToDelete(imagen.id); setDeleteDialogOpen(true); }} disabled={deleteImageMutation.isPending}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          {deleteImageMutation.isPending ? "Eliminando..." : "Eliminar"}
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
                      <Label htmlFor="imagen-edit">URL de la Imagen</Label>
                      <Input
                        id="imagen-edit"
                        value={editImageForm.imagen}
                        onChange={(e) => setEditImageForm({ ...editImageForm, imagen: e.target.value })}
                        placeholder="https://ejemplo.com/imagen.jpg"
                      />
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
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Gestión de Artículos</h3>
                <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(articulos as any[]).map((articulo) => (
                  <Card key={articulo.id} className="bg-white flex flex-col h-full">
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
                    <CardContent className="flex flex-col flex-1 p-4">
                      <h3 className="font-semibold text-gray-800 mb-2">{articulo.titulo}</h3>
                      <p className="text-gray-600 mb-2 line-clamp-3 min-h-[48px]">{articulo.contenido}</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge>{articulo.categoria}</Badge>
                        <span className="text-xs text-gray-500">Por: {articulo.autor}</span>
                      </div>
                      <div className="text-xs text-gray-400 mb-2">
                        {articulo.fechaCreacion && new Date(articulo.fechaCreacion).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="flex-1"></div>
                      <div className="flex space-x-2 mt-4">
                        <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                        <Button size="sm" variant="destructive" className="flex-1">
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
    </div>
  );
}