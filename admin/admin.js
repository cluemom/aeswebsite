/**
 * AES Admin CMS — clean rewrite
 * No IIFE, no clever patterns. Just functions that run in order.
 */

// ─── Config ──────────────────────────────────────────────────────────────────
var AES_PASSWORD   = 'aesadmin2025';
var AES_AUTH_KEY   = 'aes_dev_auth';
var AES_CONTENT_KEY = 'aes_content';
var AES_SLOTS_KEY  = 'aes_slots';
var AES_TOKEN_KEY  = 'aes_cms_token';
var AES_NUM_SLOTS  = 8;
var GH_OWNER = 'cluemom';
var GH_REPO  = 'aeswebsite';
var GH_FILE  = 'content.json';

// ─── State ───────────────────────────────────────────────────────────────────
var _content      = {};
var _lastSaved    = '';
var _currentSection = null;

// ─── Schema ──────────────────────────────────────────────────────────────────
var SCHEMA = [
  {
    group: 'Home Page', icon: '🏠',
    sections: [
      { id: 'home_hero', label: 'Hero', preview: '../index.html',
        fields: [
          { type: 'textarea', label: 'Subtitle',         path: 'home.hero.subtitle', rows: 2 },
          { type: 'image',    label: 'Background Image', path: 'home.hero.image' },
        ]},
      { id: 'home_services', label: 'Services Section', preview: '../index.html',
        fields: [
          { type: 'textarea', label: 'Lead Text', path: 'home.services.lead', rows: 2 },
        ]},
      { id: 'home_stats', label: 'Stats Strip', preview: '../index.html',
        fields: [
          { type: 'text', label: 'Stat 1 Label', path: 'home.stats.label0' },
          { type: 'text', label: 'Stat 2 Label', path: 'home.stats.label1' },
          { type: 'text', label: 'Stat 3 Label', path: 'home.stats.label2' },
          { type: 'text', label: 'Stat 4 Label', path: 'home.stats.label3' },
        ]},
      { id: 'home_partner', label: 'Your Ally Section', preview: '../index.html',
        fields: [
          { type: 'text',     label: 'Heading',   path: 'home.partner.title' },
          { type: 'textarea', label: 'Body Text', path: 'home.partner.body', rows: 4 },
          { type: 'image',    label: 'Image',     path: 'home.partner.image' },
        ]},
      { id: 'home_process', label: 'How We Work', preview: '../index.html',
        fields: [
          { type: 'text',     label: 'Step 1 Title', path: 'home.process.step0.title' },
          { type: 'textarea', label: 'Step 1 Body',  path: 'home.process.step0.body', rows: 2 },
          { type: 'text',     label: 'Step 2 Title', path: 'home.process.step1.title' },
          { type: 'textarea', label: 'Step 2 Body',  path: 'home.process.step1.body', rows: 2 },
          { type: 'text',     label: 'Step 3 Title', path: 'home.process.step2.title' },
          { type: 'textarea', label: 'Step 3 Body',  path: 'home.process.step2.body', rows: 2 },
          { type: 'text',     label: 'Step 4 Title', path: 'home.process.step3.title' },
          { type: 'textarea', label: 'Step 4 Body',  path: 'home.process.step3.body', rows: 2 },
        ]},
      { id: 'home_technology', label: 'Technology Section', preview: '../index.html',
        fields: [
          { type: 'text',     label: 'Heading',   path: 'home.technology.title' },
          { type: 'textarea', label: 'Body Text', path: 'home.technology.body', rows: 4 },
        ]},
      { id: 'home_cta', label: 'CTA Section', preview: '../index.html',
        fields: [
          { type: 'textarea', label: 'Body Text', path: 'home.reach.body', rows: 2 },
        ]},
    ]
  },
  {
    group: 'Company Page', icon: '🏢',
    sections: [
      { id: 'company_hero', label: 'Page Hero', preview: '../company.html',
        fields: [
          { type: 'textarea', label: 'Lead Text',    path: 'company.hero.lead', rows: 2 },
          { type: 'image',    label: 'Section Image',path: 'company.hero.image' },
        ]},
      { id: 'company_pullquote', label: 'Pull Quote', preview: '../company.html',
        fields: [
          { type: 'textarea', label: 'Quote Text', path: 'company.pullquote', rows: 3 },
        ]},
      { id: 'company_philosophy', label: 'Our Philosophy', preview: '../company.html',
        fields: [
          { type: 'text',      label: 'Heading',   path: 'company.philosophy.title' },
          { type: 'textarea',  label: 'Body Text', path: 'company.philosophy.body', rows: 5 },
          { type: 'checklist', label: 'Checklist', path: 'company.philosophy.checklist' },
        ]},
      { id: 'company_team', label: 'Our Team', preview: '../company.html',
        fields: [
          { type: 'text',     label: 'Heading',      path: 'company.team.title' },
          { type: 'textarea', label: 'Lead Text',    path: 'company.team.body', rows: 4 },
          { type: 'textarea', label: 'Side Body',    path: 'company.team.sidebody', rows: 3 },
          { type: 'text',     label: 'Card 1: Name', path: 'company.team.cards.0.name' },
          { type: 'text',     label: 'Card 1: Role', path: 'company.team.cards.0.role' },
          { type: 'textarea', label: 'Card 1: Desc', path: 'company.team.cards.0.desc', rows: 2 },
          { type: 'text',     label: 'Card 2: Name', path: 'company.team.cards.1.name' },
          { type: 'text',     label: 'Card 2: Role', path: 'company.team.cards.1.role' },
          { type: 'textarea', label: 'Card 2: Desc', path: 'company.team.cards.1.desc', rows: 2 },
          { type: 'text',     label: 'Card 3: Name', path: 'company.team.cards.2.name' },
          { type: 'text',     label: 'Card 3: Role', path: 'company.team.cards.2.role' },
          { type: 'textarea', label: 'Card 3: Desc', path: 'company.team.cards.2.desc', rows: 2 },
          { type: 'text',     label: 'Card 4: Name', path: 'company.team.cards.3.name' },
          { type: 'text',     label: 'Card 4: Role', path: 'company.team.cards.3.role' },
          { type: 'textarea', label: 'Card 4: Desc', path: 'company.team.cards.3.desc', rows: 2 },
        ]},
      { id: 'company_clients', label: 'For Our Clients', preview: '../company.html',
        fields: [
          { type: 'text',      label: 'Heading',   path: 'company.clients.title' },
          { type: 'textarea',  label: 'Body Text', path: 'company.clients.body', rows: 4 },
          { type: 'image',     label: 'Image',     path: 'company.clients.image' },
          { type: 'checklist', label: 'Checklist', path: 'company.clients.checklist' },
        ]},
      { id: 'company_partners', label: 'For Our Partners', preview: '../company.html',
        fields: [
          { type: 'text',      label: 'Heading',   path: 'company.partners.title' },
          { type: 'textarea',  label: 'Body Text', path: 'company.partners.body', rows: 4 },
          { type: 'image',     label: 'Image',     path: 'company.partners.image' },
          { type: 'checklist', label: 'Checklist', path: 'company.partners.checklist' },
        ]},
      { id: 'company_cta', label: 'CTA Section', preview: '../company.html',
        fields: [
          { type: 'textarea', label: 'Body Text', path: 'company.cta.body', rows: 2 },
        ]},
    ]
  },
  {
    group: 'Client Solutions', icon: '💼',
    sections: [
      { id: 'solutions_intro', label: 'Page Intro', preview: '../client-solutions.html',
        fields: [
          { type: 'textarea', label: 'Lead Text', path: 'solutions.intro.body', rows: 3 },
        ]},
      { id: 'solutions_card1', label: 'Project Management', preview: '../client-solutions.html',
        fields: [
          { type: 'text',      label: 'Title',        path: 'solutions.cards.0.title' },
          { type: 'textarea',  label: 'Body Text',    path: 'solutions.cards.0.body', rows: 4 },
          { type: 'image',     label: 'Image',        path: 'solutions.cards.0.image' },
          { type: 'checklist', label: 'Feature List', path: 'solutions.cards.0.items' },
        ]},
      { id: 'solutions_card2', label: 'Audio Visual & Labor', preview: '../client-solutions.html',
        fields: [
          { type: 'text',      label: 'Title',        path: 'solutions.cards.1.title' },
          { type: 'textarea',  label: 'Body Text',    path: 'solutions.cards.1.body', rows: 4 },
          { type: 'image',     label: 'Image',        path: 'solutions.cards.1.image' },
          { type: 'checklist', label: 'Feature List', path: 'solutions.cards.1.items' },
        ]},
      { id: 'solutions_card3', label: 'Digital Services', preview: '../client-solutions.html',
        fields: [
          { type: 'text',      label: 'Title',        path: 'solutions.cards.2.title' },
          { type: 'textarea',  label: 'Body Text',    path: 'solutions.cards.2.body', rows: 4 },
          { type: 'image',     label: 'Image',        path: 'solutions.cards.2.image' },
          { type: 'checklist', label: 'Feature List', path: 'solutions.cards.2.items' },
        ]},
      { id: 'solutions_tech', label: 'Technology Banner', preview: '../client-solutions.html',
        fields: [
          { type: 'text',     label: 'Heading',   path: 'solutions.tech.title' },
          { type: 'textarea', label: 'Body Text', path: 'solutions.tech.body', rows: 3 },
        ]},
      { id: 'solutions_cta', label: 'CTA Section', preview: '../client-solutions.html',
        fields: [
          { type: 'textarea', label: 'Body Text', path: 'solutions.cta.body', rows: 2 },
        ]},
    ]
  },
  {
    group: 'Contact', icon: '📞',
    sections: [
      { id: 'contact_main', label: 'Contact Info & Emails', preview: '../contact.html',
        fields: [
          { type: 'textarea', label: 'Intro Text',    path: 'contact.intro',         rows: 3 },
          { type: 'email',    label: 'Sales Email',   path: 'contact.emails.sales' },
          { type: 'email',    label: 'General Email', path: 'contact.emails.info' },
          { type: 'email',    label: 'Support Email', path: 'contact.emails.support' },
          { type: 'image',    label: 'Photo',         path: 'contact.image' },
        ]},
      { id: 'contact_cta', label: 'CTA Section', preview: '../contact.html',
        fields: [
          { type: 'textarea', label: 'Body Text', path: 'contact.cta.body', rows: 2 },
        ]},
    ]
  },
  {
    group: 'Global', icon: '⚙️',
    sections: [
      { id: 'global_settings', label: 'Global Settings', preview: '../index.html',
        fields: [
          { type: 'text',     label: 'Phone Number',   path: 'global.phone' },
          { type: 'email',    label: 'Email Address',  path: 'global.email' },
          { type: 'url',      label: 'Website',        path: 'global.website' },
          { type: 'textarea', label: 'Footer Tagline', path: 'global.tagline', rows: 2 },
        ]},
      { id: 'api_settings', label: 'API Settings', preview: null,
        fields: [
          { type: 'password', label: 'GitHub Token', path: '__token',
            hint: 'Fine-grained PAT with Contents read+write on cluemom/aeswebsite. Required to Publish.' },
        ]},
    ]
  },
];

