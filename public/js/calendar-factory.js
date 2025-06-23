class CalendarFactory {
    constructor(config) {
        this.config = {
            // Required
            containerId: config.containerId,
            userRole: config.userRole,
            currentUser: config.currentUser,
            
            // Calendar configuration
            initialView: config.initialView || 'dayGridMonth',
            apiEndpoint: config.apiEndpoint || '/itm/api/calendar-events',
            
            // Layout and features
            layoutType: config.layoutType || 'embedded', // 'embedded' | 'fullpage'
            enableFilters: config.enableFilters || false,
            enableSidebar: config.enableSidebar || false,
            
            // Time constraints (for week/day views)
            slotMinTime: config.slotMinTime || '06:00:00',
            slotMaxTime: config.slotMaxTime || '23:00:00',
            slotDuration: config.slotDuration || '01:00:00',
            allDaySlot: config.allDaySlot !== undefined ? config.allDaySlot : false,
            
            // Customization hooks
            customEventHandlers: config.customEventHandlers || {},
            additionalFilters: config.additionalFilters || [],
            customButtons: config.customButtons || {},
            
            // Permissions
            permissions: config.permissions || {},
            
            // Styling
            height: config.height || 'auto',
            aspectRatio: config.aspectRatio || null
        };
        
        this.calendar = null;
        this.currentFilters = {};
        this.isLoading = false;
        this.eventCache = new Map();
    }

    async render() {
        const container = document.getElementById(this.config.containerId);
        if (!container) {
            console.error(`Container with ID ${this.config.containerId} not found`);
            return;
        }

        // Generate layout based on type
        if (this.config.layoutType === 'fullpage') {
            container.innerHTML = this.getFullPageHTML();
        } else {
            container.innerHTML = this.getEmbeddedHTML();
        }

        // Setup filters if enabled
        if (this.config.enableFilters) {
            await this.setupFilters();
        }

        // Initialize FullCalendar
        await this.initCalendar();

        // Setup sidebar if enabled
        if (this.config.enableSidebar) {
            await this.setupSidebar();
        }

        // Setup event listeners
        this.setupEventListeners();

        return this.calendar;
    }

    getEmbeddedHTML() {
        return `
            <div class="calendar-container">
                ${this.config.enableFilters ? this.getFiltersHTML() : ''}
                <div id="${this.config.containerId}-calendar" class="calendar-content"></div>
            </div>
        `;
    }

    getFullPageHTML() {
        return `
            <div class="calendar-fullpage-container flex h-full">
                ${this.config.enableSidebar ? `
                    <div class="calendar-sidebar w-80 bg-white border-r border-gray-200 p-4 overflow-y-auto">
                        <div id="${this.config.containerId}-sidebar-content">
                            <h3 class="text-lg font-semibold mb-4">Assigned Ice Time</h3>
                            <div id="${this.config.containerId}-assigned-slots"></div>
                        </div>
                    </div>
                ` : ''}
                <div class="calendar-main-content flex-1 flex flex-col">
                    ${this.config.enableFilters ? `
                        <div class="calendar-filters-bar bg-white border-b border-gray-200 p-4">
                            ${this.getFiltersHTML()}
                        </div>
                    ` : ''}
                    <div class="calendar-content flex-1 p-4">
                        <div id="${this.config.containerId}-calendar"></div>
                    </div>
                </div>
            </div>
        `;
    }

    getFiltersHTML() {
        return `
            <div class="calendar-filters flex space-x-4 mb-4">
                <div class="filter-group">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Facility</label>
                    <select id="${this.config.containerId}-facility-filter" class="form-select rounded-md border-gray-300">
                        <option value="">All Facilities</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Program</label>
                    <select id="${this.config.containerId}-program-filter" class="form-select rounded-md border-gray-300">
                        <option value="">All Programs</option>
                    </select>
                </div>
                ${this.config.additionalFilters.map(filter => `
                    <div class="filter-group">
                        <label class="block text-sm font-medium text-gray-700 mb-1">${filter.label}</label>
                        <select id="${this.config.containerId}-${filter.name}-filter" class="form-select rounded-md border-gray-300">
                            <option value="">All ${filter.label}</option>
                            ${filter.options ? filter.options.map(opt => 
                                `<option value="${opt.value}">${opt.label}</option>`
                            ).join('') : ''}
                        </select>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async initCalendar() {
        const calendarEl = document.getElementById(`${this.config.containerId}-calendar`);
        if (!calendarEl) {
            console.error('Calendar element not found');
            return;
        }

        // Base FullCalendar configuration
        const calendarConfig = {
            initialView: this.config.initialView,
            height: this.config.height,
            aspectRatio: this.config.aspectRatio,
            
            // Header toolbar
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },

            // Time constraints for week/day views
            slotMinTime: this.config.slotMinTime,
            slotMaxTime: this.config.slotMaxTime,
            slotDuration: this.config.slotDuration,
            allDaySlot: this.config.allDaySlot,

            // Event loading
            events: async (info) => {
                try {
                    const events = await this.loadEvents(info.start, info.end);
                    return Array.isArray(events) ? events : [];
                } catch (error) {
                    console.error('Error loading calendar events:', error);
                    this.showToast('Failed to load calendar events', 'error');
                    return [];
                }
            },

            // Event styling and interaction
            eventClick: (info) => this.handleEventClick(info),
            eventMouseEnter: (info) => this.handleEventMouseEnter(info),
            eventMouseLeave: (info) => this.handleEventMouseLeave(info),

            // Loading state
            loading: (isLoading) => this.handleLoadingState(isLoading),

            // Add custom buttons
            customButtons: this.config.customButtons
        };

        // Merge any custom calendar configuration
        if (this.config.customCalendarConfig) {
            Object.assign(calendarConfig, this.config.customCalendarConfig);
        }

        // Initialize FullCalendar
        this.calendar = new FullCalendar.Calendar(calendarEl, calendarConfig);
        await this.calendar.render();
    }

    async loadEvents(start, end) {
        if (this.isLoading) return [];
        
        try {
            this.isLoading = true;
            
            // Build query parameters
            const params = new URLSearchParams({
                start: start.toISOString(),
                end: end.toISOString(),
                ...this.currentFilters
            });

            // Add role-specific parameters
            if (this.config.userRole === 'program_user' && this.config.currentUser?.id) {
                params.append('user_id', this.config.currentUser.id);
            }

            const token = localStorage.getItem('authToken');
            const response = await fetch(`${this.config.apiEndpoint}?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const events = this.transformEventData(data.events || data);
            
            // Cache events for other components
            this.eventCache.set(`${start.toISOString()}-${end.toISOString()}`, events);
            
            return events;
        } catch (error) {
            console.error('Error loading calendar events:', error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    transformEventData(rawEvents) {
        if (!Array.isArray(rawEvents)) return [];
        
        return rawEvents.map(event => {
            // Apply role-based filtering
            if (!this.hasEventPermission(event)) {
                return null;
            }

            // Color coding based on status
            const color = this.getEventColor(event);
            
            // Build event title
            const title = this.buildEventTitle(event);
            
            return {
                id: event.id || `${event.ice_surface_id}-${event.start_time}`,
                title: title,
                start: event.start_time,
                end: event.end_time,
                backgroundColor: color,
                borderColor: color,
                textColor: this.getTextColor(color),
                
                // Extended properties for event details
                extendedProps: {
                    ...event,
                    originalEvent: event
                }
            };
        }).filter(event => event !== null);
    }

    hasEventPermission(event) {
        const role = this.config.userRole;
        const currentUser = this.config.currentUser;
        
        switch (role) {
            case 'system_admin':
                return true;
            case 'facility_admin':
                return !currentUser?.facility_ids || 
                       currentUser.facility_ids.includes(event.facility_id);
            case 'program_user':
                return event.program_id === currentUser?.program_id || 
                       event.status === 'available';
            default:
                return event.status === 'available';
        }
    }

    getEventColor(event) {
        const colorMap = {
            'available': '#e5e7eb',    // gray-200
            'pending': '#f59e0b',      // amber-500
            'confirmed': '#10b981',    // emerald-500
            'declined': '#ef4444',     // red-500
            'cancelled': '#6b7280'     // gray-500
        };
        
        return colorMap[event.status] || colorMap['available'];
    }

    getTextColor(backgroundColor) {
        // Simple logic to determine text color based on background
        const lightColors = ['#e5e7eb', '#f59e0b'];
        return lightColors.includes(backgroundColor) ? '#1f2937' : '#ffffff';
    }

    buildEventTitle(event) {
        const role = this.config.userRole;
        
        if (event.status === 'available') {
            return `Available - ${event.ice_surface_name}`;
        }
        
        switch (role) {
            case 'system_admin':
            case 'facility_admin':
                return `${event.program_name} - ${event.ice_surface_name}`;
            case 'program_user':
                return event.program_id === this.config.currentUser?.program_id
                    ? `Your Time - ${event.ice_surface_name}`
                    : `${event.program_name} - ${event.ice_surface_name}`;
            default:
                return event.ice_surface_name;
        }
    }

    async setupFilters() {
        if (!this.config.enableFilters) return;

        try {
            // Load facility filter options
            await this.loadFacilityFilter();
            
            // Load program filter options
            await this.loadProgramFilter();
            
            // Load additional custom filters
            for (const filter of this.config.additionalFilters) {
                if (filter.loadOptions && typeof filter.loadOptions === 'function') {
                    await filter.loadOptions(this.config.containerId);
                }
            }
        } catch (error) {
            console.error('Error setting up filters:', error);
        }
    }

    async loadFacilityFilter() {
        const facilitySelect = document.getElementById(`${this.config.containerId}-facility-filter`);
        if (!facilitySelect) return;

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/itm/api/facilities', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const facilities = data.facilities || data;
                
                facilities.forEach(facility => {
                    const option = document.createElement('option');
                    option.value = facility.id;
                    option.textContent = facility.name;
                    facilitySelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading facility filter:', error);
        }
    }

    async loadProgramFilter() {
        const programSelect = document.getElementById(`${this.config.containerId}-program-filter`);
        if (!programSelect) return;

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/itm/api/programs', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const programs = data.programs || data;
                
                programs.forEach(program => {
                    const option = document.createElement('option');
                    option.value = program.id;
                    option.textContent = program.name;
                    programSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading program filter:', error);
        }
    }

    setupEventListeners() {
        // Filter change handlers
        if (this.config.enableFilters) {
            const facilityFilter = document.getElementById(`${this.config.containerId}-facility-filter`);
            const programFilter = document.getElementById(`${this.config.containerId}-program-filter`);
            
            if (facilityFilter) {
                facilityFilter.addEventListener('change', () => {
                    this.currentFilters.facility_id = facilityFilter.value;
                    this.refetchEvents();
                });
            }
            
            if (programFilter) {
                programFilter.addEventListener('change', () => {
                    this.currentFilters.program_id = programFilter.value;
                    this.refetchEvents();
                });
            }

            // Additional filter handlers
            this.config.additionalFilters.forEach(filter => {
                const filterEl = document.getElementById(`${this.config.containerId}-${filter.name}-filter`);
                if (filterEl) {
                    filterEl.addEventListener('change', () => {
                        this.currentFilters[filter.name] = filterEl.value;
                        this.refetchEvents();
                    });
                }
            });
        }
    }

    handleEventClick(info) {
        // Check for custom event handler
        if (this.config.customEventHandlers.eventClick) {
            return this.config.customEventHandlers.eventClick(info, this);
        }
        
        // Default event click handler
        this.showEventDetails(info.event);
    }

    handleEventMouseEnter(info) {
        if (this.config.customEventHandlers.eventMouseEnter) {
            return this.config.customEventHandlers.eventMouseEnter(info, this);
        }
        
        // Default hover effect
        info.el.style.opacity = '0.8';
    }

    handleEventMouseLeave(info) {
        if (this.config.customEventHandlers.eventMouseLeave) {
            return this.config.customEventHandlers.eventMouseLeave(info, this);
        }
        
        // Remove hover effect
        info.el.style.opacity = '1';
    }

    handleLoadingState(isLoading) {
        const loadingIndicator = document.getElementById(`${this.config.containerId}-loading`);
        if (loadingIndicator) {
            loadingIndicator.style.display = isLoading ? 'block' : 'none';
        }
    }

    showEventDetails(event) {
        const eventData = event.extendedProps.originalEvent;
        const role = this.config.userRole;
        
        // Build modal content based on role and event status
        let modalContent = `
            <div class="event-details-modal">
                <h3 class="text-lg font-semibold mb-4">${event.title}</h3>
                <div class="space-y-2">
                    <p><strong>Time:</strong> ${this.formatEventTime(event.start, event.end)}</p>
                    <p><strong>Ice Surface:</strong> ${eventData.ice_surface_name}</p>
                    <p><strong>Facility:</strong> ${eventData.facility_name}</p>
                    <p><strong>Status:</strong> <span class="capitalize">${eventData.status}</span></p>
        `;
        
        if (eventData.program_name) {
            modalContent += `<p><strong>Program:</strong> ${eventData.program_name}</p>`;
        }
        
        modalContent += `</div>`;
        
        // Add role-specific action buttons
        modalContent += this.getEventActionButtons(eventData, role);
        modalContent += `</div>`;
        
        this.showModal('Event Details', modalContent);
    }

    getEventActionButtons(eventData, role) {
        let buttons = '';
        
        if (role === 'program_user' && eventData.program_id === this.config.currentUser?.program_id) {
            if (eventData.status === 'pending') {
                buttons += `
                    <div class="flex space-x-2 mt-4">
                        <button onclick="window.calendarInstance.confirmAllocation(${eventData.id})" 
                                class="bg-green-500 hover:bg-green-700 text-white px-4 py-2 rounded">
                            Confirm
                        </button>
                        <button onclick="window.calendarInstance.declineAllocation(${eventData.id})" 
                                class="bg-red-500 hover:bg-red-700 text-white px-4 py-2 rounded">
                            Decline
                        </button>
                    </div>
                `;
            }
        } else if (role === 'facility_admin' || role === 'system_admin') {
            if (eventData.status === 'available') {
                buttons += `
                    <div class="mt-4">
                        <button onclick="window.calendarInstance.allocateIceTime(${eventData.id})" 
                                class="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded">
                            Allocate
                        </button>
                    </div>
                `;
            }
        }
        
        return buttons;
    }

    formatEventTime(start, end) {
        const startTime = new Date(start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const endTime = new Date(end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        return `${startTime} - ${endTime}`;
    }

    async setupSidebar() {
        if (!this.config.enableSidebar) return;
        
        const sidebarContent = document.getElementById(`${this.config.containerId}-assigned-slots`);
        if (!sidebarContent) return;

        try {
            await this.loadAssignedSlots();
        } catch (error) {
            console.error('Error setting up sidebar:', error);
            sidebarContent.innerHTML = '<p class="text-gray-500">Failed to load assigned slots</p>';
        }
    }

    async loadAssignedSlots() {
        // This would be customized per implementation
        // For now, provide a basic structure
        const sidebarContent = document.getElementById(`${this.config.containerId}-assigned-slots`);
        if (!sidebarContent) return;

        sidebarContent.innerHTML = '<p class="text-gray-500">Loading assigned slots...</p>';
        
        // Implement based on specific needs
        // This could fetch user-specific assignments, facility schedules, etc.
    }

    refetchEvents() {
        if (this.calendar) {
            this.calendar.refetchEvents();
        }
    }

    showModal(title, content) {
        // Use app's modal system if available
        if (window.app && window.app.showModal) {
            window.app.showModal(title, content);
        } else {
            // Fallback modal implementation
            alert(`${title}\n\n${content.replace(/<[^>]*>/g, '')}`);
        }
    }

    showToast(message, type = 'info') {
        // Use app's toast system if available
        if (window.app && window.app.showToast) {
            window.app.showToast(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    // Public API methods
    getCalendar() {
        return this.calendar;
    }

    updateFilters(filters) {
        this.currentFilters = { ...this.currentFilters, ...filters };
        this.refetchEvents();
    }

    destroy() {
        if (this.calendar) {
            this.calendar.destroy();
            this.calendar = null;
        }
        this.eventCache.clear();
    }
}

// Make CalendarFactory available globally
window.CalendarFactory = CalendarFactory;