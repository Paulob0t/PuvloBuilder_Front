import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layers, Lock, Mail, User, ArrowRight, AlertCircle, ExternalLink } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface LoginCustomization {
  title?: string;
  subtitle?: string;
  badgeText?: string;
  logoUrl?: string;
  bgImageUrl?: string;
  bgBlur?: number;
  bgDarkness?: number;
  glowColor?: string;
  accentColor?: string;
  buttonText?: string;
  helpText?: string;
  showBackLink?: boolean;
}

export const ProjectUserLogin: React.FC = () => {
  const { prefix, slug } = useParams<{ prefix?: string; slug?: string }>();
  const effectiveSlug = slug || prefix;
  const navigate = useNavigate();
  const { loginProjectUser } = useAuth();

  const [projectTitle, setProjectTitle] = useState<string>('');
  const [projectPrefix, setProjectPrefix] = useState<string>(prefix || 'sitio');
  const [loginSettings, setLoginSettings] = useState<LoginCustomization | null>(null);
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
        const p = res.data.project;
        setProjectTitle(p.title);
        if (p.routePrefix) {
          setProjectPrefix(p.routePrefix);
        }
        if (p.settings?.loginSettings) {
          setLoginSettings(p.settings.loginSettings);
        } else if (p.settings?.coverImage) {
          setLoginSettings({ logoUrl: p.settings.coverImage });
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

  // Resolved dynamic values with sensible fallbacks
  const displayTitle = loginSettings?.title || projectTitle || effectiveSlug;
  const displaySubtitle = loginSettings?.subtitle ?? (isRegisterMode ? 'Crea tu usuario para este sitio' : 'Accede al panel del sitio');
  const badgeText = loginSettings?.badgeText || 'Acceso Seguro';
  const logoUrl = loginSettings?.logoUrl;
  const bgImageUrl = loginSettings?.bgImageUrl;
  const bgBlur = typeof loginSettings?.bgBlur === 'number' ? loginSettings.bgBlur : 8;
  const bgDarkness = typeof loginSettings?.bgDarkness === 'number' ? loginSettings.bgDarkness : 65;
  const glowColor = loginSettings?.glowColor || '#10b981';
  const accentColor = loginSettings?.accentColor || '#059669';
  const buttonText = loginSettings?.buttonText || 'Iniciar Sesión';
  const helpText = loginSettings?.helpText;
  const showBackLink = loginSettings?.showBackLink !== undefined ? loginSettings.showBackLink : true;

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center px-4 relative overflow-hidden text-[#f5f5f7] selection:bg-blue-500/30">
      {/* Dynamic full-screen background image */}
      {bgImageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{
            backgroundImage: `url(${bgImageUrl})`,
            filter: `blur(${bgBlur}px)`,
            transform: 'scale(1.08)',
          }}
        />
      )}

      {/* Dynamic dark filter overlay */}
      <div
        className="absolute inset-0 bg-black transition-opacity duration-300"
        style={{ opacity: bgImageUrl ? bgDarkness / 100 : 0.8 }}
      />

      {/* Dynamic ambient background glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[400px] rounded-full blur-[60px] pointer-events-none opacity-25 transition-all duration-300"
        style={{ backgroundColor: glowColor }}
      />

      <div className="w-full max-w-[420px] z-10">
        {/* Header Branding */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div
            className="w-14 h-14 rounded-2xl border flex items-center justify-center shadow-2xl mb-4 overflow-hidden"
            style={{
              backgroundColor: `${accentColor}20`,
              borderColor: `${accentColor}40`,
            }}
          >
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Layers className="w-7 h-7" style={{ color: accentColor }} />
            )}
          </div>

          {badgeText && (
            <span
              className="text-[10px] font-semibold px-3 py-1 rounded-full border mb-2.5 uppercase tracking-wider shadow-xs"
              style={{
                backgroundColor: `${accentColor}15`,
                borderColor: `${accentColor}30`,
                color: accentColor,
              }}
            >
              {badgeText}
            </span>
          )}

          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            {displayTitle}
          </h1>
          <p className="text-[13px] text-[#86868b] mt-1 font-normal max-w-xs text-center">
            {displaySubtitle}
          </p>
        </div>

        {/* Segmented Control */}
        <div className="bg-zinc-900/90 p-1 rounded-full border border-white/10 flex mb-5">
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
        <div className="apple-glass rounded-3xl p-8 shadow-2xl border border-white/15">
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
              className="w-full mt-3 font-medium py-3 rounded-2xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg transition-all"
              style={{
                backgroundColor: accentColor,
                color: accentColor === '#ffffff' ? '#000000' : '#ffffff',
              }}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isRegisterMode ? 'Registrar Usuario' : buttonText}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Help text & Back link footer */}
          <div className="mt-6 pt-5 border-t border-white/[0.08] text-center space-y-2">
            {helpText && (
              <p className="text-xs text-[#86868b]">{helpText}</p>
            )}
            {showBackLink && (
              <div>
                <Link
                  to={`/${projectPrefix}/${effectiveSlug}`}
                  className="text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1.5 transition-colors"
                >
                  <span>Ver sitio público</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
