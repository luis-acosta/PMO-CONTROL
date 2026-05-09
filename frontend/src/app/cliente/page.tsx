"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogOut, ShieldCheck, LayoutDashboard, CalendarDays, CheckCircle2, Clock, AlertCircle, TrendingUp } from "lucide-react";
import { Cronograma } from "@/components/Cronograma";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export default function ClienteDashboard() {
  const router = useRouter();
  const [empresa, setEmpresa] = useState<any>(null);
  const [mantenimientos, setMantenimientos] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async (empresaId: number) => {
    try {
      const uniqueSuffix = `?t=${Date.now()}`;
      const [empRes, mantRes] = await Promise.all([
        api.get(`/empresas${uniqueSuffix}`),
        api.get(`/mantenimientos${uniqueSuffix}`)
      ]);
      
      const myEmpresa = empRes.data.find((e: any) => e.id === empresaId);
      const myMantenimientos = mantRes.data.filter((m: any) => m.empresa_id === empresaId);
      
      setEmpresa(myEmpresa);
      setMantenimientos(myMantenimientos);
    } catch (e) {
      console.error("Error loading data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('pmo_user');
      const token = localStorage.getItem('pmo_token');
      
      if (!token || !storedUser) {
        router.push('/login');
        return;
      }

      const userData = JSON.parse(storedUser);
      if (userData.role !== 'CLIENTE') {
        router.push(userData.role === 'ADMIN' ? '/admin' : '/tecnico');
        return;
      }
      setUser(userData);
      loadData(userData.empresa_id);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('pmo_token');
    localStorage.removeItem('pmo_user');
    router.push('/login');
  };

  /* KPIs Calculations */
  const currentYear = new Date().getFullYear().toString();
  const mantenimientosAnio = useMemo(() => {
    return mantenimientos.filter(m => m.fecha_programada && m.fecha_programada.startsWith(currentYear));
  }, [mantenimientos]);

  const total = mantenimientosAnio.length;
  const ejecutados = mantenimientosAnio.filter(m => m.estado === "EJECUTADO").length;
  const pendientes = mantenimientosAnio.filter(m => m.estado === "PENDIENTE").length;
  const vencidos = mantenimientosAnio.filter(m => m.estado === "VENCIDO").length;
  const cumplimientoPercentage = total > 0 ? Math.round((ejecutados / total) * 100) : 0;

  const pieData = [
    { name: 'Ejecutados', value: ejecutados, color: '#10b981' },
    { name: 'Restantes', value: total - ejecutados, color: '#1e293b' },
  ];

  const upcomingTasks = useMemo(() => {
    return mantenimientosAnio
      .filter(m => m.estado === "PENDIENTE")
      .sort((a, b) => new Date(a.fecha_programada).getTime() - new Date(b.fecha_programada).getTime())
      .slice(0, 5);
  }, [mantenimientosAnio]);

  const overdueTasks = useMemo(() => {
    return mantenimientosAnio
      .filter(m => m.estado === "VENCIDO")
      .sort((a, b) => new Date(b.fecha_programada).getTime() - new Date(a.fecha_programada).getTime())
      .slice(0, 5);
  }, [mantenimientosAnio]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-800 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <img src="/logo.png" alt="PDI Advanced Logo" className="h-12 object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Portal del Cliente</h1>
              <p className="text-slate-400 flex items-center gap-2">
                <span className="text-blue-400 font-semibold">{empresa?.nombre}</span>
                <span className="text-slate-600">|</span>
                <span>Bienvenido, {user?.username}</span>
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-400/50 hover:bg-red-400/5 transition-all"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" /> Cerrar Sesión
          </Button>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm overflow-hidden group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="relative w-16 h-16 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={22} outerRadius={30} paddingAngle={0} dataKey="value" stroke="none">
                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">{cumplimientoPercentage}%</div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cumplimiento</p>
                <p className="text-2xl font-bold text-white">Anual</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardContent className="p-6 flex flex-col justify-center relative overflow-hidden">
              <div className="absolute -right-2 -bottom-2 opacity-5">
                <TrendingUp className="h-24 w-24 text-blue-500" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mantenimientos</p>
              <h3 className="text-3xl font-bold text-white mt-1">{total}</h3>
              <p className="text-[10px] text-slate-400 mt-1 italic">Programados para {currentYear}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm border-l-4 border-l-emerald-500">
            <CardContent className="p-6">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ejecutados</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-emerald-500 mt-1">{ejecutados}</h3>
                <CheckCircle2 className="h-4 w-4 text-emerald-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm border-l-4 border-l-yellow-500">
            <CardContent className="p-6">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pendientes</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-yellow-500 mt-1">{pendientes}</h3>
                <Clock className="h-4 w-4 text-yellow-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vencidos</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-red-500 mt-1">{vencidos}</h3>
                <AlertCircle className="h-4 w-4 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cronograma Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Cronograma de Mantenimiento Anual</h2>
          </div>
          <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-xl overflow-hidden shadow-2xl">
            <Cronograma empresas={[empresa]} mantenimientos={mantenimientos} />
          </Card>
        </div>

        {/* Alert Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-800 pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-yellow-500 uppercase tracking-widest">
                <Clock className="h-4 w-4" /> Próximos Mantenimientos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-800">
                {upcomingTasks.length > 0 ? upcomingTasks.map(m => (
                  <div key={m.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                    <div>
                      <p className="text-sm font-bold text-white">{m.fecha_programada}</p>
                      <p className="text-xs text-slate-400">Técnico: {m.tecnico || "Pendiente asignar"}</p>
                    </div>
                    <Badge variant="outline" className="text-yellow-500 border-yellow-500/20 bg-yellow-500/5">PENDIENTE</Badge>
                  </div>
                )) : (
                  <div className="p-8 text-center text-slate-500 text-sm italic">Sin mantenimientos próximos.</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-800 pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-red-500 uppercase tracking-widest">
                <AlertCircle className="h-4 w-4" /> Mantenimientos Vencidos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-800">
                {overdueTasks.length > 0 ? overdueTasks.map(m => (
                  <div key={m.id} className="p-4 flex items-center justify-between hover:bg-red-500/5 transition-colors">
                    <div>
                      <p className="text-sm font-bold text-red-400">{m.fecha_programada}</p>
                      <p className="text-xs text-slate-400">Requiere atención inmediata</p>
                    </div>
                    <Badge variant="outline" className="text-red-500 border-red-500/20 bg-red-500/5">VENCIDO</Badge>
                  </div>
                )) : (
                  <div className="p-8 text-center text-slate-500 text-sm italic">No hay mantenimientos vencidos.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <footer className="pt-8 text-center">
          <p className="text-slate-600 text-[10px] uppercase font-bold tracking-widest">
            &copy; 2026 PMO Control - Sistema de Gestión de Activos
          </p>
        </footer>

      </div>
    </div>
  );
}
