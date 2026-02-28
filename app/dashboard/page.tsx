"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Package,
  ShoppingCart,
  Activity
} from "lucide-react";

export default function DashboardPage() {

  const [stats, setStats] = useState({
    usuarios: 0,
    productos: 0,
    servicios: 0,
    pedidos: 0
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/dashboard/stats", {
          credentials: "include"
        });

        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadStats();
  }, []);

  const cards = [
    {
      title: "Usuarios",
      value: stats.usuarios,
      icon: Users
    },
    {
      title: "Productos",
      value: stats.productos,
      icon: Package
    },
    {
      title: "Servicios",
      value: stats.servicios,
      icon: Activity
    },
    {
      title: "Pedidos",
      value: stats.pedidos,
      icon: ShoppingCart
    }
  ];

  return (
    <div className="space-y-8">

      <h1 className="text-3xl font-bold">
        Dashboard
      </h1>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="bg-white p-6 rounded-2xl shadow hover:shadow-xl transition"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-500 text-sm">
                    {card.title}
                  </p>

                  <h2 className="text-2xl font-bold mt-2">
                    {card.value}
                  </h2>
                </div>

                <div className="p-3 bg-black text-white rounded-xl">
                  <Icon size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}