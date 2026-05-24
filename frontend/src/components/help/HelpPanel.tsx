import React from 'react';
import { HelpCircle, X } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useAIStore } from '@/store/aiStore';

type Module = 'dashboard' | 'projects' | 'credentials' | 'tasks' | 'notes' | 'database' | 'activity';

interface HelpSection { title: string; text: string }
interface HelpEntry {
  title: string;
  sections: HelpSection[];
  tips: string[];
}

const HELP: Record<Module, HelpEntry> = {
  dashboard: {
    title: 'Resumen del Dashboard',
    sections: [
      { title: 'Tarjetas de estadísticas', text: 'Muestran los totales de proyectos, tareas y credenciales de un vistazo.' },
      { title: 'Proyectos recientes', text: 'Haz clic en cualquier proyecto para abrir el panel lateral con todos sus datos.' },
      { title: 'Actividad reciente', text: 'Muestra las últimas 8 acciones. Las acciones de IA están marcadas con IA.' },
      { title: 'Accesos rápidos', text: 'Atajos para crear elementos sin salir de la pantalla actual.' },
    ],
    tips: [
      "Pídele a la IA: 'Dame un resumen de todos los proyectos activos'",
      'Haz clic en un estado para filtrar los proyectos por ese valor',
    ],
  },
  projects: {
    title: 'Centro de Proyectos',
    sections: [
      { title: 'Crear un proyecto', text: 'Solo el nombre es obligatorio. El resto de campos son opcionales y puedes completarlos cuando quieras.' },
      { title: 'Secciones plegables', text: 'El formulario tiene varias secciones. Puedes abrir solo las que necesites y el indicador muestra cuáles tienen datos.' },
      { title: 'Stack tecnológico', text: 'Organiza tu stack por capas: Frontend, Backend, Base de datos, DevOps y servicios externos.' },
      { title: 'Acceso al servidor', text: 'Guarda SSH, paneles de hosting y variables sensibles con cifrado AES-256-GCM.' },
      { title: 'Ver y editar', text: 'Usa Ver para abrir el panel lateral del proyecto y Editar para modificar toda su información.' },
    ],
    tips: [
      "Puedes decirle a la IA: 'Terminé el backend de X' para actualizar el stack automáticamente",
      "Puedes decirle a la IA: 'Pon todos los proyectos de clientes en prioridad alta' para actualizar varios a la vez",
    ],
  },
  credentials: {
    title: 'Bóveda de Credenciales',
    sections: [
      { title: 'Categorías', text: 'Puedes organizar credenciales por tipo: Admin, FTP, SSH, API Key, Base de datos, Hosting, Dominio y más.' },
      { title: 'Visualización segura', text: 'Puedes revelar temporalmente el usuario o la contraseña cuando lo necesites.' },
      { title: 'Relación con proyecto', text: 'Cada credencial puede asociarse a un proyecto para verla dentro del panel de detalle.' },
    ],
    tips: [
      "Pídele a la IA: 'Agrega la API key de Stripe al proyecto X'",
      'Los valores se almacenan cifrados, no en texto plano',
    ],
  },
  tasks: {
    title: 'Tareas y Bugs',
    sections: [
      { title: 'Estados', text: 'Organiza el trabajo por columnas: TODO, EN PROGRESO, EN REVISIÓN, HECHO y BLOQUEADO.' },
      { title: 'Kanban', text: 'Cada columna muestra las tareas según su estado actual.' },
      { title: 'Proyecto asociado', text: 'Ahora puedes asignar cada tarea a un proyecto desde el formulario.' },
    ],
    tips: [
      "Pídele a la IA: 'Crea 3 tareas para el login en el proyecto X'",
      'Usa el filtro por proyecto para ver solo el trabajo de una app concreta',
    ],
  },
  notes: {
    title: 'Notas',
    sections: [
      { title: 'Notas fijadas', text: 'Las notas fijadas se mantienen arriba para acceder más rápido.' },
      { title: 'Vinculación a proyectos', text: 'Puedes asociar una nota a un proyecto para verla también en el panel lateral de ese proyecto.' },
      { title: 'Uso recomendado', text: 'Úsalas para documentación, recordatorios, checklist o decisiones técnicas.' },
    ],
    tips: [
      "Pídele a la IA: 'Genera documentación de setup para el proyecto X como nota'",
      'Filtra por proyecto para separar documentación por cliente o producto',
    ],
  },
  database: {
    title: 'Centro de Bases de Datos',
    sections: [
      { title: 'Tipos', text: 'Puedes guardar conexiones PostgreSQL, MySQL, SQLite, MongoDB, Redis u otras.' },
      { title: 'Relación con proyecto', text: 'Cada conexión puede quedar asociada a un proyecto específico.' },
      { title: 'Acceso seguro', text: 'Las credenciales de conexión siguen el mismo patrón seguro que las credenciales normales.' },
    ],
    tips: [
      "Pídele a la IA: 'Agrega una conexión PostgreSQL al proyecto X'",
    ],
  },
  activity: {
    title: 'Registro de Actividad',
    sections: [
      { title: 'Filtros', text: 'Filtra por proyecto, entidad, tipo de acción o fuente.' },
      { title: 'Acciones de IA', text: 'Las acciones hechas por la IA quedan registradas para que puedas revisarlas.' },
    ],
    tips: [
      "Usa el filtro de fuente para revisar lo que hizo la IA",
    ],
  },
};

