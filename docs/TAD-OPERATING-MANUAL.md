# The Admin Department operating manual

## 1. What TAD is

The Admin Department is a managed back-office operations service. The client is not buying a blank software subscription. TAD diagnoses one repetitive workflow, configures a controlled workspace, organises the starting backlog, helps operate the queue, escalates decisions and produces evidence of what moved, what is blocked and what is overdue.

The authenticated system behind the service contains two branded experiences:

- **Admin HQ** for the TAD operator;
- **Client Portal** for the managed client.

The public website explains and sells the service. The authenticated engine stores the managed workflow, decisions, reports and access rules.

## 2. Roles

### Public visitor

Can browse the website, compare the six services, preview workflows and complete the Admin Audit or a service readiness check.

### Applicant

Submits business-level readiness facts only. The applicant must not submit customer, supplier, tenant, patient, member, identity, banking, password or document-level information through the public form.

### TAD operator

Can enter Admin HQ, review applications, qualify or decline them, record commercial decisions, create managed workspaces, configure and operate workflow records, request approvals and produce reports.

### Client manager

Uses the Client Portal. Can view the service, make permitted approval decisions and respond to reports. Access is bound to the verified email used in the TAD application.

### Client viewer

Can view the managed workspace but cannot approve decisions or respond on behalf of the client.

### Outsider

Has no workspace access and cannot enter Admin HQ.

## 3. The six services

1. Invoice Admin
2. Sales Admin
3. Client Admin
4. Property Admin
5. Practice / Booking Admin
6. Member Admin

Each service uses a department-specific workflow template with its own statuses and fields, but the common control model is the same:

- one visible list;
- one current status;
- one owner;
- one next action;
- one due date;
- one blocked reason when applicable;
- recorded outcomes;
- human decisions where authority matters;
- periodic reporting.

## 4. Complete client journey

### Step 1 — Discover the service

The visitor lands on the TAD website and chooses either:

- the Admin Audit; or
- one of the six paid service pages.

The service page explains the launch scope, record boundary, once-off setup price, monthly managed-service price, inclusions and exclusions.

### Step 2 — Complete the readiness check

The applicant enters:

- business name;
- contact name;
- email;
- approximate active-record count;
- main workflow problem;
- current tools;
- required outcome;
- confirmation that an owner or manager is available;
- confirmation of authority to use operational records later;
- acceptance of the human-approval and data boundary.

The browser calculates readiness first. A ready result does not mean automatic acceptance. It means the application can be submitted for private TAD review.

### Step 3 — Submit the application

The application is sent securely to the authenticated intake endpoint. The public page displays a reference and confirms receipt.

What does **not** happen automatically at this stage:

- no workspace is created;
- no payment is collected;
- no client account is created;
- no operational records are imported;
- no external messages are sent;
- no service is considered active.

### Step 4 — TAD reviews the application

The application appears in Admin HQ under Applications. The operator reviews:

- readiness score;
- workflow problem;
- active-record volume;
- required outcome;
- owner availability;
- data authority;
- boundary acceptance;
- current tools;
- fit with the launch scope.

The operator records one of the following statuses:

- New
- Reviewing
- Qualified
- Declined
- Onboarding
- Converted

The operator separately records the commercial decision:

- Pending
- Accepted
- Needs separate scope
- Declined

### Step 5 — Qualification conversation

This is currently a human process outside the software. TAD contacts the applicant using the supplied email or another agreed channel and confirms:

- the real workflow boundary;
- exact record volume;
- source systems;
- data authority;
- who can approve decisions;
- what TAD may and may not do;
- setup price;
- monthly price;
- start date;
- how records will be transferred;
- whether the 14-day stabilisation is accepted.

### Step 6 — Commercial acceptance and payment

Payment is currently handled manually outside the TAD platform. The operator must not create the production workspace merely because the browser readiness score is high.

Before implementation, the operator must have evidence that:

- scope is accepted;
- the correct price is accepted;
- payment terms are accepted;
- the once-off setup payment has been received or formally approved under an agreed exception;
- the primary client email is confirmed.

### Step 7 — Create the managed workspace

After the application is marked Qualified, the operator selects **Create [Department] workspace**.

