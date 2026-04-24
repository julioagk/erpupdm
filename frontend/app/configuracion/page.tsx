'use client';

import { useState, useEffect } from 'react';
import { WorkspaceShell } from '@/components/workspace-shell';

export default function ConfiguracionPage() {
  const [name, setName] = useState('Julio');
  const [email, setEmail] = useState('admin@updm.mx');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem('erp_user_name');
    if (savedName) setName(savedName);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('erp_user_name', name);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
    // En una app real, aquí enviaríamos el cambio al backend (Prisma)
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

        <div className="card" style={{ maxWidth: '600px', borderLeft: '4px solid var(--primary)' }}>
          <div className="card__body">
            <h3 className="card__title">Seguridad</h3>
            <p className="card__label">Tu sesión expira automáticamente cada 24 horas para garantizar la seguridad de tus datos financieros.</p>
          </div>
        </div>
      </section>
    </WorkspaceShell>
  );
}
