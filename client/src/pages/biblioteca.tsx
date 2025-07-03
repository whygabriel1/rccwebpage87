import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Download, Search } from "lucide-react";
import type { Biblioteca } from "@shared/schema";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.3.31/pdf.worker.min.mjs";

function PdfThumbnail({ pdfUrl, width = 300, height = 400 }: { pdfUrl: string, width?: number, height?: number }) {
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

export default function Biblioteca() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [openPdf, setOpenPdf] = useState<{ url: string; title: string } | null>(null);

  const { data: books = [], isLoading } = useQuery<Biblioteca[]>({
    queryKey: ["/api/biblioteca", { materia: selectedSubject === "all" ? "" : selectedSubject, search: searchQuery }],
  });

  const subjects = [
    { value: "all", label: "Todas las materias" },
    { value: "matematicas", label: "Matemáticas" },
    { value: "historia", label: "Historia" },
    { value: "ciencias", label: "Ciencias" },
    { value: "literatura", label: "Literatura" },
    { value: "fisica", label: "Física" },
    { value: "quimica", label: "Química" },
  ];

  const getSubjectColor = (subject: string) => {
    const colors: Record<string, string> = {
      matematicas: "bg-blue-100 text-blue-800",
      historia: "bg-green-100 text-green-800",
      ciencias: "bg-purple-100 text-purple-800",
      literatura: "bg-pink-100 text-pink-800",
      fisica: "bg-indigo-100 text-indigo-800",
      quimica: "bg-orange-100 text-orange-800",
    };
    return colors[subject.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="pt-16 min-h-screen bg-white">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">Cargando biblioteca...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-white">
      <div className="container mx-auto px-2 sm:px-4 py-10 sm:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between mb-6 sm:mb-8 gap-2 sm:gap-0">
              <div className="w-full sm:w-auto">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2 text-center sm:text-left">
                  Biblioteca Digital
                </h1>
                <p className="text-gray-600 text-center sm:text-left">
                  Accede a nuestra colección de recursos educativos
                </p>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-6 sm:mb-8">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar libros..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={selectedSubject}
                onValueChange={setSelectedSubject}
              >
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Filtrar por materia" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.value} value={subject.value}>
                      {subject.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Books Grid */}
            {books.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <p className="text-gray-500 text-base sm:text-lg">
                  No se encontraron libros. La biblioteca digital está siendo actualizada.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {books.map((book) => (
                  <Card key={book.id} className="hover:shadow-md transition-shadow flex flex-col h-full w-full">
                    <div className="aspect-[3/4] overflow-hidden rounded-t-lg">
                      {book.portada ? (
                        <img
                          src={book.portada}
                          alt={book.nombreLibro}
                          className="w-full h-full object-cover"
                        />
                      ) : book.pdf ? (
                        <PdfThumbnail pdfUrl={book.pdf} width={300} height={400} />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400">Sin portada</span>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4 sm:p-6 flex flex-col flex-1">
                      <div className="mb-2 min-h-[80px] flex flex-col justify-between">
                        <h3 className="font-bold text-base sm:text-lg text-gray-800 line-clamp-2 text-center sm:text-left">
                          {book.nombreLibro}
                        </h3>
                        <span className="text-gray-600 line-clamp-1 text-center sm:text-left">{book.autor}</span>
                      </div>
                      <div className="flex-1"></div>
                      <Badge className={`mb-4 ${getSubjectColor(book.materia)}`}>{book.materia}</Badge>
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-4">
                        {book.pdf && (
                          <Button
                            size="sm"
                            className="w-full sm:flex-1 bg-green-500 hover:bg-green-600"
                            onClick={() => setOpenPdf({ url: book.pdf ?? '', title: book.nombreLibro })}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Leer
                          </Button>
                        )}
                        <Button
                          size="sm"
                          className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700"
                          asChild
                        >
                          <a
                            href={`/api/download?url=${encodeURIComponent(book.pdf ?? '')}&filename=${encodeURIComponent((book.nombreLibro || 'archivo') + '.pdf')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Descargar
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para visualizar PDF */}
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
    </div>
  );
}
