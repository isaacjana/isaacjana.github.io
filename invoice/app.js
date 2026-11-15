/**
 * MySarawak Invoice - Core Logic
 * Compliance: LHDN E-Invoice Phase 4 (2026 Ready)
 * Tech: jQuery, jsPDF, LocalStorage
 */

$(document).ready(function () {
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
        let savedData = localStorage.getItem('msi_current_invoice');

        // An invoice handed over from another app (e.g. an Ocean order)
        const incoming = location.hash === '#import' ? MSInvoice.takeImport() : null;
        if (incoming && incoming.data) {
            if (savedData) localStorage.setItem('msi_prev_invoice', savedData);
            savedData = JSON.stringify(normaliseInvoice(incoming.data));
            localStorage.setItem('msi_current_invoice', savedData);
            history.replaceState(null, '', location.pathname);
            showImportBanner(incoming);
        }

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
     * Fill in anything an imported invoice left out
     */
    function normaliseInvoice(d) {
        return {
            invoiceNo: d.invoiceNo || 'INV-' + Date.now().toString().slice(-6),
            date: d.date || new Date().toISOString().split('T')[0],
            isConsolidated: !!d.isConsolidated,
            supplier: Object.assign({ name: '', tin: '', msic: '', phone: '', address: '' }, d.supplier),
            buyer: Object.assign({ name: '', tin: '', phone: '', address: '' }, d.buyer),
            items: (d.items || []).map(i => ({
                description: (i.description || '') + (i.unit ? ` (${i.unit})` : ''),
                qty: parseFloat(i.qty) || 0,
                unitPrice: parseFloat(i.unitPrice) || 0,
                taxRate: parseFloat(i.taxRate) || 0
            }))
        };
    }

    function showImportBanner(incoming) {
        const hasPrev = !!localStorage.getItem('msi_prev_invoice');
        const $b = $(`
            <div id="importBanner" class="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-sm flex items-start gap-3">
                <i class="fa-solid fa-file-import text-sarawak-green mt-1"></i>
                <div class="flex-1">
                    <p class="font-semibold text-gray-800"></p>
                    <p class="text-gray-500 text-xs">Check the details, then save the PDF or share it.</p>
                    ${hasPrev ? '<button id="restorePrev" class="mt-2 text-xs font-bold text-sarawak-green underline">Bring back my previous draft</button>' : ''}
                </div>
                <button id="closeBanner" class="text-gray-400 p-1" aria-label="Dismiss"><i class="fa-solid fa-xmark"></i></button>
            </div>`);
        $b.find('p').first().text(`Invoice ${incoming.data.invoiceNo || ''} imported${incoming.source ? ' from ' + incoming.source : ''}.`);
        $('main').prepend($b);
        $b.on('click', '#closeBanner', () => $b.remove());
        $b.on('click', '#restorePrev', () => {
            localStorage.setItem('msi_current_invoice', localStorage.getItem('msi_prev_invoice'));
            localStorage.removeItem('msi_prev_invoice');
            location.reload();
        });
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
                        <input type="text" class="item-desc w-full bg-gray-50 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-sarawak-green" placeholder="Item/Service Name" value="${data ? String(data.description).replace(/&/g, '&amp;').replace(/"/g, '&quot;') : ''}">
                    </div>
                    <button class="remove-item text-red-500 p-2 mt-5" aria-label="Remove item">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
                
                <div class="grid grid-cols-3 gap-3">
                    <div class="space-y-1">
                        <label class="text-[10px] font-bold text-gray-400 uppercase">Qty</label>
                        <input type="number" class="item-qty w-full bg-gray-50 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-sarawak-green text-center" value="${data ? data.qty : '1'}" min="0" step="any">
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
     * Generate PDF (drawing lives in invoice-pdf.js, shared with Ocean)
     */
    function generateInvoicePDF() {
        try {
            MSInvoice.download(collectData());
        } catch (e) {
            alert('Could not create the PDF: ' + e.message);
        }
    }

    /**
     * Share via WhatsApp
     */
    function shareToWhatsApp() {
        window.open(MSInvoice.whatsappUrl(collectData()), '_blank');
    }

});
