'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulación de autenticación (Para el MVP)
    // En una fase siguiente conectaremos esto al backend real
    setTimeout(() => {
      if (email === 'admin@updm.mx' && password === 'admin123') {
        // Establecer cookie para el middleware (expira en 1 día)
        document.cookie = "isLoggedIn=true; path=/; max-age=86400; SameSite=Lax";
        router.push('/dashboard');
      } else {
        setError('Credenciales incorrectas. Intenta con admin@updm.mx / admin123');
        setIsLoading(false);
      }
    }, 1200);
  };

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-card__header">
          <div className="login-logo">UPDM</div>
          <h1 className="login-title">Control Financiero</h1>
          <p className="login-subtitle">Ingresa tus credenciales para acceder al ERP.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}
          
          <div className="form__row">
            <label className="form__label">Correo Electrónico</label>
            <input 
              type="email" 
              className="form__input" 
              placeholder="ejemplo@updm.mx"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form__row">
            <label className="form__label">Contraseña</label>
            <input 
              type="password" 
              className="form__input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="button button--primary login-button" 
            disabled={isLoading}
          >
            {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="login-footer">
          &copy; 2026 UPDM S.A. DE C.V. — Sistema Seguro
        </div>
      </div>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 24px;
          background: 
            radial-gradient(circle at 10% 20%, rgba(139, 195, 74, 0.15), transparent 40%),
            radial-gradient(circle at 90% 80%, rgba(191, 255, 117, 0.15), transparent 40%),
            #fbfdf8;
          font-family: sans-serif;
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          padding: 40px;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(139, 195, 74, 0.3);
          border-radius: 32px;
          box-shadow: 0 24px 60px rgba(32, 48, 31, 0.08);
          animation: fadeIn 0.6s ease-out;
        }

        .login-card__header {
          text-align: center;
          margin-bottom: 32px;
        }

        .login-logo {
          display: inline-block;
          padding: 8px 20px;
          background: linear-gradient(135deg, #bfff75, #8bc34a);
          border-radius: 999px;
          font-weight: 800;
          font-size: 1.2rem;
          margin-bottom: 16px;
          color: #20301f;
        }

        .login-title {
          font-size: 1.8rem;
          margin: 0 0 8px;
          letter-spacing: -0.02em;
        }

        .login-subtitle {
          color: #667066;
          font-size: 0.95rem;
        }

        .login-form {
          display: grid;
          gap: 20px;
        }

        .login-error {
          padding: 12px;
          background: rgba(192, 57, 43, 0.1);
          color: #c0392b;
          border-radius: 12px;
          font-size: 0.85rem;
          border: 1px solid rgba(192, 57, 43, 0.2);
          text-align: center;
        }

        .login-button {
          width: 100%;
          font-size: 1rem;
          padding: 14px;
          margin-top: 10px;
        }

        .login-footer {
          margin-top: 32px;
          text-align: center;
          font-size: 0.8rem;
          color: #99a199;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