// ─── localStorage helpers ─────────────────────────────────────────────────────
function lsGet(k)    { try { return localStorage.getItem(k); }    catch(e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); }        catch(e) {} }
function lsRemove(k) { try { localStorage.removeItem(k); }        catch(e) {} }

// ─── Utilities ────────────────────────────────────────────────────────────────
function getPath(obj, path) {
  return path.split('.').reduce(function(a, k) { return a != null ? a[k] : undefined; }, obj);
}
function setPath(obj, path, value) {
  var keys = path.split('.'), last = keys.pop();
  var t = keys.reduce(function(a, k, i) {
    if (a[k] == null || typeof a[k] !== 'object') a[k] = isNaN(Number(keys[i+1])) ? {} : [];
    return a[k];
  }, obj);
  t[last] = value;
}
function cloneObj(obj) { return JSON.parse(JSON.stringify(obj)); }
function snapStr(obj)  { return JSON.stringify(obj); }
function esc(s)  { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function escA(s) { return String(s).replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function flatSections() {
  return SCHEMA.reduce(function(a, g) { return a.concat(g.sections); }, []);
}
function findSection(id) {
  return flatSections().find(function(s) { return s.id === id; });
}
function getCMSToken() { return lsGet(AES_TOKEN_KEY) || ''; }
function setCMSToken(t) { lsSet(AES_TOKEN_KEY, t); }

// ─── Auth ─────────────────────────────────────────────────────────────────────
function aesLogin() {
  var pw = document.getElementById('login-password');
  if (!pw) return;
  if (pw.value === AES_PASSWORD) {
    lsSet(AES_AUTH_KEY, 'true');
    showEditor();
  } else {
    pw.value = '';
    pw.focus();
    pw.style.borderColor = '#e74c3c';
    setTimeout(function() { pw.style.borderColor = ''; }, 800);
  }
}

function aesLogout() {
  lsRemove(AES_AUTH_KEY);
  document.getElementById('editor-app').style.display   = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  var pw = document.getElementById('login-password');
  if (pw) { pw.value = ''; pw.focus(); }
}

function showEditor() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('editor-app').style.display   = 'flex';
  loadAndRender();
}

// ─── Content load ─────────────────────────────────────────────────────────────
async function loadContent() {
  // 1. localStorage first
  try {
    var stored = lsGet(AES_CONTENT_KEY);
    if (stored) { var p = JSON.parse(stored); if (p && typeof p === 'object') return p; }
  } catch(e) {}
  // 2. content.json
  try {
    var r = await fetch('../content.json');
    if (r.ok) return await r.json();
  } catch(e) {}
  return {};
}

// ─── Slots ────────────────────────────────────────────────────────────────────
function loadSlots() {
  try {
    var s = lsGet(AES_SLOTS_KEY);
    if (s) {
      var a = JSON.parse(s);
      if (Array.isArray(a)) {
        while (a.length < AES_NUM_SLOTS) a.push(null);
        return a.slice(0, AES_NUM_SLOTS);
      }
    }
  } catch(e) {}
  return new Array(AES_NUM_SLOTS).fill(null);
}
function saveSlots(slots) { lsSet(AES_SLOTS_KEY, JSON.stringify(slots)); }

function saveToSlot(i) {
  var slots = loadSlots();
  var now   = new Date();
  slots[i]  = {
    timestamp: now.toISOString(),
    label: now.toLocaleString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }),
    content: cloneObj(_content),
  };
  saveSlots(slots);
  lsSet(AES_CONTENT_KEY, JSON.stringify(_content));
  _lastSaved = snapStr(_content);
  setUnsaved(false);
  renderSlotBubbles();
  showToast('Slot ' + (i+1) + ' saved ✓', 'success');
}

