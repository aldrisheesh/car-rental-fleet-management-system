import { reportFilename } from "./report-filename";
import type { QueryReport } from "./report-query";
import { BOOKING_CATEGORIES } from "./booking-categories";

const text = (value: string) =>
  value.replace(/[–—]/g, "-").replace(/·/g, " / ");
export async function createReportPdf(report: QueryReport) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const doc = new jsPDF({
    unit: "pt",
    format: "letter",
    orientation: "portrait",
  });
  doc.setProperties({ title: report.title, author: "Briah's Car Rental" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(20, 62, 57);
  doc.text("Briah's Car Rental", 36, 52);
  doc.setFontSize(14);
  doc.text(report.title, 36, 78);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(40, 55, 50);
  const query = report.query;
  const branch =
    query.branch === "all"
      ? "All branches"
      : (report.branches.find((b) => b.id === query.branch)?.name ??
        "Selected branch");
  const vehicle = report.vehicles.find((v) => v.id === query.vehicle)?.name;
  const category = report.vehicles.find(
    (v) => v.categoryId === query.category,
  )?.categoryName;
  const filters = [
    `Dates: ${query.start} to ${query.end} (Asia/Manila)`,
    `Branch: ${branch}`,
    vehicle ? `Vehicle: ${vehicle}` : "",
    category ? `Category: ${category}` : "",
    query.purpose
      ? `Purpose: ${BOOKING_CATEGORIES.purpose.find(([code]) => code === query.purpose)?.[1] ?? query.purpose}`
      : "",
    query.destination
      ? `Destination: ${BOOKING_CATEGORIES.destination.find(([code]) => code === query.destination)?.[1] ?? query.destination}`
      : "",
    `Generated: ${new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short" }).format(new Date(report.generatedAt))}`,
  ].filter(Boolean);
  let y = 101;
  for (const filter of filters) {
    const lines = doc.splitTextToSize(text(filter), 540);
    doc.text(lines, 36, y);
    y += lines.length * 12;
  }
  const notes = doc.splitTextToSize(text(report.note), 540);
  doc.text(notes, 36, y + 4);
  y += notes.length * 12 + 20;
  const planning = query.kind === "forecast";
  const categories = !["purposes", "destinations"].includes(query.kind);
  const eventLabel = planning
    ? "Vehicles to plan for"
    : query.kind === "rentals"
      ? "Rental starts"
      : "Requests";
  autoTable(doc, {
    startY: y,
    margin: { top: 36, bottom: 52, left: 36, right: 36 },
    head: [
      [
        planning ? "Branch / planning week" : "Result",
        ...(categories ? ["Vehicle category"] : []),
        eventLabel,
      ],
    ],
    body: report.rows.length
      ? report.rows.map((r) => [
          text(r.label),
          ...(categories ? [text(r.category)] : []),
          String(r.count),
        ])
      : [["No matching records", ...(categories ? [""] : []), "0"]],
    styles: { fontSize: 9, cellPadding: 7, overflow: "linebreak" },
    headStyles: { fillColor: [20, 62, 57] },
    columnStyles: { [categories ? 2 : 1]: { halign: "right" } },
    didDrawPage: () => {
      doc.setFontSize(8);
      doc.setTextColor(80, 98, 90);
      doc.setFont("helvetica", "normal");
      doc.text("Briah's Car Rental | Operational report", 36, 766, {
        align: "left",
      });
    },
  });
  for (let page = 1; page <= doc.getNumberOfPages(); page++) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`${page} / ${doc.getNumberOfPages()}`, 576, 766, {
      align: "right",
    });
  }
  return doc;
}
export async function downloadReportPdf(report: QueryReport) {
  const doc = await createReportPdf(report);
  await doc.save(reportFilename(report), { returnPromise: true });
}
