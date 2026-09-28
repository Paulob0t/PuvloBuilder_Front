import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus,
  Layers,
  Users,
  ExternalLink,
  LogOut,
  Sparkles,
  Trash2,
  Lock,
  Command,
  ChevronRight,
  X,
  FolderTree,
  Edit3,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { confirmDeleteAlert, showSuccessToast, showErrorAlert } from '../utils/alerts';

interface Project {
  id: string;
  slug: string;
  routePrefix?: string;
  title: string;
  description?: string;
  published: boolean;
  authEnabled: boolean;
  blocks: any[];
  settings?: {
    coverImage?: string;
    [key: string]: any;
  };
  _count: {
    users: number;
    submissions: number;
  };
  createdAt: string;
}

const PREFIX_PRESETS = [
  { label: 'Sitio (/sitio/)', value: 'sitio' },
  { label: 'App (/app/)', value: 'app' },
  { label: 'Tienda (/tienda/)', value: 'tienda' },
  { label: 'Evento (/evento/)', value: 'evento' },
  { label: 'Landing (/landing/)', value: 'landing' },
  { label: 'Portal (/portal/)', value: 'portal' },
  { label: 'Personalizado', value: 'custom' },
];

export const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { superAdmin, logoutSuperAdmin } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [selectedPrefixPreset, setSelectedPrefixPreset] = useState('sitio');
  const [customPrefix, setCustomPrefix] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newAuthEnabled, setNewAuthEnabled] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const activePrefix = selectedPrefixPreset === 'custom' ? customPrefix : selectedPrefixPreset;

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data.projects);
    } catch {
      logoutSuperAdmin();
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!superAdmin) {
      navigate('/login');
      return;
    }
    fetchProjects();
  }, [superAdmin]);

  const handleTitleChange = (val: string) => {
    setNewTitle(val);
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    setNewSlug(generatedSlug);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setCreating(true);

    const prefixToUse = (selectedPrefixPreset === 'custom' ? customPrefix : selectedPrefixPreset)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '') || 'sitio';

    try {
      await api.post('/projects', {
        title: newTitle,
        slug: newSlug,
        routePrefix: prefixToUse,
        description: newDescription,
        published: true,
        authEnabled: newAuthEnabled,
        blocks: [
          {
            id: 'b-' + Date.now(),
            type: 'HERO',
            content: {
              title: newTitle,
              subtitle: newDescription || 'Diseñado con la elegancia y fluidez de la nueva generación.',
              ctaText: 'Descubrir más',
            },
          },
          {
            id: 'b-feat-' + Date.now(),
            type: 'FEATURES',
            content: {
              items: [
                { title: 'Rendimiento Extremo', desc: 'Optimizado con Fastify y Vite para respuestas en microsegundos.' },
                { title: 'Modularidad Pura', desc: 'Configuración de bloques dinámicos JSON en MariaDB.' },
                { title: 'Seguridad Multi-Tenant', desc: 'Sesiones y autenticación aisladas por proyecto.' }
              ]
            }
          }
        ],
      });

      setShowCreateModal(false);
      setNewTitle('');
      setNewSlug('');
      setNewDescription('');
      setSelectedPrefixPreset('sitio');
      setCustomPrefix('');
      showSuccessToast('Proyecto Creado', `El sitio "/${prefixToUse}/${newSlug}" está listo.`);
      fetchProjects();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Error al crear el proyecto');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (id: string, title: string) => {
    const confirmed = await confirmDeleteAlert(title);
    if (!confirmed) return;
    try {
      await api.delete(`/projects/${id}`);
      showSuccessToast('Proyecto Eliminado', `"${title}" ha sido eliminado.`);
      fetchProjects();
    } catch {
      showErrorAlert('Error al eliminar', 'No se pudo eliminar el proyecto. Intenta nuevamente.');
    }
  };

  return (
    <div className="min-h-screen bg-black text-[#f5f5f7] flex flex-col selection:bg-blue-500/30">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[300px] bg-gradient-to-b from-blue-600/10 via-transparent to-transparent blur-[120px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-black/60 backdrop-blur-2xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-zinc-700 to-zinc-900 border border-white/15 flex items-center justify-center shadow-lg">
              <Command className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[15px] tracking-tight text-white">
                PuvloBuilder
              </span>
              <span className="text-[11px] bg-white/[0.08] text-[#86868b] border border-white/10 px-2 py-0.5 rounded-full font-medium">
                Admin
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-[13px] font-medium text-white">{superAdmin?.name}</div>
              <div className="text-[11px] text-[#86868b]">{superAdmin?.email}</div>
            </div>
            <button
              onClick={() => {
                logoutSuperAdmin();
                navigate('/login');
              }}
              className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-[#86868b] hover:text-white transition-all duration-200 cursor-pointer border border-white/10"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 z-10">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div>
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              Control Maestro
            </span>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white mt-1">
              Proyectos & Sitios
            </h1>
            <p className="text-[14px] text-[#86868b] mt-1.5 max-w-xl">
              Administra tus páginas modulares, carpetas de ruta configurables y usuarios independientes por tenant.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="apple-button-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm cursor-pointer shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Proyecto</span>
          </button>
        </div>

        {/* Projects Bento Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-28">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="apple-card rounded-3xl p-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/10 text-zinc-400 flex items-center justify-center mx-auto mb-4">
              <Layers className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold text-white">Ningún proyecto creado</h3>
            <p className="text-sm text-[#86868b] max-w-sm mx-auto mt-1 mb-6">
              Crea tu primer sub-sitio con su propio prefijo de ruta y renderizado dinámico de bloques.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="apple-button-primary px-5 py-2.5 rounded-full text-xs font-medium cursor-pointer"
            >
              Comenzar ahora
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((proj) => {
              const prefix = proj.routePrefix || 'sitio';
              const projectPath = `/${prefix}/${proj.slug}`;
              const loginPath = `/${prefix}/${proj.slug}/login`;

              return (
                <div
                  key={proj.id}
                  className="apple-card rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between group overflow-hidden"
                >
                  <div>
                    {/* Cover image preview if present */}
                    {proj.settings?.coverImage && (
                      <div className="w-full h-32 -mt-6 -mx-6 mb-4 overflow-hidden relative border-b border-white/10 group-hover:opacity-95 transition-all" style={{ width: 'calc(100% + 3rem)' }}>
                        <img
                          src={proj.settings.coverImage}
                          alt={proj.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      </div>
                    )}

                    {/* Card Top */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white backdrop-blur-md">
                        <Layers className="w-5 h-5 text-zinc-300" />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                            proj.published
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {proj.published ? 'Publicado' : 'Borrador'}
                        </span>

                        <button
                          onClick={() => handleDeleteProject(proj.id, proj.title)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 cursor-pointer"
                          title="Eliminar proyecto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-semibold text-lg text-white group-hover:text-blue-400 transition-colors duration-200">
                      {proj.title}
                    </h3>
                    <p className="text-[13px] text-[#86868b] line-clamp-2 mt-1 mb-4 font-normal">
                      {proj.description || 'Sin descripción asignada.'}
                    </p>

                    {/* Route path badge */}
                    <div className="bg-black/50 border border-white/[0.06] rounded-xl px-3 py-1.5 text-xs text-zinc-400 font-mono flex items-center justify-between mb-5">
                      <div className="flex items-center gap-1.5 truncate">
                        <FolderTree className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        <span className="text-zinc-300 truncate">{projectPath}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
                    </div>

                    {/* Metrics Badge Row */}
                    <div className="grid grid-cols-2 gap-2 text-[12px] text-[#86868b] py-3 border-t border-white/[0.06]">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{proj._count?.users || 0} Sub-admins</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{Array.isArray(proj.blocks) ? proj.blocks.length : 0} Bloques</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="pt-4 border-t border-white/[0.06] flex items-center gap-2">
                    <Link
                      to={`/admin/proyectos/${proj.id}/editor`}
                      className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs py-2 px-3 rounded-full text-center font-medium flex items-center justify-center gap-1.5 transition-all duration-200 border border-blue-500/30"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Editar</span>
                    </Link>

                    <Link
                      to={projectPath}
                      target="_blank"
                      className="bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs py-2 px-3 rounded-full text-center font-medium flex items-center justify-center gap-1.5 transition-all duration-200 border border-white/10"
                      title="Abrir vista pública del sitio"
                    >
                      <ExternalLink className="w-3 h-3 text-zinc-400" />
                    </Link>

                    {proj.authEnabled && (
                      <Link
                        to={loginPath}
                        target="_blank"
                        className="bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 text-xs py-2 px-3 rounded-full font-medium flex items-center gap-1.5 transition-all duration-200"
                        title="Login de Sub-Admin del sitio"
                      >
                        <Lock className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Apple Sheet Modal for Creating Project */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="apple-glass rounded-3xl max-w-lg w-full p-7 relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold text-white">Nuevo Proyecto</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-[#86868b] mb-5">
              Configura el nombre, la carpeta base y el slug de acceso.
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-1.5 pl-1">
                  Título del Proyecto
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Ej. Tienda de Sneakers"
                  className="apple-input w-full rounded-2xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600"
                />
              </div>

              {/* Route Prefix Selector */}
              <div>
                <label className="block text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-1.5 pl-1">
                  Prefijo de Ruta / Carpeta Base
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 mb-2">
                  {PREFIX_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setSelectedPrefixPreset(preset.value)}
                      className={`py-1.5 px-2 text-xs rounded-xl font-medium transition-all duration-200 cursor-pointer border ${
                        selectedPrefixPreset === preset.value
                          ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                          : 'bg-white/[0.04] text-zinc-400 border-white/[0.08] hover:bg-white/[0.08] hover:text-white'
                      }`}
                    >
                      {preset.value === 'custom' ? 'Personalizar' : `/${preset.value}`}
                    </button>
                  ))}
                </div>

                {selectedPrefixPreset === 'custom' && (
                  <div className="flex items-center mt-2">
                    <span className="bg-white/[0.05] border border-r-0 border-white/10 text-zinc-500 px-3 py-2 rounded-l-2xl text-xs font-mono">
                      /
                    </span>
                    <input
                      type="text"
                      required
                      value={customPrefix}
                      onChange={(e) => setCustomPrefix(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="mi-carpeta"
                      className="apple-input w-full rounded-r-2xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Slug with dynamic prefix */}
              <div>
                <label className="block text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-1.5 pl-1">
                  Slug (Ruta Final)
                </label>
                <div className="flex items-center">
                  <span className="bg-white/[0.05] border border-r-0 border-white/10 text-blue-400 px-3 py-2.5 rounded-l-2xl text-xs font-mono font-medium">
                    /{activePrefix || 'sitio'}/
                  </span>
                  <input
                    type="text"
                    required
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="sneakers-nike"
                    className="apple-input w-full rounded-r-2xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 font-mono"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1 pl-1 font-mono">
                  URL resultante: <span className="text-zinc-300">/{activePrefix || 'sitio'}/{newSlug || 'tu-slug'}</span>
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-1.5 pl-1">
                  Descripción (Opcional)
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Descripción de este mini sitio..."
                  rows={2}
                  className="apple-input w-full rounded-2xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="authEnabled"
                  checked={newAuthEnabled}
                  onChange={(e) => setNewAuthEnabled(e.target.checked)}
                  className="rounded-md bg-zinc-900 border-white/20 text-blue-500 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="authEnabled" className="text-xs text-[#86868b] cursor-pointer">
                  Habilitar login y sub-administradores propios para este sitio
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="apple-button-primary px-5 py-2 rounded-full text-xs font-medium cursor-pointer disabled:opacity-50"
                >
                  {creating ? 'Creando...' : 'Crear Proyecto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