The system then:

- creates a managed business workspace;
- links it to the application;
- creates the selected department engagement;
- applies the department workflow template;
- assigns the TAD operator;
- creates the initial setup action;
- changes the application to Onboarding;
- stores the applicant email as the primary contact email.

Creating a workspace does **not** automatically email the client.

### Step 8 — Send the Client Portal activation link

After the workspace exists, Admin HQ shows a client activation link containing:

- the Client Portal destination;
- the application email;
- the business name.

The operator sends that link manually to the confirmed primary client contact after scope and payment are confirmed.

The client must register with the exact email address used in the application. The access claim derives the email from the verified authenticated account and does not accept a business ID or arbitrary email from the browser.

### Step 9 — Client account confirmation

The client:

1. opens the activation link;
2. enters or confirms the business name;
3. uses the exact application email;
4. chooses a password of at least eight characters;
5. confirms the email if Supabase email confirmation is enabled;
6. signs in to the Client Portal.

The portal claims only managed workspaces where the verified account email matches the primary contact email. A different email receives no managed workspace.

### Step 10 — Onboarding and installation

“Installation” does not mean downloading an app. It means configuring and loading the managed operating system.

The operator completes the following:

1. confirm the one workflow in scope;
2. confirm the starting and closed statuses;
3. confirm mandatory fields;
4. confirm owner names and responsibilities;
5. confirm approval rules and limits;
6. confirm external-action boundaries;
7. confirm reporting dates;
8. clean and deduplicate the agreed starting records;
9. create or import those records into the managed workflow;
10. ensure every open record has a current status;
11. assign an owner where applicable;
12. record a next action;
13. record a due date;
14. record a blocked reason when work cannot move;
15. verify the client can see the Service Desk;
16. verify the client manager can decide;
17. verify a viewer cannot decide;
18. establish the first review date;
19. begin the 14-day stabilisation period.

### Step 11 — Daily operation

During an active managed service, the operator:

- opens Admin HQ;
- reviews due and overdue actions;
- opens each client workflow;
- updates statuses;
- records outcomes;
- sets the next action and date;
- records blockers;
- creates decision requests when client authority is needed;
- prepares external follow-up content where included;
- sends external messages manually through the agreed channel unless a separately approved integration exists;
- avoids making payments, changing bank details or making unauthorised promises.

### Step 12 — Client decisions

Pending decisions appear in the Client Portal.

A client manager can:

- approve; or
- reject;

and may add a decision note.

A viewer can see the item but cannot decide. A second unrelated client cannot access it.

### Step 13 — Weekly reporting

The operator generates or prepares a service report for the agreed period. The report can contain metrics such as:

- actions completed;
- actions still due;
- open records;
- blocked records;
- overdue records;
- pending approvals;
- department-specific movement.

The report appears in the Client Portal when its status is Ready or Sent.

The client manager can respond:

- Continue
- Change
- Stop

The response is visible to the operator.

### Step 14 — Stabilisation decision

At the end of the 14-day launch period, TAD and the client review:

- whether the workflow is more controlled;
- whether the backlog is visible;
- whether owners and dates are reliable;
- whether approval turnaround improved;
- whether the client values the managed service;
- actual operator time;
- whether the monthly price is commercially viable.

The client chooses to continue, change scope or stop.

### Step 15 — Ongoing service

For an ongoing managed service, the operator continues the agreed queue review, outcome capture, escalation and reporting within the contracted record and workflow boundary.

### Step 16 — Pause, close or exit

When a service is paused or closed, the operator must:

- stop creating new operational work;
- record the final service status;
- resolve or clearly hand over open records;
- issue a final report;
- confirm what data remains and for how long;
- remove access that is no longer required;
- preserve the audit trail required for legitimate business records;
- avoid deleting records without an approved retention decision.

## 5. Operator workflow in detail

### Operator access

Admin HQ is restricted to allowlisted operator emails. On first use, an allowlisted account can claim the initial operator role. Ordinary client accounts cannot claim operator access.

### Applications queue

The operator uses the Applications page to:

- review new applications;
- record notes;
- change status;
- record commercial outcome;
- create a workspace only after qualification;
- open the managed workspace;
- generate the client activation handoff.

