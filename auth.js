/* ═══════════════════════════════════════════════════════════════
   SRM Platform — Supabase Auth & Database Layer
═══════════════════════════════════════════════════════════════ */

const { createClient } = supabase;
const sb = createClient(
  window.__SRM_CONFIG.supabaseUrl,
  window.__SRM_CONFIG.supabaseKey
);

/* ─── Session state ─── */
let CURRENT_USER = null;
let CURRENT_ORG  = null;

/* ════════════════════════════════════════
   AUTH SCREEN
════════════════════════════════════════ */
function showAuthScreen() {
  document.getElementById('app-shell').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'flex';
  renderAuthForm('login');
}

function showAppShell() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app-shell').style.display  = 'flex';
  updateSidebarUser();
  setTimeout(() => {
    if (typeof enforceRoles === 'function') enforceRoles();
    // Show platform admin link for super admins and sub-admins
    const superAdminNav = document.getElementById('nav-superadmin');
    if (superAdminNav && (CURRENT_USER?.is_super_admin || CURRENT_USER?.is_sub_admin)) {
      superAdminNav.style.display = 'flex';
    }
  }, 100);
}

function updateSidebarUser() {
  const nameEl = document.getElementById('sidebar-user-name');
  const roleEl = document.getElementById('sidebar-user-role');
  const avatarEl = document.getElementById('sidebar-avatar');
  if (nameEl) nameEl.textContent = CURRENT_USER?.full_name || CURRENT_USER?.email || 'User';
  if (roleEl) roleEl.textContent = CURRENT_USER?.is_super_admin ? 'Super Admin' : CURRENT_USER?.is_sub_admin ? 'Platform Admin' : CURRENT_ORG?.name || 'Organisation';
  if (avatarEl) {
    const name = CURRENT_USER?.full_name || '';
    const initials = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || '??';
    avatarEl.textContent = initials;
    if (CURRENT_USER?.is_super_admin) {
      avatarEl.style.background = 'rgba(248,113,113,.25)';
      avatarEl.style.color = '#F87171';
    } else if (CURRENT_USER?.is_sub_admin) {
      avatarEl.style.background = 'rgba(251,191,36,.2)';
      avatarEl.style.color = '#FBB040';
    }
  }
}

