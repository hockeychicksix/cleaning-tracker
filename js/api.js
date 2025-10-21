// js/api.js
// Supabase API Functions

import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

// Initialize Supabase client (using fetch API)
const supabase = {
    from: (table) => ({
        select: async (columns = '*') => {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${columns}`, {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });
            const data = await response.json();
            return { data, error: response.ok ? null : data };
        },
        insert: async (values) => {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(values)
            });
            const data = await response.json();
            return { data, error: response.ok ? null : data };
        },
        update: async (values) => ({
            eq: async (column, value) => {
                const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${column}=eq.${value}`, {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(values)
                });
                const data = await response.json();
                return { data, error: response.ok ? null : data };
            }
        }),
        delete: async () => ({
            eq: async (column, value) => {
                const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${column}=eq.${value}`, {
                    method: 'DELETE',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`
                    }
                });
                return { error: response.ok ? null : await response.json() };
            }
        })
    })
};

// Helper function to get single item
async function selectSingle(table, column, value) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${column}=eq.${value}`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });
    const data = await response.json();
    if (response.ok && data.length > 0) {
        return { data: data[0], error: null };
    }
    return { data: null, error: response.ok ? null : data };
}

// Helper function for filtered selects
async function selectWhere(table, column, operator, value) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${column}=${operator}.${value}`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });
    const data = await response.json();
    return { data, error: response.ok ? null : data };
}

// ============================================
// TASK FUNCTIONS
// ============================================

export async function getAllTasks() {
    try {
        const { data, error } = await supabase.from('tasks').select('*');
        if (error) throw error;
        
        // Calculate derived fields
        return data.map(task => ({
            ...task,
            ...calculateTaskStatus(task)
        }));
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return [];
    }
}

export async function getTaskById(id) {
    try {
        const { data, error } = await selectSingle('tasks', 'id', id);
        if (error) throw error;
        if (!data) return null;
        return { ...data, ...calculateTaskStatus(data) };
    } catch (error) {
        console.error('Error fetching task:', error);
        return null;
    }
}

export async function createTask(taskData) {
    try {
        const { data, error} = await supabase.from('tasks').insert([{
            task_name: taskData.task_name,
            floor: taskData.floor || null,
            category: taskData.category || null,
            cadence: taskData.cadence,
            effort: taskData.effort || 'Medium',
            time_estimate: taskData.time_estimate || 15,
            priority: 100,
            status: 'Not Started'
        }]);
        
        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error creating task:', error);
        throw error;
    }
}

export async function updateTask(id, updates) {
    try {
        const { data, error } = await supabase.from('tasks')
            .update(updates)
            .eq('id', id);
        
        if (error) throw error;
        return data ? data[0] : null;
    } catch (error) {
        console.error('Error updating task:', error);
        throw error;
    }
}

export async function deleteTask(id) {
    try {
        const { error } = await supabase.from('tasks')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting task:', error);
        throw error;
    }
}

export async function completeTask(id, scheduledDate = null) {
    try {
        const task = await getTaskById(id);
        if (!task) throw new Error('Task not found');
        
        const now = new Date().toISOString();
        
        // Update task - need to await the update properly
        const updateResult = await supabase.from('tasks')
            .update({
                last_completed: now,
                completion_count: (task.completion_count || 0) + 1,
                scheduled_date: null
            })
            .eq('id', id);
        
        if (updateResult.error) throw updateResult.error;
        
        // Add to history
        const historyResult = await supabase.from('completion_history').insert([{
            task_id: id,
            task_name: task.task_name,
            floor: task.floor,
            category: task.category,
            effort: task.effort,
            time_minutes: task.time_estimate,
            scheduled_date: scheduledDate,
            completed_at: now
        }]);
        
        if (historyResult.error) throw historyResult.error;
        
        return true;
    } catch (error) {
        console.error('Error completing task:', error);
        throw error;
    }
}

export async function scheduleTask(id, date) {
    try {
        const { data, error } = await supabase.from('tasks')
            .update({ scheduled_date: date })
            .eq('id', id);
        
        if (error) throw error;
        return data ? data[0] : null;
    } catch (error) {
        console.error('Error scheduling task:', error);
        throw error;
    }
}

export async function unscheduleTask(id) {
    return scheduleTask(id, null);
}

// ============================================
// SCHEDULE FUNCTIONS
// ============================================

export async function getWeekSchedule(weekOffset = 0) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Calculate week start (yesterday)
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 1 + (weekOffset * 7));
        
        // Create 7-day array
        const schedule = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            
            schedule.push({
                date: date.toISOString().split('T')[0],
                dayName: dayNames[date.getDay()],
                fullDate: date.getDate(),
                isToday: date.toDateString() === today.toDateString(),
                isYesterday: date.toDateString() === new Date(today.getTime() - 86400000).toDateString(),
                isPast: date < today && date.toDateString() !== today.toDateString(),
                tasks: []
            });
        }
        
        // Fetch all tasks
        const tasks = await getAllTasks();
        
        // Organize by scheduled date
        tasks.forEach(task => {
            if (task.scheduled_date) {
                const dayIndex = schedule.findIndex(d => d.date === task.scheduled_date);
                if (dayIndex !== -1) {
                    schedule[dayIndex].tasks.push(task);
                }
            }
        });
        
        // Calculate totals
        schedule.forEach(day => {
            day.todoTasks = day.tasks.filter(t => !isCompletedToday(t, day.date));
            day.doneTasks = day.tasks.filter(t => isCompletedToday(t, day.date));
            day.totalMinutes = day.todoTasks.reduce((sum, t) => sum + (t.time_estimate || 15), 0);
        });
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        return {
            schedule,
            weekStart: formatDate(weekStart),
            weekEnd: formatDate(weekEnd),
            weekOffset
        };
    } catch (error) {
        console.error('Error getting week schedule:', error);
        return { schedule: [], weekStart: '', weekEnd: '', weekOffset: 0 };
    }
}

