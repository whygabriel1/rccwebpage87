import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, ArrowLeft } from "lucide-react";
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
  candidatoVotado: string;
  tipoEleccion: VotingType;
}

export default function Voting() {
  const [currentStep, setCurrentStep] = useState<"select" | "cedula" | "data" | "vote" | "success">("select");
  const [votingType, setVotingType] = useState<VotingType>("estudiantiles");
  const [votingData, setVotingData] = useState<Partial<VotingData>>({});
  const [selectedCandidate, setSelectedCandidate] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      toast({
        title: "Error",
        description: error.message || "Error al registrar el voto",
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
    if (!selectedCandidate) {
      toast({
        title: "Error",
        description: "Por favor selecciona un candidato",
        variant: "destructive",
      });
      return;
    }

    const completeData = {
      ...votingData,
      candidatoVotado: selectedCandidate,
    } as VotingData;

    voteMutation.mutate(completeData);
  };

  const resetVoting = () => {
    setCurrentStep("select");
    setVotingData({});
    setSelectedCandidate("");
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

  // Filtrar candidatos por año y sección del estudiante (ignorando mayúsculas/minúsculas y espacios)
  const normalize = (str: string = "") => str.trim().toLowerCase();
  const filteredCandidates = candidates.filter(
    (candidate) => normalize(candidate.grado) === normalize(votingData.anioSeccion as string)
  );

  if (currentStep === "select") {
    return (
      <div className="pt-16 min-h-screen bg-gradient-to-br from-blue-600 to-blue-500">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-center text-white mb-12">
              Sistema de Votaciones RCC
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card 
                className="cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => handleVotingTypeSelect("estudiantiles")}
              >
                <img 
                  src="https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300" 
                  alt="Elecciones estudiantiles" 
                  className="w-full h-48 object-cover"
                />
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold mb-2">Elecciones Estudiantiles</h3>
                  <p className="text-gray-600">Vota por los representantes estudiantiles de tu sección.</p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => handleVotingTypeSelect("carnaval")}
              >
                <img 
                  src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300" 
                  alt="Reina del carnaval" 
                  className="w-full h-48 object-cover"
                />
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold mb-2">Reina del Carnaval</h3>
                  <p className="text-gray-600">Elige a la representante del carnaval escolar.</p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => handleVotingTypeSelect("vocero")}
              >
                <img 
                  src="https://images.unsplash.com/photo-1577896851231-70ef18881754?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300" 
                  alt="Elecciones de vocero" 
                  className="w-full h-48 object-cover"
                />
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold mb-2">Elecciones de Vocero</h3>
                  <p className="text-gray-600">Selecciona al vocero de tu curso.</p>
                </CardContent>
              </Card>
            </div>
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
                  filteredCandidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedCandidate(candidate.nombre)}
                    >
                      <span className="font-medium">
                        {candidate.nombre} - {candidate.grado}
                      </span>
                      <Checkbox
                        checked={selectedCandidate === candidate.nombre}
                        onChange={() => setSelectedCandidate(candidate.nombre)}
                      />
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end pt-6">
                <Button
                  onClick={handleVoteSubmit}
                  disabled={!selectedCandidate || voteMutation.isPending || filteredCandidates.length === 0}
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
