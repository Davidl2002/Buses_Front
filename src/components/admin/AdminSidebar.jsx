import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Route,
  Bus,
  Truck,
  Calendar,
  Users,
  Ticket,
  BarChart3,
  Settings,
  LogOut,
  Clock,
  Building2,
  Palette,
  ChevronDown,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cooperativaService } from '@/services';

const navigationSuperAdmin = [
  {
    name: 'Dashboard Global',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    roles: ['SUPER_ADMIN', 'ADMIN']
  },
  {
    name: 'Cooperativas',
    href: '/admin/cooperatives',
    icon: Building2,
    roles: ['SUPER_ADMIN']
  },
];

const navigationAdmin = [
  {
    name: 'Configuración',
    href: '/admin/cooperativa-settings',
    icon: Palette,
    roles: ['ADMIN']
  },
  {
    name: 'Rutas',
    href: '/admin/routes',
    icon: Route,
    roles: ['SUPER_ADMIN', 'ADMIN']
  },
  // {
  //   name: 'Frecuencias ANT',
  //   href: '/admin/frequencies',
  //   icon: Clock,
  //   roles: ['ADMIN']
  // },
  {
    name: 'Buses',
    href: '/admin/buses',
    icon: Bus,
    roles: ['SUPER_ADMIN', 'ADMIN']
  },
  {
    name: 'Grupos de Buses',
    href: '/admin/bus-groups',
    icon: Building2,
    roles: ['SUPER_ADMIN', 'ADMIN']
  },
  {
    name: 'Hoja de Ruta',
    href: '/admin/route-sheet',
    icon: Truck,
    roles: ['SUPER_ADMIN', 'ADMIN']
  },
  {
    name: 'Viajes',
    href: '/admin/trips',
    icon: Calendar,
    roles: ['SUPER_ADMIN', 'ADMIN', 'OFICINISTA']
  },
  {
    name: 'Personal',
    href: '/admin/staff',
    icon: Users,
    roles: ['SUPER_ADMIN', 'ADMIN']
  },
  {
    name: 'Tickets',
    href: '/admin/tickets',
    icon: Ticket,
    roles: ['SUPER_ADMIN', 'ADMIN', 'OFICINISTA']
  },
  {
    name: 'Ciudades',
    href: '/admin/cities',
    icon: MapPin,
    roles: ['SUPER_ADMIN', 'ADMIN']
  },
  // {
  //   name: 'Reportes',
  //   href: '/admin/reports',
  //   icon: BarChart3,
  //   roles: ['SUPER_ADMIN', 'ADMIN']
  // },
];

