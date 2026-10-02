
"use client";

import { useState } from "react";

export default function FloatingSupport() {

  const [open, setOpen] = useState(true);

  const phone = (
    process.env.NEXT_PUBLIC_SUPPORT_PHONE || ""
  ).trim();

  const whatsapp = (
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ""
  ).replace(/\D/g, "");

  const whatsappMessage =
    "আসসালামু আলাইকুম, আমি Arone Bd-এর একটি পণ্য সম্পর্কে জানতে চাই।";

  const whatsappUrl =
    `https://wa.me/${whatsapp}?text=${encodeURIComponent(
      whatsappMessage
    )}`;

  if (!phone && !whatsapp) return null;

  return (
    <div
      className="arone-floating-support"
      aria-label="Customer support"
    >

      {open ? (
        <>

          {/* WHATSAPP BUTTON */}

          {whatsapp && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="arone-float-btn arone-whatsapp-btn"
              aria-label="Chat with us on WhatsApp"
              title="WhatsApp Support"
            >

              <svg
                viewBox="0 0 24 24"
                width="29"
                height="29"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20.5 11.5a8.5 8.5 0 0 1-12.1 7.7L3 21l1.8-5.4A8.5 8.5 0 1 1 20.5 11.5Z" />
                <path d="M9 8.5c.3 2.7 2.1 4.8 4.8 5.1l1.5-1.4 1.4 1.2-.8 2c-.2.5-.6.7-1.1.7-4.4-.3-7.6-3.5-7.9-7.9 0-.5.2-.9.7-1.1l2-.8 1.2 1.4L9 8.5Z" />
              </svg>

              <span className="arone-float-tooltip">
                WhatsApp
              </span>

            </a>
          )}

          {/* CALL SUPPORT BUTTON */}

          {phone && (
            <a
              href={`tel:${phone.replace(/[^\d+]/g, "")}`}
              className="arone-float-btn arone-call-btn"
              aria-label={`Call customer support ${phone}`}
              title="Call Support"
            >

              <svg
                viewBox="0 0 24 24"
                width="28"
                height="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 3.1 5.2 2 2 0 0 1 5.1 3h3a2 2 0 0 1 2 1.7l.4 2.8a2 2 0 0 1-.6 1.7L8.2 10.9a16 16 0 0 0 4.9 4.9l1.7-1.7a2 2 0 0 1 1.7-.6l2.8.4a2 2 0 0 1 1.7 1.9Z" />
              </svg>

              <span className="arone-float-tooltip">
                Call Support
              </span>

            </a>
          )}

          {/* CLOSE BUTTON */}

          <button
            type="button"
            className="arone-float-btn arone-close-btn"
            onClick={() => setOpen(false)}
            aria-label="Hide support buttons"
            title="Close"
          >
            ×
          </button>

        </>
      ) : (

        <button
          type="button"
          className="arone-float-btn arone-open-btn"
          onClick={() => setOpen(true)}
          aria-label="Show customer support buttons"
        >
          ☎
        </button>

      )}

    </div>
  );
}
