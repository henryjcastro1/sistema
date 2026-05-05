// app/components/dashboard/Sidebar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Home,
  Users,
  Package,
  ShoppingCart,
  Shield,
  Settings,
  ChevronDown,
  ChevronRight,
  BarChart3,
  CreditCard,
  LogOut,
  Menu,
  X
} from "lucide-react";

interface EmpresaConfig {
  nombre_empresa: string;
  logo_url: string | null;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [configOpen, setConfigOpen] = useState(false);
  const [empresaConfig, setEmpresaConfig] = useState<EmpresaConfig>({
    nombre_empresa: "HelpDesk",
    logo_url: null
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Cargar configuración empresa
  const cargarConfiguracion = async () => {
    try {
      const res = await fetch("/api/config/empresas", {
        credentials: "include"
      });

      if (res.ok) {
        const data = await res.json();

        const nombre = data.nombre_empresa || "HelpDesk";
        const logo = data.logo_url || null;

        setEmpresaConfig({
          nombre_empresa: nombre,
          logo_url: logo
        });

        if (logo) {
          setLogoUrl(`${logo}?v=${Date.now()}`);
        }
      }
    } catch (error) {
      console.error("Error cargando configuración:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const menuItems = [
    { label: "Dashboard", href: "/dashboard", icon: Home },
    { label: "Usuarios", href: "/usuarios", icon: Users },
    { label: "Productos", href: "/productos", icon: Package },
    { label: "Pedidos", href: "/pedidos", icon: ShoppingCart },
    { label: "Servicios", href: "/servicios", icon: Shield },
    { label: "Pagos", href: "/pagos", icon: CreditCard }
  ];

  const configItems = [
    { label: "Empresa", href: "/config/empresa", icon: Settings },
    { label: "Monedas", href: "/config/monedas", icon: CreditCard },
    { label: "Auditoría", href: "/config/auditoria", icon: BarChart3 }
  ];

  const isActive = (href: string) => pathname === href;
  const isConfigActive = pathname.startsWith("/config");

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include"
      });

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Error cerrando sesión:", error);
    }
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const SidebarContent = () => (
    <div className="relative z-10 h-full flex flex-col justify-between bg-gray-950/30 backdrop-blur-md">
      {/* HEADER */}
      <div>
        <div className="flex items-center gap-4 px-6 py-8 border-b border-white/10">
          {/* LOGO */}
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm flex items-center justify-center overflow-hidden border border-white/20 shadow-lg">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={empresaConfig.nombre_empresa}
                width={40}
                height={40}
                className="object-contain"
              />
            ) : (
              <div className="text-white text-2xl font-bold">
                {empresaConfig.nombre_empresa.charAt(0)}
              </div>
            )}
          </div>

          {/* NAME */}
          <div className="leading-tight">
            <p className="text-white font-bold text-lg">
              {empresaConfig.nombre_empresa}
            </p>
            <p className="text-gray-300 text-xs">
              Sistema de Gestión
            </p>
          </div>
        </div>

        {/* MENU */}
        <nav className="mt-6 px-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileMenu}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                  transition-all duration-200 backdrop-blur-sm
                  ${
                    isActive(item.href)
                      ? "bg-gradient-to-r from-white/20 to-white/10 text-white shadow-lg border border-white/20"
                      : "text-gray-300 hover:text-white hover:bg-white/10"
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}

          {/* CONFIG */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <button
              onClick={() => setConfigOpen(!configOpen)}
              className={`
                flex items-center justify-between w-full
                px-4 py-3 rounded-xl text-sm font-medium transition backdrop-blur-sm
                ${
                  isConfigActive
                    ? "bg-gradient-to-r from-white/20 to-white/10 text-white shadow-lg border border-white/20"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                }
              `}
            >
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5" />
                Configuración
              </div>

              {configOpen
                ? <ChevronDown className="w-5 h-5" />
                : <ChevronRight className="w-5 h-5" />}
            </button>

            {configOpen && (
              <div className="mt-2 ml-8 space-y-1">
                {configItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMobileMenu}
                      className={`
                        flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm
                        transition-all backdrop-blur-sm
                        ${
                          isActive(item.href)
                            ? "text-white bg-white/20"
                            : "text-gray-300 hover:text-white hover:bg-white/10"
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

      {/* FOOTER */}
      <div className="px-4 pb-8 space-y-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl
          text-red-300 hover:bg-red-500/20 hover:text-red-200 transition backdrop-blur-sm font-medium"
        >
          <LogOut className="w-5 h-5" />
          Cerrar sesión
        </button>

        <p className="text-xs text-gray-400 text-center">
          HelpDesk v1.0
        </p>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="fixed left-0 top-0 h-screen w-64 bg-gray-950">
        <div className="p-6 space-y-3">
          <div className="h-14 w-14 bg-gray-800 rounded-xl animate-pulse"></div>
          <div className="h-4 w-40 bg-gray-800 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Botón de menú móvil */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 bg-black/80 backdrop-blur-md rounded-xl border border-white/20 shadow-lg"
      >
        {isMobileMenuOpen ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <Menu className="w-5 h-5 text-white" />
        )}
      </button>

      {/* Overlay para móvil */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar Desktop y Mobile */}
      <aside
        className={`
          fixed left-0 top-0 h-screen transition-all duration-300 ease-in-out z-40
          ${isMobileMenuOpen ? 'left-0' : '-left-full md:left-0'}
          w-64 md:w-64
        `}
      >
        {/* Fondo con imagen */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/menu.webp"
            alt="Menu Background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/70" />
        </div>

        <SidebarContent />
      </aside>
    </>
  );
}