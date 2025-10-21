// js/schedule.js
// Smart Scheduling Logic for Week View

import * as API from './api.js';
import { showToast } from './app.js';

// Global state
let currentWeekOffset = 0;
let selectedDay = null;
let weekSchedule = null;

// ============================================
// INITIALIZATION
// ============================================

export async function loadWeekView() {
    try {
        // Load settings
        const settings = await API.getSettings();
        updateDailyBudgetDisplay(settings.daily_minutes);
        
        // Load week schedule
        await refreshWeekSchedule();
        
        // Auto-select today
        if (weekSchedule && weekSchedule.schedule) {
            const today = weekSchedule.schedule.find(d => d.isToday);
            if (today) {
                selectDay(today);
            }
        }
    } catch (error) {
        console.error('Error loading week view:', error);
        showToast('Error loading schedule', 'error');
    }
}

export function initWeekNavigation() {
    const prevBtn = document.getElementById('prevWeek');
    const nextBtn = document.getElementById('nextWeek');
    
    if (prevBtn) prevBtn.addEventListener('click', previousWeek);
    if (nextBtn) nextBtn.addEventListener('click', nextWeek);
}

// ============================================
// WEEK DISPLAY
// ============================================

async function refreshWeekSchedule() {
    try {
        weekSchedule = await API.getWeekSchedule(currentWeekOffset);
        renderWeekGrid();
        updateWeekRange();
    } catch (error) {
        console.error('Error refreshing week schedule:', error);
        showToast('Error loading week', 'error');
    }
}

function renderWeekGrid() {
    const grid = document.getElementById('weekGrid');
    if (!grid || !weekSchedule) return;
    
    grid.innerHTML = weekSchedule.schedule.map((day, index) => {
        const totalTasks = day.todoTasks.length + day.doneTasks.length;
        const isComplete = totalTasks > 0 && day.todoTasks.length === 0;
        
        let countClass = 'empty';
        let countText = '—';
        
        if (isComplete) {
            countClass = 'done';
            countText = '✓';
        } else if (day.todoTasks.length > 0) {
            countClass = '';
            countText = day.todoTasks.length;
        }
        
        const dayClasses = [
            'day-card',
            day.isToday ? 'today' : '',
            day.isPast ? 'past' : '',
            selectedDay && selectedDay.date === day.date ? 'selected' : ''
        ].filter(Boolean).join(' ');
        
        return `
            <div class="${dayClasses}" onclick="selectDayByIndex(${index})" data-date="${day.date}">
                <div class="day-name">${day.dayName}</div>
                <div class="day-date">${day.fullDate}</div>
                <div class="day-count ${countClass}">${countText}</div>
            </div>
        `;
    }).join('');
}

function updateWeekRange() {
    const rangeEl = document.getElementById('weekRange');
    if (rangeEl && weekSchedule) {
        rangeEl.textContent = `${weekSchedule.weekStart} - ${weekSchedule.weekEnd}`;
    }
}

// ============================================
// DAY SELECTION
// ============================================

window.selectDayByIndex = function(index) {
    if (!weekSchedule || !weekSchedule.schedule[index]) return;
    selectDay(weekSchedule.schedule[index]);
};

function selectDay(day) {
    selectedDay = day;
    
    // Update UI
    document.querySelectorAll('.day-card').forEach(card => {
        card.classList.remove('selected');
        if (card.dataset.date === day.date) {
            card.classList.add('selected');
        }
    });
    
    // Show schedule content - FIX: use correct ID
    const detailsEl = document.getElementById('dayDetails');
    if (detailsEl) {
        detailsEl.style.display = 'block';
    }
    
    // Update title
    const titleEl = document.getElementById('selectedDayTitle');
    if (titleEl) {
        let title = day.dayName;
        if (day.isToday) title += ' (Today)';
        if (day.isYesterday) title += ' (Yesterday)';
        titleEl.textContent = title;
    }
    
    // Update subtitle
    const metaEl = document.getElementById('selectedDayMeta');
    if (metaEl) {
        const taskCount = day.todoTasks.length;
        const minutes = day.totalMinutes || 0;
        metaEl.textContent = `${taskCount} task${taskCount !== 1 ? 's' : ''} • ${minutes} min`;
    }
    
    // Render columns
    renderTodoColumn(day);
    renderDoneColumn(day);
    
    // Show smart tip if applicable
    showSmartTip(day);
}

