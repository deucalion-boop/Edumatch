import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'

export function buildArchivedRecordsPdf({ rows, filterSummary, exportedAt }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const width = doc.internal.pageSize.getWidth()
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(30, 67, 7)
  doc.text('Archived Student Records', 14, 18)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)
  doc.text(`Generated ${exportedAt} | ${rows.length} archived records`, 14, 25)
  const summary = doc.splitTextToSize(filterSummary, width - 28)
  doc.text(summary, 14, 32)
  autoTable(doc, {
    startY: 37 + (summary.length - 1) * 4,
    margin: { top: 14, left: 14, right: 14, bottom: 18 },
    head: [['Student', 'Email', 'School Year', 'Archived On', 'Section', 'Grade', 'Adviser', 'Archived By']],
    body: rows.map(row => [row.Student, row.Email, row['School Year'], row['Archived On'], row.Section, row.Grade, row.Adviser, row['Archived By']]),
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2.5, overflow: 'linebreak', valign: 'top' },
    headStyles: { fillColor: [47, 96, 24], textColor: 255 },
    alternateRowStyles: { fillColor: [246, 249, 243] },
    columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 52 } },
    showHead: 'everyPage',
    rowPageBreak: 'avoid',
  })
  const pages = doc.getNumberOfPages()
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page)
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text(`EduMatch | Page ${page} of ${pages}`, width - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' })
  }
  return doc
}