function loadFromSlot(i) {
  var slot = loadSlots()[i];
  if (!slot) return;
  _content   = cloneObj(slot.content);
  _lastSaved = snapStr(_content);
  lsSet(AES_CONTENT_KEY, JSON.stringify(_content));
  setUnsaved(false);
  if (_currentSection) activateSection(_currentSection); else renderWelcome();
  showToast('Slot ' + (i+1) + ' loaded — ' + slot.label, 'info');
}

function clearSlot(i) {
  var slots = loadSlots();
  slots[i] = null;
  saveSlots(slots);
  renderSlotBubbles();
  showToast('Slot ' + (i+1) + ' cleared', 'info');
}

function renderSlotBubbles() {
  var container = document.getElementById('slot-bubbles');
  if (!container) return;
  container.innerHTML = '';
  var slots = loadSlots();
  slots.forEach(function(slot, i) {
    var b = document.createElement('div');
    b.className = 'slot-bubble ' + (slot ? 'slot-filled' : 'slot-empty');
    b.dataset.index = i;

    var num = document.createElement('span');
    num.className = 'slot-num';
    num.textContent = i + 1;
    b.appendChild(num);

    if (slot) {
      var ts = document.createElement('span');
      ts.className = 'slot-ts';
      var d = new Date(slot.timestamp);
      ts.textContent = isNaN(d) ? slot.label
        : d.toLocaleString('en-US', { month:'short', day:'numeric' }) + '\n' +
          d.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
      b.appendChild(ts);

      var x = document.createElement('button');
      x.className = 'slot-clear-btn';
      x.textContent = '×';
      x.title = 'Clear slot ' + (i+1);
      x.addEventListener('click', function(e) {
        e.stopPropagation();
        if (confirm('Clear slot ' + (i+1) + '?')) clearSlot(i);
      });
      b.appendChild(x);
      b.title = 'Click to load — ' + slot.label;
      b.addEventListener('click', function() { loadFromSlot(i); });
    } else {
      b.title = 'Click to save here';
      b.addEventListener('click', function() { saveToSlot(i); });
    }
    container.appendChild(b);
  });
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function buildSidebar() {
  var nav = document.getElementById('sidebar-nav');
  if (!nav) return;
  nav.innerHTML = '';
  SCHEMA.forEach(function(group) {
    var g = document.createElement('div');
    g.className = 'nav-group';
    var lbl = document.createElement('div');
    lbl.className = 'nav-group-label';
    lbl.textContent = group.icon + ' ' + group.group;
    g.appendChild(lbl);
    group.sections.forEach(function(section) {
      var btn = document.createElement('button');
      btn.className = 'nav-item';
      btn.dataset.sectionId = section.id;
      btn.textContent = section.label;
      btn.addEventListener('click', function() { activateSection(section.id); });
      g.appendChild(btn);
    });
    nav.appendChild(g);
  });
}

function activateSection(id) {
  _currentSection = id;
  document.querySelectorAll('.nav-item').forEach(function(el) {
    el.classList.toggle('active', el.dataset.sectionId === id);
  });
  var section = findSection(id);
  if (!section) return;
  document.getElementById('topbar-section-title').textContent = section.label;
  var previewBtn = document.querySelector('.btn-preview');
  if (previewBtn) {
    if (section.preview) { previewBtn.href = section.preview; previewBtn.style.display = ''; }
    else                  { previewBtn.style.display = 'none'; }
  }
  renderSection(section);
  var welcome = document.getElementById('editor-welcome');
  if (welcome) welcome.style.display = 'none';
}

function renderWelcome() {
  var main = document.getElementById('editor-main');
  if (main) main.innerHTML = '';
  var title = document.getElementById('topbar-section-title');
  if (title) title.textContent = 'Select a section';
  var welcome = document.getElementById('editor-welcome');
  if (welcome) welcome.style.display = 'block';
}

// ─── Field rendering ──────────────────────────────────────────────────────────
function renderSection(section) {
  var main = document.getElementById('editor-main');
  var html = '<div class="section-editor">';
  html += '<div class="section-editor-header">';
  html += '<h2 class="section-editor-title">' + esc(section.label) + '</h2>';
  if (section.preview) html += '<a href="' + section.preview + '" target="_blank" class="section-preview-link">Open page →</a>';
  html += '</div>';
  section.fields.forEach(function(f) { html += renderField(f); });
  html += '</div>';
  main.innerHTML = html;
  wireFieldEvents(section);
}

function renderField(f) {
  var isToken = f.path === '__token';
  var val = isToken ? getCMSToken() : (getPath(_content, f.path) != null ? getPath(_content, f.path) : '');
  var html = '<div class="field-group">';
  html += '<label class="field-label">' + esc(f.label);
  if (f.hint) html += ' <span class="field-hint">— ' + esc(f.hint) + '</span>';
  html += '</label>';
  if (f.type === 'textarea') {
    html += '<textarea class="field-input" rows="' + (f.rows||4) + '" data-path="' + f.path + '">' + esc(String(val)) + '</textarea>';
  } else if (f.type === 'checklist') {
    html += renderChecklist(f.path, val);
  } else if (f.type === 'image') {
    html += '<div class="image-field-wrap">';
    html += '<input type="url" class="field-input image-url-input" data-path="' + f.path + '" value="' + escA(String(val)) + '" placeholder="https://…" />';
    html += '</div>';
    html += '<div class="img-preview-wrap">';
    html += val ? '<img class="img-preview" src="' + escA(String(val)) + '" alt="Preview" />'
                : '<div class="img-empty">No image set</div>';
    html += '</div>';
  } else if (f.type === 'password') {
    html += '<div class="password-wrap">';
    html += '<input type="password" class="field-input" data-path="' + f.path + '" value="' + escA(String(val)) + '" autocomplete="new-password" />';
    html += '<button type="button" class="toggle-password" title="Show/hide">👁</button>';
    html += '</div>';
  } else {
    html += '<input type="' + f.type + '" class="field-input" data-path="' + f.path + '" value="' + escA(String(val)) + '" />';
  }
  html += '</div>';
  return html;
}

function renderChecklist(path, arr) {
  if (!Array.isArray(arr)) arr = [];
  var html = '<div class="checklist-editor" data-path="' + path + '">';
  arr.forEach(function(item, i) {
    html += '<div class="checklist-item">';
    html += '<span class="checklist-drag">⠿</span>';
    html += '<input type="text" class="field-input checklist-input" data-index="' + i + '" value="' + escA(item) + '" />';
    html += '<button type="button" class="checklist-remove" data-index="' + i + '" title="Remove">×</button>';
    html += '</div>';
  });
  html += '<button type="button" class="checklist-add">＋ Add Item</button>';
  html += '</div>';
  return html;
}

function wireFieldEvents(section) {
  var main = document.getElementById('editor-main');
  main.querySelectorAll('input.field-input, textarea.field-input').forEach(function(input) {
    var path = input.dataset.path;
    if (!path) return;
    input.addEventListener('input', function() {
      if (path === '__token') { setCMSToken(input.value); return; }
      setPath(_content, path, input.value);
      markChanged();
      if (input.classList.contains('image-url-input')) {
        var wrap = input.closest('.field-group').querySelector('.img-preview-wrap');
        if (wrap) wrap.innerHTML = input.value
          ? '<img class="img-preview" src="' + escA(input.value) + '" alt="Preview" onerror="this.style.opacity=\'0.3\'" />'
          : '<div class="img-empty">No image set</div>';
      }
    });
  });
  main.querySelectorAll('.toggle-password').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var inp = btn.previousElementSibling;
      if (inp) inp.type = inp.type === 'password' ? 'text' : 'password';
    });
  });
  main.querySelectorAll('.checklist-editor').forEach(function(editor) {
    wireChecklist(editor, editor.dataset.path);
  });
}

