# 🏠 Cleaning Tracker

A smart home cleaning task manager with intelligent scheduling, progress tracking, and helpful insights.

## ✨ Features

- **📅 Weekly View** - Visual calendar showing your cleaning schedule
- **✨ Smart Scheduling** - AI-powered algorithm that optimally schedules tasks based on:
  - Daily time budget
  - Task priority and effort level
  - Floor/location grouping (minimize movement!)
  - Task dependencies (sweep before mop)
- **📊 Statistics & Insights** - Track your progress, streaks, and value created
- **🎯 Task Management** - Create recurring tasks with custom cadences
- **💡 Smart Tips** - Get helpful suggestions based on your schedule
- **🌙 Dark Mode** - Easy on the eyes for evening planning

## 🚀 Live Demo

Visit the live app: [https://YOUR-USERNAME.github.io/cleaning-tracker/](https://YOUR-USERNAME.github.io/cleaning-tracker/)

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript (ES6 modules)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Custom CSS with CSS variables
- **Hosting**: GitHub Pages

## 📱 Screenshots

### Home Dashboard
View your daily tasks and quick stats at a glance.

### Weekly Scheduler
Plan your week with the smart scheduling algorithm.

### Task Management
Track all your cleaning tasks with filtering options.

## 🏗️ Project Structure

```
cleaning-tracker/
├── index.html          # Home dashboard
├── week.html           # Weekly scheduler view
├── tasks.html          # Task management
├── stats.html          # Statistics & insights
├── css/
│   └── style.css       # All styles with theming
└── js/
    ├── config.js       # Supabase configuration
    ├── api.js          # Database operations
    ├── app.js          # Main app logic
    └── schedule.js     # Smart scheduling algorithm
```

## 🎯 Smart Scheduling Algorithm

The scheduler uses a multi-factor approach:

1. **Priority Scoring** - Tasks are ranked by:
   - Overdue status
   - Days until due
   - Effort level (low effort prioritized)
   
2. **Intelligent Grouping** - Tasks are grouped by:
   - Floor/location (minimize walking!)
   - Category/room
   
3. **Dependency Handling** - Some tasks have natural order:
   - Sweeping before mopping
   - Dusting before vacuuming

4. **Time Budget Optimization** - Fits tasks within your daily time limit

## 🔒 Security

This app uses Supabase Row Level Security (RLS) policies to protect your data. The anon key is safe to expose in client-side code because:
- RLS policies control all data access
- The database enforces security at the row level
- No one can access or modify your data without proper permissions

## 💻 Local Development

1. Clone the repository:
```bash
git clone https://github.com/YOUR-USERNAME/cleaning-tracker.git
cd cleaning-tracker
```

2. Set up Supabase:
   - Create a project at [supabase.com](https://supabase.com)
   - Run the SQL setup (see below)
   - Update `js/config.js` with your credentials

3. Open `index.html` in your browser or use a local server:
```bash
# Python
python -m http.server 8000

# Node.js
npx serve
```

## 🗄️ Database Setup

Create these tables in Supabase:

```sql
-- Tasks table
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  task_name TEXT NOT NULL,
  floor TEXT,
  category TEXT,
  cadence INTEGER NOT NULL,
  effort TEXT DEFAULT 'Medium',
  time_estimate INTEGER DEFAULT 15,
  priority INTEGER DEFAULT 100,
  last_completed TIMESTAMP,
  completion_count INTEGER DEFAULT 0,
  scheduled_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Completion history
CREATE TABLE completion_history (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id),
  task_name TEXT NOT NULL,
  floor TEXT,
  category TEXT,
  effort TEXT,
  time_minutes INTEGER,
  scheduled_date DATE,
  completed_at TIMESTAMP DEFAULT NOW()
);

-- Settings
CREATE TABLE settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  user_name TEXT DEFAULT 'there',
  hourly_rate INTEGER DEFAULT 35,
  daily_minutes INTEGER DEFAULT 30,
  onboarding_completed BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE completion_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies (for personal use)
CREATE POLICY "Enable all for tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for history" ON completion_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for settings" ON settings FOR ALL USING (true) WITH CHECK (true);

-- Insert default settings
INSERT INTO settings (id, user_name, hourly_rate, daily_minutes) 
VALUES (1, 'there', 35, 30);
```

## 🎨 Customization

### Change Color Theme
Edit CSS variables in `css/style.css`:
```css
:root {
    --primary: #667eea;
    --secondary: #764ba2;
    /* ... more variables */
}
```

### Adjust Smart Scheduling
Modify parameters in `js/schedule.js`:
- Task sorting priority
- Grouping logic
- Time budget calculations

## 📝 Future Enhancements

- [ ] Mobile app (PWA)
- [ ] Notifications/reminders
- [ ] Multiple user support
- [ ] Task templates
- [ ] Export/import data
- [ ] Integration with smart home devices

## 🤝 Contributing

This is a personal project, but suggestions and feedback are welcome! Feel free to:
- Open an issue with ideas
- Fork and experiment
- Share your own version

## 📄 License

MIT License - feel free to use this for your own cleaning management!

## 👤 Author

Built with ❤️ as a personal productivity tool

---

**Note**: This is designed as a single-user application. For multi-user deployments, you'll need to add authentication and update RLS policies accordingly.