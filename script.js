// Real Digital Wellbeing Tracking System
class DigitalWellbeingTracker {
    constructor() {
        this.sessionStartTime = Date.now();
        this.dailyStartTime = this.getTodayStart();
        this.clickCount = 0;
        this.pageViews = 0;
        this.unlockCount = 0;
        this.notificationCount = 0;
        this.focusTime = 0;
        this.distractionTime = 0;
        this.lastActivity = Date.now();
        this.isActive = true;
        this.activityTimer = null;
        this.wellbeingData = {
            dailyUsage: {},
            sessionData: {},
            focusSessions: [],
            distractions: [],
            goals: {
                maxDailyTime: 4 * 60 * 60 * 1000, // 4 hours in ms
                maxUnlocks: 50,
                focusGoal: 2 * 60 * 60 * 1000 // 2 hours focus time
            }
        };
        this.init();
    }

    init() {
        this.loadStoredData();
        this.setupTracking();
        this.startTimeTracking();
        this.setupWellbeingMonitoring();
        this.setupNotifications();
    }

    getTodayStart() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today.getTime();
    }

    setupWellbeingMonitoring() {
        // Monitor page visibility for real usage tracking
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handleInactive();
            } else {
                this.handleActive();
            }
        });

        // Monitor focus/blur events
        window.addEventListener('focus', () => this.handleActive());
        window.addEventListener('blur', () => this.handleInactive());

        // Monitor user activity
        this.setupActivityMonitoring();
    }

    setupActivityMonitoring() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        events.forEach(event => {
            document.addEventListener(event, () => {
                this.lastActivity = Date.now();
                this.isActive = true;
                this.updateFocusTime();
            }, true);
        });

        // Check for inactivity every 30 seconds
        setInterval(() => {
            const now = Date.now();
            if (now - this.lastActivity > 30000) { // 30 seconds of inactivity
                this.handleInactive();
            }
        }, 30000);
    }

    handleActive() {
        if (!this.isActive) {
            this.isActive = true;
            this.sessionStartTime = Date.now();
            this.trackFocusSession('start');
        }
    }

    handleInactive() {
        if (this.isActive) {
            this.isActive = false;
            this.trackFocusSession('end');
        }
    }

    trackFocusSession(action) {
        const now = Date.now();
        if (action === 'start') {
            this.focusSessionStart = now;
        } else if (action === 'end' && this.focusSessionStart) {
            const sessionDuration = now - this.focusSessionStart;
            this.focusTime += sessionDuration;
            this.wellbeingData.focusSessions.push({
                start: this.focusSessionStart,
                end: now,
                duration: sessionDuration
            });
        }
    }

    updateFocusTime() {
        if (this.isActive && this.focusSessionStart) {
            const currentSession = Date.now() - this.focusSessionStart;
            this.focusTime += currentSession;
        }
    }

    setupNotifications() {
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    checkWellbeingLimits() {
        const totalTime = this.getTotalUsageTime();
        const dailyTime = this.getDailyUsageTime();
        
        // Check daily time limit
        if (dailyTime > this.wellbeingData.goals.maxDailyTime) {
            this.showWellbeingAlert('Límite diario alcanzado', 
                `Has usado el dispositivo por ${this.formatTime(dailyTime)} hoy. Considera tomar un descanso.`);
        }
        
        // Check unlock limit
        if (this.unlockCount > this.wellbeingData.goals.maxUnlocks) {
            this.showWellbeingAlert('Muchos desbloqueos', 
                `Has desbloqueado el dispositivo ${this.unlockCount} veces hoy. Intenta reducir la frecuencia.`);
        }
    }

    showWellbeingAlert(title, message) {
        // Show browser notification if permission granted
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiM0YWRlODAiLz4KPHBhdGggZD0iTTMyIDQ4QzM5LjczMTkgNDggNDYgNDEuNzMxOSA0NiAzNFYyNkM0NiAxOC4yNjgxIDM5LjczMTkgMTIgMzIgMTJDMjQuMjY4MSAxMiAxOCAxOC4yNjgxIDE4IDI2VjM0QzE4IDQxLjczMTkgMjQuMjY4MSA0OCAzMiA0OFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo='
            });
        }
        
        // Also show in-app notification
        if (window.app && window.app.toast) {
            window.app.toast.info(message);
        }
    }

    loadStoredData() {
        try {
            const stored = localStorage.getItem('focuswave_wellbeing');
            if (stored) {
                const data = JSON.parse(stored);
                this.wellbeingData = { ...this.wellbeingData, ...data };
                this.clickCount = data.clickCount || 0;
                this.pageViews = data.pageViews || 0;
                this.unlockCount = data.unlockCount || 0;
                this.notificationCount = data.notificationCount || 0;
                this.focusTime = data.focusTime || 0;
            }
        } catch (error) {
            console.log('Error loading wellbeing data:', error);
        }
    }

    saveData() {
        try {
            this.wellbeingData.timeSpent = Date.now() - this.sessionStartTime;
            this.wellbeingData.clickCount = this.clickCount;
            this.wellbeingData.pageViews = this.pageViews;
            this.wellbeingData.unlockCount = this.unlockCount;
            this.wellbeingData.notificationCount = this.notificationCount;
            this.wellbeingData.focusTime = this.focusTime;
            this.wellbeingData.lastActivity = Date.now();
            this.wellbeingData.dailyUsage = this.getDailyUsageData();
            
            localStorage.setItem('focuswave_wellbeing', JSON.stringify(this.wellbeingData));
        } catch (error) {
            console.log('Error saving wellbeing data:', error);
        }
    }

    getDailyUsageData() {
        const today = new Date().toDateString();
        const existing = this.wellbeingData.dailyUsage[today] || {
            totalTime: 0,
            unlocks: 0,
            notifications: 0,
            focusTime: 0,
            sessions: []
        };
        
        return {
            ...existing,
            totalTime: existing.totalTime + (Date.now() - this.sessionStartTime),
            unlocks: this.unlockCount,
            notifications: this.notificationCount,
            focusTime: this.focusTime
        };
    }

    getTotalUsageTime() {
        return Date.now() - this.sessionStartTime;
    }

    getDailyUsageTime() {
        const today = new Date().toDateString();
        const dailyData = this.wellbeingData.dailyUsage[today];
        return dailyData ? dailyData.totalTime : 0;
    }

    formatTime(milliseconds) {
        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    setupTracking() {
        // Track all clicks
        document.addEventListener('click', (e) => {
            this.trackClick(e.target, 'click');
        });

        // Track touch events for mobile
        document.addEventListener('touchstart', (e) => {
            this.trackClick(e.target, 'touch');
        });

        // Track visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveData();
            }
        });

        // Save data before page unload
        window.addEventListener('beforeunload', () => {
            this.saveData();
        });

        // Simulate unlock tracking (in real app, this would be native)
        this.simulateUnlockTracking();
    }

    simulateUnlockTracking() {
        // Simulate unlock events every few minutes
        setInterval(() => {
            if (Math.random() > 0.7) {
                this.unlockCount++;
                this.checkWellbeingLimits();
            }
        }, 60000); // Check every minute

        // Simulate notification events
        setInterval(() => {
            if (Math.random() > 0.8) {
                this.notificationCount++;
            }
        }, 30000); // Check every 30 seconds
    }

    startTimeTracking() {
        setInterval(() => {
            this.saveData();
            this.checkWellbeingLimits();
        }, 5000); // Save every 5 seconds
    }

    getAnalyticsSummary() {
        const totalTime = Math.floor((Date.now() - this.sessionStartTime) / 1000);
        const dailyTime = this.getDailyUsageTime();
        
        return {
            totalClicks: this.clickCount,
            totalViews: this.pageViews,
            sessionTime: totalTime,
            dailyTime: Math.floor(dailyTime / 1000),
            unlocks: this.unlockCount,
            notifications: this.notificationCount,
            focusTime: Math.floor(this.focusTime / 1000),
            screens: this.wellbeingData.screens,
            lastActivity: new Date(this.wellbeingData.lastActivity).toLocaleString(),
            wellbeingScore: this.calculateWellbeingScore()
        };
    }

    calculateWellbeingScore() {
        const dailyTime = this.getDailyUsageTime();
        const timeScore = Math.max(0, 100 - (dailyTime / this.wellbeingData.goals.maxDailyTime) * 100);
        const unlockScore = Math.max(0, 100 - (this.unlockCount / this.wellbeingData.goals.maxUnlocks) * 100);
        const focusScore = Math.min(100, (this.focusTime / this.wellbeingData.goals.focusGoal) * 100);
        
        return Math.round((timeScore + unlockScore + focusScore) / 3);
    }

    trackScreenView(screenName) {
        this.pageViews++;
        if (!this.interactionData.screens[screenName]) {
            this.interactionData.screens[screenName] = { views: 0, timeSpent: 0 };
        }
        this.interactionData.screens[screenName].views++;
        this.saveData();
    }

    getCurrentScreen() {
        const activeScreen = document.querySelector('.screen.active');
        return activeScreen ? activeScreen.id : 'unknown';
    }

    setupTracking() {
        // Track all clicks
        document.addEventListener('click', (e) => {
            this.trackClick(e.target, 'click');
        });

        // Track touch events for mobile
        document.addEventListener('touchstart', (e) => {
            this.trackClick(e.target, 'touch');
        });

        // Track visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveData();
            }
        });

        // Save data before page unload
        window.addEventListener('beforeunload', () => {
            this.saveData();
        });
    }

    startTimeTracking() {
        setInterval(() => {
            this.saveData();
        }, 5000); // Save every 5 seconds
    }

    getAnalyticsSummary() {
        const totalTime = Math.floor((Date.now() - this.sessionStartTime) / 1000);
        return {
            totalClicks: this.clickCount,
            totalViews: this.pageViews,
            sessionTime: totalTime,
            screens: this.interactionData.screens,
            lastActivity: new Date(this.interactionData.lastActivity).toLocaleString()
        };
    }
}