function wireChecklist(editor, path) {
  editor.addEventListener('input', function(e) {
    if (e.target.classList.contains('checklist-input')) {
      var arr = getPath(_content, path);
      if (Array.isArray(arr)) { arr[parseInt(e.target.dataset.index, 10)] = e.target.value; markChanged(); }
    }
  });
  editor.addEventListener('click', function(e) {
    if (e.target.classList.contains('checklist-remove')) {
      var arr = getPath(_content, path);
      if (Array.isArray(arr)) {
        arr.splice(parseInt(e.target.dataset.index, 10), 1);
        setPath(_content, path, arr);
        markChanged();
        replaceChecklist(editor, path);
      }
    }
  });
  var addBtn = editor.querySelector('.checklist-add');
  if (addBtn) addBtn.addEventListener('click', function() {
    var arr = getPath(_content, path);
    if (!Array.isArray(arr)) arr = [];
    arr.push('New item');
    setPath(_content, path, arr);
    markChanged();
    replaceChecklist(editor, path);
    var ne = document.querySelector('.checklist-editor[data-path="' + path + '"]');
    if (ne) { var inputs = ne.querySelectorAll('.checklist-input'); if (inputs.length) inputs[inputs.length-1].select(); }
  });
}

function replaceChecklist(old, path) {
  var arr = getPath(_content, path);
  var tmp = document.createElement('div');
  tmp.innerHTML = renderChecklist(path, arr);
  old.replaceWith(tmp.firstChild);
  var ne = document.querySelector('.checklist-editor[data-path="' + path + '"]');
  if (ne) wireChecklist(ne, path);
}

