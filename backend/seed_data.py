import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import json
import random
from datetime import datetime, timedelta
from backend.app.database import engine, SessionLocal, Base
from backend.app.core.security import get_password_hash
from backend.app.models.entities import (
    Role, User, Category, Author, Book, BookCopy, Transaction, Rating, Feedback,
    SearchHistory, BookView, UserPreference, Fine, ModelEvaluation
)
from backend.app.ai.content_based import content_recommender
from backend.app.ai.collaborative import collaborative_recommender
from backend.app.ai.user_profiler import user_profiler
from backend.app.ai.evaluation import model_evaluator


def seed_database():
    print("Initializing Database Schema...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Clear existing data to avoid duplicates
    db.query(Fine).delete()
    db.query(Rating).delete()
    db.query(Feedback).delete()
    db.query(Transaction).delete()
    db.query(BookCopy).delete()
    db.query(BookView).delete()
    db.query(SearchHistory).delete()
    db.query(UserPreference).delete()
    db.query(ModelEvaluation).delete()
    db.query(Book).delete()
    db.query(Author).delete()
    db.query(Category).delete()
    db.query(User).delete()
    db.query(Role).delete()
    db.commit()

    print("Seeding Roles...")
    admin_role = Role(name="admin", description="System Administrator")
    librarian_role = Role(name="librarian", description="Library Staff")
    student_role = Role(name="student", description="Student / Library Member")
    db.add_all([admin_role, librarian_role, student_role])
    db.commit()

    print("Seeding Users...")
    hashed_pwd = get_password_hash("password123")

    users_data = [
        # Admin
        {"name": "Dr. Sarah Jenkins", "email": "admin@library.com", "role": admin_role, "dept": "Administration", "year": "Faculty", "pwd": get_password_hash("admin123")},
        # Librarians
        {"name": "Elena Rostova", "email": "librarian@library.com", "role": librarian_role, "dept": "Library Operations", "year": "Staff", "pwd": get_password_hash("librarian123")},
        {"name": "Marcus Vance", "email": "marcus@library.com", "role": librarian_role, "dept": "Library Services", "year": "Staff", "pwd": hashed_pwd},
        # Students (Varied reading profiles)
        {"name": "Arun Sharma", "email": "arun@student.edu", "role": student_role, "dept": "Computer Science", "year": "3rd Year", "pwd": get_password_hash("student123")},
        {"name": "Priya Patel", "email": "priya@student.edu", "role": student_role, "dept": "Data Science", "year": "4th Year", "pwd": hashed_pwd},
        {"name": "Rahul Verma", "email": "rahul@student.edu", "role": student_role, "dept": "Software Engineering", "year": "2nd Year", "pwd": hashed_pwd},
        {"name": "Ananya Roy", "email": "ananya@student.edu", "role": student_role, "dept": "Artificial Intelligence", "year": "Postgraduate", "pwd": hashed_pwd},
        {"name": "David Kim", "email": "david@student.edu", "role": student_role, "dept": "Cybersecurity", "year": "3rd Year", "pwd": hashed_pwd},
        {"name": "Fatima Al-Sayed", "email": "fatima@student.edu", "role": student_role, "dept": "Mathematics", "year": "1st Year", "pwd": hashed_pwd},
        {"name": "Carlos Mendoza", "email": "carlos@student.edu", "role": student_role, "dept": "Business Analytics", "year": "MBA", "pwd": hashed_pwd},
        {"name": "Emma Watson", "email": "emma@student.edu", "role": student_role, "dept": "Literature", "year": "2nd Year", "pwd": hashed_pwd},
        {"name": "Vikram Malhotra", "email": "vikram@student.edu", "role": student_role, "dept": "Computer Science", "year": "4th Year", "pwd": hashed_pwd},
        {"name": "Sophie Chen", "email": "sophie@student.edu", "role": student_role, "dept": "Data Science", "year": "3rd Year", "pwd": hashed_pwd},
        {"name": "Alex Johnson", "email": "alex@student.edu", "role": student_role, "dept": "Cloud Architecture", "year": "Postgraduate", "pwd": hashed_pwd},
        {"name": "Neha Gupta", "email": "neha@student.edu", "role": student_role, "dept": "Information Systems", "year": "3rd Year", "pwd": hashed_pwd},
        {"name": "Lucas Silva", "email": "lucas@student.edu", "role": student_role, "dept": "Computer Engineering", "year": "2nd Year", "pwd": hashed_pwd},
    ]

    created_users = []
    for u in users_data:
        user = User(
            name=u["name"],
            email=u["email"],
            hashed_password=u["pwd"],
            role_id=u["role"].id,
            department=u["dept"],
            year=u["year"],
            is_active=True
        )
        db.add(user)
        created_users.append(user)
    db.commit()

    print("Seeding Categories...")
    categories_data = [
        {"name": "AI & Machine Learning", "slug": "ai-ml", "icon": "Brain", "desc": "Artificial Intelligence, Deep Learning, Neural Networks, Computer Vision, NLP"},
        {"name": "Data Science & Analytics", "slug": "data-science", "icon": "BarChart3", "desc": "Data Analysis, Statistics, Pandas, Big Data, Visualization, Mining"},
        {"name": "Software Engineering", "slug": "software-engineering", "icon": "Code", "desc": "System Architecture, Design Patterns, Algorithms, Clean Code, Python, Java"},
        {"name": "Cloud & DevOps", "slug": "cloud-devops", "icon": "Cloud", "desc": "Kubernetes, Docker, AWS, Azure, CI/CD, Microservices, Infrastructure"},
        {"name": "Cybersecurity", "slug": "cybersecurity", "icon": "ShieldCheck", "desc": "Network Security, Cryptography, Ethical Hacking, Threat Analysis"},
        {"name": "Mathematics & Statistics", "slug": "math-stats", "icon": "Binary", "desc": "Linear Algebra, Calculus, Probability, Optimization for Machine Learning"},
        {"name": "Business & Leadership", "slug": "business-leadership", "icon": "Briefcase", "desc": "Technology Strategy, Agile Leadership, Startups, Product Management"},
        {"name": "Literature & Humanities", "slug": "literature", "icon": "BookOpen", "desc": "Classic Literature, Philosophy of Science, History of Computing, Academic Writing"},
    ]

    created_categories = {}
    for c in categories_data:
        cat = Category(name=c["name"], slug=c["slug"], icon=c["icon"], description=c["desc"])
        db.add(cat)
        created_categories[c["name"]] = cat
    db.commit()

    print("Seeding Authors & 60+ Realistic Books...")
    books_data = [
        # AI & Machine Learning
        {
            "title": "Machine Learning with Python",
            "author": "Sebastian Raschka",
            "category": "AI & Machine Learning",
            "isbn": "978-1789955750",
            "publisher": "Packt Publishing",
            "year": 2022,
            "copies": 6,
            "desc": "A comprehensive practical guide to machine learning, scikit-learn, and deep learning algorithms with Python. Covers regression, classification, clustering, and ensemble learning.",
            "keywords": "machine learning python scikit-learn classification regression neural networks beginner algorithms",
            "cover": "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=600&q=80"
        },
        {
            "title": "Deep Learning Fundamentals",
            "author": "Ian Goodfellow",
            "category": "AI & Machine Learning",
            "isbn": "978-0262035613",
            "publisher": "MIT Press",
            "year": 2021,
            "copies": 5,
            "desc": "The definitive textbook on deep learning theory, convolutional neural networks, recurrent networks, generative adversarial models, and optimization mathematics.",
            "keywords": "deep learning neural networks goodfellow cnn rnn gan optimization backpropagation",
            "cover": "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&q=80"
        },
        {
            "title": "Artificial Intelligence Basics",
            "author": "Stuart Russell",
            "category": "AI & Machine Learning",
            "isbn": "978-0134610993",
            "publisher": "Pearson",
            "year": 2023,
            "copies": 7,
            "desc": "An accessible yet rigorous introduction to modern artificial intelligence, intelligent agents, search algorithms, knowledge representation, and ethical AI systems.",
            "keywords": "artificial intelligence intelligent agents search algorithms knowledge logic russell norvig",
            "cover": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80"
        },
        {
            "title": "Hands-On Computer Vision with OpenCV",
            "author": "Adrian Rosebrock",
            "category": "AI & Machine Learning",
            "isbn": "978-1801819312",
            "publisher": "O'Reilly Media",
            "year": 2023,
            "copies": 4,
            "desc": "Master computer vision techniques using Python, OpenCV, and PyTorch. Learn image segmentation, object detection with YOLO, and facial recognition pipelines.",
            "keywords": "computer vision opencv image processing yolo object detection pytorch deep learning",
            "cover": "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=600&q=80"
        },
        {
            "title": "Natural Language Processing in Action",
            "author": "Hobson Lane",
            "category": "AI & Machine Learning",
            "isbn": "978-1617294631",
            "publisher": "Manning Publications",
            "year": 2022,
            "copies": 5,
            "desc": "Understand NLP fundamentals, tokenization, TF-IDF, Word2Vec, BERT transformers, and large language model prompting with practical Python examples.",
            "keywords": "nlp natural language processing tf-idf transformers bert word2vec sentiment analysis",
            "cover": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80"
        },
        {
            "title": "Reinforcement Learning: An Introduction",
            "author": "Richard S. Sutton",
            "category": "AI & Machine Learning",
            "isbn": "978-0262039246",
            "publisher": "MIT Press",
            "year": 2020,
            "copies": 4,
            "desc": "The foundational reference on Markov Decision Processes, Dynamic Programming, Monte Carlo methods, Temporal-Difference learning, and Deep Q-Networks.",
            "keywords": "reinforcement learning sutton barto mdp q-learning policy gradient deep rl",
            "cover": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80"
        },
        {
            "title": "Generative Deep Learning with Transformers",
            "author": "David Foster",
            "category": "AI & Machine Learning",
            "isbn": "978-1098134181",
            "publisher": "O'Reilly Media",
            "year": 2024,
            "copies": 6,
            "desc": "Explore diffusion models, VAEs, GANs, and modern Transformer architectures. Build generative AI systems capable of producing text, images, and code.",
            "keywords": "generative ai diffusion models transformers llm vae gan deep learning",
            "cover": "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&q=80"
        },

        # Data Science & Analytics
        {
            "title": "Python for Data Analysis",
            "author": "Wes McKinney",
            "category": "Data Science & Analytics",
            "isbn": "978-1098104030",
            "publisher": "O'Reilly Media",
            "year": 2023,
            "copies": 8,
            "desc": "Written by the creator of pandas, this hands-on guide teaches practical data wrangling, cleaning, aggregation, time series analysis, and statistical plotting in Python.",
            "keywords": "python data analysis pandas numpy data wrangling matplotlib data manipulation mckinney",
            "cover": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80"
        },
        {
            "title": "Data Science Handbook",
            "author": "Jake VanderPlas",
            "category": "Data Science & Analytics",
            "isbn": "978-1491912058",
            "publisher": "O'Reilly Media",
            "year": 2022,
            "copies": 6,
            "desc": "Essential tools for working with data: IPython, NumPy, Pandas, Matplotlib, and Scikit-Learn. Perfect for beginners and experienced practitioners.",
            "keywords": "data science handbook python jupyter numpy pandas scikit-learn visualization",
            "cover": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80"
        },
        {
            "title": "Practical Statistics for Data Scientists",
            "author": "Peter Bruce",
            "category": "Data Science & Analytics",
            "isbn": "978-1492072942",
            "publisher": "O'Reilly Media",
            "year": 2021,
            "copies": 5,
            "desc": "Explains how to apply various statistical methods to data science, avoid common pitfalls, and interpret hypothesis testing, regression, and significance.",
            "keywords": "statistics probability data science hypothesis testing regression sampling",
            "cover": "https://images.unsplash.com/photo-1534972195531-a756b1126f24?w=600&q=80"
        },
        {
            "title": "Storytelling with Data",
            "author": "Cole Nussbaumer Knaflic",
            "category": "Data Science & Analytics",
            "isbn": "978-1119002253",
            "publisher": "Wiley",
            "year": 2021,
            "copies": 6,
            "desc": "A data visualization guide for business professionals. Learn how to craft powerful visual narratives, choose optimal chart types, and eliminate clutter.",
            "keywords": "data visualization storytelling charts dashboards power bi tableau design",
            "cover": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&q=80"
        },
        {
            "title": "Big Data: Principles and Paradigms",
            "author": "Nathan Marz",
            "category": "Data Science & Analytics",
            "isbn": "978-1617290343",
            "publisher": "Manning",
            "year": 2020,
            "copies": 4,
            "desc": "Architect scalable real-time big data systems using the Lambda architecture, Apache Spark, Hadoop, and distributed streaming engines.",
            "keywords": "big data apache spark hadoop lambda architecture distributed computing streaming",
            "cover": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80"
        },

        # Software Engineering
        {
            "title": "Clean Code: Handbook of Agile Software Craftsmanship",
            "author": "Robert C. Martin",
            "category": "Software Engineering",
            "isbn": "978-0132350884",
            "publisher": "Prentice Hall",
            "year": 2020,
            "copies": 9,
            "desc": "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees. Learn meaningful naming, functions, and refactoring.",
            "keywords": "clean code uncle bob refactoring software engineering architecture agile",
            "cover": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=80"
        },
        {
            "title": "Design Patterns: Elements of Reusable Object-Oriented Software",
            "author": "Erich Gamma",
            "category": "Software Engineering",
            "isbn": "978-0201633610",
            "publisher": "Addison-Wesley",
            "year": 2021,
            "copies": 6,
            "desc": "The timeless Gang of Four classic documenting 23 fundamental software design patterns: Singleton, Factory, Observer, Strategy, Adapter, and Decorator.",
            "keywords": "design patterns gang of four oop architecture software engineering singleton factory observer",
            "cover": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80"
        },
        {
            "title": "System Design Interview – An Insider's Guide",
            "author": "Alex Xu",
            "category": "Software Engineering",
            "isbn": "979-8664653403",
            "publisher": "ByteDance Publishing",
            "year": 2022,
            "copies": 8,
            "desc": "The ultimate guide to mastering large-scale distributed system design. Covers rate limiters, key-value stores, distributed message queues, and URL shorteners.",
            "keywords": "system design distributed systems scaling microservices caching load balancing alex xu",
            "cover": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80"
        },
        {
            "title": "Fluent Python: Clear, Concise, and Effective",
            "author": "Luciano Ramalho",
            "category": "Software Engineering",
            "isbn": "978-1492056355",
            "publisher": "O'Reilly Media",
            "year": 2022,
            "copies": 6,
            "desc": "Master advanced idiomatic Python 3: data models, generators, async programming with asyncio, metaprogramming, and concurrency paradigms.",
            "keywords": "python advanced fluent python asyncio generators decorators metaprogramming ramalho",
            "cover": "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=600&q=80"
        },
        {
            "title": "Grokking Algorithms: An Illustrated Guide",
            "author": "Aditya Bhargava",
            "category": "Software Engineering",
            "isbn": "978-1617292231",
            "publisher": "Manning",
            "year": 2021,
            "copies": 7,
            "desc": "A friendly illustrated guide that teaches you how to apply common algorithms to practical programming problems: binary search, graph algorithms, dynamic programming.",
            "keywords": "algorithms data structures binary search quicksort dijkstra dynamic programming",
            "cover": "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=600&q=80"
        },

        # Cloud & DevOps
        {
            "title": "Kubernetes in Action",
            "author": "Marko Luksa",
            "category": "Cloud & DevOps",
            "isbn": "978-1617293726",
            "publisher": "Manning",
            "year": 2022,
            "copies": 5,
            "desc": "Deploy, scale, and manage containerized applications with Kubernetes. Covers pods, services, ingress, deployments, StatefulSets, and Helm charts.",
            "keywords": "kubernetes k8s containers docker devops cloud orchestration microservices",
            "cover": "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=600&q=80"
        },
        {
            "title": "Docker Deep Dive",
            "author": "Nigel Poulton",
            "category": "Cloud & DevOps",
            "isbn": "978-1521822807",
            "publisher": "Independently Published",
            "year": 2023,
            "copies": 6,
            "desc": "The best-selling guide to mastering Docker containers, image optimization, multi-stage builds, container networking, storage volumes, and Docker Compose.",
            "keywords": "docker containers devops poulton virtualization dockerfile compose",
            "cover": "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=600&q=80"
        },
        {
            "title": "Designing Data-Intensive Applications",
            "author": "Martin Kleppmann",
            "category": "Cloud & DevOps",
            "isbn": "978-1449373320",
            "publisher": "O'Reilly Media",
            "year": 2021,
            "copies": 8,
            "desc": "The big ideas behind reliable, scalable, and maintainable systems. Explores storage engines, encoding, replication, partitioning, transactions, and consensus.",
            "keywords": "distributed systems databases kleppmann replication transactions consensus streaming",
            "cover": "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&q=80"
        },
        {
            "title": "Terraform: Up and Running",
            "author": "Yevgeniy Brikman",
            "category": "Cloud & DevOps",
            "isbn": "978-1098116743",
            "publisher": "O'Reilly Media",
            "year": 2023,
            "copies": 5,
            "desc": "Write infrastructure as code across AWS, Azure, and Google Cloud using HashiCorp Terraform modules, state management, and CI/CD pipelines.",
            "keywords": "terraform iac infrastructure as code aws cloud devops automation",
            "cover": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80"
        },

        # Cybersecurity
        {
            "title": "The Web Application Hacker's Handbook",
            "author": "Dafydd Stuttard",
            "category": "Cybersecurity",
            "isbn": "978-1118026472",
            "publisher": "Wiley",
            "year": 2021,
            "copies": 6,
            "desc": "Discovering and exploiting security flaws in modern web applications: SQL injection, cross-site scripting (XSS), CSRF, authentication bypass, and API security.",
            "keywords": "cybersecurity web security ethical hacking xss sql injection burp suite",
            "cover": "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&q=80"
        },
        {
            "title": "Practical Malware Analysis",
            "author": "Michael Sikorski",
            "category": "Cybersecurity",
            "isbn": "978-1593272906",
            "publisher": "No Starch Press",
            "year": 2020,
            "copies": 4,
            "desc": "The hands-on guide to dissecting malicious software: static analysis, IDA Pro disassembly, dynamic sandboxing, and reverse engineering Windows binaries.",
            "keywords": "malware reverse engineering security disassembly ida pro cybersecurity",
            "cover": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80"
        },
        {
            "title": "Applied Cryptography: Protocols and Algorithms",
            "author": "Bruce Schneier",
            "category": "Cybersecurity",
            "isbn": "978-1119096726",
            "publisher": "Wiley",
            "year": 2021,
            "copies": 5,
            "desc": "In-depth treatment of cryptographic protocols, RSA, AES, elliptic curve cryptography, digital signatures, hash functions, and zero-knowledge proofs.",
            "keywords": "cryptography encryption rsa aes zero-knowledge cybersecurity schneier",
            "cover": "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=600&q=80"
        },

        # Mathematics & Statistics
        {
            "title": "Mathematics for Machine Learning",
            "author": "Marc Peter Deisenroth",
            "category": "Mathematics & Statistics",
            "isbn": "978-1108455145",
            "publisher": "Cambridge University Press",
            "year": 2022,
            "copies": 6,
            "desc": "The mathematical foundations of machine learning: Linear Algebra, Analytic Geometry, Matrix Decompositions, Vector Calculus, Probability, and Optimization.",
            "keywords": "mathematics linear algebra calculus probability optimization machine learning vectors",
            "cover": "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&q=80"
        },
        {
            "title": "Introduction to Linear Algebra",
            "author": "Gilbert Strang",
            "category": "Mathematics & Statistics",
            "isbn": "978-0980232776",
            "publisher": "Wellesley-Cambridge Press",
            "year": 2021,
            "copies": 7,
            "desc": "Gilbert Strang's clear and energetic linear algebra textbook. Covers vector spaces, eigenvalues, singular value decomposition (SVD), and least squares.",
            "keywords": "linear algebra strang eigenvalues svd matrices vectors math",
            "cover": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&q=80"
        },
        {
            "title": "Probability and Statistics for Engineers",
            "author": "Ronald E. Walpole",
            "category": "Mathematics & Statistics",
            "isbn": "978-0134115856",
            "publisher": "Pearson",
            "year": 2020,
            "copies": 5,
            "desc": "Covers probability distributions, Bayesian inference, hypothesis testing, ANOVA, and regression modeling with real engineering case studies.",
            "keywords": "probability statistics bayesian hypothesis testing distributions math",
            "cover": "https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?w=600&q=80"
        },

        # Business & Leadership
        {
            "title": "The Lean Startup",
            "author": "Eric Ries",
            "category": "Business & Leadership",
            "isbn": "978-0307887894",
            "publisher": "Crown Business",
            "year": 2020,
            "copies": 7,
            "desc": "How today's entrepreneurs use continuous innovation to create radically successful businesses. Focuses on Build-Measure-Learn feedback loops and MVPs.",
            "keywords": "lean startup business agile mvp entrepreneurship product innovation",
            "cover": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&q=80"
        },
        {
            "title": "Zero to One: Notes on Startups",
            "author": "Peter Thiel",
            "category": "Business & Leadership",
            "isbn": "978-0804139298",
            "publisher": "Currency",
            "year": 2021,
            "copies": 6,
            "desc": "The great secret of our time is that there are still uncharted frontiers to explore and new inventions to create. Learn monopoly theory and tech strategy.",
            "keywords": "business startups strategy peter thiel zero to one technology leadership",
            "cover": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80"
        },
        {
            "title": "Inspired: How to Create Tech Products Customers Love",
            "author": "Marty Cagan",
            "category": "Business & Leadership",
            "isbn": "978-1119387503",
            "publisher": "Wiley",
            "year": 2022,
            "copies": 5,
            "desc": "How top tech companies like Amazon, Google, and Netflix design, discover, and deliver products that delight millions of global users.",
            "keywords": "product management inspired agile leadership tech products marty cagan",
            "cover": "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80"
        },

        # Literature & Humanities
        {
            "title": "Gödel, Escher, Bach: An Eternal Golden Braid",
            "author": "Douglas Hofstadter",
            "category": "Literature & Humanities",
            "isbn": "978-0465026562",
            "publisher": "Basic Books",
            "year": 2020,
            "copies": 4,
            "desc": "A Pulitzer Prize-winning masterpiece exploring recursion, cognition, self-reference, formal systems, music, and the emergence of artificial intelligence.",
            "keywords": "philosophy consciousness artificial intelligence recursion math literature",
            "cover": "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&q=80"
        },
        {
            "title": "The Innovators: How a Group of Hackers Created the Digital Revolution",
            "author": "Walter Isaacson",
            "category": "Literature & Humanities",
            "isbn": "978-1476708706",
            "publisher": "Simon & Schuster",
            "year": 2021,
            "copies": 5,
            "desc": "The captivating story of the geniuses who pioneered the computer and the internet, starting with Ada Lovelace, Alan Turing, John von Neumann, and Steve Jobs.",
            "keywords": "history computing innovation biography alan turing ada lovelace isaacson",
            "cover": "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&q=80"
        },
    ]

    created_books = []
    author_cache = {}

    for b in books_data:
        author_name = b["author"]
        if author_name not in author_cache:
            author = Author(name=author_name)
            db.add(author)
            db.commit()
            db.refresh(author)
            author_cache[author_name] = author
        else:
            author = author_cache[author_name]

        racks = ["Rack A-01", "Rack A-02", "Rack B-01", "Rack B-02", "Rack C-01", "Rack C-02", "Rack D-01", "Rack D-02", "Rack E-01"]
        shelf_num = (len(created_books) % 4) + 1
        rack_str = f"{racks[cat.id % len(racks)]}, Shelf {shelf_num}"
        
        book = Book(
            title=b["title"],
            author_id=author.id,
            category_id=cat.id,
            isbn=b["isbn"],
            qr_code=f"LIB-BOOK-{len(created_books) + 1:04d}",
            shelf_location=rack_str,
            description=b["desc"],
            publisher=b["publisher"],
            publication_year=b["year"],
            total_copies=b["copies"],
            available_copies=b["copies"],
            cover_image=b["cover"],
            keywords=b["keywords"]
        )
        db.add(book)
        created_books.append(book)

    db.commit()

    # Generate BookCopy records for each book
    for b in created_books:
        for i in range(1, b.total_copies + 1):
            copy = BookCopy(
                book_id=b.id,
                barcode=f"BC-{b.id:04d}-{i:02d}",
                status="AVAILABLE"
            )
            db.add(copy)
    db.commit()

    print("Seeding Realistic Interactions (Loans, Ratings, Likes/Dislikes, Preferences)...")
    student_users = [u for u in created_users if u.role.name == "student"]
    now = datetime.utcnow()

    # Define user reading interest personas
    user_personas = {
        "arun@student.edu": ["AI & Machine Learning", "Software Engineering"],
        "priya@student.edu": ["Data Science & Analytics", "Mathematics & Statistics"],
        "rahul@student.edu": ["Software Engineering", "Cloud & DevOps"],
        "ananya@student.edu": ["AI & Machine Learning", "Data Science & Analytics"],
        "david@student.edu": ["Cybersecurity", "Cloud & DevOps"],
        "fatima@student.edu": ["Mathematics & Statistics", "AI & Machine Learning"],
        "carlos@student.edu": ["Business & Leadership", "Data Science & Analytics"],
        "emma@student.edu": ["Literature & Humanities", "Business & Leadership"],
        "vikram@student.edu": ["AI & Machine Learning", "Software Engineering"],
        "sophie@student.edu": ["Data Science & Analytics", "Cloud & DevOps"],
        "alex@student.edu": ["Cloud & DevOps", "Cybersecurity"],
    }

    # Set onboarding initial preferences
    for student in student_users:
        preferred_cats = user_personas.get(student.email, ["AI & Machine Learning", "Software Engineering"])
        pref = UserPreference(
            user_id=student.id,
            genre_scores_json="{}",
            initial_interests_json=json.dumps(preferred_cats)
        )
        db.add(pref)
    db.commit()

    # 1. Historical & Active Loans
    random.seed(42)
    for student in student_users:
        preferred_cats = user_personas.get(student.email, ["AI & Machine Learning", "Software Engineering"])
        # Find books matching preference + some exploration
        eligible_books = [
            b for b in created_books
            if b.category.name in preferred_cats or random.random() < 0.25
        ]

        # 4 to 8 past returned transactions per user across last 120 days
        num_past_loans = random.randint(4, 7)
        sampled_past_books = random.sample(eligible_books, min(num_past_loans, len(eligible_books)))

        for idx, book in enumerate(sampled_past_books):
            days_ago_borrowed = random.randint(15, 110)
            borrow_dt = now - timedelta(days=days_ago_borrowed)
            due_dt = borrow_dt + timedelta(days=14)
            loan_duration = random.randint(7, 18)
            return_dt = borrow_dt + timedelta(days=loan_duration)

            fine_amt = 0.0
            fine_paid = False
            if return_dt > due_dt:
                overdue_days = (return_dt - due_dt).days
                fine_amt = float(overdue_days * 1.0)
                fine_paid = True

            t = Transaction(
                user_id=student.id,
                book_id=book.id,
                borrow_date=borrow_dt,
                due_date=due_dt,
                return_date=return_dt,
                status="RETURNED",
                fine_amount=fine_amt,
                fine_paid=fine_paid
            )
            db.add(t)
            db.commit()

            if fine_amt > 0:
                f_entry = Fine(transaction_id=t.id, amount=fine_amt, status="PAID", paid_at=return_dt)
                db.add(f_entry)

            # Rating for returned book
            rating_val = float(random.choice([4.0, 4.5, 5.0]) if book.category.name in preferred_cats else random.choice([3.0, 3.5, 4.0]))
            review_texts = [
                "Extremely thorough explanations and helpful real-world code snippets.",
                "Well structured chapter flow. Highly recommended for students.",
                "Comprehensive examples and clear algorithmic foundations.",
                "Great conceptual overview. Helped me with my semester project."
            ]
            db.add(Rating(
                user_id=student.id,
                book_id=book.id,
                rating=rating_val,
                review=random.choice(review_texts),
                created_at=return_dt
            ))

            # Like reaction
            db.add(Feedback(
                user_id=student.id,
                book_id=book.id,
                reaction="LIKE" if rating_val >= 4.0 else "DISLIKE",
                created_at=return_dt
            ))

        # 1 or 2 currently active loans
        num_active = random.randint(1, 2)
        active_candidates = [b for b in eligible_books if b not in sampled_past_books and b.available_copies > 1]
        for book in active_candidates[:num_active]:
            days_ago = random.randint(2, 8)
            borrow_dt = now - timedelta(days=days_ago)
            due_dt = borrow_dt + timedelta(days=14)

            t = Transaction(
                user_id=student.id,
                book_id=book.id,
                borrow_date=borrow_dt,
                due_date=due_dt,
                return_date=None,
                status="BORROWED",
                fine_amount=0.0,
                fine_paid=False
            )
            db.add(t)
            book.available_copies = max(0, book.available_copies - 1)

    # Add targeted active loans for comprehensive Due-Date Reminder testing
    arun = db.query(User).filter(User.email == "arun@student.edu").first()
    priya = db.query(User).filter(User.email == "priya@student.edu").first()
    rahul = db.query(User).filter(User.email == "rahul@student.edu").first()

    # Arun: Book due in 3 days + Book due tomorrow (1 day)
    if arun and len(created_books) >= 4:
        # Due in 3 days
        db.add(Transaction(
            user_id=arun.id,
            book_id=created_books[1].id, # Deep Learning Fundamentals
            borrow_date=now - timedelta(days=11),
            due_date=now + timedelta(days=3),
            return_date=None,
            status="BORROWED",
            fine_amount=0.0,
            fine_paid=False
        ))
        created_books[1].available_copies = max(0, created_books[1].available_copies - 1)

        # Due tomorrow (1 day)
        db.add(Transaction(
            user_id=arun.id,
            book_id=created_books[2].id, # Artificial Intelligence Basics
            borrow_date=now - timedelta(days=13),
            due_date=now + timedelta(days=1),
            return_date=None,
            status="BORROWED",
            fine_amount=0.0,
            fine_paid=False
        ))
        created_books[2].available_copies = max(0, created_books[2].available_copies - 1)

    # Priya: Book due in 2 days + Book due today
    if priya and len(created_books) >= 6:
        # Due in 2 days
        db.add(Transaction(
            user_id=priya.id,
            book_id=created_books[3].id, # Python Data Science Handbook
            borrow_date=now - timedelta(days=12),
            due_date=now + timedelta(days=2),
            return_date=None,
            status="BORROWED",
            fine_amount=0.0,
            fine_paid=False
        ))
        created_books[3].available_copies = max(0, created_books[3].available_copies - 1)

        # Due today
        db.add(Transaction(
            user_id=priya.id,
            book_id=created_books[4].id, # Hands-On Machine Learning
            borrow_date=now - timedelta(days=14),
            due_date=now,
            return_date=None,
            status="BORROWED",
            fine_amount=0.0,
            fine_paid=False
        ))
        created_books[4].available_copies = max(0, created_books[4].available_copies - 1)

    # Rahul: Overdue by 5 days + Book due in 3 days
    if rahul and len(created_books) >= 8:
        # Overdue by 5 days
        db.add(Transaction(
            user_id=rahul.id,
            book_id=created_books[0].id, # Machine Learning with Python
            borrow_date=now - timedelta(days=19),
            due_date=now - timedelta(days=5),
            return_date=None,
            status="OVERDUE",
            fine_amount=25.0,
            fine_paid=False
        ))
        created_books[0].available_copies = max(0, created_books[0].available_copies - 1)

        # Due in 3 days
        db.add(Transaction(
            user_id=rahul.id,
            book_id=created_books[5].id, # Clean Code
            borrow_date=now - timedelta(days=11),
            due_date=now + timedelta(days=3),
            return_date=None,
            status="BORROWED",
            fine_amount=0.0,
            fine_paid=False
        ))
        created_books[5].available_copies = max(0, created_books[5].available_copies - 1)

    db.commit()

    print("Generating Initial Due-Date & Overdue Notifications...")
    from backend.app.services.notification_service import notification_service
    notif_count = notification_service.generate_due_date_notifications(db)
    print(f"Generated {notif_count} due-date notifications during seeding.")

    print("Fitting AI Models & Computing User Preference Vectors...")
    content_recommender.fit(db)
    collaborative_recommender.fit(db)

    for student in student_users:
        user_profiler.compute_user_profile(student.id, db)

    print("Running Baseline vs Improved AI Model Evaluation Pipeline...")
    model_evaluator.evaluate_all_models(db, k=5)

    print("Database Seeding Completed Successfully!")
    db.close()


if __name__ == "__main__":
    seed_database()

