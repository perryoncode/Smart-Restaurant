// Admin Tables Management

document.addEventListener('DOMContentLoaded', () => {
	const form = document.getElementById('generateTableForm');
	const tableIdInput = document.getElementById('tableId');
	const numSeatsInput = document.getElementById('numSeats');
	const resultDiv = document.getElementById('tableResult');
	const listEl = document.getElementById('tablesList');

	// No table type selector anymore; seats are always editable

	// Create table
	form.addEventListener('submit', (e) => {
		e.preventDefault();
		const tableId = tableIdInput.value.trim();
		const numSeats = numSeatsInput.value.trim();
		if (!tableId || isNaN(tableId) || Number(tableId) < 1) {
			resultDiv.textContent = 'Please enter a valid table ID.';
			return;
		}
		if (!numSeats || isNaN(numSeats) || Number(numSeats) < 1) {
			resultDiv.textContent = 'Please enter a valid number of seats.';
			return;
		}
		const derivedType = Number(numSeats) === 2 ? 'couple' : (Number(numSeats) === 4 ? 'family' : 'custom');
		fetch('http://127.0.0.1:8000/tables', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				table_id: Number(tableId),
				table_type: derivedType,
				seats: Number(numSeats)
			})
		})
			.then(res => res.json())
			.then(data => {
				if (data.response === 'success') {
					resultDiv.innerHTML = '';
					showToast('Table created successfully', 'success');
					loadTables();
					form.reset();
					numSeatsInput.value = 2;
				} else if (data.response === 'exists') {
					resultDiv.innerHTML = '<div style="color:#e67e22;">A table with this ID already exists.</div>';
				} else {
					resultDiv.innerHTML = '<div style="color:#e74c3c;">Error saving table. Please try again.</div>';
				}
			})
			.catch(() => {
				resultDiv.innerHTML = '<div style="color:#e74c3c;">Network error. Please try again.</div>';
			});
	});

	// Logout button
	const logoutButton = document.querySelector('.logoutButton');
	if (logoutButton) {
		logoutButton.addEventListener('click', (e) => {
			e.preventDefault();
			document.cookie = 'id=;path=/;max-age=0';
			document.cookie = 'name=;path=/;max-age=0';
			document.cookie = 'mail=;path=/;max-age=0';
			document.cookie = 'role=;path=/;max-age=0';
			window.location.href = '/index.html';
		});
	}

	// Initial load
	loadTables();
});

function loadTables() {
	const listEl = document.getElementById('tablesList');
	listEl.innerHTML = '<div>Loading tables...</div>';
	fetch('http://127.0.0.1:8000/tables')
		.then(res => res.json())
		.then(data => {
			if (!data || data.response !== 'success') {
				listEl.innerHTML = '<div>Failed to load tables.</div>';
				return;
			}
			const tables = data.tables || [];
			if (tables.length === 0) {
				listEl.innerHTML = '<div>No tables yet.</div>';
				return;
			}
			listEl.innerHTML = '';
			tables
				.sort((a, b) => (a.table_id || 0) - (b.table_id || 0))
				.forEach(t => listEl.appendChild(renderTableItem(t)));
		})
		.catch(() => {
			listEl.innerHTML = '<div>Failed to load tables.</div>';
		});
}

function renderTableItem(t) {
	const row = document.createElement('div');
	row.className = 'table-item';

	const meta = document.createElement('div');
	meta.className = 'meta';

	const idSpan = document.createElement('span');
	idSpan.textContent = `ID: ${t.table_id}`;
	const seatsSpan = document.createElement('span');
	seatsSpan.textContent = `Seats: ${t.seats}`;
	meta.appendChild(idSpan);
	meta.appendChild(seatsSpan);

	const actions = document.createElement('div');
	actions.className = 'actions';

	// QR button
	const qrBtn = document.createElement('button');
	qrBtn.className = 'btn-qr';
	qrBtn.innerHTML = qrIconSvg() + ' QR';
	qrBtn.addEventListener('click', () => openQrForTable(t.table_id));

	// Edit
	const editBtn = document.createElement('button');
	editBtn.className = 'btn-edit';
	editBtn.innerHTML = editIconSvg() + ' Edit';
	editBtn.addEventListener('click', () => startEdit(row, t));

	// Delete
	const delBtn = document.createElement('button');
	delBtn.className = 'btn-delete';
	delBtn.innerHTML = trashIconSvg() + ' Delete';
	delBtn.addEventListener('click', () => deleteTable(t.table_id));

	actions.appendChild(qrBtn);
	actions.appendChild(editBtn);
	actions.appendChild(delBtn);

	row.appendChild(meta);
	row.appendChild(actions);
	return row;
}

function startEdit(row, t) {
	const meta = row.querySelector('.meta');
	const actions = row.querySelector('.actions');
	meta.innerHTML = '';

	const idSpan = document.createElement('span');
	idSpan.textContent = `ID: ${t.table_id}`;

	const seatsInput = document.createElement('input');
	seatsInput.type = 'number';
	seatsInput.min = '1';
	seatsInput.max = '20';
	seatsInput.value = String(t.seats || 2);
	const seatsWrap = document.createElement('span');
	seatsWrap.appendChild(document.createTextNode('Seats: '));
	seatsWrap.appendChild(seatsInput);

	meta.appendChild(idSpan);
	meta.appendChild(seatsWrap);

	actions.innerHTML = '';
	const saveBtn = document.createElement('button');
	saveBtn.className = 'btn-save';
	saveBtn.textContent = 'Save';
	saveBtn.addEventListener('click', () => saveEdit(t.table_id, Number(seatsInput.value)));

	const cancelBtn = document.createElement('button');
	cancelBtn.className = 'btn-cancel';
	cancelBtn.textContent = 'Cancel';
	cancelBtn.addEventListener('click', () => loadTables());

	actions.appendChild(saveBtn);
	actions.appendChild(cancelBtn);
}

