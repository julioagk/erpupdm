'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { dashboardSeed, money } from '@/lib/data';
import { useBalance } from '@/context/balance-context';

const navigation = [
  {
    href: '/dashboard',
    title: 'Dashboard',
    hint: 'Resumen y métricas',
    matchPrefix: '/dashboard'
  },
  {
    href: '/banco',
    title: 'Banco',
    hint: 'Estado y salud financiera',
    matchPrefix: '/banco'
  },
  {
    href: '/proveedores-gastos/facturas-gastos',
    title: 'Compras',
    hint: 'Egresos y facturas',
    matchPrefix: '/proveedores-gastos'
  },
  {
    href: '/ventas/listado',
    title: 'Ventas',
    hint: 'Ingresos y clientes',
    matchPrefix: '/ventas'
  },
  {
    href: '/contabilidad/estado-resultados',
    title: 'Contabilidad',
    hint: 'Resultados y análisis',
    matchPrefix: '/contabilidad'
  },
  {
    href: '/configuracion',
    title: 'Configuración',
    hint: 'Perfil y ajustes',
    matchPrefix: '/configuracion'
  }
];

export function WorkspaceShell({
  active,
  title,
  subtitle,
  eyebrow,
  children
}: Readonly<{
  active: string;
  title: string;
  subtitle: string;
  eyebrow: string;
  children: React.ReactNode;
}>) {
  const { bankBalance: balance, setBankBalance: setBalance } = useBalance();
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [userName, setUserName] = useState('Julio');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const savedName = localStorage.getItem('erp_user_name');
    if (savedName) setUserName(savedName);
  }, []);

  const isActiveNavItem = (href: string, matchPrefix: string) => {
    if (matchPrefix === '/dashboard') return active === '/dashboard';
    return active === href || active === matchPrefix || active.startsWith(`${matchPrefix}/`);
  };

  function startEdit() {
    setInputValue(String(balance));
    setEditing(true);
  }

  function commitEdit() {
    const parsed = parseFloat(inputValue.replace(/[^0-9.]/g, ''));
    if (!isNaN(parsed) && parsed >= 0) setBalance(parsed);
    setEditing(false);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') setEditing(false);
  }

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  return (
    <div className="shell">
      <aside className="shell__sidebar">
        <div className="shell__panel">
          <div className="shell__brand">
            <img src="/logo.png" alt="UPDM Logo" className="shell__logo" />
            <div className="shell__brandCopy">
              <p className="shell__brandLabel">Sistema de gestión</p>
              <h1 className="shell__brandTitle">ERP UPDM</h1>
              <p className="shell__brandText">Ventas, gastos, banco y contabilidad.</p>
            </div>
          </div>

          <div className="shell__userCard">
            <div className="shell__userAvatar">{userName.substring(0, 2).toUpperCase()}</div>
            <div className="shell__userInfo">
              <strong>Hola, {userName}</strong>
              <span>Administrador</span>
            </div>
          </div>

          <nav className="shell__nav" aria-label="Navegación principal">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`shell__navLink ${isActiveNavItem(item.href, item.matchPrefix) ? 'shell__navLink--active' : ''}`}
              >
                <span className="shell__navLabel">
                  <span className="shell__navTitle">{item.title}</span>
                  <span className="shell__navHint">{item.hint}</span>
                </span>
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </nav>

          {/* Saldo en banco — editable */}
          <div className="shell__balanceWidget">
            <p className="shell__balanceLabel">Saldo Banorte</p>
            {editing ? (
              <div className="shell__balanceEditGroup">
                <input
                  ref={inputRef}
                  className="shell__balanceInput"
                  type="number"
                  step="0.01"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="0.00"
                />
                <div className="shell__balanceActions">
                  <button className="shell__balanceSave" onClick={commitEdit} title="Guardar">✓</button>
                  <button className="shell__balanceCancel" onClick={() => setEditing(false)} title="Cancelar">✕</button>
                </div>
              </div>
            ) : (
              <button
                className="shell__balanceBtn"
                onClick={startEdit}
                title="Clic para editar saldo"
              >
                <strong className="shell__balanceAmount">{money(balance)}</strong>
                <span className="shell__balanceEdit">✎</span>
              </button>
            )}
          </div>

        </div>
      </aside>

      <main className="shell__main">
        <section className="page">
          <header className="page__hero">
            <span className="page__eyebrow">{eyebrow}</span>
            <h2 className="page__title">{title}</h2>
            <p className="page__subtitle">{subtitle}</p>
          </header>
          {children}
        </section>
      </main>
    </div>
  );
}