function renderAuthForm(mode) {
  const el = document.getElementById('auth-form-area');
  const isLogin = mode === 'login';
  const isSignup = mode === 'signup';
  const isOrgSignup = mode === 'orgsignup';

  if (isOrgSignup) {
    el.innerHTML = `
      <div class="auth-card" style="width:min(520px,100%)">
        <div class="auth-logo">
          <span class="auth-logo-mark">Guardian TPRM</span>
          <span class="auth-logo-sub">Create your organisation</span>
        </div>
        <div style="margin-bottom:20px">
          <div style="display:flex;gap:0;border:1px solid var(--c-border);border-radius:var(--r-md);overflow:hidden;margin-bottom:4px">
            <div style="flex:1;padding:8px 12px;background:var(--c-surface2);text-align:center;font-size:12px;font-weight:600;color:var(--c-accent);border-right:1px solid var(--c-border)">1. Your details</div>
            <div style="flex:1;padding:8px 12px;text-align:center;font-size:12px;color:var(--c-text3)">2. Organisation</div>
            <div style="flex:1;padding:8px 12px;text-align:center;font-size:12px;color:var(--c-text3)">3. Done</div>
          </div>
        </div>
        <div id="auth-error" class="auth-error" style="display:none"></div>
        <div id="orgsignup-step1">
          <div class="form-grid">
            <div class="form-group"><label class="form-label">First name *</label><input class="form-input" id="os-fname" placeholder="Rachel"></div>
            <div class="form-group"><label class="form-label">Last name *</label><input class="form-input" id="os-lname" placeholder="Nakamura"></div>
          </div>
          <div class="form-group"><label class="form-label">Work email *</label><input class="form-input" type="email" id="os-email" placeholder="rachel@organisation.com"></div>
          <div class="form-group"><label class="form-label">Password *</label><input class="form-input" type="password" id="os-password" placeholder="Minimum 8 characters"></div>
          <div class="form-group"><label class="form-label">Your role</label>
            <select class="form-select" id="os-role">
              <option value="admin">Administrator</option>
              <option value="ciso">CISO / Head of Security</option>
              <option value="procurement">Head of Procurement</option>
            </select>
          </div>
          <button class="topbar-btn primary" style="width:100%;justify-content:center;padding:12px" onclick="orgSignupStep2()">Continue →</button>
        </div>
        <div id="orgsignup-step2" style="display:none">
          <div class="form-group"><label class="form-label">Organisation name *</label><input class="form-input" id="os-orgname" placeholder="e.g. Acme Financial Services Ltd"></div>
          <div class="form-group"><label class="form-label">Country</label>
            <select class="form-select" id="os-country">
              <option>United Kingdom</option>
              <option>Nigeria</option>
              <option>South Africa</option>
              <option>Kenya</option>
              <option>Ghana</option>
              <option>United States</option>
              <option>Other</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">Industry</label>
            <select class="form-select" id="os-industry">
              <option>Financial Services / Banking</option>
              <option>Fintech</option>
              <option>Insurance</option>
              <option>Professional Services</option>
              <option>Healthcare</option>
              <option>Technology</option>
              <option>Manufacturing</option>
              <option>Government / Public Sector</option>
              <option>Other</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">Approximate number of suppliers</label>
            <select class="form-select" id="os-suppliers">
              <option value="25">Under 25 — Pilot plan (free)</option>
              <option value="50">25–50 — Starter plan</option>
              <option value="200">50–200 — Professional plan</option>
              <option value="999">200+ — Enterprise plan</option>
            </select>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn" style="flex:1;justify-content:center" onclick="document.getElementById('orgsignup-step2').style.display='none';document.getElementById('orgsignup-step1').style.display='block'">← Back</button>
            <button class="topbar-btn primary" style="flex:2;justify-content:center;padding:12px" onclick="completeOrgSignup()">Create account</button>
          </div>
        </div>
        <div class="auth-switch">Already have an account? <span onclick="renderAuthForm('login')">Sign in</span></div>
      </div>`;
    return;
  }

  el.innerHTML = `
    <div class="auth-card">
      <div class="auth-logo">
        <span class="auth-logo-mark">Guardian TPRM</span>
        <span class="auth-logo-sub">Third-Party Risk Management</span>
      </div>
      <div class="auth-title">${isLogin ? 'Sign in to your account' : 'Create your organisation'}</div>
      <div class="auth-subtitle">${isLogin ? 'Enter your credentials to continue' : 'Set up your SRM platform account'}</div>
      <div id="auth-error" class="auth-error" style="display:none"></div>
      ${!isLogin ? `
        <div class="form-group">
          <label class="form-label">Organisation name *</label>
          <input class="form-input" id="auth-org" placeholder="e.g. Acme Financial Services Ltd">
        </div>` : ''}
      <div class="form-group">
        <label class="form-label">${isLogin ? 'Email address' : 'Your full name *'}</label>
        ${isLogin ? '' : `<input class="form-input" id="auth-fullname" placeholder="e.g. Rachel Nakamura" style="margin-bottom:10px">`}
        <input class="form-input" id="auth-email" type="email" placeholder="you@organisation.com">
      </div>
      <div class="form-group">
        <label class="form-label">Password *</label>
        <input class="form-input" id="auth-password" type="password" placeholder="${isLogin ? 'Your password' : 'Minimum 8 characters'}">
      </div>
      <button class="btn btn-primary" style="width:100%;justify-content:center;padding:10px" onclick="${isLogin ? 'doLogin()' : 'doSignup()'}">
        ${isLogin ? 'Sign in' : 'Create account'}
      </button>
      <div class="auth-switch">
        ${isLogin
          ? `New to Guardian TPRM? <span onclick="renderAuthForm('orgsignup')">Create your organisation</span>`
          : `Already have an account? <span onclick="renderAuthForm('login')">Sign in</span>`}
      </div>
    </div>`;
}

