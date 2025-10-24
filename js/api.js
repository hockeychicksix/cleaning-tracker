// js/api.js
// Supabase Database API Functions

import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

/**
 * Get authentication headers
 */
function getAuthHeaders() {
    const accessToken = localStorage.getItem('supabase.auth.token');
    return {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${accessToken || SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };
}

/**
 * Get current user ID
 */
async function getCurrentUserId() {
    const accessToken = localStorage.getItem('supabase.auth.token');
    if (!accessToken) return null;

    try {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (response.ok) {
            const user = await response.json();
            return user.id;
        }
    } catch (error) {
        console.error('Error getting user ID:', error);
    }
    return null;
}

// ============================================
// TASKS API
// ============================================

export const tasks = {
    /**
     * Get all tasks for current user
     */
    async getAll() {
        try {
            const userId = await getCurrentUserId();
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/tasks?user_id=eq.${userId}&order=created_at.desc`,
                { headers: getAuthHeaders() }
            );
            const data = await response.json();
            return { data, error: response.ok ? null : data };
        } catch (error) {
            return { data: null, error };
        }
    },

    /**
     * Get task by ID
     */
    async getById(id) {
        try {
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/tasks?id=eq.${id}`,
                { headers: getAuthHeaders() }
            );
            const data = await response.json();
            return { data: data[0] || null, error: response.ok ? null : data };
        } catch (error) {
            return { data: null, error };
        }
    },

    /**
     * Create new task
     */
    async create(taskData) {
        try {
            const userId = await getCurrentUserId();
            const response = await fetch(`${SUPABASE_URL}/rest/v1/tasks`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ ...taskData, user_id: userId })
            });
            const data = await response.json();
            return { data: data[0] || data, error: response.ok ? null : data };
        } catch (error) {
            return { data: null, error };
        }
    },

    /**
     * Update task
     */
    async update(id, updates) {
        try {
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/tasks?id=eq.${id}`,
                {
                    method: 'PATCH',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(updates)
                }
            );
            const data = await response.json();
            return { data: data[0] || data, error: response.ok ? null : data };
        } catch (error) {
            return { data: null, error };
        }
    },

    /**
     * Delete task
     */
    async delete(id) {
        try {
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/tasks?id=eq.${id}`,
                {
                    method: 'DELETE',
                    headers: getAuthHeaders()
                }
            );
            return { error: response.ok ? null : await response.json() };
        } catch (error) {
            return { error };
        }
    },

    /**
     * Mark task as complete
     */
    async complete(taskId) {
        try {
            const task = await this.getById(taskId);
            if (task.error) return task;

            const now = new Date().toISOString();
            const nextDue = new Date();
            nextDue.setDate(nextDue.getDate() + (task.data.cadence || 7));

            // Update task
            await this.update(taskId, {
                last_completed: now,
                completion_count: (task.data.completion_count || 0) + 1,
                scheduled_date: null
            });

            // Add to completion history
            const userId = await getCurrentUserId();
            await fetch(`${SUPABASE_URL}/rest/v1/completion_history`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    user_id: userId,
                    task_id: taskId,
                    task_name: task.data.task_name,
                    floor: task.data.floor,
                    category: task.data.category,
                    effort: task.data.effort,
                    time_minutes: task.data.time_estimate || 15,
                    scheduled_date: task.data.scheduled_date,
                    completed_at: now
                })
            });

            return { data: { success: true }, error: null };
        } catch (error) {
            return { data: null, error };
        }
    },

    /**
     * Get overdue tasks
     */
    async getOverdue() {
        try {
            const { data: allTasks } = await this.getAll();
            if (!allTasks) return { data: [], error: null };

            const now = new Date();
            const overdue = allTasks.filter(task => {
                if (!task.last_completed) return true;
                const lastCompleted = new Date(task.last_completed);
                const daysSince = Math.floor((now - lastCompleted) / (1000 * 60 * 60 * 24));
                return daysSince > task.cadence;
            });

            return { data: overdue, error: null };
        } catch (error) {
            return { data: [], error };
        }
    },

    /**
     * Get tasks due soon (within 3 days)
     */
    async getDueSoon() {
        try {
            const { data: allTasks } = await this.getAll();
            if (!allTasks) return { data: [], error: null };

            const now = new Date();
            const dueSoon = allTasks.filter(task => {
                if (!task.last_completed) return false;
                const lastCompleted = new Date(task.last_completed);
                const daysSince = Math.floor((now - lastCompleted) / (1000 * 60 * 60 * 24));
                return daysSince <= task.cadence && daysSince > task.cadence - 3;
            });

            return { data: dueSoon, error: null };
        } catch (error) {
            return { data: [], error };
        }
    }
};

// ============================================
// COMPLETION HISTORY API
// ============================================

