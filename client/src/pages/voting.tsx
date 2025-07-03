import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, ArrowLeft, Lock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Candidato } from "@shared/schema";
import axios from "axios";

type VotingType = "estudiantiles" | "carnaval" | "vocero";

interface VotingData {
  cedula: string;
  nombre: string;
  apellido: string;
  rol: string;
  anioSeccion: string;
  direccion: string;
  candidatoVotado?: string;
  candidatoId?: number;
  tipoEleccion: VotingType;
}

// Definir el tipo Eleccion si no está importado
interface Eleccion {
  id: number;
  nombre: string;
  descripcion?: string;
  fecha: string;
}

// Función para determinar si una elección está disponible
function isEleccionDisponible(eleccion: VotingType): { disponible: boolean, mensaje?: string } {
  const now = new Date();
  const year = now.getFullYear();
  if (eleccion === "carnaval") {
    // Disponible del 3 al 7 de marzo
    const inicio = new Date(year, 2, 3); // Mes 2 = marzo
    const fin = new Date(year, 2, 7, 23, 59, 59);
    if (now >= inicio && now <= fin) {
      return { disponible: true };
    } else {
      return { disponible: false, mensaje: `No disponible hasta el 3 de marzo de ${year}` };
    }
  }
  if (eleccion === "vocero") {
    // Disponible del 20 al 24 de octubre
    const inicio = new Date(year, 9, 20); // Mes 9 = octubre
    const fin = new Date(year, 9, 24, 23, 59, 59);
    if (now >= inicio && now <= fin) {
      return { disponible: true };
    } else {
      return { disponible: false, mensaje: `No disponible hasta el 20 de octubre de ${year}` };
    }
  }
  // Estudiantiles siempre disponible
  return { disponible: true };
}

// Función para obtener la imagen de cada elección
function getEleccionImage(eleccion: Eleccion) {
  if (eleccion.nombre.toLowerCase().includes("carnaval")) {
    return "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=400&q=80";
  }
  if (eleccion.nombre.toLowerCase().includes("vocero")) {
    return "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=400&q=80";
  }
  // Estudiantiles por defecto
  return "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=400&q=80";
}