function orgSignupStep2() {
  const fname = document.getElementById('os-fname')?.value.trim();
  const lname = document.getElementById('os-lname')?.value.trim();
  const email = document.getElementById('os-email')?.value.trim();
  const password = document.getElementById('os-password')?.value;
  const errEl = document.getElementById('auth-error');
  errEl.style.display = 'none';
  if (!fname || !lname) { errEl.textContent = 'Please enter your first and last name'; errEl.style.display = 'block'; return; }
  if (!email || !email.includes('@')) { errEl.textContent = 'Please enter a valid email address'; errEl.style.display = 'block'; return; }
  if (!password || password.length < 8) { errEl.textContent = 'Password must be at least 8 characters'; errEl.style.display = 'block'; return; }
  document.getElementById('orgsignup-step1').style.display = 'none';
  document.getElementById('orgsignup-step2').style.display = 'block';
}

async function completeOrgSignup() {
  const fname = document.getElementById('os-fname')?.value.trim();
  const lname = document.getElementById('os-lname')?.value.trim();
  const email = document.getElementById('os-email')?.value.trim();
  const password = document.getElementById('os-password')?.value;
  const role = document.getElementById('os-role')?.value || 'admin';
  const orgName = document.getElementById('os-orgname')?.value.trim();
  const country = document.getElementById('os-country')?.value;
  const industry = document.getElementById('os-industry')?.value;
  const supplierCount = parseInt(document.getElementById('os-suppliers')?.value || '25');
  const errEl = document.getElementById('auth-error');
  errEl.style.display = 'none';
  if (!orgName) { errEl.textContent = 'Please enter your organisation name'; errEl.style.display = 'block'; return; }

  const btn = document.querySelector('#orgsignup-step2 .topbar-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Creating account…'; }

  try {
    // Determine plan based on supplier count
    const plan = supplierCount <= 25 ? 'pilot' : supplierCount <= 50 ? 'starter' : supplierCount <= 200 ? 'professional' : 'enterprise';
    const maxUsers = plan === 'pilot' ? 3 : plan === 'starter' ? 5 : plan === 'professional' ? 15 : 999;

    // Create Supabase auth user
    const { data, error } = await sb.auth.signUp({ email, password, options: { data: { full_name: `${fname} ${lname}` } } });
    if (error) throw error;

    // Create organisation
    const slug = orgName.toLowerCase().replace(/[^a-z0-9]/g,'-').replace(/-+/g,'-') + '-' + Date.now();
    const { data: org, error: orgErr } = await sb.from('organisations').insert({
      name: orgName, slug, plan, active: true,
      max_suppliers: supplierCount, max_users: maxUsers,
    }).select().single();
    if (orgErr) throw orgErr;

    // Create user profile
    await sb.from('users').insert({
      id: data.user.id, org_id: org.id,
      full_name: `${fname} ${lname}`,
      email, role: 'admin', active: true,
    });

    // Show confirmation
    document.getElementById('auth-form-area').innerHTML = `
      <div class="auth-card" style="text-align:center">
        <div style="width:60px;height:60px;background:#EBF5FF;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;border:2px solid #BFDBFE">
          <i class="fa-solid fa-circle-check" style="font-size:26px;color:#1A56DB"></i>
        </div>
        <div style="font-family:'DM Serif Display',serif;font-size:22px;margin-bottom:8px">Account created</div>
        <div style="font-size:13px;color:var(--c-text2);margin-bottom:20px">
          Welcome to Guardian TPRM, ${fname}. Your organisation <strong>${orgName}</strong> has been created on the <strong>${plan}</strong> plan.
          ${plan !== 'pilot' ? '<br><br>To activate your full licence, visit the Billing page after signing in.' : '<br><br>Your pilot account is ready — sign in to get started.'}
        </div>
        <button class="btn btn-primary" style="width:100%;justify-content:center;padding:12px" onclick="renderAuthForm('login')">
          <i class="fa-solid fa-right-to-bracket"></i> Sign in now
        </button>
      </div>`;
  } catch(e) {
    errEl.textContent = e.message || 'Signup failed — please try again';
    errEl.style.display = 'block';
    if (btn) { btn.disabled = false; btn.textContent = 'Create account'; }
  }
}

