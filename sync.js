/*
  Sinkronisasi antar-HP menggunakan Supabase.
  Fallback tetap LocalStorage jika Supabase belum dikonfigurasi.
*/
(function () {
  const config = window.SUPABASE_CONFIG || {};
  const enabled = Boolean(config.url && config.anonKey && window.supabase);
  let client = null;
  let getState = null;
  let setState = null;
  let saveTimer = null;
  let pollTimer = null;
  let applyingRemote = false;
  let lastRemoteUpdatedAt = null;

  async function ensureClient() {
    if (!enabled) return null;
    if (!client) client = window.supabase.createClient(config.url, config.anonKey);
    return client;
  }

  async function pull() {
    const db = await ensureClient();
    if (!db || !getState || !setState) return;
    try {
      const { data: auth } = await db.auth.getSession();
      if (!auth.session) return;
      const { data, error } = await db
        .from('finance_states')
        .select('data,updated_at')
        .eq('user_id', auth.session.user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) { await push(getState()); return; }
      if (lastRemoteUpdatedAt && new Date(data.updated_at) <= new Date(lastRemoteUpdatedAt)) return;
      lastRemoteUpdatedAt = data.updated_at;
      applyingRemote = true;
      setState(data.data);
      applyingRemote = false;
    } catch (e) {
      console.warn('Sinkronisasi gagal mengambil data:', e.message || e);
      applyingRemote = false;
    }
  }

  async function push(state) {
    if (applyingRemote) return;
    const db = await ensureClient();
    if (!db) return;
    try {
      const { data: auth } = await db.auth.getSession();
      if (!auth.session) return;
      const payload = { user_id: auth.session.user.id, data: state, updated_at: new Date().toISOString() };
      const { data, error } = await db
        .from('finance_states')
        .upsert(payload, { onConflict: 'user_id' })
        .select('updated_at')
        .single();
      if (error) throw error;
      lastRemoteUpdatedAt = data.updated_at;
      setStatus('Tersinkron');
    } catch (e) {
      console.warn('Sinkronisasi gagal menyimpan data:', e.message || e);
      setStatus('Belum tersinkron');
    }
  }

  function setStatus(text) {
    const el = document.getElementById('syncStatus');
    if (el) el.textContent = text;
  }

  function queueSave(state) {
    if (!enabled || applyingRemote) return;
    setStatus('Menyimpan…');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => push(state), 350);
  }

  async function refresh() {
    if (!enabled) return;
    await pull();
    const db = await ensureClient();
    if (db) {
      const { data: auth } = await db.auth.getSession();
      if (auth.session) { clearInterval(pollTimer); pollTimer = setInterval(pull, 4000); }
    }
  }

  async function start(ctx) {
    getState = ctx.getState;
    setState = ctx.setState;
    if (!enabled) {
      setStatus('Mode lokal');
      return;
    }
    const db = await ensureClient();
    const { data: auth } = await db.auth.getSession();
    if (!auth.session) {
      setStatus('Belum login');
      return;
    }
    await pull();
    clearInterval(pollTimer);
    pollTimer = setInterval(pull, 4000);
    db.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setStatus('Menghubungkan…');
        await pull();
        clearInterval(pollTimer);
        pollTimer = setInterval(pull, 4000);
      } else {
        clearInterval(pollTimer);
        setStatus('Belum login');
      }
    });
  }

  window.financeSync = { enabled, start, queueSave, setStatus, refresh };
})();
