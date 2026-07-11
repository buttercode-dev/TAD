(function (root) {
  'use strict';

  var CONTACT = 'buttercoder.dev@gmail.com';
  var DEPARTMENTS = {
    invoice: {
      label: 'Invoice Admin',
      setup: 'Capture, approval, exception, filing and weekly invoice control.',
      firstStep: 'Map every invoice entry point and define one approval queue.'
    },
    sales: {
      label: 'Sales Admin',
      setup: 'Lead capture, response ownership, quote follow-up and lost-lead reporting.',
      firstStep: 'Put every open lead and quote into one owner-and-next-action list.'
    },
    client: {
      label: 'Client Admin',
      setup: 'Onboarding, document collection, agreements, payments and handover gates.',
      firstStep: 'Create one onboarding checklist with clear start conditions.'
    },
    property: {
      label: 'Property Admin',
      setup: 'Tenant requests, approvals, supplier quotes, scheduling and completion proof.',
      firstStep: 'Create one maintenance queue with urgency, owner and approval status.'
    },
    practice: {
      label: 'Practice Admin',
      setup: 'Booking, confirmation and front-desk workflow design using sample data only.',
      firstStep: 'Map the booking workflow without sharing patient or health information.'
    },
    member: {
      label: 'Member Admin',
      setup: 'Onboarding, attendance risk, payment follow-up and reactivation control.',
      firstStep: 'Build one member-risk queue with an owner and follow-up date.'
    }
  };

  var SIGNAL_WEIGHTS = {
    missed_followups: { sales: 24 },
    late_invoices: { invoice: 24 },
    missing_documents: { client: 18, invoice: 8 },
    approvals_stuck: { invoice: 16, property: 12 },
    booking_admin: { practice: 24 },
    member_churn: { member: 24 },
    property_requests: { property: 24 },
    manual_reporting: { invoice: 8, sales: 8, client: 8, property: 8, practice: 8, member: 8 },
    owner_visibility: { invoice: 8, sales: 8, client: 8, property: 8, practice: 8, member: 8 }
  };

  function clean(value, max) {
    return String(value || '').trim().slice(0, max || 500);
  }

  function scoreAudit(input) {
    input = input || {};
    var areas = input.areas || {};
    var signals = Array.isArray(input.signals) ? input.signals : [];
    var scores = {};

    Object.keys(DEPARTMENTS).forEach(function (key) {
      var base = Math.max(0, Math.min(4, Number(areas[key]) || 0)) * 20;
      scores[key] = base;
    });

    signals.forEach(function (signal) {
      var weights = SIGNAL_WEIGHTS[signal] || {};
      Object.keys(weights).forEach(function (key) {
        scores[key] = Math.min(100, scores[key] + weights[key]);
      });
    });

    var ranked = Object.keys(DEPARTMENTS).map(function (key) {
      return {
        key: key,
        label: DEPARTMENTS[key].label,
        score: Math.min(100, Math.round(scores[key])),
        setup: DEPARTMENTS[key].setup,
        firstStep: DEPARTMENTS[key].firstStep
      };
    }).sort(function (a, b) {
      return b.score - a.score || a.label.localeCompare(b.label);
    });

    var top = ranked.slice(0, 3);
    var overall = Math.round(top.reduce(function (sum, item) { return sum + item.score; }, 0) / top.length);
    var band = overall >= 70 ? 'High admin leakage' : overall >= 40 ? 'Moderate admin leakage' : 'Controlled or unclear';

    return { overall: overall, band: band, ranked: ranked, top: top };
  }

  function formatBrief(input, result) {
    var lines = [
      'ADMIN AUDIT REQUEST',
      '',
      'Business: ' + clean(input.business, 200),
      'Contact: ' + clean(input.contact, 200),
      'Email: ' + clean(input.email, 320),
      'Team size: ' + clean(input.teamSize, 50),
      'Estimated admin hours per week: ' + clean(input.adminHours, 50),
      'Primary outcome wanted: ' + clean(input.outcome, 500),
      '',
      'Audit score: ' + result.overall + '/100 — ' + result.band,
      'Priority departments:'
    ];

    result.top.forEach(function (item, index) {
      lines.push((index + 1) + '. ' + item.label + ' (' + item.score + '/100)');
      lines.push('   First step: ' + item.firstStep);
    });

    lines.push('', 'Current warning signals: ' + ((input.signals || []).join(', ') || 'None selected'));
    lines.push('', 'Notes:', clean(input.notes, 1200) || 'None');
    lines.push('', 'No identity numbers, banking details, patient information, passwords or confidential client records were submitted through this audit.');
    return lines.join('\n');
  }

  function collect(form) {
    var fd = new FormData(form);
    var areas = {};
    Object.keys(DEPARTMENTS).forEach(function (key) {
      areas[key] = Number(fd.get(key) || 0);
    });
    return {
      business: fd.get('business'),
      contact: fd.get('contact'),
      email: fd.get('email'),
      teamSize: fd.get('team_size'),
      adminHours: fd.get('admin_hours'),
      outcome: fd.get('outcome'),
      notes: fd.get('notes'),
      signals: fd.getAll('signals'),
      areas: areas
    };
  }

  function render(result) {
    document.getElementById('audit-score').textContent = result.overall + '/100';
    document.getElementById('audit-band').textContent = result.band;
    document.getElementById('audit-priorities').innerHTML = result.top.map(function (item, index) {
      return '<article><span>Priority ' + (index + 1) + '</span><h3>' + item.label + '</h3><strong>' + item.score + '/100</strong><p>' + item.setup + '</p><p><b>First step:</b> ' + item.firstStep + '</p></article>';
    }).join('');
  }

  function init() {
    var form = document.getElementById('admin-audit-form');
    if (!form) return;
    var resultSection = document.getElementById('audit-result');
    var emailLink = document.getElementById('email-audit');

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var input = collect(form);
      var result = scoreAudit(input);
      var brief = formatBrief(input, result);
      render(result);
      emailLink.href = 'mailto:' + CONTACT + '?subject=' + encodeURIComponent('Admin Audit Request — ' + clean(input.business, 120)) + '&body=' + encodeURIComponent(brief);
      resultSection.hidden = false;
      resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    document.getElementById('print-audit').addEventListener('click', function () {
      window.print();
    });
  }

  var api = { CONTACT: CONTACT, DEPARTMENTS: DEPARTMENTS, scoreAudit: scoreAudit, formatBrief: formatBrief };
  root.AdminAudit = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', init);
})(typeof window !== 'undefined' ? window : globalThis);
