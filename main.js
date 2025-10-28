import html2pdf from 'html2pdf.js';

class InvoiceGenerator {
  constructor() {
    this.items = [];
    this.invoiceNumber = this.generateInvoiceNumber();
    this.init();
  }

  init() {
    this.render();
    this.attachEventListeners();
    this.setDefaultDate();
  }

  generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${year}${month}-${random}`;
  }

  setDefaultDate() {
    const dateInput = document.getElementById('invoiceDate');
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.value = today;
    }
  }

  attachEventListeners() {
    document.getElementById('addItemBtn')?.addEventListener('click', () => this.addItem());
    document.getElementById('generateBtn')?.addEventListener('click', () => this.updatePreview());
    document.getElementById('downloadBtn')?.addEventListener('click', () => this.downloadPDF());
    document.getElementById('printBtn')?.addEventListener('click', () => this.printInvoice());
    document.getElementById('resetBtn')?.addEventListener('click', () => this.resetForm());

    const formInputs = document.querySelectorAll('input, textarea, select');
    formInputs.forEach(input => {
      input.addEventListener('input', () => this.updatePreview());
    });
  }

  addItem() {
    const item = {
      id: Date.now(),
      description: '',
      quantity: 1,
      price: 0
    };

    this.items.push(item);
    this.renderItems();
    this.updatePreview();
  }

  removeItem(id) {
    this.items = this.items.filter(item => item.id !== id);
    this.renderItems();
    this.updatePreview();
  }

  updateItem(id, field, value) {
    const item = this.items.find(item => item.id === id);
    if (item) {
      if (field === 'quantity' || field === 'price') {
        item[field] = parseFloat(value) || 0;
      } else {
        item[field] = value;
      }
      this.updatePreview();
    }
  }

  calculateItemTotal(item) {
    return item.quantity * item.price;
  }

  calculateSubtotal() {
    return this.items.reduce((sum, item) => sum + this.calculateItemTotal(item), 0);
  }

  calculateTax(subtotal) {
    const taxRate = parseFloat(document.getElementById('taxRate')?.value || 0);
    return (subtotal * taxRate) / 100;
  }

  calculateTotal(subtotal, tax) {
    return subtotal + tax;
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  }

  renderItems() {
    const container = document.getElementById('itemsContainer');
    if (!container) return;

    if (this.items.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 2rem; text-align: center; color: var(--gray-500);">
          <p>Belum ada item. Klik "Tambah Item" untuk memulai.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.items.map(item => `
      <div class="item-entry">
        <button class="btn btn-danger btn-icon remove-item-btn" onclick="app.removeItem(${item.id})">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
        <div class="item-fields">
          <div class="form-group" style="margin-bottom: 0;">
            <label>Deskripsi</label>
            <input 
              type="text" 
              placeholder="Nama produk atau layanan"
              value="${item.description}"
              oninput="app.updateItem(${item.id}, 'description', this.value)"
            />
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label>Jumlah</label>
            <input 
              type="number" 
              min="1"
              value="${item.quantity}"
              oninput="app.updateItem(${item.id}, 'quantity', this.value)"
            />
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label>Harga Satuan</label>
            <input 
              type="number" 
              min="0"
              value="${item.price}"
              oninput="app.updateItem(${item.id}, 'price', this.value)"
            />
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label>Total</label>
            <input 
              type="text" 
              value="${this.formatCurrency(this.calculateItemTotal(item))}"
              disabled
              style="background: var(--gray-100); font-weight: 600;"
            />
          </div>
        </div>
      </div>
    `).join('');
  }

  updatePreview() {
    const companyName = document.getElementById('companyName')?.value || 'Nama Perusahaan';
    const companyAddress = document.getElementById('companyAddress')?.value || '';
    const companyPhone = document.getElementById('companyPhone')?.value || '';
    const companyEmail = document.getElementById('companyEmail')?.value || '';
    
    const clientName = document.getElementById('clientName')?.value || 'Nama Klien';
    const clientAddress = document.getElementById('clientAddress')?.value || '';
    const clientPhone = document.getElementById('clientPhone')?.value || '';
    const clientEmail = document.getElementById('clientEmail')?.value || '';
    
    const invoiceDate = document.getElementById('invoiceDate')?.value || '';
    const dueDate = document.getElementById('dueDate')?.value || '';
    const notes = document.getElementById('notes')?.value || '';

    const subtotal = this.calculateSubtotal();
    const tax = this.calculateTax(subtotal);
    const total = this.calculateTotal(subtotal, tax);
    const taxRate = document.getElementById('taxRate')?.value || 0;

    const previewContainer = document.getElementById('invoicePreview');
    if (!previewContainer) return;

    if (this.items.length === 0) {
      previewContainer.innerHTML = `
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3>Preview Faktur</h3>
          <p>Tambahkan item untuk melihat preview faktur</p>
        </div>
      `;
      return;
    }

    previewContainer.innerHTML = `
      <div class="invoice-header">
        <div class="company-info">
          <h2>${companyName}</h2>
          ${companyAddress ? `<p>${companyAddress}</p>` : ''}
          ${companyPhone ? `<p>Telp: ${companyPhone}</p>` : ''}
          ${companyEmail ? `<p>Email: ${companyEmail}</p>` : ''}
        </div>
        <div class="invoice-meta">
          <div class="invoice-title">FAKTUR</div>
          <div class="invoice-number">No: ${this.invoiceNumber}</div>
          ${invoiceDate ? `<div class="invoice-date">Tanggal: ${this.formatDate(invoiceDate)}</div>` : ''}
          ${dueDate ? `<div class="invoice-date">Jatuh Tempo: ${this.formatDate(dueDate)}</div>` : ''}
        </div>
      </div>