export async function getUnscheduledTasks() {
    try {
        const { data, error } = await selectWhere('tasks', 'scheduled_date', 'is', 'null');
        
        if (error) throw error;
        
        return data.map(task => ({
            ...task,
            ...calculateTaskStatus(task)
        })).sort((a, b) => b.priority - a.priority);
    } catch (error) {
        console.error('Error getting unscheduled tasks:', error);
        return [];
    }
}

// ============================================
// STATISTICS FUNCTIONS
// ============================================

export async function getStats() {
    try {
        const { data: history } = await supabase.from('completion_history')
            .select('*');
        
        const { data: tasks } = await supabase.from('tasks').select('*');
        
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 86400000);
        const monthAgo = new Date(now.getTime() - 30 * 86400000);
        
        const completedThisWeek = history.filter(h => new Date(h.completed_at) >= weekAgo).length;
        const completedThisMonth = history.filter(h => new Date(h.completed_at) >= monthAgo).length;
        
        const totalMinutes = history.reduce((sum, h) => sum + (h.time_minutes || 15), 0);
        const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
        const hourlyRate = await getSetting('hourly_rate') || 35;
        const totalValue = Math.round(totalHours * hourlyRate);
        
        // Calculate streaks
        const dates = [...new Set(history.map(h => h.completed_at.split('T')[0]))].sort().reverse();
        let currentStreak = 0;
        let longestStreak = 0;
        let streak = 0;
        let lastDate = null;
        
        dates.forEach(dateStr => {
            const date = new Date(dateStr);
            if (!lastDate || (lastDate - date) / 86400000 === 1) {
                streak++;
                longestStreak = Math.max(longestStreak, streak);
            } else {
                streak = 1;
            }
            lastDate = date;
        });
        currentStreak = streak;
        
        return {
            totalTasks: tasks.length,
            completedThisWeek,
            completedThisMonth,
            totalMinutes,
            totalHours,
            totalValue,
            currentStreak,
            longestStreak,
            avgTimePerTask: history.length > 0 ? Math.round(totalMinutes / history.length) : 0,
            totalCompletions: history.length
        };
    } catch (error) {
        console.error('Error getting stats:', error);
        return {
            totalTasks: 0,
            completedThisWeek: 0,
            completedThisMonth: 0,
            totalMinutes: 0,
            totalHours: 0,
            totalValue: 0,
            currentStreak: 0,
            longestStreak: 0,
            avgTimePerTask: 0,
            totalCompletions: 0
        };
    }
}

export async function getTopCategories() {
    try {
        const { data } = await supabase.from('completion_history')
            .select('category');
        
        const categoryCounts = {};
        data.forEach(item => {
            const cat = item.category || 'Uncategorized';
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
        
        return Object.entries(categoryCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([category, count]) => ({ category, count }));
    } catch (error) {
        console.error('Error getting top categories:', error);
        return [];
    }
}

export async function getRecentCompletions(limit = 10) {
    try {
        // Manual ordering since we're using raw fetch
        const response = await fetch(`${SUPABASE_URL}/rest/v1/completion_history?order=completed_at.desc&limit=${limit}`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        
        const data = await response.json();
        if (!response.ok) throw data;
        
        return data;
    } catch (error) {
        console.error('Error getting recent completions:', error);
        return [];
    }
}

// ============================================
// SETTINGS FUNCTIONS
// ============================================

export async function getSetting(key) {
    try {
        const { data } = await selectSingle('settings', 'id', 1);
        return data ? data[key] : null;
    } catch (error) {
        console.error('Error getting setting:', error);
        return null;
    }
}

export async function updateSetting(key, value) {
    try {
        const { data, error } = await supabase.from('settings')
            .update({ [key]: value })
            .eq('id', 1);
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error updating setting:', error);
        throw error;
    }
}

export async function getSettings() {
    try {
        const { data, error } = await selectSingle('settings', 'id', 1);
        
        if (error) throw error;
        return data || {
            user_name: 'there',
            hourly_rate: 35,
            daily_minutes: 30,
            onboarding_completed: false
        };
    } catch (error) {
        console.error('Error getting settings:', error);
        return {
            user_name: 'there',
            hourly_rate: 35,
            daily_minutes: 30,
            onboarding_completed: false
        };
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateTaskStatus(task) {
    if (!task.cadence) return { status: 'Not Started', priority: 100, days_overdue: 0 };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (!task.last_completed) {
        return {
            status: 'Not Started',
            priority: 100,
            days_overdue: 'N/A',
            next_due: null
        };
    }
    
    const lastCompleted = new Date(task.last_completed);
    lastCompleted.setHours(0, 0, 0, 0);
    
    const nextDue = new Date(lastCompleted);
    nextDue.setDate(nextDue.getDate() + task.cadence);
    
    const daysOverdue = Math.floor((today - nextDue) / 86400000);
    
    let status = 'On Track';
    let priority = 0;
    
    if (daysOverdue > 0) {
        status = 'OVERDUE';
        priority = Math.round((daysOverdue / task.cadence) * 100);
    } else if (daysOverdue >= -3) {
        status = 'Due Soon';
        priority = 50;
    }
    
    return {
        status,
        priority,
        days_overdue: daysOverdue,
        next_due: nextDue.toISOString().split('T')[0]
    };
}

function isCompletedToday(task, dateString) {
    if (!task.last_completed) return false;
    const completedDate = new Date(task.last_completed).toISOString().split('T')[0];
    return completedDate === dateString;
}

function formatDate(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
}

export { supabase };