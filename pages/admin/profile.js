(function(){
  const API_BASE = (typeof window !== 'undefined') ? (window.API_BASE || 'http://127.0.0.1:8000') : 'http://127.0.0.1:8000';
  const token = localStorage.getItem('admin_token');
  const usernameInput = document.getElementById('username');
  const emailInput = document.getElementById('email');
  const infoMessageEl = document.getElementById('infoMessage');
  const saveBtn = document.getElementById('saveBtn');
  const profileForm = document.getElementById('profileForm');
  const pwForm = document.getElementById('adminPasswordForm');
  const pwResult = document.getElementById('passwordResult');
  const backBtn = document.getElementById('backToDashboardBtn');

  async function loadMe(){
    try{
      const res = await fetch(`${API_BASE}/admin/me?t=${Date.now()}`, { headers: { 'x-admin-token': token }, cache: 'no-store' });
      const data = await res.json();
      if(data && data.response === 'success'){
        usernameInput.value = data.admin.name || '';
        emailInput.value = data.admin.email || '';
      }
    }catch(e){ /* ignore */ }
  }

  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      name: usernameInput.value.trim(),
      email: emailInput.value.trim(),
    };
    try{
      const res = await fetch(`${API_BASE}/admin/update`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      infoMessageEl.textContent = (data.response === 'success') ? 'Profile updated successfully ✅' : (data.response || 'Error');
      infoMessageEl.style.color = (data.response === 'success') ? '#0a7a3e' : '#b41';
      if(data.response === 'success'){
        loadMe();
      }
    }catch(err){
      infoMessageEl.textContent = 'Network error'; infoMessageEl.style.color = '#b41';
    }
  });

  pwForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      current_password: document.getElementById('currentPassword').value,
      new_password: document.getElementById('newPassword').value,
    };
    try{
      const res = await fetch(`${API_BASE}/admin/change_password`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      pwResult.textContent = (data.response === 'success') ? 'Password updated.' : (data.response || 'Error');
      pwResult.style.color = (data.response === 'success') ? '#0a7a3e' : '#b41';
      if(data.response === 'success'){
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
      }
    }catch(err){
      pwResult.textContent = 'Network error'; pwResult.style.color = '#b41';
    }
  });

  if(backBtn){ backBtn.addEventListener('click', () => { window.location.href = 'index.html'; }); }
  loadMe();
})();
