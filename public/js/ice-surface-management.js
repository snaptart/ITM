class IceSurfaceManagement {
    constructor(app) {
        this.app = app;
        this.crudFactory = null;
        this.facilities = [];
    }

    async init() {
        await this.loadFacilities();
        this.setupCRUDFactory();
    }

    async loadFacilities() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/itm/api/ice-surface-facilities', {
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

    setupCRUDFactory() {
        const config = {
            entityName: 'ice-surfaces',
            singularName: 'Ice Surface',
            title: 'Ice Surface Management',
            apiEndpoint: '/itm/api/ice-surfaces',
            containerId: 'dashboard-content',
            dataKey: 'ice_surfaces',
            itemKey: 'ice_surface',
            fields: [
                {
                    name: 'id',
                    label: 'ID',
                    type: 'text',
                    editable: false,
                    listable: true,
                    required: false
                },
                {
                    name: 'facility_id',
                    label: 'Facility',
                    type: 'select',
                    editable: true,
                    listable: false,
                    required: true,
                    options: [
                        { value: '', label: 'Select a facility...' },
                        ...this.facilities.map(facility => ({
                            value: facility.id,
                            label: facility.name
                        }))
                    ]
                },
                {
                    name: 'facility_name',
                    label: 'Facility',
                    type: 'text',
                    editable: false,
                    listable: true,
                    required: false
                },
                {
                    name: 'name',
                    label: 'Surface Name',
                    type: 'text',
                    editable: true,
                    listable: true,
                    required: true,
                    placeholder: 'e.g., Rink A, Main Ice'
                },
                {
                    name: 'surface_type',
                    label: 'Surface Type',
                    type: 'select',
                    editable: true,
                    listable: true,
                    required: true,
                    options: [
                        { value: 'hockey', label: 'Hockey' },
                        { value: 'figure_skating', label: 'Figure Skating' },
                        { value: 'curling', label: 'Curling' },
                        { value: 'multi_purpose', label: 'Multi Purpose' }
                    ],
                    formatter: (value) => {
                        const typeMap = {
                            'hockey': 'Hockey',
                            'figure_skating': 'Figure Skating',
                            'curling': 'Curling',
                            'multi_purpose': 'Multi Purpose'
                        };
                        return typeMap[value] || value;
                    }
                },
                {
                    name: 'capacity',
                    label: 'Capacity',
                    type: 'number',
                    editable: true,
                    listable: true,
                    required: false,
                    placeholder: 'Seating capacity'
                },
                {
                    name: 'hourly_rate',
                    label: 'Hourly Rate ($)',
                    type: 'number',
                    editable: true,
                    listable: true,
                    required: false,
                    step: '0.01',
                    placeholder: '0.00',
                    formatter: (value) => {
                        if (value === null || value === undefined || value === '') return '';
                        return '$' + parseFloat(value).toFixed(2);
                    }
                },
                {
                    name: 'description',
                    label: 'Description',
                    type: 'textarea',
                    editable: true,
                    listable: true,
                    required: false,
                    placeholder: 'Additional details about this ice surface',
                    formatter: (value) => {
                        if (!value || value.trim() === '') return '';
                        // Truncate long descriptions for table display
                        return value.length > 50 ? 
                            `<span title="${value.replace(/"/g, '&quot;')}">${value.substring(0, 50)}...</span>` : 
                            value;
                    }
                },
                {
                    name: 'active',
                    label: 'Status',
                    type: 'select',
                    editable: true,
                    listable: true,
                    required: true,
                    options: [
                        { value: '1', label: 'Active' },
                        { value: '0', label: 'Inactive' }
                    ],
                    formatter: (value) => {
                        const isActive = value === true || value === 1 || value === '1';
                        return isActive ? 
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
                    required: false,
                    formatter: (value) => {
                        if (!value) return '';
                        return new Date(value).toLocaleDateString();
                    }
                }
            ],
            permissions: {
                create: true,
                edit: true,
                delete: true
            }
        };

        this.crudFactory = new CRUDFactory(config);
    }

    async render() {
        const additionalHTML = `
            <div class="ice-surface-management-extras mb-4">
                <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm text-blue-700">
                                <strong>Ice Surface Management:</strong> Manage individual ice surfaces within your facilities. 
                                Each ice surface can have different types, capacities, and hourly rates for time allocation.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        await this.crudFactory.render();
        
        const container = document.getElementById('dashboard-content');
        const crudContainer = container.querySelector('.crud-container');
        if (crudContainer) {
            crudContainer.insertAdjacentHTML('afterbegin', additionalHTML);
        }
    }
}

export { IceSurfaceManagement };