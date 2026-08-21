# 🏫 AI-Powered College Library Management System

An intelligent, full-stack College Library Management System built for students, faculty, librarians, and administrators using **FastAPI**, **React 18 (Vite)**, **Tailwind CSS**, and **Scikit-Learn AI**. Featuring physical library floor mapping, live book circulation, QR scanner circulation, UPI fine payments, password recovery, and bilingual AI search.

---

## ✨ Key Features

### 📍 Physical Location Hierarchy & Floor Map Locator (893 Books & 4,880+ Copies)
- **Hierarchical Physical Path**:
  `College Library -> Building -> Floor -> Area/Section -> Shelf -> Rack -> Book`
- **Floor Breakdown**:
  - **Ground Floor**: Tamil Classical & Heritage Wing (Sangam, Thirukkural, Epics, Modern Kalki Stacks)
  - **1st Floor**: Computer Science & AI Wing, Software Engineering & Cloud Architecture Wing
  - **2nd Floor**: Business, Management & Leadership Wing, Indian Literature & Heritage Wing
  - **3rd Floor**: Pure & Applied Mathematics Section, Science Section, Competitive Exam & Career Cell
- **📍 Find This Book Locator**: Interactive 2D visual library map modal with highlighted shelf radar beacons and step-by-step physical walking directions.
- **Librarian / Admin Location Management**: Dynamic configuration of buildings, floors, departmental sections, shelves, and racks without modifying code (`/librarian/locations`).

### 📚 Academic & Professional Collection Expansion (~100 New Books)
- **Business & Leadership (72 Books)**:
  - Peter Drucker, Jim Collins, Simon Sinek, Dale Carnegie, Ben Horowitz, Eric Ries, Stephen Covey, Daniel Kahneman, Clayton Christensen, Ray Dalio, Phil Knight, Satya Nadella, Indra Nooyi, Ratan Tata, Dr. APJ Abdul Kalam.
- **Software Engineering & Cloud Architecture (67 Books)**:
  - Martin Fowler, Robert C. Martin (Uncle Bob), Eric Evans, Gang of Four, Martin Kleppmann, Brendan Burns, Gene Kim, Nicole Forsgren, Jez Humble, Andrew Hunt, David Thomas, Kent Beck, Sam Newman.
- **Preserved Collection**: All 803 original Indian and Tamil literature books preserved without data loss.

### 🔐 Interactive Password Recovery ("Forgot Password?")
- Seamless credential recovery modal on Login page.
- Step 1: User verification by Registered College Email or Student ID / Roll.
- Step 2: Set and confirm new secure password.
- Step 3: Server-side bcrypt cryptographic hashing with instant login activation.

### 🔄 Dynamic Borrow Counters & Initial Clean State
- Initial demo borrow state initialized to ZERO (`Borrowed = 0`, `Overdue = 0`, `Available Copies = Total Copies`).
- Dynamic real-time increment/decrement on live borrow and return transactions directly synced with MySQL/SQLite.

### ➕ Live Book Creation with Instant AI Search Indexing
- Live Add Book Modal for Librarians & Admins (`POST /api/books`).
- Auto QR generation, barcode generation, copy allotment, and instant TF-IDF semantic search indexing without server restart.

### 🔍 Multi-Parameter Sorting, Location Filters & Pagination
- **Sorting**: Title A–Z, Title Z–A, Author A–Z, Newest, Oldest, Most Popular, Highest Rated.
- **Floor & Section Filters**: Ground Floor, 1st Floor, 2nd Floor, 3rd Floor.
- **Pagination**: 10, 20, 25, 50 books per page with numbered page navigation.

### 🤖 AI & Machine Learning
- **Semantic & NLP Search**: Natural language book discovery using TF-IDF and vector similarities.
- **Smart Recommendation Engine**: Personalized book recommendations based on borrowing history and user affinity.
- **User Profiling**: Dynamic reader categorization and reading habits analytics.
- **AI Model Evaluation Dashboard**: Real-time metrics (Precision@k, Recall@k, MAP, Latency) with visual charts.

### 🔲 QR Code & ISBN Management (with 🔄 Camera Flip)
- **ISBN-10 & ISBN-13 Validation**: Real-time format checking with standard modulo-11 and modulo-10 checksum algorithms and unique database constraints.
- **Automated QR Generation**: Generates unique non-sensitive Book QR codes and high-resolution sticker labels for each book.
- **Download & Print Labels**: 1-click printable adhesive book labels containing Book Title, Author, ISBN, Shelf/Rack location, and QR barcode.
- **Enhanced Live Camera Scanner with 🔄 Camera Flip**:
  - Automatically defaults to the **Back Camera (`environment`)** for optimal book QR label scanning.
  - Seamless **"🔄 Flip Camera"** toggle between Front (`user`) and Back (`environment`) camera stream anytime while scanner is running.
  - High-tech holographic viewfinder with glowing reticle corners and animated neon scanning laser line.
  - Graceful camera permission handling: *"Camera permission is required to scan the book QR code."*