function renderTodoColumn(day) {
    const column = document.getElementById('todoColumn');
    const countEl = document.getElementById('todoCount');
    
    if (!column) return;
    
    const tasks = day.todoTasks || [];
    
    if (countEl) {
        countEl.textContent = `${tasks.length}`;
    }
    
    if (tasks.length === 0) {
        column.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">✨</div>
                <p style="font-weight:600;margin-bottom:5px">No tasks scheduled</p>
                <p style="font-size:12px;opacity:0.8">Click "+" to add tasks to this day</p>
            </div>
        `;
        return;
    }
    
    column.innerHTML = tasks.map(task => `
        <div class="task-card" data-task-id="${task.id}">
            <div class="task-name">${task.task_name}</div>
            <div class="task-meta">
                ${task.floor ? `<span class="task-badge floor">🏢 ${task.floor}</span>` : ''}
                ${task.category ? `<span class="task-badge">📍 ${task.category}</span>` : ''}
                <span class="task-badge">💪 ${task.effort}</span>
                <span class="task-badge">⏱️ ${task.time_estimate}m</span>
            </div>
            <div class="task-actions">
                <button class="task-btn complete" onclick="completeTaskFromSchedule(${task.id}, '${day.date}')">
                    ✓ Complete
                </button>
                <button class="task-btn reschedule" onclick="unscheduleTask(${task.id})">
                    Unschedule
                </button>
            </div>
        </div>
    `).join('');
}

function renderDoneColumn(day) {
    const column = document.getElementById('doneColumn');
    const countEl = document.getElementById('doneCount');
    
    if (!column) return;
    
    const tasks = day.doneTasks || [];
    
    if (countEl) {
        countEl.textContent = `${tasks.length}`;
    }
    
    if (tasks.length === 0) {
        column.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎯</div>
                <p style="font-weight:600;margin-bottom:5px">No completions yet</p>
                <p style="font-size:12px;opacity:0.8">Complete tasks to see them here</p>
            </div>
        `;
        return;
    }
    
    column.innerHTML = tasks.map(task => `
        <div class="task-card done">
            <div class="task-name done">${task.task_name}</div>
            <div class="task-meta">
                ${task.floor ? `<span class="task-badge floor">🏢 ${task.floor}</span>` : ''}
                ${task.category ? `<span class="task-badge">📍 ${task.category}</span>` : ''}
                <span class="task-badge">⏱️ ${task.time_estimate}m</span>
            </div>
        </div>
    `).join('');
}

function showSmartTip(day) {
    const tipContainer = document.getElementById('smartTip');
    if (!tipContainer) return;
    
    const tasks = day.todoTasks || [];
    if (tasks.length === 0) {
        tipContainer.style.display = 'none';
        return;
    }
    
    // Group by floor
    const floors = {};
    tasks.forEach(task => {
        const floor = task.floor || 'Other';
        floors[floor] = (floors[floor] || 0) + 1;
    });
    
    // Find dominant floor
    const dominantFloor = Object.keys(floors).reduce((a, b) => 
        floors[a] > floors[b] ? a : b
    );
    
    if (floors[dominantFloor] >= 2) {
        const tipText = document.getElementById('tipText');
        if (tipText) {
            tipText.textContent = `${floors[dominantFloor]} tasks on ${dominantFloor} - start there to save time!`;
        }
        tipContainer.style.display = 'block';
    } else {
        tipContainer.style.display = 'none';
    }
}

// ============================================
// WEEK NAVIGATION
// ============================================

window.previousWeek = async function() {
    currentWeekOffset--;
    await refreshWeekSchedule();
    
    // Re-select same day of week if exists
    if (selectedDay && weekSchedule) {
        const sameDay = weekSchedule.schedule.find(d => d.dayName === selectedDay.dayName);
        if (sameDay) selectDay(sameDay);
    }
};

window.nextWeek = async function() {
    currentWeekOffset++;
    await refreshWeekSchedule();
    
    // Re-select same day of week if exists
    if (selectedDay && weekSchedule) {
        const sameDay = weekSchedule.schedule.find(d => d.dayName === selectedDay.dayName);
        if (sameDay) selectDay(sameDay);
    }
};

// ============================================
// SMART SCHEDULING
// ============================================

