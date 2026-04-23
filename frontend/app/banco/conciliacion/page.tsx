'use client';

import { WorkspaceShell } from '@/components/workspace-shell';
import { ListTable } from '@/components/list-table';
import { bankMovements, expenseInvoices, salesInvoices, money } from '@/lib/data';

export default function ConciliacionPage() {
  const filters = [
    { key: 'todos', label: 'Todos' },
    { key: 'conciliado', label: 'Conciliados' },
    { key: 'pendiente', label: 'Pendientes' }
  ];

  const columns = [
    {
      key: 'concept',
      label: 'Concepto',
      width: '30%'
    },
    {
      key: 'date',
      label: 'Fecha',
      width: '12%'
    },
    {
      key: 'amount',
      label: 'Monto',
      render: (value: number) => money(value),
      width: '12%'
    },
    {
      key: 'source',
      label: 'Origen',
      width: '15%'
    },
    {
      key: 'status',
      label: 'Conciliacion',
      render: (value: string) => (
        <span className={`badge ${value === 'conciliado' ? 'badge--success' : 'badge--warning'}`}>
          {value}
        </span>
      ),
      width: '12%'
    }
  ];

  const dataWithFilters = bankMovements.map((mov) => ({
    ...mov,
    filterKey: mov.status
  }));

  return (
    <WorkspaceShell
      active="/banco/conciliacion"
      eyebrow="Conciliacion"
      title="Cruce de movimientos con ventas y gastos"
      subtitle="Verifica que cada movimiento bancario este respaldado por una venta o compra registrada en el sistema."
    >
      <section className="stack">
        <div className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Resumen de conciliacion</h3>
              <p className="card__label">Estado de coincidencia entre banco, ventas y gastos.</p>
            </div>
          </div>
          <div className="card__body stack">
            <div className="chip-row">
              <span className="chip">Movimientos bancarios: {bankMovements.length}</span>
              <span className="chip">Ventas registradas: {salesInvoices.length}</span>
              <span className="chip">Gastos registrados: {expenseInvoices.length}</span>
              <span className="chip">Diferencias: 1</span>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th>Monto total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Ingresos por ventas</td>
                  <td>{money(salesInvoices.reduce((sum, inv) => sum + inv.amount, 0))}</td>
                  <td><span className="badge badge--success">Conciliado</span></td>
                </tr>
                <tr>
                  <td>Egresos por compras</td>
                  <td>{money(expenseInvoices.reduce((sum, inv) => sum + inv.amount, 0))}</td>
                  <td><span className="badge badge--warning">Por revisar</span></td>
                </tr>
                <tr>
                  <td>Movimientos pendientes</td>
                  <td>{money(4100)}</td>
                  <td><span className="badge">Pendiente</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <ListTable
          title="Movimientos por reconciliar"
          description="Operaciones bancarias sin respaldo en ventas o gastos registrados."
          columns={columns}
          data={dataWithFilters}
          filters={filters}
          searchPlaceholder="Buscar por concepto, monto o fecha..."
          addButtonLabel="+ Vincular documento"
          onAddNew={() => alert('Abrir para vincular movimiento a factura')}
          onEdit={(row) => alert(`Editar conciliacion: ${row.concept}`)}
          onDelete={(row) => alert(`Eliminar movimiento: ${row.concept}`)}
          onExport={() => alert('Exportar conciliacion a CSV')}
        />
      </section>
    </WorkspaceShell>
  );
}
