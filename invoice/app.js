/**
 * MySarawak Invoice - Core Logic
 * Compliance: LHDN E-Invoice Phase 4 (2026 Ready)
 * Tech: jQuery, jsPDF, LocalStorage
 */

$(document).ready(function () {
    const { jsPDF } = window.jspdf;

    // --- INITIALIZATION ---
    initApp();

    // --- EVENT LISTENERS ---

    // Add Item
    $('#addItem').click(function () {
        addNewItem();
        calculateTotals();
    });

    // Remove Item
    $(document).on('click', '.remove-item', function () {
        $(this).closest('.item-row').remove();
        calculateTotals();
        saveToLocalStorage();
    });

    // Recalculate on input change
    $(document).on('input change', '.item-qty, .item-price, .item-tax', function () {
        calculateTotals();
        saveToLocalStorage();
    });

    // Save general details on change
    $('input, textarea, select').on('input change', function () {
        saveToLocalStorage();
    });

    // Reset Form
    $('#resetForm').click(function () {
        if (confirm('Clear all invoice data?')) {
            localStorage.removeItem('msi_current_invoice');
            location.reload();
        }
    });

    // Generate PDF
    $('#generatePDF').click(function () {
        generateInvoicePDF();
    });

    // WhatsApp Share
    $('#shareWhatsApp').click(function () {
        shareToWhatsApp();
    });

    // --- FUNCTIONS ---

    /**
     * Initialize App with defaults or saved data
     */
    function initApp() {
        const savedData = localStorage.getItem('msi_current_invoice');

        if (savedData) {
            loadFromData(JSON.parse(savedData));
        } else {
            // Set defaults
            $('#invoiceDate').val(new Date().toISOString().split('T')[0]);
            $('#invoiceNo').val('INV-' + Date.now().toString().slice(-6));
            $('#supplierAddress').val('93000 Kuching, Sarawak');
            addNewItem(); // Start with one item
        }
    }

    /**
     * Add a new item row
     */
    function addNewItem(data = null) {
        const itemHtml = `
            <div class="item-row p-4 space-y-3 relative group border-b border-gray-100 last:border-0">
                <div class="flex justify-between items-start gap-4">
                    <div class="flex-1 space-y-1">
                        <label class="text-[10px] font-bold text-gray-400 uppercase">Description</label>
                        <input type="text" class="item-desc w-full bg-gray-50 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-sarawak-green" placeholder="Item/Service Name" value="${data ? data.description : ''}">
                    </div>
                    <button class="remove-item text-red-500 p-2 mt-5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
                
                <div class="grid grid-cols-3 gap-3">
                    <div class="space-y-1">
                        <label class="text-[10px] font-bold text-gray-400 uppercase">Qty</label>
                        <input type="number" class="item-qty w-full bg-gray-50 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-sarawak-green text-center" value="${data ? data.qty : '1'}" min="1">
                    </div>
                    <div class="space-y-1">
                        <label class="text-[10px] font-bold text-gray-400 uppercase">Price (RM)</label>
                        <input type="number" step="0.01" class="item-price w-full bg-gray-50 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-sarawak-green text-right" placeholder="0.00" value="${data ? data.unitPrice : ''}">
                    </div>
                    <div class="space-y-1">
                        <label class="text-[10px] font-bold text-gray-400 uppercase">SST %</label>
                        <select class="item-tax w-full bg-gray-50 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-sarawak-green">
                            <option value="0" ${data && data.taxRate == 0 ? 'selected' : ''}>0%</option>
                            <option value="6" ${data && data.taxRate == 6 ? 'selected' : ''}>6%</option>
                            <option value="8" ${(!data || data.taxRate == 8) ? 'selected' : ''}>8%</option>
                            <option value="10" ${data && data.taxRate == 10 ? 'selected' : ''}>10%</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
        $('#itemsContainer').append(itemHtml);
    }

    /**
     * Calculate Summary
     */
    function calculateTotals() {
        let subtotal = 0;
        let totalTax = 0;

        $('.item-row').each(function () {
            const qty = parseFloat($(this).find('.item-qty').val()) || 0;
            const price = parseFloat($(this).find('.item-price').val()) || 0;
            const taxRate = parseFloat($(this).find('.item-tax').val()) || 0;

            const lineTotal = qty * price;
            const lineTax = lineTotal * (taxRate / 100);

            subtotal += lineTotal;
            totalTax += lineTax;
        });

        const grandTotal = subtotal + totalTax;

        $('#subtotal').text(`RM ${subtotal.toFixed(2)}`);
        $('#taxTotal').text(`RM ${totalTax.toFixed(2)}`);
        $('#grandTotal').text(`RM ${grandTotal.toFixed(2)}`);
    }

    /**
     * Save to LocalStorage
     */
    function saveToLocalStorage() {
        const invoiceData = collectData();
        localStorage.setItem('msi_current_invoice', JSON.stringify(invoiceData));
    }

    /**
     * Collect all form data into JSON
     */
    function collectData() {
        const items = [];
        $('.item-row').each(function () {
            items.push({
                description: $(this).find('.item-desc').val(),
                qty: parseFloat($(this).find('.item-qty').val()) || 0,
                unitPrice: parseFloat($(this).find('.item-price').val()) || 0,
                taxRate: parseFloat($(this).find('.item-tax').val()) || 0
            });
        });

        const subtotal = parseFloat($('#subtotal').text().replace('RM ', ''));
        const totalTax = parseFloat($('#taxTotal').text().replace('RM ', ''));
        const grandTotal = parseFloat($('#grandTotal').text().replace('RM ', ''));

        return {
            invoiceNo: $('#invoiceNo').val(),
            date: $('#invoiceDate').val(),
            isConsolidated: $('#isConsolidated').is(':checked'),
            supplier: {
                name: $('#supplierName').val(),
                tin: $('#supplierTIN').val(),
                msic: $('#supplierMSIC').val(),
                phone: $('#supplierPhone').val(),
                address: $('#supplierAddress').val()
            },
            buyer: {
                name: $('#buyerName').val(),
                tin: $('#buyerTIN').val(),
                phone: $('#buyerPhone').val(),
                address: $('#buyerAddress').val()
            },
            items: items,
            subtotal: subtotal,
            totalTax: totalTax,
            grandTotal: grandTotal
        };
    }

    /**
     * Load from saved data
     */
    function loadFromData(data) {
        $('#invoiceNo').val(data.invoiceNo);
        $('#invoiceDate').val(data.date);
        $('#isConsolidated').prop('checked', data.isConsolidated);

        $('#supplierName').val(data.supplier.name);
        $('#supplierTIN').val(data.supplier.tin);
        $('#supplierMSIC').val(data.supplier.msic);
        $('#supplierPhone').val(data.supplier.phone);
        $('#supplierAddress').val(data.supplier.address);

        $('#buyerName').val(data.buyer.name);
        $('#buyerTIN').val(data.buyer.tin);
        $('#buyerPhone').val(data.buyer.phone);
        $('#buyerAddress').val(data.buyer.address);

        $('#itemsContainer').empty();
        data.items.forEach(item => addNewItem(item));

        calculateTotals();
    }

    /**
     * Generate PDF using jsPDF
     */
    function generateInvoicePDF() {
        const data = collectData();
        const doc = new jsPDF();

        // Colors
        const primaryColor = [0, 80, 53]; // Sarawak Green
        const accentColor = [255, 206, 0]; // Sarawak Yellow

        // Header
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('TAX INVOICE', 15, 25);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...accentColor);
        doc.text(data.isConsolidated ? 'CONSOLIDATED E-INVOICE' : 'LHDN COMPLIANT INVOICE', 15, 32);

        // Invoice Meta
        doc.setTextColor(255, 255, 255);
        doc.text(`No: ${data.invoiceNo}`, 195, 20, { align: 'right' });
        doc.text(`Date: ${data.date}`, 195, 28, { align: 'right' });

        // Supplier & Buyer Info
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(10);

        // Supplier
        doc.setFont('helvetica', 'bold');
        doc.text('FROM (SUPPLIER)', 15, 55);
        doc.setFont('helvetica', 'normal');
        doc.text(data.supplier.name || '---', 15, 60);
        doc.text(`TIN: ${data.supplier.tin || '---'}`, 15, 65);
        if (data.supplier.msic) doc.text(`MSIC: ${data.supplier.msic}`, 15, 70);
        doc.text(`Phone: ${data.supplier.phone || '---'}`, 15, 75);

        const supplierAddr = doc.splitTextToSize(data.supplier.address || '---', 80);
        doc.text(supplierAddr, 15, 80);

        // Buyer
        doc.setFont('helvetica', 'bold');
        doc.text('TO (BUYER)', 115, 55);
        doc.setFont('helvetica', 'normal');
        doc.text(data.buyer.name || 'Walk-in Customer', 115, 60);
        doc.text(`TIN: ${data.buyer.tin || '---'}`, 115, 65);
        doc.text(`Phone: ${data.buyer.phone || '---'}`, 115, 70);

        const buyerAddr = doc.splitTextToSize(data.buyer.address || '', 80);
        doc.text(buyerAddr, 115, 75);

        // Items Table
        const tableBody = data.items.map((item, index) => [
            index + 1,
            item.description,
            item.qty,
            item.unitPrice.toFixed(2),
            `${item.taxRate}%`,
            (item.qty * item.unitPrice).toFixed(2)
        ]);

        doc.autoTable({
            startY: 100,
            head: [['#', 'Description', 'Qty', 'Unit Price (RM)', 'SST %', 'Amount (RM)']],
            body: tableBody,
            headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { left: 15, right: 15 }
        });

        // Totals
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFont('helvetica', 'normal');
        doc.text('Subtotal (Excl. Tax):', 140, finalY, { align: 'right' });
        doc.text(`RM ${data.subtotal.toFixed(2)}`, 195, finalY, { align: 'right' });

        doc.text('Total SST:', 140, finalY + 7, { align: 'right' });
        doc.text(`RM ${data.totalTax.toFixed(2)}`, 195, finalY + 7, { align: 'right' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('GRAND TOTAL:', 140, finalY + 17, { align: 'right' });
        doc.setTextColor(...primaryColor);
        doc.text(`RM ${data.grandTotal.toFixed(2)}`, 195, finalY + 17, { align: 'right' });

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Generated via MySarawak Invoice - LHDN Phase 4 Compliant.', 105, 285, { align: 'center' });

        // Save
        doc.save(`${data.invoiceNo}_MySarawak.pdf`);
    }

    /**
     * Share via WhatsApp
     */
    function shareToWhatsApp() {
        const data = collectData();

        let message = `*MySarawak Invoice Summary*\n`;
        message += `----------------------------\n`;
        message += `*Inv No:* ${data.invoiceNo}\n`;
        message += `*Date:* ${data.date}\n`;
        message += `*From:* ${data.supplier.name}\n`;
        message += `*To:* ${data.buyer.name || 'Customer'}\n`;
        message += `----------------------------\n`;

        data.items.forEach(item => {
            message += `• ${item.description} (x${item.qty}) - RM ${(item.qty * item.unitPrice).toFixed(2)}\n`;
        });

        message += `----------------------------\n`;
        message += `*SST:* RM ${data.totalTax.toFixed(2)}\n`;
        message += `*Total:* RM ${data.grandTotal.toFixed(2)}\n`;
        message += `\n_Generated by MySarawak Invoice_`;

        const encodedMsg = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${data.buyer.phone.replace(/\D/g, '')}?text=${encodedMsg}`;

        window.open(whatsappUrl, '_blank');
    }

});
