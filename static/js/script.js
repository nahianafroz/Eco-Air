let currentUser = null;
let userData = {
    points: 0,
    trees: 0,
    co2Reduced: 0,
    activities: []
};

let currentCity = '';
let aqiHistory = [];
let ecoActions = [];


const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const aqiDashboard = document.getElementById('aqi-dashboard');
const pollutionTips = document.getElementById('pollution-tips');
const historicalData = document.getElementById('historical-data');
const impactSection = document.getElementById('impact-section');
const aqiValue = document.getElementById('aqi-value');
const aqiStatus = document.getElementById('aqi-status');
const cityName = document.getElementById('city-name');
const pm25Value = document.getElementById('pm25-value');
const pm25Status = document.getElementById('pm25-status');
const pm10Value = document.getElementById('pm10-value');
const pm10Status = document.getElementById('pm10-status');
const co2Value = document.getElementById('co2-value');
const co2Status = document.getElementById('co2-status');
const tipsContainer = document.getElementById('tips-container');
const treeCount = document.getElementById('tree-count');
const badgesContainer = document.getElementById('badges-container');
const treeInput = document.getElementById('tree-input');
const energyInput = document.getElementById('energy-input');
const logActionBtn = document.getElementById('log-action-btn');
const pointsValue = document.getElementById('points-value');
const co2Reduced = document.getElementById('co2-reduced');
const carsOffset = document.getElementById('cars-offset');
const airPurified = document.getElementById('air-purified');
const oxygenProduced = document.getElementById('oxygen-produced');

const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userProfile = document.getElementById('user-profile');
const usernameDisplay = document.getElementById('username-display');
const loginModal = document.getElementById('login-modal');
const signupModal = document.getElementById('signup-modal');
const forgotModal = document.getElementById('forgot-modal');
const closeModals = document.querySelectorAll('.close-modal');
const showSignupBtn = document.getElementById('show-signup');
const showLoginBtn = document.getElementById('show-login');
const forgotPasswordBtn = document.getElementById('forgot-password');
const backToLoginBtn = document.getElementById('back-to-login');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const forgotForm = document.getElementById('forgot-form');

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    console.log('Initializing EcoAir App...');
    console.log('Window userData:', window.userData);
    console.log('Window isLoggedIn:', window.isLoggedIn);
    
    if (window.userData && window.isLoggedIn) {
        currentUser = {
            id: window.userData.id,
            username: window.userData.username,
            email: window.userData.email
        };
        userData.points = window.userData.eco_points || 0;
        userData.trees = window.userData.total_trees || 0;
        userData.co2Reduced = window.userData.total_co2_reduced || 0;
        
        console.log('User initialized from Flask:', currentUser);
    }
    
    checkAuthentication();
    loadFromLocalStorage();
    updateBadges();
    renderAqiChart();
    setupRewardsShop();
    setupEventListeners();
    updateUI();
}

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Search functionality
    if (searchBtn) {
        searchBtn.addEventListener('click', searchCity);
    }
    
    if (logActionBtn) {
        logActionBtn.addEventListener('click', logEcoAction);
    }
    
    // Login system 
    if (loginBtn) {
        loginBtn.addEventListener('click', () => showModal(loginModal));
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutUser);
    }
    
    if (showSignupBtn) {
        showSignupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            hideModal(loginModal);
            showModal(signupModal);
        });
    }
    
    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            hideModal(signupModal);
            showModal(loginModal);
        });
    }
    
    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', (e) => {
            e.preventDefault();
            hideModal(loginModal);
            showModal(forgotModal);
        });
    }
    
    if (backToLoginBtn) {
        backToLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            hideModal(forgotModal);
            showModal(loginModal);
        });
    }
    
    closeModals.forEach(btn => {
        btn.addEventListener('click', () => {
            hideModal(loginModal);
            hideModal(signupModal);
            hideModal(forgotModal);
        });
    });
    
    // Form submissions
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    if (forgotForm) {
        forgotForm.addEventListener('submit', handleForgotPassword);
    }
    
    
    if (cityInput) {
        cityInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchCity();
            }
        });
    }
    
    
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) hideModal(loginModal);
        if (e.target === signupModal) hideModal(signupModal);
        if (e.target === forgotModal) hideModal(forgotModal);
    });
}


