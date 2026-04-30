import { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CronogramaProps {
  empresas: any[];
  mantenimientos: any[];
}

export function Cronograma({ empresas, mantenimientos }: CronogramaProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  // Calculate available years from data
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>([new Date().getFullYear()]);
    mantenimientos.forEach(m => {
      if (m.fecha_programada) {
        const y = parseISO(m.fecha_programada).getFullYear();
        yearsSet.add(y);
      }
    });
    return Array.from(yearsSet).sort((a, b) => a - b);
  }, [mantenimientos]);

  // Filter maintenances for the selected year
  const filteredMantenimientos = useMemo(() => {
    return mantenimientos.filter(m => {
      const isEjecutado = m.estado === "EJECUTADO";
      const rawDate = (isEjecutado && m.fecha_ejecucion) ? m.fecha_ejecucion : m.fecha_programada;
      if (!rawDate) return false;
      const dateStr = typeof rawDate === 'string' ? rawDate.split('T')[0] : new Date(rawDate).toISOString().split('T')[0];
      return parseISO(dateStr).getFullYear() === selectedYear;
    });
  }, [mantenimientos, selectedYear]);

  // Initialize all enterprises to guarantee a row
  const dataPorEmpresa: Record<string, { nombre: string; meses: Record<number, any[]> }> = {};

  empresas.forEach(emp => {
      dataPorEmpresa[String(emp.id)] = {
          nombre: emp.nombre,
          meses: {}
      };
  });

  // Hydrate with filtered maintenances
  filteredMantenimientos.forEach(m => {
    const isEjecutado = m.estado === "EJECUTADO";
    const rawDate = (isEjecutado && m.fecha_ejecucion) ? m.fecha_ejecucion : m.fecha_programada;
    
    // Si rawDate es un objeto Date o ISO largo, quedarnos con la parte YYYY-MM-DD
    const dateStr = typeof rawDate === 'string' ? rawDate.split('T')[0] : new Date(rawDate).toISOString().split('T')[0];
    const date = parseISO(dateStr);
    const mesNum = date.getMonth(); 
    
    const empId = String(m.empresa_id);

    // Si viene un empId asincrono o que no esta en las empresas listadas
    if (!dataPorEmpresa[empId]) {
       dataPorEmpresa[empId] = {
          nombre: m.Empresa?.nombre || `Empresa ${m.empresa_id}`,
          meses: {}
       };
    }

    if (!dataPorEmpresa[empId].meses[mesNum]) {
        dataPorEmpresa[empId].meses[mesNum] = [];
    }
    
    dataPorEmpresa[empId].meses[mesNum].push({ ...m, _displayDate: dateStr });
  });

  const empresasKeys = Object.keys(dataPorEmpresa);

  if (empresasKeys.length === 0) {
    return (
      <div className="text-center p-6 border border-dashed rounded-lg bg-card text-slate-300">
        <CalendarDays className="mx-auto h-8 w-8 text-slate-300 mb-2" />
        <h3 className="text-sm font-medium">Cronograma de Mantenimientos (Vacío)</h3>
      </div>
    );
  }

  return (
    <div className="w-full bg-card text-card-foreground rounded-xl border shadow-sm flex flex-col mt-4 overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-base font-bold text-foreground">Cronograma de Mantenimiento Anual (Gantt)</h3>
            <p className="text-xs text-slate-400">Vista global de 12 meses por empresa</p>
          </div>
          
          <div className="flex items-center gap-2 bg-background/50 p-1 rounded-lg border ml-2">
            <span className="text-[10px] font-bold uppercase text-slate-500 px-1">Año:</span>
            <Select value={String(selectedYear)} onValueChange={(val) => setSelectedYear(Number(val))}>
              <SelectTrigger className="h-8 w-[100px] bg-slate-900 border-slate-700 text-xs font-bold">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-white">
                {availableYears.map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs font-medium bg-background/50 py-1 px-2 rounded-md border">
          <span className="flex items-center gap-1"><Circle className="h-3 w-3 text-yellow-500 fill-yellow-500" /> Pendiente</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500 fill-emerald-500" /> Ejecutado</span>
          <span className="flex items-center gap-1"><AlertCircle className="h-3 w-3 text-red-500 fill-red-500" /> Vencido</span>
        </div>
      </div>

      <div className="overflow-x-auto p-1">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-muted text-slate-300 text-xs">
              <th className="py-2 px-3 font-semibold uppercase min-w-[140px] sticky left-0 bg-muted z-10 border-r border-b">Empresa</th>
              {meses.map((mes, idx) => (
                <th key={idx} className="py-2 px-1 text-center font-semibold border-r border-b last:border-r-0 w-[6%] min-w-[45px]">
                  {mes}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-xs">
            {empresasKeys.map((empId) => {
              const fila = dataPorEmpresa[empId];
              return (
                <tr key={empId} className="hover:bg-muted/30 transition-colors">
                  <td className="py-2 px-3 font-medium text-foreground sticky left-0 bg-card z-10 border-r shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] truncate max-w-[160px]" title={fila.nombre}>
                    {fila.nombre}
                  </td>
                  {meses.map((_, mesIdx) => {
                    const tareasDelMes = fila.meses[mesIdx];
                    return (
                      <td key={mesIdx} className="py-1 px-1 border-r last:border-r-0 relative align-middle">
                        {tareasDelMes && tareasDelMes.length > 0 ? (
                          <div className="flex flex-col items-center justify-center gap-1">
                            {tareasDelMes.map((m) => {
                               const displayDate = m._displayDate || m.fecha_programada;
                               const day = format(parseISO(displayDate), "dd");
                               const isEjecutado = m.estado === "EJECUTADO";
                               const isVencido = m.estado === "VENCIDO";
                               const dateTooltip = isEjecutado 
                                ? `Programado: ${m.fecha_programada}\nEjecutado: ${String(m.fecha_ejecucion).split('T')[0]}`
                                : `Programado: ${m.fecha_programada}`;
                               
                               return (
                                 <div 
                                   key={m.id}
                                   title={`Empresa: ${fila.nombre}\n${dateTooltip}\nEstado: ${m.estado}\nTécnico: ${m.tecnico || 'Sin asignar'}`}
                                   className={`
                                     w-full py-0.5 px-1 rounded text-center text-[10px] font-bold border cursor-default transition-all hover:scale-105 hover:shadow-md
                                     ${isEjecutado ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : 
                                       isVencido ? "bg-red-500/20 text-red-500 border-red-500/30 relative" : 
                                       "bg-yellow-500/20 text-yellow-500 border-yellow-500/30 shadow-sm"}
                                   `}
                                 >
                                   {isVencido && <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>}
                                   {day}
                                 </div>
                               );
                             })}
                          </div>
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <span className="inline-block w-full h-[2px] bg-muted/50 rounded"></span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
