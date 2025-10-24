// js/app.js
// Main Application Utilities & Helpers

import { auth } from './auth.js';

// ============================================
// TOAST NOTIFICATIONS
// ============================================

/**
 * Show toast notification
 */
export function showToast(message, type = 'success') {
    // Remove existing toasts
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
    `;

    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// MODAL MANAGEMENT
// ============================================

/**
 * Open modal
 */
export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Close modal
 */
export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
        
        // Reset form if exists
        const form = modal.querySelector('form');
        if (form) form.reset();
    }
}

/**
 * Close modal when clicking backdrop
 */
export function initModalBackdropClose() {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal') && e.target.classList.contains('show')) {
            closeModal(e.target.id);
        }
    });
}

// ============================================
// FORM HELPERS
// ============================================

/**
 * Get form data as object
 */
export function getFormData(formElement) {
    const formData = new FormData(formElement);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        // Handle checkboxes
        if (formElement.elements[key]?.type === 'checkbox') {
            data[key] = formElement.elements[key].checked;
        } else {
            data[key] = value;
        }
    }
    
    return data;
}

/**
 * Validate email
 */
export function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Disable form during submission
 */
export function disableForm(formElement) {
    const inputs = formElement.querySelectorAll('input, button, select, textarea');
    inputs.forEach(input => input.disabled = true);
}

/**
 * Enable form after submission
 */
export function enableForm(formElement) {
    const inputs = formElement.querySelectorAll('input, button, select, textarea');
    inputs.forEach(input => input.disabled = false);
}

// ============================================
// DATE & TIME UTILITIES
// ============================================

/**
 * Format date to relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(date) {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
    return past.toLocaleDateString();
}

/**
 * Format date to readable string
 */
export function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

/**
 * Get days since date
 */
export function getDaysSince(date) {
    const now = new Date();
    const past = new Date(date);
    return Math.floor((now - past) / (1000 * 60 * 60 * 24));
}

/**
 * Get next due date based on cadence
 */
export function getNextDueDate(lastCompleted, cadenceDays) {
    if (!lastCompleted) return 'Not yet completed';
    
    const next = new Date(lastCompleted);
    next.setDate(next.getDate() + cadenceDays);
    
    const now = new Date();
    const daysUntil = Math.floor((next - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) return `${Math.abs(daysUntil)} days overdue`;
    if (daysUntil === 0) return 'Due today';
    if (daysUntil === 1) return 'Due tomorrow';
    return `Due in ${daysUntil} days`;
}

// ============================================
// STATUS HELPERS
// ============================================

/**
 * Get task status (overdue, due-soon, on-track)
 */
export function getTaskStatus(task) {
    if (!task.last_completed) return 'overdue';
    
    const daysSince = getDaysSince(task.last_completed);
    
    if (daysSince > task.cadence) return 'overdue';
    if (daysSince > task.cadence - 3) return 'due-soon';
    return 'on-track';
}

/**
 * Get status color class
 */
export function getStatusColor(status) {
    switch (status) {
        case 'overdue': return 'status-danger';
        case 'due-soon': return 'status-warning';
        case 'on-track': return 'status-success';
        default: return 'status-default';
    }
}

/**
 * Get status icon
 */
export function getStatusIcon(status) {
    switch (status) {
        case 'overdue': return '🔴';
        case 'due-soon': return '🟡';
        case 'on-track': return '🟢';
        default: return '⚪';
    }
}

/**
 * Get status text
 */
export function getStatusText(status) {
    switch (status) {
        case 'overdue': return 'Overdue';
        case 'due-soon': return 'Due Soon';
        case 'on-track': return 'On Track';
        default: return 'Unknown';
    }
}

// ============================================
// NUMBER FORMATTING
// ============================================

/**
 * Format currency
 */
export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Format number with commas
 */
export function formatNumber(num) {
    return new Intl.NumberFormat('en-US').format(num);
}

// ============================================
// LOADING STATES
// ============================================

/**
 * Show loading spinner
 */
export function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading...</p>
            </div>
        `;
    }
}

/**
 * Show empty state
 */
export function showEmptyState(containerId, icon, title, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">${icon}</div>
                <h3 class="empty-state-title">${title}</h3>
                <p class="empty-state-text">${message}</p>
            </div>
        `;
    }
}

// ============================================
// MOBILE NAVIGATION
// ============================================

/**
 * Initialize mobile navigation toggle
 */
export function initMobileNav() {
    const toggle = document.getElementById('mobileToggle');
    const menu = document.getElementById('navMenu');
    
    if (toggle && menu) {
        toggle.addEventListener('click', () => {
            menu.classList.toggle('show');
        });
    }
}

// ============================================
// LOGOUT FUNCTIONALITY
// ============================================

/**
 * Initialize logout button
 */
export function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await auth.signOut();
        });
    }
}

// ============================================
// GLOBAL INITIALIZATION
// ============================================

/**
 * Initialize common app features
 */
export function initApp() {
    initMobileNav();
    initModalBackdropClose();
    initLogout();
}

// Auto-initialize on DOM load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}