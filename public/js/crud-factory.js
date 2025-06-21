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
    }

    async loadData() {
        try {
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
                await this.loadData();
            } else {
                this.showToast(result.error || 'Operation failed', 'error');
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
        if (!confirm(`Are you sure you want to delete this ${this.config.singularName || this.entityName}?`)) {
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
                await this.loadData();
            } else {
                this.showToast(result.error || 'Delete failed', 'error');
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            this.showToast('Network error while deleting', 'error');
        }
    }

    showToast(message, type = 'info') {
        // Use the app's toast function if available
        if (window.app && window.app.showToast) {
            window.app.showToast(message, type);
        } else {
            // Fallback toast implementation
            const toast = document.createElement('div');
            toast.className = `fixed top-4 right-4 px-4 py-2 rounded shadow-lg text-white z-50 ${
                type === 'success' ? 'bg-green-500' : 
                type === 'error' ? 'bg-red-500' : 
                type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
            }`;
            toast.textContent = message;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 3000);
        }
    }
}