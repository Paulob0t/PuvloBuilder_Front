import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layers, Lock, Mail, User, ArrowRight, AlertCircle, ExternalLink } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const ProjectUserLogin: React.FC = () => {
  const { prefix, slug } = useParams<{ prefix?: string; slug?: string }>();
  const effectiveSlug = slug || prefix;
  const navigate = useNavigate();
  const { loginProjectUser } = useAuth();

  const [projectTitle, setProjectTitle] = useState<string>('');
  const [projectPrefix, setProjectPrefix] = useState<string>(prefix || 'sitio');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingProject, setCheckingProject] = useState(true);

  useEffect(() => {
    const fetchProjectInfo = async () => {
      if (!effectiveSlug) return;
      try {
        const res = await api.get(`/projects/public/${effectiveSlug}`);
        setProjectTitle(res.data.project.title);
        if (res.data.project.routePrefix) {
          setProjectPrefix(res.data.project.routePrefix);
        }
      } catch {
        setError(`El proyecto '${effectiveSlug}' no fue encontrado.`);
      } finally {
        setCheckingProject(false);
      }
    };

    fetchProjectInfo();
  }, [effectiveSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveSlug) return;
    setError(null);
    setLoading(true);

    try {
      const endpoint = isRegisterMode
        ? `/projects/${effectiveSlug}/auth/register`
        : `/projects/${effectiveSlug}/auth/login`;

      const payload = isRegisterMode ? { email, password, name, role: 'admin' } : { email, password };

      const res = await api.post(endpoint, payload);
      loginProjectUser(res.data.token, res.data.user);
      navigate(`/${projectPrefix}/${effectiveSlug}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error de autenticación.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (checkingProject) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center px-4 relative overflow-hidden text-[#f5f5f7]">
      {/* Ambient background blur */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-[420px] z-10">
        {/* Header Branding */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-b from-emerald-600/30 to-emerald-950/80 border border-emerald-500/20 flex items-center justify-center shadow-2xl mb-4">
            <Layers className="w-6 h-6 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            {projectTitle || effectiveSlug}
          </h1>
          <p className="text-[13px] text-[#86868b] mt-1 font-normal">
            {isRegisterMode ? 'Crea tu usuario para este sitio' : 'Accede al panel del sitio'}
          </p>
          <div className="mt-2.5">
            <span className="text-[11px] bg-white/[0.05] text-[#86868b] px-3 py-1 rounded-full border border-white/[0.08] font-mono">
              /{projectPrefix}/{effectiveSlug}
            </span>
          </div>
        </div>

        {/* Segmented Control */}
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
            Registrar Usuario
          </button>
        </div>

        {/* Card */}
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
                    placeholder="Ej. Juan Subadmin"
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
                  placeholder="usuario@sitio.com"
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
                  <span>{isRegisterMode ? 'Registrar Usuario' : 'Acceder'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/[0.08] text-center">
            <Link
              to={`/${projectPrefix}/${effectiveSlug}`}
              className="text-xs text-[#86868b] hover:text-white inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Ver sitio público</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
