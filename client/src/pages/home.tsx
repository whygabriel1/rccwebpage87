import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, Users, Image } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Calendario } from "@shared/schema";
import { useEffect, useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { FaFacebook, FaInstagram, FaXTwitter, FaUserGraduate, FaUserShield } from "react-icons/fa6";
import { Helmet } from "react-helmet";

// Hook para detectar si un elemento está en vista
function useInView<T extends HTMLElement = HTMLElement>(options?: IntersectionObserverInit): [React.RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new window.IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      options
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [options]);
  return [ref, inView];
}

// Hook para animar el conteo
function useCountUp(to: number, duration = 1500, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startValue = 0;
    const increment = to / (duration / 16);
    let frame: number;
    function animate() {
      startValue += increment;
      if (startValue < to) {
        setCount(Math.floor(startValue));
        frame = requestAnimationFrame(animate);
      } else {
        setCount(to);
      }
    }
    animate();
    return () => cancelAnimationFrame(frame);
  }, [to, duration, start]);
  return count;
}

// Componente de círculo con animación de pulsación
function PulseCircle({ animating, children }: { animating: boolean; children: React.ReactNode }) {
  // Estado para controlar el final suave
  const [showPulse, setShowPulse] = useState(false);
  useEffect(() => {
    if (animating) {
      setShowPulse(true);
    } else if (showPulse) {
      // Espera más tiempo para un desvanecimiento más suave
      const timeout = setTimeout(() => setShowPulse(false), 900);
      return () => clearTimeout(timeout);
    }
  }, [animating]);
  return (
    <div
      className={`w-32 h-32 rounded-full border-4 border-blue-600 flex items-center justify-center mx-auto mb-4 transition-all duration-[900ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
        animating || showPulse ? 'animate-pulse-ring' : ''
      }`}
      style={{ boxShadow: (animating || showPulse) ? '0 0 0 8px rgba(37,99,235,0.15)' : '0 0 0 0 rgba(37,99,235,0)', background: (animating || showPulse) ? 'radial-gradient(circle at 50% 50%, rgba(37,99,235,0.08) 60%, transparent 100%)' : undefined }}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const [proximoEvento, setProximoEvento] = useState<Calendario | null>(null);
  const [statsRef, statsInView] = useInView<HTMLDivElement>({ threshold: 0.3 });
  const [hasAnimated, setHasAnimated] = useState(false);
  const { toast } = useToast ? useToast() : { toast: () => {} };

  const { data: eventos } = useQuery({
    queryKey: ["calendario"],
    queryFn: api.getCalendario,
  });

  useEffect(() => {
    if (statsInView && !hasAnimated) setHasAnimated(true);
  }, [statsInView, hasAnimated]);

  const countEgresados = useCountUp(1032, 1500, hasAnimated);
  const countDocentes = useCountUp(430, 1500, hasAnimated);
  const countAnios = useCountUp(32, 1500, hasAnimated);

  useEffect(() => {
    if (eventos && eventos.length > 0) {
      const hoy = new Date();
      const eventosFuturos = eventos
        .map((evento: Calendario) => ({
          ...evento,
          fecha: new Date(evento.fecha),
        }))
        .filter((evento: Calendario) => evento.fecha >= hoy);

      if (eventosFuturos.length > 0) {
        eventosFuturos.sort(
          (a: Calendario, b: Calendario) =>
            a.fecha.getTime() - b.fecha.getTime()
        );
        setProximoEvento(eventosFuturos[0]);
      }
    }
  }, [eventos]);

  return (
    <>
      <Helmet>
        <title>Inicio - U.E Roberto Castilo Cardier</title>
      </Helmet>
      <div className="pt-16">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center">
          <img
            src="/attached_assets/quiensomos.jpg"
            alt="Unidad Educativa Roberto Castillo Cardier"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          <div className="relative z-10 container mx-auto px-2 sm:px-4 py-10 sm:py-20 md:py-10 flex items-center justify-center md:items-start md:justify-start min-h-screen">
            <div className="w-full max-w-xs sm:max-w-xl md:ml-0 ml-auto mr-auto flex flex-col items-center md:items-start px-2 md:px-0 mt-8 md:mt-32">
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-white leading-tight mb-2 md:mb-4 text-center md:text-left">
                Unidad Educativa
              </h1>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-2 md:mb-4 text-center md:text-left">
                Roberto Castillo
              </h2>
              <h3 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-4 md:mb-8 text-center md:text-left">
                Cardier
              </h3>
              <p className="text-base sm:text-lg md:text-2xl text-white opacity-90 mb-6 sm:mb-8 md:mb-12 text-center md:text-left">
                Excelencia en Educación Privada
              </p>
            </div>
          </div>
        </section>

        {/* Blue section with description */}
        <div className="relative z-10 bg-blue-600 text-white py-8 sm:py-16">
          <div className="container mx-auto px-2 sm:px-4">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-base sm:text-lg leading-relaxed">
                Nuestro instituto, pone al servicio del País, de Latinoamérica y el 
                mundo, sus capacidades y fortalezas académicas, técnicas y de 
                investigación, a fin de contribuir en la construcción de soluciones para 
                la mejora de los procesos productivos y con ello a la calidad de vida de 
                los ciudadanos, sin dejar de lado la preservación del medio ambiente.
              </p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="relative z-10 bg-white py-8 sm:py-16" ref={statsRef}>
          <div className="container mx-auto px-2 sm:px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <PulseCircle animating={hasAnimated && (countEgresados !== 1032)}>
                  <span className="text-4xl font-bold text-gray-800">{countEgresados}</span>
                </PulseCircle>
                <div className="text-center">
                  <div className="font-bold text-gray-800">Estudiantes</div>
                  <div className="font-bold text-gray-800">Egresados</div>
                </div>
              </div>
              <div className="text-center">
                <PulseCircle animating={hasAnimated && (countDocentes !== 430)}>
                  <span className="text-4xl font-bold text-gray-800">{countDocentes}</span>
                </PulseCircle>
                <div className="text-center">
                  <div className="font-bold text-gray-800">Docentes</div>
                  <div className="font-bold text-gray-800">Ingresados</div>
                </div>
              </div>
              <div className="text-center">
                <PulseCircle animating={hasAnimated && (countAnios !== 32)}>
                  <span className="text-4xl font-bold text-gray-800">{countAnios}</span>
                </PulseCircle>
                <div className="text-center">
                  <div className="font-bold text-gray-800">Años de</div>
                  <div className="font-bold text-gray-800">Servicio</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Carnival Event Section */}
        <section className="bg-gray-100 py-8 sm:py-16">
          <div className="container mx-auto px-2 sm:px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center">
                {/* Image */}
                <div>
                  <img
                    src={proximoEvento?.imagen || "/attached_assets/pic1-home.jpg"}
                    alt={proximoEvento?.evento || "Evento institucional"}
                    className="w-full h-96 object-cover rounded-lg shadow-lg"
                  />
                </div>
                
                {/* Content */}
                <div>
                  <div className="bg-blue-600 text-white p-8 rounded-lg">
                    <h2 className="text-3xl font-bold mb-4">
                      Próximo Evento Institucional
                    </h2>
                    {proximoEvento ? (
                      <>
                        <h3 className="text-4xl font-bold mb-6">
                          {proximoEvento.evento}
                        </h3>
                        <p className="text-lg leading-relaxed">
                          Fecha: {new Date(proximoEvento.fecha).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
                        </p>
                        <p className="text-lg leading-relaxed mt-2">
                          Categoría: {proximoEvento.categoria}
                        </p>
                        {proximoEvento.descripcion && (
                          <p className="text-base leading-relaxed mt-4 bg-white/10 p-4 rounded">
                            {proximoEvento.descripcion}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-lg leading-relaxed">
                        No hay próximos eventos programados.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Footer Section */}
        <section className="bg-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Dirección */}
                <div>
                  <h3 className="font-bold text-gray-800 mb-4">Dirección</h3>
                  <p className="text-gray-600 mb-2">Calle Boulevard</p>
                  <p className="text-gray-600 mb-2">con Ymca,</p>
                  <p className="text-gray-600">Anaco - Venezuela</p>
                </div>
                
                {/* Hora de Atención */}
                <div>
                  <h3 className="font-bold text-gray-800 mb-4">Hora de Atención</h3>
                  <p className="text-gray-600 mb-2">Lunes a Viernes</p>
                  <p className="text-gray-600">7:30 AM a 12:30 PM.</p>
                </div>
                
                {/* Contáctanos */}
                <div>
                  <h3 className="font-bold text-gray-800 mb-4">Contáctanos</h3>
                  <p className="text-gray-600 mb-2">(0424)-8766990</p>
                  <p className="text-gray-600">rccanaco@rcc.com</p>
                </div>
              </div>
              
              {/* Bottom Links */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                  <div className="flex justify-center md:justify-start">
                    <a
                      href="https://www.rccanaco.com/sarcc/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow transition-all duration-200"
                    >
                      <FaUserGraduate className="w-5 h-5" />
                      Ingresar al Sistema Académico
                    </a>
                  </div>
                  <div className="flex justify-center md:justify-end mt-2 md:mt-0">
                    <a
                      href="/admin"
                      className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-900 text-white font-bold text-base shadow transition-all duration-200"
                    >
                      <FaUserShield className="w-5 h-5" />
                      Ingresar al Modo Administrador
                    </a>
                  </div>
                </div>
                
                {/* Social Media Icons */}
                <div className="mt-8 text-center">
                  <div className="flex justify-center space-x-4">
                    <a
                      href="https://www.facebook.com/people/UE-Roberto-Castillo-Cardier/100063663166465/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded flex items-center justify-center hover:bg-blue-100 transition-colors"
                      title="Facebook"
                    >
                      <FaFacebook className="w-6 h-6 text-[#1877F3]" />
                    </a>
                    <a
                      href="https://www.instagram.com/news.rcc/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded flex items-center justify-center hover:bg-pink-100 transition-colors"
                      title="Instagram"
                    >
                      <FaInstagram className="w-6 h-6 text-[#E4405F]" />
                    </a>
                    <button
                      className="w-8 h-8 rounded flex items-center justify-center hover:bg-gray-200 transition-colors"
                      title="X (Twitter)"
                      onClick={() => toast({ title: "Próximamente", description: "Red social disponible muy pronto" })}
                      type="button"
                    >
                      <FaXTwitter className="w-6 h-6 text-black" />
                    </button>
                  </div>
                  <p className="text-gray-600 mt-4">Redes Sociales</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Voting Options Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Student Elections */}
            <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <img 
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400" 
                alt="Estudiantes trabajando en mesa de estudio" 
                className="w-full h-48 object-cover"
              />
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-3 text-gray-800">
                  Elecciones Estudiantiles
                </h3>
                <p className="text-gray-600 mb-4">
                  Vota por tus representantes estudiantiles y participa en la democracia escolar.
                </p>
                <Link href="/votaciones">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <Users className="mr-2 h-4 w-4" />
                    Votar Ahora
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Carnival Queen */}
            <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <img 
                src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400" 
                alt="Celebración de carnaval con trajes coloridos" 
                className="w-full h-48 object-cover"
              />
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-3 text-gray-800">
                  Reina del Carnaval
                </h3>
                <p className="text-gray-600 mb-4">
                  Elige a la representante de nuestra institución en las festividades de carnaval.
                </p>
                <Link href="/votaciones">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <Users className="mr-2 h-4 w-4" />
                    Participar
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Vocational Elections */}
            <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <img 
                src="/attached_assets/pic1-home.jpg"
                alt="Estudiantes en ceremonia de graduación" 
                className="w-full h-48 object-cover"
              />
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-3 text-gray-800">
                  Elecciones de Vocero
                </h3>
                <p className="text-gray-600 mb-4">
                  Selecciona al vocero estudiantil que representará tus intereses.
                </p>
                <Link href="/votaciones">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <Users className="mr-2 h-4 w-4" />
                    Elegir Vocero
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Quick Access Section */}
        <section className="bg-gray-100 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
              Acceso Rápido
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Link href="/biblioteca">
                <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-800">Biblioteca</h3>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/calendario">
                <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <Calendar className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-800">Calendario</h3>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/galeria">
                <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <Image className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-800">Galería</h3>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/articulos">
                <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-800">Artículos</h3>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
