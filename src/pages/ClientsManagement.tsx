import React, { useEffect, useReducer, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  ExternalLink,
  Mail,
  Phone,
  Building,
  Globe,
  ArrowLeft,
  X,
  AlertCircle,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { clientsReducer, initialClientsState } from '../reducers/clientsReducer';
import type { ClientItem, ClientFormErrors, ProjectOption } from '../types/client';
import { confirmDeleteAlert, showErrorAlert, showSuccessToast } from '../utils/alerts';

export const ClientsManagement: React.FC = () => {
  const navigate = useNavigate();
  const { superAdmin } = useAuth();

  // 1. Implementación obligatoria de useReducer + dispatch para el estado del CRUD
  const [state, dispatch] = useReducer(clientsReducer, initialClientsState);

  // Lista de proyectos disponibles para vincular al cliente
  const [projects, setProjects] = useState<ProjectOption[]>([]);

  // Cargar proyectos disponibles para el selector
  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data.projects || []);
    } catch (err) {
      console.error('Error al cargar proyectos:', err);
    }
  };

  // 2. Petición GET: Listar clientes al montar
  const fetchClients = async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const res = await api.get('/clients');
      dispatch({ type: 'FETCH_SUCCESS', payload: res.data.clients || [] });
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al obtener clientes del API';
      dispatch({ type: 'FETCH_ERROR', payload: message });
      showErrorAlert('Error', message);
    }
  };

  useEffect(() => {
    if (!superAdmin) {
      navigate('/login');
      return;
    }
    fetchClients();
    fetchProjects();
  }, [superAdmin]);

  // 3. Validación de campos de formulario (Requisito de clase)
  const validateForm = (): boolean => {
    const errors: ClientFormErrors = {};
    const { name, email, phone, company } = state.formData;

    if (!name.trim()) {
      errors.name = 'El nombre completo es obligatorio';
    } else if (name.trim().length < 3) {
      errors.name = 'El nombre debe tener al menos 3 caracteres';
    }

    if (!email.trim()) {
      errors.email = 'El correo electrónico es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Ingresa un formato de correo electrónico válido (ej. usuario@dominio.com)';
    }

    if (phone.trim() && !/^[0-9+() -]{7,20}$/.test(phone.trim())) {
      errors.phone = 'Ingresa un número telefónico válido (mínimo 7 dígitos)';
    }

    if (company.trim() && company.trim().length < 2) {
      errors.company = 'El nombre de empresa debe tener al menos 2 caracteres';
    }

    dispatch({ type: 'SET_FORM_ERRORS', payload: errors });
    return Object.keys(errors).length === 0;
  };

  // 4. Peticiones POST y PUT (Crear o Actualizar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showErrorAlert('Campos inválidos', 'Por favor corrige los errores resaltados en el formulario');
      return;
    }

    dispatch({ type: 'SUBMIT_START' });

    const payload = {
      name: state.formData.name.trim(),
      email: state.formData.email.trim(),
      phone: state.formData.phone.trim() || undefined,
      company: state.formData.company.trim() || undefined,
      status: state.formData.status,
      notes: state.formData.notes.trim() || undefined,
      projectId: state.formData.projectId || null,
    };

    try {
      if (state.modalMode === 'create') {
        // PETICIÓN POST
        const res = await api.post('/clients', payload);
        dispatch({ type: 'SUBMIT_SUCCESS_CREATE', payload: res.data.client });
        showSuccessToast('Cliente Creado', res.data.message || 'Cliente registrado con éxito');
      } else if (state.selectedClient) {
        // PETICIÓN PUT
        const res = await api.put(`/clients/${state.selectedClient.id}`, payload);
        dispatch({ type: 'SUBMIT_SUCCESS_UPDATE', payload: res.data.client });
        showSuccessToast('Cliente Actualizado', res.data.message || 'Datos del cliente actualizados');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al procesar la solicitud en el API';
      dispatch({ type: 'SUBMIT_ERROR', payload: message });
      showErrorAlert('Error', message);
    }
  };

  // 5. Petición DELETE (Eliminar con confirmación de Alert)
  const handleDelete = async (client: ClientItem) => {
    const confirmed = await confirmDeleteAlert(`al cliente ${client.name}`);
    if (!confirmed) return;

    try {
      await api.delete(`/clients/${client.id}`);
      dispatch({ type: 'DELETE_CLIENT_SUCCESS', payload: client.id });
      showSuccessToast('Eliminado', `El cliente ${client.name} fue eliminado correctamente`);
    } catch (err: any) {
      const message = err.response?.data?.message || 'No se pudo eliminar el cliente';
      showErrorAlert('Error', message);
    }
  };

  // Filtrado reactivo en memoria
  const filteredClients = state.clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      (client.company && client.company.toLowerCase().includes(state.searchTerm.toLowerCase())) ||
      (client.project && client.project.title.toLowerCase().includes(state.searchTerm.toLowerCase()));

    const matchesStatus =
      state.statusFilter === 'all' ? true : client.status === state.statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-black text-[#f5f5f7] flex flex-col selection:bg-blue-500/30">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[300px] bg-gradient-to-b from-emerald-600/10 via-transparent to-transparent blur-[60px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-black/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin')}
              className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-[#86868b] hover:text-white transition-all cursor-pointer border border-white/10"
              title="Volver a Proyectos"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[15px] tracking-tight text-white">
                PuvloBuilder
              </span>
              <span className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                Gestión de Clientes
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] transition-all"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Ver Sitios & Proyectos</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 z-10 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
              Directorio de Clientes
            </h1>
            <p className="text-[14px] text-[#86868b] mt-1.5 max-w-xl">
              Administra tus clientes, valida su información y asigna a cada uno su respectivo sitio web o proyecto modular.
            </p>
          </div>

          <button
            onClick={() => dispatch({ type: 'OPEN_CREATE_MODAL' })}
            className="apple-button-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm cursor-pointer shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Cliente</span>
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="apple-card rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between border border-white/10">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={state.searchTerm}
              onChange={(e) => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
              placeholder="Buscar por nombre, correo, empresa o sitio..."
              className="apple-input w-full rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-zinc-400 flex items-center gap-1 hidden sm:inline-flex">
              <Filter className="w-3.5 h-3.5" />
              <span>Estado:</span>
            </span>
            <div className="bg-zinc-900 border border-white/10 p-0.5 rounded-xl flex w-full sm:w-auto text-xs">
              {(['all', 'active', 'lead', 'inactive'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => dispatch({ type: 'SET_STATUS_FILTER', payload: st })}
                  className={`flex-1 sm:flex-none px-3 py-1 rounded-lg font-medium transition-all cursor-pointer capitalize ${
                    state.statusFilter === st
                      ? 'bg-zinc-800 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {st === 'all' ? 'Todos' : st === 'active' ? 'Activo' : st === 'lead' ? 'Prospecto' : 'Inactivo'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Clients Table / Grid */}
        {state.loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="w-8 h-8 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="apple-card rounded-3xl p-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/10 text-zinc-400 flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">No hay clientes encontrados</h3>
            <p className="text-sm text-[#86868b] max-w-sm mx-auto mt-1 mb-6">
              {state.searchTerm || state.statusFilter !== 'all'
                ? 'No hay registros que coincidan con los filtros seleccionados.'
                : 'Comienza creando tu primer cliente y asígnale su proyecto web.'}
            </p>
            <button
              onClick={() => dispatch({ type: 'OPEN_CREATE_MODAL' })}
              className="apple-button-primary inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Cliente</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredClients.map((client) => {
              const statusBadge =
                client.status === 'active'
                  ? { label: 'Activo', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' }
                  : client.status === 'lead'
                  ? { label: 'Prospecto', bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' }
                  : { label: 'Inactivo', bg: 'bg-zinc-500/10', border: 'border-zinc-500/20', text: 'text-zinc-400' };

              return (
                <div
                  key={client.id}
                  className="apple-card rounded-3xl p-5 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between group/card shadow-xl"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusBadge.bg} ${statusBadge.border} ${statusBadge.text}`}>
                          {statusBadge.label}
                        </span>
                        <h3 className="text-base font-semibold text-white mt-1.5 tracking-tight group-hover/card:text-blue-400 transition-colors">
                          {client.name}
                        </h3>
                        {client.company && (
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5">
                            <Building className="w-3 h-3 text-zinc-500" />
                            <span>{client.company}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => dispatch({ type: 'OPEN_EDIT_MODAL', payload: client })}
                          className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] text-zinc-400 hover:text-white transition-all cursor-pointer"
                          title="Editar cliente"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(client)}
                          className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-all cursor-pointer"
                          title="Eliminar cliente"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2 text-xs border-t border-white/[0.06] pt-3">
                      <div className="flex items-center gap-2 text-zinc-300">
                        <Mail className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                        <span className="truncate font-mono">{client.email}</span>
                      </div>
                      {client.phone && (
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Phone className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Assigned Project / Site */}
                    <div className="rounded-2xl p-3 bg-white/[0.02] border border-white/[0.08] space-y-1.5">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium flex items-center gap-1">
                        <Globe className="w-3 h-3 text-blue-400" />
                        <span>Sitio / Proyecto Asignado</span>
                      </div>

                      {client.project ? (
                        <div className="flex items-center justify-between gap-2">
                          <div className="truncate">
                            <div className="text-xs font-semibold text-white truncate">
                              {client.project.title}
                            </div>
                            <div className="text-[11px] text-blue-400 font-mono truncate">
                              /{client.project.routePrefix || 'sitio'}/{client.project.slug}
                            </div>
                          </div>

                          <Link
                            to={`/${client.project.routePrefix || 'sitio'}/${client.project.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-all"
                            title="Ver sitio público del cliente"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      ) : (
                        <div className="text-xs text-zinc-500 italic">
                          Sin proyecto web asignado
                        </div>
                      )}
                    </div>

                    {/* Notes if any */}
                    {client.notes && (
                      <p className="text-[11px] text-zinc-400 line-clamp-2 italic bg-black/40 p-2 rounded-xl border border-white/5">
                        "{client.notes}"
                      </p>
                    )}
                  </div>

                  <div className="text-[10px] text-zinc-500 pt-3 border-t border-white/[0.06] flex items-center justify-between font-mono">
                    <span>ID: {client.id.slice(0, 8)}...</span>
                    <span>{new Date(client.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal CRUD: Crear / Editar Cliente */}
      {state.isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="apple-card rounded-3xl w-full max-w-lg p-6 sm:p-7 relative border border-white/15 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-5">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {state.modalMode === 'create' ? 'Registrar Nuevo Cliente' : 'Editar Datos del Cliente'}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Completa los campos y vincula el sitio web correspondiente.
                </p>
              </div>
              <button
                type="button"
                onClick={() => dispatch({ type: 'CLOSE_MODAL' })}
                className="p-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formulario con Validación */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo: Nombre */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                  Nombre Completo <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={state.formData.name}
                  onChange={(e) =>
                    dispatch({
                      type: 'SET_FORM_FIELD',
                      payload: { field: 'name', value: e.target.value },
                    })
                  }
                  placeholder="Ej. Juan Pérez González"
                  className={`apple-input w-full rounded-xl px-3.5 py-2 text-xs text-white ${
                    state.formErrors.name ? 'border-red-500/80 focus:border-red-500' : ''
                  }`}
                />
                {state.formErrors.name && (
                  <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{state.formErrors.name}</span>
                  </p>
                )}
              </div>

              {/* Campo: Correo */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                  Correo Electrónico <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={state.formData.email}
                  onChange={(e) =>
                    dispatch({
                      type: 'SET_FORM_FIELD',
                      payload: { field: 'email', value: e.target.value },
                    })
                  }
                  placeholder="ejemplo@cliente.com"
                  className={`apple-input w-full rounded-xl px-3.5 py-2 text-xs text-white font-mono ${
                    state.formErrors.email ? 'border-red-500/80 focus:border-red-500' : ''
                  }`}
                />
                {state.formErrors.email && (
                  <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{state.formErrors.email}</span>
                  </p>
                )}
              </div>

              {/* 2 Columnas: Teléfono & Empresa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={state.formData.phone}
                    onChange={(e) =>
                      dispatch({
                        type: 'SET_FORM_FIELD',
                        payload: { field: 'phone', value: e.target.value },
                      })
                    }
                    placeholder="+52 33 1234 5678"
                    className={`apple-input w-full rounded-xl px-3 py-2 text-xs text-white ${
                      state.formErrors.phone ? 'border-red-500/80' : ''
                    }`}
                  />
                  {state.formErrors.phone && (
                    <p className="text-[10px] text-red-400 mt-1">{state.formErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                    Empresa / Negocio
                  </label>
                  <input
                    type="text"
                    value={state.formData.company}
                    onChange={(e) =>
                      dispatch({
                        type: 'SET_FORM_FIELD',
                        payload: { field: 'company', value: e.target.value },
                      })
                    }
                    placeholder="Cafetería Central"
                    className={`apple-input w-full rounded-xl px-3 py-2 text-xs text-white ${
                      state.formErrors.company ? 'border-red-500/80' : ''
                    }`}
                  />
                  {state.formErrors.company && (
                    <p className="text-[10px] text-red-400 mt-1">{state.formErrors.company}</p>
                  )}
                </div>
              </div>

              {/* 2 Columnas: Estado & Proyecto Asignado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                    Estado del Cliente
                  </label>
                  <select
                    value={state.formData.status}
                    onChange={(e) =>
                      dispatch({
                        type: 'SET_FORM_FIELD',
                        payload: {
                          field: 'status',
                          value: e.target.value as 'active' | 'lead' | 'inactive',
                        },
                      })
                    }
                    className="apple-input w-full rounded-xl px-3 py-2 text-xs text-white bg-zinc-900 border border-white/10"
                  >
                    <option value="active">Activo</option>
                    <option value="lead">Prospecto (Lead)</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                    Asignar Sitio / Proyecto
                  </label>
                  <select
                    value={state.formData.projectId}
                    onChange={(e) =>
                      dispatch({
                        type: 'SET_FORM_FIELD',
                        payload: { field: 'projectId', value: e.target.value },
                      })
                    }
                    className="apple-input w-full rounded-xl px-3 py-2 text-xs text-white bg-zinc-900 border border-white/10"
                  >
                    <option value="">-- Sin proyecto asignado --</option>
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.title} (/{proj.routePrefix || 'sitio'}/{proj.slug})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Campo: Notas */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                  Notas Adicionales
                </label>
                <textarea
                  rows={2}
                  value={state.formData.notes}
                  onChange={(e) =>
                    dispatch({
                      type: 'SET_FORM_FIELD',
                      payload: { field: 'notes', value: e.target.value },
                    })
                  }
                  placeholder="Detalles sobre el contrato, especificaciones o requerimientos..."
                  className="apple-input w-full rounded-xl px-3.5 py-2 text-xs text-white resize-none"
                />
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'CLOSE_MODAL' })}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={state.submitting}
                  className="apple-button-primary px-5 py-2 rounded-xl text-xs font-medium cursor-pointer shadow-lg disabled:opacity-50 flex items-center gap-1.5"
                >
                  {state.submitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {state.modalMode === 'create' ? 'Registrar Cliente' : 'Guardar Cambios'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