- **Shelf & Rack Tracking**: Physical library location inventory tracking (e.g. `Rack B-02, Shelf 3`).
- **1-Click QR Circulation**: Instant Issue to Student and Return/Check-In workflow directly from camera scan.

### 💰 Complete Fine Payment Section & Multi-Gateway UPI Integration
- **Direct Pay Fine Triggers**: Instant **"💳 Pay Fine"** button visible on overdue loans in Borrowed Books, Notifications, and Student Dashboard.
- **Multi-App UPI & Gateway Support**:
  - 🟢 **Google Pay (GPay)**
  - 🔵 **PhonePe**
  - 🔷 **Paytm UPI**
  - 🏦 **BHIM / Dynamic UPI QR & Mobile Deep Link (`upi://pay?pa=...`)**
  - 💳 **Debit / Credit Card & NetBanking**
- **Server-Side Verification**:
  - Payment intent with unique Transaction Reference (`TXN-YYYYMMDD-XXXXXX`).
  - Strict server-side verification before updating payment state (`PENDING` -> `SUCCESSFUL`).
  - Prevention of duplicate payments on settled fines.
  - Zero sensitive storage: *Never collects or stores UPI PINs, OTPs, or banking passwords*.
- **Digital Payment Receipt & Voucher 🧾**:
  - Generates verifiable official receipt with Library Seal, Student info, Book details, Reference ID, timestamp, and settled fine amount.
  - 1-Click **"Print / Download Receipt"** functionality.
- **Student Fine & Payment History (`/student/fines/history`)**:
  - Filterable ledger table of all previous fine payments with receipt viewer.
- **Admin Fine & Revenue Console (`/librarian/fines` & `/admin/fines`)**:
  - Real-time KPI metrics: Total Fines Accrued, Paid Fines (Revenue), Unpaid Fines, and Pending Intents.
  - Comprehensive searchable transactions ledger with status and date filters.

### 🔔 Book Due-Date Notification & Reminder System
- **Automated Due-Date Scanning**: Real-time background scheduling engine that scans active loans and generates multi-tier notifications.
- **Smart Staged Reminders**:
  - **3 Days Before**: `"📚 Return Reminder: Your book '...' is due in 3 days. Please return it on time."`
  - **2 Days Before**: `"⏰ Reminder: Your book '...' is due in 2 days. Please plan to return it."`
  - **1 Day Before (Tomorrow)**: `"⚠️ Your book '...' is due tomorrow. Please return it to the library."`
  - **Due Today**: `"🔔 Your book '...' is due today. Please return it today."`
  - **Overdue**: `"🚨 Overdue: Your book '...' is overdue by X days. Please return it as soon as possible. A fine of ₹Y may apply."`
- **Intelligent Deduplication**: Prevents duplicate notifications for the same student, book, loan transaction, and reminder period.
- **Interactive Notification Bell 🔔**: Top navbar icon with real-time unread badge counter, animated pulse, and glassmorphic dropdown list with filtering ("All" / "Unread").
- **1-Click Actions**: Mark as read, mark all as read, relative timestamps ("2m ago", "Yesterday"), and direct return link.
- **Student Dashboard Action Banner**: Dedicated alerts section for instant due-date visibility and fine notices.

### 🧭 Consistent Global Navigation System
- **Persistent Global Navigation Bar**: Accessible on every page and section:
  - `← Back` (Smart browser history navigation with safe role fallback)
  - `🏠 Dashboard`
  - `📚 Books`
  - `🔍 Search` (Direct focus or natural language filter query)
  - `📖 Borrow Book` (Catalog & quick borrow)
  - `↩ Return Book` (Active loans & quick check-in)
  - `📷 QR Scanner` (Instant camera circulation desk)
  - `🔔 Notifications` (Live unread badge counter)
  - `👤 Profile` (Student profile & AI taste)
- **Top-Left Back Arrow (`← Back`)**: Integrated across all internal views (Book Details, Scanner, Loans, History, Notifications, Management panels) to enable seamless transitions without trapping users.
- **Dynamic Breadcrumbs**: Automatically generated clickable breadcrumb trail (`Dashboard > Books > Book Details`, `Dashboard > Borrowed Books`, etc.).
- **Dedicated Notifications Page (`/notifications`)**: Complete alert center with status filtering (All, Unread, Overdue, Due Soon), 1-click returns, and fine settlement.
- **Role-Aware Navigation**: Contextually adapts available links for Students, Librarians, and Administrators.

