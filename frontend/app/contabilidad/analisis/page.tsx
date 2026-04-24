'use client';

import { useState, useEffect } from 'react';
import { WorkspaceShell } from '@/components/workspace-shell';
import { money } from '@/lib/data';
import { fetchFromApi } from '@/lib/api';

export default function AnalisisPage() {
  const [insight, setInsight] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInsight() {
      try {
        const result = await fetchFromApi('/api/ai/insight?range=month');
        setInsight(result);
      } catch (error) {
        console.error('Error cargando análisis IA:', error);
      } finally {
        setLoading(false);
      }
    }
    loadInsight();
  }, []);

  if (loading) {
    return (
      <WorkspaceShell active="/contabilidad/analisis" eyebrow="Análisis" title="IA Analizando..." subtitle="Procesando tu flujo de caja real para generar consejos...">
        <div style={{ padding: '40px', textAlign: 'center' }}>La IA está estudiando tus números en Railway...</div>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell
      active="/contabilidad/analisis"
      eyebrow="Inteligencia de Negocio"
      title="Análisis Financiero IA"
      subtitle="Interpretación automática de tu salud financiera basada en datos de PostgreSQL."
    >
      <section className="grid" style={{ gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
        <article className="card" style={{ gridColumn: 'span 8' }}>
          <div className="card__header">
            <div>
              <h3 className="card__title">Resumen Ejecutivo</h3>
              <p className="card__label">Perspectiva estratégica generada por el motor de análisis.</p>
            </div>
            <span className={`badge ${insight?.status === 'saludable' ? 'badge--success' : ''}`}>{insight?.status?.toUpperCase()}</span>
          </div>
          <div className="card__body stack">
            <div className="chip-row">
              <span className="chip">Análisis Ejecutivo</span>
              <span className="chip">Estado: {insight?.status}</span>
            </div>
            <p className="footer-note" style={{ fontSize: '1.2rem', color: '#2c3e50', lineHeight: '1.6' }}>
              {insight?.message}
            </p>
            <div className="list">
              <div className="list__item">
                <div className="list__meta"><strong>IA:</strong> Análisis generado basado en el flujo de caja real detectado en Railway.</div>
              </div>
            </div>
          </div>
        </article>

        <article className="card" style={{ gridColumn: 'span 4' }}>
          <div className="card__header">
            <h3 className="card__title">Acciones Sugeridas</h3>
          </div>
          <div className="card__body">
            <div className="stack" style={{ gap: '12px' }}>
              {insight?.nextActions?.map((action: string, i: number) => (
                <div key={i} className="chip" style={{ padding: '15px', background: '#f0f4f0', border: '1px solid #ddd', display: 'block', borderRadius: '12px' }}>
                  <strong>{i + 1}.</strong> {action}
                </div>
              ))}
              {(!insight?.nextActions || insight.nextActions.length === 0) && <p>No hay acciones sugeridas por ahora.</p>}
            </div>
          </div>
        </article>

        <article className="card" style={{ gridColumn: 'span 12', background: 'linear-gradient(135deg, #20301f, #2c3e50)', color: 'white' }}>
          <div className="card__body">
            <h3 className="card__title" style={{ color: '#bfff75' }}>Próximamente: Predicción de Flujo</h3>
            <p>Estamos entrenando el modelo para predecir tus gastos del próximo mes basándonos en tu historial de Railway.</p>
          </div>
        </article>
      </section>
    </WorkspaceShell>
  );
}
