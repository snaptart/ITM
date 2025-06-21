class ITMApp {
    constructor() {
        this.currentUser = null;
        this.eventSource = null;
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
                { title: 'Reports', action: 'reports' }
            ];
        } else if (userRole === 'facility_admin') {
            menuItems = [
                { title: 'Dashboard', action: 'dashboard' },
                { title: 'My Facility', action: 'my-facility' },
                { title: 'Ice Surfaces', action: 'ice-surfaces' },
                { title: 'Ice Time Slots', action: 'ice-time-slots' },
                { title: 'Allocations', action: 'allocations' },
                { title: 'Programs', action: 'programs' }
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
                events: '/itm/api/calendar-events',
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

    loadContent(action) {
        console.log('Loading content for:', action);
    }

    setupSSE() {
        const token = localStorage.getItem('authToken');
        this.eventSource = new EventSource(`/itm/api/events?token=${token}`);
        
        this.eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleSSEMessage(data);
        };

        this.eventSource.onerror = (error) => {
            console.error('SSE error:', error);
        };
    }

    closeSSE() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
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
    new ITMApp();
});