export default function AdminSidebar() {
  const location = useLocation();
  const { user, logout, selectCooperativa, cooperativa: activeCooperativa } = useAuth();

  const [allCooperativas, setAllCooperativas] = useState([]);

  useEffect(() => {
    const load = async () => {
      if (user?.role === 'SUPER_ADMIN') {
        try {
          const res = await cooperativaService.getAll();
          const list = res.data?.data || res.data || [];
          setAllCooperativas(list);
        } catch (err) {
          console.error('Error loading cooperativas list for sidebar:', err);
          setAllCooperativas([]);
        }
      }
    };
    load();
  }, [user]);

  // Filtrar navegación según el rol del usuario
  const getNavigation = () => {
    if (user?.role === 'SUPER_ADMIN') {
      // Combinar ambas navegaciones pero filtrar por rol SUPER_ADMIN
      return [...navigationSuperAdmin, ...navigationAdmin].filter(item =>
        item.roles.includes('SUPER_ADMIN')
      );
    }

    // Para ADMIN también incluir navigationSuperAdmin (Dashboard Global)
    if (user?.role === 'ADMIN') {
      return [...navigationSuperAdmin, ...navigationAdmin].filter(item =>
        item.roles.includes('ADMIN')
      );
    }

    return navigationAdmin.filter(item =>
      item.roles.includes(user?.role)
    );
  };

  const navigation = getNavigation();

  // Construye href añadiendo cooperativaId si el usuario es SUPER_ADMIN y hay cooperativa activa
  const buildHref = (baseHref) => {
    try {
      const activeId = activeCooperativa?.id || activeCooperativa?._id || '';
      if (user?.role === 'SUPER_ADMIN' && activeId) {
        const url = new URL(baseHref, window.location.origin);
        url.searchParams.set('cooperativaId', activeId);
        return url.pathname + url.search;
      }
    } catch (e) {
      // fallback: simple concatenation
      const activeId = activeCooperativa?.id || activeCooperativa?._id || '';
      if (user?.role === 'SUPER_ADMIN' && activeId) {
        return `${baseHref}${baseHref.includes('?') ? '&' : '?'}cooperativaId=${activeId}`;
      }
    }
    return baseHref;
  };

  // Agrupar navegación en secciones lógicas
  const groups = [
    {
      title: 'General',
      hrefs: ['/admin/dashboard', '/admin/cooperatives', '/admin/cooperativa-dashboard', '/admin/cooperativa-settings']
    },
    {
      title: 'Operaciones',
      hrefs: ['/admin/routes', '/admin/route-sheet', '/admin/trips', '/admin/frequencies']
    },
    {
      title: 'Flota',
      hrefs: ['/admin/buses', '/admin/bus-groups']
    },
    {
      title: 'Gestión',
      hrefs: ['/admin/staff', '/admin/tickets', '/admin/cities']
    },
    // {
    //   title: 'Análisis',
    //   hrefs: ['/admin/reports']
    // }
  ];

  // Resolver items por grupo según la navegación filtrada por rol
  const grouped = groups.map((g) => ({
    title: g.title,
    items: navigation.filter(item => g.hrefs.includes(item.href))
  }));

  // Items no asignados a ningún grupo
  const assignedHrefs = new Set(grouped.flatMap(g => g.items.map(i => i.href)));
  const unassigned = navigation.filter(item => !assignedHrefs.has(item.href));

  // Estado para controlar qué secciones están abiertas (desplegadas)
  const [openGroups, setOpenGroups] = useState(() => {
    const map = {};
    grouped.forEach(g => {
      // por defecto, todas expandidas para mejor experiencia
      map[g.title] = true;
    });
    return map;
  });

  const toggleGroup = (title) => {
    setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  // Para superadmin: verificar si ha seleccionado cooperativa
  const hasSelectedCooperativa = activeCooperativa?.id || activeCooperativa?._id;
  const shouldShowNavigation = user?.role !== 'SUPER_ADMIN' || hasSelectedCooperativa;

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200">
      {/* SuperAdmin: selector rápido de cooperativa + enlace a gestión */}
      {user?.role === 'SUPER_ADMIN' && (
        <div className={`px-4 py-4 border-b ${!hasSelectedCooperativa ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`p-2 rounded-lg ${!hasSelectedCooperativa ? 'bg-yellow-100' : 'bg-blue-100'}`}>
              <Building2 className={`h-4 w-4 ${!hasSelectedCooperativa ? 'text-yellow-600' : 'text-blue-600'}`} />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Cooperativa Activa
              </div>
              {hasSelectedCooperativa && (
                <div className="text-xs text-gray-500 mt-0.5">
                  Trabajando como
                </div>
              )}
            </div>
          </div>
          
          {!hasSelectedCooperativa && (
            <div className="mb-3 p-2 bg-yellow-100 border border-yellow-300 rounded-lg">
              <p className="text-xs text-yellow-800 font-medium flex items-center gap-1">
                <span className="text-base">⚠️</span>
                Selecciona una cooperativa para comenzar
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <select
              className={`w-full border rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                !hasSelectedCooperativa 
                  ? 'border-yellow-400 bg-white hover:border-yellow-500 focus:ring-2 focus:ring-yellow-200' 
                  : 'border-blue-300 bg-white hover:border-blue-400 focus:ring-2 focus:ring-blue-200'
              } focus:outline-none`}
              value={activeCooperativa?.id || activeCooperativa?._id || ''}
              onChange={async (e) => {
                const id = e.target.value;
                if (id) await selectCooperativa(id);
              }}
            >
              <option value="">-- Seleccionar cooperativa --</option>
              {allCooperativas.filter(c => c.isActive !== false).map((c) => (
                <option key={c.id || c._id} value={c.id || c._id}>{c.nombre || c.name}</option>
              ))}
            </select>
            
            <Link 
              to="/admin/cooperatives" 
              className="flex items-center justify-center gap-1 text-xs text-primary hover:text-primary/80 font-medium py-1 px-2 rounded hover:bg-white/50 transition-colors"
            >
              <Building2 className="h-3 w-3" />
              Ver todas las cooperativas
            </Link>
          </div>
        </div>
      )}
      {/* Navigation grouped */}
      <nav className="flex-1 px-4 py-6 space-y-4 overflow-y-auto">
        {!shouldShowNavigation && (
          <div className="text-center py-8 px-4">
            <div className="text-gray-500 text-sm">
              <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="font-medium">Selecciona una cooperativa</p>
              <p className="text-xs mt-1">Para ver las opciones de gestión, selecciona una cooperativa arriba.</p>
            </div>
          </div>
        )}
        
        {shouldShowNavigation && grouped.map((group) => {
          if (!group.items.length) return null;
          const isOpen = !!openGroups[group.title];
          return (
            <div key={group.title} className="space-y-2">
              <button
                type="button"
                onClick={() => toggleGroup(group.title)}
                className="w-full flex items-center justify-between px-3"
              >
                <div className="px-0 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {group.title}
                </div>
                <ChevronDown
                  className={cn('h-4 w-4 text-gray-400 transform transition-transform', isOpen ? 'rotate-180' : 'rotate-0')}
                />
              </button>

              {isOpen && (
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.href;
                    const to = buildHref(item.href);
                    return (
                      <Link
                        key={item.name}
                        to={to}
                        className={cn(
                          'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                          isActive
                            ? 'bg-primary text-white'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        )}
                      >
                        <item.icon
                          className={cn(
                            'mr-3 h-5 w-5 flex-shrink-0',
                            isActive
                              ? 'text-white'
                              : 'text-gray-400 group-hover:text-gray-500'
                          )}
                        />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {shouldShowNavigation && unassigned.length > 0 && (
          <div className="space-y-2">
            <div className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Otros</div>
            <div className="space-y-1">
              {unassigned.map((item) => {
                const isActive = location.pathname === item.href;
                const to = buildHref(item.href);
                return (
                  <Link
                    key={item.name}
                    to={to}
                    className={cn(
                      'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'mr-3 h-5 w-5 flex-shrink-0',
                        isActive
                          ? 'text-white'
                          : 'text-gray-400 group-hover:text-gray-500'
                      )}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100"
          onClick={() => {
            logout();
            window.location.href = '/';
          }}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
}