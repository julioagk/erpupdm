'use client';

import { useState, useMemo } from 'react';

export interface ListColumn {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  width?: string;
}

export interface ListFilter {
  key: string;
  label: string;
  active?: boolean;
}

export interface ListTableProps {
  title: string;
  description: string;
  columns: ListColumn[];
  data: any[];
  filters?: ListFilter[];
  onAddNew?: () => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onViewPdf?: (row: any) => void;
  onExport?: () => void;
  searchPlaceholder?: string;
  addButtonLabel?: string;
}

export function ListTable({
  title,
  description,
  columns,
  data,
  filters = [],
  onAddNew,
  onEdit,
  onDelete,
  onViewPdf,
  onExport,
  searchPlaceholder = 'Buscar...',
  addButtonLabel = 'Agregar'
}: ListTableProps) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState(filters[0]?.key || 'todos');

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const searchTerm = search.toLowerCase();
      const matchesSearch = Object.values(item).some(
        (val) => String(val).toLowerCase().includes(searchTerm)
      );

      if (!matchesSearch) return false;

      const filter = filters.find((f) => f.key === activeFilter);
      if (!filter || activeFilter === 'todos') return true;

      return item.filterKey === activeFilter;
    });
  }, [data, search, activeFilter, filters]);

  return (
    <div className="card">
      <div className="card__header">
        <div>
          <h3 className="card__title">{title}</h3>
          <p className="card__label">{description}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {onExport && (
            <button className="button button--secondary" type="button" onClick={onExport}>
              Exportar
            </button>
          )}
          {onAddNew && (
            <button className="button button--primary" type="button" onClick={onAddNew}>
              {addButtonLabel}
            </button>
          )}
        </div>
      </div>

      <div className="card__body stack">
        <div className="form__row" style={{ marginBottom: '0' }}>
          <input
            className="form__input"
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ marginBottom: '0' }}
          />
        </div>

        {filters.length > 0 && (
          <div className="chip-row">
            {filters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                className={`chip ${activeFilter === filter.key ? 'chip--active' : ''}`}
                onClick={() => setActiveFilter(filter.key)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gap: '8px', marginBottom: '12px' }}>
          <span className="card__label">Mostrando {filteredData.length} de {data.length} registros</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key} style={{ width: col.width }}>
                    {col.label}
                  </th>
                ))}
                {(onEdit || onDelete || onViewPdf) && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((row, idx) => (
                  <tr key={idx}>
                    {columns.map((col) => (
                      <td key={col.key}>
                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                      </td>
                    ))}
                    {(onEdit || onDelete || onViewPdf) && (
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          {onViewPdf && (
                            <button
                              type="button"
                              onClick={() => onViewPdf(row)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '4px 8px' }}
                              title="Ver PDF Original"
                            >
                              👁️
                            </button>
                          )}
                          {onEdit && (
                            <button
                              type="button"
                              onClick={() => onEdit(row)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '18px',
                                padding: '4px 8px'
                              }}
                              title="Editar"
                            >
                              ✏️
                            </button>
                          )}
                          {onDelete && (
                            <button
                              type="button"
                              onClick={() => onDelete(row)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '18px',
                                padding: '4px 8px'
                              }}
                              title="Eliminar"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length + ((onEdit || onDelete || onViewPdf) ? 1 : 0)} style={{ textAlign: 'center', padding: '24px' }}>
                    <span className="card__label">No hay registros que coincidan con tu búsqueda</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
