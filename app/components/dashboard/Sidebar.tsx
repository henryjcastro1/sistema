"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { 
  Home, 
  Users, 
  Package, 
  ShoppingCart, 
  Shield, 
  Settings,
  ChevronDown,
  ChevronRight,
  FileText,
  BarChart3,
  CreditCard,
  LogOut
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [configOpen, setConfigOpen] = useState(false);

  const menuItems = [
    { label: "Dashboard", href: "/dashboard", icon: Home },
    { label: "Usuarios", href: "/usuarios", icon: Users },
    { label: "Productos", href: "/productos", icon: Package },
    { label: "Pedidos", href: "/pedidos", icon: ShoppingCart },
    { label: "Servicios", href: "/servicios", icon: Shield },
  ];

  const configItems = [
    { label: "Auditoría - Usuarios", href: "/config/usuarios", icon: FileText },
    { label: "Monedas", href: "/config/monedas", icon: CreditCard },
    { label: "Auditoría - General", href: "/config/auditoria/", icon: BarChart3 },
  ];

  const isActive = (href: string) => pathname === href;
  const isConfigActive = configItems.some(item => pathname.startsWith('/config'));

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      router.replace("/login"); // evita volver atrás
      router.refresh();
    } catch (error) {
      console.error("Error cerrando sesión:", error);
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white shadow-xl flex flex-col justify-between">
      
      <div>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white">HelpDesk</h1>
          <p className="text-sm text-gray-400 mt-1">Sistema de Gestión</p>
        </div>

        <nav className="mt-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-6 py-3 text-sm transition-colors
                  ${isActive(item.href) 
                    ? 'bg-gray-800 text-white border-l-4 border-blue-500' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}

          {/* Menú Configuración */}
          <div className="mt-4">
            <button
              onClick={() => setConfigOpen(!configOpen)}
              className={`
                w-full flex items-center justify-between px-6 py-3 text-sm transition-colors
                ${isConfigActive 
                  ? 'bg-gray-800 text-white' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5" />
                <span>Configuración</span>
              </div>
              {configOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {configOpen && (
              <div className="bg-gray-800/50 py-2">
                {configItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        flex items-center gap-3 px-12 py-2 text-sm transition-colors
                        ${isActive(item.href)
                          ? 'text-white bg-gray-700'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Footer con Logout y Versión */}
      <div className="p-6 space-y-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Salir
        </button>

        <p className="text-xs text-gray-500 text-center">v1.0.0</p>
      </div>

    </aside>
  );
}