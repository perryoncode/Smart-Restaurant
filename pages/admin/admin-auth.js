(function(){
  // admin-auth.js: include on every admin page to require login
  const API_BASE = (typeof window !== 'undefined') ? (window.API_BASE || 'http://20.197.51.157:8000') : 'http://20.197.51.157:8000';
  function getToken(){ try{ return localStorage.getItem('admin_token'); }catch(e){ return null; } }
  const token = getToken();
  // allow login page to be public
  if(location.pathname.endsWith('/login.html')) return;
  if(!token){
    const base = location.pathname.replace(/\/[^/]*$/, '/');
    location.href = base + 'login.html';
    return;
  }
  // validate token with backend (absolute URL to backend)
  fetch(`${API_BASE}/admin/me?t=${Date.now()}`, { headers: { 'x-admin-token': token }, cache: 'no-store' })
    .then(res => res.json())
    .then(data => {
      if(!data || data.response !== 'success'){
        try{ localStorage.removeItem('admin_token'); }catch(e){}
        const base = location.pathname.replace(/\/[^/]*$/, '/');
        location.href = base + 'login.html';
      } else {
        // Update nav link with admin name if present
        const link = document.getElementById('adminProfileLink');
        if(link && data.admin){
          const name = data.admin.name || 'Admin Profile';
          link.innerHTML = `<i class="fa-solid fa-user-shield"></i> ${name}`;
        }
      }
    })
    .catch(()=>{
      const base = location.pathname.replace(/\/[^/]*$/, '/');
      location.href = base + 'login.html';
    });

  // Attach logout handler (if logout button exists)
  const logoutButton = document.querySelector('.logoutButton');
  if(logoutButton){
    logoutButton.addEventListener('click', (e)=>{
      e.preventDefault();
      try{ localStorage.removeItem('admin_token'); }catch(e){}
      location.href = 'login.html';
    });
  }
})();