window.smartSchedule = async function() {
    try {
        showToast('Scheduling tasks...', 'info');
        
        const settings = await API.getSettings();
        const dailyMinutes = settings.daily_minutes || 30;
        
        // Get unscheduled tasks
        const unscheduled = await API.getUnscheduledTasks();
        
        if (unscheduled.length === 0) {
            showToast('No unscheduled tasks to schedule', 'info');
            return;
        }
        
        // Sort tasks by priority
        const sortedTasks = sortTasksByPriority(unscheduled);
        
        // Group similar tasks
        const groupedTasks = groupSimilarTasks(sortedTasks);
        
        // Get current week schedule
        const schedule = await API.getWeekSchedule(0);
        const days = schedule.schedule;
        
        // Find today's index
        const todayIndex = days.findIndex(d => d.isToday);
        if (todayIndex === -1) {
            showToast('Error finding today', 'error');
            return;
        }
        
        // Schedule tasks from today forward
        let scheduled = 0;
        let currentDayIndex = todayIndex;
        
        for (const group of groupedTasks) {
            // Try to fit entire group on one day
            const groupTime = group.reduce((sum, t) => sum + t.time_estimate, 0);
            
            let placed = false;
            for (let offset = 0; offset < 7; offset++) {
                const dayIndex = currentDayIndex + offset;
                if (dayIndex >= days.length) break;
                
                const day = days[dayIndex];
                const currentMinutes = day.totalMinutes || 0;
                
                // Check if entire group fits
                if (currentMinutes + groupTime <= dailyMinutes) {
                    // Schedule all tasks in group to this day
                    for (const task of group) {
                        await API.scheduleTask(task.id, day.date);
                        scheduled++;
                    }
                    
                    // Update day's total
                    day.totalMinutes = currentMinutes + groupTime;
                    placed = true;
                    break;
                }
            }
            
            // If group doesn't fit anywhere, try individual tasks
            if (!placed) {
                for (const task of group) {
                    for (let offset = 0; offset < 7; offset++) {
                        const dayIndex = currentDayIndex + offset;
                        if (dayIndex >= days.length) break;
                        
                        const day = days[dayIndex];
                        const currentMinutes = day.totalMinutes || 0;
                        
                        if (currentMinutes + task.time_estimate <= dailyMinutes) {
                            await API.scheduleTask(task.id, day.date);
                            day.totalMinutes = currentMinutes + task.time_estimate;
                            scheduled++;
                            break;
                        }
                    }
                }
            }
        }
        
        // Refresh display
        await refreshWeekSchedule();
        
        if (selectedDay) {
            const updatedDay = weekSchedule.schedule.find(d => d.date === selectedDay.date);
            if (updatedDay) selectDay(updatedDay);
        }
        
        if (scheduled > 0) {
            showToast(`✨ Scheduled ${scheduled} task${scheduled !== 1 ? 's' : ''} from today forward!`);
        } else {
            showToast('No tasks could fit in available time slots', 'info');
        }
        
    } catch (error) {
        console.error('Error in smart schedule:', error);
        showToast('Error scheduling tasks', 'error');
    }
};

// ============================================
// TASK SORTING & GROUPING
// ============================================

function sortTasksByPriority(tasks) {
    return tasks.sort((a, b) => {
        // 1. Priority Score (highest first)
        if (a.priority !== b.priority) return b.priority - a.priority;
        
        // 2. Status (OVERDUE first)
        if (a.status === 'OVERDUE' && b.status !== 'OVERDUE') return -1;
        if (b.status === 'OVERDUE' && a.status !== 'OVERDUE') return 1;
        
        // 3. Effort Level (Low first)
        const effortOrder = { 'Low': 0, 'Medium': 1, 'High': 2 };
        const aEffort = effortOrder[a.effort] || 1;
        const bEffort = effortOrder[b.effort] || 1;
        if (aEffort !== bEffort) return aEffort - bEffort;
        
        // 4. Time Estimate (shortest first)
        return a.time_estimate - b.time_estimate;
    });
}

function groupSimilarTasks(tasks) {
    // Create groups by floor + category
    const groups = {};
    
    tasks.forEach(task => {
        const groupKey = `${task.floor || 'Other'}_${task.category || 'General'}`;
        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(task);
    });
    
    // Sort groups by average priority
    const sortedGroups = Object.entries(groups).sort((a, b) => {
        const aPriority = a[1].reduce((sum, t) => sum + t.priority, 0) / a[1].length;
        const bPriority = b[1].reduce((sum, t) => sum + t.priority, 0) / b[1].length;
        return bPriority - aPriority;
    });
    
    // Flatten groups and apply sweep-before-mop logic
    return sortedGroups.map(([key, groupTasks]) => {
        return groupTasks.sort((a, b) => {
            const aName = a.task_name.toLowerCase();
            const bName = b.task_name.toLowerCase();
            
            // Sweep before mop
            if (aName.includes('sweep') && bName.includes('mop')) return -1;
            if (aName.includes('mop') && bName.includes('sweep')) return 1;
            
            // Otherwise maintain priority order
            return 0;
        });
    });
}

// ============================================
// TASK ACTIONS
// ============================================

