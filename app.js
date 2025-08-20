// app.js — Frontend logic
const API = {
  register: '/api/register',
  login: '/api/login',
  add: '/api/add-transaction',
  list: (userId) => `/api/list-transactions?userId=${encodeURIComponent(userId)}`,
  update: '/api/update-transaction',
  del: '/api/delete-transaction'
};

const state = {
  user: null,
  token: null,
  tx: []
};

const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' });

function $(q, root=document){ return root.querySelector(q); }
function $all(q, root=document){ return [...root.querySelectorAll(q)]; }

function todayLabel(){
  const d = new Date();
  const hari = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][d.getDay()];
  const tgl = String(d.getDate()).padStart(2,'0');
  const bln = String(d.getMonth()+1).padStart(2,'0');
  const thn = d.getFullYear();
  return `${tgl}-${bln}-${thn} / ${hari}`;
}

function toast(msg){
  const el = $('#toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(()=> el.classList.add('hidden'), 2200);
}

async function postJSON(url, body){
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)});
  return r.json();
}
async function putJSON(url, body){
  const r = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)});
  return r.json();
}
async function delJSON(url, body){
  const r = await fetch(url, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)});
  return r.json();
}

function setAuthUI(on){
  $('#authSection').classList.toggle('hidden', on);
  $('#dashSection').classList.toggle('hidden', !on);
  $('#greetBar').classList.toggle('hidden', !on);
}

function welcome(){
  $('#welcomeName').textContent = state.user?.name || '';
  $('#welcomeModal').classList.remove('hidden');
}

function closeWelcome(){ $('#welcomeModal').classList.add('hidden'); }

function fillHeader(){
  $('#greetName').textContent = state.user?.name || '';
}

function setDate(){ $('#dateField').value = todayLabel(); }

function renderTable(list){
  const q = $('#search').value.trim().toLowerCase();
  const rows = list.filter(x => !q || x.item.toLowerCase().includes(q));
  const tbody = $('#tbody');
  tbody.innerHTML = '';
  rows.forEach((x, i) => {
    const d = new Date(x.createdAt);
    const hari = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][d.getDay()];
    const tgl = String(d.getDate()).padStart(2,'0');
    const bln = String(d.getMonth()+1).padStart(2,'0');
    const thn = d.getFullYear();
    const when = `${tgl}-${bln}-${thn} / ${hari}`;

    const tr = document.createElement('tr');
    tr.className = i % 2 ? 'bg-white' : 'bg-sky-50/40';
    tr.innerHTML = `
      <td class="td">${i+1}</td>
      <td class="td">${when}</td>
      <td class="td font-medium ${x.type==='pemasukan'?'text-emerald-600':'text-rose-600'}">${x.type}</td>
      <td class="td">${x.source}</td>
      <td class="td">${x.method}</td>
      <td class="td font-semibold">${rupiah.format(x.amount)}</td>
      <td class="td">${x.item}</td>
      <td class="td">
        <div class="flex gap-2">
          <button class="px-3 py-1 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200" data-role="edit" data-id="${x.id}">Edit</button>
          <button class="px-3 py-1 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200" data-role="del" data-id="${x.id}">Hapus</button>
        </div>
      </td>`;
    tbody.appendChild(tr);
  });

  const sumIn = list.filter(x=>x.type==='pemasukan').reduce((a,b)=>a+b.amount,0);
  const sumOut = list.filter(x=>x.type==='pengeluaran').reduce((a,b)=>a+b.amount,0);
  $('#sumIn').textContent = rupiah.format(sumIn);
  $('#sumOut').textContent = rupiah.format(sumOut);
  $('#sumBal').textContent = rupiah.format(sumIn - sumOut);
}

async function loadTx(){
  const r = await fetch(API.list(state.user.id));
  const j = await r.json();
  if (!j.success) { toast('Gagal mengambil data'); return; }
  state.tx = j.data;
  renderTable(state.tx);
}

function bindTableActions(){
  $('#tbody').addEventListener('click', async (e)=>{
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    const item = state.tx.find(x=>x.id===id);
    if (!item) return;

    if (btn.dataset.role === 'del'){
      const j = await delJSON(API.del, { id, userId: state.user.id });
      if (j.success){ toast('Data dihapus'); state.tx = state.tx.filter(x=>x.id!==id); renderTable(state.tx); }
      else toast(j.message || 'Gagal hapus');
    }
    if (btn.dataset.role === 'edit'){
      // open modal
      const f = $('#editForm');
      f.id.value = item.id;
      f.type.value = item.type;
      f.source.value = item.source;
      f.method.value = item.method;
      f.amount.value = item.amount;
      f.item.value = item.item;
      $('#editModal').classList.remove('hidden');
    }
  });
}

function bindEditModal(){
  $('#cancelEdit').addEventListener('click', ()=> $('#editModal').classList.add('hidden'));
  $('#editForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    payload.userId = state.user.id;
    payload.amount = Number(payload.amount || 0);
    const j = await putJSON(API.update, payload);
    if (j.success){
      toast('Perubahan disimpan');
      $('#editModal').classList.add('hidden');
      // update local
      const idx = state.tx.findIndex(t=>t.id===payload.id);
      if (idx>-1){ state.tx[idx] = j.data; renderTable(state.tx); }
    } else toast(j.message || 'Gagal update');
  });
}

function bindForms(){
  // Register
  $('#registerForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const fd = new FormData(e.target);
    const name = fd.get('name').trim();
    const phone = fd.get('phone').trim();
    const password = fd.get('password');
    const confirm = fd.get('confirm');
    if (password !== confirm){ toast('Konfirmasi password tidak cocok'); return; }

    const j = await postJSON(API.register, { name, phone, password });
    if (j.success){ toast('Akun dibuat, masuk otomatis');
      state.user = j.data.user; state.token = j.data.token;
      afterLogin(true);
    } else toast(j.message || 'Gagal daftar');
  });

  // Login
  $('#loginForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const fd = new FormData(e.target);
    const phone = fd.get('phone').trim();
    const password = fd.get('password');

    const j = await postJSON(API.login, { phone, password });
    if (j.success){ toast('Login sukses');
      state.user = j.data.user; state.token = j.data.token;
      afterLogin();
    } else toast(j.message || 'Gagal login');
  });

  // Add transaction
  $('#txForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    payload.userId = state.user.id;
    payload.amount = Number(payload.amount || 0);

    const j = await postJSON(API.add, payload);
    if (j.success){ toast('Tersimpan');
      e.target.reset(); setDate();
      state.tx.push(j.data); renderTable(state.tx);
    } else toast(j.message || 'Gagal simpan');
  });

  // Logout
  $('#logoutBtn').addEventListener('click', ()=>{
    state.user = null; state.token = null; state.tx = [];
    setAuthUI(false);
    toast('Sampai jumpa!');
    $('#tbody').innerHTML='';
  });

  // Search
  $('#search').addEventListener('input', ()=> renderTable(state.tx));

  // Modals
  $('#closeWelcome').addEventListener('click', closeWelcome);
}

function afterLogin(isNew=false){
  fillHeader();
  setAuthUI(true);
  setDate();
  loadTx();
  if (!isNew) welcome();
}

// Init
window.addEventListener('DOMContentLoaded', ()=>{
  bindForms();
  bindTableActions();
  bindEditModal();
});