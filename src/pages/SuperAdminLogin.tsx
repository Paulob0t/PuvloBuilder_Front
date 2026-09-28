import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, User, ArrowRight, AlertCircle, Command } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const SuperAdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { loginSuperAdmin } = useAuth();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('admin@puvlo.com');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('Super Admin');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isRegisterMode
        ? '/superadmin/auth/register-initial'
        : '/superadmin/auth/login';

      const payload = isRegisterMode ? { email, password, name } : { email, password };

      const res = await api.post(endpoint, payload);
      loginSuperAdmin(res.data.token, res.data.user);
      navigate('/admin');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al procesar la solicitud.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center px-4 relative overflow-hidden text-[#f5f5f7]">
      {/* Apple-style soft ambient radial lights */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-blue-600/15 via-indigo-600/5 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] bg-cyan-500/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full max-w-[420px] z-10">
        {/* Header Branding */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-b from-zinc-700/80 to-zinc-900/90 border border-white/15 flex items-center justify-center shadow-2xl mb-4 shadow-black/80">
            <Command className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            PuvloBuilder
          </h1>
          <p className="text-[13px] text-[#86868b] mt-1 font-normal">
            {isRegisterMode
              ? 'Configuración inicial del SuperAdmin de la plataforma'
              : 'Inicia sesión con tu cuenta maestra de administrador'}
          </p>
        </div>

        {/* Segmented Control Pill */}
        <div className="bg-zinc-900/80 p-1 rounded-full border border-white/10 flex mb-5 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setIsRegisterMode(false);
            }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-full transition-all duration-200 cursor-pointer ${
              !isRegisterMode
                ? 'bg-zinc-800 text-white shadow-sm shadow-black/50 border border-white/10'
                : 'text-[#86868b] hover:text-white'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setIsRegisterMode(true);
            }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-full transition-all duration-200 cursor-pointer ${
              isRegisterMode
                ? 'bg-zinc-800 text-white shadow-sm shadow-black/50 border border-white/10'
                : 'text-[#86868b] hover:text-white'
            }`}
          >
            Primer Registro
          </button>
        </div>

        {/* Glassmorphic Form Card */}
        <div className="apple-glass rounded-3xl p-8">
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegisterMode && (
              <div>
                <label className="block text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-1.5 pl-1">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Super Admin"
                    className="apple-input w-full rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-1.5 pl-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@puvlo.com"
                  className="apple-input w-full rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-1.5 pl-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="apple-input w-full rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="apple-button-primary w-full mt-3 font-medium py-3 rounded-2xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-md"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isRegisterMode ? 'Crear SuperAdmin Inicial' : 'Continuar'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-[12px] text-[#86868b] mt-8 font-normal">
          PuvloBuilder OS • Dual-Tier Architecture • MariaDB
        </p>
      </div>
    </div>
  );
};
