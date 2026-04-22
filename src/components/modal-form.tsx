"use client";

import { useId, useState } from "react";

type ModalFormProps = {
  title: string;
  description?: string;
  triggerLabel: string;
  children: React.ReactNode;
};

export function ModalForm({ title, description, triggerLabel, children }: ModalFormProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  return (
    <>
      <button className="primary-button" type="button" onClick={() => setOpen(true)}>
        {triggerLabel}
      </button>

      {open ? (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={() => setOpen(false)}
        >
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="section-heading">
              <div>
                <h3 id={titleId}>{title}</h3>
                {description ? <p className="muted">{description}</p> : null}
              </div>
              <button className="ghost-button" type="button" onClick={() => setOpen(false)}>
                Fechar
              </button>
            </div>
            <div onSubmitCapture={() => setOpen(false)}>{children}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
