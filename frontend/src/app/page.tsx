import Link from "next/link";
import { Settings, Wrench } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center p-4">
      <div className="mb-12 text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl text-[#E2E8F0]">PMO CONTROL</h1>
        <p className="text-xl text-slate-400 max-w-xl mx-auto">
          Sistema Avanzado de Gestión de Mantenimientos Preventivos y Planificación Automática
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 max-w-3xl w-full">
        <Link href="/admin" className="group">
          <Card className="h-full border-[#334155] bg-[#1E293B] hover:bg-slate-800 transition-all hover:border-slate-500 shadow-lg cursor-pointer">
            <CardHeader className="text-center pb-2">
              <Settings className="mx-auto h-16 w-16 text-emerald-500 mb-4 group-hover:scale-110 transition-transform" />
              <CardTitle className="text-2xl text-white">Administrador</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-slate-400">
              <p>Gestión de empresas, planificación de cronogramas y visualización de KPIs.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/tecnico" className="group">
          <Card className="h-full border-[#334155] bg-[#1E293B] hover:bg-slate-800 transition-all hover:border-slate-500 shadow-lg cursor-pointer">
            <CardHeader className="text-center pb-2">
              <Wrench className="mx-auto h-16 w-16 text-sky-500 mb-4 group-hover:scale-110 transition-transform" />
              <CardTitle className="text-2xl text-white">Técnico</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-slate-400">
              <p>Ejecución operativa en terreno, registro de observaciones y ruta diaria.</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
