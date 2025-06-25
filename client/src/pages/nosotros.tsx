import { Card, CardContent } from "@/components/ui/card";
import { Heart, Star, Users } from "lucide-react";

export default function Nosotros() {
  return (
    <div className="pt-16 min-h-screen bg-white">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Sobre Nosotros
          </h1>

          {/* Hero Image */}
          <div className="mb-12 flex justify-center">
            <img
              src="/attached_assets/quiensomos.jpg"
              alt="Equipo docente y estudiantes de la institución"
              className="w-full max-w-3xl h-auto object-cover rounded-xl shadow-lg"
            />
          </div>

          {/* History */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Nuestra Historia
              </h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Fundado en 1955 en la ciudad de Santa Clara, el Colegio Nacional "Libertador Simón Bolívar" surgió como una iniciativa educativa para atender a la creciente población juvenil de la región. Su nombre rinde homenaje al prócer de la independencia latinoamericana, reflejando su compromiso con la formación de ciudadanos críticos y comprometidos.
              </p>
              <p className="text-gray-600 leading-relaxed">
                A lo largo de sus 70 años de trayectoria, nuestra institución ha sido pionera en la implementación de metodologías educativas innovadoras, adaptándose constantemente a los cambios del mundo moderno sin perder de vista nuestros valores fundamentales.
              </p>
            </CardContent>
          </Card>

          {/* Mission & Vision */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <Card className="bg-blue-600 text-white">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4">Nuestra Misión</h3>
                <p>
                  Formar integralmente a los estudiantes, desarrollando sus competencias académicas, sociales y emocionales para que se conviertan en ciudadanos responsables y agentes de cambio positivo en la sociedad.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 text-white">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4">Nuestra Visión</h3>
                <p>
                  Ser reconocidos como una institución educativa de excelencia, líder en innovación pedagógica y formación integral, contribuyendo al desarrollo sostenible de nuestra comunidad y del país.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Values */}
          <Card className="bg-gray-50 mb-8">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Nuestros Valores
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">Respeto</h4>
                  <p className="text-gray-600 text-sm">
                    Valoramos la diversidad y promovemos un ambiente de tolerancia y comprensión mutua.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">Excelencia</h4>
                  <p className="text-gray-600 text-sm">
                    Buscamos constantemente la mejora continua en todos los aspectos de la educación.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">Solidaridad</h4>
                  <p className="text-gray-600 text-sm">
                    Fomentamos el trabajo en equipo y el compromiso social con nuestra comunidad.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Información de Contacto
              </h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Dirección</h4>
                  <p className="text-gray-600 mb-4">
                    Av. Principal, Santa Clara<br />
                    Estado Zulia, Venezuela
                  </p>

                  <h4 className="font-semibold text-gray-800 mb-3">Teléfono</h4>
                  <p className="text-gray-600 mb-4">+58 261-123-4567</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Email</h4>
                  <p className="text-gray-600 mb-4">
                    info@robertocastillocardier.edu.ve
                  </p>

                  <h4 className="font-semibold text-gray-800 mb-3">
                    Horario de Atención
                  </h4>
                  <p className="text-gray-600">
                    Lunes a Viernes: 7:00 AM - 4:00 PM<br />
                    Sábados: 8:00 AM - 12:00 PM
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
