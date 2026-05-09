"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Cronograma } from "@/components/Cronograma";
import { Wrench, CheckCircle2, Clock, AlertCircle, Building2, Pencil, LogOut, User } from "lucide-react";

type EstadoFiltro = "TODOS" | "PENDIENTE" | "EJECUTADO" | "VENCIDO";
export default function TecnicoDashboard() {
  const router = useRouter();
  const [todos, setTodos] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  const getDayName = (dateStr: string) => {
    if (!dateStr) return "-";
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return days[date.getDay()];
  };
  const [tecnicos, setTecnicos] = useState<any[]>([]);

  // Edición de registros ejecutados
  const [editItem, setEditItem] = useState<any>(null);
  const [openEdit, setOpenEdit] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<EstadoFiltro>("TODOS");
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>("TODAS");

  // Estado local por tarjeta: tecnico seleccionado, fecha ejecucion, observaciones
  const [cardData, setCardData] = useState<Record<number, { tecnico: string; fecha: string; obs: string }>>({});

  const loadData = async (currentUser?: any) => {
    try {
      const activeUser = currentUser || user;
      const t = `?t=${Date.now()}`;
      const [mantRes, empRes, tecRes] = await Promise.all([
        api.get(`/mantenimientos${t}`),
        api.get(`/empresas${t}`),
        api.get(`/tecnicos${t}`).catch(() => ({ data: [] }))
      ]);
      setTodos(mantRes.data);
      setEmpresas(empRes.data);
      setTecnicos(tecRes.data);

      // Pre-poblar cardData con el técnico actual de cada mantenimiento o el usuario logueado
      const defaults: Record<number, { tecnico: string; fecha: string; obs: string }> = {};
      mantRes.data.forEach((m: any) => {
        defaults[m.id] = {
          tecnico: m.tecnico || activeUser?.tecnico || "",
          fecha: new Date().toISOString().split('T')[0],
          obs: m.observaciones || ""
        };
      });
      setCardData(defaults);
    } catch (e) {
      console.error("Error loading data", e);
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
      setUser(userData);
      loadData(userData); 
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('pmo_token');
    localStorage.removeItem('pmo_user');
    router.push('/login');
  };

  const handleCardChange = (id: number, field: string, value: string) => {
    setCardData(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const marcarEjecutado = async (id: number) => {
    const m = todos.find(item => item.id === id);
    const data = cardData[id] || { tecnico: "", fecha: "", obs: "" };
    
    if (!data.tecnico) { alert("Selecciona el técnico que ejecutó el mantenimiento"); return; }
    if (!data.fecha) { alert("Selecciona la fecha de ejecución"); return; }

    // Validación: No puede ser menor a la fecha_inicio de la empresa
    if (m?.Empresa?.fecha_inicio && data.fecha < m.Empresa.fecha_inicio) {
      alert(`La fecha de ejecución (${data.fecha}) no puede ser anterior a la fecha de inicio de la empresa (${m.Empresa.fecha_inicio})`);
      return;
    }

    try {
      await api.put(`/mantenimientos/${id}`, {
        estado: "EJECUTADO",
        tecnico: data.tecnico,
        fecha_ejecucion: data.fecha,
        observaciones: data.obs.trim()
      });
      await loadData();
    } catch (e) {
      console.error(e);
      alert("Falla al comunicar ejecución");
    }
  };

  const handleEditClick = (m: any) => {
    setEditItem({
      id: m.id,
      tecnico: m.tecnico || "",
      fecha: m.fecha_ejecucion ? String(m.fecha_ejecucion).split('T')[0] : new Date().toISOString().split('T')[0],
      obs: m.observaciones || ""
    });
    setOpenEdit(true);
  };

  const handleUpdate = async () => {
    if (!editItem) return;
    
    // Buscar el mantenimiento original para validar contra la fecha de inicio de la empresa
    const mOriginal = todos.find(m => m.id === editItem.id);
    if (mOriginal?.Empresa?.fecha_inicio && editItem.fecha < mOriginal.Empresa.fecha_inicio) {
      alert(`La fecha de ejecución (${editItem.fecha}) no puede ser anterior a la fecha de inicio de la empresa (${mOriginal.Empresa.fecha_inicio})`);
      return;
    }

    setSavingEdit(true);
    try {
      await api.put(`/mantenimientos/${editItem.id}`, {
        estado: "EJECUTADO", // Asegurar que quede como ejecutado
        tecnico: editItem.tecnico,
        fecha_ejecucion: editItem.fecha,
        observaciones: editItem.obs.trim()
      });
      setOpenEdit(false);
      await loadData();
    } catch (e) {
      console.error(e);
      alert("Error al actualizar");
    } finally {
      setSavingEdit(false);
    }
  };

  const mantenimientosFiltrados = useMemo(() => {
    return todos.filter(m => {
      const matchEstado = filtroEstado === "TODOS" || m.estado === filtroEstado;
      const mEmpId = m.empresa_id ? String(m.empresa_id) : "null";
      const matchEmpresa = filtroEmpresa === "TODAS" || mEmpId === filtroEmpresa;
      return matchEstado && matchEmpresa;
    });
  }, [todos, filtroEstado, filtroEmpresa]);

  const vencidosList = useMemo(() => {
    return todos.filter(m => m.estado === "VENCIDO")
      .sort((a,b) => new Date(b.fecha_programada).getTime() - new Date(a.fecha_programada).getTime())
      .slice(0, 3);
  }, [todos]);

  const proximosList = useMemo(() => {
     return todos.filter(m => m.estado === "PENDIENTE")
      .sort((a,b) => new Date(a.fecha_programada).getTime() - new Date(b.fecha_programada).getTime())
      .slice(0, 3);
  }, [todos]);


  const statusConfig: Record<string, { label: string; color: string; border: string; icon: React.ReactNode }> = {
    PENDIENTE: { label: "Pendiente", color: "text-yellow-400", border: "border-l-yellow-500", icon: <Clock className="h-3 w-3" /> },
    EJECUTADO: { label: "Ejecutado", color: "text-emerald-400", border: "border-l-emerald-500", icon: <CheckCircle2 className="h-3 w-3" /> },
    VENCIDO: { label: "Vencido", color: "text-red-400", border: "border-l-red-500", icon: <AlertCircle className="h-3 w-3" /> },
  };

  const counts = {
    TODOS: todos.length,
    PENDIENTE: todos.filter(m => m.estado === "PENDIENTE").length,
    EJECUTADO: todos.filter(m => m.estado === "EJECUTADO").length,
    VENCIDO: todos.filter(m => m.estado === "VENCIDO").length,
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-2xl shadow-xl border border-slate-200 w-full animate-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <img src="/logo.png" alt="PDI Advanced Logo" className="h-12 object-contain" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-black">Portal de Técnico</h2>
            <p className="text-slate-700 font-bold uppercase tracking-widest text-[11px]">
              Bienvenido, <span className="text-sky-700 font-black">{user?.tecnico || user?.username}</span>
            </p>
          </div>
        </div>

        <Button 
          variant="ghost" 
          size="sm" 
          className="text-slate-500 hover:text-red-500 transition-colors"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" /> Salir
        </Button>
      </div>

      {/* FILTROS RESPONSIVOS */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center bg-[#1E293B] border border-slate-700 rounded-xl p-4 shadow-lg">
        {/* Filtro por Empresa */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Building2 className="h-4 w-4 text-sky-400 shrink-0" />
          <Select value={filtroEmpresa} onValueChange={val => setFiltroEmpresa(val || "TODAS")}>
            <SelectTrigger className="bg-slate-800 border-slate-600 text-slate-200 w-full md:w-[240px]">
              <SelectValue placeholder="Todas las empresas" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
              <SelectItem value="TODAS">Todas las Empresas</SelectItem>
              {empresas.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Filtro por Estado - Scroll lateral en móvil */}
        <div className="flex gap-2 bg-slate-800 p-1.5 rounded-lg border border-slate-700 overflow-x-auto no-scrollbar">
          {(["TODOS", "PENDIENTE", "EJECUTADO", "VENCIDO"] as EstadoFiltro[]).map(estado => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition whitespace-nowrap flex items-center gap-1.5
                ${filtroEstado === estado
                  ? estado === "PENDIENTE" ? "bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/50"
                    : estado === "EJECUTADO" ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50"
                    : estado === "VENCIDO" ? "bg-red-500/20 text-red-400 ring-1 ring-red-500/50"
                    : "bg-slate-600 text-white"
                  : "text-slate-300 hover:text-slate-200"
                }`}
            >
              {estado === "TODOS" ? "Todos" : estado.charAt(0) + estado.slice(1).toLowerCase()}
              <span className="bg-slate-700/50 text-slate-300 rounded px-1.5 py-0.5 text-[10px]">
                {counts[estado]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* CRONOGRAMA GANTT - Orden 1 en móvil, Orden 2 en PC */}
        <div className="w-full lg:w-3/5 xl:w-2/3 border-b border-slate-800 lg:border-b-0 lg:border-l lg:pl-6 pb-6 lg:pb-0 order-1 lg:order-2 space-y-6">
          <Cronograma empresas={empresas} mantenimientos={mantenimientosFiltrados} />

          {/* PANEL DE ALERTAS - Estilo Admin */}
          <Card className="bg-[#1E293B] border-slate-700 p-6 flex flex-col shadow-2xl animate-in fade-in duration-700">
             <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-2">
               <h3 className="text-white font-bold text-lg flex items-center gap-2">
                 <AlertCircle className="h-5 w-5 text-red-500" /> Resumen de Alertas
               </h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bloque Vencidos */}
                <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800">
                  <div className="flex items-center gap-2 text-slate-300 font-semibold mb-2 text-sm">
                     <span className="bg-red-500 text-white p-0.5 rounded-full"><AlertCircle className="h-3 w-3" /></span>
                     Urgentes / Vencidos
                  </div>
                  <div className="space-y-1">
                    {vencidosList.length > 0 ? vencidosList.map(m => (
                      <div key={m.id} className="flex justify-between items-center text-xs p-2 border-t border-slate-800/30">
                        <span className="text-slate-300 font-mono font-bold">{m.fecha_programada}</span>
                        <span className="text-white font-medium truncate ml-4 text-right">{m.Empresa?.nombre}</span>
                      </div>
                    )) : <p className="text-slate-500 text-xs italic p-1">Sin alertas urgentes.</p>}
                  </div>
                </div>

                {/* Bloque Próximos */}
                <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800">
                  <div className="flex items-center gap-2 text-slate-300 font-semibold mb-2 text-sm">
                     <span className="bg-yellow-500 text-white p-0.5 rounded-full"><Clock className="h-3 w-3" /></span>
                     Siguientes Tareas
                  </div>
                  <div className="space-y-1">
                    {proximosList.length > 0 ? proximosList.map(m => (
                      <div key={m.id} className="flex justify-between items-center text-xs p-2 border-t border-slate-800/30">
                        <span className="text-slate-300 font-mono font-bold">{m.fecha_programada}</span>
                        <span className="text-white font-medium truncate ml-4 text-right">{m.Empresa?.nombre}</span>
                      </div>
                    )) : <p className="text-slate-500 text-xs italic p-1">No hay tareas planeadas próximamente.</p>}
                  </div>
                </div>
             </div>
          </Card>
        </div>

        {/* TARJETAS - Orden 2 en móvil, Orden 1 en PC */}
        <div className="w-full lg:w-2/5 xl:w-1/3 space-y-4 order-2 lg:order-1">
          <div className="flex justify-between items-center bg-slate-900/40 p-3 rounded-lg border border-slate-800">
            <p className="text-slate-300 text-xs text-center w-full">
              Listado de Tareas (<span className="text-white font-bold">{mantenimientosFiltrados.length}</span>)
            </p>
          </div>

          {mantenimientosFiltrados.length === 0 ? (
            <div className="text-center py-12 text-slate-200 bg-[#1E293B] rounded-xl border border-dashed border-slate-700">
              <CheckCircle2 className="mx-auto h-8 w-8 mb-2 opacity-20" />
              <p className="font-medium text-sm">Sin registros</p>
              <p className="text-xs mt-1">Ajusta los filtros para ver más.</p>
            </div>
          ) : (
            <div className="space-y-4 pb-8 lg:max-h-[calc(100vh-280px)] lg:overflow-y-auto pr-1 customize-scrollbar">
              {mantenimientosFiltrados.map((m: any) => {
                const cfg = statusConfig[m.estado] || statusConfig.PENDIENTE;
                const card = cardData[m.id] || { tecnico: m.tecnico || "", fecha: new Date().toISOString().split('T')[0], obs: "" };
                const isPendiente = m.estado === "PENDIENTE" || m.estado === "VENCIDO";

                return (
                  <Card key={m.id} className={`border-l-4 ${cfg.border} bg-[#1E293B] border-slate-700 shadow-md`}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base font-bold text-white">
                          {m.Empresa?.nombre || `Empresa ${m.empresa_id}`}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs flex items-center gap-1 ${
                            m.estado === "EJECUTADO" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                            m.estado === "VENCIDO" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                            "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                          }`}>
                            {cfg.icon} {cfg.label}
                          </Badge>
                          {m.estado === "EJECUTADO" && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-slate-300 hover:text-white hover:bg-slate-700"
                              onClick={() => handleEditClick(m)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <CardDescription className="text-slate-200 text-xs font-medium space-y-1">
                        <div className="flex items-center gap-1.5 pt-1">
                          <Clock className="h-3 w-3 text-sky-500" />
                          Programado: <span className="font-bold">{m.fecha_programada}</span> 
                          <span className="text-sky-400 font-bold uppercase ml-1">({getDayName(m.fecha_programada)})</span>
                        </div>
                        {m.fecha_ejecucion && (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            Ejecutado: <span className="text-emerald-400 font-bold">{String(m.fecha_ejecucion).split('T')[0]}</span> 
                            <span className="text-emerald-500/80 font-bold uppercase ml-1">({getDayName(String(m.fecha_ejecucion).split('T')[0])})</span>
                          </div>
                        )}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-3 py-3">
                      {/* Técnico Asignado - dropdown */}
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Técnico que Ejecuta</Label>
                        {isPendiente ? (
                          <Select
                            value={card.tecnico || ""}
                            onValueChange={val => handleCardChange(m.id, 'tecnico', val ?? "")}
                            disabled={!!user?.tecnico} // Deshabilitar si ya tenemos un técnico vinculado
                          >
                            <SelectTrigger className="bg-slate-900/50 border-slate-600 text-slate-200 h-8 text-sm">
                              <SelectValue placeholder="Seleccionar técnico..." />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                              {tecnicos.map((t: any) => (
                                <SelectItem key={t.id} value={t.nombre}>{t.nombre}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-sm text-slate-300 font-medium bg-slate-800/50 px-3 py-1.5 rounded border border-slate-700">{m.tecnico || "-"}</p>
                        )}
                      </div>

                      {/* Fecha de Ejecución */}
                      {isPendiente && (
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Fecha de Ejecución</Label>
                          <Input
                            type="date"
                            className="bg-slate-900/50 border-slate-600 text-slate-200 h-8 text-sm"
                            value={card.fecha || new Date().toISOString().split('T')[0]}
                            onChange={e => handleCardChange(m.id, 'fecha', e.target.value)}
                          />
                        </div>
                      )}

                      {/* Observaciones */}
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Observaciones</Label>
                        {isPendiente ? (
                          <Textarea
                            placeholder="Detalles del mantenimiento ejecutado..."
                            className="resize-none bg-slate-900/50 border-slate-600 text-slate-200 min-h-[50px] text-sm"
                            value={card.obs || ""}
                            onChange={e => handleCardChange(m.id, 'obs', e.target.value)}
                          />
                        ) : (
                          <p className="text-sm text-slate-300 bg-slate-800/50 px-3 py-2 rounded border border-slate-700 min-h-[40px]">
                            {m.observaciones || "Sin observaciones"}
                          </p>
                        )}
                      </div>
                    </CardContent>

                    {isPendiente && (
                      <CardFooter className="pt-0">
                        <Button
                          onClick={() => marcarEjecutado(m.id)}
                          className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold transition"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" /> Firmar como Ejecutado
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* DIALOG DE EDICION */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-sky-500" /> Editar Mantenimiento
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Corrija los datos del mantenimiento ejecutado.
            </DialogDescription>
          </DialogHeader>

          {editItem && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-slate-300">Técnico que Ejecutó</Label>
                <Select
                  value={editItem.tecnico}
                  onValueChange={val => setEditItem({...editItem, tecnico: val})}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                    {tecnicos.map((t: any) => (
                      <SelectItem key={t.id} value={t.nombre}>{t.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Fecha de Ejecución</Label>
                <Input
                  type="date"
                  className="bg-slate-800 border-slate-700"
                  value={editItem.fecha}
                  onChange={e => setEditItem({...editItem, fecha: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Observaciones</Label>
                <Textarea
                  className="bg-slate-800 border-slate-700 resize-none min-h-[80px]"
                  value={editItem.obs}
                  onChange={e => setEditItem({...editItem, obs: e.target.value})}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setOpenEdit(false)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdate}
              disabled={savingEdit}
              className="bg-sky-600 hover:bg-sky-700 text-white"
            >
              {savingEdit ? 'Actualizando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
