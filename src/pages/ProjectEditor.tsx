import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  ExternalLink,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
  LayoutGrid,
  Sparkles,
  Sliders,
  Upload,
  Layers,
  CheckCircle2,
  FolderTree,
  Eye,
  Lock,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { confirmDeleteAlert, showSuccessToast, showErrorAlert } from '../utils/alerts';

interface ImageSlot {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  link?: string;
}

interface Block {
  id: string;
  type: 'HERO' | 'IMAGE_GRID' | 'FEATURES' | 'CTA' | 'TEXT';
  content: Record<string, any>;
  styles?: Record<string, any>;
}

interface ProjectData {
  id: string;
  title: string;
  slug: string;
  routePrefix: string;
  description: string;
  published: boolean;
  authEnabled: boolean;
  blocks: Block[];
  settings?: Record<string, any>;
}

const LAYOUT_MODES = [
  { value: 'grid-2', label: '2 Columnas (50 / 50)', icon: '◫' },
  { value: 'grid-3', label: '3 Columnas', icon: '☷' },
  { value: 'bento', label: 'Bento Asimétrico (Apple Style)', icon: '⊞' },
  { value: 'banner', label: 'Banner Panorámico (1 Columna)', icon: '▭' },
];

export const ProjectEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { superAdmin } = useAuth();

  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'builder'>('builder');
  const [uploadingSlotId, setUploadingSlotId] = useState<string | null>(null);

  // Form states for general settings
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [routePrefix, setRoutePrefix] = useState('sitio');
  const [published, setPublished] = useState(true);
  const [authEnabled, setAuthEnabled] = useState(true);
  const [coverImage, setCoverImage] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);

  // Blocks state
  const [blocks, setBlocks] = useState<Block[]>([]);

  useEffect(() => {
    if (!superAdmin) {
      navigate('/login');
      return;
    }

    const fetchProject = async () => {
      try {
        const res = await api.get(`/projects/${id}`);
        const data = res.data.project;
        setProject(data);
        setTitle(data.title);
        setDescription(data.description || '');
        setRoutePrefix(data.routePrefix || 'sitio');
        setPublished(data.published);
        setAuthEnabled(data.authEnabled);
        setCoverImage(data.settings?.coverImage || '');
        setBlocks(Array.isArray(data.blocks) ? data.blocks : []);
      } catch (err) {
        showErrorAlert('Error', 'No se pudo cargar la información del proyecto.');
        navigate('/admin');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id, superAdmin]);

  // Upload cover image to tenant folder
  const handleUploadCoverImage = async (file: File) => {
    if (!id) return;
    setUploadingCover(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post(`/projects/${id}/upload`, formData);
      const newImageUrl = res.data.url;
      setCoverImage(newImageUrl);

      // Auto-save project settings to persist immediately
      await api.put(`/projects/${id}`, {
        title,
        description,
        routePrefix,
        published,
        authEnabled,
        blocks,
        settings: {
          ...(project?.settings || {}),
          coverImage: newImageUrl,
        },
      });

      showSuccessToast('Imagen guardada', 'La imagen identificadora se subió y guardó en la carpeta del cliente.');
    } catch (err: any) {
      showErrorAlert('Error al subir', err.response?.data?.message || 'No se pudo subir la imagen.');
    } finally {
      setUploadingCover(false);
    }
  };

  // Save all changes
  const handleSaveChanges = async () => {
    if (!id) return;
    setSaving(true);

    try {
      await api.put(`/projects/${id}`, {
        title,
        description,
        routePrefix,
        published,
        authEnabled,
        blocks,
        settings: {
          ...(project?.settings || {}),
          coverImage,
        },
      });

      showSuccessToast('Guardado', 'Los cambios y bloques se sincronizaron con éxito.');
    } catch (err: any) {
      showErrorAlert('Error al guardar', err.response?.data?.message || 'Ocurrió un error al guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  // Block management
  const handleAddBlock = (type: Block['type']) => {
    let newBlock: Block;

    if (type === 'HERO') {
      newBlock = {
        id: 'hero-' + Date.now(),
        type: 'HERO',
        content: {
          title: 'Nuevo Título Hero',
          subtitle: 'Descripción destacada del encabezado principal.',
          ctaText: 'Descubrir más',
        },
      };
    } else if (type === 'IMAGE_GRID') {
      newBlock = {
        id: 'img-grid-' + Date.now(),
        type: 'IMAGE_GRID',
        content: {
          layout: 'bento',
          slots: [
            {
              id: 'slot-1',
              imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1000&q=80',
              title: 'Posición Principal',
              subtitle: 'Destacado de alta visibilidad',
            },
            {
              id: 'slot-2',
              imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
              title: 'Posición Superior',
              subtitle: 'Tarjeta complementaria',
            },
            {
              id: 'slot-3',
              imageUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=600&q=80',
              title: 'Posición Inferior',
              subtitle: 'Módulo lateral',
            },
          ],
        },
      };
    } else if (type === 'FEATURES') {
      newBlock = {
        id: 'feat-' + Date.now(),
        type: 'FEATURES',
        content: {
          items: [
            { title: 'Característica 1', desc: 'Descripción de la funcionalidad o servicio.' },
            { title: 'Característica 2', desc: 'Descripción de la funcionalidad o servicio.' },
            { title: 'Característica 3', desc: 'Descripción de la funcionalidad o servicio.' },
          ],
        },
      };
    } else if (type === 'CTA') {
      newBlock = {
        id: 'cta-' + Date.now(),
        type: 'CTA',
        content: {
          title: '¿Listo para comenzar?',
          subtitle: 'Únete a nuestra plataforma y transforma tu experiencia.',
          buttonText: 'Contáctanos',
        },
      };
    } else {
      newBlock = {
        id: 'text-' + Date.now(),
        type: 'TEXT',
        content: {
          text: 'Escribe aquí tu contenido o párrafo descriptivo detallado.',
        },
      };
    }

    setBlocks([...blocks, newBlock]);
    showSuccessToast('Bloque añadido', `Se agregó un bloque de tipo ${type}`);
  };

  const handleRemoveBlock = async (blockIndex: number) => {
    const confirmed = await confirmDeleteAlert(`Bloque #${blockIndex + 1}`);
    if (!confirmed) return;
    const updated = blocks.filter((_, idx) => idx !== blockIndex);
    setBlocks(updated);
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...blocks];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setBlocks(updated);
  };

  // Image upload handler for an image slot
  const handleUploadImage = async (blockIndex: number, slotIndex: number, file: File) => {
    if (!id) return;
    const slotId = `${blockIndex}-${slotIndex}`;
    setUploadingSlotId(slotId);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post(`/projects/${id}/upload`, formData);

      const updatedBlocks = [...blocks];
      const block = updatedBlocks[blockIndex];
      if (block && block.content && Array.isArray(block.content.slots)) {
        block.content.slots[slotIndex].imageUrl = res.data.url;
        setBlocks(updatedBlocks);
        showSuccessToast('Imagen subida', 'La imagen se guardó en la carpeta del tenant.');
      }
    } catch (err: any) {
      showErrorAlert('Error al subir', err.response?.data?.message || 'No se pudo subir la imagen.');
    } finally {
      setUploadingSlotId(null);
    }
  };

  if (loading || !project) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const projectUrl = `/${routePrefix || 'sitio'}/${project.slug}`;

  return (
    <div className="min-h-screen bg-black text-[#f5f5f7] flex flex-col selection:bg-blue-500/30">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-black/70 backdrop-blur-2xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin')}
              className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-[#86868b] hover:text-white transition-all cursor-pointer border border-white/10"
              title="Volver al Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[15px] text-white tracking-tight">{title || project.title}</span>
                <span className="text-[11px] bg-white/[0.08] text-blue-400 border border-white/10 px-2 py-0.5 rounded-full font-mono">
                  {projectUrl}
                </span>
              </div>
              <p className="text-[11px] text-[#86868b] hidden sm:block">Editor Visual & Page Builder</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={projectUrl}
              target="_blank"
              className="bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white text-xs py-2 px-3.5 rounded-full font-medium flex items-center gap-1.5 transition-all border border-white/10"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ver Sitio</span>
            </Link>

            <button
              onClick={handleSaveChanges}
              disabled={saving}
              className="apple-button-primary text-xs font-medium px-5 py-2 rounded-full flex items-center gap-1.5 cursor-pointer shadow-lg disabled:opacity-50"
            >
              {saving ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tabs Pill Selector */}
      <div className="max-w-6xl w-full mx-auto px-6 pt-6">
        <div className="bg-zinc-900/80 p-1 rounded-full border border-white/10 flex max-w-sm backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setActiveTab('builder')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'builder'
                ? 'bg-zinc-800 text-white shadow-sm border border-white/10'
                : 'text-[#86868b] hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Constructor de Bloques</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'general'
                ? 'bg-zinc-800 text-white shadow-sm border border-white/10'
                : 'text-[#86868b] hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Ajustes Generales</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        {/* TAB 1: GENERAL SETTINGS */}
        {activeTab === 'general' && (
          <div className="max-w-2xl apple-card rounded-3xl p-8 space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl font-semibold text-white">Configuración General del Sitio</h2>
              <p className="text-xs text-[#86868b] mt-1">
                Ajusta el título, descripción, permisos de login y la ruta base del proyecto.
              </p>
            </div>

            <div className="space-y-4">
              {/* Imagen Identificadora del Sitio / Tenant */}
              <div>
                <label className="block text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-1.5 pl-1">
                  Imagen Identificadora / Portada del Sitio
                </label>
                
                <div className="bg-black/60 border border-white/10 rounded-2xl p-4 space-y-3">
                  <div className="relative aspect-video sm:aspect-[21/9] rounded-xl overflow-hidden bg-zinc-900 border border-white/10 group/cover">
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt="Portada del sitio"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 p-6 text-center">
                        <ImageIcon className="w-8 h-8 mb-2 text-zinc-600" />
                        <span className="text-xs font-medium text-zinc-400">Sin imagen identificadora</span>
                        <span className="text-[11px] text-zinc-600 mt-0.5">
                          Sube una imagen para identificar rápidamente este sitio en el dashboard y cabeceras
                        </span>
                      </div>
                    )}

                    {/* Upload hover overlay */}
                    <label className="absolute inset-0 bg-black/70 opacity-0 group-hover/cover:opacity-100 flex flex-col items-center justify-center text-white text-xs cursor-pointer transition-opacity backdrop-blur-xs">
                      <Upload className="w-5 h-5 mb-1.5 text-blue-400" />
                      <span className="font-medium">
                        {uploadingCover ? 'Subiendo a la carpeta del cliente...' : 'Subir o cambiar imagen'}
                      </span>
                      <span className="text-[10px] text-zinc-400 mt-1">
                        Se guardará en /storage/tenants/{routePrefix}/{project.slug}/uploads/
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingCover}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadCoverImage(file);
                        }}
                      />
                    </label>
                  </div>

                  {/* Actions & Path info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono truncate">
                      <FolderTree className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                      <span className="truncate">
                        storage/tenants/{routePrefix}/{project.slug}/uploads/
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {coverImage && (
                        <button
                          type="button"
                          onClick={() => setCoverImage('')}
                          className="text-xs text-red-400 hover:text-red-300 p-1 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Quitar</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Manual URL input fallback */}
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                      O pegar URL directa de imagen
                    </label>
                    <input
                      type="text"
                      value={coverImage}
                      onChange={(e) => setCoverImage(e.target.value)}
                      placeholder="https://images.unsplash.com/... o ruta local"
                      className="apple-input w-full rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-600 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-1.5 pl-1">
                  Título del Proyecto
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="apple-input w-full rounded-2xl px-4 py-2.5 text-sm text-white placeholder-zinc-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-1.5 pl-1">
                  Descripción
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="apple-input w-full rounded-2xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-1.5 pl-1">
                  Prefijo de Ruta (Carpeta Web)
                </label>
                <div className="flex items-center">
                  <span className="bg-white/[0.05] border border-r-0 border-white/10 text-blue-400 px-3 py-2.5 rounded-l-2xl text-xs font-mono font-medium">
                    /
                  </span>
                  <input
                    type="text"
                    value={routePrefix}
                    onChange={(e) => setRoutePrefix(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="apple-input w-full rounded-r-2xl px-3.5 py-2.5 text-sm text-white font-mono"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1 pl-1 font-mono">
                  Ruta actual: <span className="text-zinc-300">/{routePrefix}/{project.slug}</span>
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-3 border-t border-white/[0.08]">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    className="rounded-md bg-zinc-900 border-white/20 text-blue-500 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-medium text-white block">Sitio Publicado</span>
                    <span className="text-xs text-[#86868b] block">Permite el acceso público a la sub-página.</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={authEnabled}
                    onChange={(e) => setAuthEnabled(e.target.checked)}
                    className="rounded-md bg-zinc-900 border-white/20 text-blue-500 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-medium text-white block">Habilitar Login de Tenant / Sub-Admin</span>
                    <span className="text-xs text-[#86868b] block">Permite que el sitio tenga su propio sistema de usuarios.</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VISUAL PAGE BUILDER & IMAGE POSITIONS CONTAINER */}
        {activeTab === 'builder' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Top Toolbar: Add Block buttons */}
            <div className="apple-card rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-white">Añadir Componentes a la Página</h3>
                <p className="text-xs text-[#86868b] mt-0.5">
                  Inserta bloques dinámicos y contenedores de imágenes en varias posiciones.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleAddBlock('IMAGE_GRID')}
                  className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs px-3.5 py-2 rounded-full font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>+ Contenedor Imágenes</span>
                </button>

                <button
                  onClick={() => handleAddBlock('HERO')}
                  className="bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/10 text-xs px-3.5 py-2 rounded-full font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Hero</span>
                </button>

                <button
                  onClick={() => handleAddBlock('FEATURES')}
                  className="bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/10 text-xs px-3.5 py-2 rounded-full font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Características</span>
                </button>

                <button
                  onClick={() => handleAddBlock('CTA')}
                  className="bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/10 text-xs px-3.5 py-2 rounded-full font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ CTA</span>
                </button>
              </div>
            </div>

            {/* Blocks List */}
            {blocks.length === 0 ? (
              <div className="apple-card rounded-3xl p-16 text-center">
                <Layers className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
                <h4 className="text-base font-semibold text-white">Tu página no tiene bloques aún</h4>
                <p className="text-xs text-[#86868b] max-w-sm mx-auto mt-1 mb-5">
                  Haz clic en cualquiera de los botones superiores para añadir un contenedor de imágenes o secciones.
                </p>
                <button
                  onClick={() => handleAddBlock('IMAGE_GRID')}
                  className="apple-button-primary text-xs font-medium px-4 py-2 rounded-full cursor-pointer"
                >
                  Añadir Contenedor de Imágenes
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {blocks.map((block, blockIndex) => (
                  <div
                    key={block.id}
                    className="apple-card rounded-3xl p-6 relative border border-white/10 hover:border-white/20 transition-all"
                  >
                    {/* Block Header Toolbar */}
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 mb-6">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-white/[0.06] text-xs font-mono flex items-center justify-center text-zinc-400">
                          {blockIndex + 1}
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                          {block.type === 'IMAGE_GRID' && 'Contenedor Multipolar de Imágenes'}
                          {block.type === 'HERO' && 'Encabezado Hero'}
                          {block.type === 'FEATURES' && 'Cuadrícula de Características'}
                          {block.type === 'CTA' && 'Llamada a la Acción (CTA)'}
                          {block.type === 'TEXT' && 'Párrafo de Contenido'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMoveBlock(blockIndex, 'up')}
                          disabled={blockIndex === 0}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                          title="Mover arriba"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleMoveBlock(blockIndex, 'down')}
                          disabled={blockIndex === blocks.length - 1}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                          title="Mover abajo"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleRemoveBlock(blockIndex)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer ml-2"
                          title="Eliminar bloque"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* BLOCK TYPE: IMAGE_GRID (CONTENEDOR DE POSICIONES PARA IMAGENES) */}
                    {block.type === 'IMAGE_GRID' && (
                      <div className="space-y-6">
                        {/* Layout Mode Selector */}
                        <div>
                          <label className="block text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-2">
                            Disposición de Posiciones (Layout)
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {LAYOUT_MODES.map((mode) => (
                              <button
                                key={mode.value}
                                type="button"
                                onClick={() => {
                                  const updated = [...blocks];
                                  updated[blockIndex].content.layout = mode.value;
                                  setBlocks(updated);
                                }}
                                className={`py-2 px-3 text-xs rounded-2xl font-medium flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                                  block.content.layout === mode.value
                                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/40 shadow-sm'
                                    : 'bg-white/[0.04] text-zinc-400 border-white/[0.08] hover:bg-white/[0.08] hover:text-white'
                                }`}
                              >
                                <span>{mode.icon}</span>
                                <span>{mode.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Slots Editor */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white">Posiciones del Contenedor:</span>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...blocks];
                                const currentSlots = updated[blockIndex].content.slots || [];
                                currentSlots.push({
                                  id: 'slot-' + Date.now(),
                                  imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
                                  title: `Posición #${currentSlots.length + 1}`,
                                  subtitle: 'Descripción de la imagen',
                                });
                                updated[blockIndex].content.slots = currentSlots;
                                setBlocks(updated);
                              }}
                              className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Añadir Posición</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Array.isArray(block.content.slots) &&
                              block.content.slots.map((slot: ImageSlot, slotIndex: number) => {
                                const slotKey = `${blockIndex}-${slotIndex}`;
                                const isUploading = uploadingSlotId === slotKey;

                                return (
                                  <div
                                    key={slot.id || slotIndex}
                                    className="bg-black/60 border border-white/10 rounded-2xl p-4 space-y-3 relative group/slot"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-semibold text-blue-400 font-mono">
                                        Slot #{slotIndex + 1}
                                      </span>
                                      {block.content.slots.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const updated = [...blocks];
                                            updated[blockIndex].content.slots = updated[blockIndex].content.slots.filter(
                                              (_: any, idx: number) => idx !== slotIndex
                                            );
                                            setBlocks(updated);
                                          }}
                                          className="text-zinc-500 hover:text-red-400 p-1 cursor-pointer"
                                          title="Eliminar este slot"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>

                                    {/* Image Preview & Upload */}
                                    <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-white/10 group/img">
                                      {slot.imageUrl ? (
                                        <img
                                          src={slot.imageUrl}
                                          alt={slot.title || 'Slot image'}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500">
                                          <ImageIcon className="w-6 h-6 mb-1" />
                                          <span className="text-[11px]">Sin imagen</span>
                                        </div>
                                      )}

                                      {/* Upload overlay */}
                                      <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex flex-col items-center justify-center text-white text-xs cursor-pointer transition-opacity backdrop-blur-xs">
                                        <Upload className="w-4 h-4 mb-1" />
                                        <span>{isUploading ? 'Subiendo...' : 'Subir archivo'}</span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleUploadImage(blockIndex, slotIndex, file);
                                          }}
                                        />
                                      </label>
                                    </div>

                                    {/* URL Input */}
                                    <div>
                                      <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                                        O URL de Imagen
                                      </label>
                                      <input
                                        type="text"
                                        value={slot.imageUrl}
                                        onChange={(e) => {
                                          const updated = [...blocks];
                                          updated[blockIndex].content.slots[slotIndex].imageUrl = e.target.value;
                                          setBlocks(updated);
                                        }}
                                        placeholder="https://..."
                                        className="apple-input w-full rounded-xl px-2.5 py-1.5 text-xs text-white"
                                      />
                                    </div>

                                    {/* Title & Subtitle */}
                                    <div>
                                      <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                                        Título del Slot
                                      </label>
                                      <input
                                        type="text"
                                        value={slot.title || ''}
                                        onChange={(e) => {
                                          const updated = [...blocks];
                                          updated[blockIndex].content.slots[slotIndex].title = e.target.value;
                                          setBlocks(updated);
                                        }}
                                        placeholder="Ej. Producto Estrella"
                                        className="apple-input w-full rounded-xl px-2.5 py-1.5 text-xs text-white"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                                        Subtítulo / Texto
                                      </label>
                                      <input
                                        type="text"
                                        value={slot.subtitle || ''}
                                        onChange={(e) => {
                                          const updated = [...blocks];
                                          updated[blockIndex].content.slots[slotIndex].subtitle = e.target.value;
                                          setBlocks(updated);
                                        }}
                                        placeholder="Breve descripción"
                                        className="apple-input w-full rounded-xl px-2.5 py-1.5 text-xs text-white"
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* BLOCK TYPE: HERO */}
                    {block.type === 'HERO' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-1">
                            Título Principal
                          </label>
                          <input
                            type="text"
                            value={block.content.title || ''}
                            onChange={(e) => {
                              const updated = [...blocks];
                              updated[blockIndex].content.title = e.target.value;
                              setBlocks(updated);
                            }}
                            className="apple-input w-full rounded-2xl px-3.5 py-2 text-sm text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-1">
                            Subtítulo
                          </label>
                          <textarea
                            value={block.content.subtitle || ''}
                            onChange={(e) => {
                              const updated = [...blocks];
                              updated[blockIndex].content.subtitle = e.target.value;
                              setBlocks(updated);
                            }}
                            rows={2}
                            className="apple-input w-full rounded-2xl px-3.5 py-2 text-sm text-white resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-1">
                            Texto del Botón CTA
                          </label>
                          <input
                            type="text"
                            value={block.content.ctaText || ''}
                            onChange={(e) => {
                              const updated = [...blocks];
                              updated[blockIndex].content.ctaText = e.target.value;
                              setBlocks(updated);
                            }}
                            className="apple-input w-full rounded-2xl px-3.5 py-2 text-sm text-white"
                          />
                        </div>
                      </div>
                    )}

                    {/* BLOCK TYPE: FEATURES */}
                    {block.type === 'FEATURES' && (
                      <div className="space-y-4">
                        <span className="text-xs font-semibold text-white">Elementos de la Cuadrícula:</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {Array.isArray(block.content.items) &&
                            block.content.items.map((item: any, itemIndex: number) => (
                              <div key={itemIndex} className="bg-black/50 border border-white/10 rounded-2xl p-4 space-y-2">
                                <span className="text-[10px] font-mono text-zinc-500">Item #{itemIndex + 1}</span>
                                <input
                                  type="text"
                                  value={item.title || ''}
                                  onChange={(e) => {
                                    const updated = [...blocks];
                                    updated[blockIndex].content.items[itemIndex].title = e.target.value;
                                    setBlocks(updated);
                                  }}
                                  placeholder="Título"
                                  className="apple-input w-full rounded-xl px-2.5 py-1.5 text-xs text-white"
                                />
                                <textarea
                                  value={item.desc || ''}
                                  onChange={(e) => {
                                    const updated = [...blocks];
                                    updated[blockIndex].content.items[itemIndex].desc = e.target.value;
                                    setBlocks(updated);
                                  }}
                                  placeholder="Descripción"
                                  rows={2}
                                  className="apple-input w-full rounded-xl px-2.5 py-1.5 text-xs text-white resize-none"
                                />
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* BLOCK TYPE: CTA */}
                    {block.type === 'CTA' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-1">
                            Título CTA
                          </label>
                          <input
                            type="text"
                            value={block.content.title || ''}
                            onChange={(e) => {
                              const updated = [...blocks];
                              updated[blockIndex].content.title = e.target.value;
                              setBlocks(updated);
                            }}
                            className="apple-input w-full rounded-2xl px-3.5 py-2 text-sm text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-1">
                            Texto del Botón
                          </label>
                          <input
                            type="text"
                            value={block.content.buttonText || ''}
                            onChange={(e) => {
                              const updated = [...blocks];
                              updated[blockIndex].content.buttonText = e.target.value;
                              setBlocks(updated);
                            }}
                            className="apple-input w-full rounded-2xl px-3.5 py-2 text-sm text-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
