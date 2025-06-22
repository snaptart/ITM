// Additional methods for IceTimeSlotsManagement multi-day support
// This file contains the custom renderer and formatter methods that should be added to the main class

// Custom renderer for days of week field
function renderDaysOfWeekField(fieldName, currentValue, isEdit = false) {
    const fieldId = `field_${fieldName}_${Date.now()}`;
    
    // Parse current value
    let selectedDays = [];
    if (typeof currentValue === 'string' && currentValue.startsWith('[')) {
        try {
            selectedDays = JSON.parse(currentValue);
        } catch (e) {
            selectedDays = [];
        }
    } else if (Array.isArray(currentValue)) {
        selectedDays = currentValue;
    }
    
    const days = [
        { value: 0, label: 'Sunday' },
        { value: 1, label: 'Monday' },
        { value: 2, label: 'Tuesday' },
        { value: 3, label: 'Wednesday' },
        { value: 4, label: 'Thursday' },
        { value: 5, label: 'Friday' },
        { value: 6, label: 'Saturday' }
    ];

    if (!isEdit) {
        // Display mode - show selected days as text
        return this.formatDaysOfWeek(selectedDays);
    }

    // Edit mode - show checkboxes
    let html = `
        <div class="days-of-week-selector" data-field="${fieldName}">
            <div class="flex flex-wrap gap-2 mb-3">
                <button type="button" class="select-preset text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200" data-preset="weekdays">
                    Weekdays
                </button>
                <button type="button" class="select-preset text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200" data-preset="weekends">
                    Weekends
                </button>
                <button type="button" class="select-preset text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200" data-preset="all">
                    All Days
                </button>
                <button type="button" class="select-preset text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200" data-preset="clear">
                    Clear All
                </button>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
    `;
    
    days.forEach(day => {
        const isChecked = selectedDays.includes(day.value);
        html += `
            <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" 
                       name="${fieldName}[]" 
                       value="${day.value}" 
                       ${isChecked ? 'checked' : ''}
                       class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                <span class="text-sm">${day.label}</span>
            </label>
        `;
    });
    
    html += `
            </div>
            <input type="hidden" name="${fieldName}" id="${fieldId}" value="${JSON.stringify(selectedDays)}">
        </div>
    `;
    
    // Add event listeners after rendering
    setTimeout(() => {
        this.setupDaysOfWeekListeners(fieldName, fieldId);
    }, 0);
    
    return html;
}

function setupDaysOfWeekListeners(fieldName, fieldId) {
    const container = document.querySelector(`[data-field="${fieldName}"]`);
    if (!container) return;
    
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    const hiddenInput = document.getElementById(fieldId);
    
    // Update hidden field when checkboxes change
    const updateHiddenField = () => {
        const selected = Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => parseInt(cb.value))
            .sort();
        hiddenInput.value = JSON.stringify(selected);
    };
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateHiddenField);
    });
    
    // Preset button handlers
    const presetButtons = container.querySelectorAll('.select-preset');
    presetButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const preset = button.getAttribute('data-preset');
            
            // Uncheck all first
            checkboxes.forEach(cb => cb.checked = false);
            
            // Apply preset
            switch (preset) {
                case 'weekdays':
                    checkboxes.forEach(cb => {
                        if ([1, 2, 3, 4, 5].includes(parseInt(cb.value))) {
                            cb.checked = true;
                        }
                    });
                    break;
                case 'weekends':
                    checkboxes.forEach(cb => {
                        if ([0, 6].includes(parseInt(cb.value))) {
                            cb.checked = true;
                        }
                    });
                    break;
                case 'all':
                    checkboxes.forEach(cb => cb.checked = true);
                    break;
                case 'clear':
                    // Already unchecked above
                    break;
            }
            
            updateHiddenField();
        });
    });
}

function formatDaysOfWeek(days) {
    if (!Array.isArray(days) || days.length === 0) {
        return '<span class="text-gray-500">None selected</span>';
    }
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Check for common patterns
    if (days.length === 7) {
        return '<span class="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">Daily</span>';
    }
    
    const weekdays = [1, 2, 3, 4, 5];
    const weekends = [0, 6];
    
    if (JSON.stringify(days.sort()) === JSON.stringify(weekdays)) {
        return '<span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Weekdays</span>';
    }
    
    if (JSON.stringify(days.sort()) === JSON.stringify(weekends)) {
        return '<span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Weekends</span>';
    }
    
    // Show individual days
    const selectedDays = days.map(day => dayNames[day]).join(', ');
    return `<span class="text-sm">${selectedDays}</span>`;
}

// Add these methods to the IceTimeSlotsManagement class prototype
if (typeof IceTimeSlotsManagement !== 'undefined') {
    IceTimeSlotsManagement.prototype.renderDaysOfWeekField = renderDaysOfWeekField;
    IceTimeSlotsManagement.prototype.setupDaysOfWeekListeners = setupDaysOfWeekListeners;
    IceTimeSlotsManagement.prototype.formatDaysOfWeek = formatDaysOfWeek;
}