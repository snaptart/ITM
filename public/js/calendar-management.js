class CalendarManagement {
    constructor(app) {
        this.app = app;
        this.calendarFactory = null;
        this.config = {};
        this.currentUser = null;
        this.userRole = null;
    }

    async init() {
        // Get current user and role information
        this.currentUser = this.app.currentUser;
        this.userRole = this.app.userRole;
        
        // Set up calendar configuration based on user role
        this.config = this.buildCalendarConfig();
        
        // Import CalendarFactory if not already available
        if (!window.CalendarFactory) {
            const { CalendarFactory } = await import('./calendar-factory.js');
            window.CalendarFactory = CalendarFactory;
        }
    }

    async render() {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) {
            console.error('Main content container not found');
            return;
        }

        // Clear existing content
        mainContent.innerHTML = '';

        // Create calendar container
        const calendarContainer = document.createElement('div');
        calendarContainer.id = 'calendar-management-container';
        calendarContainer.className = 'h-full';
        mainContent.appendChild(calendarContainer);

        // Initialize calendar factory with configuration
        this.calendarFactory = new CalendarFactory(this.config);
        
        // Store reference globally for event handlers
        window.calendarInstance = this;
        
        // Render the calendar
        await this.calendarFactory.render();
        
        // Set up additional event handlers specific to calendar management
        this.setupManagementEventHandlers();
    }

    buildCalendarConfig() {
        const baseConfig = {
            containerId: 'calendar-management-container',
            userRole: this.userRole,
            currentUser: this.currentUser,
            layoutType: 'fullpage',
            enableFilters: true,
            enableSidebar: true,
            apiEndpoint: '/itm/api/calendar-events'
        };

        // Role-specific configuration
        switch (this.userRole) {
            case 'system_admin':
                return {
                    ...baseConfig,
                    initialView: 'timeGridWeek',
                    customButtons: {
                        allocateView: {
                            text: 'Allocation View',
                            click: () => this.showAllocationView()
                        }
                    },
                    permissions: {
                        allocate: true,
                        viewAll: true,
                        manageSlots: true
                    },
                    customEventHandlers: {
                        eventClick: (info, factory) => this.handleAdminEventClick(info, factory)
                    }
                };

            case 'facility_admin':
                return {
                    ...baseConfig,
                    initialView: 'timeGridWeek',
                    customButtons: {
                        manageSlots: {
                            text: 'Manage Slots',
                            click: () => this.showSlotManagement()
                        }
                    },
                    permissions: {
                        allocate: true,
                        viewFacility: true,
                        manageSlots: true
                    },
                    customEventHandlers: {
                        eventClick: (info, factory) => this.handleFacilityAdminEventClick(info, factory)
                    }
                };

            case 'program_user':
                return {
                    ...baseConfig,
                    initialView: 'timeGridWeek',
                    enableSidebar: true,
                    permissions: {
                        confirm: true,
                        decline: true,
                        viewAssigned: true
                    },
                    customEventHandlers: {
                        eventClick: (info, factory) => this.handleProgramUserEventClick(info, factory)
                    }
                };

            default:
                return {
                    ...baseConfig,
                    initialView: 'dayGridMonth',
                    enableFilters: false,
                    enableSidebar: false,
                    permissions: {
                        viewPublic: true
                    }
                };
        }
    }

    setupManagementEventHandlers() {
        // Add any additional event handlers specific to calendar management
        // These complement the base calendar factory handlers
        
        // Handle ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeActiveModal();
            }
        });

        // Handle real-time updates if SSE is available
        if (this.app.eventSource) {
            this.app.eventSource.addEventListener('allocation_updated', (event) => {
                this.handleAllocationUpdate(JSON.parse(event.data));
            });
            
            this.app.eventSource.addEventListener('ice_time_changed', (event) => {
                this.handleIceTimeChange(JSON.parse(event.data));
            });
        }
    }

    // Role-specific event click handlers
    handleAdminEventClick(info, factory) {
        const event = info.event;
        const eventData = event.extendedProps.originalEvent;
        
        let modalContent = `
            <div class="admin-event-details space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <h4 class="font-semibold">Event Information</h4>
                        <p><strong>Time:</strong> ${factory.formatEventTime(event.start, event.end)}</p>
                        <p><strong>Ice Surface:</strong> ${eventData.ice_surface_name}</p>
                        <p><strong>Facility:</strong> ${eventData.facility_name}</p>
                        <p><strong>Status:</strong> <span class="capitalize ${this.getStatusClass(eventData.status)}">${eventData.status}</span></p>
                    </div>
                    <div>
                        <h4 class="font-semibold">Assignment Details</h4>
                        ${eventData.program_name ? `<p><strong>Program:</strong> ${eventData.program_name}</p>` : '<p class="text-gray-500">No program assigned</p>'}
                        ${eventData.allocated_at ? `<p><strong>Allocated:</strong> ${new Date(eventData.allocated_at).toLocaleDateString()}</p>` : ''}
                        ${eventData.confirmed_at ? `<p><strong>Confirmed:</strong> ${new Date(eventData.confirmed_at).toLocaleDateString()}</p>` : ''}
                    </div>
                </div>
                
                <div class="border-t pt-4">
                    <h4 class="font-semibold mb-2">Admin Actions</h4>
                    <div class="flex space-x-2">
                        ${this.getAdminActionButtons(eventData)}
                    </div>
                </div>
            </div>
        `;
        
        this.showModal('Event Management', modalContent);
    }

    handleFacilityAdminEventClick(info, factory) {
        const event = info.event;
        const eventData = event.extendedProps.originalEvent;
        
        let modalContent = `
            <div class="facility-admin-event-details space-y-4">
                <div>
                    <h4 class="font-semibold mb-2">Ice Time Slot</h4>
                    <p><strong>Time:</strong> ${factory.formatEventTime(event.start, event.end)}</p>
                    <p><strong>Ice Surface:</strong> ${eventData.ice_surface_name}</p>
                    <p><strong>Status:</strong> <span class="capitalize ${this.getStatusClass(eventData.status)}">${eventData.status}</span></p>
                    ${eventData.program_name ? `<p><strong>Assigned to:</strong> ${eventData.program_name}</p>` : ''}
                </div>
                
                <div class="border-t pt-4">
                    <div class="flex space-x-2">
                        ${this.getFacilityAdminActionButtons(eventData)}
                    </div>
                </div>
            </div>
        `;
        
        this.showModal('Manage Ice Time', modalContent);
    }

    handleProgramUserEventClick(info, factory) {
        const event = info.event;
        const eventData = event.extendedProps.originalEvent;
        
        // Check if this is the user's assigned time
        const isUserTime = eventData.program_id === this.currentUser?.program_id;
        
        if (!isUserTime && eventData.status !== 'available') {
            // Just show basic info for other programs' time
            let modalContent = `
                <div class="program-user-event-details">
                    <p><strong>Time:</strong> ${factory.formatEventTime(event.start, event.end)}</p>
                    <p><strong>Ice Surface:</strong> ${eventData.ice_surface_name}</p>
                    <p><strong>Status:</strong> Reserved</p>
                </div>
            `;
            this.showModal('Ice Time Information', modalContent);
            return;
        }
        
        let modalContent = `
            <div class="program-user-event-details space-y-4">
                <div>
                    <h4 class="font-semibold mb-2">Your Ice Time</h4>
                    <p><strong>Time:</strong> ${factory.formatEventTime(event.start, event.end)}</p>
                    <p><strong>Ice Surface:</strong> ${eventData.ice_surface_name}</p>
                    <p><strong>Facility:</strong> ${eventData.facility_name}</p>
                    <p><strong>Status:</strong> <span class="capitalize ${this.getStatusClass(eventData.status)}">${eventData.status}</span></p>
                </div>
                
                ${isUserTime ? `
                    <div class="border-t pt-4">
                        <div class="flex space-x-2">
                            ${this.getProgramUserActionButtons(eventData)}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        this.showModal(isUserTime ? 'Your Ice Time' : 'Available Ice Time', modalContent);
    }

    // Action button generators
    getAdminActionButtons(eventData) {
        let buttons = '';
        
        switch (eventData.status) {
            case 'available':
                buttons += `
                    <button onclick="calendarInstance.allocateIceTime(${eventData.id})" 
                            class="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded">
                        Allocate to Program
                    </button>
                    <button onclick="calendarInstance.editSlot(${eventData.id})" 
                            class="bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded">
                        Edit Slot
                    </button>
                `;
                break;
            case 'pending':
                buttons += `
                    <button onclick="calendarInstance.cancelAllocation(${eventData.id})" 
                            class="bg-red-500 hover:bg-red-700 text-white px-4 py-2 rounded">
                        Cancel Allocation
                    </button>
                    <button onclick="calendarInstance.viewAllocationDetails(${eventData.id})" 
                            class="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded">
                        View Details
                    </button>
                `;
                break;
            case 'confirmed':
                buttons += `
                    <button onclick="calendarInstance.viewAllocationDetails(${eventData.id})" 
                            class="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded">
                        View Details
                    </button>
                    <button onclick="calendarInstance.reassignAllocation(${eventData.id})" 
                            class="bg-orange-500 hover:bg-orange-700 text-white px-4 py-2 rounded">
                        Reassign
                    </button>
                `;
                break;
        }
        
        return buttons;
    }

    getFacilityAdminActionButtons(eventData) {
        let buttons = '';
        
        switch (eventData.status) {
            case 'available':
                buttons += `
                    <button onclick="calendarInstance.allocateIceTime(${eventData.id})" 
                            class="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded">
                        Allocate
                    </button>
                `;
                break;
            case 'pending':
            case 'confirmed':
                buttons += `
                    <button onclick="calendarInstance.viewAllocationDetails(${eventData.id})" 
                            class="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded">
                        View Details
                    </button>
                `;
                break;
        }
        
        return buttons;
    }

    getProgramUserActionButtons(eventData) {
        let buttons = '';
        
        if (eventData.status === 'pending') {
            buttons += `
                <button onclick="calendarInstance.confirmAllocation(${eventData.id})" 
                        class="bg-green-500 hover:bg-green-700 text-white px-4 py-2 rounded">
                    Confirm
                </button>
                <button onclick="calendarInstance.declineAllocation(${eventData.id})" 
                        class="bg-red-500 hover:bg-red-700 text-white px-4 py-2 rounded">
                    Decline
                </button>
            `;
        }
        
        return buttons;
    }

    // Action handlers
    async allocateIceTime(slotId) {
        try {
            // Load programs for allocation
            const programs = await this.loadPrograms();
            
            let modalContent = `
                <div class="allocate-ice-time">
                    <h4 class="font-semibold mb-4">Allocate Ice Time to Program</h4>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Select Program</label>
                        <select id="allocation-program-select" class="w-full form-select rounded-md border-gray-300">
                            <option value="">Choose a program...</option>
                            ${programs.map(program => 
                                `<option value="${program.id}">${program.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                        <textarea id="allocation-notes" rows="3" class="w-full form-textarea rounded-md border-gray-300" 
                                  placeholder="Add any notes about this allocation..."></textarea>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="calendarInstance.submitAllocation(${slotId})" 
                                class="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded">
                            Allocate
                        </button>
                        <button onclick="calendarInstance.closeActiveModal()" 
                                class="bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded">
                            Cancel
                        </button>
                    </div>
                </div>
            `;
            
            this.showModal('Allocate Ice Time', modalContent);
        } catch (error) {
            console.error('Error loading allocation form:', error);
            this.showToast('Failed to load allocation form', 'error');
        }
    }

    async submitAllocation(slotId) {
        const programSelect = document.getElementById('allocation-program-select');
        const notesField = document.getElementById('allocation-notes');
        
        if (!programSelect.value) {
            this.showToast('Please select a program', 'error');
            return;
        }
        
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/itm/api/allocate-ice-time', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ice_time_slot_id: slotId,
                    program_id: programSelect.value,
                    notes: notesField.value
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showToast('Ice time allocated successfully', 'success');
                this.closeActiveModal();
                this.calendarFactory.refetchEvents();
            } else {
                this.showToast(result.error || 'Allocation failed', 'error');
            }
        } catch (error) {
            console.error('Error submitting allocation:', error);
            this.showToast('Network error during allocation', 'error');
        }
    }

    async confirmAllocation(allocationId) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/itm/api/confirm-allocation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    allocation_id: allocationId
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showToast('Ice time confirmed successfully', 'success');
                this.closeActiveModal();
                this.calendarFactory.refetchEvents();
            } else {
                this.showToast(result.error || 'Confirmation failed', 'error');
            }
        } catch (error) {
            console.error('Error confirming allocation:', error);
            this.showToast('Network error during confirmation', 'error');
        }
    }

    async declineAllocation(allocationId) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/itm/api/decline-allocation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    allocation_id: allocationId
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showToast('Ice time declined', 'success');
                this.closeActiveModal();
                this.calendarFactory.refetchEvents();
            } else {
                this.showToast(result.error || 'Decline failed', 'error');
            }
        } catch (error) {
            console.error('Error declining allocation:', error);
            this.showToast('Network error during decline', 'error');
        }
    }

    // Utility methods
    async loadPrograms() {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/itm/api/programs', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.programs || data;
        }
        
        throw new Error('Failed to load programs');
    }

    getStatusClass(status) {
        const statusClasses = {
            'available': 'text-gray-600',
            'pending': 'text-yellow-600',
            'confirmed': 'text-green-600',
            'declined': 'text-red-600',
            'cancelled': 'text-gray-500'
        };
        
        return statusClasses[status] || 'text-gray-600';
    }

    showModal(title, content) {
        if (this.app && this.app.showModal) {
            this.app.showModal(title, content);
        } else {
            // Fallback modal implementation
            const modalHtml = `
                <div id="calendar-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg max-h-screen overflow-y-auto">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-semibold">${title}</h3>
                            <button onclick="calendarInstance.closeActiveModal()" class="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <div>${content}</div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }
    }

    closeActiveModal() {
        const modal = document.getElementById('calendar-modal');
        if (modal) {
            modal.remove();
        }
        
        if (this.app && this.app.closeModal) {
            this.app.closeModal();
        }
    }

    showToast(message, type = 'info') {
        if (this.app && this.app.showToast) {
            this.app.showToast(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    // Event handlers for real-time updates
    handleAllocationUpdate(data) {
        // Refresh calendar when allocations change
        if (this.calendarFactory) {
            this.calendarFactory.refetchEvents();
        }
        
        // Show notification if relevant to current user
        if (data.program_id === this.currentUser?.program_id) {
            this.showToast(`Your ice time allocation has been ${data.status}`, 'info');
        }
    }

    handleIceTimeChange(data) {
        // Refresh calendar when ice time slots change
        if (this.calendarFactory) {
            this.calendarFactory.refetchEvents();
        }
    }

    // Additional view methods
    showAllocationView() {
        // Load allocation management view
        this.app.loadContent('allocations');
    }

    showSlotManagement() {
        // Load ice time slots management view
        this.app.loadContent('ice-time-slots');
    }

    // Cleanup
    destroy() {
        if (this.calendarFactory) {
            this.calendarFactory.destroy();
        }
        
        // Remove global reference
        if (window.calendarInstance === this) {
            delete window.calendarInstance;
        }
    }
}

export { CalendarManagement };