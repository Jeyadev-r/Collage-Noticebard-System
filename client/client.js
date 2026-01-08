const API_URL = 'http://localhost:5000';
let calendar;

// Show alert message
function showAlert(message, type = 'success') {
  const alertDiv = document.getElementById('alert-message');
  alertDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
  setTimeout(() => {
    alertDiv.innerHTML = '';
  }, 5000);
}

// Switch between login and signup tabs
function switchTab(tab) {
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const tabs = document.querySelectorAll('.tab-btn');

  tabs.forEach(t => t.classList.remove('active'));

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    tabs[0].classList.add('active');
  } else {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    tabs[1].classList.add('active');
  }
}

// Update UI based on authentication
function updateUI() {
  const authScreen = document.getElementById('auth-screen');
  const dashboard = document.getElementById('dashboard');

  if (auth.isLoggedIn()) {
    const user = auth.getUser();
    
    // Hide auth, show dashboard
    authScreen.classList.add('hidden');
    dashboard.classList.remove('hidden');

    // Update header
    document.getElementById('header-username').textContent = user.fullName || user.email;
    document.getElementById('header-role').textContent = user.role.toUpperCase();
    document.getElementById('header-avatar').textContent = (user.fullName || user.email).charAt(0).toUpperCase();

    // Update profile
    document.getElementById('profile-name').textContent = user.fullName || 'N/A';
    document.getElementById('profile-email').textContent = user.email;
    document.getElementById('profile-role').textContent = user.role;
    document.getElementById('profile-program').textContent = user.program;

    // Show/hide menu items based on role
    console.log('User role:', user.role);
    console.log('Can create notices:', auth.canCreateNotices());
    
    if (auth.isAdmin()) {
      document.querySelectorAll('.admin-only').forEach(el => {
        el.classList.remove('hidden');
        console.log('Showing admin element:', el);
      });
      document.querySelectorAll('.faculty-only').forEach(el => {
        el.classList.remove('hidden');
        console.log('Showing faculty element:', el);
      });
    } else if (auth.canCreateNotices()) {
      document.querySelectorAll('.faculty-only').forEach(el => {
        el.classList.remove('hidden');
        console.log('Showing faculty element:', el);
      });
    }

    // Load initial data
    loadNotices();
    
    // Load admin stats if admin
    if (auth.isAdmin() && typeof loadAdminStats === 'function') {
      loadAdminStats();
    }
    
    switchView('dashboard');
  } else {
    authScreen.classList.remove('hidden');
    dashboard.classList.add('hidden');
  }
}

// Switch views - UPDATED WITH DATA LOADING
function switchView(viewName) {
  console.log('Switching to view:', viewName);
  
  // Hide all views
  document.querySelectorAll('.view-content').forEach(view => {
    view.classList.remove('active');
  });

  // Remove active from all menu items
  document.querySelectorAll('.menu-item').forEach(item => {
    item.classList.remove('active');
  });

  // Show selected view
  const viewElement = document.getElementById(`view-${viewName}`);
  if (viewElement) {
    viewElement.classList.add('active');
    console.log('View element found and activated');
  } else {
    console.error('View element not found:', `view-${viewName}`);
  }

  // Add active to clicked menu item
  const activeMenuItem = document.querySelector(`[data-view="${viewName}"]`);
  if (activeMenuItem) {
    activeMenuItem.classList.add('active');
  }

  // Update page title
  const titles = {
    'dashboard': 'Dashboard',
    'announcements': 'Announcements',
    'calendar': 'Calendar',
    'users': 'User Management',
    'create-notice': 'Create Notice',
    'profile': 'My Profile'
  };
  document.getElementById('page-title').textContent = titles[viewName] || 'Dashboard';

  // Load data for specific views - IMPORTANT
  if (viewName === 'dashboard') {
    console.log('Loading dashboard data...');
    loadNotices();
    if (auth.isAdmin() && typeof loadAdminStats === 'function') {
      loadAdminStats();
    }
  } else if (viewName === 'announcements') {
    console.log('Loading announcements...');
    loadNotices();
  } else if (viewName === 'users' && auth.isAdmin()) {
    console.log('Loading users...');
    if (typeof loadUsers === 'function') {
      loadUsers();
    } else {
      console.error('loadUsers function not found');
    }
  } else if (viewName === 'calendar') {
    console.log('Loading calendar...');
    initCalendar();
  }
}