async function checkAuthentication() {
    try {
       
        if (window.userData && window.isLoggedIn) {
            updateUIForUser();
            updateUI();
            return;
        }
        
 
        const response = await fetch('/api/user-data');
        if (response.ok) {
            const data = await response.json();
            if (!data.error) {
                currentUser = {
                    id: data.id,
                    username: data.username,
                    email: data.email
                };
                userData.points = data.eco_points || 0;
                userData.trees = data.total_trees || 0;
                userData.co2Reduced = data.total_co2_reduced || 0;
                
                updateUIForUser();
                updateUI();
            }
        }
    } catch (error) {
        console.log('User not logged in or server error');
        loadFromLocalStorage();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(loginForm);
    const username = formData.get('username');
    const password = formData.get('password');
    
    console.log('Attempting login for:', username);
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Login successful!', 'success');
            hideModal(loginModal);
            loginForm.reset();
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showNotification(result.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Login failed. Please try again.', 'error');
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const formData = new FormData(signupForm);
    const username = formData.get('username');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirm-password');
    const fullname = formData.get('fullname');
    
    console.log('Attempting registration for:', username);
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                email: email,
                password: password,
                fullname: fullname
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Registration successful!', 'success');
            hideModal(signupModal);
           
            signupForm.reset();
        
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showNotification(result.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Registration failed. Please try again.', 'error');
    }
}

function handleForgotPassword(e) {
    e.preventDefault();
    const formData = new FormData(forgotForm);
    const email = formData.get('email');
    
    showNotification(`Password reset link sent to ${email}`, 'success');
    hideModal(forgotModal);
    showModal(loginModal);
    forgotForm.reset();
}

function updateUIForUser() {
    console.log('Updating UI for user:', currentUser);
    
    if (currentUser && userProfile) {
        if (loginBtn) loginBtn.classList.add('hidden');
        userProfile.classList.remove('hidden');
        if (usernameDisplay) usernameDisplay.textContent = currentUser.username || 'User';
    } else if (loginBtn && userProfile) {
        loginBtn.classList.remove('hidden');
        userProfile.classList.add('hidden');
    }
}

async function logoutUser() {
    try {
        const response = await fetch('/logout');
        if (response.ok) {
            currentUser = null;
            userData = { points: 0, trees: 0, co2Reduced: 0, activities: [] };
            updateUIForUser();
            updateUI();
            showNotification('Logged out successfully', 'success');
            
            
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        }
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Logout failed', 'error');
    }
}

// ==================== DATA MANAGEMENT ====================

async function updateServerData(updates) {
    if (currentUser) {
        try {
            const response = await fetch('/api/update-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates)
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                console.log('Data updated on server');
                return true;
            } else {
                console.error('Failed to update server data:', result.message);
                return false;
            }
        } catch (error) {
            console.error('Error updating server data:', error);
            return false;
        }
    }
    return false;
}

function loadFromLocalStorage() {
   
    if (!currentUser) {
        const savedData = localStorage.getItem('ecoAirData');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                userData.points = data.points || 0;
                userData.trees = data.trees || 0;
                userData.co2Reduced = data.co2Reduced || 0;
                userData.activities = data.activities || [];
                
                currentCity = data.currentCity || '';
                aqiHistory = data.aqiHistory || [];
                ecoActions = data.ecoActions || [];
                
                console.log('Loaded data from localStorage');
            } catch (e) {
                console.error('Error loading from localStorage:', e);
            }
        }
    }
}

function saveToLocalStorage() {
   
    if (!currentUser) {
        const dataToSave = {
            points: userData.points,
            trees: userData.trees,
            co2Reduced: userData.co2Reduced,
            activities: userData.activities,
            currentCity: currentCity,
            aqiHistory: aqiHistory,
            ecoActions: ecoActions
        };
        localStorage.setItem('ecoAirData', JSON.stringify(dataToSave));
    }
}



function updateUI() {
    console.log('Updating UI with points:', userData.points);
    
   
    const pointsElements = document.querySelectorAll('#points-value, .points-value');
    const treesElements = document.querySelectorAll('#tree-count, .tree-count');
    const co2Elements = document.querySelectorAll('#co2-reduced, .impact-value');
    
    pointsElements.forEach(el => {
        if (el.id === 'points-value' || el.classList.contains('points-value')) {
            el.textContent = userData.points;
        }
    });
    
    treesElements.forEach(el => {
        if (el.id === 'tree-count' || el.classList.contains('tree-count')) {
            el.textContent = userData.trees;
        }
    });
    
    co2Elements.forEach(el => {
        if (el.id === 'co2-reduced' || el.textContent.includes('CO₂')) {
            el.textContent = userData.co2Reduced.toFixed(1);
        }
    });
    

    const oxygenPerTree = 118;
    const airPurifiedPerTree = 260;
    const totalOxygen = userData.trees * oxygenPerTree;
    const totalAirPurified = userData.trees * airPurifiedPerTree;
    const carsEquivalent = Math.round(userData.co2Reduced / 2300);
    
    if (oxygenProduced) oxygenProduced.textContent = totalOxygen;
    if (airPurified) airPurified.textContent = totalAirPurified;
    if (carsOffset) carsOffset.textContent = carsEquivalent;
}


