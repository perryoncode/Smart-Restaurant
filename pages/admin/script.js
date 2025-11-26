// Admin Dashboard JS

document.addEventListener('DOMContentLoaded', () => {
  const userCountEl = document.getElementById('userCount');
  const tableCountEl = document.getElementById('tableCount');
  const orderCountEl = document.getElementById('orderCount');
  const topItemsCanvas = document.getElementById('topItemsChart');
  const totalSalesCanvas = document.getElementById('totalSalesChart');
  const dailySalesCanvas = document.getElementById('dailySalesChart');
  const topCustomersCanvas = document.getElementById('topCustomersChart');

  userCountEl.textContent = '...';
  tableCountEl.textContent = '...';
  orderCountEl.textContent = '...';

  function loadStats(){
    fetch(`http://20.197.51.157:8000/stats?t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data && data.response === 'success') {
          userCountEl.textContent = data.users ?? 0;
          tableCountEl.textContent = data.tables ?? 0;
          orderCountEl.textContent = data.orders ?? 0;
        } else {
          userCountEl.textContent = '0';
          tableCountEl.textContent = '0';
          orderCountEl.textContent = '0';
        }
      })
      .catch(() => {
        userCountEl.textContent = '0';
        tableCountEl.textContent = '0';
        orderCountEl.textContent = '0';
      });
  }
  loadStats();

  // Logout button
  const logoutButton = document.querySelector('.logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', (e) => {
      e.preventDefault();
      document.cookie = "id=;path=/;max-age=0";
      document.cookie = "name=;path=/;max-age=0";
      document.cookie = "mail=;path=/;max-age=0";
      document.cookie = "role=;path=/;max-age=0";
      window.location.href = "/index.html";
    });
  }

  let charts = { topItems: null, totalSales: null, daily: null, categories: null, customers: null };
  function getSelectedMonth(){
    const m = document.getElementById('analyticsMonth');
    if (m && m.value) {
      return m.value; // YYYY-MM from input
    }
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  }

  function loadAnalytics(){
    // destroy previous charts to avoid stale visuals
    Object.keys(charts).forEach(k => { if(charts[k]) { charts[k].destroy(); charts[k] = null; } });

    // Most ordered items can remain overall or be month-filtered; keep overall for now
    fetch(`http://20.197.51.157:8000/analytics?t=${Date.now()}`, { cache: 'no-store' })
    .then(res => res.json())
    .then(data => {
      if (!data || data.response !== 'success') return;
      // Top Items Bar Chart
      if (topItemsCanvas && window.Chart) {
        const labels = (data.top_items || []).map(i => i.name);
        const quantities = (data.top_items || []).map(i => i.quantity);
        charts.topItems = new Chart(topItemsCanvas, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: 'Quantity',
              data: quantities,
              backgroundColor: '#e74c3c'
            }]
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
          }
        });
      }
      // Monthly Sales Bar Chart (per month totals)
      // Fetch monthly series separately
      fetch(`http://20.197.51.157:8000/analytics/monthly?t=${Date.now()}`, { cache: 'no-store' })
        .then(res => res.json())
        .then(mData => {
          if (!mData || mData.response !== 'success') return;
          if (totalSalesCanvas && window.Chart) {
            const labels = (mData.series || []).map(s => s.month);
            const totals = (mData.series || []).map(s => s.total);
            charts.totalSales = new Chart(totalSalesCanvas, {
              type: 'bar',
              data: {
                labels,
                datasets: [{
                  label: 'Monthly Sales (₹)',
                  data: totals,
                  backgroundColor: '#2ecc71'
                }]
              },
              options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
              }
            });
          }
        }).catch(() => {});
    }).catch(() => {});

    // Daily sales chart
    fetch(`http://20.197.51.157:8000/analytics/daily?t=${Date.now()}`, { cache: 'no-store' })
    .then(res => res.json())
    .then(data => {
      if (!data || data.response !== 'success') return;
      if (dailySalesCanvas && window.Chart) {
        const labels = (data.series || []).map(d => d.date);
        const totals = (data.series || []).map(d => d.total);
        const orders = (data.series || []).map(d => d.orders);
        charts.daily = new Chart(dailySalesCanvas, {
          type: 'line',
          data: {
            labels,
            datasets: [
              {
                label: 'Daily Total (₹)',
                data: totals,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.2)'
              },
              {
                label: 'Orders',
                data: orders,
                borderColor: '#e67e22',
                backgroundColor: 'rgba(230, 126, 34, 0.2)'
              }
            ]
          },
          options: {
            responsive: true,
            plugins: { legend: { display: true } },
            scales: { y: { beginAtZero: true } }
          }
        });
      }
    }).catch(() => {});
  // Category-wise items pie chart
  const categoryItemsCanvas = document.getElementById('categoryItemsChart');
  // Category-wise items pie chart
    fetch(`http://20.197.51.157:8000/analytics/categories?t=${Date.now()}`, { cache: 'no-store' })
    .then(res => res.json())
    .then(data => {
      if (!data || data.response !== 'success') return;
      const categoryItemsCanvasEl = document.getElementById('categoryItemsChart');
      if (categoryItemsCanvasEl && window.Chart) {
        const labels = (data.categories || []).map(c => c.category);
        const quantities = (data.categories || []).map(c => c.quantity);
        const colors = ['#e74c3c','#3498db','#2ecc71','#9b59b6','#f1c40f','#34495e','#e67e22','#16a085'];
        charts.categories = new Chart(categoryItemsCanvasEl, {
          type: 'pie',
          data: {
            labels,
            datasets: [{
              data: quantities,
              backgroundColor: labels.map((_, i) => colors[i % colors.length])
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
          }
        });
      }
    }).catch(() => {});

  // Top customers chart
    fetch(`http://20.197.51.157:8000/analytics/top_customers?t=${Date.now()}`, { cache: 'no-store' })
    .then(res => res.json())
    .then(data => {
      if (!data || data.response !== 'success') return;
      if (topCustomersCanvas && window.Chart) {
        const labels = (data.customers || []).map(c => c.name || c.email || '');
        const spent = (data.customers || []).map(c => c.spent);
        charts.customers = new Chart(topCustomersCanvas, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: 'Spent (₹)',
              data: spent,
              backgroundColor: '#9b59b6'
            }]
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
          }
        });
      }
    }).catch(() => {});
  }

  // Initial load
  // Set default value for month input to current month
  const monthInput = document.getElementById('analyticsMonth');
  if (monthInput) {
    const now = new Date();
    monthInput.value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    monthInput.addEventListener('change', () => {
      loadAnalytics();
    });
  }
  loadAnalytics();

  // Hook refresh button to reload stats + analytics
  const refreshBtn = document.getElementById('refreshAnalytics');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadStats();
      loadAnalytics();
    });
  }
});