async function doLogin() {
  const email    = document.getElementById('auth-email')?.value.trim();
  const password = document.getElementById('auth-password')?.value;
  if (!email || !password) { showAuthError('Please enter your email and password'); return; }
  setAuthLoading(true);
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) { showAuthError(error.message); setAuthLoading(false); return; }
  await onSignedIn(data.user);
}

async function doSignup() {
  const orgName  = document.getElementById('auth-org')?.value.trim();
  const fullName = document.getElementById('auth-fullname')?.value.trim();
  const email    = document.getElementById('auth-email')?.value.trim();
  const password = document.getElementById('auth-password')?.value;
  if (!orgName || !fullName || !email || !password) { showAuthError('Please fill in all required fields'); return; }
  if (password.length < 8) { showAuthError('Password must be at least 8 characters'); return; }
  setAuthLoading(true);

  /* 1. Create auth user */
  const { data, error } = await sb.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
  if (error) { showAuthError(error.message); setAuthLoading(false); return; }

  /* 2. Create organisation */
  const slug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  const { data: org, error: orgErr } = await sb.from('organisations').insert({
    name: orgName, slug: slug + '-' + Date.now(), plan: 'pilot', max_suppliers: 50
  }).select().single();
  if (orgErr) { showAuthError('Could not create organisation: ' + orgErr.message); setAuthLoading(false); return; }

  /* 3. Create user record */
  await sb.from('users').insert({
    id: data.user.id, org_id: org.id, full_name: fullName, email, role: 'admin'
  });

  /* 4. Log to audit trail */
  await sb.from('audit_log').insert({
    org_id: org.id, event_type: 'Supplier', performed_by: fullName,
    event_text: `Organisation "${orgName}" created. Admin account activated.`
  });

  CURRENT_USER = { ...data.user, full_name: fullName, role: 'admin' };
  CURRENT_ORG  = org;
  showAppShell();
  navigate('dashboard');
  toast(`Welcome to SRM, ${fullName}`);
}

async function onSignedIn(user) {
  /* Load user profile and org */
  const { data: profile } = await sb.from('users').select('*, organisations(*)').eq('id', user.id).single();
  if (!profile) { showAuthError('User profile not found. Contact support.'); setAuthLoading(false); return; }
  CURRENT_USER = { ...user, ...profile };
  CURRENT_ORG  = profile.organisations;
  showAppShell();
  await loadAllData();
  navigate('dashboard');
  toast(`Welcome back, ${profile.full_name}`);
  // Check for billing success redirect
  if (typeof handleBillingSuccess === 'function') await handleBillingSuccess();
  // Check licence limits
  if (typeof checkLicenceLimits === 'function') checkLicenceLimits();
}

