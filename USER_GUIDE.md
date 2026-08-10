# Application User Guide  
### Offer Letter + HR + Sales + Projects + Finance Portal

This guide explains how to use the **full application** — for Admin, HR, TL, and Employee.

---

# ENGLISH VERSION

## 1. What is this application?

This is a multi-role business portal that includes:

| Module | Purpose |
|--------|---------|
| **Documents** | Offer Letter, Experience Letter, Other Documents (PDF) |
| **People & HR** | Employees, TL teams, Salary calculator |
| **Sales** | Leads, Customers, Payments, Prizes, Sales Dashboard |
| **Projects** | Projects, Staff Allocation, Milestones, Tasks |
| **Finance** | Payment Summary, Staff Expenses, Office Expenses |
| **Service** | Maintenance, Domains |
| **System** | Notifications, Reports, Login Sessions, Settings |

---

## 2. How to login

| Role | Login URL | Credentials | Lands on |
|------|-----------|-------------|----------|
| **Admin / HR** | `/login` | Email + Password | Main **Dashboard** |
| **Employee** | `/employee-login` | Full Name + Mobile Number | **Sales Dashboard** |
| **TL** | `/employee-login` | Full Name + Mobile Number | **TL Dashboard** |

**Important:** Employee and TL must already exist under **Employees**, with correct **Access Role**.

---

## 3. Roles overview

| Role | Main responsibility |
|------|---------------------|
| **Admin** | Full control — company settings, all modules, all data |
| **HR** | Employees, documents (offer/experience), salary, sales support |
| **TL** | Team tasks, assign work, view team progress; can use sales modules |
| **Employee** | Own sales (leads/customers/payments/prizes) + own assigned tasks |

---

## 4. ADMIN — How to use the full app

### 4.1 First-time setup

1. Login at `/login` with Admin email & password.
2. Open **Settings** → set company name, logo, branding.
3. Open **Employees** → add all staff.
4. For each person, set **Access Role**: Admin / HR / TL / Employee.
5. Open **TL Management** → assign employees under Team Leaders.
6. (Optional) Open **Sales Prizes** → create reward targets.
7. Ready to use daily modules.

### 4.2 Offer Letter (core document flow)

1. Sidebar → **Documents → Offer Letter**
2. Fill form for candidate (or select existing employee to prefill).
3. Generate / preview **PDF**.
4. **Save** offer letter to database.
5. Download PDF or send via email if available.
6. View saved letters and stats on main **Dashboard**.

**Related documents**
- **Experience Letter** — experience certificates  
- **Other Documents** — custom document editor  

### 4.3 People & HR

| Menu | Use |
|------|-----|
| **Employees** | Create / edit / view staff master data |
| **TL Management** | Assign / remove employees from TL teams |
| **Salary Calculator** | Calculate salary, save calculation history |

### 4.4 Sales workflow (Admin sees everyone)

```
Lead → Follow-up → Convert to Customer → Payment → Prize progress
```

| Menu | What Admin does |
|------|-----------------|
| **Sales Leads** | View all leads, filter/search, change status, convert |
| **Customers** | View all customer records |
| **Customer Payments** | View/create/receive all customer payments |
| **Sales Dashboard** | Team performance, payments, prizes |
| **Sales Prizes** | Define targets & rewards dynamically |

**How to set a prize (example)**  
- Title: Gold Prize  
- Metric: Payment received  
- Target: 100000  
- Reward: Gift voucher / bonus  
- Period: All time **or** This month  

### 4.5 Projects & delivery

| Menu | Use |
|------|-----|
| **Projects** | Create project linked to customer (domain/payment can auto-link) |
| **Staff Allocation** | Assign employee to a customer/project |
| **Milestones** | Track project deadlines |
| **Tasks** | Create daily tasks for TL/Employee |

### 4.6 Finance

| Menu | Use |
|------|-----|
| **Payment Summary** | Read-only overview: incoming, due, outgoing |
| **Staff Expenses** | Employee expense claims — approve / pay |
| **Office Expenses** | Office costs (rent, bills, supplies) |

### 4.7 Service & system

