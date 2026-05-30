// src/services/exportarPDF.js
// Servicio para exportar el reporte financiero en PDF — HU8

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Helper formato moneda ────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n || 0);

/**
 * Genera y descarga el reporte financiero en PDF.
 * @param {Object} data - Resultado de getReporteFinanciero()
 * @param {string} nombreFinca - Nombre de la finca (opcional)
 */
export function exportarReportePDF(data, nombreFinca = "GanadApp") {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const fechaHoy = new Date().toLocaleDateString("es-CO", {
    year:  "numeric",
    month: "long",
    day:   "numeric",
  });

  const VERDE  = [34,  197, 94];
  const ROJO   = [239, 68,  68];
  const OSCURO = [15,  23,  42];
  const GRIS   = [100, 116, 139];

  // ── ENCABEZADO ──────────────────────────────────────────────
  doc.setFillColor(...OSCURO);
  doc.rect(0, 0, 297, 30, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("🐄 " + nombreFinca, 14, 13);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Reporte de Inversión y Rentabilidad", 14, 21);

  doc.setFontSize(9);
  doc.setTextColor(...GRIS);
  doc.text(`Generado el ${fechaHoy}`, 250, 21, { align: "right" });

  // ── RESUMEN GENERAL ─────────────────────────────────────────
  const { resumen } = data;

  doc.setTextColor(...OSCURO);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Resumen General", 14, 42);

  const resumenData = [
    ["Total Animales",    String(resumen.totalAnimales)],
    ["Capital Invertido", fmt(resumen.capitalTotal)     ],
    ["Ventas Estimadas",  fmt(resumen.ventaTotal)        ],
    ["Utilidad Neta",     fmt(resumen.utilidadTotal)     ],
    ["Rentabilidad",      `${resumen.rentabilidadTotal}%`],
  ];

  autoTable(doc, {
    startY:    47,
    head:      [["Indicador", "Valor"]],
    body:      resumenData,
    theme:     "grid",
    margin:    { left: 14 },
    tableWidth: 100,
    headStyles: {
      fillColor:  OSCURO,
      textColor:  [255, 255, 255],
      fontStyle:  "bold",
      fontSize:   10,
    },
    bodyStyles: {
      fontSize:   10,
      textColor:  OSCURO,
    },
    didParseCell(hookData) {
      // Colorea la utilidad neta según sea positiva o negativa
      if (hookData.row.index === 3 && hookData.column.index === 1) {
        hookData.cell.styles.textColor =
          resumen.utilidadTotal >= 0 ? VERDE : ROJO;
        hookData.cell.styles.fontStyle = "bold";
      }
    },
  });

  // ── TABLA DETALLE POR ANIMAL ─────────────────────────────────
  const finalY = doc.lastAutoTable.finalY + 12;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...OSCURO);
  doc.text("Detalle por Animal", 14, finalY);

  const filas = data.animales.map((a) => [
    a.id,
    a.raza        || "—",
    a.lote        || "—",
    fmt(a.totalCostos),
    fmt(a.precioVenta),
    fmt(a.utilidad),
    `${a.rentabilidad}%`,
    a.utilidad >= 0 ? "Ganancia" : "Pérdida",
  ]);

  autoTable(doc, {
    startY: finalY + 5,
    head: [[
      "ID Animal", "Raza", "Lote",
      "Costos", "Precio Venta", "Utilidad",
      "Rentab.", "Estado",
    ]],
    body: filas,
    theme: "striped",
    margin: { left: 14, right: 14 },
    headStyles: {
      fillColor: OSCURO,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize:  9,
    },
    bodyStyles: {
      fontSize:  9,
      textColor: OSCURO,
    },
    didParseCell(hookData) {
      if (hookData.section !== "body") return;

      const utilidad = data.animales[hookData.row.index]?.utilidad ?? 0;

      // Columna Utilidad
      if (hookData.column.index === 5) {
        hookData.cell.styles.textColor  = utilidad >= 0 ? VERDE : ROJO;
        hookData.cell.styles.fontStyle  = "bold";
      }

      // Columna Estado
      if (hookData.column.index === 7) {
        hookData.cell.styles.textColor  = utilidad >= 0 ? VERDE : ROJO;
        hookData.cell.styles.fontStyle  = "bold";
      }
    },
  });

  // ── PIE DE PÁGINA ────────────────────────────────────────────
  const totalPaginas = doc.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...GRIS);
    doc.text(
      `${nombreFinca} — Reporte financiero — Página ${i} de ${totalPaginas}`,
      148,
      205,
      { align: "center" }
    );
  }

  // ── DESCARGAR ────────────────────────────────────────────────
  const nombreArchivo = `reporte-financiero-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(nombreArchivo);
}
