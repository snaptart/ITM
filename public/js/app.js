class ITMApp {
    constructor() {
        this.currentUser = null;
        this.eventSource = null;
        this.userManagement = null;
        this.facilityManagement = null;
        this.iceSurfaceManagement = null;
        this.programManagement = null;
        this.iceTimeSlotsManagement = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
    }

    setupEventListeners() {
        // Toggle sidebar on mobile
        document.getElementById('header-toggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('show');
        });

        // Form toggles
        document.getElementById('show-register').addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterForm();
        });

        document.getElementById('show-login').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });

        // Form submissions
        document.getElementById('login').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('register').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.handleLogout();
        });
    }

    showLoginForm() {
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('register-form').classList.add('hidden');
    }

    showRegisterForm() {
        document.getElementById('register-form').classList.remove('hidden');
        document.getElementById('login-form').classList.add('hidden');
    }

    async handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/itm/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.currentUser = data.user;
                localStorage.setItem('authToken', data.token);
                this.showDashboard();
                this.showToast('Login successful!', 'success');
                this.setupSSE();
            } else {
                this.showToast(data.error || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showToast('Network error. Please try again.', 'error');
        }
    }

    async handleRegister() {
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;

        try {
            const response = await fetch('/itm/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.showToast('Registration successful! Please login.', 'success');
                this.showLoginForm();
                document.getElementById('email').value = email;
            } else {
                this.showToast(data.error || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showToast('Network error. Please try again.', 'error');
        }
    }

    handleLogout() {
        localStorage.removeItem('authToken');
        this.currentUser = null;
        this.closeSSE();
        this.showLoginForm();
        this.hideDashboard();
        this.showToast('Logged out successfully', 'info');
    }

    checkAuthStatus() {
        const token = localStorage.getItem('authToken');
        if (token) {
            this.validateToken(token);
        }
    }

    async validateToken(token) {
        try {
            const response = await fetch('/itm/api/validate-token', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                this.showDashboard();
                this.setupSSE();
            } else {
                localStorage.removeItem('authToken');
            }
        } catch (error) {
            console.error('Token validation error:', error);
            localStorage.removeItem('authToken');
        }
    }

    showDashboard() {
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('register-form').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        document.getElementById('user-menu').classList.remove('hidden');
        document.getElementById('user-name').textContent = this.currentUser.name;
        
        this.setupNavigation();
        this.loadDashboardContent();
    }

    hideDashboard() {
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('user-menu').classList.add('hidden');
        document.getElementById('nav-menu').innerHTML = '';
    }

    setupNavigation() {
        const navMenu = document.getElementById('nav-menu');
        const userRole = this.currentUser.role;

        let menuItems = [];

        if (userRole === 'system_admin') {
            menuItems = [
                { title: 'Dashboard', action: 'dashboard' },
                { title: 'User Management', action: 'users' },
                { title: 'Facilities', action: 'facilities' },
                { title: 'Ice Surfaces', action: 'ice-surfaces' },
                { title: 'Programs', action: 'programs' },
                { title: 'Ice Time Slots', action: 'ice-time-slots' },
                { title: 'Calendar', action: 'calendar' },
                { title: 'Reports', action: 'reports' }
            ];
        } else if (userRole === 'facility_admin') {
            menuItems = [
                { title: 'Dashboard', action: 'dashboard' },
                { title: 'My Facility', action: 'my-facility' },
                { title: 'Ice Surfaces', action: 'ice-surfaces' },
                { title: 'Ice Time Slots', action: 'ice-time-slots' },
                { title: 'Allocations', action: 'allocations' },
                { title: 'Programs', action: 'programs' },
                { title: 'Calendar', action: 'calendar' }
            ];
        } else if (userRole === 'program_user') {
            menuItems = [
                { title: 'Dashboard', action: 'dashboard' },
                { title: 'My Allocations', action: 'my-allocations' },
                { title: 'Calendar', action: 'calendar' },
                { title: 'Confirmations', action: 'confirmations' }
            ];
        }

        navMenu.innerHTML = menuItems.map(item => 
            `<li><a href="#" class="block px-4 py-2 rounded hover:bg-gray-700" data-action="${item.action}">${item.title}</a></li>`
        ).join('');

        // Add event listeners to navigation items
        navMenu.addEventListener('click', (e) => {
            if (e.target.dataset.action) {
                e.preventDefault();
                this.loadContent(e.target.dataset.action);
            }
        });
    }

    loadDashboardContent() {
        const dashboardContent = document.getElementById('dashboard-content');
        const userRole = this.currentUser.role;

        if (userRole === 'system_admin') {
            dashboardContent.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <h3 class="text-lg font-semibold text-gray-700">Total Users</h3>
                        <p class="text-3xl font-bold text-blue-600" id="total-users">-</p>
                    </div>
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <h3 class="text-lg font-semibold text-gray-700">Active Facilities</h3>
                        <p class="text-3xl font-bold text-green-600" id="total-facilities">-</p>
                    </div>
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <h3 class="text-lg font-semibold text-gray-700">Ice Surfaces</h3>
                        <p class="text-3xl font-bold text-purple-600" id="total-ice-surfaces">-</p>
                    </div>
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <h3 class="text-lg font-semibold text-gray-700">Programs</h3>
                        <p class="text-3xl font-bold text-orange-600" id="total-programs">-</p>
                    </div>
                </div>
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h3 class="text-xl font-semibold mb-4">Recent Activity</h3>
                    <div id="recent-activity">Loading...</div>
                </div>
            `;
        } else if (userRole === 'facility_admin') {
            dashboardContent.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <h3 class="text-lg font-semibold text-gray-700">My Ice Surfaces</h3>
                        <p class="text-3xl font-bold text-blue-600" id="my-ice-surfaces">-</p>
                    </div>
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <h3 class="text-lg font-semibold text-gray-700">Active Programs</h3>
                        <p class="text-3xl font-bold text-green-600" id="active-programs">-</p>
                    </div>
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <h3 class="text-lg font-semibold text-gray-700">Pending Confirmations</h3>
                        <p class="text-3xl font-bold text-orange-600" id="pending-confirmations">-</p>
                    </div>
                </div>
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h3 class="text-xl font-semibold mb-4">Ice Time Calendar</h3>
                    <div id="calendar"></div>
                </div>
            `;
            this.initCalendar();
        } else if (userRole === 'program_user') {
            dashboardContent.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <h3 class="text-lg font-semibold text-gray-700">My Allocations</h3>
                        <p class="text-3xl font-bold text-blue-600" id="my-allocations-count">-</p>
                    </div>
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <h3 class="text-lg font-semibold text-gray-700">Pending Confirmations</h3>
                        <p class="text-3xl font-bold text-orange-600" id="pending-confirmations-count">-</p>
                    </div>
                </div>
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h3 class="text-xl font-semibold mb-4">My Ice Time Schedule</h3>
                    <div id="calendar"></div>
                </div>
            `;
            this.initCalendar();
        }

        this.loadDashboardData();
    }

    async loadDashboardData() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/itm/api/dashboard-data', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.updateDashboardStats(data);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    updateDashboardStats(data) {
        const userRole = this.currentUser.role;

        if (userRole === 'system_admin') {
            document.getElementById('total-users').textContent = data.totalUsers || 0;
            document.getElementById('total-facilities').textContent = data.totalFacilities || 0;
            document.getElementById('total-ice-surfaces').textContent = data.totalIceSurfaces || 0;
            document.getElementById('total-programs').textContent = data.totalPrograms || 0;
        } else if (userRole === 'facility_admin') {
            document.getElementById('my-ice-surfaces').textContent = data.myIceSurfaces || 0;
            document.getElementById('active-programs').textContent = data.activePrograms || 0;
            document.getElementById('pending-confirmations').textContent = data.pendingConfirmations || 0;
        } else if (userRole === 'program_user') {
            document.getElementById('my-allocations-count').textContent = data.myAllocations || 0;
            document.getElementById('pending-confirmations-count').textContent = data.pendingConfirmations || 0;
        }
    }

    initCalendar() {
        const calendarEl = document.getElementById('calendar');
        if (calendarEl) {
            const calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                },
                events: async (info) => {
                    try {
                        const events = await this.loadCalendarEvents(info.start, info.end);
                        return Array.isArray(events) ? events : [];
                    } catch (error) {
                        console.error('Error in FullCalendar events function:', error);
                        return [];
                    }
                },
                eventClick: (info) => {
                    this.showEventDetails(info.event);
                }
            });
            calendar.render();
        }
    }

    showEventDetails(event) {
        console.log('Event clicked:', event);
    }

    loadCalendarPage() {
        const dashboardContent = document.getElementById('dashboard-content');
        const userRole = this.currentUser.role;
        
        let sidebarTitle = 'My Ice Time Slots';
        if (userRole === 'facility_admin') {
            sidebarTitle = 'Ice Time Allocations';
        } else if (userRole === 'system_admin') {
            sidebarTitle = 'All Ice Time Allocations';
        }
        
        dashboardContent.innerHTML = `
            <div class="flex h-full">
                <!-- Workspace Sidebar -->
                <div class="w-80 bg-white rounded-lg shadow-md mr-6 flex flex-col">
                    <div class="p-4 border-b">
                        <h3 class="text-lg font-semibold text-gray-800">${sidebarTitle}</h3>
                    </div>
                    <div class="flex-1 overflow-y-auto p-4">
                        <div id="assigned-slots">
                            <div class="text-center text-gray-500 py-8">Loading assigned slots...</div>
                        </div>
                    </div>
                </div>

                <!-- Main Calendar Area -->
                <div class="flex-1 bg-white rounded-lg shadow-md p-6">
                    <!-- Filters -->
                    <div class="mb-6 flex flex-wrap gap-4 items-center justify-between">
                        <h2 class="text-xl font-semibold text-gray-800">Ice Time Calendar</h2>
                        <div class="flex gap-4">
                            <div class="flex items-center gap-2">
                                <label for="facility-filter" class="text-sm font-medium text-gray-700">Facility:</label>
                                <select id="facility-filter" class="border border-gray-300 rounded-md px-3 py-1 text-sm">
                                    <option value="">All Facilities</option>
                                </select>
                            </div>
                            <div class="flex items-center gap-2">
                                <label for="program-filter" class="text-sm font-medium text-gray-700">Program:</label>
                                <select id="program-filter" class="border border-gray-300 rounded-md px-3 py-1 text-sm">
                                    <option value="">All Programs</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Calendar -->
                    <div id="main-calendar"></div>
                </div>
            </div>
        `;

        this.initMainCalendar();
        this.loadAssignedSlots();
        this.loadCalendarFilters();
    }

    initMainCalendar() {
        const calendarEl = document.getElementById('main-calendar');
        if (calendarEl && typeof FullCalendar !== 'undefined') {
            this.mainCalendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'timeGridWeek',
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                },
                height: 'auto',
                slotMinTime: '06:00:00',
                slotMaxTime: '23:00:00',
                slotDuration: '01:00:00',
                allDaySlot: false,
                events: async (info) => {
                    try {
                        const events = await this.loadCalendarEvents(info.start, info.end);
                        // Ensure we always return an array
                        return Array.isArray(events) ? events : [];
                    } catch (error) {
                        console.error('Error in FullCalendar events function:', error);
                        return [];
                    }
                },
                eventClick: (info) => {
                    this.showCalendarEventDetails(info.event);
                },
                eventDidMount: (info) => {
                    info.el.style.cursor = 'pointer';
                }
            });
            this.mainCalendar.render();
        } else if (!calendarEl) {
            console.error('Calendar element not found');
        } else if (typeof FullCalendar === 'undefined') {
            console.error('FullCalendar library not loaded');
            document.getElementById('main-calendar').innerHTML = 
                '<div class="text-center text-gray-500 py-8">Calendar library not loaded. Please refresh the page.</div>';
        }
    }

    async loadCalendarEvents(start, end) {
        try {
            const token = localStorage.getItem('authToken');
            const facilityFilter = document.getElementById('facility-filter')?.value || '';
            const programFilter = document.getElementById('program-filter')?.value || '';
            const userRole = this.currentUser.role;
            
            const params = new URLSearchParams({
                start: start.toISOString(),
                end: end.toISOString(),
                facility_id: facilityFilter,
                program_id: programFilter
            });

            // Add role-based filtering
            if (userRole === 'program_user') {
                // Program users should only see their allocations and available ice time
                params.append('show_available', 'false'); // Only their assignments
                params.append('user_program_id', this.currentUser.program_id || 0);
            } else if (userRole === 'facility_admin') {
                // Facility admins see all allocations for their facility
                params.append('show_available', 'true');
                params.append('facility_admin', 'true');
            } else if (userRole === 'system_admin') {
                // System admins see everything
                params.append('show_available', 'true');
                params.append('show_all', 'true');
            }

            const response = await fetch(`/itm/api/calendar-events?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const events = Array.isArray(data) ? data : (data.events || []);
                
                // Ensure we have a valid array and valid event objects
                if (!Array.isArray(events)) {
                    console.log('Calendar events: Invalid data structure, returning empty array');
                    return [];
                }
                
                return events.filter(event => event && event.id).map(event => {
                    // Determine color based on allocation status and program assignment
                    let backgroundColor, borderColor, title;
                    
                    if (event.program_id === 0 || event.program_id === null) {
                        // Unassigned ice time
                        backgroundColor = '#e5e7eb'; // gray-200
                        borderColor = '#9ca3af'; // gray-400
                        title = 'Available Ice Time';
                    } else {
                        // Assigned to a program
                        title = event.program_name || 'Ice Time';
                        
                        switch(event.status) {
                            case 'confirmed':
                                backgroundColor = '#10b981'; // green-500
                                borderColor = '#059669'; // green-600
                                break;
                            case 'pending':
                                backgroundColor = '#f59e0b'; // yellow-500
                                borderColor = '#d97706'; // yellow-600
                                break;
                            case 'declined':
                                backgroundColor = '#ef4444'; // red-500
                                borderColor = '#dc2626'; // red-600
                                break;
                            default:
                                backgroundColor = '#6b7280'; // gray-500
                                borderColor = '#4b5563'; // gray-600
                        }
                    }
                    
                    return {
                        id: event.id,
                        title: title,
                        start: event.start || event.date + 'T' + event.start_time,
                        end: event.end || event.date + 'T' + event.end_time,
                        backgroundColor: backgroundColor,
                        borderColor: borderColor,
                        extendedProps: {
                            allocation_id: event.id,
                            facility_name: event.facility_name || '',
                            program_name: event.program_name || '',
                            program_id: event.program_id || 0,
                            ice_surface_name: event.ice_surface_name || '',
                            status: event.status || 'available',
                            date: event.date,
                            start_time: event.start_time,
                            end_time: event.end_time
                        }
                    };
                });
            } else if (response.status === 404 || response.status === 403) {
                // API doesn't exist or no permission - return empty events
                console.log('Calendar events API not available, showing empty calendar');
                return [];
            }
            return [];
        } catch (error) {
            console.error('Error loading calendar events:', error);
            return [];
        }
    }

    async loadCalendarFilters() {
        await Promise.all([
            this.loadFacilityFilter(),
            this.loadProgramFilter()
        ]);
        
        document.getElementById('facility-filter').addEventListener('change', () => {
            this.mainCalendar.refetchEvents();
        });
        
        document.getElementById('program-filter').addEventListener('change', () => {
            this.mainCalendar.refetchEvents();
        });
    }

    async loadFacilityFilter() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/itm/api/facilities', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const facilities = Array.isArray(data) ? data : (data.data || []);
                const select = document.getElementById('facility-filter');
                
                facilities.forEach(facility => {
                    const option = document.createElement('option');
                    option.value = facility.id;
                    option.textContent = facility.name;
                    select.appendChild(option);
                });
            } else if (response.status === 404 || response.status === 403) {
                // API doesn't exist or no permission - silently continue
                console.log('Facilities API not available, continuing without filter options');
            }
        } catch (error) {
            console.error('Error loading facilities for filter:', error);
        }
    }

    async loadProgramFilter() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/itm/api/programs', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const programs = Array.isArray(data) ? data : (data.data || []);
                const select = document.getElementById('program-filter');
                
                programs.forEach(program => {
                    const option = document.createElement('option');
                    option.value = program.id;
                    option.textContent = program.name;
                    select.appendChild(option);
                });
            } else if (response.status === 404 || response.status === 403) {
                // API doesn't exist or no permission - silently continue
                console.log('Programs API not available, continuing without filter options');
            }
        } catch (error) {
            console.error('Error loading programs for filter:', error);
        }
    }

    async loadAssignedSlots() {
        try {
            const token = localStorage.getItem('authToken');
            const userRole = this.currentUser.role;
            
            let apiEndpoint = '/itm/api/my-allocations';
            
            // Use different endpoints based on user role
            if (userRole === 'facility_admin') {
                apiEndpoint = '/itm/api/allocations';
            } else if (userRole === 'system_admin') {
                apiEndpoint = '/itm/api/allocations';
            }
            
            const response = await fetch(apiEndpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const allocations = Array.isArray(data) ? data : (data.data || []);
                this.renderAssignedSlots(allocations);
            } else if (response.status === 404 || response.status === 403) {
                // API endpoint doesn't exist yet or no permission
                this.renderAssignedSlots([]);
            }
        } catch (error) {
            console.error('Error loading assigned slots:', error);
            // Show placeholder content instead of error for missing APIs
            this.renderAssignedSlots([]);
        }
    }

    renderAssignedSlots(slots) {
        const container = document.getElementById('assigned-slots');
        const userRole = this.currentUser.role;
        
        if (!slots || slots.length === 0) {
            let emptyMessage = 'No assigned ice time slots';
            let helperText = 'Your confirmed and pending ice time assignments will appear here.';
            
            if (userRole === 'facility_admin') {
                emptyMessage = 'No ice time allocations found';
                helperText = 'Ice time allocations for your facility will appear here once the allocation system is configured.';
            } else if (userRole === 'system_admin') {
                emptyMessage = 'No allocations in system';
                helperText = 'All system-wide ice time allocations will appear here once programs are assigned ice time.';
            }
            
            container.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <div class="mb-2">${emptyMessage}</div>
                    <div class="text-sm text-gray-400">${helperText}</div>
                </div>
            `;
            return;
        }

        container.innerHTML = slots.map(slot => `
            <div class="bg-gray-50 rounded-lg p-4 mb-3 border border-gray-200 hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start mb-2">
                    <h4 class="font-semibold text-gray-800">${slot.facility_name}</h4>
                    <span class="text-xs px-2 py-1 rounded-full ${this.getStatusColor(slot.status)}">
                        ${slot.status}
                    </span>
                </div>
                <div class="text-sm text-gray-600 space-y-1">
                    <div><strong>Surface:</strong> ${slot.ice_surface_name}</div>
                    <div><strong>Date:</strong> ${new Date(slot.date).toLocaleDateString()}</div>
                    <div><strong>Time:</strong> ${slot.start_time} - ${slot.end_time}</div>
                    ${slot.program_name ? `<div><strong>Program:</strong> ${slot.program_name}</div>` : ''}
                </div>
                ${slot.status === 'pending' ? `
                    <div class="mt-3 flex gap-2">
                        <button class="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 rounded" 
                                onclick="app.confirmSlot(${slot.id})">Confirm</button>
                        <button class="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded" 
                                onclick="app.declineSlot(${slot.id})">Decline</button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    getStatusColor(status) {
        switch(status) {
            case 'confirmed': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'declined': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    showCalendarEventDetails(event) {
        const props = event.extendedProps;
        const isAvailable = props.program_id === 0 || props.program_id === null;
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 class="text-lg font-semibold mb-4">${event.title}</h3>
                <div class="space-y-2 text-sm">
                    <div><strong>Facility:</strong> ${props.facility_name || 'N/A'}</div>
                    <div><strong>Ice Surface:</strong> ${props.ice_surface_name || 'N/A'}</div>
                    <div><strong>Date:</strong> ${props.date || event.start.toLocaleDateString()}</div>
                    <div><strong>Time:</strong> ${props.start_time || event.start.toLocaleTimeString()} - ${props.end_time || event.end.toLocaleTimeString()}</div>
                    ${isAvailable ? 
                        `<div><strong>Status:</strong> <span class="text-gray-600">Available</span></div>` :
                        `<div><strong>Program:</strong> ${props.program_name || 'N/A'}</div>
                         <div><strong>Status:</strong> <span class="capitalize ${this.getStatusTextColor(props.status)}">${props.status || 'N/A'}</span></div>`
                    }
                </div>
                ${this.renderEventActions(props)}
                <div class="mt-6 flex justify-end">
                    <button class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded" onclick="this.closest('.fixed').remove()">
                        Close
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    getStatusTextColor(status) {
        switch(status) {
            case 'confirmed': return 'text-green-600';
            case 'pending': return 'text-yellow-600';
            case 'declined': return 'text-red-600';
            default: return 'text-gray-600';
        }
    }

    renderEventActions(props) {
        const userRole = this.currentUser.role;
        const isAvailable = props.program_id === 0 || props.program_id === null;
        const isUserProgram = props.program_id === this.currentUser.program_id;
        
        if (isAvailable && (userRole === 'facility_admin' || userRole === 'system_admin')) {
            return `
                <div class="mt-4 p-3 bg-gray-50 rounded">
                    <p class="text-sm text-gray-600 mb-2">This ice time is available for allocation.</p>
                    <button class="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded" 
                            onclick="app.allocateIceTime(${props.allocation_id})">
                        Allocate to Program
                    </button>
                </div>
            `;
        } else if (!isAvailable && isUserProgram && props.status === 'pending') {
            return `
                <div class="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                    <p class="text-sm text-gray-600 mb-2">This ice time has been allocated to your program. Please confirm or decline.</p>
                    <div class="flex gap-2">
                        <button class="bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1 rounded" 
                                onclick="app.confirmAllocation(${props.allocation_id}); this.closest('.fixed').remove();">
                            Confirm
                        </button>
                        <button class="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded" 
                                onclick="app.declineAllocation(${props.allocation_id}); this.closest('.fixed').remove();">
                            Decline
                        </button>
                    </div>
                </div>
            `;
        }
        return '';
    }

    async confirmSlot(slotId) {
        if (!confirm('Are you sure you want to confirm this ice time slot?')) return;
        
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/itm/api/confirm-allocation/${slotId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.showToast('Ice time slot confirmed successfully', 'success');
                this.loadAssignedSlots();
                this.mainCalendar.refetchEvents();
            } else {
                const data = await response.json();
                this.showToast(data.error || 'Failed to confirm slot', 'error');
            }
        } catch (error) {
            console.error('Error confirming slot:', error);
            this.showToast('Network error. Please try again.', 'error');
        }
    }

    async declineSlot(slotId) {
        if (!confirm('Are you sure you want to decline this ice time slot?')) return;
        
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/itm/api/decline-allocation/${slotId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.showToast('Ice time slot declined', 'info');
                this.loadAssignedSlots();
                this.mainCalendar.refetchEvents();
            } else {
                const data = await response.json();
                this.showToast(data.error || 'Failed to decline slot', 'error');
            }
        } catch (error) {
            console.error('Error declining slot:', error);
            this.showToast('Network error. Please try again.', 'error');
        }
    }

    async loadContent(action) {
        console.log('Loading content for:', action);
        
        const dashboardContent = document.getElementById('dashboard-content');
        
        switch (action) {
            case 'dashboard':
                this.loadDashboardContent();
                break;
                
            case 'users':
                if (this.currentUser.role === 'system_admin') {
                    dashboardContent.innerHTML = '<div class="text-center py-8">Loading user management...</div>';
                    
                    if (!this.userManagement) {
                        this.userManagement = new UserManagement(this);
                        await this.userManagement.init();
                    }
                    
                    await this.userManagement.render();
                } else {
                    dashboardContent.innerHTML = '<div class="text-center py-8 text-red-500">Access denied. Insufficient permissions.</div>';
                }
                break;
                
            case 'facilities':
                if (this.currentUser.permissions.includes('facility_management')) {
                    dashboardContent.innerHTML = '<div class="text-center py-8">Loading facility management...</div>';
                    
                    if (!this.facilityManagement) {
                        const { FacilityManagement } = await import('./facility-management.js');
                        this.facilityManagement = new FacilityManagement(this);
                        await this.facilityManagement.init();
                    }
                    
                    await this.facilityManagement.render();
                } else {
                    dashboardContent.innerHTML = '<div class="text-center py-8 text-red-500">Access denied. Insufficient permissions.</div>';
                }
                break;
                
            case 'ice-surfaces':
                if (this.currentUser.permissions.includes('ice_surface_management')) {
                    dashboardContent.innerHTML = '<div class="text-center py-8">Loading ice surface management...</div>';
                    
                    if (!this.iceSurfaceManagement) {
                        const { IceSurfaceManagement } = await import('./ice-surface-management.js');
                        this.iceSurfaceManagement = new IceSurfaceManagement(this);
                        await this.iceSurfaceManagement.init();
                    }
                    
                    await this.iceSurfaceManagement.render();
                } else {
                    dashboardContent.innerHTML = '<div class="text-center py-8 text-red-500">Access denied. Insufficient permissions.</div>';
                }
                break;
                
            case 'programs':
                if (this.currentUser.permissions.includes('program_management')) {
                    dashboardContent.innerHTML = '<div class="text-center py-8">Loading program management...</div>';
                    
                    if (!this.programManagement) {
                        const { ProgramManagement } = await import('./program-management.js');
                        this.programManagement = new ProgramManagement(this);
                        await this.programManagement.init();
                    }
                    
                    await this.programManagement.render();
                } else {
                    dashboardContent.innerHTML = '<div class="text-center py-8 text-red-500">Access denied. Insufficient permissions.</div>';
                }
                break;
                
            case 'ice-time-slots':
                if (this.currentUser.permissions.includes('ice_time_management')) {
                    dashboardContent.innerHTML = '<div class="text-center py-8">Loading ice time slots management...</div>';
                    
                    if (!this.iceTimeSlotsManagement) {
                        const { IceTimeSlotsManagement } = await import('./ice-time-slots-management.js');
                        this.iceTimeSlotsManagement = new IceTimeSlotsManagement(this);
                        await this.iceTimeSlotsManagement.init();
                    }
                    
                    await this.iceTimeSlotsManagement.render();
                } else {
                    dashboardContent.innerHTML = '<div class="text-center py-8 text-red-500">Access denied. Insufficient permissions.</div>';
                }
                break;
                
            case 'reports':
                dashboardContent.innerHTML = '<div class="text-center py-8">Reports coming soon...</div>';
                break;
                
            case 'my-facility':
                dashboardContent.innerHTML = '<div class="text-center py-8">My facility management coming soon...</div>';
                break;
                
            case 'allocations':
                if (this.currentUser.permissions.includes('allocation_management')) {
                    dashboardContent.innerHTML = `
                        <div class="space-y-6">
                            <div class="flex justify-between items-center">
                                <h1 class="text-2xl font-bold text-gray-900">Allocation Management</h1>
                                <button id="refreshBtn" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                                    Refresh
                                </button>
                            </div>

                            <!-- Filters -->
                            <div class="bg-white p-4 rounded-lg shadow">
                                <h3 class="text-lg font-medium mb-4">Filters</h3>
                                <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700">Facility</label>
                                        <select id="facilityFilter" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                                            <option value="">All Facilities</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700">Ice Surface</label>
                                        <select id="iceSurfaceFilter" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                                            <option value="">All Surfaces</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700">Program</label>
                                        <select id="programFilter" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                                            <option value="">All Programs</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700">Status</label>
                                        <select id="statusFilter" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                                            <option value="">All Statuses</option>
                                            <option value="available">Available</option>
                                            <option value="proposed">Proposed</option>
                                            <option value="confirmed">Confirmed</option>
                                            <option value="declined">Declined</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700">From Date</label>
                                        <input type="date" id="dateFromFilter" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700">To Date</label>
                                        <input type="date" id="dateToFilter" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                                    </div>
                                </div>
                            </div>

                            <!-- Bulk Actions -->
                            <div class="bg-white p-4 rounded-lg shadow">
                                <h3 class="text-lg font-medium mb-4">Bulk Actions</h3>
                                <div class="flex space-x-4">
                                    <button id="bulkAssignBtn" disabled class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                        Assign Selected
                                    </button>
                                    <button id="bulkUnassignBtn" disabled class="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                        Unassign Selected
                                    </button>
                                </div>
                            </div>

                            <!-- Allocations Table -->
                            <div class="bg-white rounded-lg shadow overflow-hidden">
                                <table id="allocationsTable" class="min-w-full divide-y divide-gray-200">
                                    <thead class="bg-gray-50">
                                        <tr>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                <input type="checkbox" id="selectAllAllocations">
                                            </th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Facility</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody class="bg-white divide-y divide-gray-200">
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Bulk Assign Modal -->
                        <div id="bulkAssignModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden flex items-center justify-center z-50">
                            <div class="bg-white rounded-lg p-6 w-full max-w-md">
                                <h3 class="text-lg font-medium mb-4">Assign Selected Allocations</h3>
                                <div class="space-y-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700">Program</label>
                                        <select id="bulkAssignProgram" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                                            <option value="">Select Program</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700">Cost (optional)</label>
                                        <input type="number" step="0.01" id="bulkAssignCost" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700">Notes (optional)</label>
                                        <textarea id="bulkAssignNotes" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"></textarea>
                                    </div>
                                    <p class="text-sm text-gray-600">
                                        You are about to assign <span id="selectedCount">0</span> allocations to the selected program.
                                    </p>
                                </div>
                                <div class="flex justify-end space-x-3 mt-6">
                                    <button id="cancelBulkAssign" class="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400">
                                        Cancel
                                    </button>
                                    <button id="confirmBulkAssign" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                                        Assign
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                    
                    // Load allocation management script and initialize
                    if (!window.allocationManager) {
                        const script = document.createElement('script');
                        script.src = '/itm/public/js/allocation-management.js';
                        script.onload = () => {
                            // Initialize AllocationManager after script loads
                            if (window.initializeAllocationManager) {
                                window.initializeAllocationManager();
                            }
                        };
                        document.head.appendChild(script);
                    } else {
                        // Reinitialize if already loaded
                        window.allocationManager.loadAllocations();
                    }
                } else {
                    dashboardContent.innerHTML = '<div class="text-center py-8 text-red-500">Access denied. Insufficient permissions for allocation management.</div>';
                }
                break;
                
            case 'my-allocations':
                dashboardContent.innerHTML = '<div class="text-center py-8">My allocations coming soon...</div>';
                break;
                
            case 'calendar':
                this.loadCalendarPage();
                break;
                
            case 'confirmations':
                dashboardContent.innerHTML = '<div class="text-center py-8">Confirmations coming soon...</div>';
                break;
                
            default:
                dashboardContent.innerHTML = '<div class="text-center py-8">Page not found.</div>';
        }
    }

    setupSSE() {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        
        this.eventSource = new EventSource(`/itm/api/events?token=${token}`);
        
        this.eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleSSEMessage(data);
            this.sseReconnectAttempts = 0; // Reset on successful message
        };

        this.eventSource.onerror = (error) => {
            console.error('SSE error:', error);
            this.handleSSEError();
        };
        
        this.eventSource.onopen = () => {
            console.log('SSE connection established');
            this.sseReconnectAttempts = 0;
        };
    }
    
    handleSSEError() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
        
        // Exponential backoff reconnection
        if (!this.sseReconnectAttempts) this.sseReconnectAttempts = 0;
        this.sseReconnectAttempts++;
        
        if (this.sseReconnectAttempts <= 5) {
            const delay = Math.min(1000 * Math.pow(2, this.sseReconnectAttempts), 30000);
            console.log(`SSE reconnecting in ${delay}ms (attempt ${this.sseReconnectAttempts})`);
            
            setTimeout(() => {
                if (localStorage.getItem('authToken')) {
                    this.setupSSE();
                }
            }, delay);
        } else {
            console.error('SSE max reconnection attempts reached');
        }
    }

    closeSSE() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
        this.sseReconnectAttempts = 0;
    }

    handleSSEMessage(data) {
        console.log('SSE message received:', data);
        
        if (data.type === 'notification') {
            this.showToast(data.message, data.level || 'info');
        } else if (data.type === 'data_update') {
            this.refreshContent(data.entity);
        }
    }

    refreshContent(entity) {
        console.log('Refreshing content for:', entity);
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ITMApp();
});