async function doSignOut() {
  await sb.auth.signOut();
  CURRENT_USER = null; CURRENT_ORG = null;
  DB.suppliers = []; DB.actions = []; DB.auditLog = [];
  showAuthScreen();
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function setAuthLoading(loading) {
  const btn = document.querySelector('.auth-card .btn-primary');
  if (btn) btn.textContent = loading ? 'Please wait…' : btn.textContent;
}

function updateSidebarUser() {
  const nameEl = document.querySelector('.user-name');
  const roleEl = document.querySelector('.user-role');
  const avEl   = document.querySelector('.sidebar-user .avatar');
  if (!CURRENT_USER) return;
  if (nameEl) nameEl.textContent = CURRENT_USER.full_name || CURRENT_USER.email;
  if (roleEl) roleEl.textContent = CURRENT_ORG?.name || 'Organisation';
  if (avEl)   avEl.textContent   = initials(CURRENT_USER.full_name || CURRENT_USER.email);
}

/* ════════════════════════════════════════
   DATA LAYER — load from Supabase
════════════════════════════════════════ */
async function loadAllData() {
  if (!CURRENT_ORG) return;
  await Promise.all([loadSuppliers(), loadActions(), loadAuditLog()]);
}

async function loadSuppliers() {
  const { data, error } = await sb.from('suppliers')
    .select(`*, supplier_owners(*), contracts(*), sla_metrics(*), questionnaire_dispatches(*), supplier_history(*), actions(*), certifications(*)`)
    .eq('org_id', CURRENT_ORG.id)
    .order('created_at', { ascending: false });
  if (error) { console.error('loadSuppliers:', error); return; }

  DB.suppliers = (data || []).map(s => ({
    id:             s.id,
    name:           s.name,
    country:        s.country || '—',
    tier:           s.tier,
    riskScore:      s.risk_score || 0,
    status:         s.status || 'Active',
    category:       s.category || '—',
    spend:          s.spend || 0,
    gdprProcessor:  s.gdpr_processor,
    dpa:            s.dpa_status || 'N/A',
    regNo:          s.reg_no || '—',
    certifications: (s.certifications || []).map(c => ({
      certType: c.cert_type, issuingBody: c.issuing_body,
      certNumber: c.cert_number, expiryDate: c.expiry_date,
      scopeStatement: c.scope_statement,
      scopeCovers: c.scope_covers_engagement,
      status: c.status,
    })),
    serviceDesc:     s.service_description,
    systemsAccessed: (s.systems_accessed||[]).join(', '),
    accessLevel:     s.access_level,
    accessType:      s.access_type,
    environment:     s.environment_access,
    engagementNotes: s.engagement_notes,
    piiDetermination: s.pii_determination,
    piiCategories:   s.pii_categories || [],
    piiVolume:       s.pii_volume,
    dimScores: {
      cyber:     s.dim_cyber    || 50,
      financial: s.dim_financial|| 50,
      quality:   s.dim_quality  || 50,
      esg:       s.dim_esg      || 50,
    },
    owner: mapOwner(s.supplier_owners, 'primary'),
    secondOwner: mapOwner(s.supplier_owners, 'secondary'),
    contract: mapContract(s.contracts?.[0]),
    slas: (s.sla_metrics || []).map(sl => ({
      name: sl.name, target: sl.target, actual: sl.actual || sl.target,
      unit: sl.unit, freq: sl.frequency, consequence: sl.consequence || '—',
      _id: sl.id,
    })),
    questionnaires: (s.questionnaire_dispatches || []).map(q => ({
      type: q.questionnaire_type, sent: q.sent_date,
      responded: q.response_date, score: q.score, status: q.status,
      token: q.token, _id: q.id,
    })),
    history: (s.supplier_history || []).map(h => ({
      date: h.created_at?.slice(0,10), event: h.event_text,
      type: h.event_type, user: h.performed_by,
    })),
    reviewDue: s.review_due || '—',
    _id: s.id,
  }));
}

function mapOwner(owners, type) {
  const o = (owners || []).find(x => x.owner_type === type);
  if (!o) return { name: 'Not assigned', role: '', dept: '', email: '', phone: '' };
  return { name: o.full_name, role: o.job_title || '', dept: o.department || '', email: o.email || '', phone: o.phone || '' };
}

function mapContract(c) {
  if (!c) return { ref: '—', type: '—', value: 0, start: '—', end: '—', noticeDays: 30, autoRenew: false, status: 'Active', clauses: [] };
  return {
    ref: c.ref, type: c.contract_type || '—', value: c.annual_value || 0,
    start: c.start_date || '—', end: c.end_date || '—',
    noticeDays: c.notice_days || 30, autoRenew: c.auto_renew || false,
    status: c.status || 'Active', clauses: c.clauses || [],
    _id: c.id,
  };
}

async function loadActions() {
  const { data, error } = await sb.from('actions')
    .select('*').eq('org_id', CURRENT_ORG.id).eq('status', 'Open')
    .order('created_at', { ascending: false });
  if (error) { console.error('loadActions:', error); return; }
  DB.actions = (data || []).map(a => ({
    id: a.id, supId: a.supplier_id, title: a.title,
    priority: a.priority, due: a.due_date || '—',
    fw: a.framework_ref || '—', status: a.status, owner: a.assigned_to || '—',
    createdAt: a.created_at ? new Date(a.created_at).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—',
  }));
}

async function loadAuditLog() {
  const { data, error } = await sb.from('audit_log')
    .select('*').eq('org_id', CURRENT_ORG.id)
    .order('created_at', { ascending: false }).limit(100);
  if (error) { console.error('loadAuditLog:', error); return; }
  DB.auditLog = (data || []).map(e => ({
    date: e.created_at?.slice(0,10), type: e.event_type,
    event: e.event_text, user: e.performed_by, supId: e.supplier_id,
  }));
}

/* ════════════════════════════════════════
   DATA LAYER — write to Supabase
════════════════════════════════════════ */
async function dbSaveSupplier(data) {
  const { data: s, error } = await sb.from('suppliers').insert({
    org_id:        CURRENT_ORG.id,
    name:          data.name,
    country:       data.country,
    category:      data.category,
    tier:          data.riskTier || 'Medium',
    risk_score:    data.riskTier === 'Critical' ? 75 : data.riskTier === 'High' ? 55 : data.riskTier === 'Low' ? 10 : 35,
    status:        'Onboarding',
    spend:         parseInt(data.spend) || 0,
    reg_no:        data.regno,
    gdpr_processor: data.gdpr === 'Yes',
    dpa_status:    data.gdpr === 'Yes' ? 'To be signed' : 'N/A',
    certifications: (data.certs||[]).map(c => c.certType).filter(Boolean),
    dim_cyber: 50, dim_financial: 50, dim_quality: 50, dim_esg: 50,
    review_due: new Date(Date.now() + ((data.riskTier === 'Critical' ? 6 : data.riskTier === 'High' ? 12 : data.riskTier === 'Medium' ? 18 : 24) * 30 * 86400000)).toISOString().slice(0,10),
    service_description: data.serviceDesc || null,
    systems_accessed:    data.systemsAccessed ? [data.systemsAccessed] : [],
    access_level:        data.accessLevel || null,
    access_type:         data.accessType || null,
    environment_access:  data.environment || null,
    engagement_notes:    data.engagementNotes || null,
    pii_processed:       data.piiDetermination === 'Yes',
    pii_determination:   data.piiDetermination || null,
    pii_categories:      data.piiCategories || [],
    pii_volume:          data.piiVolume || null,
  }).select().single();
  if (error) { console.error('dbSaveSupplier:', error); return null; }

  /* Owners */
  const owners = [];
  if (data.o1name) owners.push({ supplier_id: s.id, org_id: CURRENT_ORG.id, owner_type: 'primary', full_name: data.o1name, job_title: data.o1title, department: data.o1dept, email: data.o1email, phone: data.o1phone });
  if (data.o2name) owners.push({ supplier_id: s.id, org_id: CURRENT_ORG.id, owner_type: 'secondary', full_name: data.o2name, job_title: data.o2title, department: data.o2dept, email: data.o2email });
  if (owners.length) await sb.from('supplier_owners').insert(owners);

  /* Contract */
  if (data.cref) {
    await sb.from('contracts').insert({
      supplier_id: s.id, org_id: CURRENT_ORG.id, ref: data.cref,
      contract_type: data.ctype, annual_value: parseInt(data.cval) || 0,
      start_date: data.cstart, end_date: data.cend,
      notice_days: parseInt(data.cnotice) || 30, auto_renew: data.cauto === 'Yes',
      status: 'Active', clauses: ['Standard T&Cs apply','SLA schedule to be agreed'],
    });
  }

  /* Certifications */
  const certs = (data.certs || []).filter(c => c.certType);
  if (certs.length) {
    await sb.from('certifications').insert(certs.map(c => ({
      supplier_id: s.id, org_id: CURRENT_ORG.id,
      cert_type: c.certType, issuing_body: c.issuingBody || null,
      cert_number: c.certNumber || null, expiry_date: c.expiryDate || null,
      scope_statement: c.scopeStatement || null,
      scope_covers_engagement: c.scopeCovers || 'Not assessed',
    })));
    /* Raise actions for scope issues */
    for (const c of certs.filter(c => c.scopeCovers === 'Partially' || c.scopeCovers === 'No')) {
      await sb.from('actions').insert({
        supplier_id: s.id, org_id: CURRENT_ORG.id,
        title: `Certification scope issue — ${c.certType}: scope "${c.scopeCovers}" covers the engagement. Review and confirm coverage.`,
        priority: c.scopeCovers === 'No' ? 'High' : 'Medium',
        framework_ref: 'ISO 27001 A.5.20 / CBN outsourcing guidelines',
        due_date: new Date(Date.now() + 30*86400000).toISOString().slice(0,10),
        assigned_to: data.o1name || 'Business owner', status: 'Open',
      });
    }
  }

  /* SLA metrics */
  const slas = [];
  let si = 0;
  while (true) {
    const name = data[`sla_name_${si}`];
    if (!name) break;
    slas.push({
      supplier_id: s.id, org_id: CURRENT_ORG.id,
      name, target: parseFloat(data[`sla_target_${si}`]) || 0,
      unit: data[`sla_unit_${si}`] || '%',
      frequency: data[`sla_freq_${si}`] || 'Monthly',
      consequence: data[`sla_con_${si}`] || null,
    });
    si++;
  }
  if (slas.length) await sb.from('sla_metrics').insert(slas);

  /* Initial questionnaire dispatch */
  await sb.from('questionnaire_dispatches').insert({
    supplier_id: s.id, org_id: CURRENT_ORG.id,
    questionnaire_type: 'Supplier onboarding', questionnaire_id: 'onboarding-lite',
    sent_date: new Date().toISOString().slice(0,10), status: 'Pending',
    supplier_email: data.qemail || '', deadline_days: 21,
  });

  /* History */
  await sb.from('supplier_history').insert({
    supplier_id: s.id, org_id: CURRENT_ORG.id,
    event_text: `Supplier activated — ${data.riskTier || 'Medium'} tier. Onboarding questionnaire dispatched.`,
    event_type: 'supplier', performed_by: CURRENT_USER?.full_name || 'Admin',
  });

  await dbAuditLog('Supplier', `New supplier "${data.name}" activated — ${data.riskTier || 'Medium'} tier`, s.id);
  return s;
}

async function dbSaveAction(data) {
  const { data: a, error } = await sb.from('actions').insert({
    supplier_id:   data.supId,
    org_id:        CURRENT_ORG.id,
    title:         data.title,
    priority:      data.priority,
    framework_ref: data.fw,
    due_date:      data.due || null,
    assigned_to:   data.owner,
    status:        'Open',
  }).select().single();
  if (error) { console.error('dbSaveAction:', error); return null; }

  await sb.from('supplier_history').insert({
    supplier_id: data.supId, org_id: CURRENT_ORG.id,
    event_text: `Corrective action raised: ${data.title}`,
    event_type: 'action', performed_by: CURRENT_USER?.full_name || 'Admin',
  });
  await dbAuditLog('Action', `Action raised: ${data.title}`, data.supId);
  return a;
}

async function dbCloseAction(id, supId) {
  await sb.from('actions').update({ status: 'Closed', closed_date: new Date().toISOString().slice(0,10) }).eq('id', id);
  await dbAuditLog('Action', `Action closed (ID: ${id})`, supId);
}

async function dbDispatchQ(supId, qDef, email) {
  const { data, error } = await sb.from('questionnaire_dispatches').insert({
    supplier_id: supId, org_id: CURRENT_ORG.id,
    questionnaire_type: qDef.title, questionnaire_id: qDef.id,
    sent_date: new Date().toISOString().slice(0,10),
    status: 'Pending', supplier_email: email || '', deadline_days: 21,
  }).select().single();
  if (error) { console.error('dbDispatchQ:', error); return null; }
  const portalLink = `${window.location.origin}/portal.html?token=${data.token}`;
  await sb.from('supplier_history').insert({
    supplier_id: supId, org_id: CURRENT_ORG.id,
    event_text: `${qDef.title} questionnaire dispatched. Portal link generated.`,
    event_type: 'questionnaire', performed_by: CURRENT_USER?.full_name || 'Admin',
  });
  await dbAuditLog('Questionnaire', `${qDef.title} dispatched — portal link: ${portalLink}`, supId);
  // Send email to supplier if email provided
  if (email) {
    const deadline = new Date(Date.now() + 21*86400000).toLocaleDateString('en-GB');
    await sendEmail('questionnaire_dispatch', email, null, {
      questionnaireType: qDef.title,
      orgName: CURRENT_ORG.name,
      requestedBy: CURRENT_USER?.full_name || 'Your client',
      portalLink,
      deadline,
    });
  }
  return { ...data, portalLink };
}

async function dbAuditLog(type, text, supId = null) {
  await sb.from('audit_log').insert({
    org_id: CURRENT_ORG.id, supplier_id: supId || null,
    event_type: type, event_text: text,
    performed_by: CURRENT_USER?.full_name || 'System',
  });
}

/* ════════════════════════════════════════
   EMAIL — calls the Edge Function
════════════════════════════════════════ */

const EDGE_FUNCTION_URL = 'https://czlqjrfmtpmiicfzuzys.supabase.co/functions/v1/hyper-service';

async function sendEmail(type, to, toName, data) {
  try {
    const { data: { session } } = await sb.auth.getSession();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || window.__SRM_CONFIG.supabaseKey}`,
        'apikey': window.__SRM_CONFIG.supabaseKey,
      },
      body: JSON.stringify({ type, to, toName, data }),
    });
    clearTimeout(timeout);
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Email send failed');
    await sb.from('email_log').insert({
      org_id: CURRENT_ORG?.id,
      email_type: type,
      recipient_email: to,
      recipient_name: toName || '',
      subject: `${type} — ${data?.orgName || ''}`,
      status: 'sent',
      sent_at: new Date().toISOString(),
    });
    return { success: true };
  } catch(e) {
    console.warn('sendEmail:', e.message);
    await sb.from('email_log').insert({
      org_id: CURRENT_ORG?.id,
      email_type: type,
      recipient_email: to,
      recipient_name: toName || '',
      subject: type,
      status: 'failed',
      error_text: e.message,
    }).catch(() => {});
    return { success: false, error: e.message };
  }
}
async function initApp() {
  const { data: { session } } = await sb.auth.getSession();
  if (session?.user) {
    await onSignedIn(session.user);
  } else {
    showAuthScreen();
  }
  /* Listen for auth state changes */
  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') { showAuthScreen(); }
  });
}