      <div class="invoice-details">
        <div class="detail-section">
          <h3>Tagihan Kepada:</h3>
          <p><strong>${clientName}</strong></p>
          ${clientAddress ? `<p>${clientAddress}</p>` : ''}
          ${clientPhone ? `<p>Telp: ${clientPhone}</p>` : ''}
          ${clientEmail ? `<p>Email: ${clientEmail}</p>` : ''}
        </div>
        <div class="detail-section">
          <h3>Detail Pembayaran:</h3>
          <p>Transfer ke rekening:</p>
          <p><strong>Bank XXX</strong></p>
          <p>A.n. ${companyName}</p>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Deskripsi</th>
            <th>Jumlah</th>
            <th>Harga Satuan</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${this.items.map(item => `
            <tr>
              <td>${item.description || '-'}</td>
              <td>${item.quantity}</td>
              <td>${this.formatCurrency(item.price)}</td>
              <td>${this.formatCurrency(this.calculateItemTotal(item))}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="invoice-summary">
        <div class="summary-row subtotal">
          <span>Subtotal:</span>
          <span>${this.formatCurrency(subtotal)}</span>
        </div>
        <div class="summary-row tax">
          <span>Pajak (${taxRate}%):</span>
          <span>${this.formatCurrency(tax)}</span>
        </div>
        <div class="summary-row total">
          <span>Total:</span>
          <span>${this.formatCurrency(total)}</span>
        </div>
      </div>

      ${notes ? `
        <div class="invoice-footer">
          <p><strong>Catatan:</strong></p>
          <p>${notes}</p>
        </div>
      ` : ''}

      <div class="invoice-footer" style="margin-top: ${notes ? '1rem' : '3rem'};">
        <p>Terima kasih atas kepercayaan Anda!</p>
      </div>
    `;
  }

  async downloadPDF() {
    const element = document.getElementById('invoicePreview');
    if (!element || this.items.length === 0) {
      alert('Tambahkan item terlebih dahulu untuk mengunduh PDF');
      return;
    }

    const btn = document.getElementById('downloadBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Mengunduh...';
    btn.disabled = true;

    const opt = {
      margin: 10,
      filename: `Faktur-${this.invoiceNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Terjadi kesalahan saat mengunduh PDF');
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  }

  printInvoice() {
    if (this.items.length === 0) {
      alert('Tambahkan item terlebih dahulu untuk mencetak');
      return;
    }
    window.print();
  }

  resetForm() {
    if (!confirm('Apakah Anda yakin ingin mengatur ulang formulir? Semua data akan hilang.')) {
      return;
    }

    this.items = [];
    this.invoiceNumber = this.generateInvoiceNumber();
    
    document.querySelectorAll('input, textarea').forEach(input => {
      if (input.type !== 'date') {
        input.value = '';
      }
    });

    this.setDefaultDate();
    this.renderItems();
    this.updatePreview();
  }

  render() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="header">
        <h1>📄 Generator Faktur</h1>
        <p>Buat faktur profesional dengan mudah dan cepat</p>
      </div>

      <div class="container">
        <div class="form-section">
          <div class="section-header">
            <h2>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Informasi Faktur
            </h2>
          </div>
          <div class="form-content">
            <div class="form-group">
              <h3 style="font-size: 1rem; margin-bottom: 1rem; color: var(--gray-800);">Informasi Perusahaan</h3>
              <div class="form-row">
                <div class="form-group">
                  <label for="companyName">Nama Perusahaan *</label>
                  <input type="text" id="companyName" placeholder="PT. Nama Perusahaan" required />
                </div>
                <div class="form-group">
                  <label for="companyPhone">Telepon</label>
                  <input type="tel" id="companyPhone" placeholder="021-1234567" />
                </div>
              </div>
              <div class="form-group">
                <label for="companyAddress">Alamat</label>
                <textarea id="companyAddress" placeholder="Alamat lengkap perusahaan"></textarea>
              </div>
              <div class="form-group">
                <label for="companyEmail">Email</label>
                <input type="email" id="companyEmail" placeholder="info@perusahaan.com" />
              </div>
            </div>

            <div class="form-group" style="margin-top: 2rem; padding-top: 2rem; border-top: 2px solid var(--gray-200);">
              <h3 style="font-size: 1rem; margin-bottom: 1rem; color: var(--gray-800);">Informasi Klien</h3>
              <div class="form-row">
                <div class="form-group">
                  <label for="clientName">Nama Klien *</label>
                  <input type="text" id="clientName" placeholder="Nama klien atau perusahaan" required />
                </div>
                <div class="form-group">
                  <label for="clientPhone">Telepon</label>
                  <input type="tel" id="clientPhone" placeholder="081234567890" />
                </div>
              </div>
              <div class="form-group">
                <label for="clientAddress">Alamat</label>
                <textarea id="clientAddress" placeholder="Alamat lengkap klien"></textarea>
              </div>
              <div class="form-group">
                <label for="clientEmail">Email</label>
                <input type="email" id="clientEmail" placeholder="klien@email.com" />
              </div>
            </div>

            <div class="form-group" style="margin-top: 2rem; padding-top: 2rem; border-top: 2px solid var(--gray-200);">
              <h3 style="font-size: 1rem; margin-bottom: 1rem; color: var(--gray-800);">Detail Faktur</h3>
              <div class="form-row">
                <div class="form-group">
                  <label for="invoiceDate">Tanggal Faktur *</label>
                  <input type="date" id="invoiceDate" required />
                </div>
                <div class="form-group">
                  <label for="dueDate">Tanggal Jatuh Tempo</label>
                  <input type="date" id="dueDate" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="taxRate">Pajak (%)</label>
                  <input type="number" id="taxRate" value="11" min="0" max="100" step="0.1" />
                </div>
                <div class="form-group">
                  <label>Nomor Faktur</label>
                  <input type="text" value="${this.invoiceNumber}" disabled style="background: var(--gray-100);" />
                </div>
              </div>
            </div>

            <div class="items-section">
              <div class="items-header">
                <h3>Item Faktur</h3>
                <button class="btn btn-primary" id="addItemBtn">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                  </svg>
                  Tambah Item
                </button>
              </div>
              <div id="itemsContainer"></div>
            </div>

            <div class="form-group">
              <label for="notes">Catatan (Opsional)</label>
              <textarea id="notes" placeholder="Tambahkan catatan atau syarat pembayaran"></textarea>
            </div>

            <div class="action-buttons">
              <button class="btn btn-secondary" id="resetBtn">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
                </svg>
                Atur Ulang
              </button>
            </div>
          </div>
        </div>

        <div class="preview-section">
          <div class="section-header">
            <h2>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview Faktur
            </h2>
          </div>
          <div class="invoice-preview" id="invoicePreview"></div>
          <div class="preview-actions">
            <button class="btn btn-success" id="downloadBtn">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
              Unduh PDF
            </button>
            <button class="btn btn-primary" id="printBtn">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clip-rule="evenodd" />
              </svg>
              Cetak
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

window.app = new InvoiceGenerator();