function searchCity() {
    if (!cityInput) return;
    
    const city = cityInput.value.trim();
    
    if (!city) {
        alert('Please enter a city name');
        return;
    }
    
    currentCity = city;
    
   
    const mockData = generateMockAirQualityData(city);
    displayAirQualityData(mockData);
    
    
    saveToHistory(mockData);
    
   
    if (aqiDashboard) aqiDashboard.classList.remove('hidden');
    if (pollutionTips) pollutionTips.classList.remove('hidden');
    if (historicalData) historicalData.classList.remove('hidden');
    if (impactSection) impactSection.classList.remove('hidden');
    
 
    generatePollutionTips(mockData.aqi);
    

    addPoints(5, "Checked air quality");
}


function displayAirQualityData(data) {
    if (!aqiValue) return;
    
    aqiValue.textContent = data.aqi;
    cityName.textContent = data.city;
    

    const aqiLevel = getAqiLevel(data.aqi);
    aqiStatus.textContent = aqiLevel.text;
    aqiStatus.className = 'aqi-status ' + aqiLevel.class;
    

    if (pm25Value) {
        pm25Value.textContent = data.pm25;
        pm25Status.textContent = getPollutantStatus('pm25', data.pm25).text;
        pm25Status.className = 'pollutant-status ' + getPollutantStatus('pm25', data.pm25).class;
    }
    
    if (pm10Value) {
        pm10Value.textContent = data.pm10;
        pm10Status.textContent = getPollutantStatus('pm10', data.pm10).text;
        pm10Status.className = 'pollutant-status ' + getPollutantStatus('pm10', data.pm10).class;
    }
    
    if (co2Value) {
        co2Value.textContent = data.co2;
        co2Status.textContent = getPollutantStatus('co2', data.co2).text;
        co2Status.className = 'pollutant-status ' + getPollutantStatus('co2', data.co2).class;
    }
}


function generatePollutionTips(aqi) {
    if (!tipsContainer) return;
    
    tipsContainer.innerHTML = '';
    
    let tips = [];
    
    if (aqi <= 50) {
        tips = [
            {
                title: "Great Air Quality! 🌤️",
                content: "The air is clean and healthy. Perfect day for outdoor activities like walking, jogging, or cycling."
            },
            {
                title: "Plant More Trees 🌱",
                content: "Take advantage of the good air quality to plant trees in your neighborhood. Every tree helps filter air pollutants!"
            },
            {
                title: "Spread Awareness 📢",
                content: "Share information about air quality with friends and family to encourage eco-friendly habits."
            }
        ];
    } else if (aqi <= 100) {
        tips = [
            {
                title: "Moderate Air Quality 📊",
                content: "Air quality is acceptable, but sensitive individuals should consider reducing prolonged outdoor exertion."
            },
            {
                title: "Use Eco Transportation 🚲",
                content: "Help reduce pollution by using bicycle, walking, or carpooling instead of driving alone."
            },
            {
                title: "Indoor Air Quality 🏠",
                content: "Keep indoor air clean by ventilating your home when outdoor air quality is better."
            }
        ];
    } else if (aqi <= 150) {
        tips = [
            {
                title: "Unhealthy for Sensitive Groups ⚠️",
                content: "Children, elderly, and people with respiratory conditions should limit outdoor activities."
            },
            {
                title: "Wear a Mask 😷",
                content: "Consider wearing a mask if you need to spend time outdoors, especially near high-traffic areas."
            },
            {
                title: "Reduce Energy Consumption 💡",
                content: "Turn off lights and electronics when not in use to reduce power plant emissions."
            }
        ];
    } else {
        tips = [
            {
                title: "Unhealthy to Hazardous Air 🚨",
                content: "Avoid outdoor activities. Stay indoors with windows closed and use an air purifier if available."
            },
            {
                title: "Wear N95 Mask 🎭",
                content: "If you must go outside, wear an N95 mask to protect yourself from harmful particles."
            },
            {
                title: "Emergency Measures 🆘",
                content: "Follow local health advisories. Consider relocating if air quality remains hazardous for extended periods."
            }
        ];
    }
    
  
    tips.push({
        title: "Plant Trees for Cleaner Air 🌳",
        content: "Trees absorb pollutants and release oxygen. Consider joining or organizing tree planting initiatives."
    });
    
  
    tips.forEach(tip => {
        const tipElement = document.createElement('div');
        tipElement.className = 'tip-card';
        tipElement.innerHTML = `
            <h3>${tip.title}</h3>
            <p>${tip.content}</p>
        `;
        tipsContainer.appendChild(tipElement);
    });
}


