import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navigation() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location === path;

  const navItems = [
    { href: "/", label: "Inicio" },
    { href: "/biblioteca", label: "Biblioteca" },
    { href: "/votaciones", label: "Votaciones" },
    { href: "/articulos", label: "Artículos" },
  ];

  const moreItems = [
    { href: "/calendario", label: "Calendario" },
    { href: "/galeria", label: "Galería" },
    { href: "/nosotros", label: "Nosotros" },
  ];

  return (
    <header className="bg-blue-600 text-white shadow-lg fixed w-full top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <img 
              src="https://rccanaco.com/wp-content/uploads/2023/02/Logo-RCC-Anaco.png" 
              alt="Logo U.E Roberto Castillo Cardier" 
              className="w-10 h-10 object-contain"
            />
            <div>
              <h1 className="text-lg font-semibold">U.E ROBERTO CASTILLO CARDIER</h1>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`hover:text-blue-200 transition-colors ${
                  isActive(item.href) ? "text-blue-200" : "text-white"
                }`}
                onClick={e => { e.preventDefault(); window.location.href = item.href; }}
              >
                {item.label}
              </a>
            ))}
            
            {/* More Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center hover:text-blue-200 transition-colors">
                Más <ChevronDown className="ml-1 h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white text-gray-800">
                {moreItems.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <a
                      href={item.href}
                      className="w-full"
                      onClick={e => { e.preventDefault(); window.location.href = item.href; }}
                    >
                      {item.label}
                    </a>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* SARCC Button */}
            <a href="https://www.rccanaco.com/sarcc/" target="_blank" rel="noopener noreferrer">
              <Button
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-blue-400 text-white font-bold shadow-md hover:from-blue-700 hover:to-blue-500 transition-colors border-0 rounded-full px-6 py-2"
                style={{ letterSpacing: '1px' }}
              >
                SARCC
              </Button>
            </a>
          </nav>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden text-white">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-blue-600 text-white">
              <nav className="flex flex-col space-y-4 mt-8">
                {[...navItems, ...moreItems].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-white hover:text-blue-200 transition-colors"
                    onClick={e => { e.preventDefault(); window.location.href = item.href; setMobileMenuOpen(false); }}
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="https://www.rccanaco.com/sarcc/"
                  className="text-white hover:text-blue-200 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => { e.preventDefault(); window.open('https://www.rccanaco.com/sarcc/', '_blank'); setMobileMenuOpen(false); }}
                >
                  <span className="bg-gradient-to-r from-blue-600 to-blue-400 text-white font-bold shadow-md rounded-full px-6 py-2 block text-center">SARCC</span>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