### Managed workflow

For each client, the operator can:

- see the workflow template and version;
- view total, open, blocked and overdue counts;
- see the status map;
- add a record;
- update a record;
- assign a person;
- set priority;
- set a next action and due date;
- record a blocked reason;
- update department-specific fields;
- add a change note;
- open the client-facing action view.

### Approvals

Approvals are for decisions that require client authority. They must not be used as a substitute for payment-system security or legal authorisation.

### Reports

Reports provide evidence of service activity. They are not an automatic guarantee of business outcomes.

## 6. Client Portal in detail

The Client Portal shows:

- the managed service and department;
- decisions waiting for an owner or manager;
- actions due in the shared queue;
- open workflow records;
- blocked records;
- overdue records;
- reports ready for review;
- workflow progress;
- account and service access information.

The detailed operator workspace remains private. The client sees the information required to retain control without exposing unnecessary internal operator detail.

## 7. What is automated and what is manual

### Automated in the current system

- browser readiness calculation;
- secure application submission;
- duplicate application recognition;
- application storage and operator queue;
- role-restricted Admin HQ access;
- managed workspace creation after operator action;
- department template assignment;
- verified-email workspace claim;
- role-based portal access;
- cross-workspace isolation;
- workflow status and due-date storage;
- approval decision enforcement;
- report response enforcement;
- test-environment creation and role testing.

### Manual in the current operating model

- initial sales conversation;
- audit delivery beyond the browser-generated diagnostic;
- pricing negotiation or exception approval;
- payment collection and confirmation;
- sending the activation link;
- receiving and checking operational records;
- cleaning and importing the real backlog;
- sending WhatsApp or email follow-ups;
- making external calls;
- generating the agreed weekly narrative;
- resolving business exceptions;
- client offboarding and retention decisions.

## 8. Failure handling

### Application submission fails

The website shows a safe error. The applicant should retry later or contact TAD. No service should be assumed to have started.

### Duplicate application

The intake returns the existing recent application rather than creating another uncontrolled duplicate.

### Wrong portal email

No managed workspace is claimed. The operator must verify the application email and resend the correct activation link. The operator must not change the primary email without confirming identity and authority.

### Email confirmation link fails

The client signs in from the Client Portal link or requests a new confirmation through the authentication provider's supported process. TAD must not ask for the client's password.

### Workspace creation fails

The application remains unconverted. The operator must not send an activation link until the workspace exists and opens successfully.

### Workflow template missing

The operator should stop onboarding that client, record the incident and fix the template before loading production records.

### Client sees the wrong workspace

Treat this as a security incident. Disable affected access, preserve evidence, investigate memberships and primary-contact matching, notify affected parties as required and do not continue normal operations until isolation is restored.

### Viewer can make a decision

Treat this as a permission defect. Block the release and restore manager-only decision enforcement.

### External provider outage

Vercel, Supabase, email and payment providers can fail. TAD should maintain a manual incident log and a temporary read-only operating fallback for urgent client work without bypassing security controls.

## 9. Go-live checklist for each paying client

The operator must confirm all items before marking the client Converted:

- application reviewed;
- service and scope accepted;
- data authority confirmed;
- decision-maker confirmed;
- setup payment confirmed;
- primary contact email confirmed;
- workspace created;
- correct department template visible;
- activation link sent;
- client email verified;
- client portal login tested;
- manager decision permission tested;
- viewer restriction tested when a viewer exists;
- starting records cleaned;
- record count within contracted boundary;
- every open record has a status;
- ownership rules recorded;
- next-action rules recorded;
- due-date rules recorded;
- approval rules recorded;
- communication boundary recorded;
- first weekly report date recorded;
- incident contact recorded;
- retention and exit expectations recorded.

## 10. Non-negotiable operating rules

- Do not load operational records before authority is confirmed.
- Do not ask clients for passwords or banking credentials.
- Do not make payments or change supplier banking details.
- Do not send external messages automatically unless a separately tested and approved integration exists.
- Do not promise guaranteed revenue, payment timing or business outcomes.
- Do not let a failed automated test be ignored to meet a launch date.
- Do not mark a client Converted until portal access and the correct workflow have been verified.