// ─── Unsaved state ────────────────────────────────────────────────────────────
function hasChanges() { return snapStr(_content) !== _lastSaved; }
function markChanged() {
  var badge  = document.getElementById('unsaved-badge');
  var cancel = document.getElementById('cancel-btn');
  if (hasChanges()) {
    if (badge)  badge.style.display  = 'inline-block';
    if (cancel) cancel.style.display = 'inline-flex';
  }
}
function setUnsaved(yes) {
  var badge  = document.getElementById('unsaved-badge');
  var cancel = document.getElementById('cancel-btn');
  if (badge)  badge.style.display  = yes ? 'inline-block' : 'none';
  if (cancel) cancel.style.display = yes ? 'inline-flex'  : 'none';
}
function cancelChanges() {
  if (!hasChanges()) { showToast('No changes to discard', 'info'); return; }
  _content = JSON.parse(_lastSaved);
  setUnsaved(false);
  if (_currentSection) activateSection(_currentSection); else renderWelcome();
  showToast('Changes discarded', 'info');
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function showToast(msg, type) {
  var c = document.getElementById('toast-container');
  if (!c) return;
  var t = document.createElement('div');
  t.className = 'toast toast-' + (type || 'success');
  t.textContent = msg;
  c.appendChild(t);
  requestAnimationFrame(function() { requestAnimationFrame(function() { t.classList.add('show'); }); });
  setTimeout(function() {
    t.classList.remove('show');
    t.addEventListener('transitionend', function() { t.remove(); }, { once: true });
  }, 3000);
}

// ─── Publish ──────────────────────────────────────────────────────────────────
async function publishContent() {
  var token = getCMSToken();
  if (!token) { showToast('No GitHub token — add it in Global → API Settings', 'error'); return; }
  var btn = document.getElementById('publish-btn');
  btn.disabled = true;
  btn.textContent = 'Publishing…';
  lsSet(AES_CONTENT_KEY, JSON.stringify(_content));
  try {
    var apiBase = 'https://api.github.com/repos/' + GH_OWNER + '/' + GH_REPO + '/contents/' + GH_FILE;
    var headers = {
      'Accept': 'application/vnd.github+json',
      'Authorization': 'Bearer ' + token,
      'X-GitHub-Api-Version': '2022-11-28',
    };
    var getRes = await fetch(apiBase, { headers: headers });
    if (getRes.status === 401) throw new Error('GitHub token invalid — update it in Global → API Settings');
    if (!getRes.ok) throw new Error('Could not read content.json (' + getRes.status + ')');
    var sha = (await getRes.json()).sha;
    var encoded = btoa(unescape(encodeURIComponent(JSON.stringify(_content, null, 2))));
    var putRes = await fetch(apiBase, {
      method: 'PUT',
      headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
      body: JSON.stringify({ message: 'Update content.json via CMS', content: encoded, sha: sha }),
    });
    if (!putRes.ok) {
      var err = await putRes.json().catch(function(){ return {}; });
      throw new Error('GitHub commit failed: ' + (err.message || putRes.status));
    }
    _lastSaved = snapStr(_content);
    setUnsaved(false);
    showToast('Published ✓ — Render redeploy triggered', 'success');
  } catch(e) {
    showToast(e.message, 'error');
  }
  btn.disabled = false;
  btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg> Publish';
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────
async function loadAndRender() {
  _content   = await loadContent();
  _lastSaved = snapStr(_content);
  buildSidebar();
  // wire topbar buttons
  var cancelBtn   = document.getElementById('cancel-btn');
  var publishBtn  = document.getElementById('publish-btn');
  var sidebarToggle = document.getElementById('sidebar-toggle');
  var logoutBtn   = document.getElementById('logout-btn');
  if (cancelBtn)    cancelBtn.onclick   = cancelChanges;
  if (publishBtn)   publishBtn.onclick  = publishContent;
  if (logoutBtn)    logoutBtn.onclick   = aesLogout;
  if (sidebarToggle) sidebarToggle.onclick = function() {
    document.getElementById('editor-app').classList.toggle('sidebar-collapsed');
  };
  renderSlotBubbles();
}

// Script is at bottom of <body> so DOM is already ready — call directly.
var loginBtn = document.getElementById('login-btn');
var loginPw  = document.getElementById('login-password');
if (loginBtn) loginBtn.onclick = aesLogin;
if (loginPw)  loginPw.onkeydown = function(e) { if (e.key === 'Enter') aesLogin(); };

// Auto-login if session is still active
if (lsGet(AES_AUTH_KEY) === 'true') {
  showEditor();
}