// Menu item click handlers
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function() {
      const view = this.getAttribute('data-view');
      if (view) {
        switchView(view);
      }
    });
  });

  updateUI();
});

// Logout
function logout() {
  auth.clear();
  location.reload();
}

// Login form submission
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      auth.save(data.token, data.user);
      updateUI();
    } else {
      const msgBox = document.getElementById('auth-message');
      msgBox.className = 'message-box error show';
      msgBox.textContent = data.message || 'Login failed';
    }
  } catch (error) {
    const msgBox = document.getElementById('auth-message');
    msgBox.className = 'message-box error show';
    msgBox.textContent = 'Network error: ' + error.message;
  }
});

// Signup form submission
document.getElementById('signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const userData = {
    fullName: document.getElementById('signup-fullname').value,
    email: document.getElementById('signup-email').value,
    password: document.getElementById('signup-password').value,
    role: document.getElementById('signup-role').value,
    program: document.getElementById('signup-program').value
  };

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (response.ok) {
      auth.save(data.token, data.user);
      updateUI();
    } else {
      const msgBox = document.getElementById('auth-message');
      msgBox.className = 'message-box error show';
      msgBox.textContent = data.message || 'Registration failed';
    }
  } catch (error) {
    const msgBox = document.getElementById('auth-message');
    msgBox.className = 'message-box error show';
    msgBox.textContent = 'Network error: ' + error.message;
  }
});

// Load notices - WITH BETTER ERROR HANDLING
async function loadNotices() {
  console.log('loadNotices called');
  try {
    const response = await fetch(`${API_URL}/api/notices`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const notices = await response.json();
    console.log('Notices loaded:', notices.length);

    displayNotices(notices, 'recent-notices', 5);
    displayNotices(notices, 'all-notices');
  } catch (error) {
    console.error('Failed to load notices:', error);
    showAlert('Failed to load notices: ' + error.message, 'error');
  }
}

// Display notices - WITH BETTER ERROR HANDLING
function displayNotices(notices, containerId, limit = null) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error('Container not found:', containerId);
    return;
  }

  const displayNotices = limit ? notices.slice(0, limit) : notices;

  if (displayNotices.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #6B7280; padding: 40px;">No notices available yet.</p>';
    return;
  }

  container.innerHTML = displayNotices.map(notice => `
    <div class="notice-card">
      ${notice.imageName ? `<img src="/uploads/${notice.imageName}" class="notice-image" alt="${notice.title}" onerror="this.style.display='none'">` : ''}
      <div class="notice-title">${notice.title}</div>
      <div class="notice-body">${notice.body}</div>
      <div class="notice-meta">
        <span class="badge badge-${notice.priority || 'medium'}">${(notice.priority || 'medium').toUpperCase()}</span>
        <span>📍 ${notice.department}</span>
        <span>📅 ${new Date(notice.publishedAt).toLocaleDateString()}</span>
        ${notice.eventDate ? `<span>🗓️ Event: ${new Date(notice.eventDate).toLocaleDateString()}</span>` : ''}
        <span>👤 ${notice.createdBy?.fullName || notice.createdBy?.email || 'Unknown'}</span>
      </div>
      ${auth.canCreateNotices() ? `
        <div class="notice-actions">
          <button class="btn btn-danger" style="padding: 8px 16px; font-size: 12px;" onclick="deleteNotice('${notice._id}')">Delete</button>
        </div>
      ` : ''}
    </div>
  `).join('');
}

// Create notice form submission
document.getElementById('create-notice-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  await createNotice('create-notice-form');
});

// Modal notice form submission  
document.getElementById('modal-notice-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  await createNotice('modal-notice-form');
  closeCreateNoticeModal();
});

