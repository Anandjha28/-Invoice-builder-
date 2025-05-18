(function(){
      const form = document.getElementById('invoice-form');
      const itemsBody = document.getElementById('items-body');
      const addItemBtn = document.getElementById('add-item-btn');
      const calculateBtn = document.getElementById('calculate-btn');
      const exportBtn = document.getElementById('export-btn');
      const resetBtn = document.getElementById('reset-btn');
      const exportPreview = document.getElementById('export-preview');

      const subtotalEl = document.getElementById('subtotal-amount');
      const taxEl = document.getElementById('tax-amount');
      const discountEl = document.getElementById('discount-amount');
      const totalEl = document.getElementById('total-amount');

      // Add initial item row
      function createItemRow(desc = '', qty = '', price = '') {
        const tr = document.createElement('tr');

        // Description cell
        const tdDesc = document.createElement('td');
        const descInput = document.createElement('input');
        descInput.type = 'text';
        descInput.placeholder = 'Item Description';
        descInput.value = desc;
        descInput.required = true;
        descInput.autocomplete = 'off';
        tdDesc.appendChild(descInput);
        tr.appendChild(tdDesc);

        // Quantity cell
        const tdQty = document.createElement('td');
        const qtyInput = document.createElement('input');
        qtyInput.type = 'number';
        qtyInput.min = '0';
        qtyInput.step = '1';
        qtyInput.value = qty;
        qtyInput.required = true;
        tdQty.appendChild(qtyInput);
        tr.appendChild(tdQty);

        // Price per unit cell
        const tdPrice = document.createElement('td');
        const priceInput = document.createElement('input');
        priceInput.type = 'number';
        priceInput.min = '0';
        priceInput.step = '0.01';
        priceInput.value = price;
        priceInput.required = true;
        tdPrice.appendChild(priceInput);
        tr.appendChild(tdPrice);

        // Total cell (calculated, read-only)
        const tdTotal = document.createElement('td');
        tdTotal.textContent = '₹0.00';
        tdTotal.style.fontWeight = '700';
        tr.appendChild(tdTotal);

        // Delete button cell
        const tdDel = document.createElement('td');
        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.textContent = '×';
        delBtn.setAttribute('aria-label', 'Delete item row');
        delBtn.style.color = '#ef4444';
        delBtn.style.background = 'none';
        delBtn.style.border = 'none';
        delBtn.style.fontSize = '1.5rem';
        delBtn.style.lineHeight = '1';
        delBtn.style.cursor = 'pointer';
        delBtn.style.padding = '0';
        delBtn.style.userSelect = 'none';
        delBtn.style.fontWeight = '700';

        delBtn.addEventListener('click', () => {
          itemsBody.removeChild(tr);
          calculateTotals();
        });
        tdDel.appendChild(delBtn);
        tr.appendChild(tdDel);

        // Listen for input changes in qty and price to update total cell live
        function updateRowTotal() {
          let q = parseFloat(qtyInput.value);
          let p = parseFloat(priceInput.value);
          if (isNaN(q) || q < 0) q = 0;
          if (isNaN(p) || p < 0) p = 0;
          const total = q * p;
          tdTotal.textContent = `₹${total.toFixed(2)}`;
        }

        qtyInput.addEventListener('input', () => {
          updateRowTotal();
          calculateTotals();
        });
        priceInput.addEventListener('input', () => {
          updateRowTotal();
          calculateTotals();
        });
        descInput.addEventListener('input', () => {
          // Could add validation if needed
        });

        // Initialize total for this row
        updateRowTotal();

        return tr;
      }

      function calculateTotals() {
        let subtotal = 0;
        const rows = itemsBody.querySelectorAll('tr');
        rows.forEach(row => {
          const qtyInput = row.querySelector('td:nth-child(2) input');
          const priceInput = row.querySelector('td:nth-child(3) input');
          let q = parseFloat(qtyInput.value);
          let p = parseFloat(priceInput.value);
          if (isNaN(q) || q < 0) q = 0;
          if (isNaN(p) || p < 0) p = 0;
          subtotal += q * p;
        });

        const taxPercent = parseFloat(form.elements['taxPercent'].value);
        const discountPercent = parseFloat(form.elements['discountPercent'].value);

        const taxAmt = !isNaN(taxPercent) && taxPercent > 0 ? (subtotal * taxPercent / 100) : 0;
        const discountAmt = !isNaN(discountPercent) && discountPercent > 0 ? (subtotal * discountPercent / 100) : 0;
        const total = subtotal + taxAmt - discountAmt;

        subtotalEl.textContent = `₹${subtotal.toFixed(2)}`;
        taxEl.textContent = `₹${taxAmt.toFixed(2)}`;
        discountEl.textContent = `₹${discountAmt.toFixed(2)}`;
        totalEl.textContent = `₹${total.toFixed(2)}`;

        return {subtotal, taxAmt, discountAmt, total};
      }

      function exportInvoice() {
        // Validate required fields first
        const clientName = form.elements['clientName'].value.trim();
        const invoiceDateVal = form.elements['invoiceDate'].value;

        if(!clientName) {
          alert('Please enter the client name or company.');
          return;
        }
        if(!invoiceDateVal) {
          alert('Please enter the invoice date.');
          return;
        }

        // Build text preview
        const {subtotal, taxAmt, discountAmt, total} = calculateTotals();
        const invoiceDate = new Date(invoiceDateVal);
        const dateStr = invoiceDate.toLocaleDateString(undefined, {year: 'numeric', month: 'long', day: 'numeric'});

        let lines = [];
        lines.push("INVOICE");
        lines.push(`Date: ${dateStr}`);
        lines.push(`Billed To: ${clientName}`);
        lines.push('');
        lines.push('Items:');
        lines.push('-----------------------------------------------------');
        lines.push('Description                Qty    Price      Total');
        lines.push('-----------------------------------------------------');

        const rows = Array.from(itemsBody.querySelectorAll('tr'));
        if(rows.length === 0) lines.push('(No items added)');
        else rows.forEach(row=>{
          const desc = row.querySelector('td:nth-child(1) input').value.trim() || '(No Description)';
          let qty = parseFloat(row.querySelector('td:nth-child(2) input').value);
          let price = parseFloat(row.querySelector('td:nth-child(3) input').value);
          if(isNaN(qty) || qty < 0) qty = 0;
          if(isNaN(price) || price < 0) price = 0;
          const total = qty * price;

          // Fixed width formatting: Description 23 chars, qty 5 right, price 10 right, total 10 right
          const descTxt = desc.length > 23 ? desc.slice(0,20) + '...' : desc.padEnd(23,' ');
          const qtyTxt = qty.toString().padStart(5, ' ');
          const priceTxt = price.toFixed(2).padStart(10,' ');
          const totalTxt = total.toFixed(2).padStart(10,' ');
          lines.push(`${descTxt}${qtyTxt}${priceTxt}${totalTxt}`);
        });
        lines.push('-----------------------------------------------------');
        lines.push(`Subtotal: ₹${subtotal.toFixed(2)}`);
        lines.push(`Tax (${form.elements['taxPercent'].value}%): ₹${taxAmt.toFixed(2)}`);
        lines.push(`Discount (${form.elements['discountPercent'].value}%): -₹${discountAmt.toFixed(2)}`);
        lines.push(`TOTAL: ₹${total.toFixed(2)}`);
        lines.push('');
        lines.push('Thank you for your business!');

        exportPreview.textContent = lines.join('\n');

        // Scroll preview to top
        exportPreview.scrollTop = 0;
        exportPreview.focus();
      }

      // Add event listeners
      addItemBtn.addEventListener('click', () => {
        const newRow = createItemRow();
        itemsBody.appendChild(newRow);
      });

      calculateBtn.addEventListener('click', () => {
        calculateTotals();
      });

      exportBtn.addEventListener('click', () => {
        exportInvoice();
      });

      resetBtn.addEventListener('click', () => {
        itemsBody.innerHTML = '';
        exportPreview.textContent = '';
        subtotalEl.textContent = '₹0.00';
        taxEl.textContent = '₹0.00';
        discountEl.textContent = '₹0.00';
        totalEl.textContent = '₹0.00';
        // Add an initial empty row
        itemsBody.appendChild(createItemRow());
      });

      // Initialize with one empty item row
      itemsBody.appendChild(createItemRow());

      // Prefill invoice date with today
      const todayStr = new Date().toISOString().slice(0,10);
      form.elements['invoiceDate'].value = todayStr;

    })();
  