// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Package,
  Activity,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle
} from "lucide-react";

// ================== TIPOS ==================
interface DashboardStats {
  usuarios: number;
  productos: number;
  servicios: number;
  pedidos: number;
  ventasTotales: number;
}

// ================== HELPERS ==================
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0
  }).format(value);
};

// ================== COMPONENT ==================
export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/dashboard/stats", {
          credentials: "include"
        });

        if (!res.ok) throw new Error("Error al cargar estadísticas");

        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  // ================== LOADING ==================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // ================== ERROR ==================
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" />
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  // ================== CARDS ==================
  const cards = [
    {
      title: "Usuarios",
      value: stats.usuarios,
      icon: Users,
      color: "bg-blue-500",
      change: "+12%",
      trend: "up"
    },
    {
      title: "Productos",
      value: stats.productos,
      icon: Package,
      color: "bg-green-500",
      change: "+5%",
      trend: "up"
    },
    {
      title: "Servicios",
      value: stats.servicios,
      icon: Activity,
      color: "bg-purple-500",
      change: "+8%",
      trend: "up"
    },
    {
      title: "Pedidos",
      value: stats.pedidos,
      icon: ShoppingCart,
      color: "bg-orange-500",
      change: "+15%",
      trend: "up"
    },
    {
      title: "Ventas Totales",
      value: formatCurrency(stats.ventasTotales),
      icon: DollarSign,
      color: "bg-emerald-500",
      change: "+23%",
      trend: "up"
    }
  ];

  return (
    <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Bienvenido al panel de control</p>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 border border-gray-100"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm">{card.title}</p>
                  <h2 className="text-2xl font-bold mt-2">{card.value}</h2>

                  <div className="flex items-center mt-2">
                    {card.trend === "up" ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-xs ml-1 text-green-600">
                      {card.change}
                    </span>
                  </div>
                </div>

                <div className={`p-3 ${card.color} rounded-xl`}>
                  <Icon size={22} className="text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}