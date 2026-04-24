'use client';

import { useState } from 'react';
import { WorkspaceShell } from '@/components/workspace-shell';
import { ListTable } from '@/components/list-table';
import { Modal } from '@/components/modal';
import { providers } from '@/lib/data';

export default function ProvidersPage() {
  const [isProviderModalOpen, setProviderModalOpen] = useState(false);

  const columns = [
    {
      key: 'name',
      label: 'Emisor',
      width: '25%'
    },
    {
      key: 'taxId',
      label: 'RFC / ID',
      width: '15%'
    },
    {
      key: 'category',
      label: 'Categoria',
      width: '20%'
    },
    {
      key: 'contact',
      label: 'Contacto',
      width: '25%'
    },
    {
      key: 'lastInvoice',
      label: 'Ultima factura',
      width: '15%'
    }
  ];

  return (
    <WorkspaceShell
      active="/proveedores-gastos/proveedores"
      eyebrow="Submodulo emisores"
      title="Registro y gestion de emisores"
      subtitle="Gestiona el listado de emisores desde un espacio dedicado y separado de gastos."
    >
      <section className="stack">
        <div className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Acciones rapidas</h3>
              <p className="card__label">Usa modal para registrar emisores sin ocupar espacio permanente.</p>
            </div>
            <span className="badge">Emisores</span>
          </div>
          <div className="card__body form">
            <div className="form__actions">
              <button className="button button--primary" type="button" onClick={() => setProviderModalOpen(true)}>
                + Agregar emisor
              </button>
            </div>
            <p className="footer-note">MVP visual: conecta este formulario al backend para persistir datos.</p>
          </div>
        </div>

        <ListTable
          title="Emisores registrados"
          description="Listado maestro de emisores con opciones para editar o eliminar."
          columns={columns}
          data={providers}
          searchPlaceholder="Buscar emisor por nombre, RFC o contacto..."
          addButtonLabel="+ Agregar emisor"
          onAddNew={() => setProviderModalOpen(true)}
          onEdit={(row) => alert(`Editar: ${row.name}`)}
          onDelete={(row) => alert(`Eliminar: ${row.name}`)}
          onExport={() => alert('Exportar emisores a CSV')}
        />
      </section>

      <Modal
        isOpen={isProviderModalOpen}
        onClose={() => setProviderModalOpen(false)}
        title="Nuevo emisor"
        description="Completa el formulario sin salir del listado principal."
      >
        <div className="form">
          <label className="form__row">
            <span className="form__label">Nombre del emisor</span>
            <input className="form__input" type="text" placeholder="Ej: Papeleria Central" />
          </label>
          <label className="form__row">
            <span className="form__label">RFC / ID fiscal</span>
            <input className="form__input" type="text" placeholder="Ej: ABC123456XYZ" />
          </label>
          <label className="form__row">
            <span className="form__label">Categoria</span>
            <input className="form__input" type="text" placeholder="Ej: Servicios, inventario, flete" />
          </label>
          <label className="form__row">
            <span className="form__label">Correo de contacto</span>
            <input className="form__input" type="email" placeholder="compras@emisor.com" />
          </label>
          <div className="form__actions">
            <button className="button button--primary" type="button">Guardar emisor</button>
            <button className="button button--secondary" type="button" onClick={() => setProviderModalOpen(false)}>
              Cancelar
            </button>
          </div>
          <p className="footer-note">MVP visual: conecta este formulario al backend para persistir emisores.</p>
        </div>
      </Modal>

    </WorkspaceShell>
  );
}
