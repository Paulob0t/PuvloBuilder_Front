import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
  LayoutGrid,
  Sliders,
  Upload,
  Layers,
  FolderTree,
  Eye,
  Lock,
  Palette,
  KeyRound,
  Sparkles,
  Shield,
  Mail,
  User,
  ArrowRight,
  ExternalLink,
  GripVertical,
  Type as TypeIcon,
  Square,
  AlignLeft,
  AlignCenter,
  AlignRight,
  MousePointer,
  Copy,
  RotateCw,
  Move,
  Maximize2,
  ArrowUp,
  ArrowDown,
  Magnet,
  Link2,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { confirmDeleteAlert, showSuccessToast, showErrorAlert } from '../utils/alerts';

export interface CanvasItem {
  id: string;
  type: 'image' | 'text' | 'button' | 'card';
  colSpan?: number; // 1, 2, 3, 4, 6
  rowSpan?: number; // 1, 2, 3
  x?: number; // 0 to 90 (% in freestyle mode)
  y?: number; // 0 to 90 (% in freestyle mode)
  width?: number; // 15 to 100 (% width in freestyle mode)
  minHeight?: number; // px in freestyle mode
  zIndex?: number; // Layering order
  rotation?: number; // -15 to 15 degrees
  content: {
    imageUrl?: string;
    title?: string;
    subtitle?: string;
    heading?: string;
    bodyText?: string;
    alignment?: 'left' | 'center' | 'right';
    buttonText?: string;
    buttonUrl?: string;
    cardTitle?: string;
    cardDescription?: string;
  };
}

export interface LoginSettings {
  title: string;
  subtitle: string;
  badgeText: string;
  logoUrl: string;
  bgImageUrl: string;
  bgBlur: number;
  bgDarkness: number;
  glowColor: string;
  accentColor: string;
  buttonText: string;
  helpText: string;
  showBackLink: boolean;
}

interface ImageSlot {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  link?: string;
}

interface Block {
  id: string;
  type: 'HERO' | 'IMAGE_GRID' | 'CANVAS_GRID' | 'FEATURES' | 'CTA' | 'TEXT';
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

const GLOW_PRESETS = [
  { label: 'Esmeralda', value: '#10b981' },
  { label: 'Azul Apple', value: '#3b82f6' },
  { label: 'Púrpura Cyber', value: '#8b5cf6' },
  { label: 'Ámbar Cálido', value: '#f59e0b' },
  { label: 'Rosa Neón', value: '#ec4899' },
  { label: 'Rojo Carmesí', value: '#ef4444' },
  { label: 'Plata Minimal', value: '#71717a' },
];

const ACCENT_PRESETS = [
  { label: 'Esmeralda', value: '#059669' },
  { label: 'Azul Eléctrico', value: '#2563eb' },
  { label: 'Índigo', value: '#4f46e5' },
  { label: 'Púrpura', value: '#7c3aed' },
  { label: 'Naranja Vivo', value: '#ea580c' },
  { label: 'Blanco Puro', value: '#ffffff' },
  { label: 'Zinc Obsidiana', value: '#27272a' },
];

export const defaultLoginSettings: LoginSettings = {
  title: '',
  subtitle: 'Ingresa tus credenciales autorizadas para acceder a tu espacio',
  badgeText: 'Acceso Seguro',
  logoUrl: '',
  bgImageUrl: '',
  bgBlur: 8,
  bgDarkness: 65,
  glowColor: '#10b981',
  accentColor: '#059669',
  buttonText: 'Iniciar Sesión',
  helpText: '¿Problemas para acceder? Contacta al soporte técnico',
  showBackLink: true,
};

export const ProjectEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { superAdmin } = useAuth();

  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'builder' | 'general' | 'login'>('builder');
  const [uploadingSlotId, setUploadingSlotId] = useState<string | null>(null);