- **Maintenance** — AMC / service records  
- **Domains** — domain & hosting tracking  
- **Notifications** — e.g. when employee completes a task  
- **Reports** — select report type → view table → export CSV  
- **Login Sessions** — who is online and login duration  
- **Settings** — company, departments, roles, module guide  

### 4.8 Admin daily checklist

1. Open **Dashboard** (letters + analytics)  
2. Check **Sales Dashboard** (team sales/payments)  
3. Review **Notifications**  
4. Create **Offer Letter** if hiring  
5. Monitor **Tasks / Projects / Payments**  

---

## 5. HR — How to use

- Login same as Admin: `/login`
- Primary work:
  - Employees master
  - Offer Letter & Experience Letter
  - Salary Calculator
  - Sales Prizes (if needed)
  - Reports & Notifications

HR generally has access similar to Admin on HR/documents/sales (not limited to one employee’s data).

---

## 6. TL Dashboard — How to use

### Login
`/employee-login` → Full Name + Mobile → **TL Dashboard**

### What TL does on TL Dashboard
1. See **My Team** (employees under them).
2. **Assign Task** — employee, title, due date, priority.
3. Track remarks, progress, completion.

### Sales for TL
- Can open **Sales Leads / Customers / Payments**
- Can open **Sales Dashboard** for performance view

### Task flow with employees
```
TL assigns task
  → Employee sees it on My Tasks
  → Employee updates status / remark
  → When Completed → Admin / HR / TL get notification
```

---

## 7. EMPLOYEE — How to use

### Login
`/employee-login` → Full Name + Mobile → **Sales Dashboard**

### A) Sales Dashboard (main / default)

Shows **only that employee’s data**:
- Customers  
- Leads created / converted  
- Sales value  
- Payment received / due  
- Prize progress (current vs target, unlocked prizes)

### B) Daily sales steps

1. **Sales Leads** → **+ New Lead** (name, phone required).
2. Open lead → log call, update status, set next follow-up.
3. When ready → **Convert to Customer**.
4. **Customer Payments** → record total & amount received.
5. Use **Receive Payment** for remaining balance later.
6. Check **Sales Dashboard** for prizes progress.

**List vs Board on Sales Leads**
- **List** — best for many leads (search, filter, pagination, quick status).
- **Board** — pipeline view by status.

**Data isolation:** Employee sees only own assigned customers / payments / leads.

### C) My Tasks (`/employee-dashboard`)

1. Open **My Tasks**.
2. See assigned tasks from Admin/TL.
3. Update:
   - Status (Pending / In Progress / Completed)
   - Progress %
   - Remark
   - Estimated / actual time
4. Completing a task creates a **task completed** notification for managers.

### D) Other for Employee
- **Staff Expenses** — submit travel/food/fuel claims  
- **Notifications** — own alerts  

---

## 8. End-to-end company flows

### Hiring flow
```
Add Employee → Create Offer Letter PDF → Save/Download/Email → Joining
```

### Sales flow
```
New Lead → Follow-ups → Convert Customer → Record Payment → Prize unlocks when target met
```

### Delivery flow
```
Create Project → Staff Allocation → Tasks / Milestones → Complete delivery
```

### Money flow
```
Customer Payments (incoming)
Staff Expenses + Office Expenses (outgoing)
View combined picture in Payment Summary (Admin/HR)
```

---

## 9. Quick “Where do I go?” map (English)

| I want to… | Go to |
|------------|--------|
| Create offer PDF | Documents → Offer Letter |
| Create experience certificate | Experience Letter |
| Add staff | Employees |
| Make TL teams | TL Management |
| Manage leads | Sales Leads |
| View customers | Customers |
| Collect money | Customer Payments |
| Set sales rewards | Sales Prizes |
| See sales scores | Sales Dashboard |
| Give tasks (TL) | TL Dashboard / Tasks |
| Update my work (Employee) | My Tasks |
| See all money | Payment Summary |
| Export data | Reports |
| Change company logo/name | Settings |

---

## 10. Important rules

1. Employee data is limited to **their own** assigned sales items.  
2. Admin sees **everything**.  
3. Prizes are **Admin-configured**; progress is **auto-calculated**.  
4. Lead convert assigns customer to the sales person.  
5. Task completion notifications go to Admin/HR/TL.  
6. Employee/TL login works only if they exist in **Employees** with correct role.  

