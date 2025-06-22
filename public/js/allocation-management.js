class AllocationManager {
    constructor() {
        this.dataTable = null;
        this.selectedAllocations = new Set();
        this.programs = [];
        this.facilities = [];
        this.iceSurfaces = [];
        this.init();
    }

    async init() {
        await this.loadReferenceData();
        this.setupDataTable();
        this.setupEventListeners();
        this.loadAllocations();
    }

    async loadReferenceData() {
        try {
            // Load programs, facilities, and ice surfaces for filters and assignments
            const [programsResponse, facilitiesResponse, surfacesResponse] = await Promise.all([
                apiRequest('/programs'),
                apiRequest('/facilities'),
                apiRequest('/ice-surfaces')
            ]);

            this.programs = programsResponse.data || programsResponse.programs || [];
            this.facilities = facilitiesResponse.data || facilitiesResponse.facilities || [];
            this.iceSurfaces = surfacesResponse.data || surfacesResponse.ice_surfaces || [];

            this.populateFilterDropdowns();
        } catch (error) {
            console.error('Error loading reference data:', error);
            showNotification('Error loading reference data', 'error');
        }
    }

    populateFilterDropdowns() {
        // Populate facility filter
        const facilitySelect = document.getElementById('facilityFilter');
        if (facilitySelect) {
            facilitySelect.innerHTML = '<option value="">All Facilities</option>';
            this.facilities.forEach(facility => {
                facilitySelect.innerHTML += `<option value="${facility.id}">${facility.name}</option>`;
            });
        }

        // Populate ice surface filter
        const surfaceSelect = document.getElementById('iceSurfaceFilter');
        if (surfaceSelect) {
            surfaceSelect.innerHTML = '<option value="">All Ice Surfaces</option>';
            this.iceSurfaces.forEach(surface => {
                surfaceSelect.innerHTML += `<option value="${surface.id}">${surface.name}</option>`;
            });
        }

        // Populate program filter
        const programSelect = document.getElementById('programFilter');
        if (programSelect) {
            programSelect.innerHTML = '<option value="">All Programs</option>' +
                                    '<option value="0">Unassigned</option>';
            this.programs.forEach(program => {
                programSelect.innerHTML += `<option value="${program.id}">${program.name}</option>`;
            });
        }

        // Populate bulk assign program dropdown
        const bulkProgramSelect = document.getElementById('bulkAssignProgram');
        if (bulkProgramSelect) {
            bulkProgramSelect.innerHTML = '<option value="">Select Program</option>';
            this.programs.forEach(program => {
                bulkProgramSelect.innerHTML += `<option value="${program.id}">${program.name}</option>`;
            });
        }
    }

    setupDataTable() {
        this.dataTable = $('#allocationsTable').DataTable({
            processing: true,
            serverSide: false,
            pageLength: 25,
            order: [[2, 'asc']], // Sort by allocation date
            columnDefs: [
                {
                    targets: 0,
                    orderable: false,
                    render: function(data, type, row) {
                        return `<input type="checkbox" class="allocation-checkbox" value="${row.id}">`;
                    }
                },
                {
                    targets: 1,
                    render: function(data, type, row) {
                        const statusColors = {
                            'available': 'bg-gray-100 text-gray-800',
                            'proposed': 'bg-yellow-100 text-yellow-800',
                            'confirmed': 'bg-green-100 text-green-800',
                            'declined': 'bg-red-100 text-red-800',
                            'cancelled': 'bg-red-100 text-red-800'
                        };
                        const colorClass = statusColors[row.status] || 'bg-gray-100 text-gray-800';
                        return `<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colorClass}">
                                    ${row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                                </span>`;
                    }
                },
                {
                    targets: 4, // Day of week
                    render: function(data, type, row) {
                        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        return days[row.day_of_week] || '';
                    }
                },
                {
                    targets: 5, // Time range
                    render: function(data, type, row) {
                        return `${row.start_time} - ${row.end_time}`;
                    }
                },
                {
                    targets: 6, // Program
                    render: function(data, type, row) {
                        if (row.program_id == 0 || !row.program_name) {
                            return '<span class="text-gray-500">Unassigned</span>';
                        }
                        return row.program_name;
                    }
                },
                {
                    targets: 9, // Actions
                    orderable: false,
                    render: function(data, type, row) {
                        let actions = '';
                        
                        if (row.status === 'available') {
                            actions += `<button onclick="allocationManager.assignAllocation(${row.id})" 
                                              class="text-blue-600 hover:text-blue-900 mr-2">Assign</button>`;
                        }
                        
                        if (row.status === 'proposed') {
                            actions += `<button onclick="allocationManager.unassignAllocation(${row.id})" 
                                              class="text-orange-600 hover:text-orange-900 mr-2">Unassign</button>`;
                        }
                        
                        if (row.status === 'confirmed' || row.status === 'proposed') {
                            actions += `<button onclick="allocationManager.editAllocation(${row.id})" 
                                              class="text-green-600 hover:text-green-900 mr-2">Edit</button>`;
                        }
                        
                        return actions;
                    }
                }
            ],
            columns: [
                { data: 'id', title: 'Select' },
                { data: 'status', title: 'Status' },
                { data: 'allocation_date', title: 'Date' },
                { data: 'facility_name', title: 'Facility' },
                { data: 'day_of_week', title: 'Day' },
                { data: 'start_time', title: 'Time' },
                { data: 'program_name', title: 'Program' },
                { data: 'cost', title: 'Cost' },
                { data: 'notes', title: 'Notes' },
                { data: null, title: 'Actions' }
            ]
        });

        // Handle select all checkbox
        document.getElementById('selectAllAllocations')?.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.allocation-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = e.target.checked;
                if (e.target.checked) {
                    this.selectedAllocations.add(cb.value);
                } else {
                    this.selectedAllocations.delete(cb.value);
                }
            });
            this.updateBulkActionButtons();
        });

        // Handle individual checkbox changes
        $('#allocationsTable tbody').on('change', '.allocation-checkbox', (e) => {
            const allocationId = e.target.value;
            if (e.target.checked) {
                this.selectedAllocations.add(allocationId);
            } else {
                this.selectedAllocations.delete(allocationId);
            }
            this.updateBulkActionButtons();
        });
    }

    setupEventListeners() {
        // Filter change handlers
        document.getElementById('facilityFilter')?.addEventListener('change', () => this.loadAllocations());
        document.getElementById('iceSurfaceFilter')?.addEventListener('change', () => this.loadAllocations());
        document.getElementById('programFilter')?.addEventListener('change', () => this.loadAllocations());
        document.getElementById('statusFilter')?.addEventListener('change', () => this.loadAllocations());
        document.getElementById('dateFromFilter')?.addEventListener('change', () => this.loadAllocations());
        document.getElementById('dateToFilter')?.addEventListener('change', () => this.loadAllocations());

        // Bulk action buttons
        document.getElementById('bulkAssignBtn')?.addEventListener('click', () => this.showBulkAssignModal());
        document.getElementById('bulkUnassignBtn')?.addEventListener('click', () => this.bulkUnassign());
        document.getElementById('refreshBtn')?.addEventListener('click', () => this.loadAllocations());

        // Modal handlers
        document.getElementById('confirmBulkAssign')?.addEventListener('click', () => this.confirmBulkAssign());
        document.getElementById('cancelBulkAssign')?.addEventListener('click', () => this.hideBulkAssignModal());
    }

    async loadAllocations() {
        try {
            const filters = this.getFilters();
            const queryString = new URLSearchParams(filters).toString();
            const response = await apiRequest(`/allocations?${queryString}`);
            
            const allocations = response.data || response.allocations || [];
            
            this.dataTable.clear();
            this.dataTable.rows.add(allocations);
            this.dataTable.draw();
            
            // Clear selections
            this.selectedAllocations.clear();
            this.updateBulkActionButtons();
            
        } catch (error) {
            console.error('Error loading allocations:', error);
            showNotification('Error loading allocations', 'error');
        }
    }

    getFilters() {
        const filters = {};
        
        const facilityId = document.getElementById('facilityFilter')?.value;
        if (facilityId) filters.facility_id = facilityId;
        
        const iceSurfaceId = document.getElementById('iceSurfaceFilter')?.value;
        if (iceSurfaceId) filters.ice_surface_id = iceSurfaceId;
        
        const programId = document.getElementById('programFilter')?.value;
        if (programId) filters.program_id = programId;
        
        const status = document.getElementById('statusFilter')?.value;
        if (status) filters.status = status;
        
        const dateFrom = document.getElementById('dateFromFilter')?.value;
        if (dateFrom) filters.date_from = dateFrom;
        
        const dateTo = document.getElementById('dateToFilter')?.value;
        if (dateTo) filters.date_to = dateTo;
        
        return filters;
    }

    updateBulkActionButtons() {
        const hasSelections = this.selectedAllocations.size > 0;
        const bulkAssignBtn = document.getElementById('bulkAssignBtn');
        const bulkUnassignBtn = document.getElementById('bulkUnassignBtn');
        
        if (bulkAssignBtn) {
            bulkAssignBtn.disabled = !hasSelections;
            bulkAssignBtn.classList.toggle('opacity-50', !hasSelections);
        }
        
        if (bulkUnassignBtn) {
            bulkUnassignBtn.disabled = !hasSelections;
            bulkUnassignBtn.classList.toggle('opacity-50', !hasSelections);
        }
    }

    showBulkAssignModal() {
        if (this.selectedAllocations.size === 0) {
            showNotification('Please select allocations to assign', 'warning');
            return;
        }
        
        document.getElementById('bulkAssignModal').classList.remove('hidden');
        document.getElementById('selectedCount').textContent = this.selectedAllocations.size;
    }

    hideBulkAssignModal() {
        document.getElementById('bulkAssignModal').classList.add('hidden');
        document.getElementById('bulkAssignProgram').value = '';
        document.getElementById('bulkAssignCost').value = '';
        document.getElementById('bulkAssignNotes').value = '';
    }

    async confirmBulkAssign() {
        const programId = document.getElementById('bulkAssignProgram').value;
        const cost = document.getElementById('bulkAssignCost').value;
        const notes = document.getElementById('bulkAssignNotes').value;
        
        if (!programId) {
            showNotification('Please select a program', 'warning');
            return;
        }
        
        try {
            const payload = {
                allocation_ids: Array.from(this.selectedAllocations).map(id => parseInt(id)),
                program_id: parseInt(programId),
                cost: cost ? parseFloat(cost) : null,
                notes: notes || null
            };
            
            const response = await apiRequest('/allocations-bulk-assign', 'POST', payload);
            
            if (response.success) {
                showNotification(`Successfully assigned ${response.assigned_count} allocations`, 'success');
                this.hideBulkAssignModal();
                this.loadAllocations();
            } else {
                showNotification('Failed to assign allocations', 'error');
            }
        } catch (error) {
            console.error('Error bulk assigning:', error);
            showNotification('Error assigning allocations', 'error');
        }
    }

    async bulkUnassign() {
        if (this.selectedAllocations.size === 0) {
            showNotification('Please select allocations to unassign', 'warning');
            return;
        }
        
        if (!confirm(`Are you sure you want to unassign ${this.selectedAllocations.size} allocations?`)) {
            return;
        }
        
        try {
            const payload = {
                allocation_ids: Array.from(this.selectedAllocations).map(id => parseInt(id))
            };
            
            const response = await apiRequest('/allocations-bulk-unassign', 'POST', payload);
            
            if (response.success) {
                showNotification(`Successfully unassigned ${response.unassigned_count} allocations`, 'success');
                this.loadAllocations();
            } else {
                showNotification('Failed to unassign allocations', 'error');
            }
        } catch (error) {
            console.error('Error bulk unassigning:', error);
            showNotification('Error unassigning allocations', 'error');
        }
    }

    async assignAllocation(allocationId) {
        // Show assignment modal for single allocation
        const allocation = this.dataTable.rows().data().toArray().find(a => a.id == allocationId);
        if (!allocation) return;
        
        const programId = prompt('Enter Program ID to assign this allocation to:');
        if (!programId) return;
        
        try {
            const payload = {
                allocation_ids: [parseInt(allocationId)],
                program_id: parseInt(programId)
            };
            
            const response = await apiRequest('/allocations-bulk-assign', 'POST', payload);
            
            if (response.success) {
                showNotification('Allocation assigned successfully', 'success');
                this.loadAllocations();
            } else {
                showNotification('Failed to assign allocation', 'error');
            }
        } catch (error) {
            console.error('Error assigning allocation:', error);
            showNotification('Error assigning allocation', 'error');
        }
    }

    async unassignAllocation(allocationId) {
        if (!confirm('Are you sure you want to unassign this allocation?')) {
            return;
        }
        
        try {
            const payload = {
                allocation_ids: [parseInt(allocationId)]
            };
            
            const response = await apiRequest('/allocations-bulk-unassign', 'POST', payload);
            
            if (response.success) {
                showNotification('Allocation unassigned successfully', 'success');
                this.loadAllocations();
            } else {
                showNotification('Failed to unassign allocation', 'error');
            }
        } catch (error) {
            console.error('Error unassigning allocation:', error);
            showNotification('Error unassigning allocation', 'error');
        }
    }

    async editAllocation(allocationId) {
        const allocation = this.dataTable.rows().data().toArray().find(a => a.id == allocationId);
        if (!allocation) return;
        
        const cost = prompt('Enter cost:', allocation.cost || '');
        const notes = prompt('Enter notes:', allocation.notes || '');
        
        if (cost === null && notes === null) return; // User cancelled
        
        try {
            const payload = {
                cost: cost ? parseFloat(cost) : allocation.cost,
                notes: notes !== null ? notes : allocation.notes
            };
            
            const response = await apiRequest(`/allocations/${allocationId}`, 'PUT', payload);
            
            if (response.success) {
                showNotification('Allocation updated successfully', 'success');
                this.loadAllocations();
            } else {
                showNotification('Failed to update allocation', 'error');
            }
        } catch (error) {
            console.error('Error updating allocation:', error);
            showNotification('Error updating allocation', 'error');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('allocationsTable')) {
        window.allocationManager = new AllocationManager();
    }
});