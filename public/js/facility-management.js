class FacilityManagement {
    constructor(app) {
        this.app = app;
        this.crudFactory = null;
    }

    async init() {
        await this.loadFacilityAdmins();
        this.setupCRUDFactory();
    }

    async loadFacilityAdmins() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/itm/api/facility-admins', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.facilityAdmins = data.admins || [];
            } else {
                console.error('Failed to load facility admins');
                this.facilityAdmins = [];
            }
        } catch (error) {
            console.error('Error loading facility admins:', error);
            this.facilityAdmins = [];
        }
    }

    setupCRUDFactory() {
        const config = {
            entityName: 'facilities',
            singularName: 'Facility',
            title: 'Facility Management',
            apiEndpoint: '/itm/api/facilities',
            containerId: 'dashboard-content',
            dataKey: 'facilities',
            fields: [
                {
                    name: 'id',
                    label: 'ID',
                    type: 'text',
                    editable: false,
                    listable: true
                },
                {
                    name: 'name',
                    label: 'Facility Name',
                    type: 'text',
                    required: true,
                    listable: true,
                    editable: true
                },
                {
                    name: 'address',
                    label: 'Address',
                    type: 'textarea',
                    required: false,
                    listable: true,
                    editable: true
                },
                {
                    name: 'city',
                    label: 'City',
                    type: 'text',
                    required: false,
                    listable: true,
                    editable: true
                },
                {
                    name: 'province',
                    label: 'Province',
                    type: 'text',
                    required: false,
                    listable: true,
                    editable: true
                },
                {
                    name: 'postal_code',
                    label: 'Postal Code',
                    type: 'text',
                    required: false,
                    listable: false,
                    editable: true
                },
                {
                    name: 'phone',
                    label: 'Phone',
                    type: 'tel',
                    required: false,
                    listable: true,
                    editable: true
                },
                {
                    name: 'email',
                    label: 'Email',
                    type: 'email',
                    required: false,
                    listable: true,
                    editable: true
                },
                {
                    name: 'contact_person',
                    label: 'Contact Person',
                    type: 'text',
                    required: false,
                    listable: true,
                    editable: true
                },
                {
                    name: 'admin_name',
                    label: 'Administrator',
                    type: 'text',
                    editable: false,
                    listable: true,
                    formatter: (value) => value || '<span class="text-gray-500">Not Assigned</span>'
                },
                {
                    name: 'facility_admin_id',
                    label: 'Administrator',
                    type: 'select',
                    required: false,
                    listable: false,
                    editable: true,
                    options: [
                        { value: '', label: 'Not Assigned' },
                        ...this.facilityAdmins.map(admin => ({
                            value: admin.id,
                            label: `${admin.name} (${admin.email})`
                        }))
                    ]
                },
                {
                    name: 'active',
                    label: 'Status',
                    type: 'select',
                    editable: true,
                    listable: true,
                    options: [
                        { value: '1', label: 'Active' },
                        { value: '0', label: 'Inactive' }
                    ],
                    formatter: (value) => value ? 
                        '<span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span>' : 
                        '<span class="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">Inactive</span>'
                },
                {
                    name: 'created_at',
                    label: 'Created',
                    type: 'text',
                    editable: false,
                    listable: true,
                    formatter: (value) => value ? new Date(value).toLocaleDateString() : ''
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
            <div class="facility-management-extras mb-4">
                <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm text-blue-700">
                                <strong>Facility Management:</strong> Add facilities and assign administrators to manage ice time allocation. 
                                Only users with "Facility Administrator" role can be assigned as facility administrators.
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

export { FacilityManagement };