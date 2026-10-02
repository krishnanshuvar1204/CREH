# Community Resource Exchange Hub (CREH) 🌍🤝

**Share More. Buy Less.**  
CREH is a full-stack web application designed to connect neighbors and community members, allowing them to securely lend, borrow, and share physical resources (tools, electronics, outdoor gear, etc.). Built with trust and security in mind, CREH features a robust Escrow system, Geospatial mapping, and integrated Dispute resolution.

---

## 🚀 Key Features

### 1. Geospatial Discovery (PostGIS + Mapbox)
* **Real-time Map Exploration:** Browse items dynamically rendered on an interactive map.
* **Precise Geofencing:** Uses PostgreSQL's `ST_DWithin` geography casting to accurately filter resources by physical radius (in kilometers) relative to the map center.
* **Smart Geolocation:** Automatically requests GPS permissions to pin your exact location (blue dot) while leaving you free to pan the map and explore other neighborhoods.

### 2. Comprehensive Escrow & Lending State Machine
The core of CREH is a safe borrowing lifecycle designed to protect lenders:
* `PENDING`: A user requests to borrow an item.
* `ACCEPTED`: The owner approves the request. (Unlocks Direct Chat).
* `ACTIVE`: The borrower pays a mock **Security Deposit** into Escrow, and takes possession of the item.
* `RETURNED_PENDING_REVIEW`: The borrower returns the item.
* `COMPLETED`: The owner confirms the item is okay; Escrow refunds the borrower fully.
* `DISPUTED`: The owner reports damage/missing items; Escrow is frozen and an Admin is summoned.

### 3. Integrated Direct Chat & Photo Uploads
* **Pre-Exchange Coordination:** Once a request is `ACCEPTED`, a private chat thread opens between the borrower and owner.
* **Photo Attachments:** Users can snap photos (saved securely on the backend) to document the condition of an item before handing it off, or just share visual instructions.
* **Live Polling:** Chat updates automatically in the background.

### 4. Admin Dispute Resolution Panel
* **Admin Dashboard:** Accessible only via the `admin@creh.com` account.
* **Dispute Oversight:** Admins can view all escalated tickets, including full contact details (Name/Email) for both parties.
* **Chat Interception:** Admins can join the active chat thread for a disputed item to request photos of the damage or mediate the conversation.
* **Financial Authority:** Admins have the final say to click **Rule for Requester (Refund Deposit)** or **Rule for Owner (Pay Escrow to Owner)**, instantly resolving the transaction.

### 5. Role-Based Authentication (JWT)
* Seamless Registration and Login flows.
* Dynamic UI toggle for "User" vs "Admin" access.
* Protected routing ensuring unauthorized users cannot access Dashboard or Admin Panels.

---

## 🛠 Tech Stack

### Frontend
* **Vite + React (TypeScript)**: Fast, modern client scaffolding.
* **Tailwind CSS v4**: Utility-first styling for a beautiful, responsive, professional interface.
* **React-Map-GL (v8) & Mapbox**: Interactive mapping and marker clustering.
* **Lucide React**: Clean, modern iconography.
* **Axios & React Query**: For robust data fetching and API communication.

### Backend
* **Node.js + Express**: REST API infrastructure.
* **TypeORM**: Object-Relational Mapping for robust database interactions.
* **PostgreSQL + PostGIS**: Relational database with advanced spatial extension for coordinates and radius logic.

---

## 📂 Project Structure

```text
CREH/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Business logic (Auth, Chat, Requests, Resources, Reviews)
│   │   ├── entity/           # TypeORM DB Models (User, Resource, Request, Message, Dispute, Review)
│   │   ├── routes/           # Express Route Definitions
│   │   ├── index.ts          # Express Server Setup & Static File Serving
│   │   ├── data-source.ts    # PostgreSQL / TypeORM Configuration
│   │   └── seed.ts           # Mock Data Generator (Geospatial sample items & Admin accounts)
│   └── uploads/              # Local storage for user-uploaded product/chat images
│
└── frontend/
    ├── src/
    │   ├── components/       # Reusable UI (Layout, Navbar, ChatModal)
    │   ├── pages/            
    │   │   ├── LandingPage.tsx    # Hero intro page
    │   │   ├── DiscoveryPage.tsx  # Mapbox interface and radius filtering
    │   │   ├── DashboardPage.tsx  # User inventory, active lending/borrowing tracking
    │   │   ├── AdminDashboard.tsx # Dispute mediation and override rules
    │   │   └── AuthPage.tsx       # JWT Login/Signup
    │   └── App.tsx           # React Router DOM configuration
    └── index.html
```

---

## 🧪 Default Test Accounts
If the database was seeded via `npm run seed`, the following accounts are available:

**Admin:**
* **Email:** `admin@creh.com`
* **Password:** `admin`

**Standard User:**
* **Email:** `test@creh.com`
* **Password:** `test`

*(You can also freely create your own standard user accounts via the Sign Up tab).*
