"use client";

import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Trash2, Edit, AlertTriangle, CheckCircle2, Clock, Info, UserPlus, AlertCircle, Settings, Pencil } from "lucide-react";
import { Cronograma } from "@/components/Cronograma";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, YAxis, Legend } from "recharts";
import { parseISO, isPast } from "date-fns";

export default function AdminDashboard() {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [mantenimientos, setMantenimientos] = useState<any[]>([]);
  const [tecnicos, setTecnicos] = useState<any[]>([]);
  
  const [openAdd, setOpenAdd] = useState(false);
  const [openAddTecnico, setOpenAddTecnico] = useState(false);
  const [openDelete, setOpenDelete] = useState<number | null>(null);
  const [openDeleteTecnico, setOpenDeleteTecnico] = useState<number | null>(null);
  const [editEmpresa, setEditEmpresa] = useState<any>(null);
  const [editTecnico, setEditTecnico] = useState<any>(null);
  const [editMantenimiento, setEditMantenimiento] = useState<any>(null);

  const getDayName = (dateStr: string) => {
    if (!dateStr) return "-";
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return days[date.getDay()];
  };
  
  const [formData, setFormData] = useState({ nombre: "", fecha_inicio: "", frecuencia_meses: "1", dia_semana: "6", base_tecnico: "" });
  const [tecData, setTecData] = useState({ nombre: "", especialidad: "" });
  const [saving, setSaving] = useState(false);
  
  const [filtroMants, setFiltroMants] = useState<"TODOS"|"PENDIENTE"|"EJECUTADO"|"VENCIDO">("TODOS");
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>("TODAS");

  const loadData = async () => {
    try {
      const uniqueSuffix = `?t=${Date.now()}`;
      const [empRes, mantRes, tecRes] = await Promise.all([
        api.get(`/empresas${uniqueSuffix}`),
        api.get(`/mantenimientos${uniqueSuffix}`),
        api.get(`/tecnicos${uniqueSuffix}`).catch(() => ({ data: [] }))
      ]);
      setEmpresas(empRes.data);
      setMantenimientos(mantRes.data);
      setTecnicos(tecRes.data);
    } catch (e) {
      console.error("Error loading data", e);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreateEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/empresas", formData);
      setOpenAdd(false);
      setFormData({ nombre: "", fecha_inicio: "", frecuencia_meses: "1", dia_semana: "6", base_tecnico: "" });
      loadData();
    } catch (err: any) {
      alert("Error al crear empresa: " + (err.response?.data?.error || err.message));
    } finally { setSaving(false); }
  };

  const handleCreateTecnico = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/tecnicos", tecData);
      setOpenAddTecnico(false);
      setTecData({ nombre: "", especialidad: "" });
      loadData();
    } catch (err: any) { alert("Error al registrar técnico"); }
  };

  const handleDeleteEmpresa = async (id: number) => {
    try {
      await api.delete(`/empresas/${id}`);
      setOpenDelete(null);
      loadData(); 
    } catch (err: any) { alert("Error al eliminar"); }
  };

  const handleUpdateEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/empresas/${editEmpresa.id}`, editEmpresa);
      setEditEmpresa(null);
      loadData();
    } catch { alert("Error al editar empresa"); }
  };

  const handleUpdateTecnico = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/tecnicos/${editTecnico.id}`, editTecnico);
      setEditTecnico(null);
      loadData();
    } catch { alert("Error al editar técnico"); }
  };

  const handleDeleteTecnico = async (id: number) => {
    try {
      await api.delete(`/tecnicos/${id}`);
      setOpenDeleteTecnico(null);
      loadData();
    } catch (err: any) { alert("Error al eliminar"); }
  };

  const handleUpdateMantenimiento = async (e: any) => {
     e.preventDefault();
     if (!editMantenimiento) return;

     const empresaRel = empresas.find(ep => ep.id === editMantenimiento.empresa_id);
     if (empresaRel && editMantenimiento.fecha_programada < empresaRel.fecha_inicio) {
        alert(`No se puede programar antes de la fecha de inicio de la empresa (${empresaRel.fecha_inicio})`);
        return;
     }

     try {
       await api.put(`/mantenimientos/${editMantenimiento.id}`, editMantenimiento);
       setEditMantenimiento(null);
       loadData();
     } catch { alert("Error al actualizar mantenimiento"); }
  };

  /* KPIs Calculations */
  const total = mantenimientos.length;
  const ejecutados = mantenimientos.filter(m => m.estado === "EJECUTADO").length;
  const pendientes = mantenimientos.filter(m => m.estado === "PENDIENTE").length;
  const vencidos = mantenimientos.filter(m => m.estado === "VENCIDO").length;
  const cumplimientoPercentage = total > 0 ? Math.round((ejecutados / total) * 100) : 0;

  const pieData = [
    { name: 'Ejecutados', value: ejecutados, color: '#22c55e' },
    { name: 'Restantes', value: total - ejecutados, color: '#1e293b' },
  ];

  const chartData = useMemo(() => {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const workload = new Array(12).fill(0);
    const executed = new Array(12).fill(0);
    mantenimientos.forEach(m => {
        if (!m.fecha_programada) return;
        const monthNum = parseISO(m.fecha_programada).getMonth();
        workload[monthNum] += 1;
        if (m.estado === "EJECUTADO") executed[monthNum] += 1;
    });
    return months.map((m, i) => ({
      name: m, total: workload[i], cumplimiento: workload[i] > 0 ? Math.round((executed[i] / workload[i]) * 100) : 0
    }));
  }, [mantenimientos]);

  const empresasList = useMemo(() => {
    const conteo: Record<string, number> = {};
    mantenimientos.forEach(m => {
       const key = m.Empresa?.nombre || 'Desconocida';
       conteo[key] = (conteo[key] || 0) + 1;
    });
    return Object.entries(conteo).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
  }, [mantenimientos]);

  const mantenimientosFiltrados = useMemo(() => {
    return mantenimientos.filter(m => {
      const matchEstado = filtroMants === "TODOS" || m.estado === filtroMants;
      const mEmpId = m.empresa_id ? String(m.empresa_id) : "null";
      const matchEmpresa = filtroEmpresa === "TODAS" || mEmpId === filtroEmpresa;
      return matchEstado && matchEmpresa;
    });
  }, [mantenimientos, filtroMants, filtroEmpresa]);

  const vencidosList = useMemo(() => {
    return mantenimientos.filter(m => m.estado === "VENCIDO")
      .sort((a,b) => new Date(b.fecha_programada).getTime() - new Date(a.fecha_programada).getTime())
      .slice(0, 2);
  }, [mantenimientos]);

  const proximosList = useMemo(() => {
     return mantenimientos.filter(m => m.estado === "PENDIENTE")
      .sort((a,b) => new Date(a.fecha_programada).getTime() - new Date(b.fecha_programada).getTime())
      .slice(0, 2);
  }, [mantenimientos]);

  const statusPieData = useMemo(() => [
    { name: 'Ejecutados', value: ejecutados, color: '#10b981' },
    { name: 'Pendientes', value: pendientes, color: '#f59e0b' },
    { name: 'Vencidos', value: vencidos, color: '#ef4444' }
  ].filter(d => d.value > 0), [ejecutados, pendientes, vencidos]);

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-[1400px]">
      <div className="flex flex-col items-center justify-center text-center space-y-2 mb-6 bg-white p-6 rounded-2xl shadow-xl border border-slate-200">
        <h2 className="text-3xl font-extrabold tracking-tight text-black flex items-center gap-2">
          <span className="p-2 bg-blue-600 rounded-md shadow-lg"><Settings className="h-6 w-6 text-white" /></span>
          PMO Maintenance Admin
        </h2>
        <div className="h-1 w-24 bg-blue-600 rounded-full"></div>
        <p className="text-slate-600 font-medium text-sm">Panel de Control & Gestión de Activos</p>
      </div>



      <Tabs defaultValue="dashboard" className="space-y-6 border-none flex flex-col items-center">
        <TabsList className="bg-[#1E293B] border border-slate-700 h-11 p-1 inline-flex mx-auto">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6">Dashboard KPI</TabsTrigger>
          <TabsTrigger value="administracion" className="data-[state=active]:bg-sky-600 data-[state=active]:text-white px-6">Administración & Recursos</TabsTrigger>
          <TabsTrigger value="cronograma" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white px-6">Visión Gantt Anual</TabsTrigger>
        </TabsList>
        
        {/* TAB: DASHBOARD */}
        <TabsContent value="dashboard" className="w-full space-y-4 outline-none border-none mt-2 animate-in fade-in slide-in-from-bottom-2">
          {/* TOP KPIs */}
          <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-5">
            <Card className="bg-[#1E293B] border-slate-700 relative overflow-hidden flex items-center p-4">
               <div className="w-[80px] h-[80px] mr-4 relative">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} innerRadius={25} outerRadius={35} paddingAngle={0} dataKey="value" stroke="none">
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white z-10">{cumplimientoPercentage}%</div>
               </div>
               <div><p className="text-sm font-medium text-slate-300">Cumplimiento</p></div>
            </Card>
            <Card className="bg-[#1E293B] border-slate-700 p-4 flex flex-col justify-center">
              <p className="text-sm font-medium text-slate-300 mb-2">Total Mantenimientos</p>
              <h3 className="text-4xl font-light text-white">{total}</h3>
            </Card>
            <Card className="bg-[#1E293B] border-slate-700 p-4 flex flex-col justify-center relative">
              <p className="text-sm font-medium text-slate-300 mb-2">Ejecutados</p>
              <h3 className="text-4xl font-light text-white">{ejecutados}</h3>
              <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 text-emerald-500 opacity-20" />
            </Card>
            <Card className="bg-[#1E293B] border-slate-700 p-4 flex flex-col justify-center relative">
              <p className="text-sm font-medium text-slate-300 mb-2">Pendientes</p>
              <h3 className="text-4xl font-light text-white">{pendientes}</h3>
              <Clock className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 text-yellow-500 opacity-20" />
            </Card>
            <Card className="bg-[#1E293B] border-slate-700 p-4 flex flex-col justify-center relative">
              <p className="text-sm font-medium text-slate-300 mb-2">Vencidos</p>
              <h3 className="text-4xl font-light text-red-500 flex items-end">
                {vencidos}<div className="h-1 bg-red-500 w-12 rounded-sm mb-1.5 ml-2"></div>
              </h3>
            </Card>
          </div>
          {/* MIDDLE CHARTS ROW */}
          <div className="grid gap-4 md:grid-cols-3">
             <Card className="bg-[#1E293B] border-slate-700 col-span-1 border-t-0 border-l-0 shadow-lg">
               <CardHeader className="pb-0"><CardTitle className="text-sm font-medium text-slate-300">Cumplimiento Mensual</CardTitle></CardHeader>
               <CardContent className="h-[200px] mt-4">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                     <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} stroke="#64748B" />
                     <YAxis fontSize={11} tickFormatter={(tick) => `${tick}%`} tickLine={false} axisLine={false} stroke="#64748B" domain={[0, 100]} />
                     <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#0F172A', borderColor: '#334155', color: '#E2E8F0', fontSize: '12px'}} formatter={(value) => [`${value}%`]} />
                     <Bar dataKey="cumplimiento" radius={[2, 2, 0, 0]}>
                       {chartData.map((e, i) => <Cell key={i} fill={e.cumplimiento > 70 ? '#22c55e' : e.cumplimiento > 0 ? '#94a3b8' : '#334155'} />)}
                     </Bar>
                   </BarChart>
                 </ResponsiveContainer>
               </CardContent>
             </Card>
             <Card className="bg-[#1E293B] border-slate-700 col-span-1 shadow-lg">
               <CardHeader className="pb-0"><CardTitle className="text-sm font-medium text-slate-300">Carga de Trabajo</CardTitle></CardHeader>
               <CardContent className="h-[200px] mt-4">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={chartData.filter(d => d.total > 0)} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                     <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} stroke="#64748B" />
                     <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#64748B" allowDecimals={false} />
                     <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#0F172A', borderColor: '#334155', color: '#E2E8F0', fontSize: '12px'}} />
                     <Bar dataKey="total" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                   </BarChart>
                 </ResponsiveContainer>
               </CardContent>
             </Card>
             <Card className="bg-[#1E293B] border-slate-700 col-span-1 p-0 flex flex-col shadow-lg">
                <div className="p-4 border-b border-slate-700/50"><CardTitle className="text-sm font-medium text-slate-300">Mantenimientos por Empresa</CardTitle></div>
                <div className="p-0 flex-1 overflow-y-auto max-h-[200px]">
                   <ul className="divide-y divide-slate-700/50">
                     {empresasList.map((e, idx) => (
                       <li key={idx} className="flex justify-between items-center p-3 text-sm hover:bg-slate-800 transition">
                         <span className="text-slate-300 font-medium truncate max-w-[70%]">{e.name}</span>
                         <span className="text-white text-lg font-light">{e.count}</span>
                       </li>))}
                     {empresasList.length === 0 && <li className="p-4 text-center text-sm text-slate-200">Sin datos registrados</li>}
                   </ul>
                </div>
             </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-4">
            {/* PANEL DE ALERTAS - Estilo Foto */}
            <Card className="bg-[#1E293B] border-slate-700 p-6 flex flex-col shadow-2xl">
               <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-2">
                 <h3 className="text-white font-bold text-lg flex items-center gap-2">
                   <AlertCircle className="h-5 w-5 text-red-500" /> Alertas
                 </h3>
               </div>
               
               <div className="space-y-4">
                  {/* Bloque Vencidos */}
                  <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                    <div className="flex items-center gap-2 text-slate-300 font-semibold mb-2 text-sm">
                       <span className="bg-red-500 text-white p-0.5 rounded-full"><AlertCircle className="h-3 w-3" /></span>
                       Mantenimientos Vencidos
                    </div>
                    <div className="space-y-1">
                      {vencidosList.length > 0 ? vencidosList.map(m => (
                        <div key={m.id} className="flex justify-between items-center text-xs p-2 border-t border-slate-800/50">
                          <span className="text-slate-400 font-mono">{m.fecha_programada}</span>
                          <span className="text-white font-medium truncate ml-4">{m.Empresa?.nombre}</span>
                        </div>
                      )) : <p className="text-slate-500 text-xs italic p-1">No hay alertas críticas.</p>}
                    </div>
                  </div>

                  {/* Bloque Próximos */}
                  <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                    <div className="flex items-center gap-2 text-slate-300 font-semibold mb-2 text-sm">
                       <span className="bg-yellow-500 text-white p-0.5 rounded-full"><Clock className="h-3 w-3" /></span>
                       Próximos Mantenimientos
                    </div>
                    <div className="space-y-1">
                      {proximosList.length > 0 ? proximosList.map(m => (
                        <div key={m.id} className="flex justify-between items-center text-xs p-2 border-t border-slate-800/50">
                          <span className="text-slate-400 font-mono">{m.fecha_programada}</span>
                          <span className="text-white font-medium truncate ml-4">{m.Empresa?.nombre}</span>
                        </div>
                      )) : <p className="text-slate-500 text-xs italic p-1">Sin mantenimientos próximos.</p>}
                    </div>
                  </div>
               </div>
            </Card>

            {/* GRÁFICO DE TORTA - Estilo Foto */}
            <Card className="bg-[#1E293B] border-slate-700 p-6 flex flex-col shadow-2xl overflow-hidden">
               <div className="flex items-center justify-between mb-2">
                 <h3 className="text-white font-bold text-lg">Distribución de Estados</h3>
               </div>
               <div className="flex-1 min-h-[250px] relative mt-2">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={85}
                        paddingAngle={8}
                        dataKey="value"
                        labelLine={false}
                        label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""}
                        stroke="none"
                      >
                        {statusPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: 'drop-shadow(0px 4px 4px rgba(0,0,0,0.25))' }} />
                        ))}
                      </Pie>
                      <Tooltip 
                         contentStyle={{backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                         itemStyle={{color: '#fff', fontSize: '13px', fontWeight: 'bold'}}
                      />
                      <Legend 
                        layout="horizontal" 
                        align="center" 
                        verticalAlign="bottom" 
                        iconType="circle"
                        formatter={(value) => <span className="text-slate-200 text-xs font-semibold px-2">{value}</span>}
                      />
                    </PieChart>
                 </ResponsiveContainer>
                 {/* Center Label (Optional Premium Touch) */}
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-tighter">Total</span>
                    <span className="text-2xl font-light text-white leading-none">{total}</span>
                 </div>
               </div>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: ADMINISTRACION & CARDS */}
        <TabsContent value="administracion" className="w-full space-y-6 outline-none border-none mt-6 animate-in fade-in slide-in-from-bottom-2">
           <div className="flex justify-center gap-3">
             <Dialog open={openAddTecnico} onOpenChange={setOpenAddTecnico}>
              <DialogTrigger render={<Button variant="outline" className="border-sky-600 text-sky-500 hover:bg-sky-900/40"><UserPlus className="mr-2 h-4 w-4" /> Registrar Técnico</Button>} />
             <DialogContent className="border-slate-700 bg-[#1E293B]">
                 <DialogHeader><DialogTitle className="text-sky-400">Nuevo Técnico Asignable</DialogTitle></DialogHeader>
                 <form onSubmit={handleCreateTecnico} className="space-y-4">
                   <Input placeholder="Nombre Completo" required value={tecData.nombre} onChange={e => setTecData({ ...tecData, nombre: e.target.value })} className="bg-slate-900/50 border-slate-700 text-white" />
                   <Input placeholder="Especialidad Técnica" value={tecData.especialidad} onChange={e => setTecData({ ...tecData, especialidad: e.target.value })} className="bg-slate-900/50 border-slate-700 text-white" />
                   <Button type="submit" className="bg-sky-600 hover:bg-sky-700 w-full">Guardar Técnico</Button>
                 </form>
               </DialogContent>
             </Dialog>

             <Dialog open={openAdd} onOpenChange={setOpenAdd}>
                <DialogTrigger render={<Button className="bg-blue-600 hover:bg-blue-700 text-white"><PlusCircle className="mr-2 h-4 w-4" /> Programar Mantenimiento</Button>} />
               <DialogContent className="sm:max-w-xl bg-[#1E293B] border-slate-700 text-white">
                 <DialogHeader><DialogTitle>Registrar Empresa</DialogTitle></DialogHeader>
                 <form onSubmit={handleCreateEmpresa} className="space-y-4 py-4 text-slate-200">
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2 col-span-2">
                       <Label>Nombre de Entidad</Label>
                       <Input required value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="bg-slate-900/50 border-slate-700" />
                     </div>
                     <div className="space-y-2">
                       <Label>Fecha Inicio</Label>
                       <Input type="date" required value={formData.fecha_inicio} onChange={(e) => {
                          const newDate = e.target.value;
                          let newDia = formData.dia_semana;
                          if (newDate) {
                            const [y, m, d] = newDate.split('-').map(Number);
                            newDia = String(new Date(y, m - 1, d).getDay());
                          }
                          setFormData({ ...formData, fecha_inicio: newDate, dia_semana: newDia });
                        }} className="bg-slate-900/50 border-slate-700" />
                     </div>
                     <div className="space-y-2">
                       <Label>Frecuencia de Meses</Label>
                       <Select value={formData.frecuencia_meses} onValueChange={(val) => setFormData({ ...formData, frecuencia_meses: val || "1" })} required>
                         <SelectTrigger className="bg-slate-900/50 border-slate-700"><SelectValue placeholder="Meses" /></SelectTrigger>
                         <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                           {Array.from({ length: 12 }, (_, i) => i + 1).map(num => <SelectItem key={num} value={String(num)}>Cada {num} mes{num>1?'es':''}</SelectItem>)}
                         </SelectContent>
                       </Select>
                     </div>
                     <div className="space-y-2">
                       <Label>Día a Ejecutar</Label>
                       <div className="bg-slate-800/50 border border-slate-700 rounded-md h-10 flex items-center px-3 text-slate-300 text-sm">{getDayName(formData.fecha_inicio)}</div>
                     </div>
                     <div className="space-y-2">
                       <Label>Técnico Default (Opcional)</Label>
                       <Select value={formData.base_tecnico} onValueChange={(val) => setFormData({ ...formData, base_tecnico: val || "" })}>
                         <SelectTrigger className="bg-slate-900/50 border-slate-700"><SelectValue placeholder="Asignar luego..." /></SelectTrigger>
                         <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                           <SelectItem value="none">Sin asignación predeterminada</SelectItem>
                           {tecnicos.map(t => <SelectItem key={t.id} value={t.nombre}>{t.nombre}</SelectItem>)}
                         </SelectContent>
                       </Select>
                     </div>
                   </div>
                   <DialogFooter><Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">{saving ? 'Procesando...' : 'Crear y Agendar'}</Button></DialogFooter>
                 </form>
               </DialogContent>
             </Dialog>
           </div>
           
           <Card className="bg-[#1E293B] border-slate-700">
             <CardHeader className="pb-3 border-b border-slate-700/50">
               <CardTitle className="text-white text-lg text-center">Directorio de Entidades</CardTitle>
             </CardHeader>
             <CardContent className="p-0 overflow-x-auto">
               <Table>
                 <TableHeader className="bg-slate-900/40">
                   <TableRow className="border-slate-700/50">
                     <TableHead className="text-slate-300">Entidad</TableHead>
                     <TableHead className="text-slate-300">1er Mantenimiento</TableHead>
                     <TableHead className="text-slate-300">Frecuencia</TableHead>
                     <TableHead className="text-right text-slate-300">Acciones</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {empresas.map((emp: any) => {
                     const mantsEmp = mantenimientos.filter(m => String(m.empresa_id) === String(emp.id)).sort((a,b) => new Date(a.fecha_programada).getTime() - new Date(b.fecha_programada).getTime());
                     const primerMant = mantsEmp.length > 0 ? mantsEmp[0].fecha_programada : "-";
                     return (
                      <TableRow key={emp.id} className="border-slate-700/50 hover:bg-slate-800/50">
                        <TableCell className="font-semibold text-white">{emp.nombre}</TableCell>
                        <TableCell className="text-slate-300">{primerMant}</TableCell>
                        <TableCell className="text-slate-300">Cada {emp.frecuencia_meses} meses</TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-sky-500 hover:text-sky-400 hover:bg-sky-500/20" onClick={() => setEditEmpresa(emp)}><Edit className="h-4 w-4" /></Button>
                            <Dialog open={openDelete === emp.id} onOpenChange={(open) => !open && setOpenDelete(null)}>
                              <DialogTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/20" onClick={() => setOpenDelete(emp.id)}><Trash2 className="h-4 w-4" /></Button>} />
                              <DialogContent className="bg-[#1E293B] border-slate-700 text-white">
                                <DialogHeader><DialogTitle className="text-red-500 flex items-center gap-2"><AlertTriangle/> Borrar "{emp.nombre}"</DialogTitle></DialogHeader>
                                <p className="text-slate-300 font-sm">Se borrará en cascada todo el año planificado.</p>
                                <DialogFooter><Button variant="destructive" onClick={() => handleDeleteEmpresa(emp.id)}>Confirmar Borrado</Button></DialogFooter>
                              </DialogContent>
                            </Dialog>
                        </TableCell>
                      </TableRow>
                   )})}
                 </TableBody>
               </Table>
             </CardContent>
           </Card>

           {/* VISTA DIRECTORIO DE TÉCNICOS */}
           <Card className="bg-[#1E293B] border-slate-700 mt-6">
             <CardHeader className="pb-3 border-b border-slate-700/50">
               <CardTitle className="text-white text-lg flex items-center gap-2"><UserPlus className="h-5 w-5 text-sky-500" /> Directorio de Técnicos</CardTitle>
             </CardHeader>
             <CardContent className="p-0 overflow-x-auto">
               <Table>
                 <TableHeader className="bg-slate-900/40">
                   <TableRow className="border-slate-700/50">
                     <TableHead className="text-slate-300">ID Técnico</TableHead>
                     <TableHead className="text-slate-300">Nombre Completo</TableHead>
                     <TableHead className="text-slate-300">Especialidad</TableHead>
                     <TableHead className="text-right text-slate-300">Acciones</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {tecnicos.map((tec: any) => (
                      <TableRow key={tec.id} className="border-slate-700/50 hover:bg-slate-800/50">
                        <TableCell className="text-slate-200 text-xs">TEC-{tec.id}</TableCell>
                        <TableCell className="font-semibold text-white">{tec.nombre}</TableCell>
                        <TableCell className="text-slate-300">{tec.especialidad || "-"}</TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-sky-500 hover:text-sky-400 hover:bg-sky-500/20" onClick={() => setEditTecnico(tec)}><Edit className="h-4 w-4" /></Button>
                            <Dialog open={openDeleteTecnico === tec.id} onOpenChange={(open) => !open && setOpenDeleteTecnico(null)}>
                              <DialogTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/20" onClick={() => setOpenDeleteTecnico(tec.id)}><Trash2 className="h-4 w-4" /></Button>} />
                              <DialogContent className="bg-[#1E293B] border-slate-700 text-white">
                                <DialogHeader><DialogTitle className="text-red-500 flex items-center gap-2"><AlertTriangle/> Borrar "{tec.nombre}"</DialogTitle></DialogHeader>
                                <p className="text-slate-300 font-sm">Se borrará permanentemente el registro del técnico. Podría afectar históricos si ya existen.</p>
                                <DialogFooter><Button variant="destructive" onClick={() => handleDeleteTecnico(tec.id)}>Confirmar Borrado</Button></DialogFooter>
                              </DialogContent>
                            </Dialog>
                        </TableCell>
                      </TableRow>
                   ))}
                   {tecnicos.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="py-8 text-center text-slate-200">No hay técnicos registrados.</TableCell>
                      </TableRow>
                   )}
                 </TableBody>
               </Table>
             </CardContent>
           </Card>

           {/* EDIT EMPRESA MODAL */}
           <Dialog open={!!editEmpresa} onOpenChange={(open) => !open && setEditEmpresa(null)}>
             <DialogContent className="bg-[#1E293B] border-slate-700 text-white">
               <DialogHeader><DialogTitle>Editar Empresa</DialogTitle></DialogHeader>
               {editEmpresa && (
                 <form onSubmit={handleUpdateEmpresa} className="space-y-4 py-4 text-slate-200">
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2 col-span-2">
                       <Label>Nombre de Entidad</Label>
                       <Input required value={editEmpresa.nombre || ""} onChange={(e) => setEditEmpresa({ ...editEmpresa, nombre: e.target.value })} className="bg-slate-900/50 border-slate-700" />
                     </div>
                     <div className="space-y-2">
                       <Label>Fecha Inicio</Label>
                       <Input type="date" required value={editEmpresa.fecha_inicio || ""} 
                         onChange={(e) => {
                           const newDate = e.target.value;
                           let newDia = editEmpresa.dia_semana;
                           if (newDate) {
                             const [y, m, d] = newDate.split('-').map(Number);
                             newDia = String(new Date(y, m - 1, d).getDay());
                           }
                           setEditEmpresa({ ...editEmpresa, fecha_inicio: newDate, dia_semana: newDia });
                         }} 
                         className="bg-slate-900/50 border-slate-700" 
                       />
                     </div>
                     <div className="space-y-2">
                       <Label>Frecuencia de Meses</Label>
                       <Select value={String(editEmpresa.frecuencia_meses || "1")} onValueChange={(val) => setEditEmpresa({ ...editEmpresa, frecuencia_meses: val || "1" })} required>
                         <SelectTrigger className="bg-slate-900/50 border-slate-700"><SelectValue placeholder="Meses" /></SelectTrigger>
                         <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                           {Array.from({ length: 12 }, (_, i) => i + 1).map(num => <SelectItem key={num} value={String(num)}>Cada {num} mes{num>1?'es':''}</SelectItem>)}
                         </SelectContent>
                       </Select>
                     </div>
                     <div className="space-y-2">
                       <Label>Día a Ejecutar</Label>
                       <div className="bg-slate-800/50 border border-slate-700 rounded-md h-10 flex items-center px-3 text-slate-300 text-sm">
                         {getDayName(editEmpresa.fecha_inicio)}
                       </div>
                     </div>
                     <div className="space-y-2 col-span-2">
                       <Label>Técnico Default</Label>
                        <Select value={editEmpresa.base_tecnico || "none"} onValueChange={(val) => setEditEmpresa({ ...editEmpresa, base_tecnico: val === "none" ? "" : val })}>
                          <SelectTrigger className="bg-slate-900/50 border-slate-700"><SelectValue placeholder="Asignar luego..." /></SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                            <SelectItem value="none">Sin asignación predeterminada</SelectItem>
                            {tecnicos.map((t: any) => <SelectItem key={t.id} value={t.nombre}>{t.nombre}</SelectItem>)}
                          </SelectContent>
                        </Select>
                     </div>
                   </div>
                   <DialogFooter><Button type="submit" className="bg-blue-600 hover:bg-blue-700">Actualizar Matriz</Button></DialogFooter>
                 </form>
               )}
             </DialogContent>
           </Dialog>

           {/* EDIT TECNICO MODAL */}
           <Dialog open={!!editTecnico} onOpenChange={(open) => !open && setEditTecnico(null)}>
             <DialogContent className="bg-[#1E293B] border-slate-700 text-white">
               <DialogHeader><DialogTitle>Editar Técnico</DialogTitle></DialogHeader>
               {editTecnico && (
                 <form onSubmit={handleUpdateTecnico} className="space-y-4 py-4 text-slate-200">
                   <div className="space-y-2">
                     <Label>Nombre Completo</Label>
                     <Input required value={editTecnico.nombre} onChange={(e) => setEditTecnico({ ...editTecnico, nombre: e.target.value })} className="bg-slate-900/50 border-slate-700" />
                   </div>
                   <div className="space-y-2">
                     <Label>Especialidad</Label>
                     <Input required value={editTecnico.especialidad} onChange={(e) => setEditTecnico({ ...editTecnico, especialidad: e.target.value })} className="bg-slate-900/50 border-slate-700" />
                   </div>
                   <DialogFooter><Button type="submit" className="bg-sky-600 hover:bg-sky-700">Actualizar Técnico</Button></DialogFooter>
                 </form>
               )}
             </DialogContent>
           </Dialog>

           {/* EDIT MANTENIMIENTO MODAL */}
           <Dialog open={!!editMantenimiento} onOpenChange={(open) => !open && setEditMantenimiento(null)}>
             <DialogContent className="bg-[#1E293B] border-slate-700 text-white">
               <DialogHeader><DialogTitle>Editar Mantenimiento</DialogTitle></DialogHeader>
               {editMantenimiento && (
                 <form onSubmit={handleUpdateMantenimiento} className="space-y-4 py-4 text-slate-200">
                   <div className="space-y-2">
                     <Label>Fecha Programada</Label>
                     <Input type="date" required value={editMantenimiento.fecha_programada} onChange={(e) => setEditMantenimiento({ ...editMantenimiento, fecha_programada: e.target.value })} className="bg-slate-900/50 border-slate-700" />
                   </div>
                   <div className="space-y-2">
                     <Label>Estado</Label>
                     <Select value={editMantenimiento.estado} onValueChange={(val) => setEditMantenimiento({ ...editMantenimiento, estado: val })}>
                       <SelectTrigger className="bg-slate-900/50 border-slate-700"><SelectValue /></SelectTrigger>
                       <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                         <SelectItem value="PENDIENTE">PENDIENTE</SelectItem>
                         <SelectItem value="EJECUTADO">EJECUTADO</SelectItem>
                         <SelectItem value="VENCIDO">VENCIDO</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                   <div className="space-y-2">
                     <Label>Técnico</Label>
                     <Select value={editMantenimiento.tecnico || ""} onValueChange={(val) => setEditMantenimiento({ ...editMantenimiento, tecnico: val })}>
                       <SelectTrigger className="bg-slate-900/50 border-slate-700"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                       <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                         <SelectItem value="N/A">N/A</SelectItem>
                         {tecnicos.map(t => <SelectItem key={t.id} value={t.nombre}>{t.nombre}</SelectItem>)}
                       </SelectContent>
                     </Select>
                   </div>
                   <DialogFooter><Button type="submit" className="bg-sky-600 hover:bg-sky-700">Guardar Cambios</Button></DialogFooter>
                 </form>
               )}
             </DialogContent>
           </Dialog>

           {/* VISTA DE LISTA DE MANTENIMIENTOS */}
           <div className="space-y-4 pt-4 border-t border-slate-700/50">
              <div className="flex flex-col items-center bg-slate-900/30 p-6 rounded-xl border border-slate-700/50 gap-6 text-center">
                 <h3 className="text-white font-semibold text-lg">Visor Maestro de Mantenimientos</h3>
                 
                 <div className="flex flex-col sm:flex-row justify-center gap-3 w-full">
                    {/* Filtro por Empresa */}
                    <Select value={filtroEmpresa} onValueChange={(val) => setFiltroEmpresa(val || "TODAS")}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200 w-full sm:w-[200px]">
                        <SelectValue placeholder="Filtrar por Empresa" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                        <SelectItem value="TODAS">Todas las Empresas</SelectItem>
                        {empresas.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.nombre}</SelectItem>)}
                      </SelectContent>
                    </Select>

                    {/* Filtro por Estado */}
                    <div className="flex gap-2 bg-slate-800 p-1 rounded-md border border-slate-700 overflow-x-auto w-full sm:w-auto">
                        <button onClick={() => setFiltroMants("TODOS")} className={`px-4 py-1.5 text-xs font-medium rounded transition whitespace-nowrap ${filtroMants === "TODOS" ? "bg-slate-700 text-white" : "text-slate-300 hover:text-slate-200"}`}>Todos</button>
                        <button onClick={() => setFiltroMants("PENDIENTE")} className={`px-4 py-1.5 text-xs font-medium rounded transition whitespace-nowrap ${filtroMants === "PENDIENTE" ? "bg-yellow-500/20 text-yellow-500" : "text-slate-300 hover:text-slate-200"}`}>Pendientes</button>
                        <button onClick={() => setFiltroMants("EJECUTADO")} className={`px-4 py-1.5 text-xs font-medium rounded transition whitespace-nowrap ${filtroMants === "EJECUTADO" ? "bg-emerald-500/20 text-emerald-500" : "text-slate-300 hover:text-slate-200"}`}>Ejecutados</button>
                        <button onClick={() => setFiltroMants("VENCIDO")} className={`px-4 py-1.5 text-xs font-medium rounded transition whitespace-nowrap ${filtroMants === "VENCIDO" ? "bg-red-500/20 text-red-500" : "text-slate-300 hover:text-slate-200"}`}>Vencidos</button>
                    </div>
                 </div>
              </div>
              
              <div className="bg-[#1E293B] border border-slate-700 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-900/40">
                    <TableRow className="border-slate-700/50">
                      <TableHead className="text-slate-300"># Ref</TableHead>
                      <TableHead className="text-slate-300">Entidad / Empresa</TableHead>
                      <TableHead className="text-slate-300">Día</TableHead>
                      <TableHead className="text-slate-300">Fecha Programada</TableHead>
                      <TableHead className="text-slate-300">Técnico Asignado</TableHead>
                      <TableHead className="text-slate-300">Estado</TableHead>
                      <TableHead className="text-right text-slate-300 px-6">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mantenimientosFiltrados.slice(0, 100).map((m: any) => (
                      <TableRow key={m.id} className="border-slate-700/50 hover:bg-slate-800/50">
                        <TableCell className="text-slate-200 text-xs">MANT-{m.id}</TableCell>
                        <TableCell className="font-semibold text-white">{m.Empresa?.nombre}</TableCell>
                        <TableCell className="text-slate-300 font-bold text-xs uppercase">{getDayName(m.fecha_programada)}</TableCell>
                        <TableCell className="text-slate-300 flex items-center gap-2"><Clock className="w-3 h-3" /> {m.fecha_programada}</TableCell>
                        <TableCell className="text-slate-300 font-medium">{m.tecnico || "N/A"}</TableCell>
                        <TableCell className="">
                          <Badge variant="outline" className={`justify-center text-[11px] py-0.5 border-none px-3 ${
                                m.estado === 'EJECUTADO' ? 'text-emerald-500 bg-emerald-500/10' : 
                                m.estado === 'VENCIDO' ? 'text-red-500 bg-red-500/10' : 
                                'text-yellow-500 bg-yellow-500/10'}`}>
                              {m.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-4">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-sky-500 hover:text-sky-400 hover:bg-sky-500/20" onClick={() => setEditMantenimiento({...m})}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {mantenimientosFiltrados.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="py-8 text-center text-slate-200">Sin coincidencias para los filtros seleccionados.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
           </div>
        </TabsContent>

        {/* TAB: CRONOGRAMA GANTT */}
        <TabsContent value="cronograma" className="w-full space-y-4 outline-none border-none mt-6 animate-in fade-in slide-in-from-bottom-2">
           <Cronograma empresas={empresas} mantenimientos={mantenimientosFiltrados} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SettingsIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
