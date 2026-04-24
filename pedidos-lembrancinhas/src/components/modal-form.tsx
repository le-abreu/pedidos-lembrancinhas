"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

type ModalFormProps = {
  title: string;
  description?: string;
  triggerLabel: string;
  children: React.ReactNode;
};

export function ModalForm({
  title,
  description,
  triggerLabel,
  children,
}: ModalFormProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const titleId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        className="primary-button"
        type="button"
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </button>

      {mounted && open
        ? createPortal(
            <div
              className="modal-backdrop"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              onClick={() => setOpen(false)}
            >
              <div
                className="modal-card"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="section-heading">
                  <div>
                    <h3 id={titleId}>{title}</h3>
                    {description ? (
                      <p className="muted">{description}</p>
                    ) : null}
                  </div>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => setOpen(false)}
                  >
                    Fechar
                  </button>
                </div>
                <div>{children}</div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