// Create notice function
async function createNotice(formId) {
  const form = document.getElementById(formId);
  const formData = new FormData();

  const prefix = formId === 'create-notice-form' ? 'notice' : 'modal-notice';
  
  formData.append('title', document.getElementById(`${prefix}-title`).value);
  formData.append('body', document.getElementById(`${prefix}-body`).value);
  formData.append('department', document.getElementById(`${prefix}-department`).value);
  formData.append('priority', document.getElementById(`${prefix}-priority`).value);
  
  const eventDate = document.getElementById(`${prefix}-event-date`).value;
  if (eventDate) {
    formData.append('eventDate', eventDate);
  }

  const imageInput = document.getElementById(`${prefix}-image`);
  if (imageInput && imageInput.files[0]) {
    formData.append('image', imageInput.files[0]);
  }

  try {
    const response = await fetch(`${API_URL}/api/notices`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${auth.getToken()}`
      },
      body: formData
    });

    const data = await response.json();

    if (response.ok) {
      showAlert('Notice created successfully!', 'success');
      form.reset();
      loadNotices();
      switchView('announcements');
    } else {
      showAlert(data.message || 'Failed to create notice', 'error');
    }
  } catch (error) {
    showAlert('Network error: ' + error.message, 'error');
  }
}

// Delete notice
async function deleteNotice(id) {
  if (!confirm('Are you sure you want to delete this notice?')) return;

  try {
    const response = await fetch(`${API_URL}/api/notices/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${auth.getToken()}`
      }
    });

    if (response.ok) {
      showAlert('Notice deleted successfully!', 'success');
      loadNotices();
    } else {
      const data = await response.json();
      showAlert(data.message || 'Failed to delete notice', 'error');
    }
  } catch (error) {
    showAlert('Network error: ' + error.message, 'error');
  }
}

// Show create notice modal
function showCreateNoticeModal() {
  document.getElementById('create-notice-modal').classList.add('active');
}

// Close create notice modal
function closeCreateNoticeModal() {
  document.getElementById('create-notice-modal').classList.remove('active');
  document.getElementById('modal-notice-form').reset();
}

// Initialize calendar - WITH ERROR HANDLING
function initCalendar() {
  console.log('initCalendar called');
  
  if (calendar) {
    calendar.refetchEvents();
    return;
  }

  const calendarEl = document.getElementById('calendar');
  if (!calendarEl) {
    console.error('Calendar element not found');
    return;
  }

  if (typeof FullCalendar === 'undefined') {
    console.error('FullCalendar library not loaded');
    calendarEl.innerHTML = '<p style="text-align: center; padding: 40px; color: #EF4444;">Calendar library failed to load. Please check your internet connection.</p>';
    return;
  }

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,listWeek'
    },
    events: async function(info, successCallback, failureCallback) {
      try {
        const response = await fetch(`${API_URL}/api/notices/calendar`);
        const events = await response.json();
        console.log('Calendar events loaded:', events.length);
        successCallback(events);
      } catch (error) {
        console.error('Calendar error:', error);
        failureCallback(error);
        showAlert('Failed to load calendar events', 'error');
      }
    },
    eventClick: function(info) {
      alert('Event: ' + info.event.title + '\n\nDescription: ' + (info.event.extendedProps.description || 'No description'));
    }
  });
  
  calendar.render();
  console.log('Calendar rendered');
}

// Image preview for notice creation
document.getElementById('notice-image')?.addEventListener('change', function(e) {
  const file = e.target.files[0];
  const preview = document.getElementById('image-preview');
  
  if (file && preview) {
    const reader = new FileReader();
    reader.onload = function(e) {
      preview.innerHTML = `<img src="${e.target.result}" style="max-width: 200px; max-height: 200px; border-radius: 8px; margin-top: 10px;">`;
    };
    reader.readAsDataURL(file);
  }
});

document.getElementById('modal-notice-image')?.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    console.log('Image selected:', file.name);
  }
});

console.log('✅ Client application ready');
console.log('📍 API URL:', API_URL);

