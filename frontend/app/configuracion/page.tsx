'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WorkspaceShell } from '@/components/workspace-shell';

export default function ConfiguracionPage() {
  const [name, setName] = useState('Julio');
  const [email, setEmail] = useState('admin@updm.mx');
  const [isSaved, setIsSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedName = localStorage.getItem('erp_user_name');
    if (savedName) setName(savedName);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('erp_user_name', name);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleLogout = () => {
    document.cookie = "isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    router.push('/login');
  };

  return (
    <WorkspaceShell
      active="/configuracion"
      eyebrow="Ajustes del sistema"
      title="Configuración de Perfil"
      subtitle="Personaliza tu experiencia en el ERP UPDM. Los cambios se guardan de forma persistente."
    >
      <section className="stack">
        <div className="card" style={{ maxWidth: '600px' }}>
          <div className="card__header">
            <div>
              <h3 className="card__title">Información del Administrador</h3>
              <p className="card__label">Estos datos aparecen en tus reportes y menú lateral.</p>
            </div>
          </div>
          
          <form className="card__body stack" onSubmit={handleSave}>
            <div className="form__row">
              <label className="form__label">Nombre a mostrar</label>
              <input 
                className="form__input" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Tu nombre"
                required
              />
            </div>

            <div className="form__row">
              <label className="form__label">Correo electrónico (Acceso)</label>
              <input 
                className="form__input" 
                type="email" 
                value={email} 
                disabled 
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
              <p className="footer-note">El correo de acceso no puede cambiarse en la versión actual.</p>
            </div>

            <div className="form__actions" style={{ marginTop: '12px' }}>
              <button className="button button--primary" type="submit">
                {isSaved ? '✅ Guardado correctamente' : '💾 Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>

        <div className="card" style={{ maxWidth: '600px', borderLeft: '4px solid #c0392b' }}>
          <div className="card__header">
            <h3 className="card__title" style={{ color: '#c0392b' }}>Zona de Seguridad</h3>
          </div>
          <div className="card__body stack">
            <p className="card__label">Si has terminado de trabajar, te recomendamos cerrar sesión para proteger la integridad de tus datos financieros.</p>
            <button 
              className="button" 
              style={{ background: '#c0392b', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, width: 'fit-content' }}
              onClick={handleLogout}
            >
              🔒 Cerrar Sesión de Forma Segura
            </button>
          </div>
        </div>
      </section>
    </WorkspaceShell>
  );
}
