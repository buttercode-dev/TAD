(function(root){
'use strict';
var ENDPOINT='https://due-today-six.vercel.app/api/tad/applications';
var DEPARTMENTS={invoice:'Invoice Admin',sales:'Sales Admin',client:'Client Admin',property:'Property Admin',practice:'Practice / Booking Admin',member:'Member Admin'};
function clean(v,n){return String(v==null?'':v).trim().slice(0,n||500)}
function qualify(input){
 input=input||{};
 var active=Number(input.activeRecords)||0,reasons=[],score=0;
 if(active>=10&&active<=100){score+=3}else if(active>100){score+=2;reasons.push('The active workload is larger than the launch boundary and may need a separate scope.')}else{reasons.push('The managed service is designed for at least 10 active workflow records.')}
 if(input.workflowProblem&&input.workflowProblem!=='none'){score+=2}else{reasons.push('No repeated workflow problem was selected.')}
 if(input.ownerAvailable){score+=2}else{reasons.push('An owner or manager must be available for decisions.')}
 if(input.dataAuthority){score+=2}else{reasons.push('The business must confirm authority to use the operational records supplied later.')}
 if(input.boundaryAccepted){score+=1}else{reasons.push('The human-approval and data boundary must be accepted.')}
 var ready=score>=8&&active>=10&&input.ownerAvailable&&input.dataAuthority&&input.boundaryAccepted&&input.workflowProblem!=='none'&&DEPARTMENTS[input.department];
 return {ready:Boolean(ready),score:score,maxScore:10,reasons:reasons,activeRecords:active,department:input.department};
}
function collect(form){
 var f=new FormData(form);
 return {
  department:f.get('department'),business:f.get('business'),contact:f.get('contact'),email:f.get('email'),
  activeRecords:f.get('active_records'),workflowProblem:f.get('workflow_problem'),
  tools:f.get('tools'),outcome:f.get('outcome'),companyWebsite:f.get('company_website'),
  ownerAvailable:f.get('owner_available')==='on',dataAuthority:f.get('data_authority')==='on',
  boundaryAccepted:f.get('boundary_accepted')==='on'
 };
}
function buildPayload(input,startedAt){
 return {
  department:clean(input.department,30),business:clean(input.business,160),contact:clean(input.contact,160),email:clean(input.email,320),
  active_records:Number(input.activeRecords)||0,workflow_problem:clean(input.workflowProblem,80),
  tools:clean(input.tools,300),outcome:clean(input.outcome,700),
  owner_available:Boolean(input.ownerAvailable),data_authority:Boolean(input.dataAuthority),
  boundary_accepted:Boolean(input.boundaryAccepted),company_website:clean(input.companyWebsite,200),
  started_at:Number(startedAt)||0
 };
}
async function submitApplication(input,startedAt,fetchImpl){
 var send=fetchImpl||(root&&root.fetch);
 if(typeof send!=='function')throw new Error('submission_unavailable');
 var response=await send(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(buildPayload(input,startedAt))});
 var body={};
 try{body=await response.json()}catch(_error){body={}}
 if(!response.ok||!body.ok){var failure=new Error(body.error||'submission_failed');failure.code=body.error||'submission_failed';throw failure}
 return body;
}
function valid(form){var fields=form.querySelectorAll('[required]');for(var i=0;i<fields.length;i++){if(!fields[i].reportValidity())return false}return true}
function applyQuery(form){var q=new URLSearchParams(root.location&&root.location.search||'');[['business','business'],['contact','contact'],['email','email']].forEach(function(pair){var v=q.get(pair[0]),el=form.elements[pair[1]];if(v&&el&&!el.value)el.value=clean(v,pair[0]==='email'?320:160)})}
function escapeHtml(value){return String(value).replace(/[&<>'"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]})}
function render(result){
 var shell=document.getElementById('application-result'),title=document.getElementById('readiness-title'),summary=document.getElementById('readiness-summary'),list=document.getElementById('readiness-reasons'),send=document.getElementById('send-application'),status=document.getElementById('submission-status');
 shell.hidden=false;
 title.textContent=result.ready?'Ready to submit for private review':'Start with the Admin Audit first';
 summary.textContent=result.ready?'Your answers fit the launch boundary. Submit the application securely for TAD review.':'The service should not start until the gaps below are resolved.';
 list.innerHTML=(result.reasons.length?result.reasons:['No launch-boundary gaps were identified.']).map(function(x){return '<li>'+escapeHtml(x)+'</li>'}).join('');
 send.hidden=!result.ready;send.disabled=false;send.textContent='Submit application securely';
 if(status)status.textContent='';
 shell.scrollIntoView({behavior:'smooth',block:'start'});
}
function friendlyError(code){
 var messages={
  too_many_requests:'Too many attempts were received. Please try again later.',
  invalid_form_session:'The form session expired. Review the details and submit again in a moment.',
  required_confirmations_missing:'All authority and human-approval confirmations are required.',
  invalid_department:'This service department could not be verified.',
  application_rejected:'The application could not be accepted. Check the details and try again.',
  intake_unavailable:'The secure intake is temporarily unavailable. Please try again shortly.'
 };
 return messages[code]||'The application could not be submitted. Please try again.';
}
function init(){
 var form=document.getElementById('admin-service-application');if(!form)return;
 var startedAt=Date.now(),latestInput=null,latestResult=null,submitted=false;
 var send=document.getElementById('send-application'),status=document.getElementById('submission-status');
 applyQuery(form);
 form.onsubmit=function(e){e.preventDefault();if(!valid(form))return;latestInput=collect(form);latestResult=qualify(latestInput);submitted=false;render(latestResult)};
 if(send)send.onclick=async function(){
  if(!latestInput||!latestResult||!latestResult.ready||submitted)return;
  send.disabled=true;send.textContent='Submitting…';if(status)status.textContent='Submitting securely…';
  try{
   var result=await submitApplication(latestInput,startedAt);
   submitted=true;send.hidden=true;
   if(status)status.textContent='Application received. Reference '+clean(result.reference,20)+'. The Admin Department will review it privately.';
  }catch(error){
   if(error&&error.code==='invalid_form_session')startedAt=Date.now();
   send.disabled=false;send.textContent='Submit application securely';
   if(status)status.textContent=friendlyError(error&&error.code);
  }
 };
 var edit=document.getElementById('edit-application');if(edit)edit.onclick=function(){document.getElementById('application-result').hidden=true;submitted=false;form.scrollIntoView({behavior:'smooth',block:'start'})};
}
var api={ENDPOINT:ENDPOINT,DEPARTMENTS:DEPARTMENTS,qualify:qualify,buildPayload:buildPayload,submitApplication:submitApplication};root.AdminServiceOffer=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;if(typeof document!=='undefined')document.addEventListener('DOMContentLoaded',init);
})(typeof window!=='undefined'?window:globalThis);
