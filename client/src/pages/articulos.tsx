import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Article {
  id: number;
  titulo: string;
  contenido: string;
  autor: string;
  categoria: string;
  imagen?: string;
  fechaCreacion?: string;
}

export default function Articulos() {
  const { data: articles = [], isLoading } = useQuery<Article[]>({
    queryKey: ["/api/articulos"],
  });
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Académico": "bg-blue-100 text-blue-800",
      "Deportes": "bg-green-100 text-green-800",
      "Ciencias": "bg-purple-100 text-purple-800",
      "Reconocimientos": "bg-yellow-100 text-yellow-800",
      "Infraestructura": "bg-gray-100 text-gray-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Sin fecha";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Sin fecha";
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">Cargando artículos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">
              Artículos y Noticias
            </h1>

            {articles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  No hay artículos disponibles en este momento.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {articles.map((article) => (
                  <Card key={article.id} className="overflow-hidden">
                    <div className="md:flex">
                      <div className="md:w-64 md:flex-shrink-0">
                        {article.imagen && (
                          <img
                            src={article.imagen}
                            alt={article.titulo}
                            className="w-full h-48 md:h-full object-cover"
                          />
                        )}
                      </div>
                      <CardContent className="p-6 flex-1">
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <Calendar className="mr-2 h-4 w-4" />
                          <span>{formatDate(article.fechaCreacion || "")}</span>
                          <span className="mx-2">•</span>
                          <Badge className={getCategoryColor(article.categoria)}>
                            {article.categoria}
                          </Badge>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-3">
                          {article.titulo}
                        </h2>
                        <p className="text-gray-600 mb-4 line-clamp-3">{article.contenido}</p>
                        <button
                          className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                          onClick={() => setSelectedArticle(article)}
                        >
                          Leer más →
                        </button>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Modal para mostrar el artículo completo */}
      <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedArticle?.titulo}</DialogTitle>
          </DialogHeader>
          {selectedArticle?.imagen && (
            <img
              src={selectedArticle.imagen}
              alt={selectedArticle.titulo}
              className="w-full h-64 object-cover rounded mb-4"
            />
          )}
          <div className="mb-2 text-sm text-gray-500">
            <Calendar className="inline mr-1 h-4 w-4" />
            {formatDate(selectedArticle?.fechaCreacion || "")}
            <span className="mx-2">•</span>
            <Badge className={getCategoryColor(selectedArticle?.categoria || "")}>{selectedArticle?.categoria}</Badge>
            <span className="mx-2">•</span>
            <span>Por: {selectedArticle?.autor}</span>
          </div>
          <div className="text-gray-800 whitespace-pre-line">
            {selectedArticle?.contenido}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