window.completeTaskFromSchedule = async function(taskId, scheduledDate) {
    try {
        await API.completeTask(taskId, scheduledDate);
        showToast('Task completed! 🎉');
        
        // Refresh schedule
        await refreshWeekSchedule();
        
        // Update selected day
        if (selectedDay) {
            const updatedDay = weekSchedule.schedule.find(d => d.date === selectedDay.date);
            if (updatedDay) selectDay(updatedDay);
        }
    } catch (error) {
        console.error('Error completing task:', error);
        showToast('Error completing task', 'error');
    }
};

window.unscheduleTask = async function(taskId) {
    try {
        await API.unscheduleTask(taskId);
        showToast('Task unscheduled');
        
        // Refresh schedule
        await refreshWeekSchedule();
        
        // Update selected day
        if (selectedDay) {
            const updatedDay = weekSchedule.schedule.find(d => d.date === selectedDay.date);
            if (updatedDay) selectDay(updatedDay);
        }
    } catch (error) {
        console.error('Error unscheduling task:', error);
        showToast('Error unscheduling task', 'error');
    }
};

// ============================================
// SCHEDULE TASK PICKER
// ============================================

window.showScheduleTaskPicker = async function() {
    try {
        const modal = document.getElementById('scheduleTaskModal');
        const listEl = document.getElementById('unscheduledTasksList');
        
        if (!modal || !listEl) return;
        
        // Get unscheduled tasks
        const unscheduled = await API.getUnscheduledTasks();
        
        if (unscheduled.length === 0) {
            listEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">✅</div>
                    <p>All tasks are scheduled!</p>
                </div>
            `;
        } else {
            const sorted = sortTasksByPriority(unscheduled);
            
            listEl.innerHTML = sorted.map(task => `
                <div class="task-card" onclick="scheduleTaskToSelectedDay(${task.id})" style="cursor:pointer">
                    <div class="task-name">${task.task_name}</div>
                    <div class="task-meta">
                        ${task.floor ? `<span class="task-badge floor">🏢 ${task.floor}</span>` : ''}
                        ${task.category ? `<span class="task-badge">📍 ${task.category}</span>` : ''}
                        <span class="task-badge">💪 ${task.effort}</span>
                        <span class="task-badge">⏱️ ${task.time_estimate}m</span>
                        ${task.status === 'OVERDUE' ? '<span class="task-badge" style="background:#fee;color:#e74c3c">⚠️ Overdue</span>' : ''}
                    </div>
                </div>
            `).join('');
        }
        
        modal.classList.add('show');
    } catch (error) {
        console.error('Error showing task picker:', error);
        showToast('Error loading tasks', 'error');
    }
};

window.closeScheduleTaskPicker = function() {
    const modal = document.getElementById('scheduleTaskModal');
    if (modal) modal.classList.remove('show');
};

window.scheduleTaskToSelectedDay = async function(taskId) {
    if (!selectedDay) {
        showToast('Please select a day first', 'error');
        return;
    }
    
    try {
        await API.scheduleTask(taskId, selectedDay.date);
        closeScheduleTaskPicker();
        showToast('Task scheduled!');
        
        // Refresh schedule
        await refreshWeekSchedule();
        
        // Update selected day
        const updatedDay = weekSchedule.schedule.find(d => d.date === selectedDay.date);
        if (updatedDay) selectDay(updatedDay);
    } catch (error) {
        console.error('Error scheduling task:', error);
        showToast('Error scheduling task', 'error');
    }
};

// ============================================
// SETTINGS
// ============================================

window.showSettingsModal = async function() {
    const modal = document.getElementById('settingsModal');
    const select = document.getElementById('dailyMinutes');
    
    if (!modal || !select) return;
    
    try {
        const settings = await API.getSettings();
        select.value = settings.daily_minutes || 30;
        modal.classList.add('show');
    } catch (error) {
        console.error('Error loading settings:', error);
    }
};

window.closeSettingsModal = function() {
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.remove('show');
};

window.saveSettings = async function(event) {
    event.preventDefault();
    
    try {
        const minutes = parseInt(document.getElementById('dailyMinutes').value);
        await API.updateSetting('daily_minutes', minutes);
        
        updateDailyBudgetDisplay(minutes);
        closeSettingsModal();
        showToast('Settings saved!');
    } catch (error) {
        console.error('Error saving settings:', error);
        showToast('Error saving settings', 'error');
    }
};

function updateDailyBudgetDisplay(minutes) {
    const displayEl = document.getElementById('dailyMinutesDisplay');
    const budgetEl = document.getElementById('dailyBudget');
    
    if (displayEl) displayEl.textContent = `${minutes} min/day`;
    if (budgetEl) budgetEl.textContent = `${minutes} min`;
}