class IceTimeSlotsManagement {
    constructor(app) {
        this.app = app;
        this.crudFactory = null;
        this.iceSurfaces = [];
    }

    async init() {
        await this.loadIceSurfaces();
        this.setupCRUDFactory();
    }

    async loadIceSurfaces() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/itm/api/ice-time-slots-ice-surfaces', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.iceSurfaces = data.ice_surfaces || [];
            } else {
                console.error('Failed to load ice surfaces');
                this.iceSurfaces = [];
            }
        } catch (error) {
            console.error('Error loading ice surfaces:', error);
            this.iceSurfaces = [];
        }
    }


    setupCRUDFactory() {
        const config = {
            entityName: 'ice-time-slots',
            singularName: 'Ice Time Slot',
            title: 'Ice Time Slots Management',
            apiEndpoint: '/itm/api/ice-time-slots',
            containerId: 'dashboard-content',
            dataKey: 'ice_time_slots',
            itemKey: 'ice_time_slot',
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
                    name: 'ice_surface_id',
                    label: 'Ice Surface',
                    type: 'select',
                    editable: true,
                    listable: false,
                    required: true,
                    options: [
                        { value: '', label: 'Select an ice surface...' },
                        ...this.iceSurfaces.map(surface => ({
                            value: surface.id,
                            label: `${surface.facility_name} - ${surface.name}`
                        }))
                    ]
                },
                {
                    name: 'ice_surface_name',
                    label: 'Ice Surface',
                    type: 'text',
                    editable: false,
                    listable: true,
                    required: false,
                    formatter: (value, item) => {
                        return item.facility_name ? `${item.facility_name} - ${value}` : value;
                    }
                },
                {
                    name: 'effective_date',
                    label: 'Effective Date',
                    type: 'date',
                    editable: true,
                    listable: true,
                    required: true,
                    formatter: (value) => {
                        if (!value) return '';
                        return new Date(value).toLocaleDateString();
                    }
                },
                {
                    name: 'expiry_date',
                    label: 'Expiry Date',
                    type: 'date',
                    editable: true,
                    listable: false,
                    required: false,
                    formatter: (value) => {
                        if (!value) return '';
                        return new Date(value).toLocaleDateString();
                    }
                },
                {
                    name: 'day_of_week',
                    label: 'Day of Week',
                    type: 'select',
                    editable: true,
                    listable: true,
                    required: true,
                    options: [
                        { value: '0', label: 'Sunday' },
                        { value: '1', label: 'Monday' },
                        { value: '2', label: 'Tuesday' },
                        { value: '3', label: 'Wednesday' },
                        { value: '4', label: 'Thursday' },
                        { value: '5', label: 'Friday' },
                        { value: '6', label: 'Saturday' }
                    ],
                    formatter: (value) => {
                        const dayMap = {
                            '0': 'Sunday', '1': 'Monday', '2': 'Tuesday', '3': 'Wednesday',
                            '4': 'Thursday', '5': 'Friday', '6': 'Saturday'
                        };
                        return dayMap[value] || '';
                    }
                },
                {
                    name: 'start_time',
                    label: 'Start Time',
                    type: 'time',
                    editable: true,
                    listable: true,
                    required: true,
                    formatter: (value) => {
                        if (!value) return '';
                        return value.substring(0, 5); // HH:MM format
                    }
                },
                {
                    name: 'end_time',
                    label: 'End Time',
                    type: 'time',
                    editable: true,
                    listable: true,
                    required: true,
                    formatter: (value) => {
                        if (!value) return '';
                        return value.substring(0, 5); // HH:MM format
                    }
                },
                {
                    name: 'slot_type',
                    label: 'Slot Type',
                    type: 'select',
                    editable: true,
                    listable: true,
                    required: true,
                    options: [
                        { value: 'available', label: 'Available' },
                        { value: 'maintenance', label: 'Maintenance' },
                        { value: 'reserved', label: 'Reserved' },
                        { value: 'blocked', label: 'Blocked' }
                    ],
                    formatter: (value) => {
                        const statusMap = {
                            'available': '<span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Available</span>',
                            'maintenance': '<span class="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">Maintenance</span>',
                            'reserved': '<span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Reserved</span>',
                            'blocked': '<span class="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Blocked</span>'
                        };
                        return statusMap[value] || value;
                    }
                },
                {
                    name: 'recurring',
                    label: 'Recurring',
                    type: 'select',
                    editable: true,
                    listable: true,
                    required: true,
                    options: [
                        { value: '1', label: 'Yes' },
                        { value: '0', label: 'No' }
                    ],
                    formatter: (value) => {
                        const isRecurring = value === true || value === 1 || value === '1';
                        return isRecurring ? 
                            '<span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Yes</span>' : 
                            '<span class="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">No</span>';
                    }
                },
                {
                    name: 'priority_level',
                    label: 'Priority',
                    type: 'select',
                    editable: true,
                    listable: true,
                    required: true,
                    options: [
                        { value: '1', label: '1 - Lowest' },
                        { value: '2', label: '2 - Low' },
                        { value: '3', label: '3 - Medium' },
                        { value: '4', label: '4 - High' },
                        { value: '5', label: '5 - Highest' }
                    ],
                    formatter: (value) => {
                        const priorityColors = {
                            '1': 'bg-gray-100 text-gray-800',
                            '2': 'bg-blue-100 text-blue-800',
                            '3': 'bg-yellow-100 text-yellow-800',
                            '4': 'bg-orange-100 text-orange-800',
                            '5': 'bg-red-100 text-red-800'
                        };
                        const colorClass = priorityColors[value] || 'bg-gray-100 text-gray-800';
                        return `<span class="px-2 py-1 ${colorClass} rounded-full text-xs">${value}</span>`;
                    }
                },
                {
                    name: 'notes',
                    label: 'Notes',
                    type: 'textarea',
                    editable: true,
                    listable: true,
                    required: false,
                    placeholder: 'Additional notes about this time slot',
                    formatter: (value) => {
                        if (!value || value.trim() === '') return '';
                        // Truncate long notes for table display
                        return value.length > 30 ? 
                            `<span title="${value.replace(/"/g, '&quot;')}">${value.substring(0, 30)}...</span>` : 
                            value;
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
            <div class="ice-time-slots-management-extras mb-4">
                <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm text-blue-700">
                                <strong>Ice Time Slots Management:</strong> Create and manage available ice time slots for your facilities. 
                                Set schedules, allocate time to programs, and track availability across all ice surfaces.
                            </p>
                        </div>
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div class="bg-white p-4 rounded-lg shadow">
                        <h3 class="text-lg font-semibold mb-2">Quick Actions</h3>
                        <div class="space-y-2">
                            <button id="bulk-create-slots" class="w-full bg-green-500 hover:bg-green-700 text-white text-sm font-bold py-2 px-3 rounded">
                                Bulk Create Slots
                            </button>
                            <button id="view-schedule" class="w-full bg-blue-500 hover:bg-blue-700 text-white text-sm font-bold py-2 px-3 rounded">
                                View Schedule
                            </button>
                        </div>
                    </div>
                    <div class="bg-white p-4 rounded-lg shadow">
                        <h3 class="text-lg font-semibold mb-2">Status Overview</h3>
                        <div class="space-y-1 text-sm">
                            <div class="flex justify-between">
                                <span>Available:</span>
                                <span class="text-green-600 font-semibold" id="available-count">-</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Allocated:</span>
                                <span class="text-blue-600 font-semibold" id="allocated-count">-</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Confirmed:</span>
                                <span class="text-purple-600 font-semibold" id="confirmed-count">-</span>
                            </div>
                        </div>
                    </div>
                    <div class="bg-white p-4 rounded-lg shadow">
                        <h3 class="text-lg font-semibold mb-2">Filters</h3>
                        <div class="space-y-2">
                            <select id="filter-ice-surface" class="w-full text-sm px-2 py-1 border rounded">
                                <option value="">All Ice Surfaces</option>
                                ${this.iceSurfaces.map(surface => 
                                    `<option value="${surface.id}">${surface.facility_name} - ${surface.name}</option>`
                                ).join('')}
                            </select>
                            <select id="filter-status" class="w-full text-sm px-2 py-1 border rounded">
                                <option value="">All Statuses</option>
                                <option value="available">Available</option>
                                <option value="allocated">Allocated</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="maintenance">Maintenance</option>
                            </select>
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
            this.setupEventListeners();
            this.updateStatusCounts();
        }
    }

    setupEventListeners() {
        // Bulk create slots button
        const bulkCreateBtn = document.getElementById('bulk-create-slots');
        if (bulkCreateBtn) {
            bulkCreateBtn.addEventListener('click', () => {
                this.app.showToast('Bulk create functionality coming soon', 'info');
            });
        }

        // View schedule button
        const viewScheduleBtn = document.getElementById('view-schedule');
        if (viewScheduleBtn) {
            viewScheduleBtn.addEventListener('click', () => {
                this.app.showToast('Schedule view functionality coming soon', 'info');
            });
        }

        // Filter event listeners
        const filterIceSurface = document.getElementById('filter-ice-surface');
        const filterStatus = document.getElementById('filter-status');
        
        if (filterIceSurface) {
            filterIceSurface.addEventListener('change', () => this.applyFilters());
        }
        
        if (filterStatus) {
            filterStatus.addEventListener('change', () => this.applyFilters());
        }
    }

    applyFilters() {
        if (!this.crudFactory || !this.crudFactory.dataTable) return;

        const iceSurfaceFilter = document.getElementById('filter-ice-surface')?.value || '';
        const statusFilter = document.getElementById('filter-status')?.value || '';

        // Apply DataTable search filters
        this.crudFactory.dataTable.columns().search('').draw();
        
        if (iceSurfaceFilter) {
            // Find the ice surface column index and apply filter
            const iceSurfaceColumnIndex = this.crudFactory.fields.findIndex(f => f.name === 'ice_surface_name');
            if (iceSurfaceColumnIndex >= 0) {
                this.crudFactory.dataTable.column(iceSurfaceColumnIndex).search(iceSurfaceFilter);
            }
        }
        
        if (statusFilter) {
            // Find the slot_type column index and apply filter
            const statusColumnIndex = this.crudFactory.fields.findIndex(f => f.name === 'slot_type');
            if (statusColumnIndex >= 0) {
                this.crudFactory.dataTable.column(statusColumnIndex).search(statusFilter);
            }
        }
        
        this.crudFactory.dataTable.draw();
        this.updateStatusCounts();
    }

    updateStatusCounts() {
        // This would typically count from the actual data
        // For now, just placeholder functionality
        setTimeout(() => {
            document.getElementById('available-count').textContent = '12';
            document.getElementById('allocated-count').textContent = '8';
            document.getElementById('confirmed-count').textContent = '5';
        }, 100);
    }
}

export { IceTimeSlotsManagement };