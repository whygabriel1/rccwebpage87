import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Expand } from "lucide-react";
import type { Galeria } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Galeria() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedImage, setExpandedImage] = useState<null | { imagen: string; nombre: string }>(null);

  const { data: images = [], isLoading } = useQuery<Galeria[]>({
    queryKey: ["/api/galeria", { categoria: selectedCategory === "all" ? "" : selectedCategory }],
  });

  const categories = [
    { value: "all", label: "Todas" },
    { value: "Eventos", label: "Eventos" },
    { value: "Deportes", label: "Deportes" },
    { value: "Académico", label: "Académico" },
    { value: "Graduaciones", label: "Graduaciones" },
  ];

  // Mock images for demonstration
  const mockImages = [
    {
      id: 1,
      imagen: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
      categoria: "deportes",
      nombre: "Actividades deportivas",
    },
    {
      id: 2,
      imagen: "https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
      categoria: "eventos",
      nombre: "Foto grupal escolar",
    },
    {
      id: 3,
      imagen: "https://pixabay.com/get/g3a76f438111d4c0ea20120367a914f34a8a3a1c089425c46ac3e1db5c709f1fa450d9b2b00714ba20a2e3bdf3effd7102b0c0b74b88858fb0773469d3ea22d6d_1280.jpg",
      categoria: "academico",
      nombre: "Ceremonia académica",
    },
    {
      id: 4,
      imagen: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
      categoria: "academico",
      nombre: "Estudiantes estudiando",
    },
    {
      id: 5,
      imagen: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
      categoria: "academico",
      nombre: "Feria científica",
    },
    {
      id: 6,
      imagen: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
      categoria: "eventos",
      nombre: "Celebración escolar",
    },
    {
      id: 7,
      imagen: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
      categoria: "academico",
      nombre: "Biblioteca",
    },
    {
      id: 8,
      imagen: "https://images.unsplash.com/photo-1577896851231-70ef18881754?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
      categoria: "graduacion",
      nombre: "Ceremonia de graduación",
    },
  ];

  const displayImages = images.length > 0 ? images : mockImages;

  // Función para normalizar texto (sin acentos y minúsculas, compatible ES5)
  function normalize(str: string) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  const filteredImages = selectedCategory === "all"
    ? displayImages
    : displayImages.filter(image => normalize(image.categoria) === normalize(selectedCategory));

  if (isLoading) {
    return (
      <div className="pt-16 min-h-screen bg-white">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">Cargando galería...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-white">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-12">
              Galería
            </h1>

            {/* Category Filter */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="inline-flex bg-gray-100 rounded-lg p-1 overflow-x-auto max-w-full whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-300">
                {categories.map((category) => (
                  <Button
                    key={category.value}
                    variant={selectedCategory === category.value ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.value)}
                    className={`transition-colors mx-1 min-w-[90px] px-3 py-1 text-xs sm:text-sm ${
                      selectedCategory === category.value
                        ? "bg-blue-600 text-white"
                        : "hover:bg-gray-200"
                    }`}
                  >
                    {category.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Gallery Grid */}
            {filteredImages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  No hay imágenes disponibles para esta categoría.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {filteredImages.map((image) => (
                  <Card
                    key={image.id}
                    className="relative group overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer w-full"
                  >
                    <img
                      src={image.imagen}
                      alt={image.nombre}
                      className="w-full h-40 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setExpandedImage({ imagen: image.imagen, nombre: image.nombre })}
                      >
                        <Expand className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 sm:p-3">
                      <p className="text-white text-xs sm:text-sm font-medium">{image.nombre}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Dialog open={!!expandedImage} onOpenChange={(open) => { if (!open) setExpandedImage(null); }}>
        <DialogContent className="max-w-xs sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{expandedImage?.nombre}</DialogTitle>
          </DialogHeader>
          {expandedImage && (
            <img src={expandedImage.imagen} alt={expandedImage.nombre} className="w-full h-auto max-h-[70vh] rounded-lg object-contain mx-auto" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
