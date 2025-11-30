import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
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

const navigationSuperAdmin = [
  {
    name: 'Dashboard Global',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    roles: ['SUPER_ADMIN']
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
    name: 'Dashboard',
    href: '/admin/cooperativa-dashboard',
    icon: LayoutDashboard,
    roles: ['ADMIN']
  },
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
  const { user, logout } = useAuth();

  // Filtrar navegación según el rol del usuario
  const getNavigation = () => {
    if (user?.role === 'SUPER_ADMIN') {
      return [...navigationSuperAdmin, ...navigationAdmin];
    }

    return navigationAdmin.filter(item =>
      item.roles.includes(user?.role)
    );
  };

  const navigation = getNavigation();

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
      // por defecto, todas contraídas
      map[g.title] = false;
    });
    return map;
  });

  const toggleGroup = (title) => {
    setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200">
      {/* Navigation grouped */}
      <nav className="flex-1 px-4 py-6 space-y-4 overflow-y-auto">
        {grouped.map((group) => {
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
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
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

        {unassigned.length > 0 && (
          <div className="space-y-2">
            <div className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Otros</div>
            <div className="space-y-1">
              {unassigned.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
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