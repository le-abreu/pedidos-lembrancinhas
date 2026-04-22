"use client";

import { useId, useState } from "react";

type ConfirmSubmitButtonProps = {
  label: string;
  message: string;
  className?: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

export function ConfirmSubmitButton({
  label,
  message,
  className = "ghost-button",
  title = "Confirmar ação",
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
}: ConfirmSubmitButtonProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  return (
    <>
      <button className={className} type="button" onClick={() => setOpen(true)}>
        {label}
      </button>

      {open ? (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={() => setOpen(false)}
        >
          <div className="confirm-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="confirm-modal-icon" aria-hidden="true">
              !
            </div>
            <div className="page-stack compact-stack">
              <h3 id={titleId}>{title}</h3>
              <p className="muted">{message}</p>
            </div>
            <div className="confirm-modal-actions">
              <button className="ghost-button" type="button" onClick={() => setOpen(false)}>
                {cancelLabel}
              </button>
              <button className="primary-button danger-button" type="submit">
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
