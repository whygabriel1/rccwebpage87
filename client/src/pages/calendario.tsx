import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Calendario } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Calendario() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Calendario | null>(null);

  const { data: events = [] } = useQuery<Calendario[]>({
    queryKey: ["/api/calendario", { 
      month: String(currentDate.getMonth() + 1).padStart(2, '0'),
      year: String(currentDate.getFullYear())
    }],
  });

  // Mock events for demonstration
  const mockEvents = [
    {
      id: 1,
      evento: "Reunión de Padres y Representantes",
      fecha: new Date(2025, 0, 15),
      categoria: "institucional",
    },
    {
      id: 2,
      evento: "Feria de Ciencias",
      fecha: new Date(2025, 0, 22),
      categoria: "academico",
    },
    {
      id: 3,
      evento: "Periodo de Inscripciones",
      fecha: new Date(2025, 0, 30),
      categoria: "administrativo",
    },
  ];

  const displayEvents = events.length > 0 ? events : mockEvents;

  const monthNames = [
    "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
    "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
  ];

  const dayNames = ["LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO", "DOMINGO"];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Adjust for Monday start

    const days = [];
    
    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEvents = displayEvents.filter(event => {
        const eventDate = new Date(event.fecha);
        return eventDate.getDate() === day && 
               eventDate.getMonth() === month && 
               eventDate.getFullYear() === year;
      });
      
      days.push({ day, events: dayEvents });
    }
    
    return days;
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const getEventColor = (categoria: string) => {
    const colors: Record<string, string> = {
      institucional: "bg-blue-100 text-blue-800",
      academico: "bg-green-100 text-green-800",
      administrativo: "bg-yellow-100 text-yellow-800",
      deportivo: "bg-purple-100 text-purple-800",
    };
    return colors[categoria] || "bg-gray-100 text-gray-800";
  };

  const days = getDaysInMonth(currentDate);
  const upcomingEvents = displayEvents
    .filter(event => new Date(event.fecha) >= new Date())
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    .slice(0, 5);

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Calendario {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>

          {/* Calendar */}
          <Card className="mb-8">
            <div className="flex items-center justify-between p-4 border-b">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-xl font-semibold text-gray-800">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="p-2 text-center font-semibold text-white bg-gray-800"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((dayData, index) => (
                  <div
                    key={index}
                    className={`p-4 h-20 border border-gray-200 relative ${
                      dayData ? "bg-white hover:bg-gray-50 cursor-pointer" : "bg-gray-100"
                    } transition-colors`}
                    onClick={() => {
                      if (dayData && dayData.events.length > 0) {
                        const event = dayData.events[0];
                        setSelectedEvent({
                          ...event,
                          imagen: (typeof (event as any).imagen === 'string') ? (event as any).imagen : null,
                          descripcion: (typeof (event as any).descripcion === 'string') ? (event as any).descripcion : null
                        });
                      }
                    }}
                  >
                    {dayData && (
                      <>
                        <span className="text-sm font-medium">{dayData.day}</span>
                        {dayData.events.map((event, eventIndex) => (
                          <div
                            key={eventIndex}
                            className="text-xs text-blue-600 mt-1 truncate"
                          >
                            {event.evento}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Modal de información de evento */}
          <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
            <DialogContent className="max-w-md w-full">
              <DialogHeader>
                <DialogTitle>{selectedEvent?.evento}</DialogTitle>
              </DialogHeader>
              {selectedEvent && (
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
                    <b>Fecha:</b> {new Date(selectedEvent.fecha).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
                  </div>
                  <div className="text-sm text-gray-600">
                    <b>Categoría:</b> {selectedEvent.categoria}
                  </div>
                  {selectedEvent.imagen && (
                    <img src={selectedEvent.imagen} alt="Imagen del evento" className="rounded w-full max-h-48 object-cover" />
                  )}
                  {selectedEvent.descripcion && (
                    <div className="text-gray-700 text-sm mt-2">
                      <b>Descripción:</b> {selectedEvent.descripcion}
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Upcoming Events */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Próximos Eventos
              </h3>
              {upcomingEvents.length === 0 ? (
                <p className="text-gray-500">No hay eventos próximos programados.</p>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`flex items-center p-3 rounded-lg ${getEventColor(event.categoria)}`}
                    >
                      <div className="w-3 h-3 rounded-full mr-3 bg-current opacity-60"></div>
                      <div className="flex-1">
                        <div className="font-medium">{event.evento}</div>
                        <div className="text-sm opacity-75">
                          {new Date(event.fecha).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
