import { WorkspaceShell } from '@/components/workspace-shell';
import { buildAIInsight, buildAccountingSummary, money } from '@/lib/data';

export default function AnalisisPage() {
  const summaryMonth = buildAccountingSummary('month');
  const summaryWeek = buildAccountingSummary('week');
  const summaryDay = buildAccountingSummary('day');
  const insightMonth = buildAIInsight('month');
  const insightWeek = buildAIInsight('week');
  const insightDay = buildAIInsight('day');

  return (
    <WorkspaceShell
      active="/contabilidad/analisis"
      eyebrow="Analisis y rentabilidad"
      title="Metricas clave y tendencias del negocio"
      subtitle="Profundiza en la rentabilidad con comparativas diarias, semanales y mensuales, y lecturas automaticas de tendencias."
    >
      <section className="stack">
        <div className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Comparativa de periodos</h3>
              <p className="card__label">Analiza tendencias de rentabilidad y eficiencia.</p>
            </div>
          </div>
          <div className="card__body stack">
            <table className="table">
              <thead>
                <tr>
                  <th>Periodo</th>
                  <th>Ventas</th>
                  <th>Gastos</th>
                  <th>Utilidad</th>
                  <th>Margen %</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Dia</strong></td>
                  <td>{money(summaryDay.salesTotal)}</td>
                  <td>{money(summaryDay.expenseTotal)}</td>
                  <td>{money(summaryDay.net)}</td>
                  <td><strong>{summaryDay.margin.toFixed(1)}%</strong></td>
                </tr>
                <tr>
                  <td><strong>Semana</strong></td>
                  <td>{money(summaryWeek.salesTotal)}</td>
                  <td>{money(summaryWeek.expenseTotal)}</td>
                  <td>{money(summaryWeek.net)}</td>
                  <td><strong>{summaryWeek.margin.toFixed(1)}%</strong></td>
                </tr>
                <tr>
                  <td><strong>Mes</strong></td>
                  <td>{money(summaryMonth.salesTotal)}</td>
                  <td>{money(summaryMonth.expenseTotal)}</td>
                  <td>{money(summaryMonth.net)}</td>
                  <td><strong>{summaryMonth.margin.toFixed(1)}%</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="split">
          <div className="card">
            <div className="card__header">
              <div>
                <h3 className="card__title">Lectura del mes</h3>
                <p className="card__label">Analisis automatico del desempe ejecutivo.</p>
              </div>
            </div>
            <div className="card__body stack">
              <div className="chip-row">
                <span className="chip">{insightMonth.title}</span>
                <span className="chip">Estado: {insightMonth.status}</span>
              </div>
              <p className="footer-note">{insightMonth.message}</p>
              <div className="list">
                <div className="list__item">
                  <div className="list__meta"><strong>Caja:</strong> {insightMonth.highlight}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card__header">
              <div>
                <h3 className="card__title">Proximas acciones</h3>
                <p className="card__label">Recomendaciones sugeridas por el motor IA.</p>
              </div>
            </div>
            <div className="card__body list">
              {insightMonth.nextActions.map((action) => (
                <div key={action} className="list__item">
                  <div className="list__meta">{action}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Metricas por periodo</h3>
              <p className="card__label">Indicadores clave de desempe e rentabilidad.</p>
            </div>
          </div>
          <div className="card__body stack">
            <div className="split">
              <div className="metric">
                <div className="metric__value">{summaryMonth.margin.toFixed(1)}%</div>
                <div className="metric__meta">Margen mensual</div>
                <div className="metric__bar">
                  <span style={{ width: `${Math.min(summaryMonth.margin, 100)}%` }} />
                </div>
              </div>

              <div className="metric">
                <div className="metric__value">{(summaryMonth.salesTotal / (summaryMonth.salesTotal + summaryMonth.expenseTotal)).toFixed(0)}%</div>
                <div className="metric__meta">Proporcion de ingresos</div>
                <div className="metric__bar">
                  <span style={{ width: `${(summaryMonth.salesTotal / (summaryMonth.salesTotal + summaryMonth.expenseTotal)) * 100}%` }} />
                </div>
              </div>

              <div className="metric">
                <div className="metric__value">{(summaryMonth.expenseTotal / summaryMonth.salesTotal).toFixed(2)}x</div>
                <div className="metric__meta">Ratio gasto/venta</div>
                <div className="metric__bar">
                  <span style={{ width: `${Math.min((summaryMonth.expenseTotal / summaryMonth.salesTotal) * 100, 100)}%` }} />
                </div>
              </div>

              <div className="metric">
                <div className="metric__value">{summaryMonth.sales.length + summaryMonth.expenses.length}</div>
                <div className="metric__meta">Operaciones totales</div>
                <div className="metric__bar">
                  <span style={{ width: `${Math.min((summaryMonth.sales.length + summaryMonth.expenses.length) * 10, 100)}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </WorkspaceShell>
  );
}
