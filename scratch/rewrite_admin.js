const fs = require('fs');
const path = require('path');

const file = path.join('c:', 'APP_IA', 'PMO-CONTROL', 'frontend', 'src', 'app', 'admin', 'page.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Imports
content = content.replace(
  'PlusCircle, Trash2, Edit, AlertTriangle, CheckCircle2, Clock, Info, UserPlus, AlertCircle, Settings, Pencil, LogOut, ShieldCheck } from "lucide-react";',
  'PlusCircle, Trash2, Edit, AlertTriangle, CheckCircle2, Clock, Info, UserPlus, AlertCircle, Settings, Pencil, LogOut, ShieldCheck, LayoutDashboard, Briefcase, CalendarDays, Users } from "lucide-react";'
);

// 2. State
content = content.replace(
  'const [filtroEmpresa, setFiltroEmpresa] = useState<string>("TODAS");',
  'const [filtroEmpresa, setFiltroEmpresa] = useState<string>("TODAS");\n  const [activeSection, setActiveSection] = useState<"dashboard" | "administracion" | "cronograma" | "usuarios">("dashboard");'
);

// 3. Move "Directorio de Tecnicos"
const dirTecnicosStart = content.indexOf('{/* VISTA DIRECTORIO DE TÉCNICOS */}');
const editEmpresaModalStart = content.indexOf('{/* EDIT EMPRESA MODAL */}');

if (dirTecnicosStart !== -1 && editEmpresaModalStart !== -1) {
  const dirTecnicosSection = content.substring(dirTecnicosStart, editEmpresaModalStart);
  content = content.slice(0, dirTecnicosStart) + content.slice(editEmpresaModalStart);
  
  // Insert it at the end of the usuarios section, just before {/* EDIT USUARIO MODAL */}
  const editUsuarioModalStart = content.indexOf('{/* EDIT USUARIO MODAL */}');
  content = content.slice(0, editUsuarioModalStart) + 
            dirTecnicosSection + '\n           ' + 
            content.slice(editUsuarioModalStart);
}

// 4. Replace Tabs wrapping and TabsList
const tabsListStart = content.indexOf('<Tabs defaultValue="dashboard" className="space-y-6 border-none flex flex-col items-center">');
const tabsContentDashStart = content.indexOf('{/* TAB: DASHBOARD */}');

const sidebarHtml = `
      <div className="flex flex-col md:flex-row gap-6 w-full">
        {/* SIDEBAR */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-[#1E293B] border border-slate-700 rounded-xl p-4 sticky top-6 flex flex-col gap-2 shadow-2xl">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 px-2">Navegación</h3>
            
            <button 
              onClick={() => setActiveSection("dashboard")}
              className={\`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left transition-all duration-200 \${activeSection === "dashboard" ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50" : "text-slate-300 hover:bg-slate-800 hover:text-white"}\`}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span className="font-medium">Dashboard KPI</span>
            </button>
            
            <button 
              onClick={() => setActiveSection("administracion")}
              className={\`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left transition-all duration-200 \${activeSection === "administracion" ? "bg-sky-600 text-white shadow-lg shadow-sky-900/50" : "text-slate-300 hover:bg-slate-800 hover:text-white"}\`}
            >
              <Briefcase className="h-5 w-5" />
              <span className="font-medium">Administración</span>
            </button>
            
            <button 
              onClick={() => setActiveSection("cronograma")}
              className={\`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left transition-all duration-200 \${activeSection === "cronograma" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/50" : "text-slate-300 hover:bg-slate-800 hover:text-white"}\`}
            >
              <CalendarDays className="h-5 w-5" />
              <span className="font-medium">Visión Gantt</span>
            </button>

            <button 
              onClick={() => setActiveSection("usuarios")}
              className={\`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left transition-all duration-200 \${activeSection === "usuarios" ? "bg-purple-600 text-white shadow-lg shadow-purple-900/50" : "text-slate-300 hover:bg-slate-800 hover:text-white"}\`}
            >
              <Users className="h-5 w-5" />
              <span className="font-medium">Usuarios</span>
            </button>
          </div>
        </div>
        
        {/* MAIN CONTENT AREA */}
        <div className="flex-1 w-full min-w-0">
`;

if (tabsListStart !== -1 && tabsContentDashStart !== -1) {
  content = content.slice(0, tabsListStart) + sidebarHtml + '\n' + content.slice(tabsContentDashStart);
}

// Replace all TabsContent
content = content.replace(
  '<TabsContent value="dashboard" className="w-full space-y-4 outline-none border-none mt-2 animate-in fade-in slide-in-from-bottom-2">',
  '{activeSection === "dashboard" && (\n          <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-2">'
);

content = content.replace(
  '</TabsContent>\n\n        {/* TAB: ADMINISTRACION & CARDS */}\n        <TabsContent value="administracion" className="w-full space-y-6 outline-none border-none mt-6 animate-in fade-in slide-in-from-bottom-2">',
  '          </div>\n        )}\n\n        {/* SECCION: ADMINISTRACION & CARDS */}\n        {activeSection === "administracion" && (\n          <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-2">'
);

content = content.replace(
  '</TabsContent>\n\n        {/* TAB: CRONOGRAMA GANTT */}\n        <TabsContent value="cronograma" className="w-full space-y-4 outline-none border-none mt-6 animate-in fade-in slide-in-from-bottom-2">',
  '          </div>\n        )}\n\n        {/* SECCION: CRONOGRAMA GANTT */}\n        {activeSection === "cronograma" && (\n          <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-2">'
);

content = content.replace(
  '</TabsContent>\n\n        {/* TAB: USUARIOS */}\n        <TabsContent value="usuarios" className="w-full space-y-6 outline-none border-none mt-6 animate-in fade-in slide-in-from-bottom-2">',
  '          </div>\n        )}\n\n        {/* SECCION: USUARIOS */}\n        {activeSection === "usuarios" && (\n          <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-2">'
);

content = content.replace(
  '</TabsContent>\n      </Tabs>\n    </div>',
  '          </div>\n        )}\n        </div>\n      </div>\n    </div>'
);

fs.writeFileSync(path.join('c:', 'APP_IA', 'PMO-CONTROL', 'frontend', 'src', 'app', 'admin', 'page.new.tsx'), content);
console.log('Done rewriting.');
