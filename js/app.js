// js/app.js
// Main Application Logic

import * as API from './api.js';

// Global state
let allTasks = [];
export const currentFilters = {
    status: 'all',
    floor: 'all',
    effort: 'all'
};

// ============================================
// INITIALIZATION
// ============================================

// Theme toggle
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
        loadTheme();
    }
});

function loadTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    document.getElementById('themeToggle').textContent = next === 'dark' ? '☀️' : '🌙';
}

// ============================================
// HOME PAGE FUNCTIONS
// ============================================

export async function updateStats() {
    const tasks = await API.getAllTasks();
    
    const overdue = tasks.filter(t => t.status === 'OVERDUE').length;
    const dueSoon = tasks.filter(t => t.status === 'Due Soon').length;
    const onTrack = tasks.filter(t => t.status === 'On Track').length;
    
    const odEl = document.getElementById('overdueCount');
    const dsEl = document.getElementById('dueSoonCount');
    const otEl = document.getElementById('onTrackCount');
    
    if (odEl) odEl.textContent = overdue;
    if (dsEl) dsEl.textContent = dueSoon;
    if (otEl) otEl.textContent = onTrack;
}

export async function loadTodayTasks() {
    try {
        const schedule = await API.getWeekSchedule(0);
        const todayDay = schedule.schedule.find(d => d.isToday);
        
        const container = document.getElementById('todayTasks');
        if (!container) return;
        
        if (!todayDay || todayDay.todoTasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">✨</div>
                    <p>No tasks scheduled for today</p>
                    <a href="week.html" class="btn btn-primary btn-sm">Schedule Tasks</a>
                </div>
            `;
            return;
        }
        
        container.innerHTML = todayDay.todoTasks.map(task => `
            <div class="task-item ${task.status.toLowerCase().replace(' ', '-')}">
                <div class="task-header">
                    <div class="task-name">${task.task_name}</div>
                </div>
                <div class="task-meta">
                    ${task.floor ? `<span class="task-badge">🏢 ${task.floor}</span>` : ''}
                    ${task.category ? `<span class="task-badge">📍 ${task.category}</span>` : ''}
                    <span class="task-badge">⏱️ ${task.time_estimate}m</span>
                </div>
                <div class="task-actions">
                    <button class="btn btn-primary btn-sm" onclick="completeTaskFromHome(${task.id}, '${todayDay.date}')">
                        ✓ Complete
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading today tasks:', error);
    }
}

export async function loadRecentActivity() {
    try {
        const activity = await API.getRecentCompletions(5);
        const container = document.getElementById('recentActivity');
        if (!container) return;
        
        if (activity.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <p>No recent completions</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="activity-list">
                ${activity.map(item => `
                    <div class="activity-item">
                        <div class="activity-icon">✓</div>
                        <div class="activity-content">
                            <div class="activity-name">${item.task_name}</div>
                            <div class="activity-meta">
                                ${item.category || 'No category'} • ${formatTimeAgo(item.completed_at)}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        console.error('Error loading recent activity:', error);
    }
}

// ============================================
// TASKS PAGE FUNCTIONS
// ============================================

export async function loadAllTasks() {
    try {
        allTasks = await API.getAllTasks();
        applyFilters();
    } catch (error) {
        console.error('Error loading tasks:', error);
        const container = document.getElementById('tasksList');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⚠️</div>
                    <p>Error loading tasks</p>
                </div>
            `;
        }
    }
}

export function applyFilters() {
    let filtered = [...allTasks];
    
    // Status filter
    if (currentFilters.status !== 'all') {
        if (currentFilters.status === 'overdue') {
            filtered = filtered.filter(t => t.status === 'OVERDUE');
        } else if (currentFilters.status === 'due-soon') {
            filtered = filtered.filter(t => t.status === 'Due Soon');
        } else if (currentFilters.status === 'on-track') {
            filtered = filtered.filter(t => t.status === 'On Track');
        }
    }
    
    // Floor filter
    if (currentFilters.floor !== 'all') {
        filtered = filtered.filter(t => 
            t.floor && t.floor.toLowerCase().includes(currentFilters.floor)
        );
    }
    
    // Effort filter
    if (currentFilters.effort !== 'all') {
        filtered = filtered.filter(t => 
            t.effort && t.effort.toLowerCase() === currentFilters.effort
        );
    }
    
    renderTasks(filtered);
}

function renderTasks(tasks) {
    const container = document.getElementById('tasksList');
    const countEl = document.getElementById('taskCount');
    
    if (!container) return;
    
    if (countEl) countEl.textContent = tasks.length;
    
    if (tasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <p>No tasks found</p>
                <button class="btn btn-secondary btn-sm" onclick="window.location.reload()">
                    Reset Filters
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = tasks.map(task => `
        <div class="task-item ${task.status.toLowerCase().replace(' ', '-')}">
            <div class="task-header">
                <div class="task-name">${task.task_name}</div>
                <button class="btn btn-secondary btn-sm" onclick="editTaskModal(${task.id})">
                    ✏️ Edit
                </button>
            </div>
            <div class="task-meta">
                ${task.floor ? `<span class="task-badge">🏢 ${task.floor}</span>` : ''}
                ${task.category ? `<span class="task-badge">📍 ${task.category}</span>` : ''}
                <span class="task-badge">💪 ${task.effort}</span>
                <span class="task-badge">⏱️ ${task.time_estimate}m</span>
                <span class="task-badge">🔄 Every ${task.cadence} days</span>
            </div>
            <div class="task-info" style="margin-top:0.75rem;font-size:0.875rem;color:var(--text-secondary)">
                <div>Last: ${task.last_completed ? formatDate(new Date(task.last_completed)) : 'Never'}</div>
                <div>Next: ${task.next_due ? formatDate(new Date(task.next_due)) : 'Not set'}</div>
                ${task.completion_count > 0 ? `<div>✓ Completed ${task.completion_count}x</div>` : ''}
            </div>
            <div class="task-actions">
                <button class="btn btn-primary btn-sm" onclick="completeTaskFromList(${task.id})">
                    ✓ Complete
                </button>
            </div>
        </div>
    `).join('');
}

// ============================================
// STATS PAGE FUNCTIONS
// ============================================

export async function loadStats() {
    try {
        const stats = await API.getStats();
        
        document.getElementById('totalValue').textContent = stats.totalValue;
        document.getElementById('hoursCompleted').textContent = stats.totalHours;
        document.getElementById('tasksCompleted').textContent = stats.completedThisWeek;
        document.getElementById('currentStreak').textContent = stats.currentStreak;
        document.getElementById('completedThisWeek').textContent = stats.completedThisWeek;
        document.getElementById('completedThisMonth').textContent = stats.completedThisMonth;
        document.getElementById('avgTimePerTask').textContent = `${stats.avgTimePerTask}m`;
        document.getElementById('longestStreak').textContent = stats.longestStreak;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

export async function loadTopCategories() {
    try {
        const categories = await API.getTopCategories();
        const container = document.getElementById('topCategories');
        if (!container) return;
        
        if (categories.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No data yet</p></div>';
            return;
        }
        
        container.innerHTML = categories.map(cat => `
            <div class="category-item">
                <div class="category-name">${cat.category}</div>
                <div class="category-count">${cat.count} tasks</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

export async function loadRecentCompletions() {
    try {
        const completions = await API.getRecentCompletions(10);
        const container = document.getElementById('recentCompletions');
        if (!container) return;
        
        if (completions.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No completions yet</p></div>';
            return;
        }
        
        container.innerHTML = completions.map(item => `
            <div class="activity-item">
                <div class="activity-icon">✓</div>
                <div class="activity-content">
                    <div class="activity-name">${item.task_name}</div>
                    <div class="activity-meta">
                        ${item.category || 'No category'} • ${item.time_minutes}m • ${formatTimeAgo(item.completed_at)}
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading completions:', error);
    }
}

// ============================================
// MODAL FUNCTIONS
// ============================================

window.showAddTaskModal = function() {
    const modal = document.getElementById('addTaskModal') || document.getElementById('taskModal');
    if (modal) {
        const titleEl = document.getElementById('modalTitle');
        if (titleEl) titleEl.textContent = 'Add New Task';
        
        const form = document.getElementById('addTaskForm') || document.getElementById('taskForm');
        if (form) form.reset();
        
        const taskId = document.getElementById('taskId');
        if (taskId) taskId.value = '';
        
        const deleteBtn = document.getElementById('deleteBtn');
        if (deleteBtn) deleteBtn.style.display = 'none';
        
        modal.classList.add('show');
    }
};

window.closeAddTaskModal = function() {
    const modal = document.getElementById('addTaskModal') || document.getElementById('taskModal');
    if (modal) modal.classList.remove('show');
};

window.closeTaskModal = window.closeAddTaskModal;

window.handleAddTask = async function(event) {
    event.preventDefault();
    
    try {
        const taskData = {
            task_name: document.getElementById('taskName').value,
            floor: document.getElementById('taskFloor').value,
            category: document.getElementById('taskCategory').value,
            cadence: parseInt(document.getElementById('taskCadence').value),
            time_estimate: parseInt(document.getElementById('taskTime').value),
            effort: document.getElementById('taskEffort').value
        };
        
        await API.createTask(taskData);
        
        closeAddTaskModal();
        showToast('Task added successfully!');
        
        // Reload current page data
        if (window.location.pathname.includes('tasks.html')) {
            await loadAllTasks();
        } else if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
            await loadTodayTasks();
            await updateStats();
        }
    } catch (error) {
        console.error('Error adding task:', error);
        showToast('Error adding task', 'error');
    }
};

window.editTaskModal = async function(taskId) {
    try {
        const task = await API.getTaskById(taskId);
        if (!task) return;
        
        const modal = document.getElementById('taskModal');
        const titleEl = document.getElementById('modalTitle');
        
        if (titleEl) titleEl.textContent = 'Edit Task';
        
        document.getElementById('taskId').value = task.id;
        document.getElementById('editTaskName').value = task.task_name;
        document.getElementById('editTaskFloor').value = task.floor || '';
        document.getElementById('editTaskCategory').value = task.category || '';
        document.getElementById('editTaskCadence').value = task.cadence;
        document.getElementById('editTaskTime').value = task.time_estimate;
        document.getElementById('editTaskEffort').value = task.effort;
        
        const deleteBtn = document.getElementById('deleteBtn');
        if (deleteBtn) deleteBtn.style.display = 'block';
        
        modal.classList.add('show');
    } catch (error) {
        console.error('Error loading task:', error);
        showToast('Error loading task', 'error');
    }
};

window.saveTask = async function(event) {
    event.preventDefault();
    
    try {
        const taskId = document.getElementById('taskId').value;
        const taskData = {
            task_name: document.getElementById('editTaskName').value,
            floor: document.getElementById('editTaskFloor').value,
            category: document.getElementById('editTaskCategory').value,
            cadence: parseInt(document.getElementById('editTaskCadence').value),
            time_estimate: parseInt(document.getElementById('editTaskTime').value),
            effort: document.getElementById('editTaskEffort').value
        };
        
        if (taskId) {
            await API.updateTask(parseInt(taskId), taskData);
            showToast('Task updated!');
        } else {
            await API.createTask(taskData);
            showToast('Task added!');
        }
        
        closeTaskModal();
        await loadAllTasks();
    } catch (error) {
        console.error('Error saving task:', error);
        showToast('Error saving task', 'error');
    }
};

window.deleteTask = async function() {
    if (!confirm('Delete this task? This cannot be undone.')) return;
    
    try {
        const taskId = parseInt(document.getElementById('taskId').value);
        await API.deleteTask(taskId);
        
        closeTaskModal();
        showToast('Task deleted');
        await loadAllTasks();
    } catch (error) {
        console.error('Error deleting task:', error);
        showToast('Error deleting task', 'error');
    }
};

window.completeTaskFromHome = async function(taskId, scheduledDate) {
    try {
        await API.completeTask(taskId, scheduledDate);
        showToast('Task completed! 🎉');
        await loadTodayTasks();
        await updateStats();
    } catch (error) {
        console.error('Error completing task:', error);
        showToast('Error completing task', 'error');
    }
};

window.completeTaskFromList = async function(taskId) {
    try {
        await API.completeTask(taskId);
        showToast('Task completed! 🎉');
        await loadAllTasks();
    } catch (error) {
        console.error('Error completing task:', error);
        showToast('Error completing task', 'error');
    }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(date);
}

// Make toast function global AND export it
window.showToast = showToast;
export { showToast };  // ADD THIS LINE