---

# HINGLISH VERSION

## 1. Yeh application kya hai?

Yeh multi-role portal hai — sirf offer letter nahi:

| Module | Simple matlab |
|--------|----------------|
| **Documents** | Offer Letter, Experience Letter, Other PDFs |
| **People & HR** | Employees, TL teams, salary calculator |
| **Sales** | Leads, Customers, Payment, Prizes, Sales Dashboard |
| **Projects** | Project, staff allocation, milestones, tasks |
| **Finance** | Payment summary, staff expense, office expense |
| **Service** | Maintenance, Domains |
| **System** | Notifications, Reports, Login sessions, Settings |

---

## 2. Login kaise karein

| Role | Page | Kya daalein | Kahan jaye |
|------|------|-------------|------------|
| **Admin / HR** | `/login` | Email + Password | **Dashboard** |
| **Employee** | `/employee-login` | Name + Mobile | **Sales Dashboard** |
| **TL** | `/employee-login` | Name + Mobile | **TL Dashboard** |

**Yaad rakho:** Employee/TL pehle **Employees** me add honi chahiye, sahi **Access Role** ke saath.

---

## 3. Roles simple language me

| Role | Kaam |
|------|------|
| **Admin** | Poora system control — sab modules, sab data |
| **HR** | Staff, offer/experience letter, salary, sales support |
| **TL** | Team tasks assign, progress dekhna; sales bhi use kar sakte hain |
| **Employee** | Apne leads/customers/payments/prizes + apne tasks |

---

## 4. ADMIN — poora app kaise use kare

### 4.1 Pehli baar setup

1. `/login` se Admin login karo.  
2. **Settings** me company name/logo set karo.  
3. **Employees** me saare staff add karo.  
4. Har person ka **Access Role** select karo.  
5. **TL Management** se team banao (TL ke under employees).  
6. (Optional) **Sales Prizes** me reward rules banao.  
7. Ab daily work shuru.

### 4.2 Offer Letter kaise banaye

1. Sidebar se **Documents → Offer Letter** kholo.  
2. Form bharo (naya candiddate) ya employee select karke prefill.  
3. PDF generate / preview karo.  
4. Database me **Save** karo.  
5. Download karo ya email bhejo (agar option available hai).  
6. Main **Dashboard** pe saved letters aur stats dikhenge.

**Saath me:**
- **Experience Letter** — experience certificate  
- **Other Documents** — custom documents  

### 4.3 People & HR

| Menu | Kya karna hai |
|------|----------------|
| **Employees** | Staff add/edit/view |
| **TL Management** | TL team assign/remove |
| **Salary Calculator** | Salary calculate + save |

### 4.4 Sales flow (Admin sab dekhta hai)

```
Lead → Call/Follow-up → Customer banao → Payment lo → Prize progress
```

| Menu | Admin kya kare |
|------|----------------|
| **Sales Leads** | Sab leads manage, filter, convert |
| **Customers** | Sab customers dekho |
| **Customer Payments** | Sab payments record / receive |
| **Sales Dashboard** | Team sales performance + prizes |
| **Sales Prizes** | Target set: itni sales pe yeh reward |

**Prize example**  
“Payment received ₹1,00,000 ho to gift voucher” — yeh Admin **Sales Prizes** se set karega.  
Employee dashboard pe auto progress dikhega.

### 4.5 Projects & delivery

1. **Projects** — customer ka project  
2. **Staff Allocation** — kaun kaam karega  
3. **Milestones** — deadline track  
4. **Tasks** — daily work assign  

### 4.6 Finance

| Menu | Simple use |
|------|------------|
| **Payment Summary** | Sirf dekhna — aaya kitna, due kitna, nikal kitna |
| **Staff Expenses** | Employee bills approve/pay |
| **Office Expenses** | Office kharcha |

### 4.7 System

- **Notifications** — task complete alerts  
- **Reports** — report type choose → table → CSV export  
- **Login Sessions** — kaun online  
- **Settings** — company + roles guide  

### 4.8 Admin ka daily routine

1. **Dashboard** check  
2. **Sales Dashboard** se team check  
3. **Notifications**  
4. Hiring hai to **Offer Letter**  
5. Payments / Projects follow-up  

---

