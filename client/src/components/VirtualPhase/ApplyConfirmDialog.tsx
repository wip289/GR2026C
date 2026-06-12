// client/src/components/VirtualPhase/ApplyConfirmDialog.tsx
// Dialog konfirmasi sebelum lamaran terkirim — punya tombol Batal.
// Dipakai di VirtualGallery: tampil saat jobseeker klik "Nyatakan Minat",
// lamaran BARU benar-benar dikirim setelah klik "Kirim Lamaran".

import React from "react";

interface ApplyConfirmDialogProps {
  open: boolean;
  positionName: string;
  companyName: string;
  mechanism?: "A" | "B" | "C" | null; // untuk teks info tambahan
  isPending?: boolean;                 // disable tombol saat mutation jalan
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ApplyConfirmDialog({
  open,
  positionName,
  companyName,
  mechanism,
  isPending = false,
  onCancel,
  onConfirm,
}: ApplyConfirmDialogProps) {
  if (!open) return null;

  const mechanismNote =
    mechanism === "B"
      ? "Setelah dikirim, WhatsApp akan terbuka ke PIC perusahaan dengan pesan otomatis berisi profil singkat kamu."
      : mechanism === "C"
      ? "Setelah dikirim, kamu akan diarahkan ke halaman lamaran milik perusahaan untuk melanjutkan proses."
      : "Lamaran beserta profil dan CV kamu akan langsung dapat dilihat oleh tim HRD perusahaan.";

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2,6,23,0.75)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0f172a",
          border: "1px solid rgba(20,184,166,0.3)",
          borderRadius: 16,
          padding: "1.75rem",
          maxWidth: 420,
          width: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ fontSize: "2rem", textAlign: "center", marginBottom: "0.75rem" }}>📨</div>
        <h3 style={{ color: "#f1f5f9", fontSize: "1.05rem", fontWeight: 800, textAlign: "center", margin: "0 0 0.5rem" }}>
          Kirim Lamaran?
        </h3>
        <p style={{ color: "#94a3b8", fontSize: "0.88rem", textAlign: "center", lineHeight: 1.6, margin: "0 0 0.75rem" }}>
          Kamu akan melamar posisi{" "}
          <strong style={{ color: "#14b8a6" }}>{positionName}</strong> di{" "}
          <strong style={{ color: "#D4A017" }}>{companyName}</strong>.
        </p>
        <p style={{ color: "#64748b", fontSize: "0.78rem", textAlign: "center", lineHeight: 1.6, margin: "0 0 1.5rem" }}>
          {mechanismNote} Lamaran yang sudah terkirim tidak dapat dibatalkan.
        </p>
        <div style={{ display: "flex", gap: "0.65rem" }}>
          <button
            onClick={onCancel}
            disabled={isPending}
            style={{
              flex: 1,
              background: "none",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#94a3b8",
              borderRadius: 10,
              padding: "0.7rem",
              fontSize: "0.88rem",
              fontWeight: 700,
              cursor: isPending ? "not-allowed" : "pointer",
            }}
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            style={{
              flex: 1.4,
              background: isPending ? "rgba(20,184,166,0.4)" : "#14b8a6",
              border: "none",
              color: "#021412",
              borderRadius: 10,
              padding: "0.7rem",
              fontSize: "0.88rem",
              fontWeight: 800,
              cursor: isPending ? "wait" : "pointer",
            }}
          >
            {isPending ? "Mengirim..." : "✓ Kirim Lamaran"}
          </button>
        </div>
      </div>
    </div>
  );
}
