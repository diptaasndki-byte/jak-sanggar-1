import { jsPDF } from "jspdf";
import autoTable, { type RowInput } from "jspdf-autotable";

export interface LockedPdfOptions {
  filename: string;
  title: string;
  subtitle?: string;
  /** Owner password — required to modify the PDF. The file itself opens without a password. */
  ownerPassword: string;
  sections?: { heading?: string; body?: string }[];
  table?: { head: string[]; rows: RowInput[] };
}

export function downloadLockedPdf(opts: LockedPdfOptions) {
  const doc = new jsPDF({
    unit: "pt",
    format: "a4",
    encryption: {
      ownerPassword: opts.ownerPassword,
      userPermissions: ["print", "copy", "annot-forms"],
    },
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;

  doc.setFillColor(20, 33, 61);
  doc.rect(0, 0, pageWidth, 64, "F");
  doc.setFillColor(212, 166, 78);
  doc.rect(0, 64, pageWidth, 3, "F");

  doc.setTextColor(245, 220, 160);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(opts.title, margin, 36);

  if (opts.subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(230, 215, 180);
    doc.text(opts.subtitle, margin, 54);
  }

  let y = 96;
  doc.setTextColor(30, 30, 35);

  if (opts.sections) {
    opts.sections.forEach(s => {
      if (s.heading) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(s.heading, margin, y);
        y += 16;
      }
      if (s.body) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(s.body, pageWidth - margin * 2);
        doc.text(lines, margin, y);
        y += 12 * lines.length + 8;
      }
    });
  }

  if (opts.table) {
    autoTable(doc, {
      startY: y,
      head: [opts.table.head],
      body: opts.table.rows,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [20, 33, 61], textColor: [245, 220, 160], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 244, 233] },
      theme: "grid",
    });
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 130);
    doc.text(
      `Dokumen Jak Sanggar · Hanya-baca tanpa password edit · Halaman ${i} dari ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 18,
      { align: "center" },
    );
  }

  doc.save(opts.filename);
}
