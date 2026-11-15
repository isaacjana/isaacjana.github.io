/**
 * MySarawak Invoice - shared invoice engine
 *
 * One place that knows how to total an invoice, draw the PDF and write the
 * WhatsApp summary. Used by the Invoice app itself and by Ocean, so an invoice
 * raised from an Ocean order looks exactly like one typed in by hand.
 *
 * Invoice shape:
 * {
 *   invoiceNo, date, isConsolidated, status ('paid' | 'unpaid' | 'void'), reference, notes,
 *   supplier: { name, tin, msic, sst, phone, address },
 *   buyer:    { name, tin, phone, address },
 *   items:    [{ description, qty, unit, unitPrice, taxRate }]
 * }
 */
(function (global) {
    const IMPORT_KEY = 'msi_import';
    const GREEN = [0, 80, 53];
    const YELLOW = [255, 206, 0];

    const num = (v) => {
        const n = parseFloat(v);
        return Number.isFinite(n) ? n : 0;
    };
    const money = (v) => num(v).toFixed(2);

    /** Work out subtotal, tax and grand total from the line items. */
    function totals(items) {
        let subtotal = 0;
        let totalTax = 0;
        (items || []).forEach((it) => {
            const line = num(it.qty) * num(it.unitPrice);
            subtotal += line;
            totalTax += line * (num(it.taxRate) / 100);
        });
        subtotal = Math.round(subtotal * 100) / 100;
        totalTax = Math.round(totalTax * 100) / 100;
        return { subtotal, totalTax, grandTotal: Math.round((subtotal + totalTax) * 100) / 100 };
    }

    /** Draw the invoice and return the jsPDF document. */
    function buildPDF(data) {
        if (!global.jspdf) throw new Error('PDF library has not loaded yet');
        const { jsPDF } = global.jspdf;
        const doc = new jsPDF();
        const supplier = data.supplier || {};
        const buyer = data.buyer || {};
        const t = totals(data.items);

        // Header band
        doc.setFillColor(...GREEN);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('TAX INVOICE', 15, 25);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...YELLOW);
        doc.text(data.isConsolidated ? 'CONSOLIDATED E-INVOICE' : 'LHDN COMPLIANT INVOICE', 15, 32);
        doc.setTextColor(255, 255, 255);
        doc.text(`No: ${data.invoiceNo || '-'}`, 195, 18, { align: 'right' });
        doc.text(`Date: ${data.date || '-'}`, 195, 25, { align: 'right' });
        if (data.reference) doc.text(`Ref: ${data.reference}`, 195, 32, { align: 'right' });

        // Parties: each column grows with its content
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(10);
        const column = (x, title, lines) => {
            let y = 55;
            doc.setFont('helvetica', 'bold');
            doc.text(title, x, y);
            doc.setFont('helvetica', 'normal');
            lines.filter(Boolean).forEach((line) => {
                const wrapped = doc.splitTextToSize(String(line), 85);
                y += 5;
                doc.text(wrapped, x, y);
                y += (wrapped.length - 1) * 5;
            });
            return y;
        };
        const leftEnd = column(15, 'FROM (SUPPLIER)', [
            supplier.name || '---',
            `TIN: ${supplier.tin || '---'}`,
            supplier.msic && `MSIC: ${supplier.msic}`,
            supplier.sst && `SST No: ${supplier.sst}`,
            supplier.phone && `Phone: ${supplier.phone}`,
            supplier.address
        ]);
        const rightEnd = column(115, 'TO (BUYER)', [
            buyer.name || 'Walk-in Customer',
            `TIN: ${buyer.tin || '---'}`,
            buyer.phone && `Phone: ${buyer.phone}`,
            buyer.address
        ]);

        // Line items
        doc.autoTable({
            startY: Math.max(leftEnd, rightEnd) + 10,
            head: [['#', 'Description', 'Qty', 'Unit Price (RM)', 'SST %', 'Amount (RM)']],
            body: (data.items || []).map((it, i) => [
                i + 1,
                it.description || '',
                `${num(it.qty)}${it.unit ? ' ' + it.unit : ''}`,
                money(it.unitPrice),
                `${num(it.taxRate)}%`,
                money(num(it.qty) * num(it.unitPrice))
            ]),
            headStyles: { fillColor: GREEN, textColor: [255, 255, 255] },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } },
            margin: { left: 15, right: 15 }
        });

        // Totals
        let y = doc.lastAutoTable.finalY + 10;
        if (y > 250) { doc.addPage(); y = 25; }
        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        doc.setFont('helvetica', 'normal');
        doc.text('Subtotal (Excl. Tax):', 140, y, { align: 'right' });
        doc.text(`RM ${money(t.subtotal)}`, 195, y, { align: 'right' });
        doc.text('Total SST:', 140, y + 7, { align: 'right' });
        doc.text(`RM ${money(t.totalTax)}`, 195, y + 7, { align: 'right' });
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('GRAND TOTAL:', 140, y + 17, { align: 'right' });
        doc.setTextColor(...GREEN);
        doc.text(`RM ${money(t.grandTotal)}`, 195, y + 17, { align: 'right' });

        // Payment state and notes
        if (data.status === 'paid' || data.status === 'void') {
            doc.setFontSize(16);
            if (data.status === 'paid') doc.setTextColor(...GREEN); else doc.setTextColor(190, 40, 40);
            doc.text(data.status.toUpperCase(), 15, y + 17);
        }
        if (data.notes) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(90, 90, 90);
            doc.text(doc.splitTextToSize(`Notes: ${data.notes}`, 110), 15, y);
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Generated via MySarawak Invoice - LHDN Phase 4 Compliant.', 105, 285, { align: 'center' });
        return doc;
    }

    function download(data) {
        const name = String(data.invoiceNo || 'invoice').replace(/[^\w.-]+/g, '_');
        buildPDF(data).save(`${name}_MySarawak.pdf`);
    }

    function whatsappText(data) {
        const t = totals(data.items);
        const lines = [
            '*MySarawak Invoice Summary*',
            '----------------------------',
            `*Inv No:* ${data.invoiceNo || '-'}`,
            `*Date:* ${data.date || '-'}`,
            `*From:* ${(data.supplier && data.supplier.name) || '-'}`,
            `*To:* ${(data.buyer && data.buyer.name) || 'Customer'}`,
            '----------------------------'
        ];
        (data.items || []).forEach((it) => {
            lines.push(`• ${it.description} (x${num(it.qty)}${it.unit ? ' ' + it.unit : ''}) - RM ${money(num(it.qty) * num(it.unitPrice))}`);
        });
        lines.push('----------------------------', `*SST:* RM ${money(t.totalTax)}`, `*Total:* RM ${money(t.grandTotal)}`, '', '_Generated by MySarawak Invoice_');
        return lines.join('\n');
    }

    function whatsappUrl(data) {
        const phone = String((data.buyer && data.buyer.phone) || '').replace(/\D/g, '');
        return `https://wa.me/${phone}?text=${encodeURIComponent(whatsappText(data))}`;
    }

    /**
     * Hand an invoice to the Invoice app for editing. Both apps are served from
     * the same site, so the invoice travels through localStorage.
     * Returns the URL to open.
     */
    function sendToEditor(data, invoiceAppUrl, source) {
        localStorage.setItem(IMPORT_KEY, JSON.stringify({ data, source: source || '', at: Date.now() }));
        return `${invoiceAppUrl}#import`;
    }

    /** Collect a pending hand-over (used by the Invoice app on start-up). */
    function takeImport() {
        const raw = localStorage.getItem(IMPORT_KEY);
        if (!raw) return null;
        localStorage.removeItem(IMPORT_KEY);
        try { return JSON.parse(raw); } catch (e) { return null; }
    }

    global.MSInvoice = { totals, buildPDF, download, whatsappText, whatsappUrl, sendToEditor, takeImport };
})(window);