async function logEcoAction() {
    if (!treeInput || !energyInput) return;
    
    const trees = parseInt(treeInput.value) || 0;
    const energySaved = parseInt(energyInput.value) || 0;
    
  
    const transportOption = document.querySelector('input[name="transport"]:checked');
    const transportType = transportOption ? transportOption.value : null;
    
    if (trees === 0 && energySaved === 0 && !transportType) {
        alert('Please log at least one eco action');
        return;
    }
    
    let pointsEarned = 0;
    let actionDescription = "";
    let co2Reduction = 0;
    

    if (trees > 0) {
        pointsEarned += trees * 10;
        actionDescription += `Planted ${trees} trees, `;
        
   
        userData.trees += trees;
        
 
        const co2PerTree = 22; 
        co2Reduction += trees * co2PerTree;
    }
    
    if (transportType) {
        pointsEarned += 50;
        actionDescription += `Used ${transportType} transport, `;
        
      
        const transportCO2 = {
            walking: 5,
            bicycle: 5,
            carpool: 15,
            electric: 10
        };
        co2Reduction += transportCO2[transportType] || 0;
    }
    
    if (energySaved > 0) {
        pointsEarned += energySaved * 5;
        actionDescription += `Saved ${energySaved} kWh energy, `;
        
   
        co2Reduction += energySaved * 0.5;
    }
    

    userData.points += pointsEarned;
    userData.co2Reduced += co2Reduction;
    
    
    const action = {
        date: new Date().toISOString(),
        trees: trees,
        transport: transportType,
        energySaved: energySaved,
        pointsEarned: pointsEarned,
        co2Reduced: co2Reduction
    };
    
    userData.activities.push(action);
    ecoActions.push(action);
    

    if (currentUser) {
        const serverUpdated = await updateServerData({
            points: pointsEarned,
            trees: trees,
            co2: co2Reduction,
            energy_saved: energySaved,
            activity_type: 'eco_action',
            transport_type: transportType
        });
        
        if (!serverUpdated) {
            showNotification('Action logged locally (server update failed)', 'warning');
        }
    }
    
   
    updateUI();
    updateBadges();
    addPoints(pointsEarned, actionDescription.slice(0, -2));
    

    saveToLocalStorage();
    

    treeInput.value = '0';
    energyInput.value = '0';
    if (transportOption) transportOption.checked = false;
}


function addPoints(points, reason) {
    showNotification(`+${points} points! ${reason}`, 'success');
}


function setupRewardsShop() {
    const redeemButtons = document.querySelectorAll('.redeem-btn');
    
    redeemButtons.forEach(button => {
        button.addEventListener('click', function() {
            const rewardItem = this.closest('.reward-item');
            const cost = parseInt(rewardItem.dataset.cost);
            const rewardName = rewardItem.querySelector('h4').textContent;
            
            if (userData.points >= cost) {
                userData.points -= cost;
                updateUI();
                
                if (currentUser) {
                    updateServerData({
                        points: -cost,
                        trees: 0,
                        co2: 0
                    });
                }
                
                showNotification(`Successfully redeemed ${rewardName}!`, 'success');
                saveToLocalStorage();
            } else {
                showNotification(`Not enough points! Need ${cost - userData.points} more points.`, 'error');
            }
        });
    });
}


