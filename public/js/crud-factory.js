class CRUDFactory {
    constructor(config) {
        this.config = config;
        this.apiEndpoint = config.apiEndpoint;
        this.containerId = config.containerId;
        this.entityName = config.entityName;
        this.fields = config.fields;
        this.permissions = config.permissions || {};
        this.dataTable = null;
        this.currentEditId = null;
        this.isLoading = false;
        this.requestTimeout = null;
    }

    async render() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Container with ID ${this.containerId} not found`);
            return;
        }

        container.innerHTML = this.getHTML();
        await this.setupEventListeners();
        await this.loadData();
    }

    getHTML() {
        return `
            <div class="crud-container">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold">${this.config.title || this.entityName}</h2>
                    ${this.permissions.create !== false ? `
                        <button id="add-${this.entityName}-btn" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                            Add ${this.config.singularName || this.entityName}
                        </button>
                    ` : ''}
                </div>

                <div class="bg-white rounded-lg shadow-md p-6">
                    <table id="${this.entityName}-table" class="display w-full">
                        <thead>
                            <tr>
                                ${this.fields.filter(f => f.listable !== false).map(field => 
                                    `<th>${field.label}</th>`
                                ).join('')}
                                ${this.permissions.edit !== false || this.permissions.delete !== false ? '<th>Actions</th>' : ''}
                            </tr>
                        </thead>
                        <tbody>
                        </tbody>
                    </table>
                </div>

                <!-- Modal for Add/Edit -->
                <div id="${this.entityName}-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden flex items-center justify-center z-50">
                    <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
                        <div class="flex justify-between items-center mb-4">
                            <h3 id="${this.entityName}-modal-title" class="text-lg font-semibold">Add ${this.config.singularName || this.entityName}</h3>
                            <button id="${this.entityName}-modal-close" class="text-gray-400 hover:text-gray-600">
                                <span class="sr-only">Close</span>
                                ✕
                            </button>
                        </div>
                        <form id="${this.entityName}-form">
                            ${this.getFormFields()}
                            <div class="flex justify-end space-x-2 mt-6">
                                <button type="button" id="${this.entityName}-cancel" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                                    Cancel
                                </button>
                                <button type="submit" id="${this.entityName}-submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Confirmation Modal -->
                <div id="${this.entityName}-confirm-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden flex items-center justify-center z-50">
                    <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
                        <div class="mb-4">
                            <h3 id="${this.entityName}-confirm-title" class="text-lg font-semibold mb-2">Confirm Action</h3>
                            <p id="${this.entityName}-confirm-message" class="text-gray-600">Are you sure?</p>
                        </div>
                        <div class="flex justify-end space-x-2">
                            <button id="${this.entityName}-confirm-cancel" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                                Cancel
                            </button>
                            <button id="${this.entityName}-confirm-ok" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Error Modal -->
                <div id="${this.entityName}-error-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden flex items-center justify-center z-50">
                    <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                        <div class="flex items-center mb-4">
                            <div class="flex-shrink-0">
                                <svg class="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.732L13.732 4.268c-.77-1.064-2.694-1.064-3.464 0L3.34 16.268C2.57 17.333 3.53 19 5.072 19z" />
                                </svg>
                            </div>
                            <div class="ml-3">
                                <h3 id="${this.entityName}-error-title" class="text-lg font-semibold text-gray-900">Error</h3>
                            </div>
                        </div>
                        <div class="mb-4">
                            <p id="${this.entityName}-error-message" class="text-gray-600">An error occurred.</p>
                        </div>
                        <div class="flex justify-end">
                            <button id="${this.entityName}-error-ok" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getFormFields() {
        return this.fields.filter(f => f.editable !== false).map(field => {
            const inputId = `${this.entityName}-${field.name}`;
            let inputHTML = '';

            switch (field.type) {
                case 'select':
                    inputHTML = `
                        <select id="${inputId}" name="${field.name}" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500" ${field.required ? 'required' : ''}>
                            <option value="">Select ${field.label}</option>
                            ${field.options ? field.options.map(opt => 
                                `<option value="${opt.value}">${opt.label}</option>`
                            ).join('') : ''}
                        </select>
                    `;
                    break;
                case 'textarea':
                    inputHTML = `
                        <textarea id="${inputId}" name="${field.name}" rows="3" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500" ${field.required ? 'required' : ''}></textarea>
                    `;
                    break;
                case 'checkbox':
                    inputHTML = `
                        <input type="checkbox" id="${inputId}" name="${field.name}" class="rounded">
                        <label for="${inputId}" class="ml-2">${field.label}</label>
                    `;
                    return `<div class="mb-4 flex items-center">${inputHTML}</div>`;
                case 'password':
                    inputHTML = `
                        <input type="password" id="${inputId}" name="${field.name}" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500" ${field.required ? 'required' : ''}>
                    `;
                    break;
                default:
                    inputHTML = `
                        <input type="${field.type || 'text'}" id="${inputId}" name="${field.name}" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500" ${field.required ? 'required' : ''}>
                    `;
            }

            if (field.type === 'checkbox') {
                return inputHTML;
            }

            return `
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="${inputId}">
                        ${field.label} ${field.required ? '<span class="text-red-500">*</span>' : ''}
                    </label>
                    ${inputHTML}
                </div>
            `;
        }).join('');
    }

    async setupEventListeners() {
        // Add button
        const addBtn = document.getElementById(`add-${this.entityName}-btn`);
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openModal());
        }

        // Modal close buttons
        document.getElementById(`${this.entityName}-modal-close`).addEventListener('click', () => this.closeModal());
        document.getElementById(`${this.entityName}-cancel`).addEventListener('click', () => this.closeModal());

        // Form submission
        document.getElementById(`${this.entityName}-form`).addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Modal backdrop click
        document.getElementById(`${this.entityName}-modal`).addEventListener('click', (e) => {
            if (e.target.id === `${this.entityName}-modal`) {
                this.closeModal();
            }
        });

        // Confirmation modal event listeners
        document.getElementById(`${this.entityName}-confirm-modal`).addEventListener('click', (e) => {
            if (e.target.id === `${this.entityName}-confirm-modal`) {
                this.closeConfirmModal(false);
            }
        });
        
        document.getElementById(`${this.entityName}-confirm-cancel`).addEventListener('click', () => {
            this.closeConfirmModal(false);
        });
        
        document.getElementById(`${this.entityName}-confirm-ok`).addEventListener('click', () => {
            this.closeConfirmModal(true);
        });

        // Error modal event listeners
        document.getElementById(`${this.entityName}-error-modal`).addEventListener('click', (e) => {
            if (e.target.id === `${this.entityName}-error-modal`) {
                this.closeErrorModal();
            }
        });
        
        document.getElementById(`${this.entityName}-error-ok`).addEventListener('click', () => {
            this.closeErrorModal();
        });
    }

    async loadData() {
        if (this.isLoading) return;
        
        try {
            this.isLoading = true;
            const token = localStorage.getItem('authToken');
            const response = await fetch(this.apiEndpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.initDataTable(data);
            } else {
                this.showToast('Failed to load data', 'error');
            }
        } catch (error) {
            console.error('Error loading data:', error);
            this.showToast('Network error while loading data', 'error');
        } finally {
            this.isLoading = false;
        }
    }

    initDataTable(data) {
        const tableData = (data[this.config.dataKey] || data).map(item => {
            const row = this.fields.filter(f => f.listable !== false).map(field => {
                if (field.formatter) {
                    return field.formatter(item[field.name], item);
                }
                return item[field.name] || '';
            });

            if (this.permissions.edit !== false || this.permissions.delete !== false) {
                const actions = [];
                if (this.permissions.edit !== false) {
                    actions.push(`<button class="bg-blue-500 hover:bg-blue-700 text-white text-xs font-bold py-1 px-2 rounded mr-1" onclick="window.crudInstances['${this.entityName}'].editItem(${item.id})">Edit</button>`);
                }
                if (this.permissions.delete !== false) {
                    actions.push(`<button class="bg-red-500 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded" onclick="window.crudInstances['${this.entityName}'].deleteItem(${item.id})">Delete</button>`);
                }
                row.push(actions.join(''));
            }

            return row;
        });

        if (this.dataTable) {
            this.dataTable.destroy();
        }

        this.dataTable = $(`#${this.entityName}-table`).DataTable({
            data: tableData,
            responsive: true,
            pageLength: 25,
            order: [[0, 'desc']],
            language: {
                search: "Search:",
                lengthMenu: "Show _MENU_ entries",
                info: "Showing _START_ to _END_ of _TOTAL_ entries",
                paginate: {
                    first: "First",
                    last: "Last",
                    next: "Next",
                    previous: "Previous"
                }
            }
        });

        // Store instance globally for action buttons
        if (!window.crudInstances) {
            window.crudInstances = {};
        }
        window.crudInstances[this.entityName] = this;
    }

    openModal(item = null) {
        this.currentEditId = item ? item.id : null;
        const modal = document.getElementById(`${this.entityName}-modal`);
        const title = document.getElementById(`${this.entityName}-modal-title`);
        const form = document.getElementById(`${this.entityName}-form`);

        title.textContent = item ? `Edit ${this.config.singularName || this.entityName}` : `Add ${this.config.singularName || this.entityName}`;
        
        if (item) {
            this.populateForm(item);
        } else {
            form.reset();
        }

        modal.classList.remove('hidden');
    }

    closeModal() {
        const modal = document.getElementById(`${this.entityName}-modal`);
        modal.classList.add('hidden');
        this.currentEditId = null;
    }

    populateForm(item) {
        this.fields.filter(f => f.editable !== false).forEach(field => {
            const input = document.getElementById(`${this.entityName}-${field.name}`);
            if (input) {
                if (field.type === 'checkbox') {
                    input.checked = !!item[field.name];
                } else {
                    input.value = item[field.name] || '';
                }
            }
        });
    }

    async handleSubmit() {
        const form = document.getElementById(`${this.entityName}-form`);
        const formData = new FormData(form);
        const data = {};

        for (let [key, value] of formData.entries()) {
            const field = this.fields.find(f => f.name === key);
            if (field && field.type === 'checkbox') {
                data[key] = true;
            } else {
                data[key] = value;
            }
        }

        // Handle unchecked checkboxes
        this.fields.filter(f => f.type === 'checkbox').forEach(field => {
            if (!formData.has(field.name)) {
                data[field.name] = false;
            }
        });

        try {
            const token = localStorage.getItem('authToken');
            const url = this.currentEditId ? `${this.apiEndpoint}/${this.currentEditId}` : this.apiEndpoint;
            const method = this.currentEditId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                this.showToast(result.message || `${this.config.singularName || this.entityName} ${this.currentEditId ? 'updated' : 'created'} successfully`, 'success');
                this.closeModal();
                
                // For simplicity, reload data to ensure fresh state
                // This avoids issues with different API response structures
                this.loadData();
            } else {
                // Show form validation errors as modal instead of toast
                if (response.status >= 400 && response.status < 500) {
                    this.showErrorModal('Form Validation Error', result.error || 'Operation failed');
                } else {
                    this.showToast(result.error || 'Operation failed', 'error');
                }
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            this.showToast('Network error while saving', 'error');
        }
    }

    async editItem(id) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${this.apiEndpoint}/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                const item = result[this.config.singularName?.toLowerCase()] || result.user || result.data;
                this.openModal(item);
            } else {
                this.showToast('Failed to load item details', 'error');
            }
        } catch (error) {
            console.error('Error loading item:', error);
            this.showToast('Network error while loading item', 'error');
        }
    }

    async deleteItem(id) {
        const confirmed = await this.showConfirmModal(
            'Confirm Delete',
            `Are you sure you want to delete this ${this.config.singularName || this.entityName}? This action cannot be undone.`,
            'Delete',
            'Cancel'
        );
        
        if (!confirmed) {
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${this.apiEndpoint}/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (response.ok) {
                this.showToast(result.message || `${this.config.singularName || this.entityName} deleted successfully`, 'success');
                
                // Remove single row instead of reloading all data
                this.removeTableRow(id);
            } else {
                this.showToast(result.error || 'Delete failed', 'error');
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            this.showToast('Network error while deleting', 'error');
        }
    }

    addTableRow(item) {
        if (!this.dataTable) return;
        
        const row = this.fields.filter(f => f.listable !== false).map(field => {
            if (field.formatter) {
                return field.formatter(item[field.name], item);
            }
            return item[field.name] || '';
        });

        if (this.permissions.edit !== false || this.permissions.delete !== false) {
            const actions = [];
            if (this.permissions.edit !== false) {
                actions.push(`<button class="bg-blue-500 hover:bg-blue-700 text-white text-xs font-bold py-1 px-2 rounded mr-1" onclick="window.crudInstances['${this.entityName}'].editItem(${item.id})">Edit</button>`);
            }
            if (this.permissions.delete !== false) {
                actions.push(`<button class="bg-red-500 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded" onclick="window.crudInstances['${this.entityName}'].deleteItem(${item.id})">Delete</button>`);
            }
            row.push(actions.join(''));
        }

        this.dataTable.row.add(row).draw();
    }

    updateTableRow(item) {
        if (!this.dataTable) return;
        
        const row = this.fields.filter(f => f.listable !== false).map(field => {
            if (field.formatter) {
                return field.formatter(item[field.name], item);
            }
            return item[field.name] || '';
        });

        if (this.permissions.edit !== false || this.permissions.delete !== false) {
            const actions = [];
            if (this.permissions.edit !== false) {
                actions.push(`<button class="bg-blue-500 hover:bg-blue-700 text-white text-xs font-bold py-1 px-2 rounded mr-1" onclick="window.crudInstances['${this.entityName}'].editItem(${item.id})">Edit</button>`);
            }
            if (this.permissions.delete !== false) {
                actions.push(`<button class="bg-red-500 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded" onclick="window.crudInstances['${this.entityName}'].deleteItem(${item.id})">Delete</button>`);
            }
            row.push(actions.join(''));
        }

        // Find and update the row with matching ID
        this.dataTable.rows().every(function(index) {
            const rowData = this.data();
            const firstColumn = rowData[0];
            
            // Check if this row contains the item ID (assuming ID is in first column or actions)
            if (firstColumn == item.id || rowData.join('').includes(`editItem(${item.id})`)) {
                this.data(row).draw();
                return false; // Stop iteration
            }
        });
    }

    removeTableRow(id) {
        if (!this.dataTable) return;
        
        // Find and remove the row with matching ID
        const self = this;
        this.dataTable.rows().every(function(index) {
            const rowData = this.data();
            if (!rowData || rowData.length === 0) return true; // Continue if no data
            
            const firstColumn = rowData[0];
            
            // Check if this row contains the item ID
            if (firstColumn == id || rowData.join('').includes(`editItem(${id})`)) {
                this.remove();
                return false; // Stop iteration
            }
        });
        
        this.dataTable.draw();
    }

    showConfirmModal(title, message, confirmText = 'OK', cancelText = 'Cancel') {
        return new Promise((resolve) => {
            const modal = document.getElementById(`${this.entityName}-confirm-modal`);
            const titleEl = document.getElementById(`${this.entityName}-confirm-title`);
            const messageEl = document.getElementById(`${this.entityName}-confirm-message`);
            const confirmBtn = document.getElementById(`${this.entityName}-confirm-ok`);
            const cancelBtn = document.getElementById(`${this.entityName}-confirm-cancel`);
            
            titleEl.textContent = title;
            messageEl.textContent = message;
            confirmBtn.textContent = confirmText;
            cancelBtn.textContent = cancelText;
            
            this.confirmResolve = resolve;
            modal.classList.remove('hidden');
        });
    }

    closeConfirmModal(result) {
        const modal = document.getElementById(`${this.entityName}-confirm-modal`);
        modal.classList.add('hidden');
        
        if (this.confirmResolve) {
            this.confirmResolve(result);
            this.confirmResolve = null;
        }
    }

    showErrorModal(title, message) {
        const modal = document.getElementById(`${this.entityName}-error-modal`);
        const titleEl = document.getElementById(`${this.entityName}-error-title`);
        const messageEl = document.getElementById(`${this.entityName}-error-message`);
        
        titleEl.textContent = title;
        messageEl.textContent = message;
        
        modal.classList.remove('hidden');
    }

    closeErrorModal() {
        const modal = document.getElementById(`${this.entityName}-error-modal`);
        modal.classList.add('hidden');
    }

    showToast(message, type = 'info') {
        // Use the app's toast function if available
        if (window.app && window.app.showToast) {
            window.app.showToast(message, type);
        } else {
            // Fallback toast implementation using existing CSS classes
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (document.body.contains(toast)) {
                        document.body.removeChild(toast);
                    }
                }, 300);
            }, 3000);
        }
    }
}