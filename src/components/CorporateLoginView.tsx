import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  FileCheck2,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { BrandSwoosh } from './ui/BrandSwoosh';

type LoginMode = 'login' | 'forgot';

const FEATURES = [
  { icon: FileCheck2, text: 'Documentos con alertas de vencimiento' },
  { icon: Sparkles, text: 'Evaluación periódica con puntaje A, B y C' },
  { icon: ShieldCheck, text: 'Auditoría de cada cambio en el sistema' },
];

const inputClass =
  'w-full h-12 pl-10 pr-3 rounded-xl border border-white/15 bg-white/5 text-[15px] text-white placeholder:text-white/35 focus:outline-hidden focus:border-[#69bdd7] focus:ring-4 focus:ring-[#69bdd7]/30 transition-all';

export const CorporateLoginView: React.FC = () => {
  const { isAuthConfigured, signIn, sendPasswordReset, showToast } = useApp();

  const [mode, setMode] = useState<LoginMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const fail = (msg: string) => {
    setError(msg);
    setShakeKey((k) => k + 1);
  };

  const switchMode = (next: LoginMode) => {
    setMode(next);
    setError('');
    setInfo('');
  };

  // Inicio de sesión real contra Supabase Auth (correo + contraseña)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      fail('Ingrese su correo corporativo y su contraseña.');
      return;
    }
    setIsLoading(true);
    const result = await signIn(email, password);
    setIsLoading(false);
    if (result.error) {
      fail(result.error);
      return;
    }
    showToast('Sesión iniciada correctamente.', 'success', 'ACCESO CORPORATIVO');
  };

  // Envía el correo de restablecimiento (plantilla "Reset Password" de Supabase)
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!email.trim()) {
      fail('Ingrese el correo con el que inicia sesión.');
      return;
    }
    setIsLoading(true);
    const result = await sendPasswordReset(email);
    setIsLoading(false);
    if (result.error) {
      fail(result.error);
      return;
    }
    // No se revela si el correo existe o no
    setInfo('Si el correo está registrado, recibirá en unos minutos un enlace para crear una nueva contraseña. Revise también la carpeta de spam.');
  };

  return (
    <div style={{ position: "fixed" }} className="dark inset-0 overflow-hidden bg-[#131b2e]">
    <div style={{ zoom: 1 / 0.88, width: "100vw", height: "100vh" }} className="flex overflow-hidden text-white font-sans antialiased">
      {/* Panel de imagen */}
      <section className="relative hidden w-[56%] shrink-0 overflow-hidden lg:block">
        <img
          src="/nd/login-bus-libertadores.webp"
          alt="Bus de pasajeros en una carretera de montaña de Boyacá al anochecer"
          className="absolute inset-0 w-full h-full scale-105 object-cover object-[center_68%] animate-fade-up"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#131b2e] via-[#131b2e]/40 to-[#131b2e]/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#131b2e]" />
        <BrandSwoosh className="absolute -left-10 top-[30%] w-[120%] opacity-70" />

        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3 animate-fade-up">
            <img src="/nd/flotasugamuxi_logo.png" alt="" className="w-12 h-12 rounded-2xl shadow-glow ring-1 ring-white/20 object-cover" />
            <div>
              <p className="font-display text-lg font-semibold leading-none">Flota Sugamuxi</p>
              <p className="mt-1 text-xs text-white/60">Transporte terrestre de pasajeros</p>
            </div>
          </div>

          <div className="max-w-xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full glass-dark px-3 py-1 text-xs text-white/80 animate-fade-up" style={{ animationDelay: '0.15s' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#69bdd7] animate-pulse" /> Sistema de gestión de proveedores
            </p>
            <h1 className="font-display text-5xl font-semibold leading-[1.05] animate-fade-up xl:text-6xl" style={{ animationDelay: '0.25s' }}>
              Cada proveedor en regla.
              <br />
              <span className="text-gradient-brand">Cada viaje, seguro.</span>
            </h1>
            <ul className="mt-8 space-y-3">
              {FEATURES.map((f, i) => (
                <li key={f.text} className="flex items-center gap-3 text-sm text-white/85 animate-fade-up" style={{ animationDelay: `${0.4 + i * 0.12}s` }}>
                  <span className="flex w-9 h-9 items-center justify-center rounded-xl glass-dark">
                    <f.icon className="w-4 h-4 text-[#69bdd7]" />
                  </span>
                  {f.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Panel del formulario */}
      <section className="relative flex flex-1 items-center justify-center px-5 py-10 sm:px-10 min-h-full">
        <div className="absolute inset-0 grid-pattern opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div className="absolute -right-32 -top-32 w-[28rem] h-[28rem] rounded-full bg-[#2c84c4]/35 blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-20 w-[26rem] h-[26rem] rounded-full bg-[#69bdd7]/20 blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
        <img src="/nd/login-bus-libertadores.webp" alt="" className="absolute inset-0 w-full h-full object-cover opacity-25 lg:hidden" />

        <div key={shakeKey} className="relative w-full max-w-md" style={shakeKey > 0 ? { animation: 'nd-shake 0.45s ease-in-out' } : undefined}>
          <div className="gradient-border rounded-[28px] glass-dark p-8 shadow-glow animate-fade-up sm:p-10" style={{ animationDelay: '0.1s' }}>
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-3xl bg-[#69bdd7]/40 blur-xl animate-float" />
                <img src="/nd/flotasugamuxi_logo.png" alt="Flota Sugamuxi" className="relative w-20 h-20 rounded-3xl ring-1 ring-white/25 object-cover animate-float" />
              </div>
              <h2 className="mt-6 font-display text-2xl font-semibold">
                {mode === 'login' ? 'Bienvenido de nuevo' : 'Restablecer contraseña'}
              </h2>
              <p className="mt-1 text-sm text-white/60">
                {mode === 'login'
                  ? 'Ingrese con sus credenciales institucionales'
                  : 'Le enviaremos un enlace a su correo para crear una nueva contraseña'}
              </p>
            </div>

            <div className="mt-7 space-y-3">
              {!isAuthConfigured && (
                <div className="p-2.5 bg-[#2c84c4]/15 border border-[#2c84c4]/35 rounded-xl text-xs text-[#69bdd7] flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>El inicio de sesión no está disponible: faltan las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en este servidor.</span>
                </div>
              )}
              {error && (
                <div className="p-2.5 bg-red-500/15 border border-red-400/40 rounded-xl text-sm text-white flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-300 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {info && (
                <div className="p-2.5 bg-[#2c84c4]/15 border border-[#2c84c4]/35 rounded-xl text-xs text-[#69bdd7] flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#69bdd7] shrink-0 mt-0.5" />
                  <span>{info}</span>
                </div>
              )}

              <form onSubmit={mode === 'login' ? handleLogin : handleForgot} className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="mb-1.5 block text-xs font-medium text-white/70">
                    Correo corporativo
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-white/45 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="usuario@flotasugamuxisa.com.co"
                      className={inputClass}
                    />
                  </div>
                </div>

                {mode === 'login' && (
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label htmlFor="login-password" className="block text-xs font-medium text-white/70">
                        Contraseña
                      </label>
                      <button
                        type="button"
                        onClick={() => switchMode('forgot')}
                        className="text-xs text-[#69bdd7] hover:underline font-semibold cursor-pointer"
                      >
                        ¿Olvidó su contraseña?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-white/45 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••"
                        className={`${inputClass} pr-11`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white cursor-pointer"
                        title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !isAuthConfigured}
                  className="shimmer w-full h-12 rounded-xl bg-gradient-brand text-white text-base font-semibold shadow-glow transition-all hover:opacity-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Verificando…
                    </>
                  ) : (
                    <>
                      <span>{mode === 'login' ? 'Ingresar' : 'Enviar enlace de restablecimiento'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {mode === 'forgot' && (
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="w-full text-center text-sm text-[#69bdd7] hover:underline font-semibold cursor-pointer"
                  >
                    Volver a iniciar sesión
                  </button>
                )}
              </form>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-center gap-1.5 text-xs text-white/55">
              <ShieldCheck className="w-4 h-4 text-[#69bdd7] shrink-0" />
              <span>Conexión cifrada · Acceso restringido</span>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-white/40">
            © {new Date().getFullYear()} Flota Sugamuxi S.A. · Sogamoso, Boyacá
          </p>
        </div>
      </section>
    </div>
    </div>
  );
};
