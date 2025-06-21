class UserManagement {
    constructor(app) {
        this.app = app;
        this.crudFactory = null;
    }

    async init() {
        await this.loadRoles();
        this.setupCRUDFactory();
    }

    async loadRoles() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/itm/api/roles', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.roles = data.roles || [];
            } else {
                console.error('Failed to load roles');
                this.roles = [];
            }
        } catch (error) {
            console.error('Error loading roles:', error);
            this.roles = [];
        }
    }

    setupCRUDFactory() {
        const config = {
            entityName: 'users',
            singularName: 'User',
            title: 'User Management',
            apiEndpoint: '/itm/api/users',
            containerId: 'dashboard-content',
            dataKey: 'users',
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
                    label: 'Full Name',
                    type: 'text',
                    required: true,
                    listable: true,
                    editable: true
                },
                {
                    name: 'email',
                    label: 'Email',
                    type: 'email',
                    required: true,
                    listable: true,
                    editable: true
                },
                {
                    name: 'role_display_name',
                    label: 'Role',
                    type: 'text',
                    editable: false,
                    listable: true
                },
                {
                    name: 'role_id',
                    label: 'Role',
                    type: 'select',
                    required: true,
                    listable: false,
                    editable: true,
                    options: this.roles.map(role => ({
                        value: role.id,
                        label: role.display_name
                    }))
                },
                {
                    name: 'password',
                    label: 'Password',
                    type: 'password',
                    required: true,
                    listable: false,
                    editable: true // Make editable so it appears in forms
                },
                {
                    name: 'email_verified',
                    label: 'Email Verified',
                    type: 'select',
                    editable: true,
                    listable: true,
                    options: [
                        { value: '1', label: 'Verified' },
                        { value: '0', label: 'Not Verified' }
                    ],
                    formatter: (value) => value ? 
                        '<span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Verified</span>' : 
                        '<span class="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Not Verified</span>'
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
        // Add additional user management controls
        const additionalHTML = `
            <div class="user-management-extras mb-4">
                <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm text-blue-700">
                                <strong>Note:</strong> New users will be created with a default password. They should change it upon first login. 
                                Use the "Change Password" feature to reset passwords for existing users.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        await this.crudFactory.render();
        
        // Add the additional HTML above the CRUD interface
        const container = document.getElementById('dashboard-content');
        const crudContainer = container.querySelector('.crud-container');
        if (crudContainer) {
            crudContainer.insertAdjacentHTML('afterbegin', additionalHTML);
        }

        this.setupAdditionalFeatures();
    }

    setupAdditionalFeatures() {
        // Override the form to handle new user password requirements
        const originalOpenModal = this.crudFactory.openModal.bind(this.crudFactory);
        this.crudFactory.openModal = (item = null) => {
            originalOpenModal(item);
            
            // Show/hide password field based on whether editing or creating
            const passwordField = document.getElementById('users-password')?.closest('.mb-4');
            const passwordInput = document.getElementById('users-password');
            
            if (passwordField && passwordInput) {
                if (item) {
                    // Editing - hide password field, remove required attribute, and add change password button
                    passwordField.style.display = 'none';
                    passwordInput.removeAttribute('required');
                    this.addChangePasswordButton(item);
                } else {
                    // Creating - show password field and ensure it's required
                    passwordField.style.display = 'block';
                    passwordInput.setAttribute('required', 'required');
                    this.removeChangePasswordButton();
                }
            }
        };

    }

    addChangePasswordButton(user) {
        const existingBtn = document.getElementById('change-password-btn');
        if (existingBtn) {
            existingBtn.remove();
        }

        const form = document.getElementById('users-form');
        const submitContainer = form.querySelector('.flex.justify-end');
        
        const changePasswordBtn = document.createElement('button');
        changePasswordBtn.type = 'button';
        changePasswordBtn.id = 'change-password-btn';
        changePasswordBtn.className = 'bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded mr-2';
        changePasswordBtn.textContent = 'Change Password';
        
        changePasswordBtn.addEventListener('click', () => {
            this.showChangePasswordModal(user);
        });

        submitContainer.insertBefore(changePasswordBtn, submitContainer.firstChild);
    }

    removeChangePasswordButton() {
        const existingBtn = document.getElementById('change-password-btn');
        if (existingBtn) {
            existingBtn.remove();
        }
    }

    showChangePasswordModal(user) {
        const modalHTML = `
            <div id="change-password-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold">Change Password for ${user.name}</h3>
                        <button id="change-password-modal-close" class="text-gray-400 hover:text-gray-600">✕</button>
                    </div>
                    <form id="change-password-form">
                        <div class="mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2" for="new-password">
                                New Password <span class="text-red-500">*</span>
                            </label>
                            <input type="password" id="new-password" name="new_password" 
                                   class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500" 
                                   required minlength="8">
                        </div>
                        <div class="mb-4">
                            <label class="block text-gray-700 text-sm font-bold mb-2" for="confirm-password">
                                Confirm Password <span class="text-red-500">*</span>
                            </label>
                            <input type="password" id="confirm-password" name="confirm_password" 
                                   class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500" 
                                   required minlength="8">
                        </div>
                        <div class="flex justify-end space-x-2">
                            <button type="button" id="change-password-cancel" 
                                    class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                                Cancel
                            </button>
                            <button type="submit" 
                                    class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                                Change Password
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Setup event listeners
        document.getElementById('change-password-modal-close').addEventListener('click', this.closeChangePasswordModal);
        document.getElementById('change-password-cancel').addEventListener('click', this.closeChangePasswordModal);
        document.getElementById('change-password-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleChangePassword(user.id);
        });

        // Close on backdrop click
        document.getElementById('change-password-modal').addEventListener('click', (e) => {
            if (e.target.id === 'change-password-modal') {
                this.closeChangePasswordModal();
            }
        });
    }

    closeChangePasswordModal() {
        const modal = document.getElementById('change-password-modal');
        if (modal) {
            modal.remove();
        }
    }

    async handleChangePassword(userId) {
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (newPassword !== confirmPassword) {
            this.app.showToast('Passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 8) {
            this.app.showToast('Password must be at least 8 characters long', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/itm/api/users-password/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    new_password: newPassword
                })
            });

            const result = await response.json();

            if (response.ok) {
                this.app.showToast(result.message || 'Password changed successfully', 'success');
                this.closeChangePasswordModal();
            } else {
                this.app.showToast(result.error || 'Failed to change password', 'error');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            this.app.showToast('Network error while changing password', 'error');
        }
    }
}