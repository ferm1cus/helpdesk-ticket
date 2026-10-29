const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const NEXT = { 'Open': ['In Progress'], 'In Progress': ['Resolved', 'Open'], 'Resolved': ['Closed', 'In Progress'], 'Closed': [] };
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const CATEGORIES = ['Hardware', 'Software', 'Network', 'Access', 'Other'];
const opts = (list, all) => (all ? `<option value="">${all}</option>` : '') + list.map((x) => `<option>${x}</option>`).join('');

let token = localStorage.getItem('token'), user = null, tab = 'tickets', page = 1, registerMode = false;

async function api(path, method = 'GET', body) {
  const res = await fetch('/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
function toast(msg, isErr) {
  const t = $('#toast'); t.textContent = msg; t.className = (isErr ? 'err ' : '') + 'show';
  setTimeout(() => (t.className = isErr ? 'err' : ''), 3000);
}
const guard = (fn) => async (...a) => { try { await fn(...a); } catch (e) { toast(e.message, true); } };

// ---------- auth ----------
function setMode(reg) {
  registerMode = reg;
  $('#nameRow').hidden = !reg;
  $('#authBtn').textContent = reg ? 'Create account' : 'Sign in';
  $('#toggle').textContent = reg ? 'I already have an account' : 'Create an account';
}
$('#toggle').onclick = (e) => { e.preventDefault(); setMode(!registerMode); };
$('#authForm').onsubmit = guard(async (e) => {
  e.preventDefault();
  const body = { email: $('#email').value, password: $('#password').value };
  if (registerMode) body.name = $('#name').value;
  const d = await api(registerMode ? '/auth/register' : '/auth/login', 'POST', body);
  token = d.token; user = d.user; localStorage.setItem('token', token);
  showApp();
});
function logout() { localStorage.removeItem('token'); token = user = null; showAuth(); }

function showAuth() { $('#app').hidden = true; $('#auth').hidden = false; setMode(false); }
function showApp() {
  $('#auth').hidden = true; $('#app').hidden = false;
  $('#who').textContent = `${user.name} (${user.role})`;
  const tabs = [['tickets', 'Tickets']];
  if (user.role === 'admin') tabs.push(['users', 'Users'], ['audit', 'Audit log']);
  $('#nav').innerHTML = tabs.map(([k, l]) => `<button data-t="${k}">${l}</button>`).join('');
  $('#nav').onclick = (e) => { if (e.target.dataset.t) { tab = e.target.dataset.t; page = 1; render(); } };
  tab = 'tickets'; render();
}
function render() {
  document.querySelectorAll('#nav button').forEach((b) => b.classList.toggle('on', b.dataset.t === tab));
  ({ tickets: renderTickets, users: renderUsers, audit: renderAudit })[tab]();
}

// ---------- tickets ----------
function renderTickets() {
  $('#view').innerHTML = `
    <div class="bar">
      <input id="fq" placeholder="Search tickets" aria-label="Search">
      <select id="fs" aria-label="Status">${opts(['Open', 'In Progress', 'Resolved', 'Closed'], 'All statuses')}</select>
      <select id="fp" aria-label="Priority">${opts(PRIORITIES, 'All priorities')}</select>
      ${user.role !== 'employee' ? '<select id="fa" aria-label="Assignee"><option value="">All tickets</option><option value="me">Assigned to me</option></select>' : ''}
      <button onclick="toggleNew()">New ticket</button>
    </div>
    <form id="newForm" class="card" hidden>
      <h3>New ticket</h3>
      <label>Title <input id="nt" maxlength="120" required></label>
      <label>Description <textarea id="nd" required></textarea></label>
      <div class="grid">
        <label>Priority <select id="np">${opts(PRIORITIES)}</select></label>
        <label>Category <select id="nc">${opts(CATEGORIES)}</select></label>
      </div>
      <button>Submit ticket</button>
    </form>
    <div class="tbl"><table><thead><tr><th>#</th><th>Title</th><th>Status</th><th>Priority</th><th>Category</th><th>Assigned to</th></tr></thead><tbody id="rows"></tbody></table></div>
    <div class="pager"><button class="ghost" id="prev">Previous</button><span id="pinfo"></span><button class="ghost" id="next">Next</button></div>
    <div id="detail"></div>`;
  ['fq', 'fs', 'fp', 'fa'].forEach((id) => { const el = $('#' + id); if (el) el.onchange = () => { page = 1; loadTickets(); }; });
  $('#newForm').onsubmit = guard(async (e) => {
    e.preventDefault();
    await api('/tickets', 'POST', { title: $('#nt').value, description: $('#nd').value, priority: $('#np').value, category: $('#nc').value });
    e.target.reset(); e.target.hidden = true; toast('Ticket submitted'); page = 1; loadTickets();
  });
  $('#prev').onclick = () => { page--; loadTickets(); };
  $('#next').onclick = () => { page++; loadTickets(); };
  loadTickets();
}
const toggleNew = () => { $('#newForm').hidden = !$('#newForm').hidden; };

const loadTickets = guard(async () => {
  const p = new URLSearchParams({ page, limit: 8 });
  [['q', 'fq'], ['status', 'fs'], ['priority', 'fp'], ['assignedTo', 'fa']].forEach(([k, id]) => { const el = $('#' + id); if (el && el.value) p.set(k, el.value); });
  const d = await api('/tickets?' + p);
  $('#rows').innerHTML = d.data.length ? d.data.map((t) => `
    <tr class="row" tabindex="0" onclick="openTicket(${t.id})" onkeydown="if(event.key==='Enter')openTicket(${t.id})">
      <td>${t.id}</td><td>${esc(t.title)}</td>
      <td><span class="tag s-${t.status}">${t.status}</span></td>
      <td><span class="tag p-${t.priority}">${t.priority}</span></td>
      <td>${esc(t.category)}</td><td>${esc(t.assigned_to_name || 'Unassigned')}</td></tr>`).join('')
    : '<tr><td colspan="6" class="muted">No tickets match. Try different filters or submit a new ticket.</td></tr>';
  $('#pinfo').textContent = `Page ${d.page} of ${d.pages} (${d.total} tickets)`;
  $('#prev').disabled = d.page <= 1; $('#next').disabled = d.page >= d.pages;
});

const openTicket = guard(async (id) => {
  const { ticket: t } = await api('/tickets/' + id);
  let agents = [];
  if (user.role === 'admin') agents = (await api('/users/agents')).data;
  const canMove = user.role === 'employee' ? (t.status === 'Resolved' ? ['Closed'] : []) : NEXT[t.status];
  const canAssign = user.role !== 'employee' && t.status !== 'Closed';
  $('#detail').innerHTML = `
    <div class="card">
      <h2>#${t.id} ${esc(t.title)}</h2>
      <p class="muted">Raised by ${esc(t.created_by_name)} on ${esc(t.created_at)} &middot; ${esc(t.category)} &middot; <span class="tag p-${t.priority}">${t.priority}</span> &middot; <span class="tag s-${t.status}">${t.status}</span> &middot; Assigned to: ${esc(t.assigned_to_name || 'Unassigned')}</p>
      <p>${esc(t.description)}</p>
      <div class="actions">
        ${canMove.map((s) => `<button onclick="setStatus(${t.id},'${s}')">Move to ${s}</button>`).join('')}
        ${canAssign && user.role === 'agent' ? `<button class="ghost" onclick="assign(${t.id},${user.id})">Assign to me</button>` : ''}
        ${canAssign && user.role === 'admin' ? `<select id="ag" aria-label="Agent">${agents.map((a) => `<option value="${a.id}">${esc(a.name)}</option>`).join('')}</select><button class="ghost" onclick="assign(${t.id},$('#ag').value)">Assign</button>` : ''}
      </div>
      <h3>Comments</h3>
      ${t.comments.map((c) => `<div class="comment"><strong>${esc(c.author)}</strong> <span class="muted small">${esc(c.author_role)} &middot; ${esc(c.created_at)}</span><br>${esc(c.body)}</div>`).join('') || '<p class="muted">No comments yet.</p>'}
      ${t.status !== 'Closed' ? `<label>Add a comment <textarea id="cb"></textarea></label><button onclick="addComment(${t.id})">Post comment</button>` : ''}
    </div>`;
  $('#detail').scrollIntoView({ behavior: 'smooth' });
});
const setStatus = guard(async (id, status) => { await api(`/tickets/${id}/status`, 'PATCH', { status }); toast('Status updated'); loadTickets(); openTicket(id); });
const assign = guard(async (id, assigneeId) => { await api(`/tickets/${id}/assign`, 'PATCH', { assigneeId }); toast('Ticket assigned'); loadTickets(); openTicket(id); });
const addComment = guard(async (id) => { await api(`/tickets/${id}/comments`, 'POST', { body: $('#cb').value }); toast('Comment posted'); openTicket(id); });

// ---------- admin: users ----------
const renderUsers = guard(async () => {
  const { data } = await api('/users');
  $('#view').innerHTML = `
    <form id="uf" class="card"><h3>Create user</h3>
      <div class="grid"><label>Name <input id="un" required></label><label>Email <input id="ue" type="email" required></label>
      <label>Password (min 8 characters) <input id="up" type="password" required></label>
      <label>Role <select id="ur">${opts(['agent', 'employee', 'admin'])}</select></label></div>
      <button>Create user</button></form>
    <div class="tbl"><table><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Created</th></tr></thead><tbody>
    ${data.map((u) => `<tr><td>${u.id}</td><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${u.role}</td><td>${esc(u.created_at)}</td></tr>`).join('')}</tbody></table></div>`;
  $('#uf').onsubmit = guard(async (e) => {
    e.preventDefault();
    await api('/users', 'POST', { name: $('#un').value, email: $('#ue').value, password: $('#up').value, role: $('#ur').value });
    toast('User created'); renderUsers();
  });
});

// ---------- admin: audit ----------
const renderAudit = guard(async () => {
  const d = await api('/audit?page=' + page);
  $('#view').innerHTML = `
    <div class="tbl"><table><thead><tr><th>Time</th><th>User</th><th>Action</th><th>Target</th><th>Details</th></tr></thead><tbody>
    ${d.data.map((l) => `<tr><td>${esc(l.created_at)}</td><td>${esc(l.user_name || '-')}</td><td>${esc(l.action)}</td><td>${esc(l.entity)} ${l.entity_id ?? ''}</td><td class="small">${esc(l.details)}</td></tr>`).join('')}</tbody></table></div>
    <div class="pager"><button class="ghost" id="prev">Previous</button><span>Page ${d.page} of ${d.pages}</span><button class="ghost" id="next">Next</button></div>`;
  $('#prev').disabled = d.page <= 1; $('#next').disabled = d.page >= d.pages;
  $('#prev').onclick = () => { page--; renderAudit(); };
  $('#next').onclick = () => { page++; renderAudit(); };
});

// ---------- start ----------
(async () => {
  if (token) { try { user = (await api('/auth/me')).user; } catch { token = null; localStorage.removeItem('token'); } }
  user ? showApp() : showAuth();
})();
