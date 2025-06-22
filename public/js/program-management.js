class ProgramManagement {
    constructor(app) {
        this.app = app;
        this.crudFactory = null;
        this.facilities = [];
        this.users = [];
    }

    async init() {
        // Load dependent data first
        await this.loadFacilities();
        await this.loadUsers();
        
        const config = {
            entityName: 'programs',
            singularName: 'Program',
            title: 'Program Management',
            apiEndpoint: '/itm/api/programs',
            containerId: 'dashboard-content',
            dataKey: 'programs',
            itemKey: 'program',
            fields: [
                {
                    name: 'id',
                    label: 'ID',
                    type: 'number',
                    editable: false,
                    listable: true
                },
                {
                    name: 'name',
                    label: 'Program Name',
                    type: 'text',
                    required: true,
                    editable: true,
                    listable: true,
                    placeholder: 'Enter program name'
                },
                {
                    name: 'description',
                    label: 'Description',
                    type: 'textarea',
                    required: false,
                    editable: true,
                    listable: true,
                    placeholder: 'Enter program description',
                    formatter: (value) => {
                        if (!value) return '-';
                        if (value.length > 100) {
                            return `<span title="${value.replace(/"/g, '&quot;')}">${value.substring(0, 100)}...</span>`;
                        }
                        return value;
                    }
                },
                {
                    name: 'program_type',
                    label: 'Program Type',
                    type: 'select',
                    required: true,
                    editable: true,
                    listable: true,
                    options: [
                        { value: 'hockey', label: 'Hockey' },
                        { value: 'figure_skating', label: 'Figure Skating' },
                        { value: 'speed_skating', label: 'Speed Skating' },
                        { value: 'curling', label: 'Curling' },
                        { value: 'public_skating', label: 'Public Skating' },
                        { value: 'other', label: 'Other' }
                    ],
                    formatter: (value) => {
                        const typeMap = {
                            'hockey': 'Hockey',
                            'figure_skating': 'Figure Skating',
                            'speed_skating': 'Speed Skating',
                            'curling': 'Curling',
                            'public_skating': 'Public Skating',
                            'other': 'Other'
                        };
                        return typeMap[value] || value;
                    }
                },
                {
                    name: 'contact_person',
                    label: 'Contact Person',
                    type: 'text',
                    required: false,
                    editable: true,
                    listable: true,
                    placeholder: 'Enter contact person name'
                },
                {
                    name: 'contact_email',
                    label: 'Contact Email',
                    type: 'email',
                    required: false,
                    editable: true,
                    listable: true,
                    placeholder: 'Enter contact email'
                },
                {
                    name: 'contact_phone',
                    label: 'Contact Phone',
                    type: 'tel',
                    required: false,
                    editable: true,
                    listable: true,
                    placeholder: 'Enter contact phone'
                },
                {
                    name: 'program_admin_id',
                    label: 'Program Administrator',
                    type: 'select',
                    required: false,
                    editable: true,
                    listable: true,
                    options: this.users.filter(user => 
                        user.role === 'system_admin' || user.role === 'facility_admin' || user.role === 'program_user'
                    ).map(user => ({
                        value: user.id,
                        label: `${user.name} (${user.email})`
                    })),
                    formatter: (value, item) => {
                        if (!value) return '-';
                        const user = this.users.find(u => u.id == value);
                        return user ? `${user.name}<br><small class="text-gray-500">${user.email}</small>` : 'Unknown User';
                    }
                },
                {
                    name: 'active',
                    label: 'Status',
                    type: 'select',
                    required: false,
                    editable: true,
                    listable: true,
                    options: [
                        { value: '1', label: 'Active' },
                        { value: '0', label: 'Inactive' }
                    ],
                    formatter: (value) => {
                        return value == '1' || value === true ? 
                            '<span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span>' : 
                            '<span class="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">Inactive</span>';
                    }
                },
                {
                    name: 'created_at',
                    label: 'Created',
                    type: 'datetime',
                    editable: false,
                    listable: true,
                    formatter: (value) => {
                        if (!value) return '-';
                        const date = new Date(value);
                        return date.toLocaleDateString() + '<br><small class="text-gray-500">' + 
                               date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) + '</small>';
                    }
                }
            ],
            permissions: this.getPermissions()
        };

        this.crudFactory = new CRUDFactory(config);
    }

    getPermissions() {
        const userRole = this.app.currentUser.role;
        
        if (userRole === 'system_admin') {
            return {
                create: true,
                edit: true,
                delete: true
            };
        } else if (userRole === 'facility_admin') {
            return {
                create: true,
                edit: true,
                delete: false // Facility admins can create/edit but not delete programs
            };
        } else {
            return {
                create: false,
                edit: false,
                delete: false
            };
        }
    }

    async loadFacilities() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/itm/api/facilities', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.facilities = data.facilities || [];
            } else {
                console.error('Failed to load facilities');
                this.facilities = [];
            }
        } catch (error) {
            console.error('Error loading facilities:', error);
            this.facilities = [];
        }
    }

    async loadUsers() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/itm/api/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.users = data.users || [];
            } else {
                console.error('Failed to load users');
                this.users = [];
            }
        } catch (error) {
            console.error('Error loading users:', error);
            this.users = [];
        }
    }

    async render() {
        const container = document.getElementById('dashboard-content');
        
        // Add informational banner
        const banner = this.createBanner();
        container.innerHTML = banner;
        
        // Create CRUD container
        const crudContainer = document.createElement('div');
        crudContainer.id = 'programs-crud-container';
        container.appendChild(crudContainer);
        
        // Update config with new container
        this.crudFactory.config.containerId = 'programs-crud-container';
        
        await this.crudFactory.render();
    }

    createBanner() {
        const userRole = this.app.currentUser.role;
        let bannerContent = '';

        if (userRole === 'system_admin') {
            bannerContent = `
                <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm text-blue-700">
                                <strong>System Administrator View:</strong> You can create, edit, and delete all programs across all facilities. 
                                Programs represent skating activities, teams, or groups that require ice time allocation.
                            </p>
                        </div>
                    </div>
                </div>
            `;
        } else if (userRole === 'facility_admin') {
            bannerContent = `
                <div class="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm text-green-700">
                                <strong>Facility Administrator View:</strong> You can create and edit programs for your facility. 
                                Contact system administrators to delete programs if needed.
                            </p>
                        </div>
                    </div>
                </div>
            `;
        } else {
            bannerContent = `
                <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm text-yellow-700">
                                <strong>Read-Only View:</strong> You can view program information but cannot make changes. 
                                Contact your facility administrator for program modifications.
                            </p>
                        </div>
                    </div>
                </div>
            `;
        }

        return bannerContent;
    }
}

export { ProgramManagement };