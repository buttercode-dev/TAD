/* The Admin Department — Admin HQ shared rules engine. */
(function (root) {
  'use strict';

  function localIsoDate(date) {
    date = date || new Date();
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }
  var TODAY = localIsoDate(new Date());
  function has(v) { return v !== undefined && v !== null && String(v).trim() !== ''; }
  function parseDate(s) {
    if (!has(s)) return null;
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s));
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function daysUntil(s, today) {
    var d = parseDate(s), t = parseDate(today || TODAY);
    return d && t ? Math.round((d - t) / 86400000) : null;
  }
  function daysSince(s, today) {
    var d = parseDate(s), t = parseDate(today || TODAY);
    return d && t ? Math.round((t - d) / 86400000) : null;
  }
  function num(v) { var n = parseFloat(String(v || '').replace(/[^\d.-]/g, '')); return Number.isFinite(n) ? n : 0; }
  function money(n) { return 'R' + num(n).toLocaleString('en-ZA', { maximumFractionDigits: 0 }); }
  function flag(id, label, severity) { return { id: id, label: label, severity: severity || 'attention' }; }
  function active(system, status) {
    var closed = {
      invoice: ['Filed', 'Paid', 'Rejected'],
      sales: ['Won', 'Lost', 'Cold', 'Closed'],
      client: ['Active', 'Cancelled'],
      property: ['Completed', 'Closed', 'Cancelled'],
      practice: ['Completed', 'No-show', 'Cancelled'],
      member: ['Cancelled', 'Dormant', 'Retained']
    }[system] || [];
    return closed.indexOf(status) === -1;
  }

  var systems = {
    invoice: {
      label: 'Invoice Admin', short: 'Invoices', storageKey: 'adminhq.invoice', id: 'record_id',
      statuses: ['New','Needs Capture','Missing Info','Possible Duplicate','Ready for Review','Waiting for Approval','Approved','Filed','Rejected','Paid'],
      fields: [
        ['record_id','Record ID','text'], ['received_date','Received Date','date'], ['supplier_name','Supplier','text'],
        ['document_type','Document Type','select:Invoice|Receipt|Proof of Payment|Statement'], ['invoice_number','Reference','text'],
        ['due_date','Due Date','date'], ['total_amount','Amount','number'], ['status','Status','status'],
        ['assigned_to','Owner','text'], ['approval_owner','Approver','text'], ['document_link','Document Link','text'],
        ['folder_link','Folder Link','text'], ['missing_info','Missing Info','text'], ['duplicate_check','Duplicate Check','text'],
        ['next_action','Next Action','text'], ['next_action_due','Next Action Due','date']
      ]
    },
    sales: {
      label: 'Sales Admin', short: 'Sales', storageKey: 'adminhq.sales', id: 'lead_id',
      statuses: ['New','Needs Response','Contacted','Waiting for Client','Quote Needed','Quote Sent','Follow-up Due','Won','Lost','Cold','Closed'],
      fields: [
        ['lead_id','Lead ID','text'], ['received_date','Received Date','date'], ['contact_name','Contact','text'], ['source','Source','text'],
        ['service_needed','Service Needed','text'], ['urgency','Urgency','select:Low|Normal|High'], ['status','Status','status'],
        ['assigned_to','Owner','text'], ['first_response_sent','First Response Sent','select:Yes|No'], ['quote_sent_date','Quote Sent Date','date'],
        ['quote_amount','Quote Amount','number'], ['follow_up_due','Follow-up Due','date'], ['next_action','Next Action','text'],
        ['outcome_reason','Outcome Reason','text']
      ]
    },
    client: {
      label: 'Client Admin', short: 'Clients', storageKey: 'adminhq.client', id: 'client_id',
      statuses: ['New Client','Welcome Sent','Documents Requested','Waiting for Client','Internal Setup','Payment/Agreement Pending','Ready to Start','Active','Stuck','Cancelled'],
      fields: [
        ['client_id','Client ID','text'], ['start_date','Start Date','date'], ['client_name','Client','text'], ['service_package','Package','text'],
        ['status','Status','status'], ['assigned_to','Owner','text'], ['welcome_sent','Welcome Sent','select:Yes|No'],
        ['documents_received','Documents Received','select:Yes|No|Partial'], ['missing_documents','Missing Documents','text'],
        ['agreement_status','Agreement','select:Signed|Pending|Sent|Not applicable'], ['payment_status','Payment','select:Paid|Pending|Unpaid|Not applicable'],
        ['folder_created','Folder Created','select:Yes|No'], ['folder_link','Folder Link','text'], ['internal_handover','Handover','select:Yes|No|Scheduled'],
        ['next_action','Next Action','text'], ['next_action_due','Next Action Due','date']
      ]
    },
    property: {
      label: 'Property Admin', short: 'Property', storageKey: 'adminhq.property', id: 'property_record_id',
      statuses: ['New Request','Tenant Contacted','Quote Needed','Quote Sent','Owner Approval','Approved','Scheduled','In Progress','Completed','Closed','Blocked','Cancelled'],
      fields: [
        ['property_record_id','Record ID','text'], ['received_date','Received Date','date'], ['property_name','Property','text'], ['unit','Unit','text'],
        ['tenant_name','Tenant','text'], ['request_type','Request Type','text'], ['urgency','Urgency','select:Low|Normal|High|Emergency'],
        ['status','Status','status'], ['assigned_to','Owner','text'], ['owner_approval','Owner Approval','select:Approved|Pending|Rejected|Not required'],
        ['quote_amount','Quote Amount','number'], ['supplier','Supplier','text'], ['scheduled_date','Scheduled Date','date'],
        ['proof_link','Proof/Photo Link','text'], ['next_action','Next Action','text'], ['next_action_due','Next Action Due','date']
      ]
    },
    practice: {
      label: 'Practice Admin', short: 'Practice', storageKey: 'adminhq.practice', id: 'booking_id',
      statuses: ['New Booking','Needs Confirmation','Confirmed','Documents Needed','Payment Pending','Ready for Appointment','Completed','No-show','Cancelled','Follow-up Due'],
      fields: [
        ['booking_id','Booking ID','text'], ['received_date','Received Date','date'], ['patient_name','Patient/Client','text'], ['service','Service','text'],
        ['channel','Channel','text'], ['appointment_date','Appointment Date','date'], ['status','Status','status'], ['assigned_to','Owner','text'],
        ['confirmation_sent','Confirmation Sent','select:Yes|No'], ['payment_status','Payment','select:Paid|Pending|Unpaid|Not applicable'],
        ['documents_received','Documents','select:Yes|No|Partial|Not applicable'], ['no_show_risk','No-show Risk','select:Low|Normal|High'],
        ['folder_link','Folder/Record Link','text'], ['next_action','Next Action','text'], ['next_action_due','Next Action Due','date'], ['outcome_reason','Outcome Reason','text']
      ]
    },
    member: {
      label: 'Member Admin', short: 'Members', storageKey: 'adminhq.member', id: 'member_id',
      statuses: ['New Member','Onboarding','Active','Attendance Risk','Payment Due','Follow-up Due','Reactivation','Retained','Cancelled','Dormant'],
      fields: [
        ['member_id','Member ID','text'], ['join_date','Join Date','date'], ['member_name','Member','text'], ['plan','Plan','text'],
        ['status','Status','status'], ['assigned_to','Owner','text'], ['payment_status','Payment','select:Paid|Pending|Unpaid|Not applicable'],
        ['last_attendance_date','Last Attendance','date'], ['onboarding_done','Onboarding Done','select:Yes|No|Not applicable'],
        ['risk_level','Risk Level','select:Low|Normal|High'], ['follow_up_due','Follow-up Due','date'], ['next_action','Next Action','text'],
        ['outcome_reason','Outcome Reason','text'], ['folder_link','Folder Link','text']
      ]
    }
  };

  var samples = {
    invoice: [
      ['INV-001','2026-07-10','ABC Supplies','Invoice','INV-4521','2026-07-31','1437.50','Ready for Review','Admin','Owner','doc','folder','','No duplicate found','Approve invoice','2026-07-11'],
      ['INV-002','2026-07-10','Quick Repairs','Invoice','QR-998','2026-07-15','4370','Missing Info','Admin','Owner','doc','folder','VAT number missing','No duplicate found','Request VAT number','2026-07-10'],
      ['INV-003','2026-07-10','City Stationery','Receipt','RCPT-77','','356.50','Filed','Admin','Admin','doc','folder','','No duplicate found','No action',''],
      ['INV-004','2026-07-10','Metro Cleaning','Invoice','MC-1044','2026-07-17','8760','Waiting for Approval','Admin','Owner','doc','folder','','New supplier','Approve supplier','2026-07-11'],
      ['INV-005','2026-07-09','BuildMart','Invoice','BM-2201','2026-07-30','2910','Possible Duplicate','Admin','Owner','doc','folder','','Possible duplicate','Review duplicate','2026-07-11'],
      ['INV-006','2026-07-08','ABC Supplies','Invoice','INV-4522','2026-07-11','2100','Ready for Review','Admin','Owner','doc','folder','','No duplicate found','Approve due-soon invoice','2026-07-10'],
      ['INV-007','2026-07-10','','Invoice','UNK-001','2026-07-25','1200','Needs Capture','Admin','','doc','','Supplier missing','No duplicate found','Identify supplier','2026-07-11'],
      ['INV-008','2026-07-06','Quick Repairs','Invoice','QR-997','2026-07-12','3200','New','','','doc','folder','','No duplicate found','','2026-07-08'],
      ['INV-009','2026-07-09','ABC Supplies','Invoice','INV-4523','2026-07-29','500','Approved','Admin','','doc','folder','','No duplicate found','Add approval owner','2026-07-10'],
      ['INV-010','2026-07-10','City Stationery','Receipt','RCPT-78','','180','Filed','Admin','Admin','','','','No duplicate found','Add links','2026-07-10']
    ],
    sales: [
      ['LEAD-001','2026-07-10','Thabo Mokoena','Website','Gate motor repair','High','Needs Response','Owner','No','','','','Call and confirm',''],
      ['LEAD-002','2026-07-10','Lerato Naidoo','WhatsApp','Office cleaning quote','Normal','Quote Sent','Admin','Yes','2026-07-10','4500','2026-07-12','Follow up',''],
      ['LEAD-003','2026-07-09','Pieter Jacobs','Referral','Panel beating estimate','Normal','Won','Owner','Yes','2026-07-09','8200','','Schedule job','Won'],
      ['LEAD-004','2026-07-08','Ayesha Khan','Facebook DM','Security camera installation','High','Follow-up Due','Admin','Yes','2026-07-08','12500','2026-07-10','Follow up before competitor',''],
      ['LEAD-005','2026-07-07','Chris Botha','Phone','Monthly cleaning','Normal','Waiting for Client','Admin','Yes','2026-07-07','6800','2026-07-11','Wait for photos',''],
      ['LEAD-006','2026-07-06','Naledi Jacobs','Email','Electrical compliance','Low','Cold','Owner','Yes','','','','','No response after 3 follow-ups'],
      ['LEAD-007','2026-07-10','Musa Dlamini','Walk-in','Repair quote','Normal','Contacted','Admin','Yes','','','2026-07-13','Prepare estimate',''],
      ['LEAD-008','2026-07-10','Faulty Quote','Website','Install quote','Normal','Quote Sent','Admin','Yes','2026-07-10','3500','','',''],
      ['LEAD-009','2026-07-10','Ownerless Lead','WhatsApp','Urgent repair','High','Needs Response','','No','','','','',''],
      ['LEAD-010','2026-07-10','No Reason Lost','Email','Service quote','Normal','Lost','Admin','Yes','','','','','']
    ],
    client: [
      ['ONB-001','2026-07-10','Lerato Naidoo','Monthly Admin Support','Documents Requested','Admin','Yes','No','ID and agreement','Pending','Pending','Yes','folder','No','Follow up','2026-07-12'],
      ['ONB-002','2026-07-09','Thabo Mokoena','Invoice Admin Setup','Ready to Start','Admin','Yes','Yes','','Signed','Paid','Yes','folder','Yes','Schedule kickoff','2026-07-11'],
      ['ONB-003','2026-07-08','Pieter Jacobs','Sales Admin Setup','Waiting for Client','Owner','Yes','Partial','VAT and address','Pending','Pending','No','','No','Request missing details','2026-07-10'],
      ['ONB-004','2026-07-07','Ayesha Khan','Property Admin','Payment/Agreement Pending','Admin','Yes','Yes','','Pending','Pending','Yes','folder','No','Send reminder','2026-07-10'],
      ['ONB-005','2026-07-06','Chris Botha','Client Admin Setup','Active','Admin','Yes','Yes','','Signed','Paid','Yes','folder','Yes','Move to support','2026-07-15'],
      ['ONB-006','2026-07-10','Demo Clean','Invoice Admin Setup','New Client','Admin','No','No','Business details','Pending','Pending','No','','No','Send welcome','2026-07-11'],
      ['ONB-007','2026-06-20','Stuck Client','Sales Admin Setup','Stuck','Admin','Yes','Partial','Access details','Signed','Paid','Yes','folder','No','Escalate stuck onboarding','2026-07-10'],
      ['ONB-008','2026-07-10','Bad Ready','Client Admin Setup','Ready to Start','Admin','Yes','Partial','Signed agreement','Signed','Paid','No','','Yes','','2026-07-10'],
      ['ONB-009','2026-07-10','Bad Active Gates','Sales Admin Setup','Active','Admin','Yes','No','All docs','Pending','Pending','Yes','folder','Yes','','2026-07-10'],
      ['ONB-010','2026-07-10','Bad Active Folder','Invoice Admin Setup','Active','Admin','Yes','Yes','','Signed','Paid','No','','No','','2026-07-10']
    ],
    property: [
      ['PROP-001','2026-07-10','Riverside Flats','Unit 4B','Nomsa Dlamini','Leaking tap','Normal','Tenant Contacted','Admin','Not required','','Quick Repairs','','photo','Book plumber','2026-07-11'],
      ['PROP-002','2026-07-09','Oak Place','Unit 2','Thabo Mokoena','Gate motor','High','Quote Sent','Admin','Pending','3200','GateFix','','','Send owner quote','2026-07-11'],
      ['PROP-003','2026-07-08','Maple Court','Unit 7','Lerato Naidoo','Electrical fault','Emergency','Approved','Owner','Approved','1850','SparkPro','','','Schedule electrician','2026-07-10'],
      ['PROP-004','2026-07-07','Riverside Flats','Unit 9','Pieter Jacobs','Broken window','Normal','Scheduled','Admin','Approved','950','GlassCo','2026-07-12','','Confirm access','2026-07-11'],
      ['PROP-005','2026-07-06','Hillview','Unit 1','Ayesha Khan','Paint touch-up','Low','Completed','Admin','Not required','600','HandyPro','2026-07-09','photo','Close request',''],
      ['PROP-006','2026-07-10','Oak Place','Unit 6','Chris Botha','Geyser inspection','Normal','New Request','Admin','Pending','','','','','Assess request','2026-07-11'],
      ['PROP-007','2026-06-28','Maple Court','Unit 3','Naledi Jacobs','Mould report','High','Blocked','Admin','Pending','2400','CleanCo','','','Escalate to owner','2026-07-10'],
      ['PROP-008','2026-07-06','Oak Place','Unit 8','Musa Dlamini','Blocked drain','High','New Request','','Pending','','','','','','2026-07-08'],
      ['PROP-009','2026-07-10','Riverside Flats','Unit 5','Faulty Approval','Roof repair','Normal','Approved','Admin','Pending','','RoofCo','','','Fix approval','2026-07-10'],
      ['PROP-010','2026-07-10','Hillview','Unit 2','No Proof Tenant','Door repair','Normal','Completed','Admin','Approved','900','HandyPro','2026-07-09','','Add completion proof','2026-07-10']
    ],
    practice: [
      ['PRAC-001','2026-07-10','Nomsa Dlamini','Consultation','Phone','2026-07-12','Confirmed','Reception','Yes','Not applicable','Not applicable','Normal','folder','Send reminder','2026-07-11',''],
      ['PRAC-002','2026-07-10','Thabo Mokoena','X-ray booking','WhatsApp','2026-07-13','Documents Needed','Reception','Yes','Pending','Partial','Normal','folder','Request referral form','2026-07-11',''],
      ['PRAC-003','2026-07-09','Lerato Naidoo','Follow-up','Website','2026-07-14','Ready for Appointment','Admin','Yes','Paid','Yes','Low','folder','Prepare file','2026-07-13',''],
      ['PRAC-004','2026-07-08','Pieter Jacobs','Dental check','Phone','2026-07-11','Payment Pending','Reception','Yes','Pending','Not applicable','Normal','folder','Confirm payment','2026-07-10',''],
      ['PRAC-005','2026-07-06','Ayesha Khan','Physio session','Email','2026-07-09','Completed','Admin','Yes','Paid','Yes','Low','folder','File notes','','Completed'],
      ['PRAC-006','2026-07-10','Chris Botha','Initial consult','Walk-in','2026-07-15','New Booking','Reception','No','Pending','No','Normal','','Confirm booking','2026-07-11',''],
      ['PRAC-007','2026-07-05','Naledi Jacobs','Review','Phone','2026-07-08','No-show','Reception','Yes','Not applicable','Not applicable','High','folder','Call to reschedule','2026-07-10','No-show logged'],
      ['PRAC-008','2026-07-10','Bad Ready','Consultation','WhatsApp','2026-07-12','Ready for Appointment','Reception','No','Pending','No','Normal','folder','','2026-07-10',''],
      ['PRAC-009','2026-07-07','Ownerless Pending','X-ray booking','Phone','2026-07-12','Payment Pending','','No','Pending','Partial','High','','','2026-07-08',''],
      ['PRAC-010','2026-07-08','Bad Complete','Follow-up','Email','2026-07-09','Completed','Admin','Yes','Paid','Yes','Low','','Archive file','2026-07-10','']
    ],
    member: [
      ['MEM-001','2026-07-10','Nomsa Dlamini','Monthly','New Member','Admin','Pending','','No','Normal','2026-07-12','Send welcome pack','','folder'],
      ['MEM-002','2026-07-09','Thabo Mokoena','Annual','Onboarding','Admin','Paid','','No','Low','2026-07-11','Complete induction','','folder'],
      ['MEM-003','2026-07-08','Lerato Naidoo','Monthly','Active','Admin','Paid','2026-07-09','Yes','Low','','No action','','folder'],
      ['MEM-004','2026-06-25','Pieter Jacobs','Monthly','Attendance Risk','Admin','Paid','2026-06-20','Yes','High','2026-07-10','Call member','','folder'],
      ['MEM-005','2026-07-01','Ayesha Khan','Family','Payment Due','Admin','Pending','2026-07-08','Yes','Normal','2026-07-11','Send payment reminder','','folder'],
      ['MEM-006','2026-06-01','Chris Botha','Monthly','Retained','Admin','Paid','2026-07-10','Yes','Low','','No action','Reactivated successfully','folder'],
      ['MEM-007','2026-05-20','Naledi Jacobs','Monthly','Dormant','Admin','Unpaid','2026-05-25','Yes','High','','No action','No response after reactivation campaign','folder'],
      ['MEM-008','2026-07-10','Bad Active','Monthly','Active','Admin','Pending','2026-07-09','No','Low','','','', 'folder'],
      ['MEM-009','2026-07-07','Ownerless Payment','Monthly','Payment Due','','Unpaid','2026-07-05','Yes','High','','','', ''],
      ['MEM-010','2026-06-20','No Reason Cancel','Annual','Cancelled','Admin','Paid','2026-06-18','Yes','Normal','','No action','', 'folder']
    ]
  };

  function sampleRecords(system) {
    var keys = systems[system].fields.map(function (f) { return f[0]; });
    return samples[system].map(function (row) {
      var o = {}; keys.forEach(function (k, i) { o[k] = row[i] || ''; }); return o;
    });
  }

  function validate(system, r, all, today) {
    today = today || TODAY;
    var f = [], adv;
    if (system === 'invoice') {
      adv = ['Ready for Review','Waiting for Approval','Approved','Filed','Paid'].indexOf(r.status) >= 0;
      var miss = [];
      if (!has(r.supplier_name)) miss.push('supplier');
      if (!has(r.document_type)) miss.push('type');
      if (r.document_type === 'Invoice' && !has(r.invoice_number)) miss.push('reference');
      if (r.document_type === 'Invoice' && !has(r.total_amount)) miss.push('amount');
      if (active(system, r.status) && !has(r.assigned_to)) miss.push('owner');
      if (['Waiting for Approval','Approved'].indexOf(r.status) >= 0 && !has(r.approval_owner)) miss.push('approver');
      if (adv && miss.length) f.push(flag('missing_required', 'Missing fields: ' + miss.join(', '), 'blocked'));
      if (r.status === 'Approved' && !has(r.approval_owner)) f.push(flag('approval_owner_missing', 'Approved without approval owner', 'blocked'));
      if (['Filed','Paid'].indexOf(r.status) >= 0 && (!has(r.document_link) || !has(r.folder_link))) f.push(flag('file_links_missing', 'Filed/Paid without document and folder links', 'blocked'));
      if (r.status === 'Possible Duplicate' || String(r.duplicate_check).toLowerCase().indexOf('duplicate') >= 0) f.push(flag('possible_duplicate', 'Possible duplicate needs review'));
      var due = daysUntil(r.due_date, today); if (active(system, r.status) && due !== null && due <= 2) f.push(flag('due_soon', due < 0 ? 'Payment overdue' : 'Due within 48 hours'));
      var nd = daysUntil(r.next_action_due, today); if (active(system, r.status) && nd !== null && nd < 0) f.push(flag('overdue_action', 'Next action overdue'));
      if (r.status === 'New' && daysSince(r.received_date, today) >= 1) f.push(flag('stale_new', 'Still New after 1 business day'));
      if (active(system, r.status) && !has(r.assigned_to)) f.push(flag('ownerless_active', 'Active record has no owner', 'blocked'));
      if (active(system, r.status) && !has(r.next_action) && r.status !== 'New') f.push(flag('missing_next_action', 'Active record has no next action', 'blocked'));
    }
    if (system === 'sales') {
      adv = ['Quote Sent','Follow-up Due','Won','Lost','Cold','Closed'].indexOf(r.status) >= 0;
      var smiss = [];
      if (!has(r.contact_name)) smiss.push('contact');
      if (!has(r.service_needed)) smiss.push('service');
      if (active(system, r.status) && !has(r.assigned_to)) smiss.push('owner');
      if (active(system, r.status) && !has(r.next_action)) smiss.push('next action');
      if (['Quote Sent','Follow-up Due'].indexOf(r.status) >= 0 && !has(r.follow_up_due)) smiss.push('follow-up due');
      if (['Lost','Cold'].indexOf(r.status) >= 0 && !has(r.outcome_reason)) smiss.push('lost/cold reason');
      if (adv && smiss.length) f.push(flag('missing_required', 'Missing fields: ' + smiss.join(', '), 'blocked'));
      if (r.status === 'Quote Sent' && !has(r.follow_up_due)) f.push(flag('quote_followup_missing', 'Quote Sent without follow-up date', 'blocked'));
      if (active(system, r.status) && !has(r.assigned_to)) f.push(flag('ownerless_active', 'Active lead has no owner', 'blocked'));
      if (active(system, r.status) && !has(r.next_action)) f.push(flag('missing_next_action', 'Active lead has no next action', 'blocked'));
      if (['Lost','Cold'].indexOf(r.status) >= 0 && !has(r.outcome_reason)) f.push(flag('lost_reason_missing', 'Lost/Cold lead needs reason', 'blocked'));
      var fd = daysUntil(r.follow_up_due, today); if (active(system, r.status) && fd !== null && fd < 0) f.push(flag('followup_overdue', 'Follow-up overdue'));
      if (r.urgency === 'High' && r.first_response_sent !== 'Yes' && !has(r.assigned_to)) f.push(flag('urgent_unowned', 'Urgent lead needs owner', 'blocked'));
    }
    if (system === 'client') {
      adv = ['Ready to Start','Active'].indexOf(r.status) >= 0;
      var docsBad = r.documents_received !== 'Yes' || has(r.missing_documents);
      var agreementBad = ['Signed','Not applicable'].indexOf(r.agreement_status) < 0;
      var paymentBad = ['Paid','Not applicable'].indexOf(r.payment_status) < 0;
      var folderBad = r.folder_created !== 'Yes' || !has(r.folder_link);
      var handoverBad = ['Yes','Scheduled'].indexOf(r.internal_handover) < 0;
      if (active(system, r.status) && !has(r.assigned_to)) f.push(flag('ownerless_active', 'Active onboarding has no owner', 'blocked'));
      if (active(system, r.status) && !has(r.next_action) && ['Ready to Start','Stuck'].indexOf(r.status) < 0) f.push(flag('missing_next_action', 'Active onboarding has no next action', 'blocked'));
      if (adv && docsBad) f.push(flag('docs_incomplete', 'Ready/Active blocked: documents incomplete', 'blocked'));
      if (adv && agreementBad) f.push(flag('agreement_incomplete', 'Ready/Active blocked: agreement not signed', 'blocked'));
      if (adv && paymentBad) f.push(flag('payment_incomplete', 'Ready/Active blocked: payment not confirmed', 'blocked'));
      if (adv && folderBad) f.push(flag('folder_incomplete', 'Ready/Active blocked: folder missing or link blank', 'blocked'));
      if (adv && handoverBad) f.push(flag('handover_incomplete', 'Ready/Active blocked: handover incomplete', 'blocked'));
      var cd = daysUntil(r.next_action_due, today); if (active(system, r.status) && cd !== null && cd < 0) f.push(flag('overdue_action', 'Next action overdue'));
      if (r.status === 'Stuck' || (active(system, r.status) && daysSince(r.start_date, today) > 14)) f.push(flag('stuck_onboarding', 'Stuck onboarding needs review'));
    }
    if (system === 'property') {
      adv = ['Owner Approval','Approved','Scheduled','In Progress','Completed','Closed'].indexOf(r.status) >= 0;
      var pmiss = [];
      if (!has(r.property_name)) pmiss.push('property');
      if (!has(r.unit)) pmiss.push('unit');
      if (!has(r.tenant_name)) pmiss.push('tenant');
      if (!has(r.request_type)) pmiss.push('request');
      if (active(system, r.status) && !has(r.assigned_to)) pmiss.push('owner');
      if (['Quote Sent','Owner Approval','Approved'].indexOf(r.status) >= 0 && (!has(r.quote_amount) || !has(r.supplier))) pmiss.push('quote/supplier');
      if (['Approved','Scheduled','In Progress','Completed','Closed'].indexOf(r.status) >= 0 && r.owner_approval !== 'Approved' && r.owner_approval !== 'Not required') pmiss.push('owner approval');
      if (['Scheduled','In Progress','Completed','Closed'].indexOf(r.status) >= 0 && !has(r.scheduled_date)) pmiss.push('scheduled date');
      if (adv && pmiss.length) f.push(flag('missing_required', 'Missing fields: ' + pmiss.join(', '), 'blocked'));
      if (['Completed','Closed'].indexOf(r.status) >= 0 && !has(r.proof_link)) f.push(flag('completion_proof_missing', 'Completed/Closed needs proof link', 'blocked'));
      if (active(system, r.status) && !has(r.next_action)) f.push(flag('missing_next_action', 'Active property request needs next action', 'blocked'));
      if (active(system, r.status) && !has(r.assigned_to)) f.push(flag('ownerless_active', 'Active property request has no owner', 'blocked'));
      var pd = daysUntil(r.next_action_due, today); if (active(system, r.status) && pd !== null && pd < 0) f.push(flag('overdue_action', 'Next action overdue'));
      if (r.urgency === 'Emergency' && active(system, r.status) && daysSince(r.received_date, today) >= 1) f.push(flag('emergency_open', 'Emergency request still open'));
      if (r.status === 'Blocked') f.push(flag('blocked_status', 'Blocked request needs review'));
    }
    if (system === 'practice') {
      adv = ['Confirmed','Payment Pending','Ready for Appointment','Completed','Follow-up Due'].indexOf(r.status) >= 0;
      var rmiss = [];
      if (!has(r.patient_name)) rmiss.push('patient/client');
      if (!has(r.service)) rmiss.push('service');
      if (!has(r.appointment_date)) rmiss.push('appointment date');
      if (active(system, r.status) && !has(r.assigned_to)) rmiss.push('owner');
      if (['Confirmed','Ready for Appointment','Completed'].indexOf(r.status) >= 0 && r.confirmation_sent !== 'Yes') rmiss.push('confirmation');
      if (['Ready for Appointment','Completed'].indexOf(r.status) >= 0 && ['Paid','Not applicable'].indexOf(r.payment_status) < 0) rmiss.push('payment');
      if (['Ready for Appointment','Completed'].indexOf(r.status) >= 0 && ['Yes','Not applicable'].indexOf(r.documents_received) < 0) rmiss.push('documents');
      if (adv && rmiss.length) f.push(flag('missing_required', 'Missing fields: ' + rmiss.join(', '), 'blocked'));
      if (['Completed'].indexOf(r.status) >= 0 && !has(r.folder_link)) f.push(flag('record_link_missing', 'Completed booking needs folder/record link', 'blocked'));
      if (active(system, r.status) && !has(r.next_action) && r.status !== 'Ready for Appointment') f.push(flag('missing_next_action', 'Active booking needs next action', 'blocked'));
      if (active(system, r.status) && !has(r.assigned_to)) f.push(flag('ownerless_active', 'Active booking has no owner', 'blocked'));
      if (['No-show','Cancelled'].indexOf(r.status) >= 0 && !has(r.outcome_reason)) f.push(flag('outcome_reason_missing', 'No-show/Cancelled needs outcome reason', 'blocked'));
      var rd = daysUntil(r.next_action_due, today); if (active(system, r.status) && rd !== null && rd < 0) f.push(flag('overdue_action', 'Next action overdue'));
      var ap = daysUntil(r.appointment_date, today); if (active(system, r.status) && ap !== null && ap <= 1 && r.confirmation_sent !== 'Yes') f.push(flag('confirmation_due', 'Appointment near; confirmation not sent'));
    }
    if (system === 'member') {
      adv = ['Active','Attendance Risk','Payment Due','Follow-up Due','Reactivation','Retained','Cancelled','Dormant'].indexOf(r.status) >= 0;
      var mmiss = [];
      if (!has(r.member_name)) mmiss.push('member');
      if (!has(r.plan)) mmiss.push('plan');
      if (active(system, r.status) && !has(r.assigned_to)) mmiss.push('owner');
      if (['Active','Retained'].indexOf(r.status) >= 0 && r.onboarding_done !== 'Yes' && r.onboarding_done !== 'Not applicable') mmiss.push('onboarding');
      if (['Active','Retained'].indexOf(r.status) >= 0 && r.payment_status !== 'Paid' && r.payment_status !== 'Not applicable') mmiss.push('payment');
      if (['Attendance Risk','Payment Due','Follow-up Due','Reactivation'].indexOf(r.status) >= 0 && !has(r.follow_up_due)) mmiss.push('follow-up due');
      if (['Attendance Risk','Payment Due','Follow-up Due','Reactivation'].indexOf(r.status) >= 0 && !has(r.next_action)) mmiss.push('next action');
      if (['Cancelled','Dormant'].indexOf(r.status) >= 0 && !has(r.outcome_reason)) mmiss.push('outcome reason');
      if (adv && mmiss.length) f.push(flag('missing_required', 'Missing fields: ' + mmiss.join(', '), 'blocked'));
      if (active(system, r.status) && !has(r.assigned_to)) f.push(flag('ownerless_active', 'Active member record has no owner', 'blocked'));
      var md = daysUntil(r.follow_up_due, today); if (active(system, r.status) && md !== null && md < 0) f.push(flag('overdue_followup', 'Follow-up overdue'));
      if (r.risk_level === 'High' && active(system, r.status)) f.push(flag('high_risk_member', 'High-risk member needs attention'));
      if (active(system, r.status) && has(r.last_attendance_date) && daysSince(r.last_attendance_date, today) > 14) f.push(flag('attendance_gap', 'Attendance gap over 14 days'));
    }
    var seen = {}, clean = [];
    f.forEach(function (x) { if (!seen[x.id]) { seen[x.id] = 1; clean.push(x); } });
    return { status: clean.some(function (x) { return x.severity === 'blocked'; }) ? 'Fail' : 'Pass', flags: clean };
  }

  function report(system, records, today) {
    today = today || TODAY;
    var vals = records.map(function (r) { return validate(system, r, records, today); });
    function c(fn) { return records.filter(fn).length; }
    function sum(fn, key) { return records.filter(fn).reduce(function (s, r) { return s + num(r[key]); }, 0); }
    var base = { total: records.length, passed: vals.filter(function (v) { return v.status === 'Pass'; }).length, failed: vals.filter(function (v) { return v.status === 'Fail'; }).length };
    if (system === 'invoice') return Object.assign(base, { ready: c(function (r) { return r.status === 'Ready for Review'; }), approval: c(function (r) { return r.status === 'Waiting for Approval'; }), missing: c(function (r) { return r.status === 'Missing Info'; }), filed: c(function (r) { return r.status === 'Filed'; }), waiting_value: money(sum(function (r) { return r.status === 'Waiting for Approval'; }, 'total_amount')) });
    if (system === 'sales') return Object.assign(base, { needs_response: c(function (r) { return r.status === 'Needs Response'; }), quotes: c(function (r) { return r.status === 'Quote Sent'; }), followups: c(function (r) { return r.status === 'Follow-up Due'; }), won: c(function (r) { return r.status === 'Won'; }), open_quote_value: money(sum(function (r) { return ['Quote Sent','Follow-up Due'].indexOf(r.status) >= 0; }, 'quote_amount')) });
    if (system === 'client') return Object.assign(base, { waiting_docs: c(function (r) { return r.documents_received !== 'Yes' || has(r.missing_documents); }), ready: c(function (r) { return r.status === 'Ready to Start'; }), active: c(function (r) { return r.status === 'Active'; }), stuck: c(function (r) { return r.status === 'Stuck'; }) });
    if (system === 'property') return Object.assign(base, { new_requests: c(function (r) { return r.status === 'New Request'; }), owner_approval: c(function (r) { return r.status === 'Owner Approval' || r.owner_approval === 'Pending'; }), scheduled: c(function (r) { return r.status === 'Scheduled'; }), completed: c(function (r) { return r.status === 'Completed'; }), open_quote_value: money(sum(function (r) { return ['Quote Sent','Owner Approval','Approved'].indexOf(r.status) >= 0; }, 'quote_amount')) });
    if (system === 'practice') return Object.assign(base, { needs_confirmation: c(function (r) { return r.status === 'Needs Confirmation' || r.confirmation_sent !== 'Yes'; }), documents_needed: c(function (r) { return r.documents_received === 'No' || r.documents_received === 'Partial'; }), payment_pending: c(function (r) { return r.payment_status === 'Pending' || r.payment_status === 'Unpaid'; }), ready: c(function (r) { return r.status === 'Ready for Appointment'; }), no_shows: c(function (r) { return r.status === 'No-show'; }) });
    return Object.assign(base, { active: c(function (r) { return r.status === 'Active'; }), attendance_risk: c(function (r) { return r.status === 'Attendance Risk' || r.risk_level === 'High'; }), payment_due: c(function (r) { return r.status === 'Payment Due' || r.payment_status === 'Pending' || r.payment_status === 'Unpaid'; }), reactivation: c(function (r) { return r.status === 'Reactivation'; }), retained: c(function (r) { return r.status === 'Retained'; }) });
  }

  function csvEscape(v) { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function toCSV(system, records) { var keys = systems[system].fields.map(function (f) { return f[0]; }); return [keys.join(',')].concat(records.map(function (r) { return keys.map(function (k) { return csvEscape(r[k]); }).join(','); })).join('\n'); }
  function parseCSV(text) {
    var out = [], row = [], cur = '', q = false, i, c, rows, heads;
    text = String(text || '').replace(/\r\n?/g, '\n');
    for (i = 0; i < text.length; i++) { c = text[i]; if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; } else if (c === '"') q = true; else if (c === ',') { row.push(cur); cur = ''; } else if (c === '\n') { row.push(cur); out.push(row); row = []; cur = ''; } else cur += c; }
    if (cur || row.length) { row.push(cur); out.push(row); }
    if (!out.length) return [];
    heads = out.shift();
    return out.filter(function (r) { return r.join('').trim(); }).map(function (r) { var o = {}; heads.forEach(function (h, idx) { o[h] = r[idx] || ''; }); return o; });
  }

  var api = { TODAY: TODAY, systems: systems, sampleRecords: sampleRecords, validate: validate, report: report, toCSV: toCSV, parseCSV: parseCSV, money: money };
  root.AdminEngine = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