function updateBadges() {
    if (!badgesContainer) return;
    
    badgesContainer.innerHTML = '';
    
    const badges = [
        { 
            id: 'beginner', 
            name: 'Beginner Planter', 
            icon: 'seedling', 
            threshold: 5,
            description: 'Plant 5 trees',
            progress: Math.min(userData.trees, 5)
        },
        { 
            id: 'enthusiast', 
            name: 'Tree Enthusiast', 
            icon: 'tree', 
            threshold: 20,
            description: 'Plant 20 trees',
            progress: Math.min(userData.trees, 20)
        },
        { 
            id: 'hero', 
            name: 'Eco Hero', 
            icon: 'award', 
            threshold: 50,
            description: 'Plant 50 trees',
            progress: Math.min(userData.trees, 50)
        },
        { 
            id: 'champion', 
            name: 'Planet Champion', 
            icon: 'globe-americas', 
            threshold: 100,
            description: 'Plant 100 trees',
            progress: Math.min(userData.trees, 100)
        }
    ];
    
    badges.forEach(badge => {
        const badgeElement = document.createElement('div');
        badgeElement.className = 'badge';
        
        const unlocked = badge.progress >= badge.threshold;
        if (unlocked) {
            badgeElement.classList.add('unlocked');
        }
        
        const progressPercent = (badge.progress / badge.threshold) * 100;
        
        badgeElement.innerHTML = `
            <i class="fas fa-${badge.icon}"></i>
            <div class="badge-info">
                <div class="badge-name">${badge.name}</div>
                <div class="badge-desc">${badge.description}</div>
                <div class="badge-progress">
                    <div class="progress-bar" style="width: ${progressPercent}%"></div>
                </div>
            </div>
        `;
        
        badgesContainer.appendChild(badgeElement);
    });
}


function renderAqiChart() {
    const ctx = document.getElementById('aqi-chart');
    if (!ctx) return;
    
 
    const labels = [];
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        
       
        data.push(Math.floor(Math.random() * 130) + 20);
    }
    
  
    if (window.aqiChartInstance) {
        window.aqiChartInstance.destroy();
    }
    
    window.aqiChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'AQI',
                data: data,
                borderColor: '#2ecc71',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'AQI Value'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            }
        }
    });
}


function showNotification(message, type = 'success') {
 
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        background: ${type === 'error' ? '#e74c3c' : type === 'warning' ? '#f39c12' : '#2ecc71'};
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}


function showModal(modal) {
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; 
    }
}

function hideModal(modal) {
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = ''; 
    }
}


function getAqiLevel(aqi) {
    if (aqi <= 50) {
        return { text: 'Good', class: 'aqi-good' };
    } else if (aqi <= 100) {
        return { text: 'Moderate', class: 'aqi-moderate' };
    } else if (aqi <= 150) {
        return { text: 'Unhealthy', class: 'aqi-unhealthy' };
    } else {
        return { text: 'Hazardous', class: 'aqi-hazardous' };
    }
}


function getPollutantStatus(pollutant, value) {
  
    let thresholds = {
        pm25: { good: 12, moderate: 35, unhealthy: 55 },
        pm10: { good: 54, moderate: 154, unhealthy: 254 },
        co2: { good: 400, moderate: 800, unhealthy: 1200 }
    };
    
    const pollutantThresholds = thresholds[pollutant];
    
    if (value <= pollutantThresholds.good) {
        return { text: 'Good', class: 'aqi-good' };
    } else if (value <= pollutantThresholds.moderate) {
        return { text: 'Moderate', class: 'aqi-moderate' };
    } else if (value <= pollutantThresholds.unhealthy) {
        return { text: 'Unhealthy', class: 'aqi-unhealthy' };
    } else {
        return { text: 'Hazardous', class: 'aqi-hazardous' };
    }
}


function saveToHistory(data) {
    aqiHistory.push({
        date: new Date().toISOString(),
        city: data.city,
        aqi: data.aqi,
        pm25: data.pm25,
        pm10: data.pm10,
        co2: data.co2
    });
    

    if (aqiHistory.length > 30) {
        aqiHistory = aqiHistory.slice(-30);
    }
    
    saveToLocalStorage();
}


function generateMockAirQualityData(city) {
    const baseAQI = Math.floor(Math.random() * 150) + 20;
    
    return {
        city: city,
        aqi: baseAQI,
        pm25: Math.floor(baseAQI * 0.8 + Math.random() * 10),
        pm10: Math.floor(baseAQI * 1.2 + Math.random() * 15),
        co2: Math.floor(400 + baseAQI * 5 + Math.random() * 100)
    };
}


window.showNotification = showNotification;
window.userData = userData;
window.currentUser = currentUser;
window.addPoints = addPoints;
window.logEcoAction = logEcoAction;
window.searchCity = searchCity;