### 🌟 Friendly & Motivating Student Experience
- **Borrow Book Celebration Animation 📚✨**:
  - Full-screen high-performance confetti explosion upon borrowing.
  - Floating emojis: `📚 📖 ✨ 🌟 🎓 💡 🚀 ❤️`.
  - Inspiring message: *"Great choice! Every book you read is a step toward a better future. Keep learning and growing! 🌟📖"*.
  - Direct **Continue Reading →** and **View My Loans** action triggers.
- **Return Book Celebration Animation 🔄📚**:
  - Distinct celebration modal upon returning books.
  - Floating emojis: `🎉 📚 🔄 ✅ 🌱 ⭐ 🙌`.
  - Inspiring message: *"Thank you for returning the book on time! Your next great story is waiting for you. 📖✨"*.
  - Direct **Back to Dashboard →** and **Explore Next Book** triggers.
- **Today's Reading Motivation (`MotivationalBanner`)**:
  - Rotating inspiring quotes on the Student Dashboard (e.g. *"A book today can change your tomorrow."*, *"Knowledge is your superpower!"*).
  - 1-Click quote shuffle generator (`✨ New Quote`).
- **Student Reading Stats KPI Dashboard**:
  - **Books Borrowed**, **Books Returned**, **Currently Reading**, and **Reading Pace Status**.
- **Contextual Action Motivation Banners**:
  - **Borrow**: 📚 *"Awesome! A new book, a new opportunity to learn!"*
  - **Return**: 🔄 *"Well done! Thank you for returning the book responsibly!"*
  - **Search**: 🔍 *"Happy searching! Your next favorite book might be waiting here."*
  - **QR Scan**: 📷 *"Scan it, discover it, learn it!"*
  - **Recommendations**: 🤖 *"We found something you might love to read!"*
  - **Overdue**: ⏰ *"Don't worry! Please return your book as soon as possible."*

### 👤 Student / User Portal
- Interactive Book Catalog with filters (genres, availability, ratings, direct ISBN search).
- QR Code sticker viewer on book details.
- Real-time Book Issue & Return workflow.
- Personalized Reading Dashboard and Bookmarks.
- Fine and Due-Date tracking with instant status indicators.

### 🛡️ Admin & Librarian Portal
- QR & ISBN Circulation Desk (`/librarian/scanner`).
- Comprehensive Analytics Dashboard (issues, returns, active users, inventory stats).
- Inventory & Book Management (Add with ISBN validation, Edit, Delete, Stock control, Print QR labels).
- Member & User Management with role-based access control (Admin, Student, Faculty).
- Issue / Return circulation desk with automatic overdue & fine calculation.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.10+, FastAPI, SQLAlchemy, SQLite/MySQL, Pydantic, Scikit-learn, Pandas, NumPy
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Chart.js / Recharts
- **Authentication**: JWT (JSON Web Tokens) with Passlib bcrypt hashing

---

## 🚀 Getting Started

### 1. Prerequisites
- [Python 3.10+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- [Git](https://git-scm.com/downloads)

### 2. Clone the Repository
```bash
git clone https://github.com/<your-username>/<your-repo-name>.git
cd "AI Library Management System"
```

### 3. Backend Setup
```bash
# Create and activate virtual environment
python -m venv venv

# Windows
.\venv\Scripts\activate

# Linux/macOS
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed the database with sample data & ML embeddings
python backend/seed_data.py

# Start backend server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be live at: `http://127.0.0.1:8000/docs`

### 4. Frontend Setup
```bash
# In a new terminal:
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Frontend Web UI will be live at: `http://localhost:5173`

---

## ⚡ Quick Start (Windows)
You can launch both servers simultaneously with a single click:
```bash
.\run_app.bat
```

---

## 🔑 Default Credentials

| Role | Username / Email | Password |
|---|---|---|
| **Admin** | `admin@library.com` | `admin123` |
| **Student** | `student@library.com` | `student123` |

---

## 📂 Project Structure
```text
├── backend/
│   ├── app/
│   │   ├── ai/            # ML models, NLP search, Recommendation engine
│   │   ├── core/          # Config, DB connection, JWT Security
│   │   ├── models/        # SQLAlchemy Database Models
│   │   ├── routers/       # FastAPI REST API endpoints
│   │   └── schemas/       # Pydantic request/response schemas
│   ├── seed_data.py       # DB initialization & sample data
│   ├── schema.sql         # SQL schema definition
│   └── requirements.txt   # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Admin & Student dashboards and views
│   │   └── services/      # Axios API services
│   ├── package.json
│   └── vite.config.js
├── run_app.bat            # Windows 1-click startup script
├── .gitignore             # Git ignore patterns
└── README.md              # Project documentation
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
