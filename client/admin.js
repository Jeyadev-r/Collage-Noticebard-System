// Load admin statistics
async function loadAdminStats() {
  console.log('📊 Loading admin stats...');
  
  try {
    const response = await fetch(`${API_URL}/api/admin/stats`, {
      headers: {
        'Authorization': `Bearer ${auth.getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const stats = await response.json();
    console.log('✅ Stats loaded:', stats);

    if (document.getElementById('stat-users')) {
      document.getElementById('stat-users').textContent = stats.totalUsers || 0;
    }
    if (document.getElementById('stat-students')) {
      document.getElementById('stat-students').textContent = stats.totalStudents || 0;
    }
    if (document.getElementById('stat-faculty')) {
      document.getElementById('stat-faculty').textContent = stats.totalFaculty || 0;
    }
    if (document.getElementById('stat-notices')) {
      document.getElementById('stat-notices').textContent = stats.totalNotices || 0;
    }
  } catch (error) {
    console.error('❌ Failed to load stats:', error);
  }
}

// Load all users
async function loadUsers() {
  console.log('🔄 Loading users...');
  
  try {
    const token = auth.getToken();
    console.log('📝 Token exists:', !!token);
    
    const response = await fetch(`${API_URL}/api/admin/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('📊 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      throw new Error(`Failed to load users: ${response.status}`);
    }

    const users = await response.json();
    console.log('✅ Users loaded successfully:', users.length, users);
    
    displayUsers(users);
    
  } catch (error) {
    console.error('❌ Load users error:', error);
    console.error('❌ Error details:', error.message);
    showAlert('Failed to load users: ' + error.message, 'error');
  }
}

// Display users in table
function displayUsers(users) {
  console.log('🎨 Displaying users:', users.length);
  
  const tbody = document.getElementById('users-table-body');
  
  if (!tbody) {
    console.error('❌ Table body element not found!');
    alert('Error: User table not found in HTML');
    return;
  }

  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #6B7280;">No users found. Click "Add User" to create one.</td></tr>';
    return;
  }

  tbody.innerHTML = users.map(user => `
    <tr>
      <td>${user.fullName || 'N/A'}</td>
      <td>${user.email}</td>
      <td><span style="text-transform: uppercase; font-weight: 600; color: ${user.role === 'admin' ? '#8B0000' : user.role === 'faculty' ? '#059669' : '#1E40AF'};">${user.role}</span></td>
      <td>${user.program}</td>
      <td>
        <span class="badge ${user.isActive !== false ? 'badge-success' : 'badge-danger'}" style="padding: 4px 12px; border-radius: 20px; font-size: 11px;">
          ${user.isActive !== false ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td>
        <button class="btn btn-warning" onclick="editUser('${user._id}')" style="margin-right: 5px; padding: 8px 16px; font-size: 12px;">Edit</button>
        ${user.role !== 'admin' ? `<button class="btn btn-danger" onclick="deleteUser('${user._id}')" style="padding: 8px 16px; font-size: 12px;">Delete</button>` : ''}
      </td>
    </tr>
  `).join('');
  
  console.log('✅ Users displayed in table');
}

// Show create user modal
function showCreateUserModal() {
  const modal = document.getElementById('create-user-modal');
  if (modal) {
    modal.classList.add('active');
    modal.style.display = 'flex';
    console.log('✅ Create user modal opened');
  } else {
    console.error('❌ Create user modal not found');
  }
}

// Close create user modal
function closeCreateUserModal() {
  const modal = document.getElementById('create-user-modal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
    document.getElementById('create-user-form').reset();
    console.log('✅ Create user modal closed');
  }
}

// Show edit user modal
function showEditUserModal() {
  const modal = document.getElementById('edit-user-modal');
  if (modal) {
    modal.classList.add('active');
    modal.style.display = 'flex';
    console.log('✅ Edit user modal opened');
  } else {
    console.error('❌ Edit user modal not found');
  }
}

// Close edit user modal
function closeEditUserModal() {
  const modal = document.getElementById('edit-user-modal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
    console.log('✅ Edit user modal closed');
  }
}

// Create new user
document.getElementById('create-user-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  console.log('Creating new user...');

  const userData = {
    fullName: document.getElementById('new-user-fullname').value,
    email: document.getElementById('new-user-email').value,
    password: document.getElementById('new-user-password').value,
    role: document.getElementById('new-user-role').value,
    program: document.getElementById('new-user-program').value
  };

  try {
    const response = await fetch(`${API_URL}/api/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.getToken()}`
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ User created:', data);
      showAlert('User created successfully!', 'success');
      closeCreateUserModal();
      loadUsers();
    } else {
      console.error('❌ Create user failed:', data);
      showAlert(data.message || 'Failed to create user', 'error');
    }
  } catch (error) {
    console.error('❌ Error creating user:', error);
    showAlert('Network error: ' + error.message, 'error');
  }
});

// Edit user - FIXED FOR NESTED RESPONSE
async function editUser(userId) {
  console.log('🔧 Editing user:', userId);
  
  try {
    const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${auth.getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }

    const data = await response.json();
    const user = data.user || data;
    
    console.log('✅ User data extracted:', user);

    const modal = document.getElementById('edit-user-modal');
    
    if (!modal) {
      console.error('❌ Modal not found');
      return;
    }

    const escapeHtml = (text) => {
      const div = document.createElement('div');
      div.textContent = text || '';
      return div.innerHTML;
    };

    const isActive = user.isActive !== undefined ? user.isActive : true;
    
    modal.innerHTML = `
      <div class="modal-content">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="margin: 0;">Edit User</h2>
          <button class="modal-close" onclick="closeEditUserModal()">×</button>
        </div>
        
        <form id="edit-user-form-dynamic">
          <input type="hidden" id="edit-user-id" value="${escapeHtml(user._id)}">
          
          <div class="form-group">
            <label for="edit-user-fullname">Full Name</label>
            <input type="text" id="edit-user-fullname" class="form-control" value="${escapeHtml(user.fullName)}" required>
          </div>
          
          <div class="form-group">
            <label for="edit-user-email">Email</label>
            <input type="email" id="edit-user-email" class="form-control" value="${escapeHtml(user.email)}" required>
          </div>
          
          <div class="form-group">
            <label for="edit-user-password">New Password (leave blank to keep current)</label>
            <input type="password" id="edit-user-password" class="form-control" placeholder="Enter new password (optional)">
            <small style="color: #6B7280; font-size: 12px;">Leave empty to keep existing password</small>
          </div>
          
          <div class="form-group">
            <label for="edit-user-role">Role</label>
            <select id="edit-user-role" class="form-control" required>
              <option value="">Select Role</option>
              <option value="student" ${user.role === 'student' ? 'selected' : ''}>Student</option>
              <option value="faculty" ${user.role === 'faculty' ? 'selected' : ''}>Faculty</option>
              <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="edit-user-program">Program</label>
            <select id="edit-user-program" class="form-control" required>
              <option value="">Select Program</option>
              <option value="AIDA" ${user.program === 'AIDA' ? 'selected' : ''}>AIDA</option>
              <option value="AIML" ${user.program === 'AIML' ? 'selected' : ''}>AIML</option>
              <option value="CYB & IOT" ${user.program === 'CYB & IOT' ? 'selected' : ''}>CYB & IOT</option>
              <option value="MED ENG" ${user.program === 'MED ENG' ? 'selected' : ''}>MED ENG</option>
              <option value="General" ${user.program === 'General' ? 'selected' : ''}>General</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="edit-user-status">Status</label>
            <select id="edit-user-status" class="form-control" required>
              <option value="true" ${isActive ? 'selected' : ''}>Active</option>
              <option value="false" ${!isActive ? 'selected' : ''}>Inactive</option>
            </select>
          </div>
          
          <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 25px;">
            <button type="button" class="btn btn-danger" onclick="closeEditUserModal()">Cancel</button>
            <button type="submit" class="btn btn-success">Update User</button>
          </div>
        </form>
      </div>
    `;
    
    document.getElementById('edit-user-form-dynamic').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const userId = document.getElementById('edit-user-id').value;
      const userData = {
        fullName: document.getElementById('edit-user-fullname').value,
        email: document.getElementById('edit-user-email').value,
        role: document.getElementById('edit-user-role').value,
        program: document.getElementById('edit-user-program').value,
        isActive: document.getElementById('edit-user-status').value === 'true'
      };

      const password = document.getElementById('edit-user-password').value;
      if (password && password.trim() !== '') {
        userData.password = password;
      }

      try {
        const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.getToken()}`
          },
          body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.ok) {
          showAlert('User updated successfully!', 'success');
          closeEditUserModal();
          loadUsers();
        } else {
          showAlert(data.message || 'Failed to update user', 'error');
        }
      } catch (error) {
        showAlert('Network error: ' + error.message, 'error');
      }
    });
    
    modal.classList.add('active');
    modal.style.display = 'flex';
    
    console.log('✅ Modal populated with:', {
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      program: user.program
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    showAlert('Failed to load user data: ' + error.message, 'error');
  }
}

// Delete user
async function deleteUser(userId) {
  if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${auth.getToken()}`
      }
    });

    if (response.ok) {
      showAlert('User deleted successfully!', 'success');
      loadUsers();
    } else {
      const data = await response.json();
      showAlert(data.message || 'Failed to delete user', 'error');
    }
  } catch (error) {
    showAlert('Network error: ' + error.message, 'error');
  }
}

console.log('✅ Admin module loaded');