export default function Voting() {
  const [currentStep, setCurrentStep] = useState<"select" | "cedula" | "data" | "vote" | "success">("select");
  const [votingType, setVotingType] = useState<VotingType>("estudiantiles");
  const [votingData, setVotingData] = useState<Partial<VotingData>>({});
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [elecciones, setElecciones] = useState<Eleccion[]>([]);

  const { data: candidates = [] } = useQuery<Candidato[]>({
    queryKey: ["/api/candidatos", votingType],
    enabled: currentStep === "vote",
  });

  const voteMutation = useMutation({
    mutationFn: async (data: VotingData) => {
      const response = await apiRequest("POST", "/api/votaciones", data);
      return response.json();
    },
    onSuccess: () => {
      setCurrentStep("success");
      toast({
        title: "¡Voto registrado!",
        description: "Tu voto ha sido registrado exitosamente.",
      });
    },
    onError: (error: any) => {
      let mensaje = "No puedes votar porque ya lo hiciste en esta elección.";
      if (error?.response?.data?.message) {
        const msg = error.response.data.message.toLowerCase();
        if (msg.includes("ya ha votado") || msg.includes("ya voto")) {
          mensaje = "No puedes votar porque ya lo hiciste en esta elección.";
        } else {
          mensaje = error.response.data.message;
        }
      } else if (typeof error === 'string') {
        mensaje = error;
      }
      toast({
        title: "Error",
        description: mensaje,
        variant: "destructive",
      });
    },
  });

  const handleVotingTypeSelect = (type: VotingType) => {
    setVotingType(type);
    setCurrentStep("cedula");
  };

  const handleCedulaSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const cedula = formData.get("cedula") as string;
    
    if (!cedula) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu cédula",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await axios.get(`/api/estudiantes/cedula/${cedula}`);
      const estudiante = res.data;
      setVotingData({
        ...votingData,
        cedula,
        nombre: estudiante.nombre,
        apellido: estudiante.apellido,
        rol: "Estudiante",
        anioSeccion: estudiante.anioSeccion,
        direccion: estudiante.direccion,
        tipoEleccion: votingType,
      });
      setCurrentStep("data");
    } catch (error) {
      toast({
        title: "Estudiante no encontrado",
        description: "La cédula ingresada no corresponde a ningún estudiante registrado.",
        variant: "destructive",
      });
    }
  };

  const handleDataSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      ...votingData,
      nombre: formData.get("nombre") as string,
      apellido: formData.get("apellido") as string,
      rol: formData.get("rol") as string,
      anioSeccion: formData.get("anioSeccion") as string,
      direccion: formData.get("direccion") as string,
    };

    setVotingData(data);
    setCurrentStep("vote");
  };

  const handleVoteSubmit = () => {
    if (selectedCandidate === null) {
      toast({
        title: "Error",
        description: "Por favor selecciona un candidato",
        variant: "destructive",
      });
      return;
    }

    // Asegurarse de que todos los campos requeridos estén presentes
    if (!votingData.cedula || !votingData.nombre || !votingData.apellido || !votingData.rol || !votingData.anioSeccion || !votingData.direccion || !votingType) {
      toast({
        title: "Error",
        description: "Faltan datos requeridos para votar.",
        variant: "destructive",
      });
      return;
    }

    const completeData = {
      cedula: votingData.cedula,
      nombre: votingData.nombre,
      apellido: votingData.apellido,
      rol: votingData.rol,
      anioSeccion: votingData.anioSeccion,
      direccion: votingData.direccion,
      candidatoId: selectedCandidate,
      tipoEleccion: votingType,
    };

    voteMutation.mutate(completeData);
  };

  const resetVoting = () => {
    setCurrentStep("select");
    setVotingData({});
    setSelectedCandidate(null);
  };

  const getVotingTypeTitle = (type: VotingType) => {
    switch (type) {
      case "estudiantiles":
        return "Elecciones Estudiantiles";
      case "carnaval":
        return "Reina del Carnaval";
      case "vocero":
        return "Elecciones de Vocero";
      default:
        return "Votaciones";
    }
  };

  // Filtrar candidatos por año y sección del estudiante
  const estudianteAnio = (votingData.anioSeccion || '').charAt(0);
  const estudianteSeccion = (votingData.anioSeccion || '').charAt(1)?.toUpperCase();
  const filteredCandidates = candidates.filter(
    (candidate) =>
      candidate.grado === estudianteAnio &&
      candidate.seccion.toUpperCase() === estudianteSeccion &&
      candidate.tipoEleccion === votingType
  );

  useEffect(() => {
    axios.get("/api/elecciones")
      .then(res => {
        console.log('Respuesta de /api/elecciones:', res.data);
        if (Array.isArray(res.data)) {
          setElecciones(res.data);
        } else if (Array.isArray(res.data.elecciones)) {
          setElecciones(res.data.elecciones);
        } else {
          setElecciones([]);
        }
      })
      .catch(err => {
        console.error('Error al cargar elecciones:', err);
        setElecciones([]);
      });
  }, []);

  if (currentStep === "select") {
    return (
      <div className="pt-16 min-h-screen bg-gradient-to-br from-blue-600 to-blue-500">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-center text-white mb-12">
              Sistema de Votaciones RCC
            </h1>
            {Array.isArray(elecciones) && elecciones.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {elecciones.map((eleccion: Eleccion) => {
                  let tipo: VotingType = "estudiantiles";
                  if (eleccion.nombre.toLowerCase().includes("carnaval")) tipo = "carnaval";
                  if (eleccion.nombre.toLowerCase().includes("vocero")) tipo = "vocero";
                  const estado = isEleccionDisponible(tipo);
                  return (
                    <div key={eleccion.id} className="relative">
                      <div
                        className={`rounded-xl shadow-xl p-0 bg-white flex flex-col items-center transition-all duration-300 ${!estado.disponible ? "opacity-60 grayscale" : "hover:scale-105 cursor-pointer"}`}
                        onClick={() => estado.disponible && handleVotingTypeSelect(tipo)}
                        style={{ minHeight: 400, maxWidth: 360 }}
                      >
                        <img
                          src={getEleccionImage(eleccion)}
                          alt={eleccion.nombre}
                          className="w-full h-48 object-cover rounded-t-xl mb-0"
                        />
                        <div className="text-lg font-semibold text-center mb-2 mt-4">{eleccion.nombre}</div>
                        <div className="text-gray-500 text-center text-sm mb-2">{eleccion.descripcion}</div>
                        {estado.disponible ? (
                          <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium mt-2">Disponible</span>
                        ) : null}
                        {/* Franja inferior para mensaje de disponibilidad */}
                        {!estado.disponible && (
                          <div className="absolute left-0 right-0 bottom-0 flex flex-col items-center justify-center bg-blue-100 rounded-b-xl z-10 py-4 border-t border-blue-200">
                            <Lock className="w-7 h-7 text-blue-500 mb-1" />
                            <span className="text-blue-700 font-semibold text-sm text-center">
                              {estado.mensaje}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-white text-center">No hay elecciones disponibles o error al cargar.</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {currentStep === "cedula" && (
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-xl flex items-center justify-center mx-auto mb-4 transform rotate-45">
                <span className="transform -rotate-45 font-bold text-xl">CC</span>
              </div>
              <CardTitle className="text-2xl">{getVotingTypeTitle(votingType)}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCedulaSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="cedula">Ingresar Cédula</Label>
                  <Input
                    id="cedula"
                    name="cedula"
                    type="text"
                    placeholder="30.250.286"
                    className="mt-2"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Consultar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={resetVoting}
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al inicio
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {currentStep === "data" && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{getVotingTypeTitle(votingType)}</CardTitle>
              <p className="text-sm text-gray-600">Datos</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDataSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="cedula-readonly">Cédula</Label>
                  <Input
                    id="cedula-readonly"
                    value={votingData.cedula || ""}
                    readOnly
                    className="bg-gray-100 mt-2"
                  />
                </div>
                
                <div>
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    type="text"
                    value={votingData.nombre || ""}
                    readOnly
                    className="bg-gray-100 mt-2"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="apellido">Apellido</Label>
                  <Input
                    id="apellido"
                    name="apellido"
                    type="text"
                    value={votingData.apellido || ""}
                    readOnly
                    className="bg-gray-100 mt-2"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="rol">Rol</Label>
                  <Input
                    id="rol"
                    name="rol"
                    type="text"
                    value={votingData.rol || ""}
                    readOnly
                    className="bg-gray-100 mt-2"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="anioSeccion">Año y Sección</Label>
                  <Input
                    id="anioSeccion"
                    name="anioSeccion"
                    type="text"
                    value={votingData.anioSeccion || ""}
                    readOnly
                    className="bg-gray-100 mt-2"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    name="direccion"
                    type="text"
                    value={votingData.direccion || ""}
                    readOnly
                    className="bg-gray-100 mt-2"
                    required
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit">Siguiente</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {currentStep === "vote" && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{getVotingTypeTitle(votingType)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredCandidates.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No hay candidatos disponibles para tu año y sección.
                  </div>
                ) : (
                  filteredCandidates.map((candidate) => {
                    const estado = isEleccionDisponible(votingType);
                    return (
                      <div
                        key={candidate.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => setSelectedCandidate(candidate.id)}
                      >
                        <span className="font-medium">
                          {candidate.nombre} {candidate.apellido} - {candidate.grado}° año {candidate.seccion}
                        </span>
                        <Checkbox
                          checked={selectedCandidate === candidate.id}
                          onChange={() => setSelectedCandidate(candidate.id)}
                        />
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex justify-end pt-6">
                <Button
                  onClick={handleVoteSubmit}
                  disabled={selectedCandidate === null || voteMutation.isPending || filteredCandidates.length === 0}
                >
                  {voteMutation.isPending ? "Votando..." : "Votar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === "success" && (
          <Card>
            <CardContent className="text-center py-8">
              <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
              <h3 className="text-3xl font-bold text-gray-800 mb-4">
                ¡Has Votado Exitosamente!
              </h3>
              <p className="text-gray-600 mb-6">
                Tu voto ha sido registrado correctamente en el sistema.
              </p>
              <Button onClick={resetVoting}>Volver</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