function saveEdit(tableId, seats) {
	if (!seats || Number.isNaN(seats) || seats < 1) {
		alert('Please enter a valid number of seats.');
		return;
	}
	const derivedType = Number(seats) === 2 ? 'couple' : (Number(seats) === 4 ? 'family' : 'custom');
	fetch(`http://127.0.0.1:8000/tables/${tableId}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ table_type: derivedType, seats })
	})
		.then(res => res.json())
		.then(data => {
			if (data.response === 'success') {
				showToast('Table updated', 'success');
				loadTables();
			} else if (data.response === 'not_found') {
				showToast('Table not found', 'error');
			} else if (data.response === 'no_update_fields') {
				showToast('No changes to save', 'info');
			} else {
				showToast('Failed to update table', 'error');
			}
		})
		.catch(() => showToast('Network error', 'error'));
}

function deleteTable(tableId) {
	if (!confirm(`Delete table ${tableId}? This cannot be undone.`)) return;
	fetch(`http://127.0.0.1:8000/tables/${tableId}`, { method: 'DELETE' })
		.then(res => res.json())
		.then(data => {
			if (data.response === 'success') {
				showToast('Table deleted', 'success');
				loadTables();
			} else if (data.response === 'not_found') {
				showToast('Table not found', 'error');
			} else {
				showToast('Failed to delete table', 'error');
			}
		})
		.catch(() => showToast('Network error', 'error'));
}

function showToast(message, type = 'success') {
	const toast = document.createElement('div');
	toast.className = `toast toast-${type}`;
	toast.textContent = message;
	document.body.appendChild(toast);
	void toast.offsetWidth; // reflow
	toast.classList.add('show');
	setTimeout(() => {
		toast.classList.remove('show');
		setTimeout(() => toast.remove(), 300);
	}, 2200);
}

// QR generation/open
function qrIconSvg() {
	return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3z"/><path d="M17 17v4M21 17h-4M21 21h-4"/></svg>';
}

	// Resolve the base URL to encode in the QR.
	// Allows overriding via localStorage key `QR_BASE_URL` (e.g., https://your-domain.com).
	function getQrBase() {
		try {
			const saved = localStorage.getItem('QR_BASE_URL');
			if (saved && /^https?:\/\//i.test(saved)) {
				return saved.replace(/\/+$/, '');
			}
		} catch (e) {}
		return window.location.origin.replace(/\/+$/, '');
	}

function editIconSvg() {
	return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>';
}

function trashIconSvg() {
	return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>';
}

function openQrForTable(tableId) {
		const base = getQrBase();
		// Include a trailing slash before the query string for better scanner compatibility
		const url = `${base}/pages/scanqr/index.html/?tableId=${tableId}/`;
	const win = window.open('', '_blank');
	if (!win) return; // popup blocked
	win.document.write('<!DOCTYPE html><html><head><title>Table QR</title><meta name="viewport" content="width=device-width, initial-scale=1"/></head><body style="font-family: system-ui, -apple-system, Segoe UI, Roboto; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; background:#fff; color:#333;"><div id="wrap" style="text-align:center;"><div id="qr"></div><div style="margin-top:12px; font-size:14px; word-break:break-all;"></div></div></body></html>');
	win.document.close();
	ensureQrLibIn(win).then(() => {
		// Generate QR inside the new window
		win.QRCode.toDataURL(url, { width: 280, margin: 2 })
			.then((dataUrl) => {
				const img = win.document.createElement('img');
				img.src = dataUrl;
				img.alt = `QR for ${url}`;
				img.style.maxWidth = '90vw';
				img.style.height = 'auto';
				const qrDiv = win.document.getElementById('qr');
				const txt = win.document.querySelector('#wrap > div:last-child');
				qrDiv.appendChild(img);
				if (txt) txt.textContent = url;
			})
			.catch(() => {
				// Fallback to QR server image
				const img = win.document.createElement('img');
				img.src = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(url)}`;
				img.alt = `QR for ${url}`;
				img.style.maxWidth = '90vw';
				img.style.height = 'auto';
				const qrDiv = win.document.getElementById('qr');
				const txt = win.document.querySelector('#wrap > div:last-child');
				qrDiv.appendChild(img);
				if (txt) txt.textContent = url;
			});
	}).catch(() => {
		// Fallback to QR server image if library couldn't load
		const img = win.document.createElement('img');
		img.src = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(url)}`;
		img.alt = `QR for ${url}`;
		img.style.maxWidth = '90vw';
		img.style.height = 'auto';
		const qrDiv = win.document.getElementById('qr');
		const txt = win.document.querySelector('#wrap > div:last-child');
		qrDiv.appendChild(img);
		if (txt) txt.textContent = url;
	});
}

function ensureQrLibIn(targetWindow) {
	return new Promise((resolve, reject) => {
		try {
			if (targetWindow.QRCode && typeof targetWindow.QRCode.toDataURL === 'function') {
				resolve();
				return;
			}
			const script = targetWindow.document.createElement('script');
			script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
			script.onload = () => resolve();
			script.onerror = () => reject();
			targetWindow.document.head.appendChild(script);
		} catch (e) {
			reject(e);
		}
	});
}