export function HelpPanel() {
  const { isHelpOpen, setHelpOpen, activeModule } = useAppStore();
  const { setPanel } = useAIStore();

  if (!isHelpOpen) return null;

  const help = HELP[activeModule] ?? HELP.dashboard;

  function handleAskAI() {
    setHelpOpen(false);
    setPanel(true);
  }

  return (
    <div
      className="fixed top-0 right-0 h-full w-[380px] z-[9997] flex flex-col bg-[#0D1117] border-l border-[#21262D] shadow-2xl"
      style={{ animation: 'slideInRight 0.25s ease' }}
    >
      <style>{`@keyframes slideInRight { from { transform: translateX(420px); } to { transform: translateX(0); } }`}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#21262D] shrink-0">
        <div className="flex items-center gap-2">
          <HelpCircle size={15} className="text-[#A78BFA]" />
          <div>
            <p className="text-sm font-semibold text-[#E6EDF3]">{help.title}</p>
            <p className="text-[10px] text-[#484F58]">Guía</p>
          </div>
        </div>
        <button onClick={() => setHelpOpen(false)} className="p-1.5 hover:bg-[#21262D] rounded text-[#484F58] hover:text-[#C9D1D9] transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {help.sections.map((section, i) => (
          <div key={i}>
            {i > 0 && <div className="h-px bg-[#21262D] mb-4" />}
            <p className="text-[11px] font-mono font-semibold text-[#39D0D8] uppercase tracking-wider mb-1">{section.title}</p>
            <p className="text-[13px] text-[#8B949E] leading-relaxed">{section.text}</p>
          </div>
        ))}

        {help.tips.length > 0 && (
          <div>
            <div className="h-px bg-[#21262D] mb-4" />
            <p className="text-[11px] font-mono font-semibold text-[#484F58] uppercase tracking-wider mb-2">Consejos</p>
            <div className="space-y-2">
              {help.tips.map((tip, i) => (
                <p key={i} className="text-[12px] text-[#484F58] italic leading-relaxed">
                  💡 {tip}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-[#21262D] p-4">
        <button
          onClick={handleAskAI}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[rgba(167,139,250,0.1)] border border-[rgba(167,139,250,0.25)] rounded-md text-[13px] text-[#A78BFA] hover:bg-[rgba(167,139,250,0.18)] transition-colors"
        >
          Preguntar a la IA sobre esto →
        </button>
      </div>
    </div>
  );
}
