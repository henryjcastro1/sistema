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
  LogOut
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

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) {
    return (
      <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-950 border-r border-gray-800 flex flex-col">
        <div className="p-6 space-y-3">
          <div className="h-10 w-10 bg-gray-800 rounded-lg animate-pulse"></div>
          <div className="h-4 w-32 bg-gray-800 rounded animate-pulse"></div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-950/95 backdrop-blur-xl border-r border-gray-800 flex flex-col justify-between">

      {/* HEADER */}
      <div>

        <div className="flex items-center gap-3 px-5 py-6">

          {/* LOGO */}
          <div className="h-11 w-11 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden">

            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={empresaConfig.nombre_empresa}
                width={32}
                height={32}
                className="object-contain"
              />
            ) : (
              <div className="text-white text-lg font-bold">
                {empresaConfig.nombre_empresa.charAt(0)}
              </div>
            )}

          </div>

          {/* NAME */}
          <div className="leading-tight">
            <p className="text-white font-semibold text-sm">
              {empresaConfig.nombre_empresa}
            </p>
            <p className="text-gray-400 text-xs">
              Sistema de Gestión
            </p>
          </div>

        </div>

        {/* MENU */}
        <nav className="mt-2 space-y-1">

          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 mx-3 px-4 py-2.5 rounded-lg text-sm
                  transition-all duration-200
                  ${
                    isActive(item.href)
                      ? "bg-white/10 text-white"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}

          {/* CONFIG */}
          <div className="mt-4">

            <button
              onClick={() => setConfigOpen(!configOpen)}
              className={`
                flex items-center justify-between w-full
                mx-3 px-4 py-2.5 rounded-lg text-sm transition
                ${
                  isConfigActive
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }
              `}
            >

              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4" />
                Configuración
              </div>

              {configOpen
                ? <ChevronDown className="w-4 h-4"/>
                : <ChevronRight className="w-4 h-4"/>}

            </button>

            {configOpen && (
              <div className="mt-1 space-y-1">

                {configItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        flex items-center gap-3 mx-6 px-4 py-2 rounded-md text-sm
                        transition-all
                        ${
                          isActive(item.href)
                            ? "text-white bg-white/10"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
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
      <div className="px-4 pb-6 space-y-3">

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg
          text-red-400 hover:bg-red-500/10 transition"
        >
          <LogOut className="w-4 h-4"/>
          Cerrar sesión
        </button>

        <p className="text-[11px] text-gray-500 text-center">
          HelpDesk v1.0
        </p>

      </div>

    </aside>
  );
}