  // Form states for general settings
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [routePrefix, setRoutePrefix] = useState('sitio');
  const [published, setPublished] = useState(true);
  const [authEnabled, setAuthEnabled] = useState(true);
  const [coverImage, setCoverImage] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);

  // Login customization state
  const [loginSettings, setLoginSettings] = useState<LoginSettings>(defaultLoginSettings);
  const [uploadingLoginLogo, setUploadingLoginLogo] = useState(false);
  const [uploadingLoginBg, setUploadingLoginBg] = useState(false);
  const [previewRegisterMode, setPreviewRegisterMode] = useState(false);

  // Blocks state
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [canvasPreviewMode, setCanvasPreviewMode] = useState<Record<number, boolean>>({});
  const [resizingItem, setResizingItem] = useState<{
    blockIndex: number;
    itemIndex: number;
    initialWidth: number;
    initialMinHeight: number;
  } | null>(null);

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

        const savedLogin = data.settings?.loginSettings || {};
        setLoginSettings({
          title: savedLogin.title ?? data.title,
          subtitle: savedLogin.subtitle ?? 'Ingresa tus credenciales autorizadas para acceder a tu espacio',
          badgeText: savedLogin.badgeText ?? 'Acceso Seguro',
          logoUrl: savedLogin.logoUrl ?? (data.settings?.coverImage || ''),
          bgImageUrl: savedLogin.bgImageUrl ?? '',
          bgBlur: typeof savedLogin.bgBlur === 'number' ? savedLogin.bgBlur : 8,
          bgDarkness: typeof savedLogin.bgDarkness === 'number' ? savedLogin.bgDarkness : 65,
          glowColor: savedLogin.glowColor || '#10b981',
          accentColor: savedLogin.accentColor || '#059669',
          buttonText: savedLogin.buttonText || 'Iniciar Sesión',
          helpText: savedLogin.helpText || '¿Problemas para acceder? Contacta al soporte técnico',
          showBackLink: savedLogin.showBackLink !== undefined ? savedLogin.showBackLink : true,
        });
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
          loginSettings,
        },
      });

      showSuccessToast('Imagen guardada', 'La imagen identificadora se subió y guardó en la carpeta del cliente.');
    } catch (err: any) {
      showErrorAlert('Error al subir', err.response?.data?.message || 'No se pudo subir la imagen.');
    } finally {
      setUploadingCover(false);
    }
  };

  // Upload custom logo for login
  const handleUploadLoginLogo = async (file: File) => {
    if (!id) return;
    setUploadingLoginLogo(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post(`/projects/${id}/upload`, formData);
      setLoginSettings((prev) => ({ ...prev, logoUrl: res.data.url }));
      showSuccessToast('Logo del Login Subido', 'El archivo se guardó en la carpeta del cliente.');
    } catch (err: any) {
      showErrorAlert('Error al subir', err.response?.data?.message || 'No se pudo subir el logo.');
    } finally {
      setUploadingLoginLogo(false);
    }
  };

  // Upload custom background image for login
  const handleUploadLoginBg = async (file: File) => {
    if (!id) return;
    setUploadingLoginBg(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post(`/projects/${id}/upload`, formData);
      setLoginSettings((prev) => ({ ...prev, bgImageUrl: res.data.url }));
      showSuccessToast('Fondo del Login Subido', 'La imagen de fondo se guardó en la carpeta del cliente.');
    } catch (err: any) {
      showErrorAlert('Error al subir', err.response?.data?.message || 'No se pudo subir el fondo.');
    } finally {
      setUploadingLoginBg(false);
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
          loginSettings,
        },
      });

      showSuccessToast('Guardado', 'Los cambios, bloques y personalización del login se sincronizaron con éxito.');
    } catch (err: any) {
      showErrorAlert('Error al guardar', err.response?.data?.message || 'Ocurrió un error al guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  // Drag & drop state for Canvas Grid
  const [draggedWidgetType, setDraggedWidgetType] = useState<CanvasItem['type'] | null>(null);
  const [draggedCanvasItemIndex, setDraggedCanvasItemIndex] = useState<{ blockIndex: number; itemIndex: number } | null>(null);

  // Block management
  const handleAddBlock = (type: Block['type']) => {
    let newBlock: Block;

    if (type === 'CANVAS_GRID') {
      newBlock = {
        id: 'canvas-' + Date.now(),
        type: 'CANVAS_GRID',
        content: {
          title: 'Lienzo Modular Híbrido',
          mode: 'freestyle', // 'grid' | 'freestyle'
          canvasHeight: 560,
          columns: 3,
          gap: 16,
          items: [
            {
              id: 'c-img-' + Date.now(),
              type: 'image',
              colSpan: 2,
              rowSpan: 2,
              x: 4,
              y: 6,
              width: 55,
              minHeight: 320,
              zIndex: 1,
              rotation: 0,
              content: {
                imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1000&q=80',
                title: 'Espacio de Imagen Principal',
                subtitle: 'Arrastra libremente o cambia a modo cuadrícula magnética',
              },
            },
            {
              id: 'c-text-' + (Date.now() + 1),
              type: 'text',
              colSpan: 1,
              rowSpan: 1,
              x: 62,
              y: 8,
              width: 34,
              minHeight: 180,
              zIndex: 2,
              rotation: 0,
              content: {
                heading: 'Espacio de Texto Libre',
                bodyText: 'Escribe aquí tu encabezado o mensaje destacado con tipografía limpia.',
                alignment: 'left',
              },
            },
            {
              id: 'c-card-' + (Date.now() + 2),
              type: 'card',
              colSpan: 1,
              rowSpan: 1,
              x: 62,
              y: 52,
              width: 34,
              minHeight: 180,
              zIndex: 3,
              rotation: -2,
              content: {
                cardTitle: 'Espacio de Tarjeta',
                cardDescription: 'Contenedor modular con estética Apple Glassmorphism.',
              },
            },
          ],
        },
      };
    } else if (type === 'HERO') {
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

  const handleDropWidgetOnCanvas = (
    blockIndex: number,
    targetIndex?: number,
    widgetTypeOverride?: CanvasItem['type'],
    coords?: { x: number; y: number }
  ) => {
    const typeToUse = widgetTypeOverride || draggedWidgetType;
    if (!typeToUse) return;

    const currentBlock = blocks[blockIndex];
    const items = [...(currentBlock?.content?.items || [])];
    const maxZ = items.reduce((max, it) => Math.max(max, it.zIndex || 1), 0);

    const newItem: CanvasItem = {
      id: `c-${typeToUse}-${Date.now()}`,
      type: typeToUse,
      colSpan: typeToUse === 'image' ? 2 : 1,
      rowSpan: typeToUse === 'image' ? 2 : 1,
      x: coords ? coords.x : Math.min(65, 6 + (items.length * 7) % 55),
      y: coords ? coords.y : Math.min(65, 8 + (items.length * 7) % 55),
      width: typeToUse === 'image' ? 48 : typeToUse === 'button' ? 28 : 36,
      minHeight: typeToUse === 'button' ? 120 : typeToUse === 'image' ? 260 : 180,
      zIndex: maxZ + 1,
      rotation: 0,
      content: {
        imageUrl: typeToUse === 'image' ? 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80' : undefined,
        title: typeToUse === 'image' ? 'Nuevo Espacio de Imagen' : undefined,
        subtitle: typeToUse === 'image' ? 'Descripción de la imagen' : undefined,
        heading: typeToUse === 'text' ? 'Nuevo Encabezado' : undefined,
        bodyText: typeToUse === 'text' ? 'Escribe aquí tu contenido descriptivo...' : undefined,
        alignment: 'left',
        cardTitle: typeToUse === 'card' ? 'Nueva Tarjeta Glass' : undefined,
        cardDescription: typeToUse === 'card' ? 'Contenedor modular libre...' : undefined,
        buttonText: typeToUse === 'button' ? 'Hacer Clic Aquí' : undefined,
        buttonUrl: '#',
      },
    };

    const updated = [...blocks];
    if (typeof targetIndex === 'number') {
      items.splice(targetIndex, 0, newItem);
    } else {
      items.push(newItem);
    }
    updated[blockIndex].content.items = items;
    setBlocks(updated);
    setDraggedWidgetType(null);
    showSuccessToast('Elemento Agregado', `Se añadió un elemento ${typeToUse.toUpperCase()} al lienzo`);
  };

  const handleDuplicateCanvasItem = (blockIndex: number, itemIndex: number) => {
    const updated = [...blocks];
    const items = [...(updated[blockIndex].content.items || [])];
    const source = items[itemIndex];
    if (!source) return;

    const maxZ = items.reduce((max, it) => Math.max(max, it.zIndex || 1), 0);
    const duplicate: CanvasItem = {
      ...JSON.parse(JSON.stringify(source)),
      id: `c-${source.type}-${Date.now()}`,
      x: Math.min(75, (source.x || 10) + 4),
      y: Math.min(75, (source.y || 10) + 4),
      zIndex: maxZ + 1,
    };

    items.push(duplicate);
    updated[blockIndex].content.items = items;
    setBlocks(updated);
    showSuccessToast('Duplicado', 'Se duplicó el elemento con éxito');
  };

  // Magnetic snap helper to snap to neighbor edges or canvas bounds with 0% gap when close
  const snapToNeighbors = (
    rawX: number,
    rawY: number,
    itemWidth: number,
    items: CanvasItem[],
    currentIndex?: number
  ) => {
    let snappedX = rawX;
    let snappedY = rawY;
    const SNAP_THRESHOLD = 3.5; // tolerance in percentage

    // Canvas boundary snapping
    if (Math.abs(snappedX) < SNAP_THRESHOLD) snappedX = 0;
    if (Math.abs(snappedX + itemWidth - 100) < SNAP_THRESHOLD) snappedX = 100 - itemWidth;
    if (Math.abs(snappedY) < SNAP_THRESHOLD) snappedY = 0;

    // Center snapping
    if (Math.abs(snappedX + itemWidth / 2 - 50) < SNAP_THRESHOLD) snappedX = 50 - itemWidth / 2;

    // Neighbor widgets magnetic docking & snapping (juntos sin separación indeseada)
    items.forEach((other, idx) => {
      if (idx === currentIndex) return;
      const otherX = other.x ?? 0;
      const otherY = other.y ?? 0;
      const otherW = other.width || 36;

      // 1. Align Left with other widget's Left
      if (Math.abs(snappedX - otherX) < SNAP_THRESHOLD) {
        snappedX = otherX;
      }
      // 2. Dock directly to the RIGHT of other widget (Pegar a la derecha con 0 gap)
      if (Math.abs(snappedX - (otherX + otherW)) < SNAP_THRESHOLD) {
        snappedX = otherX + otherW;
      }
      // 3. Dock directly to the LEFT of other widget (Pegar a la izquierda con 0 gap)
      if (Math.abs(snappedX + itemWidth - otherX) < SNAP_THRESHOLD) {
        snappedX = Math.max(0, otherX - itemWidth);
      }
      // 4. Align Top with other widget's Top
      if (Math.abs(snappedY - otherY) < SNAP_THRESHOLD) {
        snappedY = otherY;
      }
    });

    return {
      x: Math.max(0, Math.min(100 - itemWidth, Math.round(snappedX))),
      y: Math.max(0, Math.min(85, Math.round(snappedY))),
    };
  };

  // Helper to dock a widget right next to the previous widget
  const handleDockNextToPrevious = (blockIndex: number, itemIndex: number) => {
    const updated = [...blocks];
    const items = [...(updated[blockIndex].content.items || [])];
    const current = items[itemIndex];
    if (!current || itemIndex === 0) return;
    const prev = items[itemIndex - 1];
    if (!prev) return;

    const prevX = prev.x ?? 0;
    const prevY = prev.y ?? 0;
    const prevW = prev.width || 36;
    const currentW = current.width || 36;

    // Check if it fits on the same horizontal row
    if (prevX + prevW + currentW <= 100) {
      current.x = prevX + prevW;
      current.y = prevY;
    } else {
      // Otherwise dock underneath aligned left
      current.x = prevX;
      current.y = Math.min(80, prevY + 35);
    }

    updated[blockIndex].content.items = items;
    setBlocks(updated);
    showSuccessToast('Ajuste Magnético', 'Elemento acoplado perfectamente al widget adyacente');
  };

  const handleChangeCanvasItemZIndex = (blockIndex: number, itemIndex: number, direction: 'up' | 'down') => {
    const updated = [...blocks];
    const items = [...(updated[blockIndex].content.items || [])];
    const currentZ = items[itemIndex].zIndex || 1;
    items[itemIndex].zIndex = direction === 'up' ? currentZ + 1 : Math.max(1, currentZ - 1);
    updated[blockIndex].content.items = items;
    setBlocks(updated);
  };

  const handleStartResize = (
    e: React.MouseEvent,
    blockIndex: number,
    itemIndex: number,
    containerElement: HTMLElement | null
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const item = blocks[blockIndex]?.content?.items?.[itemIndex];
    if (!item) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const initialWidth = item.width || 36;
    const initialMinHeight = item.minHeight || 200;

    const rect = containerElement
      ? containerElement.getBoundingClientRect()
      : { width: 800 };

    setResizingItem({
      blockIndex,
      itemIndex,
      initialWidth,
      initialMinHeight,
    });

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      const deltaWidthPercent = (deltaX / rect.width) * 100;
      const newWidth = Math.max(15, Math.min(100, Math.round(initialWidth + deltaWidthPercent)));
      const newMinHeight = Math.max(80, Math.min(850, Math.round(initialMinHeight + deltaY)));

      setBlocks((prevBlocks) => {
        const next = [...prevBlocks];
        if (next[blockIndex]?.content?.items?.[itemIndex]) {
          next[blockIndex].content.items[itemIndex].width = newWidth;
          next[blockIndex].content.items[itemIndex].minHeight = newMinHeight;
        }
        return next;
      });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      setResizingItem(null);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleReorderCanvasItems = (blockIndex: number, fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const updated = [...blocks];
    const items = [...(updated[blockIndex].content.items || [])];
    const [moved] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, moved);
    updated[blockIndex].content.items = items;
    setBlocks(updated);
    setDraggedCanvasItemIndex(null);
  };

  // Upload image for a canvas item
  const handleUploadCanvasImage = async (blockIndex: number, itemIndex: number, file: File) => {
    if (!id) return;
    const slotKey = `canvas-${blockIndex}-${itemIndex}`;
    setUploadingSlotId(slotKey);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post(`/projects/${id}/upload`, formData);
      const updated = [...blocks];
      if (updated[blockIndex]?.content?.items?.[itemIndex]) {
        updated[blockIndex].content.items[itemIndex].content.imageUrl = res.data.url;
        setBlocks(updated);
        showSuccessToast('Imagen subida', 'La imagen se guardó en el espacio reservado.');
      }
    } catch (err: any) {
      showErrorAlert('Error al subir', err.response?.data?.message || 'No se pudo subir la imagen.');
    } finally {
      setUploadingSlotId(null);
    }
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
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-black/80 backdrop-blur-md">
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
        <div className="bg-zinc-900/90 p-1 rounded-full border border-white/10 flex max-w-md">
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
            <span>Constructor</span>
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
            <span>General</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'login'
                ? 'bg-zinc-800 text-white shadow-sm border border-white/10'
                : 'text-[#86868b] hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-emerald-400" />
            <span>Personalizar Login</span>
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

        {/* TAB 3: CUSTOMIZE TENANT LOGIN */}
        {activeTab === 'login' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Toolbar */}
            <div className="apple-card rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-xl font-semibold text-white">Personalización del Login</h2>
                </div>
                <p className="text-xs text-[#86868b] mt-1">
                  Personaliza los fondos, logotipo, colores de acento y textos de la pantalla <code className="text-zinc-300">/{routePrefix}/{project.slug}/login</code>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/${routePrefix}/${project.slug}/login`}
                  target="_blank"
                  className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs px-4 py-2 rounded-full font-medium flex items-center gap-1.5 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ver Login en Vivo</span>
                </Link>
              </div>
            </div>

            {/* Split Screen: Controls & Live Mockup */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Form Controls */}
              <div className="lg:col-span-6 space-y-6">
                {/* 1. Branding & Texts */}
                <div className="apple-card rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-semibold text-white">Identidad & Textos</h3>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-1.5 pl-1">
                      Título de Bienvenida
                    </label>
                    <input
                      type="text"
                      value={loginSettings.title}
                      onChange={(e) => setLoginSettings({ ...loginSettings, title: e.target.value })}
                      placeholder={title || 'Nombre del Proyecto'}
                      className="apple-input w-full rounded-2xl px-3.5 py-2 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-1.5 pl-1">
                      Subtítulo / Instrucción
                    </label>
                    <textarea
                      value={loginSettings.subtitle}
                      onChange={(e) => setLoginSettings({ ...loginSettings, subtitle: e.target.value })}
                      rows={2}
                      placeholder="Ingresa tus credenciales autorizadas..."
                      className="apple-input w-full rounded-2xl px-3.5 py-2 text-sm text-white resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-1.5 pl-1">
                      Etiqueta / Badge Superior
                    </label>
                    <input
                      type="text"
                      value={loginSettings.badgeText}
                      onChange={(e) => setLoginSettings({ ...loginSettings, badgeText: e.target.value })}
                      placeholder="Ej. Acceso Seguro, Portal Privado, Staff"
                      className="apple-input w-full rounded-2xl px-3.5 py-2 text-sm text-white"
                    />
                  </div>

                  {/* Logo Upload Box */}
                  <div>
                    <label className="block text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-1.5 pl-1">
                      Logo o Ícono de la Tarjeta
                    </label>
                    <div className="bg-black/60 border border-white/10 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 relative group/logo">
                          {loginSettings.logoUrl ? (
                            <img
                              src={loginSettings.logoUrl}
                              alt="Logo login"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Layers className="w-6 h-6 text-zinc-500" />
                          )}
                          <label className="absolute inset-0 bg-black/70 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                            <Upload className="w-4 h-4 text-white" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleUploadLoginLogo(f);
                              }}
                            />
                          </label>
                        </div>

                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <label className="apple-button-primary text-xs font-medium px-3 py-1.5 rounded-full cursor-pointer inline-flex items-center gap-1.5">
                              <Upload className="w-3 h-3" />
                              <span>{uploadingLoginLogo ? 'Subiendo...' : 'Subir Logotipo'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                disabled={uploadingLoginLogo}
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) handleUploadLoginLogo(f);
                                }}
                              />
                            </label>

                            {coverImage && (
                              <button
                                type="button"
                                onClick={() => setLoginSettings({ ...loginSettings, logoUrl: coverImage })}
                                className="text-xs bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 border border-white/10 px-3 py-1.5 rounded-full transition-all cursor-pointer"
                              >
                                Usar portada
                              </button>
                            )}

                            {loginSettings.logoUrl && (
                              <button
                                type="button"
                                onClick={() => setLoginSettings({ ...loginSettings, logoUrl: '' })}
                                className="text-xs text-red-400 hover:text-red-300 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-500 font-mono truncate">
                            {loginSettings.logoUrl || 'Sin logotipo personalizado asignado.'}
                          </p>
                        </div>
                      </div>

                      <input
                        type="text"
                        value={loginSettings.logoUrl}
                        onChange={(e) => setLoginSettings({ ...loginSettings, logoUrl: e.target.value })}
                        placeholder="O pegar URL directa de logotipo..."
                        className="apple-input w-full rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-600 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Background & Lighting */}
                <div className="apple-card rounded-3xl p-6 space-y-5">
                  <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-white">Fondo & Iluminación Ambiental</h3>
                  </div>

                  {/* Background Image Upload */}
                  <div>
                    <label className="block text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-1.5 pl-1">
                      Imagen de Fondo Completa (Wallpaper)
                    </label>
                    <div className="bg-black/60 border border-white/10 rounded-2xl p-4 space-y-3">
                      <div className="relative aspect-[21/9] rounded-xl overflow-hidden bg-zinc-900 border border-white/10 group/bg">
                        {loginSettings.bgImageUrl ? (
                          <img
                            src={loginSettings.bgImageUrl}
                            alt="Fondo login"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 text-xs">
                            <ImageIcon className="w-6 h-6 mb-1 text-zinc-600" />
                            <span>Sin imagen de fondo (fondo oscuro por defecto)</span>
                          </div>
                        )}

                        <label className="absolute inset-0 bg-black/70 opacity-0 group-hover/bg:opacity-100 flex flex-col items-center justify-center text-white text-xs cursor-pointer transition-opacity backdrop-blur-xs">
                          <Upload className="w-5 h-5 mb-1 text-emerald-400" />
                          <span>{uploadingLoginBg ? 'Subiendo...' : 'Subir imagen de fondo'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingLoginBg}
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleUploadLoginBg(f);
                            }}
                          />
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={loginSettings.bgImageUrl}
                          onChange={(e) => setLoginSettings({ ...loginSettings, bgImageUrl: e.target.value })}
                          placeholder="O pegar URL directa de fondo (ej. Unsplash)..."
                          className="apple-input flex-1 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-600 font-mono mr-2"
                        />
                        {loginSettings.bgImageUrl && (
                          <button
                            type="button"
                            onClick={() => setLoginSettings({ ...loginSettings, bgImageUrl: '' })}
                            className="text-xs text-red-400 hover:text-red-300 p-1 cursor-pointer flex-shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sliders: Blur & Darkness */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1 pl-1">
                        <label className="text-[11px] font-medium text-[#86868b] uppercase tracking-wider">
                          Desenfoque (Blur)
                        </label>
                        <span className="text-xs font-mono text-emerald-400">{loginSettings.bgBlur}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="24"
                        value={loginSettings.bgBlur}
                        onChange={(e) => setLoginSettings({ ...loginSettings, bgBlur: Number(e.target.value) })}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1 pl-1">
                        <label className="text-[11px] font-medium text-[#86868b] uppercase tracking-wider">
                          Oscuridad del Filtro
                        </label>
                        <span className="text-xs font-mono text-emerald-400">{loginSettings.bgDarkness}%</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="90"
                        value={loginSettings.bgDarkness}
                        onChange={(e) => setLoginSettings({ ...loginSettings, bgDarkness: Number(e.target.value) })}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Ambient Glow Presets */}
                  <div>
                    <label className="block text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-2 pl-1">
                      Color de Resplandor Ambiental (Halo Glow)
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      {GLOW_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => setLoginSettings({ ...loginSettings, glowColor: preset.value })}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                            loginSettings.glowColor === preset.value
                              ? 'bg-white/[0.12] text-white border-white/40 shadow-sm'
                              : 'bg-white/[0.04] text-zinc-400 border-white/[0.08] hover:bg-white/[0.08]'
                          }`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full shadow-xs"
                            style={{ backgroundColor: preset.value }}
                          />
                          <span>{preset.label}</span>
                        </button>
                      ))}

                      {/* Custom color picker */}
                      <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] px-2 py-1 rounded-full">
                        <input
                          type="color"
                          value={loginSettings.glowColor}
                          onChange={(e) => setLoginSettings({ ...loginSettings, glowColor: e.target.value })}
                          className="w-5 h-5 rounded-full bg-transparent border-0 cursor-pointer p-0"
                          title="Elegir color personalizado"
                        />
                        <span className="text-[11px] font-mono text-zinc-400">{loginSettings.glowColor}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Button Style & Actions */}
                <div className="apple-card rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
                    <KeyRound className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-semibold text-white">Botón & Acciones</h3>
                  </div>

                  {/* Accent Color Presets */}
                  <div>
                    <label className="block text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-2 pl-1">
                      Color Primario del Botón (Acento)
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      {ACCENT_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => setLoginSettings({ ...loginSettings, accentColor: preset.value })}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                            loginSettings.accentColor === preset.value
                              ? 'bg-white/[0.12] text-white border-white/40 shadow-sm'
                              : 'bg-white/[0.04] text-zinc-400 border-white/[0.08] hover:bg-white/[0.08]'
                          }`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full shadow-xs"
                            style={{ backgroundColor: preset.value }}
                          />
                          <span>{preset.label}</span>
                        </button>
                      ))}

                      {/* Custom color picker */}
                      <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] px-2 py-1 rounded-full">
                        <input
                          type="color"
                          value={loginSettings.accentColor}
                          onChange={(e) => setLoginSettings({ ...loginSettings, accentColor: e.target.value })}
                          className="w-5 h-5 rounded-full bg-transparent border-0 cursor-pointer p-0"
                          title="Elegir color personalizado"
                        />
                        <span className="text-[11px] font-mono text-zinc-400">{loginSettings.accentColor}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-1.5 pl-1">
                      Texto del Botón de Ingreso
                    </label>
                    <input
                      type="text"
                      value={loginSettings.buttonText}
                      onChange={(e) => setLoginSettings({ ...loginSettings, buttonText: e.target.value })}
                      placeholder="Iniciar Sesión"
                      className="apple-input w-full rounded-2xl px-3.5 py-2 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-1.5 pl-1">
                      Texto de Ayuda / Pie de Página
                    </label>
                    <input
                      type="text"
                      value={loginSettings.helpText}
                      onChange={(e) => setLoginSettings({ ...loginSettings, helpText: e.target.value })}
                      placeholder="¿Problemas para acceder? Contacta al administrador"
                      className="apple-input w-full rounded-2xl px-3.5 py-2 text-sm text-white"
                    />
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={loginSettings.showBackLink}
                        onChange={(e) => setLoginSettings({ ...loginSettings, showBackLink: e.target.checked })}
                        className="rounded-md bg-zinc-900 border-white/20 text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs text-zinc-300">
                        Mostrar enlace para volver al sitio público (/{routePrefix}/{project.slug})
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Interactive Mockup */}
              <div className="lg:col-span-6 sticky top-24 space-y-3">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <Eye className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-white">Previsualización en Tiempo Real</span>
                  </div>

                  {/* Mode switcher in mockup */}
                  <div className="bg-zinc-900 border border-white/10 rounded-full p-0.5 flex text-[11px]">
                    <button
                      type="button"
                      onClick={() => setPreviewRegisterMode(false)}
                      className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                        !previewRegisterMode
                          ? 'bg-zinc-800 text-white shadow-xs'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewRegisterMode(true)}
                      className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                        previewRegisterMode
                          ? 'bg-zinc-800 text-white shadow-xs'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Registro
                    </button>
                  </div>
                </div>

                {/* macOS Browser Window Frame */}
                <div className="rounded-3xl border border-white/15 bg-black overflow-hidden shadow-2xl relative">
                  {/* macOS Titlebar */}
                  <div className="bg-zinc-950/90 border-b border-white/[0.08] px-4 py-2.5 flex items-center justify-between backdrop-blur-md">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                    </div>

                    <div className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-1 text-[11px] font-mono text-zinc-400 max-w-xs truncate flex items-center gap-1.5">
                      <Lock className="w-2.5 h-2.5 text-emerald-400" />
                      <span>/{routePrefix}/{project.slug}/login</span>
                    </div>

                    <div className="w-10" />
                  </div>

                  {/* Mockup Canvas Screen */}
                  <div className="relative min-h-[520px] p-6 flex flex-col items-center justify-center overflow-hidden">
                    {/* Background image & filter */}
                    {loginSettings.bgImageUrl ? (
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-all duration-300"
                        style={{
                          backgroundImage: `url(${loginSettings.bgImageUrl})`,
                          filter: `blur(${loginSettings.bgBlur}px)`,
                          transform: 'scale(1.08)',
                        }}
                      />
                    ) : null}

                    {/* Dark filter overlay */}
                    <div
                      className="absolute inset-0 bg-black transition-opacity duration-300"
                      style={{ opacity: loginSettings.bgDarkness / 100 }}
                    />

                    {/* Ambient Glow */}
                    <div
                      className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full blur-[50px] pointer-events-none transition-all duration-300 opacity-30"
                      style={{ backgroundColor: loginSettings.glowColor }}
                    />

                    {/* Mockup Login Card Container */}
                    <div className="relative z-10 w-full max-w-[340px] flex flex-col items-center">
                      {/* Logo & Header */}
                      <div className="text-center mb-5 flex flex-col items-center">
                        <div
                          className="w-12 h-12 rounded-2xl border flex items-center justify-center shadow-xl mb-3 overflow-hidden"
                          style={{
                            backgroundColor: `${loginSettings.accentColor}20`,
                            borderColor: `${loginSettings.accentColor}40`,
                          }}
                        >
                          {loginSettings.logoUrl ? (
                            <img
                              src={loginSettings.logoUrl}
                              alt="Logo"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Layers className="w-6 h-6" style={{ color: loginSettings.accentColor }} />
                          )}
                        </div>

                        {loginSettings.badgeText && (
                          <span
                            className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full border mb-2 uppercase tracking-wider"
                            style={{
                              backgroundColor: `${loginSettings.accentColor}15`,
                              borderColor: `${loginSettings.accentColor}30`,
                              color: loginSettings.accentColor,
                            }}
                          >
                            {loginSettings.badgeText}
                          </span>
                        )}

                        <h4 className="text-lg font-semibold text-white tracking-tight">
                          {loginSettings.title || title || project.title}
                        </h4>

                        {loginSettings.subtitle && (
                          <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2 max-w-[280px]">
                            {loginSettings.subtitle}
                          </p>
                        )}
                      </div>

                      {/* Glass Card */}
                      <div className="w-full apple-glass rounded-3xl p-5 border border-white/15 shadow-2xl">
                        {/* Segmented Control */}
                        <div className="bg-zinc-900/90 p-0.5 rounded-full border border-white/10 flex mb-4">
                          <div
                            className={`flex-1 py-1 text-[10px] font-medium rounded-full text-center ${
                              !previewRegisterMode ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-500'
                            }`}
                          >
                            Iniciar Sesión
                          </div>
                          <div
                            className={`flex-1 py-1 text-[10px] font-medium rounded-full text-center ${
                              previewRegisterMode ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-500'
                            }`}
                          >
                            Registrar
                          </div>
                        </div>

                        {/* Dummy inputs */}
                        <div className="space-y-2.5">
                          {previewRegisterMode && (
                            <div>
                              <label className="block text-[9px] text-zinc-400 uppercase tracking-wider mb-1">
                                Nombre Completo
                              </label>
                              <div className="relative">
                                <User className="w-3 h-3 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <div className="apple-input w-full rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-400">
                                  Juan Pérez
                                </div>
                              </div>
                            </div>
                          )}

                          <div>
                            <label className="block text-[9px] text-zinc-400 uppercase tracking-wider mb-1">
                              Correo Electrónico
                            </label>
                            <div className="relative">
                              <Mail className="w-3 h-3 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                              <div className="apple-input w-full rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-400">
                                usuario@sitio.com
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[9px] text-zinc-400 uppercase tracking-wider mb-1">
                              Contraseña
                            </label>
                            <div className="relative">
                              <Lock className="w-3 h-3 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                              <div className="apple-input w-full rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-400">
                                ••••••••
                              </div>
                            </div>
                          </div>

                          {/* Action Button with customized accentColor */}
                          <button
                            type="button"
                            className="w-full mt-2 font-medium py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs text-white shadow-lg transition-all"
                            style={{
                              backgroundColor: loginSettings.accentColor,
                              color: loginSettings.accentColor === '#ffffff' ? '#000000' : '#ffffff',
                            }}
                          >
                            <span>{previewRegisterMode ? 'Registrar Usuario' : loginSettings.buttonText || 'Iniciar Sesión'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Help text & Back link */}
                        <div className="mt-4 pt-3 border-t border-white/[0.08] text-center space-y-1.5">
                          {loginSettings.helpText && (
                            <p className="text-[10px] text-zinc-500">{loginSettings.helpText}</p>
                          )}
                          {loginSettings.showBackLink && (
                            <div className="text-[10px] text-zinc-400 inline-flex items-center gap-1 hover:text-white">
                              <span>Ver sitio público</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
                  onClick={() => handleAddBlock('CANVAS_GRID')}
                  className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs px-3.5 py-2 rounded-full font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>+ Lienzo Drag & Drop</span>
                </button>

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
                  Haz clic en cualquiera de los botones superiores para añadir un lienzo Drag & Drop o secciones.
                </p>
                <button
                  onClick={() => handleAddBlock('CANVAS_GRID')}
                  className="apple-button-primary text-xs font-medium px-4 py-2 rounded-full cursor-pointer"
                >
                  Añadir Lienzo Drag & Drop
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
                        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                          {block.type === 'CANVAS_GRID' && 'Lienzo Modular Drag & Drop (Espacios Reservados)'}
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

                    {/* BLOCK TYPE: CANVAS_GRID (LIENZO HÍBRIDO MODULAR DRAG & DROP) */}
                    {block.type === 'CANVAS_GRID' && (
                      <div className="space-y-6">
                        {/* 1. Global Canvas Hybrid Settings Toolbar */}
                        <div className="flex flex-wrap items-center justify-between gap-4 bg-black/60 border border-white/10 p-4 rounded-2xl">
                          <div className="flex flex-wrap items-center gap-4">
                            {/* Mode Toggle Switch */}
                            <div>
                              <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                                Modo de Lienzo
                              </label>
                              <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-white/10">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...blocks];
                                    updated[blockIndex].content.mode = 'freestyle';
                                    setBlocks(updated);
                                  }}
                                  className={`px-3 py-1 text-xs rounded-lg font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                                    (block.content.mode || 'freestyle') === 'freestyle'
                                      ? 'bg-emerald-600 text-white shadow-md font-semibold'
                                      : 'text-zinc-400 hover:text-white'
                                  }`}
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>🎨 Modo Libre (Freestyle)</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...blocks];
                                    updated[blockIndex].content.mode = 'grid';
                                    setBlocks(updated);
                                  }}
                                  className={`px-3 py-1 text-xs rounded-lg font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                                    block.content.mode === 'grid'
                                      ? 'bg-blue-600 text-white shadow-md font-semibold'
                                      : 'text-zinc-400 hover:text-white'
                                  }`}
                                >
                                  <LayoutGrid className="w-3.5 h-3.5" />
                                  <span>⊞ Cuadrícula Magnética</span>
                                </button>
                              </div>
                            </div>

                            {/* Options for Freestyle Mode */}
                            {(block.content.mode || 'freestyle') === 'freestyle' ? (
                              <div className="flex flex-wrap items-center gap-3">
                                <div>
                                  <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                                    Alto del Lienzo
                                  </label>
                                  <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-xl border border-white/10">
                                    {[450, 580, 720, 900].map((h) => (
                                      <button
                                        key={h}
                                        type="button"
                                        onClick={() => {
                                          const updated = [...blocks];
                                          updated[blockIndex].content.canvasHeight = h;
                                          setBlocks(updated);
                                        }}
                                        className={`px-2.5 py-1 text-xs rounded-lg font-mono transition-all cursor-pointer ${
                                          (block.content.canvasHeight || 580) === h
                                            ? 'bg-zinc-700 text-white font-bold'
                                            : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                      >
                                        {h}px
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* 1:1 WYSIWYG Real Preview Toggle */}
                                <div>
                                  <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                                    Visualización
                                  </label>
                                  <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-xl border border-white/10">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCanvasPreviewMode((prev) => ({ ...prev, [blockIndex]: false }));
                                      }}
                                      className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
                                        !canvasPreviewMode[blockIndex]
                                          ? 'bg-zinc-700 text-white font-semibold'
                                          : 'text-zinc-400 hover:text-white'
                                      }`}
                                    >
                                      <span>🛠️ Editor</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCanvasPreviewMode((prev) => ({ ...prev, [blockIndex]: true }));
                                      }}
                                      className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
                                        canvasPreviewMode[blockIndex]
                                          ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                                          : 'text-zinc-400 hover:text-white'
                                      }`}
                                      title="Ver exactamente cómo se verá publicado con 100% de precisión visual"
                                    >
                                      <Eye className="w-3 h-3" />
                                      <span>👁️ Vista Previa 1:1</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              /* Options for Grid Mode */
                              <>
                                <div>
                                  <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                                    Columnas
                                  </label>
                                  <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-xl border border-white/10">
                                    {[2, 3, 4, 6].map((num) => (
                                      <button
                                        key={num}
                                        type="button"
                                        onClick={() => {
                                          const updated = [...blocks];
                                          updated[blockIndex].content.columns = num;
                                          setBlocks(updated);
                                        }}
                                        className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                                          (block.content.columns || 3) === num
                                            ? 'bg-blue-600 text-white shadow-xs'
                                            : 'text-zinc-400 hover:text-white'
                                        }`}
                                      >
                                        {num} Cols
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                                    Espaciado (Gap)
                                  </label>
                                  <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-xl border border-white/10">
                                    {[8, 16, 24, 32].map((g) => (
                                      <button
                                        key={g}
                                        type="button"
                                        onClick={() => {
                                          const updated = [...blocks];
                                          updated[blockIndex].content.gap = g;
                                          setBlocks(updated);
                                        }}
                                        className={`px-2 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                                          (block.content.gap || 16) === g
                                            ? 'bg-zinc-800 text-white border border-white/10 shadow-xs'
                                            : 'text-zinc-400 hover:text-white'
                                        }`}
                                      >
                                        {g}px
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>

                          <div className="text-xs text-zinc-500 font-mono flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>{Array.isArray(block.content.items) ? block.content.items.length : 0} Elementos en Lienzo</span>
                          </div>
                        </div>

                        {/* 2. Draggable Widget Palette Dock */}
                        <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-900/60 to-blue-950/40 border border-emerald-500/20 rounded-2xl p-4">
                          <div className="flex items-center justify-between mb-2.5">
                            <div className="flex items-center gap-2">
                              <MousePointer className="w-4 h-4 text-emerald-400" />
                              <span className="text-xs font-semibold text-white">
                                Paleta de Widgets (Arrastra al lienzo o haz clic):
                              </span>
                            </div>
                            <span className="text-[11px] text-zinc-400 hidden sm:inline">
                              {(block.content.mode || 'freestyle') === 'freestyle'
                                ? '🎨 Suelta en cualquier posición X, Y'
                                : '⊞ Se acomodará en la cuadrícula'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {/* Widget 1: Imagen */}
                            <div
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('canvasWidgetType', 'image');
                                setDraggedWidgetType('image');
                              }}
                              onClick={() => handleDropWidgetOnCanvas(blockIndex, undefined, 'image')}
                              className="bg-black/60 hover:bg-emerald-950/50 border border-emerald-500/30 hover:border-emerald-400 rounded-xl p-3 flex items-center gap-2.5 cursor-grab active:cursor-grabbing transition-all group"
                              title="Arrastra al lienzo para reservar un espacio de Imagen"
                            >
                              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <ImageIcon className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-xs font-medium text-white block">🖼️ Imagen</span>
                                <span className="text-[10px] text-zinc-400 block">Foto / Banner</span>
                              </div>
                            </div>

                            {/* Widget 2: Texto */}
                            <div
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('canvasWidgetType', 'text');
                                setDraggedWidgetType('text');
                              }}
                              onClick={() => handleDropWidgetOnCanvas(blockIndex, undefined, 'text')}
                              className="bg-black/60 hover:bg-blue-950/50 border border-blue-500/30 hover:border-blue-400 rounded-xl p-3 flex items-center gap-2.5 cursor-grab active:cursor-grabbing transition-all group"
                              title="Arrastra al lienzo para reservar un espacio de Texto"
                            >
                              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <TypeIcon className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-xs font-medium text-white block">✍️ Texto</span>
                                <span className="text-[10px] text-zinc-400 block">Título y contenido</span>
                              </div>
                            </div>

                            {/* Widget 3: Tarjeta */}
                            <div
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('canvasWidgetType', 'card');
                                setDraggedWidgetType('card');
                              }}
                              onClick={() => handleDropWidgetOnCanvas(blockIndex, undefined, 'card')}
                              className="bg-black/60 hover:bg-purple-950/50 border border-purple-500/30 hover:border-purple-400 rounded-xl p-3 flex items-center gap-2.5 cursor-grab active:cursor-grabbing transition-all group"
                              title="Arrastra al lienzo para reservar una Tarjeta Glass"
                            >
                              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Square className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-xs font-medium text-white block">🔲 Tarjeta</span>
                                <span className="text-[10px] text-zinc-400 block">Módulo Glass</span>
                              </div>
                            </div>

                            {/* Widget 4: Botón */}
                            <div
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('canvasWidgetType', 'button');
                                setDraggedWidgetType('button');
                              }}
                              onClick={() => handleDropWidgetOnCanvas(blockIndex, undefined, 'button')}
                              className="bg-black/60 hover:bg-amber-950/50 border border-amber-500/30 hover:border-amber-400 rounded-xl p-3 flex items-center gap-2.5 cursor-grab active:cursor-grabbing transition-all group"
                              title="Arrastra al lienzo para reservar un Botón"
                            >
                              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <ArrowRight className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-xs font-medium text-white block">🔘 Botón</span>
                                <span className="text-[10px] text-zinc-400 block">Acción con enlace</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 3A. FREESTYLE CANVAS VIEW (MODO LIBRE X / Y / CAPAS) */}
                        {(block.content.mode || 'freestyle') === 'freestyle' ? (
                          <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              const rect = e.currentTarget.getBoundingClientRect();
                              const grabOffsetX = Number(e.dataTransfer.getData('grabOffsetX') || 0);
                              const grabOffsetY = Number(e.dataTransfer.getData('grabOffsetY') || 0);

                              const moveIndexStr = e.dataTransfer.getData('canvasItemMoveIndex');
                              const sourceGridIndexStr = e.dataTransfer.getData('canvasItemIndex');
                              const widgetType = e.dataTransfer.getData('canvasWidgetType') as CanvasItem['type'];

                              const updated = [...blocks];
                              const currentItems: CanvasItem[] = updated[blockIndex]?.content?.items || [];

                              if (moveIndexStr !== '') {
                                const idx = Number(moveIndexStr);
                                const item = currentItems[idx];
                                if (item) {
                                  const itemW = item.width || 36;
                                  const rawX = ((e.clientX - rect.left - grabOffsetX) / rect.width) * 100;
                                  const rawY = ((e.clientY - rect.top - grabOffsetY) / rect.height) * 100;
                                  const { x: snappedX, y: snappedY } = snapToNeighbors(rawX, rawY, itemW, currentItems, idx);
                                  item.x = snappedX;
                                  item.y = snappedY;
                                  setBlocks(updated);
                                }
                              } else if (sourceGridIndexStr !== '') {
                                const idx = Number(sourceGridIndexStr);
                                const item = currentItems[idx];
                                if (item) {
                                  const itemW = item.width || 36;
                                  const rawX = ((e.clientX - rect.left - grabOffsetX) / rect.width) * 100;
                                  const rawY = ((e.clientY - rect.top - grabOffsetY) / rect.height) * 100;
                                  const { x: snappedX, y: snappedY } = snapToNeighbors(rawX, rawY, itemW, currentItems, idx);
                                  item.x = snappedX;
                                  item.y = snappedY;
                                  setBlocks(updated);
                                }
                              } else if (widgetType) {
                                const rawX = ((e.clientX - rect.left) / rect.width) * 100;
                                const rawY = ((e.clientY - rect.top) / rect.height) * 100;
                                const { x: snappedX, y: snappedY } = snapToNeighbors(rawX, rawY, 36, currentItems);
                                handleDropWidgetOnCanvas(blockIndex, undefined, widgetType, { x: snappedX, y: snappedY });
                              }
                              setDraggedCanvasItemIndex(null);
                            }}
                            className="w-full relative rounded-3xl border border-white/15 bg-zinc-950/90 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:20px_20px] overflow-hidden shadow-2xl transition-all"
                            id={`freestyle-container-${blockIndex}`}
                            style={{
                              minHeight: `${block.content.canvasHeight || 580}px`,
                            }}
                          >
                            {/* Watermark Help Info */}
                            <div className="absolute top-3 right-3 z-0 pointer-events-none select-none flex items-center gap-2">
                              <span className="text-[10px] text-emerald-400/90 font-mono bg-black/80 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur-md">
                                <Magnet className="w-3 h-3 text-emerald-400 animate-pulse" />
                                <span>Ajuste Magnético Activo (Pega widgets juntos sin separación)</span>
                              </span>
                            </div>

                            {/* Freestyle Elements */}
                            {Array.isArray(block.content.items) &&
                              block.content.items.map((item: CanvasItem, itemIndex: number) => {
                                const isUploading = uploadingSlotId === `canvas-${blockIndex}-${itemIndex}`;
                                const itemX = item.x !== undefined ? item.x : Math.min(65, 4 + (itemIndex * 8) % 55);
                                const itemY = item.y !== undefined ? item.y : Math.min(65, 6 + (itemIndex * 8) % 55);
                                const itemWidth = item.width || 36;
                                const itemHeight = item.minHeight || 200;
                                const itemZ = item.zIndex || itemIndex + 1;
                                const itemRot = item.rotation || 0;
                                const isBeingResized = resizingItem?.blockIndex === blockIndex && resizingItem?.itemIndex === itemIndex;
                                const isPreviewMode = !!canvasPreviewMode[blockIndex];

                                return (
                                  <div
                                    key={item.id || itemIndex}
                                    style={{
                                      position: 'absolute',
                                      left: `${itemX}%`,
                                      top: `${itemY}%`,
                                      width: `${itemWidth}%`,
                                      minHeight: `${itemHeight}px`,
                                      zIndex: itemZ,
                                      transform: `rotate(${itemRot}deg)`,
                                    }}
                                    className={`apple-glass rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between group/freeitem transition-all duration-75 relative ${
                                      isPreviewMode && item.type === 'image' ? 'p-0' : 'p-4 sm:p-5'
                                    } ${
                                      isBeingResized
                                        ? 'border-emerald-400 ring-2 ring-emerald-400/40 shadow-emerald-500/20'
                                        : 'border-white/20 hover:border-emerald-400/70'
                                    }`}
                                  >
                                    {/* Live Dimensions Tooltip Badge */}
                                    {isBeingResized && (
                                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-emerald-500 text-black font-extrabold text-[10px] px-3 py-0.5 rounded-full shadow-2xl pointer-events-none z-50 font-mono flex items-center gap-1 animate-pulse border border-white/40">
                                        <span>📐 {itemWidth}% × {itemHeight}px</span>
                                      </div>
                                    )}

                                    {/* 📐 Live Corner Drag Resize Handle */}
                                    <div
                                      onMouseDown={(e) => {
                                        const container = document.getElementById(`freestyle-container-${blockIndex}`);
                                        handleStartResize(e, blockIndex, itemIndex, container);
                                      }}
                                      className="absolute -bottom-2.5 -right-2.5 w-6 h-6 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center cursor-nwse-resize shadow-2xl z-30 transition-transform hover:scale-125 active:scale-110 select-none border border-white/50 group/handle"
                                      title="Arrastra esta esquina para cambiar Ancho y Alto en vivo"
                                    >
                                      <Maximize2 className="w-3 h-3 rotate-90" />
                                    </div>

                                    {/* Item Drag Handle & Toolbar */}
                                    <div
                                      draggable
                                      onDragStart={(e) => {
                                        e.dataTransfer.setData('canvasItemMoveIndex', String(itemIndex));
                                        const cardEl = (e.currentTarget as HTMLElement).closest('.group\\/freeitem') as HTMLElement;
                                        if (cardEl) {
                                          const cardRect = cardEl.getBoundingClientRect();
                                          e.dataTransfer.setData('grabOffsetX', String(e.clientX - cardRect.left));
                                          e.dataTransfer.setData('grabOffsetY', String(e.clientY - cardRect.top));
                                        }
                                        setDraggedCanvasItemIndex({ blockIndex, itemIndex });
                                      }}
                                      onDragEnd={() => setDraggedCanvasItemIndex(null)}
                                      className={`flex items-center justify-between border-b border-white/10 pb-2 mb-3 bg-black/60 -mx-4 -mt-4 sm:-mx-5 sm:-mt-5 p-3 rounded-t-3xl cursor-grab active:cursor-grabbing select-none backdrop-blur-md transition-opacity ${
                                        isPreviewMode ? 'opacity-30 hover:opacity-100' : 'opacity-100'
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <Move className="w-3.5 h-3.5 text-emerald-400" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                                          {item.type}
                                        </span>
                                        <span className="text-[9px] font-mono text-zinc-400">
                                          ({itemX}%, {itemY}%)
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-1">
                                        {/* Dock Next to Previous Button (JUNTOS) */}
                                        {itemIndex > 0 && (
                                          <button
                                            type="button"
                                            onClick={() => handleDockNextToPrevious(blockIndex, itemIndex)}
                                            className="p-1 rounded-md text-emerald-400 hover:text-white hover:bg-emerald-500/20 cursor-pointer flex items-center gap-0.5 text-[9px] px-1.5 border border-emerald-500/30"
                                            title="Pegar y acoplar al widget anterior con 0% de separación"
                                          >
                                            <Link2 className="w-3 h-3" />
                                            <span className="hidden sm:inline">Pegar</span>
                                          </button>
                                        )}

                                        {/* Layer Z-Index Up / Down */}
                                        <div className="flex items-center bg-zinc-900 border border-white/10 rounded-md">
                                          <button
                                            type="button"
                                            onClick={() => handleChangeCanvasItemZIndex(blockIndex, itemIndex, 'up')}
                                            className="p-1 text-zinc-400 hover:text-white cursor-pointer"
                                            title="Traer al frente (Capa +1)"
                                          >
                                            <ArrowUp className="w-3 h-3" />
                                          </button>
                                          <span className="text-[9px] font-mono px-1 text-zinc-400">z:{itemZ}</span>
                                          <button
                                            type="button"
                                            onClick={() => handleChangeCanvasItemZIndex(blockIndex, itemIndex, 'down')}
                                            className="p-1 text-zinc-400 hover:text-white cursor-pointer"
                                            title="Enviar al fondo (Capa -1)"
                                          >
                                            <ArrowDown className="w-3 h-3" />
                                          </button>
                                        </div>

                                        {/* Width % Presets */}
                                        <div className="flex items-center bg-zinc-900 border border-white/10 rounded-md p-0.5 text-[9px]">
                                          {[25, 36, 50, 75].map((w) => (
                                            <button
                                              key={w}
                                              type="button"
                                              onClick={() => {
                                                const updated = [...blocks];
                                                updated[blockIndex].content.items[itemIndex].width = w;
                                                setBlocks(updated);
                                              }}
                                              className={`px-1 py-0.5 rounded cursor-pointer ${
                                                itemWidth === w ? 'bg-zinc-700 text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'
                                              }`}
                                              title={`Ancho ${w}%`}
                                            >
                                              {w}%
                                            </button>
                                          ))}
                                        </div>

                                        {/* Rotation Preset */}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const updated = [...blocks];
                                            const nextRot = itemRot === -3 ? 3 : itemRot === 3 ? 0 : -3;
                                            updated[blockIndex].content.items[itemIndex].rotation = nextRot;
                                            setBlocks(updated);
                                          }}
                                          className={`p-1 rounded-md cursor-pointer transition-colors ${
                                            itemRot !== 0 ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-400 hover:text-white'
                                          }`}
                                          title={`Rotación: ${itemRot}° (Clic para alternar)`}
                                        >
                                          <RotateCw className="w-3 h-3" />
                                        </button>

                                        {/* Duplicate */}
                                        <button
                                          type="button"
                                          onClick={() => handleDuplicateCanvasItem(blockIndex, itemIndex)}
                                          className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
                                          title="Duplicar elemento"
                                        >
                                          <Copy className="w-3 h-3" />
                                        </button>

                                        {/* Delete */}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const updated = [...blocks];
                                            updated[blockIndex].content.items = updated[blockIndex].content.items.filter(
                                              (_: any, idx: number) => idx !== itemIndex
                                            );
                                            setBlocks(updated);
                                          }}
                                          className="p-1 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                                          title="Eliminar elemento"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* 1:1 WYSIWYG REAL RENDERING VIEW */}
                                    {isPreviewMode ? (
                                      <div className="flex-1 flex flex-col justify-between h-full">
                                        {/* 1. Image Preview */}
                                        {item.type === 'image' && (
                                          <div
                                            className="relative w-full h-full flex flex-col justify-end -mt-3"
                                            style={{ minHeight: `${itemHeight - 40}px` }}
                                          >
                                            {item.content?.imageUrl && (
                                              <img
                                                src={item.content.imageUrl}
                                                alt={item.content.title || 'Imagen'}
                                                className="absolute inset-0 w-full h-full object-cover"
                                              />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />
                                            <div className="relative p-5 z-10">
                                              {item.content?.title && (
                                                <h3 className="font-semibold text-white tracking-tight text-xl">
                                                  {item.content.title}
                                                </h3>
                                              )}
                                              {item.content?.subtitle && (
                                                <p className="text-xs sm:text-sm text-zinc-300 mt-1 font-normal">
                                                  {item.content.subtitle}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        )}

                                        {/* 2. Text Preview */}
                                        {item.type === 'text' && (
                                          <div className={`space-y-2.5 my-auto ${item.content?.alignment === 'center' ? 'text-center' : item.content?.alignment === 'right' ? 'text-right' : 'text-left'}`}>
                                            {item.content?.heading && (
                                              <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
                                                {item.content.heading}
                                              </h3>
                                            )}
                                            {item.content?.bodyText && (
                                              <p className="text-sm text-zinc-300 leading-relaxed font-normal">
                                                {item.content.bodyText}
                                              </p>
                                            )}
                                          </div>
                                        )}

                                        {/* 3. Card Preview */}
                                        {item.type === 'card' && (
                                          <div className="space-y-2.5 my-auto">
                                            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-2">
                                              <Sparkles className="w-4 h-4" />
                                            </div>
                                            {item.content?.cardTitle && (
                                              <h3 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                                                {item.content.cardTitle}
                                              </h3>
                                            )}
                                            {item.content?.cardDescription && (
                                              <p className="text-sm text-zinc-300 leading-relaxed font-normal">
                                                {item.content.cardDescription}
                                              </p>
                                            )}
                                          </div>
                                        )}

                                        {/* 4. Button Preview */}
                                        {item.type === 'button' && (
                                          <div className="flex items-center justify-center h-full my-auto py-2">
                                            <span className="apple-button-primary text-sm font-medium px-6 py-2.5 rounded-full inline-flex items-center gap-2 shadow-lg">
                                              <span>{item.content?.buttonText || 'Conocer Más'}</span>
                                              <ArrowRight className="w-4 h-4" />
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      /* STANDARD EDITABLE FORM BODY */
                                      <div className="space-y-3">
                                        {/* 1. Image */}
                                        {item.type === 'image' && (
                                          <div className="space-y-2.5">
                                            <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-white/10 group/img">
                                              {item.content.imageUrl ? (
                                                <img
                                                  src={item.content.imageUrl}
                                                  alt={item.content.title || 'Imagen libre'}
                                                  className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                                                />
                                              ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 p-2 text-center">
                                                  <ImageIcon className="w-5 h-5 mb-1" />
                                                  <span className="text-[11px]">Sin imagen</span>
                                                </div>
                                              )}
                                              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                                              <div className="absolute bottom-2 left-2 right-2 z-10 pointer-events-none">
                                                {item.content.title && (
                                                  <h5 className="text-xs font-semibold text-white truncate">{item.content.title}</h5>
                                                )}
                                              </div>
                                              <label className="absolute inset-0 bg-black/75 opacity-0 group-hover/img:opacity-100 flex flex-col items-center justify-center text-white text-xs cursor-pointer transition-opacity">
                                                <Upload className="w-4 h-4 mb-1 text-emerald-400" />
                                                <span>{isUploading ? 'Subiendo...' : 'Subir imagen'}</span>
                                                <input
                                                  type="file"
                                                  accept="image/*"
                                                  disabled={isUploading}
                                                  className="hidden"
                                                  onChange={(e) => {
                                                    const f = e.target.files?.[0];
                                                    if (f) handleUploadCanvasImage(blockIndex, itemIndex, f);
                                                  }}
                                                />
                                              </label>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                              <input
                                                type="text"
                                                value={item.content.title || ''}
                                                onChange={(e) => {
                                                  const updated = [...blocks];
                                                  updated[blockIndex].content.items[itemIndex].content.title = e.target.value;
                                                  setBlocks(updated);
                                                }}
                                                placeholder="Título..."
                                                className="apple-input w-full rounded-xl px-2 py-1 text-xs text-white"
                                              />
                                              <input
                                                type="text"
                                                value={item.content.subtitle || ''}
                                                onChange={(e) => {
                                                  const updated = [...blocks];
                                                  updated[blockIndex].content.items[itemIndex].content.subtitle = e.target.value;
                                                  setBlocks(updated);
                                                }}
                                                placeholder="Subtítulo..."
                                                className="apple-input w-full rounded-xl px-2 py-1 text-xs text-white"
                                              />
                                            </div>
                                            <input
                                              type="text"
                                              value={item.content.imageUrl || ''}
                                              onChange={(e) => {
                                                const updated = [...blocks];
                                                updated[blockIndex].content.items[itemIndex].content.imageUrl = e.target.value;
                                                setBlocks(updated);
                                              }}
                                              placeholder="O URL de imagen..."
                                              className="apple-input w-full rounded-xl px-2 py-1 text-xs text-white font-mono placeholder-zinc-600"
                                            />
                                          </div>
                                        )}

                                        {/* 2. Text */}
                                        {item.type === 'text' && (
                                          <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                              <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Texto</label>
                                              <div className="flex items-center gap-0.5 bg-zinc-900 border border-white/10 rounded-md p-0.5">
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const updated = [...blocks];
                                                    updated[blockIndex].content.items[itemIndex].content.alignment = 'left';
                                                    setBlocks(updated);
                                                  }}
                                                  className={`p-1 rounded cursor-pointer ${
                                                    item.content.alignment === 'left' ? 'bg-zinc-700 text-white' : 'text-zinc-500'
                                                  }`}
                                                >
                                                  <AlignLeft className="w-2.5 h-2.5" />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const updated = [...blocks];
                                                    updated[blockIndex].content.items[itemIndex].content.alignment = 'center';
                                                    setBlocks(updated);
                                                  }}
                                                  className={`p-1 rounded cursor-pointer ${
                                                    item.content.alignment === 'center' ? 'bg-zinc-700 text-white' : 'text-zinc-500'
                                                  }`}
                                                >
                                                  <AlignCenter className="w-2.5 h-2.5" />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const updated = [...blocks];
                                                    updated[blockIndex].content.items[itemIndex].content.alignment = 'right';
                                                    setBlocks(updated);
                                                  }}
                                                  className={`p-1 rounded cursor-pointer ${
                                                    item.content.alignment === 'right' ? 'bg-zinc-700 text-white' : 'text-zinc-500'
                                                  }`}
                                                >
                                                  <AlignRight className="w-2.5 h-2.5" />
                                                </button>
                                              </div>
                                            </div>
                                            <input
                                              type="text"
                                              value={item.content.heading || ''}
                                              onChange={(e) => {
                                                const updated = [...blocks];
                                                updated[blockIndex].content.items[itemIndex].content.heading = e.target.value;
                                                setBlocks(updated);
                                              }}
                                              placeholder="Título..."
                                              className="apple-input w-full rounded-xl px-2.5 py-1 text-xs text-white font-semibold"
                                            />
                                            <textarea
                                              value={item.content.bodyText || ''}
                                              onChange={(e) => {
                                                const updated = [...blocks];
                                                updated[blockIndex].content.items[itemIndex].content.bodyText = e.target.value;
                                                setBlocks(updated);
                                              }}
                                              rows={2}
                                              placeholder="Párrafo libre..."
                                              className="apple-input w-full rounded-xl px-2.5 py-1 text-xs text-white resize-none"
                                            />
                                          </div>
                                        )}

                                        {/* 3. Card */}
                                        {item.type === 'card' && (
                                          <div className="space-y-2">
                                            <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                                              <Square className="w-3.5 h-3.5" />
                                            </div>
                                            <input
                                              type="text"
                                              value={item.content.cardTitle || ''}
                                              onChange={(e) => {
                                                const updated = [...blocks];
                                                updated[blockIndex].content.items[itemIndex].content.cardTitle = e.target.value;
                                                setBlocks(updated);
                                              }}
                                              placeholder="Título tarjeta..."
                                              className="apple-input w-full rounded-xl px-2.5 py-1 text-xs text-white font-semibold"
                                            />
                                            <textarea
                                              value={item.content.cardDescription || ''}
                                              onChange={(e) => {
                                                const updated = [...blocks];
                                                updated[blockIndex].content.items[itemIndex].content.cardDescription = e.target.value;
                                                setBlocks(updated);
                                              }}
                                              rows={2}
                                              placeholder="Descripción..."
                                              className="apple-input w-full rounded-xl px-2.5 py-1 text-xs text-white resize-none"
                                            />
                                          </div>
                                        )}

                                        {/* 4. Button */}
                                        {item.type === 'button' && (
                                          <div className="space-y-2">
                                            <input
                                              type="text"
                                              value={item.content.buttonText || ''}
                                              onChange={(e) => {
                                                const updated = [...blocks];
                                                updated[blockIndex].content.items[itemIndex].content.buttonText = e.target.value;
                                                setBlocks(updated);
                                              }}
                                              placeholder="Texto botón..."
                                              className="apple-input w-full rounded-xl px-2.5 py-1 text-xs text-white font-medium"
                                            />
                                            <input
                                              type="text"
                                              value={item.content.buttonUrl || ''}
                                              onChange={(e) => {
                                                const updated = [...blocks];
                                                updated[blockIndex].content.items[itemIndex].content.buttonUrl = e.target.value;
                                                setBlocks(updated);
                                              }}
                                              placeholder="https://... o #enlace"
                                              className="apple-input w-full rounded-xl px-2.5 py-1 text-xs text-white font-mono placeholder-zinc-600"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        ) : (
                          /* 3B. MAGNETIC GRID CANVAS VIEW (MODO CUADRÍCULA BENTO) */
                          <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              const wType = e.dataTransfer.getData('canvasWidgetType') as CanvasItem['type'];
                              if (wType) handleDropWidgetOnCanvas(blockIndex, undefined, wType);
                            }}
                            className="grid w-full transition-all duration-300"
                            style={{
                              gridTemplateColumns: `repeat(${block.content.columns || 3}, minmax(0, 1fr))`,
                              gap: `${block.content.gap || 16}px`,
                            }}
                          >
                            {Array.isArray(block.content.items) &&
                              block.content.items.map((item: CanvasItem, itemIndex: number) => {
                                const columnsCount = block.content.columns || 3;
                                const effectiveColSpan = Math.min(item.colSpan || 1, columnsCount);
                                const effectiveRowSpan = item.rowSpan || 1;
                                const isUploading = uploadingSlotId === `canvas-${blockIndex}-${itemIndex}`;

                                return (
                                  <div
                                    key={item.id || itemIndex}
                                    draggable
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData('canvasItemIndex', String(itemIndex));
                                      setDraggedCanvasItemIndex({ blockIndex, itemIndex });
                                    }}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      const sourceIndexStr = e.dataTransfer.getData('canvasItemIndex');
                                      if (sourceIndexStr !== '') {
                                        handleReorderCanvasItems(blockIndex, Number(sourceIndexStr), itemIndex);
                                      } else {
                                        const wType = e.dataTransfer.getData('canvasWidgetType') as CanvasItem['type'];
                                        if (wType) handleDropWidgetOnCanvas(blockIndex, itemIndex, wType);
                                      }
                                    }}
                                    onDragEnd={() => setDraggedCanvasItemIndex(null)}
                                    className={`apple-glass rounded-3xl p-5 border transition-all duration-200 flex flex-col justify-between relative group/item shadow-xl ${
                                      draggedCanvasItemIndex?.blockIndex === blockIndex && draggedCanvasItemIndex?.itemIndex === itemIndex
                                        ? 'opacity-40 border-dashed border-emerald-400 scale-95'
                                        : 'border-white/15 hover:border-emerald-400/50'
                                    }`}
                                    style={{
                                      gridColumn: `span ${effectiveColSpan}`,
                                      gridRow: `span ${effectiveRowSpan}`,
                                      minHeight: effectiveRowSpan > 1 ? '380px' : '200px',
                                    }}
                                  >
                                    {/* Item Header Toolbar */}
                                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
                                      <div className="flex items-center gap-2">
                                        <div className="cursor-grab active:cursor-grabbing p-1 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-white">
                                          <GripVertical className="w-3.5 h-3.5" />
                                        </div>
                                        <span
                                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                                            item.type === 'image'
                                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                              : item.type === 'text'
                                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                              : item.type === 'card'
                                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                          }`}
                                        >
                                          {item.type}
                                        </span>
                                      </div>

                                      {/* Span Controls, Duplicate & Delete */}
                                      <div className="flex items-center gap-1.5">
                                        {/* ColSpan Controls */}
                                        <div className="flex items-center bg-zinc-900 border border-white/10 rounded-lg p-0.5 text-[10px]">
                                          {[1, 2, 3, 4].map(
                                            (span) =>
                                              span <= columnsCount && (
                                                <button
                                                  key={span}
                                                  type="button"
                                                  onClick={() => {
                                                    const updated = [...blocks];
                                                    updated[blockIndex].content.items[itemIndex].colSpan = span;
                                                    setBlocks(updated);
                                                  }}
                                                  className={`px-1.5 py-0.5 rounded font-mono transition-all cursor-pointer ${
                                                    effectiveColSpan === span
                                                      ? 'bg-zinc-700 text-white font-bold'
                                                      : 'text-zinc-500 hover:text-zinc-300'
                                                  }`}
                                                  title={`Ocupar ${span} columna(s)`}
                                                >
                                                  {span}c
                                                </button>
                                              )
                                          )}
                                        </div>

                                        {/* RowSpan Controls */}
                                        <div className="flex items-center bg-zinc-900 border border-white/10 rounded-lg p-0.5 text-[10px]">
                                          {[1, 2].map((rSpan) => (
                                            <button
                                              key={rSpan}
                                              type="button"
                                              onClick={() => {
                                                const updated = [...blocks];
                                                updated[blockIndex].content.items[itemIndex].rowSpan = rSpan;
                                                setBlocks(updated);
                                              }}
                                              className={`px-1.5 py-0.5 rounded font-mono transition-all cursor-pointer ${
                                                effectiveRowSpan === rSpan
                                                  ? 'bg-zinc-700 text-white font-bold'
                                                  : 'text-zinc-500 hover:text-zinc-300'
                                              }`}
                                              title={`Ocupar ${rSpan} fila(s) de alto`}
                                            >
                                              {rSpan}f
                                            </button>
                                          ))}
                                        </div>

                                        {/* Duplicate */}
                                        <button
                                          type="button"
                                          onClick={() => handleDuplicateCanvasItem(blockIndex, itemIndex)}
                                          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer transition-all"
                                          title="Duplicar"
                                        >
                                          <Copy className="w-3.5 h-3.5" />
                                        </button>

                                        {/* Remove Item */}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const updated = [...blocks];
                                            updated[blockIndex].content.items = updated[blockIndex].content.items.filter(
                                              (_: any, idx: number) => idx !== itemIndex
                                            );
                                            setBlocks(updated);
                                          }}
                                          className="p-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition-all"
                                          title="Eliminar este espacio"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Item Body: According to Widget Type */}
                                    <div className="flex-1 space-y-3">
                                      {/* 1. IMAGE WIDGET BODY */}
                                      {item.type === 'image' && (
                                        <div className="space-y-3">
                                          <div className="relative aspect-video rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 group/img">
                                            {item.content.imageUrl ? (
                                              <img
                                                src={item.content.imageUrl}
                                                alt={item.content.title || 'Imagen reservada'}
                                                className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                                              />
                                            ) : (
                                              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 p-4 text-center">
                                                <ImageIcon className="w-6 h-6 mb-1" />
                                                <span className="text-xs">Espacio de imagen vacío</span>
                                              </div>
                                            )}

                                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                                            <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none">
                                              {item.content.title && (
                                                <h5 className="text-sm font-semibold text-white truncate">
                                                  {item.content.title}
                                                </h5>
                                              )}
                                              {item.content.subtitle && (
                                                <p className="text-[11px] text-zinc-300 truncate">
                                                  {item.content.subtitle}
                                                </p>
                                              )}
                                            </div>

                                            {/* Upload Hover Overlay */}
                                            <label className="absolute inset-0 bg-black/75 opacity-0 group-hover/img:opacity-100 flex flex-col items-center justify-center text-white text-xs cursor-pointer transition-opacity backdrop-blur-xs">
                                              <Upload className="w-5 h-5 mb-1 text-emerald-400" />
                                              <span className="font-medium">
                                                {isUploading ? 'Subiendo...' : 'Subir imagen'}
                                              </span>
                                              <input
                                                type="file"
                                                accept="image/*"
                                                disabled={isUploading}
                                                className="hidden"
                                                onChange={(e) => {
                                                  const f = e.target.files?.[0];
                                                  if (f) handleUploadCanvasImage(blockIndex, itemIndex, f);
                                                }}
                                              />
                                            </label>
                                          </div>

                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <input
                                              type="text"
                                              value={item.content.title || ''}
                                              onChange={(e) => {
                                                const updated = [...blocks];
                                                updated[blockIndex].content.items[itemIndex].content.title = e.target.value;
                                                setBlocks(updated);
                                              }}
                                              placeholder="Título..."
                                              className="apple-input w-full rounded-xl px-2.5 py-1.5 text-xs text-white"
                                            />
                                            <input
                                              type="text"
                                              value={item.content.subtitle || ''}
                                              onChange={(e) => {
                                                const updated = [...blocks];
                                                updated[blockIndex].content.items[itemIndex].content.subtitle = e.target.value;
                                                setBlocks(updated);
                                              }}
                                              placeholder="Subtítulo..."
                                              className="apple-input w-full rounded-xl px-2.5 py-1.5 text-xs text-white"
                                            />
                                          </div>

                                          <input
                                            type="text"
                                            value={item.content.imageUrl || ''}
                                            onChange={(e) => {
                                              const updated = [...blocks];
                                              updated[blockIndex].content.items[itemIndex].content.imageUrl = e.target.value;
                                              setBlocks(updated);
                                            }}
                                            placeholder="O pegar URL directa de imagen..."
                                            className="apple-input w-full rounded-xl px-2.5 py-1.5 text-xs text-white font-mono placeholder-zinc-600"
                                          />
                                        </div>
                                      )}

                                      {/* 2. TEXT WIDGET BODY */}
                                      {item.type === 'text' && (
                                        <div className="space-y-2.5">
                                          <div className="flex items-center justify-between">
                                            <label className="text-[10px] text-zinc-500 uppercase tracking-wider">
                                              Encabezado
                                            </label>
                                            <div className="flex items-center gap-1 bg-zinc-900 border border-white/10 rounded-lg p-0.5">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const updated = [...blocks];
                                                  updated[blockIndex].content.items[itemIndex].content.alignment = 'left';
                                                  setBlocks(updated);
                                                }}
                                                className={`p-1 rounded cursor-pointer ${
                                                  item.content.alignment === 'left' ? 'bg-zinc-700 text-white' : 'text-zinc-500'
                                                }`}
                                              >
                                                <AlignLeft className="w-3 h-3" />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const updated = [...blocks];
                                                  updated[blockIndex].content.items[itemIndex].content.alignment = 'center';
                                                  setBlocks(updated);
                                                }}
                                                className={`p-1 rounded cursor-pointer ${
                                                  item.content.alignment === 'center' ? 'bg-zinc-700 text-white' : 'text-zinc-500'
                                                }`}
                                              >
                                                <AlignCenter className="w-3 h-3" />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const updated = [...blocks];
                                                  updated[blockIndex].content.items[itemIndex].content.alignment = 'right';
                                                  setBlocks(updated);
                                                }}
                                                className={`p-1 rounded cursor-pointer ${
                                                  item.content.alignment === 'right' ? 'bg-zinc-700 text-white' : 'text-zinc-500'
                                                }`}
                                              >
                                                <AlignRight className="w-3 h-3" />
                                              </button>
                                            </div>
                                          </div>

                                          <input
                                            type="text"
                                            value={item.content.heading || ''}
                                            onChange={(e) => {
                                              const updated = [...blocks];
                                              updated[blockIndex].content.items[itemIndex].content.heading = e.target.value;
                                              setBlocks(updated);
                                            }}
                                            placeholder="Título del bloque de texto..."
                                            className="apple-input w-full rounded-xl px-2.5 py-1.5 text-xs text-white font-semibold"
                                          />

                                          <textarea
                                            value={item.content.bodyText || ''}
                                            onChange={(e) => {
                                              const updated = [...blocks];
                                              updated[blockIndex].content.items[itemIndex].content.bodyText = e.target.value;
                                              setBlocks(updated);
                                            }}
                                            rows={3}
                                            placeholder="Escribe aquí el contenido o párrafo..."
                                            className="apple-input w-full rounded-xl px-2.5 py-1.5 text-xs text-white resize-none"
                                          />
                                        </div>
                                      )}

                                      {/* 3. CARD WIDGET BODY */}
                                      {item.type === 'card' && (
                                        <div className="space-y-2.5">
                                          <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-1">
                                            <Square className="w-4 h-4" />
                                          </div>
                                          <input
                                            type="text"
                                            value={item.content.cardTitle || ''}
                                            onChange={(e) => {
                                              const updated = [...blocks];
                                              updated[blockIndex].content.items[itemIndex].content.cardTitle = e.target.value;
                                              setBlocks(updated);
                                            }}
                                            placeholder="Título de la tarjeta..."
                                            className="apple-input w-full rounded-xl px-2.5 py-1.5 text-xs text-white font-semibold"
                                          />
                                          <textarea
                                            value={item.content.cardDescription || ''}
                                            onChange={(e) => {
                                              const updated = [...blocks];
                                              updated[blockIndex].content.items[itemIndex].content.cardDescription = e.target.value;
                                              setBlocks(updated);
                                            }}
                                            rows={2}
                                            placeholder="Descripción de la tarjeta..."
                                            className="apple-input w-full rounded-xl px-2.5 py-1.5 text-xs text-white resize-none"
                                          />
                                        </div>
                                      )}

                                      {/* 4. BUTTON WIDGET BODY */}
                                      {item.type === 'button' && (
                                        <div className="space-y-2.5">
                                          <input
                                            type="text"
                                            value={item.content.buttonText || ''}
                                            onChange={(e) => {
                                              const updated = [...blocks];
                                              updated[blockIndex].content.items[itemIndex].content.buttonText = e.target.value;
                                              setBlocks(updated);
                                            }}
                                            placeholder="Texto del botón..."
                                            className="apple-input w-full rounded-xl px-2.5 py-1.5 text-xs text-white font-medium"
                                          />
                                          <input
                                            type="text"
                                            value={item.content.buttonUrl || ''}
                                            onChange={(e) => {
                                              const updated = [...blocks];
                                              updated[blockIndex].content.items[itemIndex].content.buttonUrl = e.target.value;
                                              setBlocks(updated);
                                            }}
                                            placeholder="URL de enlace (ej. https://... o #seccion)"
                                            className="apple-input w-full rounded-xl px-2.5 py-1.5 text-xs text-white font-mono placeholder-zinc-600"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}

                            {/* End Dropzone / Add Slot Area in Grid Mode */}
                            <div
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                e.preventDefault();
                                const wType = e.dataTransfer.getData('canvasWidgetType') as CanvasItem['type'];
                                if (wType) handleDropWidgetOnCanvas(blockIndex, undefined, wType);
                              }}
                              className="border-2 border-dashed border-white/20 hover:border-emerald-400/80 rounded-3xl p-6 flex flex-col items-center justify-center text-center transition-all bg-black/20 hover:bg-emerald-950/20 min-h-[180px] group"
                            >
                              <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/10 group-hover:bg-emerald-500/20 group-hover:border-emerald-400/30 flex items-center justify-center text-zinc-400 group-hover:text-emerald-400 mb-2.5 transition-all">
                                <Plus className="w-5 h-5" />
                              </div>
                              <span className="text-xs font-medium text-zinc-300 group-hover:text-white">
                                Soltar elemento aquí para reservar espacio
                              </span>
                              <span className="text-[11px] text-zinc-500 mt-0.5 mb-3">
                                O haz clic en cualquiera de los accesos directos:
                              </span>

                              <div className="flex flex-wrap items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleDropWidgetOnCanvas(blockIndex, undefined, 'image')}
                                  className="text-[11px] bg-white/[0.06] hover:bg-emerald-600/30 text-zinc-300 hover:text-emerald-300 border border-white/10 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                                >
                                  + Imagen
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDropWidgetOnCanvas(blockIndex, undefined, 'text')}
                                  className="text-[11px] bg-white/[0.06] hover:bg-blue-600/30 text-zinc-300 hover:text-blue-300 border border-white/10 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                                >
                                  + Texto
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDropWidgetOnCanvas(blockIndex, undefined, 'card')}
                                  className="text-[11px] bg-white/[0.06] hover:bg-purple-600/30 text-zinc-300 hover:text-purple-300 border border-white/10 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                                >
                                  + Tarjeta
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDropWidgetOnCanvas(blockIndex, undefined, 'button')}
                                  className="text-[11px] bg-white/[0.06] hover:bg-amber-600/30 text-zinc-300 hover:text-amber-300 border border-white/10 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                                >
                                  + Botón
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

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
