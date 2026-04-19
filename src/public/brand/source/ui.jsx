/* ==========================================================
   UI primitives shared across screens.
   ========================================================== */

function Button({ children, variant = 'primary', icon, onClick, type = 'button', disabled, className = '', ...rest }) {
  const cls = `btn btn--${variant} ${className}`;
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled} {...rest}>
      {icon}{children}
    </button>
  );
}

function SucursalChip({ sucursal }) {
  const mod = sucursal === 'La Plata' ? 'laplata' : sucursal === 'Gonnet' ? 'gonnet' : 'quilmes';
  return <span className={`suc-chip suc-chip--${mod}`}>{sucursal}</span>;
}

function Pill({ tipo }) {
  return (
    <span className={`pill pill--${tipo}`}>
      <span className="pill--dot" />
      {tipo}
    </span>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="field">
      <label className="field__label">{label}</label>
      {children}
      {hint && <span className="field__hint">{hint}</span>}
    </div>
  );
}

function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">{title}</h3>
          <button className="modal__close" onClick={onClose}>×</button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>
  );
}

function Empty({ children = 'Sin datos todavía.' }) {
  return <div className="empty">{children}</div>;
}

Object.assign(window, { Button, SucursalChip, Pill, Field, Modal, Empty });
