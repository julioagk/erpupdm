'use client';

import { useEffect } from 'react';

export function Modal({
  isOpen,
  title,
  description,
  onClose,
  children,
  size = 'md'
}: Readonly<{
  isOpen: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}>) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal" role="presentation" onMouseDown={onClose}>
      <div
        className={`modal__panel modal__panel--${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal__header">
          <div>
            <h3 className="modal__title">{title}</h3>
            {description ? <p className="modal__description">{description}</p> : null}
          </div>
          <button className="button button--secondary modal__close" type="button" onClick={onClose}>
            Cerrar
          </button>
        </header>

        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}
