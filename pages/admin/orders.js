(function(){
  const API_BASE = (typeof window !== 'undefined') ? (window.API_BASE || 'http://20.197.51.157:8000') : 'http://20.197.51.157:8000';
  const ordersBody = document.getElementById('ordersBody');
  const totalCountEl = document.getElementById('totalCount');
  const filterEmailEl = document.getElementById('filterEmail');
  const refreshBtn = document.getElementById('refreshBtn');
  const backBtn = document.getElementById('backBtn');
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');
  const pageInfoEl = document.getElementById('pageInfo');

  let page = 0;
  const pageSize = 20;

  function fmtDate(isoStr){
    try{
      const d = new Date(isoStr);
      return d.toLocaleString();
    }catch(e){return isoStr}
  }

  function renderRows(orders){
    ordersBody.innerHTML = '';
    if(!orders || orders.length === 0){
      ordersBody.innerHTML = '<tr><td colspan="5">No orders found.</td></tr>';
      return;
    }
    for(const o of orders){
      const createdAt = o.created_at;
      const dateStr = createdAt && createdAt.$date ? fmtDate(createdAt.$date) : fmtDate(createdAt);
      const items = Array.isArray(o.items) ? o.items : [];
      const itemsSummary = items.map(i => `${i.name} x${i.quantity}`).join(', ');
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="date-cell">${dateStr}</td>
        <td>${o.name || ''}</td>
        <td>${o.email || ''}</td>
        <td><span class="badge">${o.items_count ?? items.reduce((a,i)=>a+(i.quantity||0),0)}</span> ${itemsSummary}</td>
        <td class="total-cell">₹${(o.total||0).toFixed(2)}</td>
      `;
      ordersBody.appendChild(row);
    }
  }

  async function load(){
    const params = new URLSearchParams();
    params.set('limit', String(pageSize));
    params.set('offset', String(page * pageSize));
    const email = filterEmailEl.value.trim();
    if(email) params.set('customer_email', email);
    const url = `${API_BASE}/orders?${params.toString()}&t=${Date.now()}`;
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();
    if(data && data.response === 'success'){
      totalCountEl.textContent = String(data.total || 0);
      renderRows(data.orders || []);
      pageInfoEl.textContent = `Page ${page+1}`;
    }else{
      totalCountEl.textContent = '0';
      renderRows([]);
    }
  }

  refreshBtn.addEventListener('click', () => { page = 0; load(); });
  filterEmailEl.addEventListener('keydown', (e) => { if(e.key === 'Enter'){ page = 0; load(); } });
  prevBtn.addEventListener('click', () => { if(page>0){ page--; load(); } });
  nextBtn.addEventListener('click', () => { page++; load(); });
  backBtn.addEventListener('click', () => { window.location.href = '../admin/index.html'; });

  load();
})();