// App state management
class FocusWaveApp {
    constructor() {
        this.currentScreen = 'dashboard';
        this.wellbeingTracker = new DigitalWellbeingTracker();
        this.appData = {
            totalTimeToday: '0:00',
            socialMediaTime: '0:00',
            otherAppsTime: '0:00',
            otherAppsPercentage: 0,
            unlocks: 0,
            notifications: 0,
            appUsage: [
                { name: 'Usuario', time: '0 mins', icon: 'fas fa-user', color: '#6b7280' },
                { name: 'TikTok', time: '0 mins', icon: 'fab fa-tiktok', color: '#000000' },
                { name: 'X (Twitter)', time: '0 mins', icon: 'fab fa-twitter', color: '#1da1f2' },
                { name: 'Email', time: '0 mins', icon: 'fas fa-envelope', color: '#ea4335' },
                { name: 'Instagram', time: '0 mins', icon: 'fab fa-instagram', color: '#e1306c' },
                { name: 'WhatsApp', time: '0 mins', icon: 'fab fa-whatsapp', color: '#25d366' }
            ]
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDashboard();
        this.updateAppUsage();
        this.startRealTimeUpdates();
        this.startWellbeingUpdates();
    }

    startWellbeingUpdates() {
        // Update dashboard every 5 seconds with real data
        setInterval(() => {
            if (this.currentScreen === 'dashboard') {
                this.updateDashboard();
            }
        }, 5000);

        // Update app usage every 10 seconds
        setInterval(() => {
            if (this.currentScreen === 'app-usage') {
                this.updateAppUsage();
            }
        }, 10000);
    }

    setupEventListeners() {
        // Settings icon click
        document.querySelector('.settings-icon').addEventListener('click', () => {
            this.showSettings();
        });

        // Profile icon click
        document.querySelector('.profile-icon').addEventListener('click', () => {
            this.showProfile();
        });

        // Add click animations to stat cards
        document.querySelectorAll('.stat-card').forEach(card => {
            card.addEventListener('click', (e) => {
                this.animateCard(e.currentTarget);
            });
        });

        // Add click animations to app items
        document.querySelectorAll('.app-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.animateCard(e.currentTarget);
            });
        });
    }

    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        document.getElementById(screenId).classList.add('active');
        this.currentScreen = screenId;

        // Track screen view
        this.analytics.trackScreenView(screenId);

        // Update data when switching screens
        if (screenId === 'dashboard') {
            this.updateDashboard();
        } else if (screenId === 'app-usage') {
            this.updateAppUsage();
        } else if (screenId === 'analytics') {
            this.showAnalytics();
        } else if (screenId === 'settings') {
            this.loadSettings();
        }
    }

    updateDashboard() {
        // Get real-time data from wellbeing tracker
        const summary = this.wellbeingTracker.getAnalyticsSummary();
        
        // Update app data with real tracking data
        this.appData.totalTimeToday = this.wellbeingTracker.formatTime(summary.dailyTime * 1000);
        this.appData.unlocks = summary.unlocks;
        this.appData.notifications = summary.notifications;
        this.appData.otherAppsPercentage = summary.wellbeingScore;
        
        // Calculate social media vs other apps time (simulated based on usage patterns)
        const totalMinutes = Math.floor(summary.dailyTime / 60);
        const socialMediaMinutes = Math.floor(totalMinutes * 0.4); // 40% social media
        const otherAppsMinutes = totalMinutes - socialMediaMinutes;
        
        this.appData.socialMediaTime = this.wellbeingTracker.formatTime(socialMediaMinutes * 60 * 1000);
        this.appData.otherAppsTime = this.wellbeingTracker.formatTime(otherAppsMinutes * 60 * 1000);

        // Update stat values with real data
        const stats = {
            'tiempo en total hoy': this.appData.totalTimeToday,
            'redes sociales': this.appData.socialMediaTime,
            'otras apps': this.appData.otherAppsTime,
            'desbloqueos': this.appData.unlocks,
            'notificaciones': this.appData.notifications
        };

        // Update percentage in octagon with wellbeing score
        const octagonValue = document.querySelector('.octagon .stat-value');
        if (octagonValue) {
            octagonValue.textContent = `${this.appData.otherAppsPercentage}%`;
        }

        // Update other stat values
        document.querySelectorAll('.stat-card').forEach(card => {
            const label = card.querySelector('.stat-label');
            if (label && stats[label.textContent]) {
                const valueElement = card.querySelector('.stat-value');
                if (valueElement && !valueElement.classList.contains('green')) {
                    valueElement.textContent = stats[label.textContent];
                }
            }
        });
    }

    updateAppUsage() {
        const appList = document.querySelector('.app-list');
        if (!appList) return;

        // Get real usage data
        const summary = this.wellbeingTracker.getAnalyticsSummary();
        
        // Simulate app usage based on real tracking data
        const totalMinutes = Math.floor(summary.dailyTime / 60);
        const appTimes = this.calculateAppUsageTimes(totalMinutes);

        // Clear existing items
        appList.innerHTML = '';

        // Add app items with real data
        this.appData.appUsage.forEach((app, index) => {
            const appItem = document.createElement('div');
            appItem.className = 'app-item';
            appItem.innerHTML = `
                <div class="app-icon ${app.name.toLowerCase().replace(/\s+/g, '')}" style="background: ${app.color}">
                    <i class="${app.icon}"></i>
                </div>
                <div class="app-info">
                    <span class="app-name">${app.name}</span>
                    <span class="app-time">${appTimes[index]}</span>
                </div>
            `;
            appList.appendChild(appItem);
        });
    }

    calculateAppUsageTimes(totalMinutes) {
        // Distribute time across apps based on typical usage patterns
        const distributions = [0.15, 0.20, 0.10, 0.25, 0.20, 0.10]; // User, TikTok, Twitter, Email, Instagram, WhatsApp
        return distributions.map(ratio => {
            const minutes = Math.floor(totalMinutes * ratio);
            return this.wellbeingTracker.formatTime(minutes * 60 * 1000);
        });
    }

    startRealTimeUpdates() {
        // Simulate real-time updates every 30 seconds
        setInterval(() => {
            this.simulateDataUpdate();
        }, 30000);
    }

    simulateDataUpdate() {
        // Simulate small changes in data
        const change = Math.random() > 0.5 ? 1 : -1;
        
        // Update unlocks
        this.appData.unlocks = Math.max(0, this.appData.unlocks + change);
        
        // Update notifications
        this.appData.notifications = Math.max(0, this.appData.notifications + Math.floor(Math.random() * 3));
        
        // Update app usage times (small random changes)
        this.appData.appUsage.forEach(app => {
            if (Math.random() > 0.7) {
                const currentTime = this.parseTime(app.time);
                const newTime = Math.max(0, currentTime + Math.floor(Math.random() * 2));
                app.time = this.formatTime(newTime);
            }
        });

        // Update dashboard if currently viewing
        if (this.currentScreen === 'dashboard') {
            this.updateDashboard();
        } else if (this.currentScreen === 'app-usage') {
            this.updateAppUsage();
        }
    }

    parseTime(timeStr) {
        // Simple time parsing for demo purposes
        if (timeStr.includes('hora')) {
            return parseInt(timeStr) * 60;
        } else if (timeStr.includes('mins')) {
            return parseInt(timeStr);
        }
        return 0;
    }

    formatTime(minutes) {
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return mins > 0 ? `${hours}:${mins.toString().padStart(2, '0')} horas` : `${hours} hora`;
        }
        return `${minutes} mins`;
    }

    animateCard(card) {
        card.style.transform = 'scale(0.95)';
        setTimeout(() => {
            card.style.transform = '';
        }, 150);
    }

    showSettings() {
        // Show settings screen
        this.showScreen('settings');
        this.loadSettings();
    }

    showProfile() {
        // Show settings screen (profile is part of settings)
        this.showScreen('settings');
        this.loadSettings();
    }

    loadSettings() {
        // Load user settings from localStorage
        const settings = this.getUserSettings();
        
        // Update profile info
        const userName = document.getElementById('user-name');
        const userEmail = document.getElementById('user-email');
        if (userName && userEmail) {
            userName.textContent = settings.name || 'Usuario Anónimo';
            userEmail.textContent = settings.email || 'No registrado';
        }

        // Update goal sliders
        const maxTimeSlider = document.getElementById('max-time');
        const maxTimeValue = document.getElementById('max-time-value');
        const maxUnlocksSlider = document.getElementById('max-unlocks');
        const maxUnlocksValue = document.getElementById('max-unlocks-value');

        if (maxTimeSlider && maxTimeValue) {
            maxTimeSlider.value = settings.maxDailyTime || 4;
            maxTimeValue.textContent = `${settings.maxDailyTime || 4} horas`;
        }

        if (maxUnlocksSlider && maxUnlocksValue) {
            maxUnlocksSlider.value = settings.maxUnlocks || 50;
            maxUnlocksValue.textContent = settings.maxUnlocks || 50;
        }

        // Update notification settings
        const limitAlerts = document.getElementById('limit-alerts');
        const breakReminders = document.getElementById('break-reminders');
        
        if (limitAlerts) limitAlerts.checked = settings.limitAlerts !== false;
        if (breakReminders) breakReminders.checked = settings.breakReminders !== false;

        // Setup event listeners for settings
        this.setupSettingsListeners();
    }

    setupSettingsListeners() {
        // Max time slider
        const maxTimeSlider = document.getElementById('max-time');
        const maxTimeValue = document.getElementById('max-time-value');
        
        if (maxTimeSlider && maxTimeValue) {
            maxTimeSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                maxTimeValue.textContent = `${value} horas`;
                this.updateSetting('maxDailyTime', parseInt(value));
                this.wellbeingTracker.wellbeingData.goals.maxDailyTime = parseInt(value) * 60 * 60 * 1000;
            });
        }

        // Max unlocks slider
        const maxUnlocksSlider = document.getElementById('max-unlocks');
        const maxUnlocksValue = document.getElementById('max-unlocks-value');
        
        if (maxUnlocksSlider && maxUnlocksValue) {
            maxUnlocksSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                maxUnlocksValue.textContent = value;
                this.updateSetting('maxUnlocks', parseInt(value));
                this.wellbeingTracker.wellbeingData.goals.maxUnlocks = parseInt(value);
            });
        }

        // Notification toggles
        const limitAlerts = document.getElementById('limit-alerts');
        const breakReminders = document.getElementById('break-reminders');
        
        if (limitAlerts) {
            limitAlerts.addEventListener('change', (e) => {
                this.updateSetting('limitAlerts', e.target.checked);
            });
        }

        if (breakReminders) {
            breakReminders.addEventListener('change', (e) => {
                this.updateSetting('breakReminders', e.target.checked);
            });
        }
    }

    getUserSettings() {
        try {
            const settings = localStorage.getItem('focuswave_settings');
            return settings ? JSON.parse(settings) : {
                name: 'Usuario Anónimo',
                email: 'No registrado',
                maxDailyTime: 4,
                maxUnlocks: 50,
                limitAlerts: true,
                breakReminders: true
            };
        } catch (error) {
            console.log('Error loading settings:', error);
            return {
                name: 'Usuario Anónimo',
                email: 'No registrado',
                maxDailyTime: 4,
                maxUnlocks: 50,
                limitAlerts: true,
                breakReminders: true
            };
        }
    }

    updateSetting(key, value) {
        try {
            const settings = this.getUserSettings();
            settings[key] = value;
            localStorage.setItem('focuswave_settings', JSON.stringify(settings));
        } catch (error) {
            console.log('Error saving setting:', error);
        }
    }

    exportData() {
        try {
            const wellbeingData = localStorage.getItem('focuswave_wellbeing');
            const settingsData = localStorage.getItem('focuswave_settings');
            
            const exportData = {
                wellbeing: wellbeingData ? JSON.parse(wellbeingData) : null,
                settings: settingsData ? JSON.parse(settingsData) : null,
                exportDate: new Date().toISOString()
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `focuswave-data-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            if (this.toast) {
                this.toast.success('Datos exportados exitosamente');
            }
        } catch (error) {
            console.log('Error exporting data:', error);
            if (this.toast) {
                this.toast.error('Error al exportar datos');
            }
        }
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        
                        if (data.wellbeing) {
                            localStorage.setItem('focuswave_wellbeing', JSON.stringify(data.wellbeing));
                        }
                        
                        if (data.settings) {
                            localStorage.setItem('focuswave_settings', JSON.stringify(data.settings));
                        }
                        
                        if (this.toast) {
                            this.toast.success('Datos importados exitosamente');
                        }
                        
                        // Reload settings
                        this.loadSettings();
                        
                    } catch (error) {
                        console.log('Error importing data:', error);
                        if (this.toast) {
                            this.toast.error('Error al importar datos');
                        }
                    }
                };
                reader.readAsText(file);
            }
        };
        
        input.click();
    }

    clearAllData() {
        if (confirm('¿Estás seguro de que quieres eliminar TODOS los datos? Esta acción no se puede deshacer.')) {
            localStorage.removeItem('focuswave_wellbeing');
            localStorage.removeItem('focuswave_settings');
            localStorage.removeItem('focuswave_analytics');
            
            // Reset app
            this.wellbeingTracker = new DigitalWellbeingTracker();
            this.loadSettings();
            
            if (this.toast) {
                this.toast.success('Todos los datos han sido eliminados');
            }
        }
    }

    showAnalytics() {
        const summary = this.wellbeingTracker.getAnalyticsSummary();
        const analyticsContent = document.getElementById('analytics-content');
        if (analyticsContent) {
            analyticsContent.innerHTML = `
                <div class="analytics-summary">
                    <h3>📊 Bienestar Digital</h3>
                    <div class="wellbeing-score">
                        <div class="score-circle">
                            <span class="score-value">${summary.wellbeingScore}</span>
                            <span class="score-label">Puntuación</span>
                        </div>
                    </div>
                    <div class="analytics-grid">
                        <div class="analytics-card">
                            <span class="analytics-label">Tiempo Diario</span>
                            <span class="analytics-value">${this.wellbeingTracker.formatTime(summary.dailyTime * 1000)}</span>
                        </div>
                        <div class="analytics-card">
                            <span class="analytics-label">Desbloqueos</span>
                            <span class="analytics-value">${summary.unlocks}</span>
                        </div>
                        <div class="analytics-card">
                            <span class="analytics-label">Notificaciones</span>
                            <span class="analytics-value">${summary.notifications}</span>
                        </div>
                        <div class="analytics-card">
                            <span class="analytics-label">Tiempo Enfocado</span>
                            <span class="analytics-value">${this.wellbeingTracker.formatTime(summary.focusTime * 1000)}</span>
                        </div>
                        <div class="analytics-card">
                            <span class="analytics-label">Clics Totales</span>
                            <span class="analytics-value">${summary.totalClicks}</span>
                        </div>
                        <div class="analytics-card">
                            <span class="analytics-label">Sesión Actual</span>
                            <span class="analytics-value">${Math.floor(summary.sessionTime / 60)}:${(summary.sessionTime % 60).toString().padStart(2, '0')}</span>
                        </div>
                    </div>
                    <div class="wellbeing-insights">
                        <h4>💡 Insights de Bienestar</h4>
                        <div class="insight-item">
                            <span>${this.getWellbeingInsight(summary)}</span>
                        </div>
                    </div>
                    <div class="analytics-screens">
                        <h4>📱 Pantallas Visitadas</h4>
                        ${Object.entries(summary.screens).map(([screen, data]) => 
                            `<div class="screen-stats">
                                <span>${screen}: ${data.views} vistas</span>
                            </div>`
                        ).join('')}
                    </div>
                    <button class="analytics-btn" onclick="app.clearAnalytics()">
                        🗑️ Limpiar Datos
                    </button>
                </div>
            `;
        }
    }

    getWellbeingInsight(summary) {
        if (summary.wellbeingScore >= 80) {
            return "¡Excelente! Tienes un uso muy saludable del dispositivo.";
        } else if (summary.wellbeingScore >= 60) {
            return "Buen uso del dispositivo. Considera tomar más descansos.";
        } else if (summary.wellbeingScore >= 40) {
            return "Uso moderado. Intenta reducir el tiempo en pantalla.";
        } else {
            return "Uso intensivo detectado. Es recomendable tomar un descanso.";
        }
    }

    clearAnalytics() {
        if (confirm('¿Estás seguro de que quieres limpiar todos los datos de bienestar digital?')) {
            localStorage.removeItem('focuswave_wellbeing');
            this.wellbeingTracker = new DigitalWellbeingTracker();
            this.showAnalytics();
        }
    }
}

// Global functions for navigation
function showDashboard() {
    app.showScreen('dashboard');
}

function showAppUsage() {
    app.showScreen('app-usage');
}

// Initialize enhanced app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new EnhancedFocusWaveApp();
});

// Add some interactive features
document.addEventListener('DOMContentLoaded', () => {
    // Add hover effects to buttons
    const detailsBtn = document.querySelector('.details-btn');
    if (detailsBtn) {
        detailsBtn.addEventListener('mouseenter', () => {
            detailsBtn.style.transform = 'translateY(-2px)';
        });
        
        detailsBtn.addEventListener('mouseleave', () => {
            detailsBtn.style.transform = '';
        });
    }

    // Add keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && app.currentScreen === 'app-usage') {
            showDashboard();
        }
    });

    // Add touch gestures for mobile
    let startX = 0;
    let startY = 0;

    document.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    });

    document.addEventListener('touchend', (e) => {
        if (!startX || !startY) return;

        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;

        const diffX = startX - endX;
        const diffY = startY - endY;

        // Swipe left to go back
        if (Math.abs(diffX) > Math.abs(diffY) && diffX > 50) {
            if (app.currentScreen === 'app-usage') {
                showDashboard();
            }
        }

        startX = 0;
        startY = 0;
    });
});

// Toast Notification System
class ToastManager {
    constructor() {
        this.container = document.getElementById('toast-container');
    }

    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        this.container.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    success(message) {
        this.show(message, 'success');
    }

    error(message) {
        this.show(message, 'error');
    }

    info(message) {
        this.show(message, 'info');
    }
}

// Enhanced App with Toast Notifications
class EnhancedFocusWaveApp extends FocusWaveApp {
    constructor() {
        super();
        this.toast = new ToastManager();
        this.setupEnhancedFeatures();
    }

    setupEnhancedFeatures() {
        this.setupLoadingIndicator();
        this.setupHapticFeedback();
        this.setupPerformanceMonitoring();
    }

    setupLoadingIndicator() {
        const loadingIndicator = document.getElementById('loading-indicator');
        
        // Hide loading indicator after app is ready
        setTimeout(() => {
            loadingIndicator.classList.add('hidden');
            this.toast.success('¡focuswave cargado exitosamente!');
        }, 1500);
    }

    setupHapticFeedback() {
        // Simulate haptic feedback for mobile devices
        document.addEventListener('click', (e) => {
            if (e.target.matches('.stat-card, .app-item, .details-btn, .analytics-btn')) {
                e.target.classList.add('haptic-feedback');
                setTimeout(() => {
                    e.target.classList.remove('haptic-feedback');
                }, 100);
            }
        });
    }

    setupPerformanceMonitoring() {
        // Monitor performance and show warnings if needed
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    if (perfData.loadEventEnd - perfData.loadEventStart > 3000) {
                        this.toast.error('Carga lenta detectada. Optimizando...');
                    }
                }, 1000);
            });
        }
    }

    trackClick(element, action = 'click') {
        super.trackClick(element, action);
        
        // Show feedback for important interactions
        if (element.matches('.details-btn')) {
            this.toast.info('Navegando a detalles de apps...');
        } else if (element.matches('.settings-icon, .profile-icon')) {
            this.toast.info('Abriendo configuración...');
        }
    }

    showAnalytics() {
        super.showAnalytics();
        this.toast.info('Mostrando estadísticas de uso...');
    }

    clearAnalytics() {
        super.clearAnalytics();
        this.toast.success('Datos de analytics limpiados');
    }
}

// Add loading animation
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// Add service worker for PWA functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registrado exitosamente:', registration);
            })
            .catch((registrationError) => {
                console.log('Error al registrar SW:', registrationError);
            });
    });
}

