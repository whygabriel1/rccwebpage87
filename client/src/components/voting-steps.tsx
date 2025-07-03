import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, ArrowLeft } from "lucide-react";

interface VotingStepsProps {
  votingType: string;
  onComplete: () => void;
  onBack: () => void;
}

export default function VotingSteps({ votingType, onComplete, onBack }: VotingStepsProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    cedula: "",
    nombre: "",
    apellido: "",
    rol: "",
    anioSeccion: "",
    direccion: "",
    candidato: "",
  });

  const candidates = [
    "Gabriel Martinez - 5to A",
    "Anthony Rodriguez - 5to E", 
    "José Pérez - 5to F",
    "Antonella Rodriguez - 5to D",
  ];

  const getTitle = () => {
    switch (votingType) {
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

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleSubmit = () => {
    // Here you would typically submit the vote to the API
    setStep(4);
  };

  const handleBack = () => {
    if (step === 1) {
      onBack();
    } else {
      setStep(step - 1);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {step === 1 && (
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-xl flex items-center justify-center mx-auto mb-4 transform rotate-45">
              <span className="transform -rotate-45 font-bold text-xl">CC</span>
            </div>
            <CardTitle className="text-2xl">{getTitle()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <Label htmlFor="cedula">Ingresar Cédula</Label>
                <Input
                  id="cedula"
                  type="text"
                  placeholder="30.250.286"
                  value={formData.cedula}
                  onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                  className="mt-2"
                />
              </div>
              <Button onClick={handleNext} className="w-full">
                Consultar
              </Button>
              <Button variant="ghost" onClick={handleBack} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{getTitle()}</CardTitle>
            <p className="text-sm text-gray-600">Datos</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Cédula</Label>
                <Input value={formData.cedula} readOnly className="bg-gray-100 mt-2" />
              </div>
              
              <div>
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  placeholder="Josue"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="apellido">Apellido</Label>
                <Input
                  id="apellido"
                  placeholder="Rodriguez"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="rol">Rol</Label>
                <Input
                  id="rol"
                  placeholder="Estudiante"
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="anioSeccion">Año y Sección</Label>
                <Input
                  id="anioSeccion"
                  placeholder="5to 'E'"
                  value={formData.anioSeccion}
                  onChange={(e) => setFormData({ ...formData, anioSeccion: e.target.value })}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  placeholder="Calle Street..."
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleNext}>Siguiente</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{getTitle()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {candidates.map((candidate) => (
                <div
                  key={candidate}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setFormData({ ...formData, candidato: candidate })}
                >
                  <span className="font-medium">{candidate}</span>
                  <Checkbox checked={formData.candidato === candidate} />
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-6">
              <Button onClick={handleSubmit} disabled={!formData.candidato}>
                Votar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
            <h3 className="text-3xl font-bold text-gray-800 mb-4">
              ¡Has Votado Exitosamente!
            </h3>
            <p className="text-gray-600 mb-6">
              Tu voto ha sido registrado correctamente en el sistema.
            </p>
            <Button onClick={onComplete}>Volver</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