## 5. HR — kaise use kare

- Login: `/login` (Admin jaisa)  
- Main kaam: Employees, Offer Letter, Experience Letter, Salary, Reports, Sales support  
- Data mostly company-wide (employee jaisa limited nahi)

---

## 6. TL DASHBOARD — kaise use kare

### Login
`/employee-login` → Name + Mobile → **TL Dashboard**

### TL kya karta hai
1. **My Team** me under wale employees dekho.  
2. **Assign Task** se kaam do.  
3. Progress / remarks track karo.  

### Sales bhi
- Leads / Customers / Payments manage kar sakte ho  
- Sales Dashboard se performance dekh sakte ho  

### Task flow
```
TL task deta hai
  → Employee “My Tasks” me dekhta hai
  → Status update karta hai
  → Complete pe Admin/HR/TL ko notification
```

---

## 7. EMPLOYEE — kaise use kare

### Login
`/employee-login` → Name + Mobile → **Sales Dashboard**

### A) Sales Dashboard (main)

**Sirf apna data** dikhega:
- Customers  
- Leads  
- Payment received / due  
- Prize unlock progress  

### B) Roz ka sales kaam

1. **Sales Leads** → + New Lead  
2. Lead open → call notes + status  
3. **Convert to Customer**  
4. **Customer Payments** → amount save  
5. Baaki amount baad me **Receive Payment**  
6. Dashboard pe prize check karo  

**List view** = bahut leads manage karne ke liye (search + filter + pages)  
**Board view** = pipeline dekho  

**Rule:** Employee ko doosre ka data nahi dikhta — sirf assigned.

### C) My Tasks

1. **My Tasks** kholo  
2. Assigned tasks dekho  
3. Status / remark / progress update  
4. **Completed** karo → managers ko alert  

### D) Aur
- **Staff Expenses** — kharcha claim  
- **Notifications** — alerts  

---

## 8. Company ka end-to-end flow (simple)

### Hiring
```
Employee add → Offer Letter PDF → Save/Download → Join
```

### Sales
```
Lead → Follow-up → Customer → Payment → Prize (agar target complete)
```

### Delivery
```
Project → Staff Allocation → Tasks/Milestones → Complete
```

### Paisa
```
Customer se aaya (Payments)
Staff/Office kharcha (Expenses)
Admin/HR Payment Summary me full picture
```

---

## 9. “Kahan jaun?” quick map (Hinglish)

| Mujhe kya chahiye | Kahan jao |
|-------------------|-----------|
| Offer letter PDF | Documents → Offer Letter |
| Experience letter | Experience Letter |
| Naya staff | Employees |
| TL team | TL Management |
| Lead manage | Sales Leads |
| Customer | Customers |
| Payment lo | Customer Payments |
| Prize rule | Sales Prizes |
| Sales score | Sales Dashboard |
| Task dena (TL) | TL Dashboard / Tasks |
| Apna kaam update (Employee) | My Tasks |
| Poora paisa dekhna | Payment Summary |
| Data export | Reports |
| Company logo/name | Settings |

---

## 10. Important rules (yaad rakho)

1. Employee = **sirf apna** sales data.  
2. Admin = **sab** data.  
3. Prize Admin set karta hai; progress **auto**.  
4. Lead convert pe customer us sales person ke under jata hai.  
5. Task complete pe Admin/HR/TL notification.  
6. Employee/TL login tabhi chalega jab Employees me record + sahi role ho.  

---

## 11. Role-wise start point

| Role | Start page | Pehla kaam |
|------|------------|------------|
| **Admin** | Dashboard | Settings + Employees setup, phir daily overview |
| **HR** | Dashboard | Offer letters + staff |
| **TL** | TL Dashboard | Team tasks + sales follow-up |
| **Employee** | Sales Dashboard | Leads / payment + My Tasks |

---

## Support tip

Agar koi menu nahi dikh raha:
1. Login role check karo (Admin / HR / TL / Employee).  
2. Employee case me **Access Role** Employees module me sahi set hai ya nahi.  
3. Sidebar left menu se related section open karo.

---

*Document version: Application full use guide (English + Hinglish)*  
*Modules covered: Offer Letter, HR, Sales, Projects, Finance, Service, System*
