const assert = require('node:assert/strict');
const fs = require('node:fs');
const offer = require('../admin-service-offer.js');
const audit = require('../admin-audit-v2.js');

async function main(){
  const home = fs.readFileSync('index.html','utf8');
  const code = fs.readFileSync('admin-service-offer.js','utf8');
  const services = {
    invoice:{file:'invoice-admin-service.html',label:'Invoice Admin',setup:'R5,900',monthly:'R4,500/month',problem:'missing_information'},
    sales:{file:'sales-admin-service.html',label:'Sales Admin',setup:'R4,900',monthly:'R3,900/month',problem:'missed'},
    client:{file:'client-admin-service.html',label:'Client Admin',setup:'R4,900',monthly:'R3,900/month',problem:'missing_documents'},
    property:{file:'property-admin-service.html',label:'Property Admin',setup:'R6,900',monthly:'R5,500/month',problem:'lost_requests'},
    practice:{file:'practice-admin-service.html',label:'Practice / Booking Admin',setup:'R5,900',monthly:'R4,900/month',problem:'booking_gaps'},
    member:{file:'member-admin-service.html',label:'Member Admin',setup:'R4,900',monthly:'R3,900/month',problem:'attendance_risk'}
  };

  assert.equal(offer.ENDPOINT,'https://due-today-six.vercel.app/api/tad/applications');
  assert.equal(code.includes('mailto:'),false,'paid offer engine must use secure submission');

  for(const [department,service] of Object.entries(services)){
    const page=fs.readFileSync(service.file,'utf8');
    for(const phrase of [service.label,service.setup,service.monthly,'admin-service-application','application-result','Submit application securely','company_website','submission-status','admin-service-offer.js']){
      assert.ok(page.includes(phrase),`${service.file} must include ${phrase}`);
    }
    assert.ok(page.includes(`name="department" value="${department}"`),`${service.file} must submit ${department}`);
    assert.ok(home.includes(service.file),`homepage must link to ${service.file}`);
    assert.ok(home.includes(`app/${department}-admin/?demo=1`),`homepage must preserve ${department} workflow preview`);

    const input={department,business:'Example Services',contact:'Owner',email:'owner@invalid.example',activeRecords:20,workflowProblem:service.problem,tools:'WhatsApp and Excel',outcome:'Every active record needs an owner and next date.',ownerAvailable:true,dataAuthority:true,boundaryAccepted:true,companyWebsite:''};
    const ready=offer.qualify(input);
    assert.equal(ready.ready,true,`${department} should qualify`);
    assert.equal(ready.score,10,`${department} should score 10`);
    const payload=offer.buildPayload(input,123456789);
    assert.equal(payload.department,department);
    assert.equal(payload.workflow_problem,service.problem);
    assert.equal(payload.active_records,20);

    let calledUrl='';let calledOptions=null;
    const result=await offer.submitApplication(input,123456789,async(url,options)=>{calledUrl=url;calledOptions=options;return{ok:true,json:async()=>({ok:true,reference:'ABC12345',department})}});
    assert.equal(calledUrl,offer.ENDPOINT);
    assert.equal(calledOptions.method,'POST');
    assert.equal(JSON.parse(calledOptions.body).department,department);
    assert.equal(result.reference,'ABC12345');
  }

  const signalFor={invoice:'late_invoices',sales:'missed_followups',client:'missing_documents',property:'property_requests',practice:'booking_admin',member:'member_churn'};
  for(const [department,service] of Object.entries(services)){
    const areas={invoice:0,sales:0,client:0,property:0,practice:0,member:0};areas[department]=4;
    const input={business:'Example Services',contact:'Owner',email:'owner@invalid.example',recordsPerWeek:30,channels:3,evidenceChecks:['live_list'],signals:[signalFor[department]],areas,controls:{capture:0,ownership:0,next_action:0,due_dates:0,approvals:0,visibility:0,reporting:0,documented:0}};
    const result=audit.scoreAudit(input);
    assert.equal(result.primary.key,department,`audit should rank ${department} first`);
    assert.ok(audit.getOfferPath(input,result).startsWith(service.file+'?'),`audit should route ${department} to paid offer`);
  }

  console.log('All six paid admin offer contracts passed.');
}
main().catch((error)=>{console.error(error);process.exit(1)});
