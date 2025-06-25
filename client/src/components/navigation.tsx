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
              <Link
                key={item.href}
                href={item.href}
                className={`hover:text-blue-200 transition-colors ${
                  isActive(item.href) ? "text-blue-200" : "text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
            
            {/* More Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center hover:text-blue-200 transition-colors">
                Más <ChevronDown className="ml-1 h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white text-gray-800">
                {moreItems.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href} className="w-full">
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Admin Button */}
            <Link href="/admin">
              <Button variant="secondary" size="sm">
                Admin
              </Button>
            </Link>
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
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/admin"
                  className="text-white hover:text-blue-200 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