export const completions = {
    /**
     * Get all completion history
     */
    async getAll() {
        try {
            const userId = await getCurrentUserId();
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/completion_history?user_id=eq.${userId}&order=completed_at.desc`,
                { headers: getAuthHeaders() }
            );
            const data = await response.json();
            return { data, error: response.ok ? null : data };
        } catch (error) {
            return { data: null, error };
        }
    },

    /**
     * Get completions for date range
     */
    async getRange(startDate, endDate) {
        try {
            const userId = await getCurrentUserId();
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/completion_history?user_id=eq.${userId}&completed_at=gte.${startDate}&completed_at=lte.${endDate}&order=completed_at.desc`,
                { headers: getAuthHeaders() }
            );
            const data = await response.json();
            return { data, error: response.ok ? null : data };
        } catch (error) {
            return { data: null, error };
        }
    },

    /**
     * Get recent completions (last 30 days)
     */
    async getRecent(days = 30) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            return await this.getRange(startDate.toISOString(), new Date().toISOString());
        } catch (error) {
            return { data: null, error };
        }
    }
};

// ============================================
// SETTINGS API
// ============================================

export const settings = {
    /**
     * Get user settings
     */
    async get() {
        try {
            const userId = await getCurrentUserId();
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/settings?user_id=eq.${userId}`,
                { headers: getAuthHeaders() }
            );
            const data = await response.json();
            
            // If no settings exist, create default
            if (!data || data.length === 0) {
                return await this.create({
                    user_name: 'there',
                    hourly_rate: 35,
                    daily_minutes: 30,
                    onboarding_completed: false
                });
            }
            
            return { data: data[0], error: response.ok ? null : data };
        } catch (error) {
            return { data: null, error };
        }
    },

    /**
     * Create settings
     */
    async create(settingsData) {
        try {
            const userId = await getCurrentUserId();
            const response = await fetch(`${SUPABASE_URL}/rest/v1/settings`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ ...settingsData, user_id: userId })
            });
            const data = await response.json();
            return { data: data[0] || data, error: response.ok ? null : data };
        } catch (error) {
            return { data: null, error };
        }
    },

    /**
     * Update settings
     */
    async update(updates) {
        try {
            const userId = await getCurrentUserId();
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/settings?user_id=eq.${userId}`,
                {
                    method: 'PATCH',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(updates)
                }
            );
            const data = await response.json();
            return { data: data[0] || data, error: response.ok ? null : data };
        } catch (error) {
            return { data: null, error };
        }
    }
};

// ============================================
// FEEDBACK API
// ============================================

export const feedback = {
    /**
     * Submit feedback
     */
    async submit(feedbackData) {
        try {
            const userId = await getCurrentUserId();
            const user = JSON.parse(localStorage.getItem('supabase.auth.user') || '{}');
            
            const response = await fetch(`${SUPABASE_URL}/rest/v1/feedback`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    user_id: userId,
                    user_email: user.email || '',
                    type: feedbackData.type,
                    message: feedbackData.message,
                    page: feedbackData.page || window.location.pathname
                })
            });
            const data = await response.json();
            return { data: data[0] || data, error: response.ok ? null : data };
        } catch (error) {
            return { data: null, error };
        }
    }
};

// ============================================
// STATISTICS & ANALYTICS
// ============================================

export const stats = {
    /**
     * Get dashboard statistics
     */
    async getDashboard() {
        try {
            const [tasksResult, completionsResult, settingsResult] = await Promise.all([
                tasks.getAll(),
                completions.getRecent(30),
                settings.get()
            ]);

            const allTasks = tasksResult.data || [];
            const recentCompletions = completionsResult.data || [];
            const userSettings = settingsResult.data || { hourly_rate: 35 };

            // Calculate stats
            const now = new Date();
            const overdue = allTasks.filter(task => {
                if (!task.last_completed) return true;
                const lastCompleted = new Date(task.last_completed);
                const daysSince = Math.floor((now - lastCompleted) / (1000 * 60 * 60 * 24));
                return daysSince > task.cadence;
            });

            const dueSoon = allTasks.filter(task => {
                if (!task.last_completed) return false;
                const lastCompleted = new Date(task.last_completed);
                const daysSince = Math.floor((now - lastCompleted) / (1000 * 60 * 60 * 24));
                return daysSince <= task.cadence && daysSince > task.cadence - 3;
            });

            const onTrack = allTasks.filter(task => {
                if (!task.last_completed) return false;
                const lastCompleted = new Date(task.last_completed);
                const daysSince = Math.floor((now - lastCompleted) / (1000 * 60 * 60 * 24));
                return daysSince <= task.cadence - 3;
            });

            // Calculate time saved this week
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            weekStart.setHours(0, 0, 0, 0);

            const thisWeekCompletions = recentCompletions.filter(c => 
                new Date(c.completed_at) >= weekStart
            );

            const minutesThisWeek = thisWeekCompletions.reduce((sum, c) => 
                sum + (c.time_minutes || 15), 0
            );

            const valueSaved = (minutesThisWeek / 60) * userSettings.hourly_rate;

            return {
                data: {
                    totalTasks: allTasks.length,
                    overdueCount: overdue.length,
                    dueSoonCount: dueSoon.length,
                    onTrackCount: onTrack.length,
                    completionsThisWeek: thisWeekCompletions.length,
                    minutesThisWeek,
                    valueSaved,
                    recentCompletions: recentCompletions.slice(0, 10)
                },
                error: null
            };
        } catch (error) {
            return { data: null, error };
        }
    }
};