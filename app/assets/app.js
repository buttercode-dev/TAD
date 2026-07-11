(function () {
  'use strict';
  var E = window.AdminEngine;
  var system = document.body.dataset.system || 'invoice';
  var config = E.systems[system];
  var sensitiveSystemLocked = system === 'practice';
  var records = load();
  if (sensitiveSystemLocked) {
    localStorage.removeItem(config.storageKey);
    records = [];
  }
  var editingIndex = null;
  var activeFilter = 'all';
  var query = '';
  var subtitles = {
    invoice: 'Supplier invoices, approvals, filing, duplicates and exceptions — controlled before anything moves forward.',
    sales: 'Enquiries, quotes, follow-ups and lost-lead risk — every lead gets an owner and a next action.',
    client: 'Onboarding, documents, payment, folders and handover gates — no client starts with missing pieces.',
    property: 'Tenant requests, maintenance, owner approvals, scheduling and proof — no property issue disappears in WhatsApp.',
    practice: 'Bookings, confirmations, documents, payments and no-show risks — front desk work stays visible and controlled.',
    member: 'Member onboarding, attendance risk, payment follow-ups and reactivation — every member gets a next action.'
  };

  function $(id) { return document.getElementById(id); }
  function escapeHtml(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[c]; }); }
  function load() { try { return JSON.parse(localStorage.getItem(config.storageKey)) || []; } catch (e) { return []; } }
  function save() { localStorage.setItem(config.storageKey, JSON.stringify(records)); }
  function fieldKeys() { return config.fields.map(function (f) { return f[0]; }); }
  function idOf(r) { return r[config.id] || ''; }
  function label(k) { return k.replace(/_/g, ' ').replace(/\b\w/g, function (m) { return m.toUpperCase(); }); }
  function statusPill(result) { return '<span class="pill ' + result.status.toLowerCase() + '">' + result.status + '</span>'; }
  function toast(message) {
    var t = $('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = message;
    t.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { t.classList.remove('show'); }, 2100);
  }

  function ensureEnhancements() {
    if (!$('data-safety-notice')) {
      var notice = document.createElement('div');
      notice.id = 'data-safety-notice';
      notice.setAttribute('role', 'note');
      notice.style.cssText = 'margin:0 0 18px;padding:14px 16px;border:1px solid #b56b00;background:#fff8e8;color:#4a3212;font-size:13px;line-height:1.5';
      notice.innerHTML = sensitiveSystemLocked
        ? '<strong>Public demonstration only.</strong> Patient or health information is not accepted here. Adding, editing and importing records is disabled. Use sample data only.'
        : '<strong>Browser-only pilot.</strong> Do not enter identity numbers, banking details, medical information, passwords or other sensitive data. Records stay only in this browser and may be lost.';
      var head = document.querySelector('.app-head');
      if (head) head.before(notice);
    }
    if (!$('toolbar')) {
      var wrap = document.querySelector('.tablewrap');
      var toolbar = document.createElement('div');
      toolbar.id = 'toolbar';
      toolbar.className = 'toolbar';
      toolbar.innerHTML = '<div class="searchbox"><input id="record-search" placeholder="Search records, owners, status, notes…" autocomplete="off"></div><div id="filters" class="filters"></div>';
      wrap.parentNode.insertBefore(toolbar, wrap);
      $('record-search').addEventListener('input', function (e) { query = e.target.value.trim().toLowerCase(); render(); });
    }
    if (!$('record-cards')) {
      var cards = document.createElement('div');
      cards.id = 'record-cards';
      cards.className = 'record-cards';
      document.querySelector('.tablewrap').after(cards);
    }
    if (!$('toast')) {
      var t = document.createElement('div');
      t.id = 'toast';
      t.className = 'toast';
      document.body.appendChild(t);
    }
  }

  function filterRecords(validations) {
    return records.map(function (r, i) { return { r: r, i: i, v: validations[i] }; }).filter(function (item) {
      var textMatch = !query || JSON.stringify(item.r).toLowerCase().indexOf(query) >= 0 || item.v.flags.map(function (f) { return f.label; }).join(' ').toLowerCase().indexOf(query) >= 0;
      var filterMatch = activeFilter === 'all' || (activeFilter === 'blocked' && item.v.status === 'Fail') || (activeFilter === 'passed' && item.v.status === 'Pass') || item.r.status === activeFilter;
      return textMatch && filterMatch;
    });
  }

  function renderFilters() {
    var statuses = Array.from(new Set(records.map(function (r) { return r.status; }).filter(Boolean)));
    var chips = [{ key: 'all', label: 'All' }, { key: 'blocked', label: 'Blocked' }, { key: 'passed', label: 'Passed' }].concat(statuses.map(function (s) { return { key: s, label: s }; }));
    $('filters').innerHTML = chips.map(function (c) { return '<button type="button" class="chip ' + (activeFilter === c.key ? 'active' : '') + '" data-filter="' + escapeHtml(c.key) + '">' + escapeHtml(c.label) + '</button>'; }).join('');
    document.querySelectorAll('[data-filter]').forEach(function (b) { b.addEventListener('click', function () { activeFilter = b.dataset.filter; render(); }); });
  }

  function bindEditButtons(selector) {
    document.querySelectorAll(selector).forEach(function (b) {
      if (sensitiveSystemLocked) {
        b.disabled = true;
        b.textContent = 'Demo only';
        b.setAttribute('aria-disabled', 'true');
      } else {
        b.addEventListener('click', function () { openForm(Number(b.dataset.edit)); });
      }
    });
  }

  function render() {
    ensureEnhancements();
    var validations = records.map(function (r) { return E.validate(system, r, records); });
    var rep = E.report(system, records);
    var visible = filterRecords(validations);
    $('system-title').textContent = config.label;
    $('system-subtitle').textContent = subtitles[system] || 'A working admin system with live validation, report counts and CSV control.';
    $('record-count').textContent = records.length;
    $('pass-count').textContent = rep.passed;
    $('fail-count').textContent = rep.failed;
    $('report-grid').innerHTML = Object.keys(rep).map(function (k) { return '<div class="metric"><span>' + label(k) + '</span><strong>' + escapeHtml(rep[k]) + '</strong></div>'; }).join('');
    renderFilters();
    renderTable(visible);
    renderCards(visible);
    renderBlocked(validations);
  }

  function renderTable(items) {
    var keys = fieldKeys().slice(0, 7);
    if (!records.length) {
      $('records-table').innerHTML = '<tbody><tr><td><div class="empty-state"><h3>No records yet.</h3><p>Load sample data or add your first record to start testing the workflow.</p></div></td></tr></tbody>';
      return;
    }
    if (!items.length) {
      $('records-table').innerHTML = '<tbody><tr><td><div class="empty-state"><h3>No matching records.</h3><p>Try another search or clear the filter.</p></div></td></tr></tbody>';
      return;
    }
    $('records-table').innerHTML = '<thead><tr>' + keys.map(function (k) { return '<th>' + label(k) + '</th>'; }).join('') + '<th>Validation</th><th></th></tr></thead><tbody>' + items.map(function (item) {
      var r = item.r, v = item.v;
      return '<tr class="' + v.status.toLowerCase() + '">' + keys.map(function (k) { return '<td>' + escapeHtml(r[k]) + '</td>'; }).join('') + '<td>' + statusPill(v) + '<small>' + escapeHtml(v.flags[0] ? v.flags[0].label : 'Ready to move') + '</small></td><td><button class="tiny" data-edit="' + item.i + '">Edit</button></td></tr>';
    }).join('') + '</tbody>';
    bindEditButtons('[data-edit]');
  }

  function renderCards(items) {
    var keys = fieldKeys().slice(1, 6);
    if (!records.length) {
      $('record-cards').innerHTML = '<div class="empty-state"><h3>No records yet.</h3><p>Load sample data or add your first record.</p></div>';
      return;
    }
    if (!items.length) {
      $('record-cards').innerHTML = '<div class="empty-state"><h3>No matching records.</h3><p>Try another search or filter.</p></div>';
      return;
    }
    $('record-cards').innerHTML = items.map(function (item) {
      var r = item.r, v = item.v;
      return '<article class="record-card ' + v.status.toLowerCase() + '"><div class="record-card-head"><div><p class="eyebrow">' + escapeHtml(r.status || config.label) + '</p><h3>' + escapeHtml(idOf(r) || 'Untitled record') + '</h3></div>' + statusPill(v) + '</div><div class="record-fields">' + keys.map(function (k) { return '<div class="record-field"><span>' + label(k) + '</span><strong>' + escapeHtml(r[k] || '—') + '</strong></div>'; }).join('') + '</div><p class="muted">' + escapeHtml(v.flags[0] ? v.flags[0].label : 'Ready to move') + '</p><button class="tiny" data-edit="' + item.i + '">Edit record</button></article>';
    }).join('');
    bindEditButtons('#record-cards [data-edit]');
  }

  function renderBlocked(validations) {
    var blocked = records.map(function (r, i) { return { r: r, i: i, v: validations[i] }; }).filter(function (x) { return x.v.status === 'Fail'; });
    $('blocked-list').innerHTML = blocked.map(function (x) { return '<li><strong>' + escapeHtml(idOf(x.r)) + '</strong><span>' + escapeHtml(x.v.flags.map(function (f) { return f.label; }).join(' · ')) + '</span></li>'; }).join('') || '<li><strong>Clear</strong><span>No blocked records. The workflow is clean.</span></li>';
  }

  function openForm(index) {
    if (sensitiveSystemLocked) {
      toast('Practice Admin is demo-only. Do not enter patient data.');
      return;
    }
    editingIndex = typeof index === 'number' ? index : null;
    var record = editingIndex === null ? {} : records[editingIndex];
    $('record-form').innerHTML = config.fields.map(function (f) {
      var key = f[0], name = f[1], type = f[2], value = record[key] || '';
      if (type === 'status') return '<label>' + name + '<select name="' + key + '"><option value="">Select status</option>' + config.statuses.map(function (s) { return '<option ' + (s === value ? 'selected' : '') + '>' + s + '</option>'; }).join('') + '</select></label>';
      if (type.indexOf('select:') === 0) return '<label>' + name + '<select name="' + key + '"><option value="">Select</option>' + type.slice(7).split('|').map(function (s) { return '<option ' + (s === value ? 'selected' : '') + '>' + s + '</option>'; }).join('') + '</select></label>';
      return '<label>' + name + '<input name="' + key + '" type="' + (type || 'text') + '" value="' + escapeHtml(value) + '"></label>';
    }).join('');
    $('record-modal').showModal();
  }

  function formRecord() { return Object.fromEntries(new FormData($('record-form')).entries()); }
  function download(filename, text) { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' })); a.download = filename; a.click(); URL.revokeObjectURL(a.href); }

  $('load-demo').addEventListener('click', function () { records = E.sampleRecords(system); activeFilter = 'all'; query = ''; if ($('record-search')) $('record-search').value = ''; save(); render(); toast('Sample data loaded'); });
  $('empty-data').addEventListener('click', function () { if (confirm('Clear records for this system? Export first if you need a backup.')) { records = []; save(); render(); toast('Records cleared'); } });
  $('add-record').addEventListener('click', function () {
    if (sensitiveSystemLocked) return toast('Practice Admin is demo-only.');
    openForm();
  });
  $('export-csv').addEventListener('click', function () { download(system + '-admin.csv', E.toCSV(system, records)); toast('CSV exported'); });
  $('import-csv').addEventListener('change', function (e) {
    if (sensitiveSystemLocked) {
      e.target.value = '';
      return toast('Practice Admin import is disabled in the public demo.');
    }
    var file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      e.target.value = '';
      return toast('CSV is too large. Maximum size is 2 MB.');
    }
    file.text().then(function (text) {
      records = E.parseCSV(text);
      save();
      render();
      toast('CSV imported');
    }).catch(function () { toast('CSV could not be read'); });
  });
  $('close-modal').addEventListener('click', function () { $('record-modal').close(); });
  $('record-form').addEventListener('submit', function (e) {
    e.preventDefault();
    if (sensitiveSystemLocked) {
      $('record-modal').close();
      return toast('Practice Admin is demo-only.');
    }
    var r = formRecord();
    if (editingIndex === null) records.unshift(r); else records[editingIndex] = r;
    save();
    $('record-modal').close();
    render();
    toast(editingIndex === null ? 'Record added' : 'Record updated');
  });

  if (sensitiveSystemLocked) {
    $('add-record').disabled = true;
    $('import-csv').disabled = true;
  }
  if (new URLSearchParams(location.search).get('demo') === '1' && !records.length) {
    records = E.sampleRecords(system);
    if (!sensitiveSystemLocked) save();
  }
  render();
})();
