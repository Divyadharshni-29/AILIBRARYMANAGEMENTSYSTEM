import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 11 * inch - 36, "AI-Powered Library Management System — Project & Interview Guide")
            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.5)
            self.line(54, 11 * inch - 42, 8.5 * inch - 54, 11 * inch - 42)
        
        # Footer
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(54, 45, 8.5 * inch - 54, 45)
        
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(8.5 * inch - 54, 32, page_text)
        self.drawString(54, 32, "Confidential & Proprietary — Prepared for Technical & HR Evaluation")
        self.restoreState()

def generate_pdf(output_filename="AI_Library_Management_System_Project_Report.pdf"):
    doc = SimpleDocTemplate(
        output_filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    # Custom Palette
    PRIMARY = colors.HexColor("#0f172a")     # Slate 900
    ACCENT = colors.HexColor("#2563eb")      # Blue 600
    ACCENT_LIGHT = colors.HexColor("#eff6ff")# Blue 50
    EMERALD = colors.HexColor("#059669")     # Emerald 600
    TEXT_DARK = colors.HexColor("#1e293b")   # Slate 800
    TEXT_MUTED = colors.HexColor("#64748b")  # Slate 500
    BORDER_COLOR = colors.HexColor("#cbd5e1")# Slate 300

    # Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=PRIMARY,
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=ACCENT,
        spaceAfter=12
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=PRIMARY,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=ACCENT,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=TEXT_DARK,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=TEXT_DARK,
        leftIndent=12,
        spaceAfter=3
    )

    qa_q_style = ParagraphStyle(
        'QA_Question',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13.5,
        textColor=PRIMARY,
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True
    )

    qa_a_style = ParagraphStyle(
        'QA_Answer',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=TEXT_DARK,
        leftIndent=8,
        spaceAfter=8
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=TEXT_DARK
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=PRIMARY
    )

    story = []

    # Title Banner Box
    story.append(Paragraph("📚 AI-Powered Library Management System", title_style))
    story.append(Paragraph("Comprehensive Technical Architecture, Modules, AI/ML Engines & Interview Guide", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=ACCENT, spaceBefore=2, spaceAfter=10))

    # Executive Overview
    overview_text = (
        "<b>Executive Summary:</b> The AI-Powered Library Management System is an enterprise-grade full-stack platform "
        "designed to modernize campus library workflows. It integrates core circulation desk operations (live camera QR scanning, "
        "ISBN-10/13 mathematical checksum validation, shelf/rack inventory tracking) with advanced Machine Learning capabilities "
        "(content-based TF-IDF recommendations, dynamic collaborative student profiling, natural language semantic search, "
        "and circulation demand prediction)."
    )
    story.append(Paragraph(overview_text, body_style))
    story.append(Spacer(1, 6))

    # ---------------------------------------------------------
    # SECTION 1: END-TO-END DEVELOPMENT PROCESS
    # ---------------------------------------------------------
    story.append(Paragraph("1. End-to-End Development Process", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_COLOR, spaceBefore=1, spaceAfter=6))

    process_steps = [
        ("Phase 1: Architecture & Relational Schema", 
         "Designed normalized relational database schema in MySQL & SQLite with Role-Based Access Control (Admin, Librarian, Student). Built relational models linking Users, Roles, Books, Categories, Transactions, BookCopies, Ratings, and UserPreferences."),
        ("Phase 2: AI & Machine Learning Pipeline", 
         "Implemented scikit-learn TF-IDF vectorizers and cosine similarity engines. Built collaborative interaction matrices, dynamic taste profilers with onboarding cold-start fallbacks, and real-time Information Retrieval benchmarking (Precision@k, Recall@k, MAP)."),
        ("Phase 3: Full-Stack Application Development", 
         "Engineered asynchronous FastAPI backend services with JWT authentication and Pydantic validation. Built a responsive glassmorphic React 18 UI with Vite and Tailwind CSS featuring tailored dashboards for each role."),
        ("Phase 4: QR Code & ISBN Circulation Desk", 
         "Implemented modulo-11 and modulo-10 ISBN checksum validation, automated QR payload generation, camera-based HTML5 barcode scanning, shelf/rack location tracking, and 1-click book issue/return workflows."),
        ("Phase 5: Quality Assurance & Migration", 
         "Executed safe database migration scripts (migrate_db.py) backfilling existing records, automated end-to-end integration tests, and validated zero-error Vite production build.")
    ]

    for title, desc in process_steps:
        story.append(Paragraph(f"• <b>{title}:</b> {desc}", bullet_style))

    story.append(Spacer(1, 8))

    # ---------------------------------------------------------
    # SECTION 2: SYSTEM MODULES BREAKDOWN
    # ---------------------------------------------------------
    story.append(Paragraph("2. System Modules Breakdown", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_COLOR, spaceBefore=1, spaceAfter=6))

    module_data = [
        [Paragraph("Module Layer", table_header_style), Paragraph("Component / Router", table_header_style), Paragraph("Key Responsibilities & Technologies", table_header_style)],
        
        [Paragraph("<b>Frontend (React)</b>", table_cell_bold), 
         Paragraph("QRScannerPage.jsx", table_cell_style), 
         Paragraph("Live camera QR/barcode scanner with html5-qrcode, image upload fallback, manual lookup, and 1-click Issue & Return desk.", table_cell_style)],
        
        [Paragraph("<b>Frontend (React)</b>", table_cell_bold), 
         Paragraph("QRCodeModal.jsx", table_cell_style), 
         Paragraph("Library sticker modal with QR image, Title, Author, ISBN, Shelf location, and Print/Download PNG actions.", table_cell_style)],

        [Paragraph("<b>Frontend (React)</b>", table_cell_bold), 
         Paragraph("Student Portals", table_cell_style), 
         Paragraph("BookCatalog, BookDetails, PersonalizedRecommendations, BorrowedBooks, ReadingHistory, Profile & Taste.", table_cell_style)],

        [Paragraph("<b>Frontend (React)</b>", table_cell_bold), 
         Paragraph("Librarian & Admin", table_cell_style), 
         Paragraph("BookManagement (ISBN validation + Shelf), OverdueManagement, AIDemandInsights, UserManagement, AIModelEvaluation.", table_cell_style)],

        [Paragraph("<b>Backend (FastAPI)</b>", table_cell_bold), 
         Paragraph("books.py & loans.py", table_cell_style), 
         Paragraph("CRUD with ISBN uniqueness & checksum validation, Base64 QR generator, issue/return by QR, and overdue fines.", table_cell_style)],

        [Paragraph("<b>Backend (FastAPI)</b>", table_cell_bold), 
         Paragraph("recommendations.py & search.py", table_cell_style), 
         Paragraph("TF-IDF content cosine similarity, hybrid user affinity feeds, and NLP semantic query parsing.", table_cell_style)],

        [Paragraph("<b>Backend (FastAPI)</b>", table_cell_bold), 
         Paragraph("auth.py & admin.py", table_cell_style), 
         Paragraph("JWT Bearer security, Bcrypt password hashing, Role-Based Access Control dependency injection.", table_cell_style)],

        [Paragraph("<b>Database</b>", table_cell_bold), 
         Paragraph("MySQL / SQLite", table_cell_style), 
         Paragraph("Relational schema (schema.sql), migration & backfill engine (migrate_db.py), realistic campus dataset (seed_data.py).", table_cell_style)]
    ]

    t_modules = Table(module_data, colWidths=[1.3*inch, 1.8*inch, 3.9*inch])
    t_modules.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor("#f8fafc"), colors.white]),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_modules)
    story.append(Spacer(1, 10))

    # Page Break for AI Engine & Interview Prep
    story.append(PageBreak())

    # ---------------------------------------------------------
    # SECTION 3: AI & MACHINE LEARNING FEATURES UNDER THE HOOD
    # ---------------------------------------------------------
    story.append(Paragraph("3. AI & Machine Learning Features (Under the Hood)", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_COLOR, spaceBefore=1, spaceAfter=6))

    ai_data = [
        [Paragraph("AI Feature", table_header_style), Paragraph("Algorithm & Libraries", table_header_style), Paragraph("Mathematical Logic & Implementation", table_header_style)],
        
        [Paragraph("<b>1. Content-Based Filtering</b>", table_cell_bold), 
         Paragraph("TF-IDF Vectorizer + Cosine Similarity (scikit-learn)", table_cell_style), 
         Paragraph("Transforms book metadata (title, author, category, keywords, description) into normalized TF-IDF feature vectors. Computes dot product cosine similarity matrix to recommend similar titles.", table_cell_style)],

        [Paragraph("<b>2. Dynamic Taste Profiling</b>", table_cell_bold), 
         Paragraph("Collaborative Interaction Matrix (numpy, pandas)", table_cell_style), 
         Paragraph("Constructs user-genre affinity vectors updated in real-time when books are borrowed, rated (1-5★), or returned. Weights recent interactions higher to reflect evolving student tastes.", table_cell_style)],

        [Paragraph("<b>3. Hybrid Recommendation</b>", table_cell_bold), 
         Paragraph("Weighted Linear Ensemble Model", table_cell_style), 
         Paragraph("Combines Content Similarity (60%) with Collaborative User Affinity (40%). Incorporates an onboarding persona selector to solve the 'Cold Start' problem for new students.", table_cell_style)],

        [Paragraph("<b>4. NLP Semantic Search</b>", table_cell_bold), 
         Paragraph("N-Gram Tokenizer & Query Intent Classifier", table_cell_style), 
         Paragraph("Parses natural language prompts (e.g. 'introductory python for machine learning'). Strips stop words, maps semantic intent to categories, and scores books by relevance.", table_cell_style)],

        [Paragraph("<b>5. Demand Forecasting</b>", table_cell_bold), 
         Paragraph("Circulation Velocity & Depletion Rate Predictor", table_cell_style), 
         Paragraph("Analyzes borrow frequency, return turnaround times, and stock depletion rates to predict copy shortages and assist librarians in acquisition planning.", table_cell_style)],

        [Paragraph("<b>6. Model Evaluation Studio</b>", table_cell_bold), 
         Paragraph("IR Benchmarking (Precision@k, Recall@k, MAP)", table_cell_style), 
         Paragraph("Computes real-time Information Retrieval quality benchmarks and API response latency to provide transparency into recommendation accuracy.", table_cell_style)]
    ]

    t_ai = Table(ai_data, colWidths=[1.5*inch, 1.8*inch, 3.7*inch])
    t_ai.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor("#f8fafc"), colors.white]),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_ai)
    story.append(Spacer(1, 10))

    # ---------------------------------------------------------
    # SECTION 4: QR CODE & ISBN CIRCULATION SPECIFICATION
    # ---------------------------------------------------------
    story.append(Paragraph("4. QR Code & ISBN Circulation System", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_COLOR, spaceBefore=1, spaceAfter=6))

    qr_points = [
        "<b>Mathematical ISBN Validation:</b> Enforces modulo-11 checksums for ISBN-10 (with 'X' check character support) and modulo-10 alternating 1/3 weight checksums for ISBN-13. Prevents duplicate database entries.",
        "<b>Privacy-Preserving QR Generation:</b> Encodes only non-sensitive book identifiers (LIB-BOOK-XXXX), ISBN, and Book ID. Contains zero student or personal private information.",
        "<b>Physical Inventory Tracking:</b> Maps every book to its physical shelf location (e.g. 'Rack B-02, Shelf 3') displayed on cards, detail views, and printed labels.",
        "<b>Printable Book Label Stickers:</b> Generates adhesive labels ready for printing with QR barcode, Title, Author, ISBN, and Shelf Location with 1-click Download PNG and Print options.",
        "<b>1-Click Circulation Workflow:</b> Camera scan auto-identifies book $\\rightarrow$ allows 1-click issue to student (14-day loan) or 1-click check-in return with automatic overdue fine settlement."
    ]
    for p in qr_points:
        story.append(Paragraph(f"• {p}", bullet_style))

    story.append(Spacer(1, 10))

    # Page Break for Interview Questions
    story.append(PageBreak())

    # ---------------------------------------------------------
    # SECTION 5: HR & TECHNICAL INTERVIEW QUESTIONS & MODEL ANSWERS
    # ---------------------------------------------------------
    story.append(Paragraph("5. HR & Technical Interview Questions & Model Answers", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_COLOR, spaceBefore=1, spaceAfter=6))

    qa_list = [
        ("Q1 (HR/General): Can you describe this project in simple terms (Elevator Pitch)?",
         "\"I developed an AI-Powered Library Management System that modernizes traditional campus libraries. It combines complete physical circulation operations—such as live camera QR scanning, mathematical ISBN-10/13 validation, and physical shelf/rack location tracking—with intelligent AI features including personalized book recommendations, NLP semantic search, and predictive circulation demand analytics for library administrators.\""),

        ("Q2 (HR/Behavioral): What was your specific role and biggest technical contribution?",
         "\"I engineered the full-stack architecture. I designed the relational database schema in MySQL/SQLite, implemented the FastAPI backend services with JWT authentication and machine learning pipelines in Python, built the responsive React user interface with Vite and Tailwind CSS, and integrated the camera-based QR circulation workflow.\""),

        ("Q3 (Technical): Why did you choose FastAPI over Django or Flask?",
         "\"FastAPI is an asynchronous (ASGI) framework that offers superior execution speed and native async support for high-concurrency requests. Its automatic OpenAPI/Swagger documentation generation accelerated frontend integration, and built-in Pydantic data validation made complex operations—such as mathematical ISBN checksum verification—clean, robust, and maintainable.\""),

        ("Q4 (Technical): How does the recommendation engine handle new users with zero history (Cold Start)?",
         "\"We solved the Cold Start problem using a Hybrid Recommendation architecture. During onboarding, students select their primary fields of interest, which initializes their baseline preference vector. As the student interacts with the catalog (borrowing, rating, viewing), our dynamic collaborative profiler continuously shifts their affinity weights in real time, blending content-based similarity with collaborative signals.\""),

        ("Q5 (Technical): How does the QR Code and ISBN system protect privacy and prevent duplicate books?",
         "\"First, privacy is safeguarded because the QR payload strictly contains non-sensitive book metadata (Book ID, ISBN, QR string) with zero student information. Second, duplicate book titles and copies are prevented using strict database unique constraints on ISBNs and QR codes, validated against standard modulo-11 and modulo-10 checksum algorithms before database insertion.\""),

        ("Q6 (Technical): How would you scale this system to 1,000,000 students and 5,000,000 books?",
         "\"1. Caching: Deploy Redis to cache top recommendations, search results, and session tokens.<br/>"
         "2. Vector Search: Migrate TF-IDF matrices to a dedicated vector database like Qdrant or Milvus with HNSW indexing.<br/>"
         "3. Database Scaling: Implement MySQL Primary-Replica read replication and connection pooling.<br/>"
         "4. Asynchronous Task Queues: Offload heavy ML model re-training and demand analytics to Celery workers with RabbitMQ.\""),

        ("Q7 (Security): How is authentication and role-based access control (RBAC) enforced?",
         "\"Authentication uses JSON Web Tokens (JWT) signed with HMAC-SHA256 and Bcrypt password hashing. On the backend, FastAPI dependency injection (require_role(['admin', 'librarian'])) protects administrative routes. On the frontend, React ProtectedRoute wrappers restrict student, librarian, and admin views.\"")
    ]

    for q, a in qa_list:
        story.append(Paragraph(q, qa_q_style))
        story.append(Paragraph(a, qa_a_style))

    # Build PDF
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated {output_filename}")

if __name__ == "__main__":
    generate_pdf()
