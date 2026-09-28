import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layers, ArrowRight, Lock, UserCheck, Sparkles, ExternalLink } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface ImageSlot {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  link?: string;
}

interface Block {
  id: string;
  type: string;
  content: Record<string, any>;
  styles?: Record<string, any>;
}

interface ProjectData {
  id: string;
  slug: string;
  routePrefix?: string;
  title: string;
  description?: string;
  published: boolean;
  authEnabled: boolean;
  blocks: Block[];
  settings?: Record<string, any>;
}

export const ProjectSiteView: React.FC = () => {
  const { prefix, slug } = useParams<{ prefix?: string; slug?: string }>();
  const effectiveSlug = slug || prefix; // Supports both /:prefix/:slug and /sitio/:slug
  const { projectUser, logoutProjectUser } = useAuth();

  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSite = async () => {
      if (!effectiveSlug) return;
      try {
        const res = await api.get(`/projects/public/${effectiveSlug}`);
        setProject(res.data.project);
      } catch (err: any) {
        setError(err.response?.data?.message || 'No se pudo cargar la página');
      } finally {
        setLoading(false);
      }
    };

    loadSite();
  }, [effectiveSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center text-[#f5f5f7]">
        <div className="w-14 h-14 rounded-3xl bg-white/[0.05] border border-white/10 text-zinc-400 flex items-center justify-center mb-4">
          <Layers className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-semibold text-white mb-2">Página no encontrada</h1>
        <p className="text-[#86868b] text-sm max-w-sm mb-6">{error}</p>
        <Link to="/login" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
          Ir al Inicio
        </Link>
      </div>
    );
  }

  const activePrefix = project.routePrefix || prefix || 'sitio';

  return (
    <div className="min-h-screen bg-black text-[#f5f5f7] flex flex-col selection:bg-blue-500/30">
      {/* Site Frosted Navbar */}
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-black/60 backdrop-blur-2xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {project.settings?.coverImage ? (
              <img
                src={project.settings.coverImage}
                alt={project.title}
                className="w-7 h-7 rounded-lg object-cover border border-white/15 shadow-sm"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-b from-zinc-700 to-zinc-900 border border-white/15 flex items-center justify-center font-semibold text-white text-xs">
                {project.title.charAt(0)}
              </div>
            )}
            <span className="font-semibold text-[15px] tracking-tight text-white">{project.title}</span>
          </div>

          <div className="flex items-center gap-3">
            {project.authEnabled && (
              <>
                {projectUser && projectUser.projectSlug === project.slug ? (
                  <div className="flex items-center gap-2.5 bg-white/[0.06] border border-white/10 rounded-full px-3.5 py-1.5 text-xs">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-zinc-300 font-medium">{projectUser.name}</span>
                    <button
                      onClick={logoutProjectUser}
                      className="text-[#86868b] hover:text-white ml-1.5 cursor-pointer text-[11px]"
                    >
                      Salir
                    </button>
                  </div>
                ) : (
                  <Link
                    to={`/${activePrefix}/${project.slug}/login`}
                    className="apple-button-primary text-xs font-medium px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Login</span>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Dynamic Blocks Renderer */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-16 w-full space-y-24">
        {Array.isArray(project.blocks) && project.blocks.length > 0 ? (
          project.blocks.map((block) => (
            <div key={block.id} className="relative">
              {/* 1. APPLE HERO BLOCK */}
              {block.type === 'HERO' && (
                <div className="text-center py-20 px-6 rounded-3xl relative overflow-hidden">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-b from-blue-600/15 via-indigo-600/5 to-transparent rounded-full blur-[140px] pointer-events-none" />
                  
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-xs text-[#86868b] mb-6 backdrop-blur-md">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>Experiencia Modular</span>
                  </div>

                  <h1 className="text-4xl sm:text-6xl font-semibold text-white tracking-tight max-w-3xl mx-auto leading-tight">
                    {block.content.title || project.title}
                  </h1>

                  <p className="text-lg sm:text-xl text-[#86868b] max-w-xl mx-auto mt-5 font-normal leading-relaxed">
                    {block.content.subtitle || project.description}
                  </p>

                  {block.content.ctaText && (
                    <div className="mt-8 flex justify-center">
                      <button className="apple-button-primary font-medium px-6 py-3 rounded-full inline-flex items-center gap-2 cursor-pointer shadow-lg text-sm">
                        <span>{block.content.ctaText}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 2. IMAGE POSITIONS CONTAINER (IMAGE_GRID) */}
              {block.type === 'IMAGE_GRID' && Array.isArray(block.content.slots) && (
                <div>
                  {/* BENTO ASYMMETRIC LAYOUT */}
                  {block.content.layout === 'bento' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {block.content.slots.map((slot: ImageSlot, idx: number) => {
                        const isMain = idx === 0;
                        return (
                          <div
                            key={slot.id || idx}
                            className={`apple-card rounded-3xl overflow-hidden relative group/card flex flex-col justify-end min-h-[300px] ${
                              isMain ? 'md:col-span-2 md:row-span-2 md:min-h-[460px]' : 'md:min-h-[220px]'
                            }`}
                          >
                            <img
                              src={slot.imageUrl}
                              alt={slot.title || 'Gallery image'}
                              className="absolute inset-0 w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700 ease-out"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                            <div className="relative p-6 z-10">
                              {slot.title && (
                                <h3 className={`font-semibold text-white tracking-tight ${isMain ? 'text-2xl' : 'text-lg'}`}>
                                  {slot.title}
                                </h3>
                              )}
                              {slot.subtitle && (
                                <p className="text-xs sm:text-sm text-zinc-300 mt-1 font-normal">
                                  {slot.subtitle}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 2 COLUMNS LAYOUT */}
                  {block.content.layout === 'grid-2' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {block.content.slots.map((slot: ImageSlot, idx: number) => (
                        <div
                          key={slot.id || idx}
                          className="apple-card rounded-3xl overflow-hidden relative group/card min-h-[340px] flex flex-col justify-end"
                        >
                          <img
                            src={slot.imageUrl}
                            alt={slot.title || 'Image'}
                            className="absolute inset-0 w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700 ease-out"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                          <div className="relative p-6 z-10">
                            {slot.title && <h3 className="font-semibold text-xl text-white">{slot.title}</h3>}
                            {slot.subtitle && <p className="text-xs sm:text-sm text-zinc-300 mt-1">{slot.subtitle}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 3 COLUMNS LAYOUT */}
                  {block.content.layout === 'grid-3' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {block.content.slots.map((slot: ImageSlot, idx: number) => (
                        <div
                          key={slot.id || idx}
                          className="apple-card rounded-3xl overflow-hidden relative group/card min-h-[280px] flex flex-col justify-end"
                        >
                          <img
                            src={slot.imageUrl}
                            alt={slot.title || 'Image'}
                            className="absolute inset-0 w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700 ease-out"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                          <div className="relative p-6 z-10">
                            {slot.title && <h3 className="font-semibold text-lg text-white">{slot.title}</h3>}
                            {slot.subtitle && <p className="text-xs text-zinc-300 mt-1">{slot.subtitle}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* PANORAMIC BANNER LAYOUT */}
                  {block.content.layout === 'banner' && (
                    <div className="space-y-6">
                      {block.content.slots.map((slot: ImageSlot, idx: number) => (
                        <div
                          key={slot.id || idx}
                          className="apple-card rounded-3xl overflow-hidden relative group/card min-h-[320px] flex flex-col justify-end"
                        >
                          <img
                            src={slot.imageUrl}
                            alt={slot.title || 'Banner'}
                            className="absolute inset-0 w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700 ease-out"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                          <div className="relative p-8 z-10 max-w-xl">
                            {slot.title && <h3 className="font-semibold text-2xl sm:text-3xl text-white">{slot.title}</h3>}
                            {slot.subtitle && <p className="text-sm text-zinc-300 mt-2">{slot.subtitle}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 3. APPLE FEATURES BLOCK (BENTO GRID) */}
              {block.type === 'FEATURES' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Array.isArray(block.content.items) &&
                    block.content.items.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="apple-card rounded-3xl p-8 flex flex-col justify-between transition-all duration-300"
                      >
                        <div>
                          <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-blue-400 mb-5">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <h3 className="font-semibold text-lg text-white mb-2">{item.title}</h3>
                          <p className="text-sm text-[#86868b] leading-relaxed font-normal">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* 4. CTA BANNER BLOCK */}
              {block.type === 'CTA' && (
                <div className="apple-glass rounded-3xl p-10 text-center relative overflow-hidden">
                  <h3 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                    {block.content.title || '¿Listo para dar el siguiente paso?'}
                  </h3>
                  {block.content.subtitle && (
                    <p className="text-sm text-[#86868b] max-w-md mx-auto mt-2">
                      {block.content.subtitle}
                    </p>
                  )}
                  {block.content.buttonText && (
                    <button className="apple-button-primary mt-6 px-6 py-2.5 rounded-full text-xs font-medium cursor-pointer shadow-lg">
                      {block.content.buttonText}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-20 text-[#86868b]">
            Este sitio aún no tiene bloques configurados.
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 text-center text-xs text-[#86868b]">
        PuvloBuilder Platform • Tenant: <span className="text-zinc-400">/{activePrefix}/{project.slug}</span>
      </footer>
    </div>
  );
};
