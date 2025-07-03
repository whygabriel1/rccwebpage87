import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navigation from "@/components/navigation";
import Home from "@/pages/home";
import Voting from "@/pages/voting";
import Biblioteca from "@/pages/biblioteca";
import Articulos from "@/pages/articulos";
import Galeria from "@/pages/galeria";
import Calendario from "@/pages/calendario";
import Nosotros from "@/pages/nosotros";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/votaciones" component={Voting} />
      <Route path="/biblioteca" component={Biblioteca} />
      <Route path="/articulos" component={Articulos} />
      <Route path="/galeria" component={Galeria} />
      <Route path="/calendario" component={Calendario} />
      <Route path="/nosotros" component={Nosotros} />
      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <Router />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
