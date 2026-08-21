"""
Script to safely add 200 realistic sample books across 22 distinct domains
to the existing AI Library Management System database.
Preserves existing records, validates ISBN-13 checksums, assigns unique QR codes,
physical shelf locations, and creates individual BookCopy inventory records.
"""

import sys
import os
import json
from datetime import datetime

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.database import SessionLocal, engine
from backend.app.models.entities import Category, Author, Book, BookCopy

# 22 Required Categories with Slugs and Icons
CATEGORIES_DEF = [
    {"name": "Computer Science", "slug": "computer-science", "icon": "Cpu", "desc": "Foundational computer science principles, discrete structures, and computing theory."},
    {"name": "Artificial Intelligence", "slug": "artificial-intelligence", "icon": "Brain", "desc": "Core AI concepts, expert systems, neural architectures, and intelligent agents."},
    {"name": "Machine Learning", "slug": "machine-learning", "icon": "Sparkles", "desc": "Statistical learning, deep learning, NLP, computer vision, and predictive modeling."},
    {"name": "Data Science", "slug": "data-science", "icon": "BarChart3", "desc": "Data analytics, statistical computing, visualization, and big data engineering."},
    {"name": "Python", "slug": "python", "icon": "Code", "desc": "Python language mastery, design patterns, automation, and full-stack frameworks."},
    {"name": "Java", "slug": "java", "icon": "Coffee", "desc": "Core Java, JVM internals, Spring Boot, enterprise architectures, and concurrency."},
    {"name": "C/C++", "slug": "c-cpp", "icon": "Terminal", "desc": "Systems programming, memory management, Modern C++20, and performance optimization."},
    {"name": "Web Development", "slug": "web-development", "icon": "Globe", "desc": "Frontend, backend, React, Next.js, Node.js, RESTful APIs, and modern UI engineering."},
    {"name": "Database Management", "slug": "database-management", "icon": "Database", "desc": "Relational SQL, NoSQL systems, distributed databases, indexing, and query optimization."},
    {"name": "Cloud Computing", "slug": "cloud-computing", "icon": "Cloud", "desc": "AWS, Azure, Google Cloud, microservices, Kubernetes, and serverless architectures."},
    {"name": "Cybersecurity", "slug": "cybersecurity", "icon": "ShieldCheck", "desc": "Network security, ethical hacking, cryptography, penetration testing, and defense."},
    {"name": "Networking", "slug": "networking", "icon": "Wifi", "desc": "TCP/IP protocols, routing and switching, network architecture, and telemetry."},
    {"name": "Software Engineering", "slug": "software-engineering", "icon": "Layers", "desc": "Design patterns, Agile methodologies, system architecture, CI/CD, and clean code."},
    {"name": "Operating Systems", "slug": "operating-systems", "icon": "Server", "desc": "OS kernel concepts, process scheduling, concurrency, virtual memory, and Linux internals."},
    {"name": "Algorithms and Data Structures", "slug": "algorithms-data-structures", "icon": "Binary", "desc": "Algorithmic complexity, trees, graphs, dynamic programming, and computational geometry."},
    {"name": "Mathematics", "slug": "mathematics", "icon": "Sigma", "desc": "Linear algebra, calculus, discrete math, probability theory, and optimization."},
    {"name": "Business", "slug": "business", "icon": "Briefcase", "desc": "Corporate strategy, entrepreneurship, venture capital, and market innovation."},
    {"name": "Management", "slug": "management", "icon": "Users", "desc": "Leadership, project management, organizational psychology, and engineering management."},
    {"name": "Economics", "slug": "economics", "icon": "TrendingUp", "desc": "Macroeconomics, microeconomics, behavioral economics, and financial markets."},
    {"name": "General Knowledge", "slug": "general-knowledge", "icon": "Compass", "desc": "Science history, technological revolutions, space exploration, and world knowledge."},
    {"name": "Fiction", "slug": "fiction", "icon": "BookOpen", "desc": "Science fiction, speculative fiction, literary masterpieces, and classic novels."},
    {"name": "Self-Development", "slug": "self-development", "icon": "Target", "desc": "Habit formation, productivity, emotional intelligence, and cognitive mastery."},
]

def calc_isbn13(prefix12: str) -> str:
    """Compute mathematical modulo-10 checksum for a 12-digit prefix."""
    digits = [int(d) for d in prefix12 if d.isdigit()]
    if len(digits) != 12:
        raise ValueError(f"Expected 12 digits, got {len(digits)}: {prefix12}")
    total = sum(d * (1 if i % 2 == 0 else 3) for i, d in enumerate(digits))
    check = (10 - (total % 10)) % 10
    d_str = "".join(str(d) for d in digits)
    return f"{d_str[:3]}-{d_str[3:6]}-{d_str[6:11]}-{check}"

# 200 Curated Realistic Books Dataset
# Exactly 200 unique real-world titles across 22 categories
RAW_BOOKS = [
    # 1. Computer Science (9 books)
    {
        "title": "Computer Systems: A Programmer's Perspective",
        "author": "Randal E. Bryant",
        "category": "Computer Science",
        "p12": "978013409266",
        "pub": "Pearson",
        "year": 2016,
        "copies": 6,
        "rack": "Rack CS-01, Shelf 1",
        "desc": "An essential guide to how machine-level code executes, memory hierarchies, processor architectures, and linking.",
        "keywords": "computer systems architecture assembly memory cache linking",
        "cover": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80"
    },
    {
        "title": "Structure and Interpretation of Computer Programs",
        "author": "Harold Abelson",
        "category": "Computer Science",
        "p12": "978026251087",
        "pub": "MIT Press",
        "year": 1996,
        "copies": 5,
        "rack": "Rack CS-01, Shelf 2",
        "desc": "The iconic MIT textbook on computer programming, functional abstraction, metalinguistic abstraction, and interpreters.",
        "keywords": "sicp lisp scheme functional programming abstraction interpreters",
        "cover": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=80"
    },
    {
        "title": "Introduction to the Theory of Computation",
        "author": "Michael Sipser",
        "category": "Computer Science",
        "p12": "978113318779",
        "pub": "Cengage Learning",
        "year": 2012,
        "copies": 4,
        "rack": "Rack CS-01, Shelf 3",
        "desc": "Comprehensive coverage of automata theory, computability theory, context-free grammars, and NP-completeness.",
        "keywords": "automata turing machines computability complexity np complete",
        "cover": "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&q=80"
    },
    {
        "title": "Code: The Hidden Language of Computer Hardware and Software",
        "author": "Charles Petzold",
        "category": "Computer Science",
        "p12": "978073561131",
        "pub": "Microsoft Press",
        "year": 2000,
        "copies": 7,
        "rack": "Rack CS-01, Shelf 4",
        "desc": "An engaging journey into how electronic circuits, relays, logic gates, and microprocessors build computing systems.",
        "keywords": "hardware logic gates binary electricity microprocessors petzold",
        "cover": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80"
    },
    {
        "title": "Elements of Computing Systems: Building a Modern Computer from First Principles",
        "author": "Noam Nisan",
        "category": "Computer Science",
        "p12": "978026264068",
        "pub": "MIT Press",
        "year": 2005,
        "copies": 5,
        "rack": "Rack CS-02, Shelf 1",
        "desc": "The famous Nand2Tetris project constructing a hardware platform, assembler, compiler, virtual machine, and OS.",
        "keywords": "nand2tetris hardware compiler assembler virtual machine os",
        "cover": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&q=80"
    },
    {
        "title": "Gödel, Escher, Bach: An Eternal Golden Braid",
        "author": "Douglas Hofstadter",
        "category": "Computer Science",
        "p12": "978046502656",
        "pub": "Basic Books",
        "year": 1999,
        "copies": 4,
        "rack": "Rack CS-02, Shelf 2",
        "desc": "Pulitzer Prize-winning exploration of cognitive science, recursion, formal systems, and artificial intelligence.",
        "keywords": "godel escher bach recursion cognitive intelligence formal systems",
        "cover": "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&q=80"
    },
    {
        "title": "Types and Programming Languages",
        "author": "Benjamin C. Pierce",
        "category": "Computer Science",
        "p12": "978026216209",
        "pub": "MIT Press",
        "year": 2002,
        "copies": 4,
        "rack": "Rack CS-02, Shelf 3",
        "desc": "A foundational study of type systems, lambda calculus, operational semantics, subtyping, and polymorphism.",
        "keywords": "type theory lambda calculus polymorphism semantics compilers",
        "cover": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80"
    },
    {
        "title": "Quantum Computation and Quantum Information",
        "author": "Michael A. Nielsen",
        "category": "Computer Science",
        "p12": "978110700217",
        "pub": "Cambridge University Press",
        "year": 2010,
        "copies": 5,
        "rack": "Rack CS-02, Shelf 4",
        "desc": "The definitive textbook on quantum circuits, quantum algorithms, quantum error correction, and cryptography.",
        "keywords": "quantum computing qubits shor algorithm entanglement circuits",
        "cover": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&q=80"
    },
    {
        "title": "Compilers: Principles, Techniques, and Tools",
        "author": "Alfred V. Aho",
        "category": "Computer Science",
        "p12": "978032148681",
        "pub": "Addison-Wesley",
        "year": 2006,
        "copies": 6,
        "rack": "Rack CS-03, Shelf 1",
        "desc": "The legendary Dragon Book on lexical analysis, syntax parsing, semantic analysis, code generation, and optimization.",
        "keywords": "dragon book compilers lexing parsing optimization ast",
        "cover": "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=600&q=80"
    },

    # 2. Artificial Intelligence (9 books)
    {
        "title": "Artificial Intelligence: A Modern Approach",
        "author": "Stuart Russell",
        "category": "Artificial Intelligence",
        "p12": "978013461099",
        "pub": "Pearson",
        "year": 2020,
        "copies": 7,
        "rack": "Rack AI-01, Shelf 1",
        "desc": "The worldwide leading textbook in AI covering informed search, adversarial planning, probabilistic reasoning, and robotics.",
        "keywords": "ai agents heuristics game search probabilistic reasoning russell norvig",
        "cover": "https://images.unsplash.com/photo-1677442136019-21780efad99a?w=600&q=80"
    },
    {
        "title": "Superintelligence: Paths, Dangers, Strategies",
        "author": "Nick Bostrom",
        "category": "Artificial Intelligence",
        "p12": "978019967811",
        "pub": "Oxford University Press",
        "year": 2014,
        "copies": 5,
        "rack": "Rack AI-01, Shelf 2",
        "desc": "A rigorous philosophical investigation into artificial general intelligence, value alignment, and existential safety.",
        "keywords": "superintelligence agi alignment ai safety existential risk bostrom",
        "cover": "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&q=80"
    },
    {
        "title": "Life 3.0: Being Human in the Age of Artificial Intelligence",
        "author": "Max Tegmark",
        "category": "Artificial Intelligence",
        "p12": "978110194659",
        "pub": "Knopf",
        "year": 2017,
        "copies": 6,
        "rack": "Rack AI-01, Shelf 3",
        "desc": "An exploration of how future intelligent machines will reshape consciousness, society, labor, and cosmic civilization.",
        "keywords": "life 3.0 max tegmark intelligence consciousness future agi",
        "cover": "https://images.unsplash.com/photo-1534723328310-e82dad3ee43f?w=600&q=80"
    },
    {
        "title": "Human Compatible: Artificial Intelligence and the Problem of Control",
        "author": "Stuart Russell",
        "category": "Artificial Intelligence",
        "p12": "978052555861",
        "pub": "Viking",
        "year": 2019,
        "copies": 5,
        "rack": "Rack AI-01, Shelf 4",
        "desc": "Proposes a new foundation for artificial intelligence based on uncertainty about human preferences.",
        "keywords": "ai alignment value learning human compatible russell control",
        "cover": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80"
    },
    {
        "title": "Reinforcement Learning: An Introduction",
        "author": "Richard S. Sutton",
        "category": "Artificial Intelligence",
        "p12": "978026203924",
        "pub": "MIT Press",
        "year": 2018,
        "copies": 6,
        "rack": "Rack AI-02, Shelf 1",
        "desc": "The foundational treatise on Markov decision processes, Monte Carlo methods, temporal-difference learning, and policy gradients.",
        "keywords": "reinforcement learning mdp q-learning policy gradient sutton barto",
        "cover": "https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=600&q=80"
    },
    {
        "title": "Deep Reinforcement Learning Hands-On",
        "author": "Maxim Lapan",
        "category": "Artificial Intelligence",
        "p12": "978183882699",
        "pub": "Packt Publishing",
        "year": 2020,
        "copies": 5,
        "rack": "Rack AI-02, Shelf 2",
        "desc": "Practical implementations of DQN, A3C, PPO, TRPO, and DDPG algorithms using PyTorch and OpenAI Gym.",
        "keywords": "deep rl pytorch dqn ppo actor critic openai gym",
        "cover": "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=600&q=80"
    },
    {
        "title": "The Master Algorithm",
        "author": "Pedro Domingos",
        "category": "Artificial Intelligence",
        "p12": "978046506570",
        "pub": "Basic Books",
        "year": 2015,
        "copies": 5,
        "rack": "Rack AI-02, Shelf 3",
        "desc": "How the quest for the ultimate learning machine will remake our world, uniting symbolists, connectionists, and Bayesians.",
        "keywords": "master algorithm machine learning domingos connectionist bayesian",
        "cover": "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=600&q=80"
    },
    {
        "title": "Generative Deep Learning: Teaching Machines to Paint, Write, Compose, and Play",
        "author": "David Foster",
        "category": "Artificial Intelligence",
        "p12": "978109813418",
        "pub": "O'Reilly Media",
        "year": 2023,
        "copies": 6,
        "rack": "Rack AI-02, Shelf 4",
        "desc": "Comprehensive guide to VAEs, GANs, Diffusion Models, Transformers, and modern generative neural networks.",
        "keywords": "generative ai diffusion models gans vae transformers oreilly",
        "cover": "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=600&q=80"
    },
    {
        "title": "Knowledge Representation and Reasoning",
        "author": "Ronald Brachman",
        "category": "Artificial Intelligence",
        "p12": "978155860932",
        "pub": "Morgan Kaufmann",
        "year": 2004,
        "copies": 4,
        "rack": "Rack AI-03, Shelf 1",
        "desc": "Formal logics, ontologies, description logics, default reasoning, and semantic knowledge graphs.",
        "keywords": "knowledge representation ontologies description logic reasoning graphs",
        "cover": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80"
    },

    # 3. Machine Learning (9 books)
    {
        "title": "Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow",
        "author": "Aurélien Géron",
        "category": "Machine Learning",
        "p12": "978109812597",
        "pub": "O'Reilly Media",
        "year": 2022,
        "copies": 8,
        "rack": "Rack ML-01, Shelf 1",
        "desc": "Practical guide to end-to-end machine learning pipelines, deep neural networks, CNNs, RNNs, and attention mechanisms.",
        "keywords": "scikit-learn tensorflow keras deep learning geron cnn rnn",
        "cover": "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=600&q=80"
    },
    {
        "title": "Pattern Recognition and Machine Learning",
        "author": "Christopher M. Bishop",
        "category": "Machine Learning",
        "p12": "978038731073",
        "pub": "Springer",
        "year": 2006,
        "copies": 6,
        "rack": "Rack ML-01, Shelf 2",
        "desc": "The gold standard textbook on Bayesian inference, EM algorithms, graphical models, and kernel methods.",
        "keywords": "bayesian bishop pattern recognition kernels graphical models em",
        "cover": "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&q=80"
    },
    {
        "title": "Deep Learning",
        "author": "Ian Goodfellow",
        "category": "Machine Learning",
        "p12": "978026203561",
        "pub": "MIT Press",
        "year": 2016,
        "copies": 7,
        "rack": "Rack ML-01, Shelf 3",
        "desc": "The comprehensive MIT textbook on mathematical foundations, deep feedforward networks, optimization, and autoencoders.",
        "keywords": "deep learning goodfellow bengio courville backpropagation neural",
        "cover": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80"
    },
    {
        "title": "Machine Learning: A Probabilistic Perspective",
        "author": "Kevin P. Murphy",
        "category": "Machine Learning",
        "p12": "978026201802",
        "pub": "MIT Press",
        "year": 2012,
        "copies": 5,
        "rack": "Rack ML-01, Shelf 4",
        "desc": "A unified probabilistic approach to machine learning combining graphical models, Markov networks, and variational inference.",
        "keywords": "probabilistic machine learning murphy bayesian inference markov",
        "cover": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80"
    },
    {
        "title": "The Hundred-Page Machine Learning Book",
        "author": "Andriy Burkov",
        "category": "Machine Learning",
        "p12": "978199957950",
        "pub": "Andriy Burkov",
        "year": 2019,
        "copies": 7,
        "rack": "Rack ML-02, Shelf 1",
        "desc": "A concise, high-density reference covering fundamental supervised and unsupervised algorithms with clear math.",
        "keywords": "hundred page machine learning burkov concise algorithms reference",
        "cover": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80"
    },
    {
        "title": "Natural Language Processing with Transformers",
        "author": "Lewis Tunstall",
        "category": "Machine Learning",
        "p12": "978109810324",
        "pub": "O'Reilly Media",
        "year": 2022,
        "copies": 6,
        "rack": "Rack ML-02, Shelf 2",
        "desc": "Building state-of-the-art language models with Hugging Face Transformers, fine-tuning BERT, GPT, and T5.",
        "keywords": "nlp transformers hugging face bert gpt t5 llm oreilly",
        "cover": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80"
    },
    {
        "title": "Feature Engineering for Machine Learning",
        "author": "Alice Zheng",
        "category": "Machine Learning",
        "p12": "978149195324",
        "pub": "O'Reilly Media",
        "year": 2018,
        "copies": 5,
        "rack": "Rack ML-02, Shelf 3",
        "desc": "Principles and techniques for data transformation, dimensionality reduction, embeddings, and binning.",
        "keywords": "feature engineering pca embeddings data transformation ml",
        "cover": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80"
    },
    {
        "title": "Designing Machine Learning Systems",
        "author": "Chip Huyen",
        "category": "Machine Learning",
        "p12": "978109810796",
        "pub": "O'Reilly Media",
        "year": 2022,
        "copies": 6,
        "rack": "Rack ML-02, Shelf 4",
        "desc": "Iterative architectures for production machine learning: data pipelines, model monitoring, deployment, and testing.",
        "keywords": "mlops chip huyen machine learning production data pipelines",
        "cover": "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=600&q=80"
    },
    {
        "title": "Interpretable Machine Learning",
        "author": "Christoph Molnar",
        "category": "Machine Learning",
        "p12": "978024476852",
        "pub": "Lulu Press",
        "year": 2020,
        "copies": 5,
        "rack": "Rack ML-03, Shelf 1",
        "desc": "A guide for making black-box machine learning models explainable using SHAP, LIME, and partial dependence plots.",
        "keywords": "explainable ai xai shap lime interpretability molnar",
        "cover": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80"
    },

    # 4. Data Science (9 books)
    {
        "title": "Python for Data Analysis",
        "author": "Wes McKinney",
        "category": "Data Science",
        "p12": "978109810403",
        "pub": "O'Reilly Media",
        "year": 2022,
        "copies": 8,
        "rack": "Rack DS-01, Shelf 1",
        "desc": "The definitive guide by the creator of pandas for data wrangling, time series, NumPy arrays, and Jupyter.",
        "keywords": "pandas numpy data analysis wes mckinney data science python",
        "cover": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80"
    },
    {
        "title": "Data Science from Scratch",
        "author": "Joel Grus",
        "category": "Data Science",
        "p12": "978149204113",
        "pub": "O'Reilly Media",
        "year": 2019,
        "copies": 6,
        "rack": "Rack DS-01, Shelf 2",
        "desc": "First principles implementation of linear algebra, statistics, gradient descent, neural networks, and clustering in pure Python.",
        "keywords": "data science scratch joel grus math statistics python",
        "cover": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80"
    },
    {
        "title": "Practical Statistics for Data Scientists",
        "author": "Peter Bruce",
        "category": "Data Science",
        "p12": "978149207294",
        "pub": "O'Reilly Media",
        "year": 2020,
        "copies": 6,
        "rack": "Rack DS-01, Shelf 3",
        "desc": "Essential statistical concepts: hypothesis testing, bootstrapping, regression, and statistical significance with Python code.",
        "keywords": "statistics data science hypothesis testing a/b testing regression",
        "cover": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80"
    },
    {
        "title": "Storytelling with Data: A Data Visualization Guide",
        "author": "Cole Nussbaumer Knaflic",
        "category": "Data Science",
        "p12": "978111900225",
        "pub": "Wiley",
        "year": 2015,
        "copies": 7,
        "rack": "Rack DS-01, Shelf 4",
        "desc": "Principles of high-impact visual communication, eliminating clutter, and directing audience attention with charts.",
        "keywords": "data visualization storytelling charts dashboard design visual",
        "cover": "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=600&q=80"
    },
    {
        "title": "Mining of Massive Datasets",
        "author": "Jure Leskovec",
        "category": "Data Science",
        "p12": "978110707723",
        "pub": "Cambridge University Press",
        "year": 2014,
        "copies": 5,
        "rack": "Rack DS-02, Shelf 1",
        "desc": "Algorithms for mining web graphs, MapReduce, Locality Sensitive Hashing (LSH), recommender systems, and PageRank.",
        "keywords": "big data pagerank mapreduce lsh graph mining recommendation",
        "cover": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80"
    },
    {
        "title": "Data Science for Business",
        "author": "Foster Provost",
        "category": "Data Science",
        "p12": "978144936132",
        "pub": "O'Reilly Media",
        "year": 2013,
        "copies": 6,
        "rack": "Rack DS-02, Shelf 2",
        "desc": "What you need to know about data mining and data-analytic thinking to extract valuable business insights.",
        "keywords": "data science business analytics decision making predictive modeling",
        "cover": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80"
    },
    {
        "title": "Fundamentals of Data Engineering",
        "author": "Joe Reis",
        "category": "Data Science",
        "p12": "978109810830",
        "pub": "O'Reilly Media",
        "year": 2022,
        "copies": 6,
        "rack": "Rack DS-02, Shelf 3",
        "desc": "Plan and build robust data platforms: ingestion, orchestration, transformation, storage, and governance across data lifecycles.",
        "keywords": "data engineering etl data lakes warehouse pipelines oreilly",
        "cover": "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&q=80"
    },
    {
        "title": "The Art of Data Science",
        "author": "Roger D. Peng",
        "category": "Data Science",
        "p12": "978136506146",
        "pub": "Leanpub",
        "year": 2016,
        "copies": 5,
        "rack": "Rack DS-02, Shelf 4",
        "desc": "A guide for anyone who wants to become a better data analyst: exploratory data analysis, modeling, and communication.",
        "keywords": "eda data science exploratory analysis statistical thinking peng",
        "cover": "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&q=80"
    },
    {
        "title": "Applied Predictive Modeling",
        "author": "Max Kuhn",
        "category": "Data Science",
        "p12": "978146146848",
        "pub": "Springer",
        "year": 2013,
        "copies": 5,
        "rack": "Rack DS-03, Shelf 1",
        "desc": "A pragmatic walkthrough of data preprocessing, tuning, and real-world predictive modeling with comprehensive case studies.",
        "keywords": "predictive modeling statistical learning tuning cross validation",
        "cover": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80"
    },

    # 5. Python (9 books)
    {
        "title": "Fluent Python: Clear, Concise, and Effective Programming",
        "author": "Luciano Ramalho",
        "category": "Python",
        "p12": "978149205635",
        "pub": "O'Reilly Media",
        "year": 2022,
        "copies": 7,
        "rack": "Rack PY-01, Shelf 1",
        "desc": "Master modern Python: special methods, data structures, functions as objects, type hints, generators, and async programming.",
        "keywords": "fluent python ramalho generators asyncio metaclasses typing",
        "cover": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80"
    },
    {
        "title": "Effective Python: 90 Specific Ways to Write Better Python",
        "author": "Brett Slatkin",
        "category": "Python",
        "p12": "978013485398",
        "pub": "Addison-Wesley",
        "year": 2019,
        "copies": 6,
        "rack": "Rack PY-01, Shelf 2",
        "desc": "90 practical best practices, idioms, concurrency tips, and robust testing techniques for Python developers.",
        "keywords": "effective python slatkin best practices concurrency idioms",
        "cover": "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=600&q=80"
    },
    {
        "title": "Python Crash Course",
        "author": "Eric Matthes",
        "category": "Python",
        "p12": "978171850270",
        "pub": "No Starch Press",
        "year": 2023,
        "copies": 8,
        "rack": "Rack PY-01, Shelf 3",
        "desc": "A hands-on, project-based introduction to programming in Python, building arcade games, data visualizer apps, and web apps.",
        "keywords": "python crash course matthes beginner projects pygame django",
        "cover": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80"
    },
    {
        "title": "Automate the Boring Stuff with Python",
        "author": "Al Sweigart",
        "category": "Python",
        "p12": "978159327992",
        "pub": "No Starch Press",
        "year": 2019,
        "copies": 7,
        "rack": "Rack PY-01, Shelf 4",
        "desc": "Practical programming for total beginners: scraping the web, updating Excel files, parsing PDFs, and sending emails.",
        "keywords": "automate python scraping excel selenium regex sweigart",
        "cover": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=80"
    },
    {
        "title": "Python Cookbook: Recipes for Mastering Python 3",
        "author": "David Beazley",
        "category": "Python",
        "p12": "978144934037",
        "pub": "O'Reilly Media",
        "year": 2013,
        "copies": 6,
        "rack": "Rack PY-02, Shelf 1",
        "desc": "A rich collection of recipes covering data structures, iterators, functional tools, concurrency, and C extensions.",
        "keywords": "python cookbook beazley recipes algorithms metaprogramming",
        "cover": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80"
    },
    {
        "title": "Robust Python: Write Clean and Maintainable Code",
        "author": "Patrick Viafore",
        "category": "Python",
        "p12": "978109810066",
        "pub": "O'Reilly Media",
        "year": 2021,
        "copies": 5,
        "rack": "Rack PY-02, Shelf 2",
        "desc": "Using static type checking (mypy), user-defined types, unit testing, and design patterns to build resilient codebases.",
        "keywords": "robust python type hints mypy testing architecture maintainability",
        "cover": "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=600&q=80"
    },
    {
        "title": "Architecture Patterns with Python",
        "author": "Harry Percival",
        "category": "Python",
        "p12": "978149205220",
        "pub": "O'Reilly Media",
        "year": 2020,
        "copies": 6,
        "rack": "Rack PY-02, Shelf 3",
        "desc": "Enabling test-driven development, domain-driven design (DDD), and event-driven microservices in Python.",
        "keywords": "domain driven design ddd clean architecture repository pattern python",
        "cover": "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&q=80"
    },
    {
        "title": "High Performance Python",
        "author": "Micha Gorelick",
        "category": "Python",
        "p12": "978149204297",
        "pub": "O'Reilly Media",
        "year": 2020,
        "copies": 5,
        "rack": "Rack PY-02, Shelf 4",
        "desc": "Practical performant code: profiling bottlenecks, Cython, Numba, multi-processing, and asynchronous IO.",
        "keywords": "performance cython numba profiling multiprocessing async python",
        "cover": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80"
    },
    {
        "title": "FastAPI: Modern Python Web Development",
        "author": "Bill Lubanovic",
        "category": "Python",
        "p12": "978109813550",
        "pub": "O'Reilly Media",
        "year": 2023,
        "copies": 6,
        "rack": "Rack PY-03, Shelf 1",
        "desc": "Building high-performance async RESTful APIs with Pydantic, SQLAlchemy, dependency injection, and JWT security.",
        "keywords": "fastapi pydantic starlette async rest api jwt python",
        "cover": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80"
    },

    # 6. Java (9 books)
    {
        "title": "Effective Java",
        "author": "Joshua Bloch",
        "category": "Java",
        "p12": "978013468599",
        "pub": "Addison-Wesley",
        "year": 2018,
        "copies": 8,
        "rack": "Rack JV-01, Shelf 1",
        "desc": "The definitive guide to Java best practices by former Sun architect Joshua Bloch covering lambdas, streams, and generics.",
        "keywords": "effective java joshua bloch design patterns concurrency generics",
        "cover": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=80"
    },
    {
        "title": "Java: The Complete Reference",
        "author": "Herbert Schildt",
        "category": "Java",
        "p12": "978126044023",
        "pub": "McGraw-Hill",
        "year": 2021,
        "copies": 6,
        "rack": "Rack JV-01, Shelf 2",
        "desc": "Comprehensive encyclopedic reference covering core language syntax, java.util packages, multithreading, and AWT/Swing.",
        "keywords": "java reference schildt core java collections multithreading",
        "cover": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80"
    },
    {
        "title": "Java Concurrency in Practice",
        "author": "Brian Goetz",
        "category": "Java",
        "p12": "978032134960",
        "pub": "Addison-Wesley",
        "year": 2006,
        "copies": 6,
        "rack": "Rack JV-01, Shelf 3",
        "desc": "The gold standard handbook on thread safety, immutability, synchronization, deadlocks, and java.util.concurrent.",
        "keywords": "java concurrency threads synchronization goetz atomic locks",
        "cover": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&q=80"
    },
    {
        "title": "Spring in Action",
        "author": "Craig Walls",
        "category": "Java",
        "p12": "978161729757",
        "pub": "Manning Publications",
        "year": 2022,
        "copies": 7,
        "rack": "Rack JV-01, Shelf 4",
        "desc": "Building modern enterprise Java web microservices with Spring Boot 3, Spring Security, Spring Data, and Reactive flows.",
        "keywords": "spring boot java microservices spring data security manning",
        "cover": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80"
    },
    {
        "title": "Head First Java",
        "author": "Kathy Sierra",
        "category": "Java",
        "p12": "978149191077",
        "pub": "O'Reilly Media",
        "year": 2022,
        "copies": 7,
        "rack": "Rack JV-02, Shelf 1",
        "desc": "A visually rich, highly engaging brain-friendly guide to object-oriented programming, interfaces, and polymorphism in Java.",
        "keywords": "head first java oop beginner visual learning kathy sierra",
        "cover": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80"
    },
    {
        "title": "Optimizing Java: Practical Techniques for Improved Performance",
        "author": "Benjamin J. Evans",
        "category": "Java",
        "p12": "978149203930",
        "pub": "O'Reilly Media",
        "year": 2018,
        "copies": 5,
        "rack": "Rack JV-02, Shelf 2",
        "desc": "Deep dive into JVM internals: JIT compilation, Garbage Collection tuning (G1/ZGC), bytecode, and memory models.",
        "keywords": "jvm performance jit compilation garbage collection g1 zgc java",
        "cover": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80"
    },
    {
        "title": "Modern Java in Action: Lambdas, streams, functional and reactive programming",
        "author": "Raoul-Gabriel Urma",
        "category": "Java",
        "p12": "978161729356",
        "pub": "Manning Publications",
        "year": 2018,
        "copies": 6,
        "rack": "Rack JV-02, Shelf 3",
        "desc": "Writing declarative, functional code in Java with Stream API, CompletableFuture, and Reactive Streams with RxJava.",
        "keywords": "modern java lambdas streams functional reactive completablefuture",
        "cover": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80"
    },
    {
        "title": "Clean Code in Java",
        "author": "Lucas da Silva",
        "category": "Java",
        "p12": "978178980838",
        "pub": "Packt Publishing",
        "year": 2021,
        "copies": 5,
        "rack": "Rack JV-02, Shelf 4",
        "desc": "Writing testable, maintainable, and idiomatic Java using SOLID principles, design patterns, and JUnit 5.",
        "keywords": "clean code java solid design patterns junit testing",
        "cover": "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=600&q=80"
    },
    {
        "title": "Cloud-Native Java",
        "author": "Josh Long",
        "category": "Java",
        "p12": "978144937464",
        "pub": "O'Reilly Media",
        "year": 2017,
        "copies": 5,
        "rack": "Rack JV-03, Shelf 1",
        "desc": "Designing resilient, scalable microservice architectures using Spring Cloud, Cloud Foundry, and Docker.",
        "keywords": "cloud native java spring cloud microservices docker josh long",
        "cover": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80"
    },

    # 7. C/C++ (9 books)
    {
        "title": "The C Programming Language",
        "author": "Brian W. Kernighan",
        "category": "C/C++",
        "p12": "978013110362",
        "pub": "Prentice Hall",
        "year": 1988,
        "copies": 8,
        "rack": "Rack CPP-01, Shelf 1",
        "desc": "The iconic K&R bible written by the creators of C: pointers, structs, memory addresses, and UNIX system calls.",
        "keywords": "k&r c programming pointers unix kernighan ritchie",
        "cover": "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=600&q=80"
    },
    {
        "title": "The C++ Programming Language",
        "author": "Bjarne Stroustrup",
        "category": "C/C++",
        "p12": "978032156384",
        "pub": "Addison-Wesley",
        "year": 2013,
        "copies": 6,
        "rack": "Rack CPP-01, Shelf 2",
        "desc": "The authoritative reference by C++ creator Bjarne Stroustrup covering C++11, templates, RAII, and the Standard Library.",
        "keywords": "c++ stroustrup templates raii stl modern c++",
        "cover": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&q=80"
    },
    {
        "title": "Effective Modern C++: 42 Specific Ways to Improve Your Use of C++11 and C++14",
        "author": "Scott Meyers",
        "category": "C/C++",
        "p12": "978149190399",
        "pub": "O'Reilly Media",
        "year": 2014,
        "copies": 7,
        "rack": "Rack CPP-01, Shelf 3",
        "desc": "Essential insights into auto type deduction, rvalue references, move semantics, smart pointers, and lambda expressions.",
        "keywords": "effective modern c++ scott meyers move semantics smart pointers lambdas",
        "cover": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80"
    },
    {
        "title": "C++ Primer",
        "author": "Stanley B. Lippman",
        "category": "C/C++",
        "p12": "978032171411",
        "pub": "Addison-Wesley",
        "year": 2012,
        "copies": 6,
        "rack": "Rack CPP-01, Shelf 4",
        "desc": "The most widely recommended comprehensive tutorial for mastering contemporary C++ syntax and idioms.",
        "keywords": "c++ primer lippman modern c++ stl containers algorithms",
        "cover": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=80"
    },
    {
        "title": "C++ Concurrency in Action",
        "author": "Anthony Williams",
        "category": "C/C++",
        "p12": "978161729469",
        "pub": "Manning Publications",
        "year": 2019,
        "copies": 5,
        "rack": "Rack CPP-02, Shelf 1",
        "desc": "Writing multithreaded C++17/C++20 software using std::thread, atomic operations, lock-free data structures, and memory orderings.",
        "keywords": "c++ concurrency threads atomic lock-free memory order manning",
        "cover": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80"
    },
    {
        "title": "Modern C++ Design: Generic Programming and Design Patterns Applied",
        "author": "Andrei Alexandrescu",
        "category": "C/C++",
        "p12": "978020170431",
        "pub": "Addison-Wesley",
        "year": 2001,
        "copies": 5,
        "rack": "Rack CPP-02, Shelf 2",
        "desc": "Groundbreaking work pioneering policy-based class design, template metaprogramming, and typelists.",
        "keywords": "generic programming alexandrescu templates metaprogramming patterns",
        "cover": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80"
    },
    {
        "title": "Expert C Programming: Deep C Secrets",
        "author": "Peter van der Linden",
        "category": "C/C++",
        "p12": "978013177429",
        "pub": "Prentice Hall",
        "year": 1994,
        "copies": 5,
        "rack": "Rack CPP-02, Shelf 3",
        "desc": "Humorous and deep exploration of C quirks, memory models, stack frames, segmentation faults, and linkage.",
        "keywords": "expert c programming pointers memory stack segfaults",
        "cover": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80"
    },
    {
        "title": "A Tour of C++",
        "author": "Bjarne Stroustrup",
        "category": "C/C++",
        "p12": "978013681648",
        "pub": "Addison-Wesley",
        "year": 2022,
        "copies": 7,
        "rack": "Rack CPP-02, Shelf 4",
        "desc": "A concise and overview of the modern C++20 language features, modules, concepts, ranges, and coroutines.",
        "keywords": "tour of c++ c++20 concepts modules ranges coroutines stroustrup",
        "cover": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80"
    },
    {
        "title": "C++ High Performance: Master the art of optimizing the functioning of your C++ code",
        "author": "Björn Andrist",
        "category": "C/C++",
        "p12": "978183921654",
        "pub": "Packt Publishing",
        "year": 2020,
        "copies": 5,
        "rack": "Rack CPP-03, Shelf 1",
        "desc": "Optimizing memory layout, cache locality, SIMD vectorization, and compile-time evaluation in C++.",
        "keywords": "c++ performance cache locality simd optimization compile time",
        "cover": "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&q=80"
    },

    # 8. Web Development (9 books)
    {
        "title": "Learning React: Modern Patterns for Developing React Apps",
        "author": "Alex Banks",
        "category": "Web Development",
        "p12": "978149205172",
        "pub": "O'Reilly Media",
        "year": 2020,
        "copies": 8,
        "rack": "Rack WEB-01, Shelf 1",
        "desc": "Building scalable React apps with modern Hooks, Context, component composition, and state management.",
        "keywords": "react hooks frontend javascript state management web dev",
        "cover": "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&q=80"
    },
    {
        "title": "JavaScript: The Definitive Guide",
        "author": "David Flanagan",
        "category": "Web Development",
        "p12": "978149195202",
        "pub": "O'Reilly Media",
        "year": 2020,
        "copies": 7,
        "rack": "Rack WEB-01, Shelf 2",
        "desc": "The master reference covering ECMAScript 2020+, closures, async/await, DOM APIs, and Node.js fundamentals.",
        "keywords": "javascript flanagan es6 closures promises async dom web",
        "cover": "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=600&q=80"
    },
    {
        "title": "Fullstack Node.js: The Complete Guide to Building Production Apps with Node.js",
        "author": "Nate Murray",
        "category": "Web Development",
        "p12": "978198759203",
        "pub": "Fullstack.io",
        "year": 2021,
        "copies": 6,
        "rack": "Rack WEB-01, Shelf 3",
        "desc": "Building fast backend services, REST APIs, GraphQL servers, WebSockets, and authentication with Node and Express.",
        "keywords": "nodejs backend express rest api graphql websockets",
        "cover": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80"
    },
    {
        "title": "CSS: The Definitive Guide: Visual Presentation for the Web",
        "author": "Eric A. Meyer",
        "category": "Web Development",
        "p12": "978149199380",
        "pub": "O'Reilly Media",
        "year": 2023,
        "copies": 6,
        "rack": "Rack WEB-01, Shelf 4",
        "desc": "Mastering modern layout engines: CSS Grid, Flexbox, Custom Properties, media queries, animations, and typography.",
        "keywords": "css grid flexbox responsive styling design meyer web",
        "cover": "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&q=80"
    },
    {
        "title": "Eloquent JavaScript: A Modern Introduction to Programming",
        "author": "Marijn Haverbeke",
        "category": "Web Development",
        "p12": "978159327950",
        "pub": "No Starch Press",
        "year": 2018,
        "copies": 8,
        "rack": "Rack WEB-02, Shelf 1",
        "desc": "An engaging, deep dive into pure JavaScript, functional patterns, object-oriented concepts, and browser integration.",
        "keywords": "eloquent javascript haverbeke browser canvas nodejs",
        "cover": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=80"
    },
    {
        "title": "Programming TypeScript: Making Your JavaScript Applications Scale",
        "author": "Boris Cherny",
        "category": "Web Development",
        "p12": "978149203765",
        "pub": "O'Reilly Media",
        "year": 2019,
        "copies": 7,
        "rack": "Rack WEB-02, Shelf 2",
        "desc": "Type systems at scale: structural subtyping, algebraic data types, type narrowing, generics, and compiler configurations.",
        "keywords": "typescript types generics structural subtyping boris cherny",
        "cover": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80"
    },
    {
        "title": "Designing Web APIs: Principles and Best Practices",
        "author": "Brenda Jin",
        "category": "Web Development",
        "p12": "978149203929",
        "pub": "O'Reilly Media",
        "year": 2018,
        "copies": 5,
        "rack": "Rack WEB-02, Shelf 3",
        "desc": "Developing durable, intuitive HTTP APIs: pagination, status codes, OpenAPI/Swagger specifications, and rate limiting.",
        "keywords": "rest api design openapi swagger http pagination endpoints",
        "cover": "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&q=80"
    },
    {
        "title": "Next.js Quick Start Guide",
        "author": "Kirill Konshin",
        "category": "Web Development",
        "p12": "978178899366",
        "pub": "Packt Publishing",
        "year": 2021,
        "copies": 6,
        "rack": "Rack WEB-02, Shelf 4",
        "desc": "Server-side rendering (SSR), static site generation (SSG), App Router, and API routes for scalable modern web apps.",
        "keywords": "nextjs ssr ssg react app router frontend server components",
        "cover": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80"
    },
    {
        "title": "Web Security for Developers",
        "author": "Malcolm McDonald",
        "category": "Web Development",
        "p12": "978159327994",
        "pub": "No Starch Press",
        "year": 2020,
        "copies": 6,
        "rack": "Rack WEB-03, Shelf 1",
        "desc": "Defending web applications against XSS, CSRF, SQL Injection, broken authentication, and session hijacking.",
        "keywords": "web security xss csrf owasp injection authentication",
        "cover": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&q=80"
    },

    # 9. Database Management (9 books)
    {
        "title": "Designing Data-Intensive Applications",
        "author": "Martin Kleppmann",
        "category": "Database Management",
        "p12": "978144937332",
        "pub": "O'Reilly Media",
        "year": 2017,
        "copies": 8,
        "rack": "Rack DB-01, Shelf 1",
        "desc": "The definitive handbook on reliability, scalability, distributed consensus, transactions, replication, and stream processing.",
        "keywords": "ddia distributed transactions replication consensus kleppmann database",
        "cover": "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&q=80"
    },
    {
        "title": "Database System Concepts",
        "author": "Abraham Silberschatz",
        "category": "Database Management",
        "p12": "978007802215",
        "pub": "McGraw-Hill",
        "year": 2019,
        "copies": 7,
        "rack": "Rack DB-01, Shelf 2",
        "desc": "Foundations of relational algebra, SQL schema design, ACID properties, B+ Tree indexing, and query evaluation.",
        "keywords": "database concepts sql b-tree acid normalization silberschatz",
        "cover": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80"
    },
    {
        "title": "High Performance MySQL: Optimization, Backups, and Replication",
        "author": "Silvia Botros",
        "category": "Database Management",
        "p12": "978149208051",
        "pub": "O'Reilly Media",
        "year": 2021,
        "copies": 6,
        "rack": "Rack DB-01, Shelf 3",
        "desc": "Advanced tuning of InnoDB storage engines, query profiling with EXPLAIN, index optimization, and replication topologies.",
        "keywords": "mysql innodb query optimization indexing replication performance",
        "cover": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80"
    },
    {
        "title": "Seven Databases in Seven Weeks: A Guide to Modern Databases",
        "author": "Luc Perkins",
        "category": "Database Management",
        "p12": "978168050253",
        "pub": "Pragmatic Bookshelf",
        "year": 2018,
        "copies": 6,
        "rack": "Rack DB-01, Shelf 4",
        "desc": "Hands-on exploration of PostgreSQL, Riak, Apache HBase, MongoDB, Apache CouchDB, Neo4j, and Redis.",
        "keywords": "nosql redis mongodb postgresql neo4j hbase seven databases",
        "cover": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80"
    },
    {
        "title": "PostgreSQL: Up and Running",
        "author": "Regina Obe",
        "category": "Database Management",
        "p12": "978149196341",
        "pub": "O'Reilly Media",
        "year": 2017,
        "copies": 6,
        "rack": "Rack DB-02, Shelf 1",
        "desc": "A fast-paced guide to tablespaces, JSONB operators, Window functions, full text search, and vacuum maintenance.",
        "keywords": "postgresql postgres jsonb window functions indexing rdbms",
        "cover": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=80"
    },
    {
        "title": "SQL Antipatterns: Avoiding the Pitfalls of Database Programming",
        "author": "Bill Karwin",
        "category": "Database Management",
        "p12": "978193435655",
        "pub": "Pragmatic Bookshelf",
        "year": 2010,
        "copies": 5,
        "rack": "Rack DB-02, Shelf 2",
        "desc": "How to identify and resolve destructive schema flaws, polymophic associations, naive trees, and bad indexing.",
        "keywords": "sql antipatterns database design indexing queries karwin",
        "cover": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80"
    },
    {
        "title": "MongoDB: The Definitive Guide",
        "author": "Shannon Bradshaw",
        "category": "Database Management",
        "p12": "978149195446",
        "pub": "O'Reilly Media",
        "year": 2019,
        "copies": 6,
        "rack": "Rack DB-02, Shelf 3",
        "desc": "Document modeling, aggregation pipelines, replica sets, sharding, and high availability in MongoDB.",
        "keywords": "mongodb nosql document database aggregation sharding replica",
        "cover": "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=600&q=80"
    },
    {
        "title": "Database Internals: A Deep Dive into How Distributed Data Systems Work",
        "author": "Alex Petrov",
        "category": "Database Management",
        "p12": "978149204034",
        "pub": "O'Reilly Media",
        "year": 2019,
        "copies": 6,
        "rack": "Rack DB-02, Shelf 4",
        "desc": "Storage engine architectures, B-Trees vs LSM Trees, write-ahead logs (WAL), Raft consensus, and two-phase commits.",
        "keywords": "database internals lsm tree b-tree storage engine raft petrov",
        "cover": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&q=80"
    },
    {
        "title": "Learning SQL: Generate, Manipulate, and Retrieve Data",
        "author": "Alan Beaulieu",
        "category": "Database Management",
        "p12": "978149205761",
        "pub": "O'Reilly Media",
        "year": 2020,
        "copies": 7,
        "rack": "Rack DB-03, Shelf 1",
        "desc": "Mastering SQL syntax: joins, grouping, subqueries, set operators, views, and transaction controls.",
        "keywords": "sql tutorial queries joins subqueries ddl dml rdbms",
        "cover": "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&q=80"
    },

    # 10. Cloud Computing (9 books)
    {
        "title": "Kubernetes: Up and Running",
        "author": "Brendan Burns",
        "category": "Cloud Computing",
        "p12": "978109811020",
        "pub": "O'Reilly Media",
        "year": 2022,
        "copies": 7,
        "rack": "Rack CLD-01, Shelf 1",
        "desc": "Written by Kubernetes co-founders covering Pods, Deployments, Services, Ingress controllers, and Helm packages.",
        "keywords": "kubernetes k8s containers docker cloud brendan burns devops",
        "cover": "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=600&q=80"
    },
    {
        "title": "Cloud Native Patterns: Designing change-tolerant software",
        "author": "Cornelia Davis",
        "category": "Cloud Computing",
        "p12": "978161729429",
        "pub": "Manning Publications",
        "year": 2019,
        "copies": 6,
        "rack": "Rack CLD-01, Shelf 2",
        "desc": "Designing resilient microservices: statelessness, event-driven architectures, circuit breakers, and configuration stores.",
        "keywords": "cloud native microservices resiliency circuit breaker manning",
        "cover": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80"
    },
    {
        "title": "AWS Certified Solutions Architect Official Study Guide",
        "author": "Joe Baron",
        "category": "Cloud Computing",
        "p12": "978111971308",
        "pub": "Sybex",
        "year": 2021,
        "copies": 8,
        "rack": "Rack CLD-01, Shelf 3",
        "desc": "Mastering AWS services: VPC, EC2, S3, IAM, Lambda, DynamoDB, CloudFront, and Well-Architected Framework.",
        "keywords": "aws cloud solutions architect ec2 s3 lambda vpc certification",
        "cover": "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&q=80"
    },
    {
        "title": "Terraform: Up & Running: Writing Infrastructure as Code",
        "author": "Yevgeniy Brikman",
        "category": "Cloud Computing",
        "p12": "978109811674",
        "pub": "O'Reilly Media",
        "year": 2022,
        "copies": 6,
        "rack": "Rack CLD-01, Shelf 4",
        "desc": "Infrastructure as Code (IaC) with HashiCorp Terraform: reusable modules, state management, and multi-cloud provisioning.",
        "keywords": "terraform iac devops cloud infrastructure automation brikman",
        "cover": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80"
    },
    {
        "title": "Docker Deep Dive",
        "author": "Nigel Poulton",
        "category": "Cloud Computing",
        "p12": "978152182280",
        "pub": "Independently published",
        "year": 2023,
        "copies": 7,
        "rack": "Rack CLD-02, Shelf 1",
        "desc": "Container mechanics from the ground up: Docker daemon, namespaces, cgroups, images, Dockerfiles, and compose.",
        "keywords": "docker containers linux cgroups namespaces microservices",
        "cover": "https://images.unsplash.com/photo-1605745341112-85968b19335b?w=600&q=80"
    },
    {
        "title": "Site Reliability Engineering: How Google Runs Production Systems",
        "author": "Betsy Beyer",
        "category": "Cloud Computing",
        "p12": "978149192912",
        "pub": "O'Reilly Media",
        "year": 2016,
        "copies": 7,
        "rack": "Rack CLD-02, Shelf 2",
        "desc": "Google's internal practices on SLOs, SLAs, error budgets, incident management, distributed monitoring, and postmortems.",
        "keywords": "sre site reliability engineering google devops slo sla monitoring",
        "cover": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80"
    },
    {
        "title": "Serverless Architectures on AWS",
        "author": "Peter Sbarski",
        "category": "Cloud Computing",
        "p12": "978161729382",
        "pub": "Manning Publications",
        "year": 2021,
        "copies": 5,
        "rack": "Rack CLD-02, Shelf 3",
        "desc": "Event-driven computing with AWS Lambda, API Gateway, DynamoDB, SQS, and Step Functions.",
        "keywords": "serverless lambda aws event-driven microservices cloud",
        "cover": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80"
    },
    {
        "title": "Microservices Patterns: With examples in Java",
        "author": "Chris Richardson",
        "category": "Cloud Computing",
        "p12": "978161729454",
        "pub": "Manning Publications",
        "year": 2018,
        "copies": 6,
        "rack": "Rack CLD-02, Shelf 4",
        "desc": "Decomposing monoliths, Saga pattern for distributed transactions, CQRS, event sourcing, and API gateways.",
        "keywords": "microservices saga cqrs event sourcing api gateway cloud",
        "cover": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&q=80"
    },
    {
        "title": "Accelerate: The Science of Lean Software and DevOps",
        "author": "Nicole Forsgren",
        "category": "Cloud Computing",
        "p12": "978194278833",
        "pub": "IT Revolution Press",
        "year": 2018,
        "copies": 6,
        "rack": "Rack CLD-03, Shelf 1",
        "desc": "Rigorous statistical analysis behind high-performing engineering teams: DORA metrics, CI/CD, and trunk-based development.",
        "keywords": "devops accelerate dora metrics ci/cd lean engineering",
        "cover": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80"
    },

    # 11. Cybersecurity (9 books)
    {
        "title": "The Web Application Hacker's Handbook",
        "author": "Dafydd Stuttard",
        "category": "Cybersecurity",
        "p12": "978111802647",
        "pub": "Wiley",
        "year": 2011,
        "copies": 7,
        "rack": "Rack SEC-01, Shelf 1",
        "desc": "The penetration testing bible detailing flaws in authentication, access controls, SQLi, XML injection, and logic bugs.",
        "keywords": "web penetration testing burp suite sqli xss ethical hacking",
        "cover": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&q=80"
    },
    {
        "title": "Practical Malware Analysis",
        "author": "Michael Sikorski",
        "category": "Cybersecurity",
        "p12": "978159327290",
        "pub": "No Starch Press",
        "year": 2012,
        "copies": 6,
        "rack": "Rack SEC-01, Shelf 2",
        "desc": "Dissecting malicious binaries with IDA Pro, OllyDbg, reverse engineering x86 assembly, unpacking, and sandboxing.",
        "keywords": "malware reverse engineering ida pro x86 assembly forensics",
        "cover": "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&q=80"
    },
    {
        "title": "Hacking: The Art of Exploitation",
        "author": "Jon Erickson",
        "category": "Cybersecurity",
        "p12": "978159327144",
        "pub": "No Starch Press",
        "year": 2008,
        "copies": 7,
        "rack": "Rack SEC-01, Shelf 3",
        "desc": "Low-level security: stack-based buffer overflows, shellcode crafting, format string vulnerabilities, and network sniffing.",
        "keywords": "buffer overflow shellcode assembly c exploits network hacking",
        "cover": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80"
    },
    {
        "title": "Applied Cryptography: Protocols, Algorithms, and Source Code in C",
        "author": "Bruce Schneier",
        "category": "Cybersecurity",
        "p12": "978111909672",
        "pub": "Wiley",
        "year": 2015,
        "copies": 6,
        "rack": "Rack SEC-01, Shelf 4",
        "desc": "Symmetric ciphers, public-key encryption, digital signatures, key exchange protocols (Diffie-Hellman), and cryptanalysis.",
        "keywords": "cryptography rsa aes diffie hellman ciphers schneier security",
        "cover": "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&q=80"
    },
    {
        "title": "Blue Team Handbook: Incident Response Edition",
        "author": "Don Murdoch",
        "category": "Cybersecurity",
        "p12": "978150073475",
        "pub": "CreateSpace",
        "year": 2014,
        "copies": 6,
        "rack": "Rack SEC-02, Shelf 1",
        "desc": "Essential field guide for SOC analysts: intrusion detection, packet analysis, memory triage, and containment tactics.",
        "keywords": "incident response soc analyst blue team forensics network security",
        "cover": "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&q=80"
    },
    {
        "title": "Threat Modeling: Designing for Security",
        "author": "Adam Shostack",
        "category": "Cybersecurity",
        "p12": "978111880999",
        "pub": "Wiley",
        "year": 2014,
        "copies": 5,
        "rack": "Rack SEC-02, Shelf 2",
        "desc": "Actionable software security modeling using STRIDE, attack trees, elevation of privilege cards, and mitigation frameworks.",
        "keywords": "threat modeling stride software security attack trees shostack",
        "cover": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&q=80"
    },
    {
        "title": "Linux Basics for Hackers",
        "author": "OccupyTheWeb",
        "category": "Cybersecurity",
        "p12": "978159327855",
        "pub": "No Starch Press",
        "year": 2018,
        "copies": 7,
        "rack": "Rack SEC-02, Shelf 3",
        "desc": "Getting started with Kali Linux: scripting in Bash, managing permissions, network recon with Nmap, and wireless sniffing.",
        "keywords": "kali linux bash nmap wireless penetration testing hacking",
        "cover": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80"
    },
    {
        "title": "The Tangled Web: A Guide to Securing Modern Web Applications",
        "author": "Michal Zalewski",
        "category": "Cybersecurity",
        "p12": "978159327388",
        "pub": "No Starch Press",
        "year": 2011,
        "copies": 5,
        "rack": "Rack SEC-02, Shelf 4",
        "desc": "Deconstruction of browser security models: same-origin policy, cookie attributes, sandboxing, and CORS headers.",
        "keywords": "browser security same-origin policy cookies cors xss zalewski",
        "cover": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80"
    },
    {
        "title": "Serious Cryptography: A Practical Introduction to Modern Encryption",
        "author": "Jean-Philippe Aumasson",
        "category": "Cybersecurity",
        "p12": "978159327826",
        "pub": "No Starch Press",
        "year": 2017,
        "copies": 6,
        "rack": "Rack SEC-03, Shelf 1",
        "desc": "Modern crypto fundamentals: stream ciphers, hash functions, authenticated encryption (GCM), and elliptic curve cryptography.",
        "keywords": "cryptography ecc elliptic curves aes hash functions aumasson",
        "cover": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80"
    },

    # 12. Networking (9 books)
    {
        "title": "Computer Networking: A Top-Down Approach",
        "author": "James F. Kurose",
        "category": "Networking",
        "p12": "978013668155",
        "pub": "Pearson",
        "year": 2021,
        "copies": 8,
        "rack": "Rack NET-01, Shelf 1",
        "desc": "The leading networking textbook: application layer (HTTP/DNS), transport (TCP/UDP), routing (BGP/OSPF), and wireless.",
        "keywords": "networking kurose ross tcp ip http dns bgp routing",
        "cover": "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&q=80"
    },
    {
        "title": "TCP/IP Illustrated, Volume 1: The Protocols",
        "author": "W. Richard Stevens",
        "category": "Networking",
        "p12": "978032133631",
        "pub": "Addison-Wesley",
        "year": 2011,
        "copies": 6,
        "rack": "Rack NET-01, Shelf 2",
        "desc": "The masterwork on packet headers, TCP congestion control, sliding windows, ARP, IP fragmentation, and ICMP.",
        "keywords": "tcp/ip stevens packet analysis protocols congestion control",
        "cover": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80"
    },
    {
        "title": "Computer Networks",
        "author": "Andrew S. Tanenbaum",
        "category": "Networking",
        "p12": "978013212695",
        "pub": "Pearson",
        "year": 2021,
        "copies": 6,
        "rack": "Rack NET-01, Shelf 3",
        "desc": "Physical layer transmission, data link protocols, medium access sublayers, routing algorithms, and network security.",
        "keywords": "computer networks tanenbaum ethernet routing physical layer",
        "cover": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80"
    },
    {
        "title": "Wireshark Network Analysis: The Official Wireshark Certified Network Analyst Study Guide",
        "author": "Laura Chappell",
        "category": "Networking",
        "p12": "978189396736",
        "pub": "Laura Chappell University",
        "year": 2012,
        "copies": 6,
        "rack": "Rack NET-01, Shelf 4",
        "desc": "Packet-level troubleshooting: identifying latency bottlenecks, TCP retransmissions, DNS delays, and protocol anomalies.",
        "keywords": "wireshark packet capture network analysis troubleshooting pcap",
        "cover": "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&q=80"
    },
    {
        "title": "High Performance Browser Networking",
        "author": "Ilya Grigorik",
        "category": "Networking",
        "p12": "978144934476",
        "pub": "O'Reilly Media",
        "year": 2013,
        "copies": 7,
        "rack": "Rack NET-02, Shelf 1",
        "desc": "Optimizing web performance: TCP latency, TLS 1.3 handshakes, HTTP/2, HTTP/3 (QUIC), and WebRTC streaming.",
        "keywords": "browser networking http2 http3 quic tls webrtc performance",
        "cover": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80"
    },
    {
        "title": "Network Programmability and Automation",
        "author": "Jason Edelman",
        "category": "Networking",
        "p12": "978149193125",
        "pub": "O'Reilly Media",
        "year": 2018,
        "copies": 5,
        "rack": "Rack NET-02, Shelf 2",
        "desc": "Next-gen network engineering: automating switches and routers with Python, Ansible, Netmiko, and RESTCONF.",
        "keywords": "network automation python ansible netmiko sdn cisco",
        "cover": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=80"
    },
    {
        "title": "Network Warrior",
        "author": "Gary A. Donahue",
        "category": "Networking",
        "p12": "978144938786",
        "pub": "O'Reilly Media",
        "year": 2011,
        "copies": 6,
        "rack": "Rack NET-02, Shelf 3",
        "desc": "Real-world enterprise networking: Cisco switch configuration, VLANs, Spanning Tree (STP), BGP, firewalls, and telecom.",
        "keywords": "cisco vlan spanning tree bgp firewalls enterprise networking",
        "cover": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&q=80"
    },
    {
        "title": "Routing TCP/IP, Volume 1",
        "author": "Jeff Doyle",
        "category": "Networking",
        "p12": "978158705202",
        "pub": "Cisco Press",
        "year": 2005,
        "copies": 5,
        "rack": "Rack NET-02, Shelf 4",
        "desc": "Mastering interior routing protocols: RIPv2, EIGRP, OSPF, and route redistribution topologies.",
        "keywords": "routing ospf eigrp rip tcp ip cisco press doyle",
        "cover": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80"
    },
    {
        "title": "HTTP: The Definitive Guide",
        "author": "David Gourley",
        "category": "Networking",
        "p12": "978156592509",
        "pub": "O'Reilly Media",
        "year": 2002,
        "copies": 5,
        "rack": "Rack NET-03, Shelf 1",
        "desc": "Deep architectural explanation of HTTP methods, headers, proxies, caching, content negotiation, and authentication.",
        "keywords": "http web protocols proxies caching cookies headers oreilly",
        "cover": "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=600&q=80"
    },

    # 13. Software Engineering (9 books)
    {
        "title": "Clean Code: A Handbook of Agile Software Craftsmanship",
        "author": "Robert C. Martin",
        "category": "Software Engineering",
        "p12": "978013235088",
        "pub": "Prentice Hall",
        "year": 2008,
        "copies": 8,
        "rack": "Rack SE-01, Shelf 1",
        "desc": "The seminal guide by Uncle Bob on writing readable functions, meaningful variable names, formatting, and unit testing.",
        "keywords": "clean code uncle bob refactoring agile unit tests readability",
        "cover": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80"
    },
    {
        "title": "Design Patterns: Elements of Reusable Object-Oriented Software",
        "author": "Erich Gamma",
        "category": "Software Engineering",
        "p12": "978020163361",
        "pub": "Addison-Wesley",
        "year": 1994,
        "copies": 8,
        "rack": "Rack SE-01, Shelf 2",
        "desc": "The Gang of Four (GoF) classic detailing 23 fundamental Creational, Structural, and Behavioral design patterns.",
        "keywords": "design patterns gang of four gof singleton factory observer",
        "cover": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=80"
    },
    {
        "title": "Refactoring: Improving the Design of Existing Code",
        "author": "Martin Fowler",
        "category": "Software Engineering",
        "p12": "978013475759",
        "pub": "Addison-Wesley",
        "year": 2018,
        "copies": 7,
        "rack": "Rack SE-01, Shelf 3",
        "desc": "Step-by-step techniques to eliminate code smells, extract methods, replace conditionals with polymorphism, and maintain tests.",
        "keywords": "refactoring martin fowler code smells design tests agility",
        "cover": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80"
    },
    {
        "title": "The Pragmatic Programmer: Your Journey to Mastery",
        "author": "David Thomas",
        "category": "Software Engineering",
        "p12": "978013595705",
        "pub": "Addison-Wesley",
        "year": 2019,
        "copies": 8,
        "rack": "Rack SE-01, Shelf 4",
        "desc": "Timeless engineering wisdom on DRY principles, orthogonality, decoupling, prototyping, career mastery, and tracer bullets.",
        "keywords": "pragmatic programmer hunt thomas dry engineering craftsmanship",
        "cover": "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=600&q=80"
    },
    {
        "title": "Domain-Driven Design: Tackling Complexity in the Heart of Software",
        "author": "Eric Evans",
        "category": "Software Engineering",
        "p12": "978032112521",
        "pub": "Addison-Wesley",
        "year": 2003,
        "copies": 6,
        "rack": "Rack SE-02, Shelf 1",
        "desc": "The foundational blueprint on Bounded Contexts, Ubiquitous Language, Aggregates, Entities, Value Objects, and Repositories.",
        "keywords": "domain driven design ddd bounded context ubiquitous language evans",
        "cover": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&q=80"
    },
    {
        "title": "Clean Architecture: A Craftsman's Guide to Software Structure and Design",
        "author": "Robert C. Martin",
        "category": "Software Engineering",
        "p12": "978013449416",
        "pub": "Prentice Hall",
        "year": 2017,
        "copies": 7,
        "rack": "Rack SE-02, Shelf 2",
        "desc": "Hexagonal and Onion architectural patterns separating domain business rules from databases, frameworks, and UI boundaries.",
        "keywords": "clean architecture solid hexagonal onion dependency inversion",
        "cover": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80"
    },
    {
        "title": "Working Effectively with Legacy Code",
        "author": "Michael C. Feathers",
        "category": "Software Engineering",
        "p12": "978013117705",
        "pub": "Prentice Hall",
        "year": 2004,
        "copies": 6,
        "rack": "Rack SE-02, Shelf 3",
        "desc": "Practical strategies for safely modifying, untangling, and introducing automated unit tests into untested legacy systems.",
        "keywords": "legacy code feathers unit testing seam model refactoring",
        "cover": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80"
    },
    {
        "title": "Software Engineering at Google",
        "author": "Titus Winters",
        "category": "Software Engineering",
        "p12": "978149208279",
        "pub": "O'Reilly Media",
        "year": 2020,
        "copies": 7,
        "rack": "Rack SE-02, Shelf 4",
        "desc": "Lessons learned across time, scale, and trade-offs: code reviews, testing pyramids, static analysis, and trunk development.",
        "keywords": "google software engineering code review testing monorepo titus",
        "cover": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80"
    },
    {
        "title": "Building Microservices: Designing Fine-Grained Systems",
        "author": "Sam Newman",
        "category": "Software Engineering",
        "p12": "978149203402",
        "pub": "O'Reilly Media",
        "year": 2021,
        "copies": 6,
        "rack": "Rack SE-03, Shelf 1",
        "desc": "Comprehensive guide to modeling services, integration patterns, splitting databases, asynchronous communication, and security.",
        "keywords": "microservices sam newman distributed systems architecture apis",
        "cover": "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&q=80"
    },

    # 14. Operating Systems (9 books)
    {
        "title": "Operating System Concepts",
        "author": "Abraham Silberschatz",
        "category": "Operating Systems",
        "p12": "978111980036",
        "pub": "Wiley",
        "year": 2021,
        "copies": 8,
        "rack": "Rack OS-01, Shelf 1",
        "desc": "The definitive Dinosaur Book covering process synchronization, semaphores, deadlock handling, paging, and file systems.",
        "keywords": "operating systems silberschatz dinosaur processes paging memory",
        "cover": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&q=80"
    },
    {
        "title": "Modern Operating Systems",
        "author": "Andrew S. Tanenbaum",
        "category": "Operating Systems",
        "p12": "978013359162",
        "pub": "Pearson",
        "year": 2014,
        "copies": 7,
        "rack": "Rack OS-01, Shelf 2",
        "desc": "Deep architectural study of Unix, Linux, and Windows internals, virtualization, security, and multiple processor systems.",
        "keywords": "modern operating systems tanenbaum linux unix virtualization",
        "cover": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80"
    },
    {
        "title": "Operating Systems: Three Easy Pieces",
        "author": "Remzi H. Arpaci-Dusseau",
        "category": "Operating Systems",
        "p12": "978198508659",
        "pub": "Arpaci-Dusseau Books",
        "year": 2018,
        "copies": 8,
        "rack": "Rack OS-01, Shelf 3",
        "desc": "A brilliantly clear guide structured around the three core themes: Virtualization (CPU & Memory), Concurrency, and Persistence.",
        "keywords": "ostep virtualization concurrency persistence locks threads files",
        "cover": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80"
    },
    {
        "title": "Linux Kernel Development",
        "author": "Robert Love",
        "category": "Operating Systems",
        "p12": "978067232946",
        "pub": "Addison-Wesley",
        "year": 2010,
        "copies": 6,
        "rack": "Rack OS-01, Shelf 4",
        "desc": "Detailed guide to Linux kernel algorithms: CFS process scheduler, bottom halves, interrupt handlers, VFS, and slab allocators.",
        "keywords": "linux kernel development robert love vfs memory scheduler",
        "cover": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=80"
    },
    {
        "title": "The Linux Programming Interface",
        "author": "Michael Kerrisk",
        "category": "Operating Systems",
        "p12": "978159327220",
        "pub": "No Starch Press",
        "year": 2010,
        "copies": 6,
        "rack": "Rack OS-02, Shelf 1",
        "desc": "The definitive encyclopedic guide to Linux and UNIX system programming: signals, epoll, sockets, POSIX threads, and shared memory.",
        "keywords": "tlpi linux programming interface system calls posix kerrisk",
        "cover": "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=600&q=80"
    },
    {
        "title": "Understanding the Linux Kernel",
        "author": "Daniel P. Bovet",
        "category": "Operating Systems",
        "p12": "978059600565",
        "pub": "O'Reilly Media",
        "year": 2005,
        "copies": 5,
        "rack": "Rack OS-02, Shelf 2",
        "desc": "In-depth breakdown of Linux hardware interactions, page tables, kernel locks, process descriptors, and block device drivers.",
        "keywords": "linux kernel internals page tables memory management drivers",
        "cover": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80"
    },
    {
        "title": "UNIX and Linux System Administration Handbook",
        "author": "Evi Nemeth",
        "category": "Operating Systems",
        "p12": "978013427755",
        "pub": "Addison-Wesley",
        "year": 2017,
        "copies": 6,
        "rack": "Rack OS-02, Shelf 3",
        "desc": "The ultimate sysadmin guide: systemd, storage management, backups, DNS, mail servers, security audits, and automation.",
        "keywords": "sysadmin linux unix systemd storage networking nemeth",
        "cover": "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&q=80"
    },
    {
        "title": "Windows Internals, Part 1",
        "author": "Pavel Yosifovich",
        "category": "Operating Systems",
        "p12": "978073568418",
        "pub": "Microsoft Press",
        "year": 2017,
        "copies": 5,
        "rack": "Rack OS-02, Shelf 4",
        "desc": "Architecture, processes, threads, memory management, and security subsystems of the modern Windows kernel.",
        "keywords": "windows internals kernel nt executive processes threads yosifovich",
        "cover": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80"
    },
    {
        "title": "Systems Performance: Enterprise and the Cloud",
        "author": "Brendan Gregg",
        "category": "Operating Systems",
        "p12": "978013682015",
        "pub": "Addison-Wesley",
        "year": 2020,
        "copies": 6,
        "rack": "Rack OS-03, Shelf 1",
        "desc": "Mastering operating system profiling, eBPF tracing, CPU flame graphs, disk I/O latency, and kernel performance analysis.",
        "keywords": "brendan gregg systems performance ebpf profiling flame graphs",
        "cover": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80"
    },

    # 15. Algorithms and Data Structures (9 books)
    {
        "title": "Introduction to Algorithms (CLRS)",
        "author": "Thomas H. Cormen",
        "category": "Algorithms and Data Structures",
        "p12": "978026204630",
        "pub": "MIT Press",
        "year": 2022,
        "copies": 9,
        "rack": "Rack ALG-01, Shelf 1",
        "desc": "The essential MIT algorithms textbook: asymptotic analysis, sorting, Red-Black trees, dynamic programming, graphs, and flow.",
        "keywords": "clrs algorithms dynamic programming graphs trees sorting mit",
        "cover": "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&q=80"
    },
    {
        "title": "Algorithms (4th Edition)",
        "author": "Robert Sedgewick",
        "category": "Algorithms and Data Structures",
        "p12": "978032157351",
        "pub": "Addison-Wesley",
        "year": 2011,
        "copies": 8,
        "rack": "Rack ALG-01, Shelf 2",
        "desc": "Surveys the most important computer algorithms in use today: union-find, quicksort, priority queues, MST, and Dijkstra.",
        "keywords": "algorithms sedgewick graphs tries sorting priority queues",
        "cover": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80"
    },
    {
        "title": "The Algorithm Design Manual",
        "author": "Steven S. Skiena",
        "category": "Algorithms and Data Structures",
        "p12": "978303054255",
        "pub": "Springer",
        "year": 2020,
        "copies": 7,
        "rack": "Rack ALG-01, Shelf 3",
        "desc": "Practical algorithmic problem-solving with the Hitchhiker's Guide to Algorithms catalog and real-world war stories.",
        "keywords": "skiena algorithm design manual graph theory dynamic programming",
        "cover": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=80"
    },
    {
        "title": "Grokking Algorithms: An Illustrated Guide",
        "author": "Aditya Bhargava",
        "category": "Algorithms and Data Structures",
        "p12": "978161729223",
        "pub": "Manning Publications",
        "year": 2016,
        "copies": 8,
        "rack": "Rack ALG-01, Shelf 4",
        "desc": "A friendly, visual guide teaching binary search, big-O notation, recursion, hash tables, and Dijkstra's algorithm.",
        "keywords": "grokking algorithms visual binary search graphs recursion",
        "cover": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80"
    },
    {
        "title": "Competitive Programming 4",
        "author": "Steven Halim",
        "category": "Algorithms and Data Structures",
        "p12": "978981180327",
        "pub": "Lulu Press",
        "year": 2020,
        "copies": 6,
        "rack": "Rack ALG-02, Shelf 1",
        "desc": "Handbook for ICPC and Olympiad contestants: segment trees, Fenwick trees, max flow, computational geometry, and string matching.",
        "keywords": "competitive programming segment tree fenwick icpc leetcode",
        "cover": "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=600&q=80"
    },
    {
        "title": "Cracking the Coding Interview",
        "author": "Gayle Laakmann McDowell",
        "category": "Algorithms and Data Structures",
        "p12": "978098478285",
        "pub": "CareerCup",
        "year": 2015,
        "copies": 9,
        "rack": "Rack ALG-02, Shelf 2",
        "desc": "189 programming questions and solutions covering data structures, bit manipulation, recursion, system design, and Big-O.",
        "keywords": "cracking the coding interview leetcode algorithms data structures",
        "cover": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&q=80"
    },
    {
        "title": "Dynamic Programming for Coding Interviews",
        "author": "Meenakshi Kamal",
        "category": "Algorithms and Data Structures",
        "p12": "978148422557",
        "pub": "Apress",
        "year": 2017,
        "copies": 5,
        "rack": "Rack ALG-02, Shelf 3",
        "desc": "Bottom-up tabulation and top-down memoization patterns: knapsack, longest common subsequence, and matrix chain multiplication.",
        "keywords": "dynamic programming memoization tabulation knapsack lcs",
        "cover": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80"
    },
    {
        "title": "Advanced Data Structures",
        "author": "Peter Brass",
        "category": "Algorithms and Data Structures",
        "p12": "978052188037",
        "pub": "Cambridge University Press",
        "year": 2008,
        "copies": 5,
        "rack": "Rack ALG-02, Shelf 4",
        "desc": "Rigorous treatment of splay trees, Treaps, interval trees, suffix trees, geometric range searching, and persistent structures.",
        "keywords": "advanced data structures splay trees suffix trees interval trees",
        "cover": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80"
    },
    {
        "title": "Algorithm Design",
        "author": "Jon Kleinberg",
        "category": "Algorithms and Data Structures",
        "p12": "978032129535",
        "pub": "Pearson",
        "year": 2005,
        "copies": 6,
        "rack": "Rack ALG-03, Shelf 1",
        "desc": "Algorithm design paradigms: greedy algorithms, divide-and-conquer, network flow, NP-completeness, and approximation algorithms.",
        "keywords": "algorithm design kleinberg tardos greedy network flow np",
        "cover": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80"
    },

    # 16. Mathematics (9 books)
    {
        "title": "Linear Algebra Done Right",
        "author": "Sheldon Axler",
        "category": "Mathematics",
        "p12": "978331911079",
        "pub": "Springer",
        "year": 2015,
        "copies": 7,
        "rack": "Rack MATH-01, Shelf 1",
        "desc": "A coordinate-free approach to vector spaces, linear operators, eigenvalues, singular value decomposition (SVD), and inner products.",
        "keywords": "linear algebra axler vector spaces svd eigenvalues operators",
        "cover": "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&q=80"
    },
    {
        "title": "Mathematics for Machine Learning",
        "author": "Marc Peter Deisenroth",
        "category": "Mathematics",
        "p12": "978110845514",
        "pub": "Cambridge University Press",
        "year": 2020,
        "copies": 8,
        "rack": "Rack MATH-01, Shelf 2",
        "desc": "The foundational mathematical pillars of ML: analytic geometry, vector calculus, matrix decompositions, probability, and optimization.",
        "keywords": "math machine learning calculus linear algebra optimization probability",
        "cover": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80"
    },
    {
        "title": "Discrete Mathematics and Its Applications",
        "author": "Kenneth H. Rosen",
        "category": "Mathematics",
        "p12": "978125967651",
        "pub": "McGraw-Hill",
        "year": 2018,
        "copies": 7,
        "rack": "Rack MATH-01, Shelf 3",
        "desc": "Mathematical logic, proofs, set theory, combinatorics, graph theory, trees, and Boolean algebra.",
        "keywords": "discrete math rosen logic proofs combinatorics graph theory",
        "cover": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=80"
    },
    {
        "title": "Calculus: Early Transcendentals",
        "author": "James Stewart",
        "category": "Mathematics",
        "p12": "978130526726",
        "pub": "Cengage Learning",
        "year": 2015,
        "copies": 6,
        "rack": "Rack MATH-01, Shelf 4",
        "desc": "The premier college calculus textbook: limits, derivatives, integration, multivariable calculus, and vector fields.",
        "keywords": "calculus stewart derivatives integration multivariable vectors",
        "cover": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80"
    },
    {
        "title": "Introduction to Probability",
        "author": "Dimitri P. Bertsekas",
        "category": "Mathematics",
        "p12": "978188652923",
        "pub": "Athena Scientific",
        "year": 2008,
        "copies": 6,
        "rack": "Rack MATH-02, Shelf 1",
        "desc": "The acclaimed MIT introductory textbook on sample spaces, random variables, Bayes' rule, transforms, and limit theorems.",
        "keywords": "probability bertsekas random variables bayes conditioning mit",
        "cover": "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=600&q=80"
    },
    {
        "title": "Convex Optimization",
        "author": "Stephen Boyd",
        "category": "Mathematics",
        "p12": "978052183378",
        "pub": "Cambridge University Press",
        "year": 2004,
        "copies": 5,
        "rack": "Rack MATH-02, Shelf 2",
        "desc": "Convex sets, duality theory, unconstrained and constrained minimization, interior-point methods, and engineering applications.",
        "keywords": "convex optimization boyd duality interior point algorithms math",
        "cover": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&q=80"
    },
    {
        "title": "The Art of Probability",
        "author": "Richard W. Hamming",
        "category": "Mathematics",
        "p12": "978020140686",
        "pub": "CRC Press",
        "year": 1991,
        "copies": 5,
        "rack": "Rack MATH-02, Shelf 3",
        "desc": "Insightful conceptual foundations of probability, modeling, and statistical thinking by Turing Award winner Richard Hamming.",
        "keywords": "probability hamming modeling statistics turing award math",
        "cover": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80"
    },
    {
        "title": "Probability and Statistics for Engineering and the Sciences",
        "author": "Jay L. Devore",
        "category": "Mathematics",
        "p12": "978130525180",
        "pub": "Cengage Learning",
        "year": 2015,
        "copies": 6,
        "rack": "Rack MATH-02, Shelf 4",
        "desc": "Comprehensive engineering statistics: probability distributions, point estimation, confidence intervals, and ANOVA.",
        "keywords": "statistics devore engineering anova hypothesis testing math",
        "cover": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80"
    },
    {
        "title": "Concrete Mathematics: A Foundation for Computer Science",
        "author": "Ronald L. Graham",
        "category": "Mathematics",
        "p12": "978020155802",
        "pub": "Addison-Wesley",
        "year": 1994,
        "copies": 6,
        "rack": "Rack MATH-03, Shelf 1",
        "desc": "Co-authored by Donald Knuth: recurrent sums, binomial coefficients, generating functions, asymptotics, and discrete calculus.",
        "keywords": "knuth concrete math generating functions combinatorics asymptotics",
        "cover": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80"
    },

    # 17. Business (9 books)
    {
        "title": "The Lean Startup",
        "author": "Eric Ries",
        "category": "Business",
        "p12": "978030788789",
        "pub": "Crown Business",
        "year": 2011,
        "copies": 8,
        "rack": "Rack BUS-01, Shelf 1",
        "desc": "How constant innovation creates radically successful businesses using Build-Measure-Learn feedback loops and MVPs.",
        "keywords": "lean startup eric ries mvp entrepreneurship innovation business",
        "cover": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80"
    },
    {
        "title": "Zero to One: Notes on Startups, or How to Build the Future",
        "author": "Peter Thiel",
        "category": "Business",
        "p12": "978080413929",
        "pub": "Crown Business",
        "year": 2014,
        "copies": 8,
        "rack": "Rack BUS-01, Shelf 2",
        "desc": "How creating new value and monopoly power from technology breakthroughs builds enduring business advantage.",
        "keywords": "zero to one peter thiel startups monopoly venture capital",
        "cover": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80"
    },
    {
        "title": "Good to Great: Why Some Companies Make the Leap... and Others Don't",
        "author": "Jim Collins",
        "category": "Business",
        "p12": "978006662099",
        "pub": "HarperBusiness",
        "year": 2001,
        "copies": 7,
        "rack": "Rack BUS-01, Shelf 3",
        "desc": "The Hedgehog Concept, Level 5 Leadership, Flywheel effect, and rigorous management practices of elite enterprises.",
        "keywords": "good to great jim collins leadership strategy flywheel business",
        "cover": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&q=80"
    },
    {
        "title": "The Innovator's Dilemma",
        "author": "Clayton M. Christensen",
        "category": "Business",
        "p12": "978163369178",
        "pub": "Harvard Business Review Press",
        "year": 2016,
        "copies": 6,
        "rack": "Rack BUS-01, Shelf 4",
        "desc": "The revolutionary theory of disruptive innovation explaining how market leaders get blindsided by low-end technologies.",
        "keywords": "innovators dilemma disruptive innovation christensen strategy",
        "cover": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80"
    },
    {
        "title": "Blue Ocean Strategy",
        "author": "W. Chan Kim",
        "category": "Business",
        "p12": "978162527449",
        "pub": "Harvard Business Review Press",
        "year": 2015,
        "copies": 7,
        "rack": "Rack BUS-02, Shelf 1",
        "desc": "How to create uncontested market space and make the competition irrelevant by shifting value curves.",
        "keywords": "blue ocean strategy value innovation marketing competition",
        "cover": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80"
    },
    {
        "title": "Hard Drive: Bill Gates and the Making of the Microsoft Empire",
        "author": "James Wallace",
        "category": "Business",
        "p12": "978047156886",
        "pub": "Wiley",
        "year": 1993,
        "copies": 5,
        "rack": "Rack BUS-02, Shelf 2",
        "desc": "The unauthorized, riveting chronicle of how Bill Gates steered Microsoft to dominate the personal computer software industry.",
        "keywords": "bill gates microsoft biography business tech history",
        "cover": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80"
    },
    {
        "title": "Blitzscaling: The Lightning-Fast Path to Building Massively Valuable Companies",
        "author": "Reid Hoffman",
        "category": "Business",
        "p12": "978152476141",
        "pub": "Currency",
        "year": 2018,
        "copies": 6,
        "rack": "Rack BUS-02, Shelf 3",
        "desc": "Techniques for scaling startups at hyper-speed when efficiency matters less than speed in winner-take-all markets.",
        "keywords": "blitzscaling reid hoffman startups hypergrowth tech business",
        "cover": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&q=80"
    },
    {
        "title": "The Personal MBA: Master the Art of Business",
        "author": "Josh Kaufman",
        "category": "Business",
        "p12": "978159184557",
        "pub": "Portfolio",
        "year": 2012,
        "copies": 7,
        "rack": "Rack BUS-02, Shelf 4",
        "desc": "A comprehensive primer covering value creation, marketing, sales, value delivery, and financial analysis.",
        "keywords": "personal mba business finance marketing sales value creation",
        "cover": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80"
    },
    {
        "title": "Crossing the Chasm",
        "author": "Geoffrey A. Moore",
        "category": "Business",
        "p12": "978006229298",
        "pub": "HarperBusiness",
        "year": 2014,
        "copies": 6,
        "rack": "Rack BUS-03, Shelf 1",
        "desc": "Marketing and selling disruptive high-tech products to mainstream customers across the adoption chasm.",
        "keywords": "crossing the chasm tech marketing product adoption mainstream",
        "cover": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80"
    },

    # 18. Management (9 books)
    {
        "title": "High Output Management",
        "author": "Andrew S. Grove",
        "category": "Management",
        "p12": "978067976288",
        "pub": "Vintage",
        "year": 1995,
        "copies": 8,
        "rack": "Rack MGT-01, Shelf 1",
        "desc": "Former Intel CEO Andy Grove's masterwork on operational leverage, managerial output, meetings, and performance reviews.",
        "keywords": "high output management andy grove okrs leadership operations",
        "cover": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&q=80"
    },
    {
        "title": "Measure What Matters: How Google, Bono, and the Gates Foundation Rock the World with OKRs",
        "author": "John Doerr",
        "category": "Management",
        "p12": "978052553622",
        "pub": "Portfolio",
        "year": 2018,
        "copies": 7,
        "rack": "Rack MGT-01, Shelf 2",
        "desc": "How Objectives and Key Results (OKRs) drive laser focus, alignment, transparency, and explosive organizational growth.",
        "keywords": "okrs measure what matters john doerr google management goals",
        "cover": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80"
    },
    {
        "title": "The Hard Thing About Hard Things",
        "author": "Ben Horowitz",
        "category": "Management",
        "p12": "978006227320",
        "pub": "HarperBusiness",
        "year": 2014,
        "copies": 8,
        "rack": "Rack MGT-01, Shelf 3",
        "desc": "Brutally honest insights on building and running a tech startup through crises, layoffs, executive hiring, and tough decisions.",
        "keywords": "hard things ben horowitz a16z leadership crisis management",
        "cover": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80"
    },
    {
        "title": "Radical Candor: Be a Kick-Ass Boss Without Losing Your Humanity",
        "author": "Kim Scott",
        "category": "Management",
        "p12": "978125023537",
        "pub": "St. Martin's Press",
        "year": 2019,
        "copies": 7,
        "rack": "Rack MGT-01, Shelf 4",
        "desc": "How to care personally while challenging directly to give effective feedback and build collaborative, high-trust teams.",
        "keywords": "radical candor kim scott feedback leadership team building",
        "cover": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80"
    },
    {
        "title": "The Making of a Manager",
        "author": "Julie Zhuo",
        "category": "Management",
        "p12": "978073521956",
        "pub": "Portfolio",
        "year": 2019,
        "copies": 7,
        "rack": "Rack MGT-02, Shelf 1",
        "desc": "What to do when everyone looks to you: leading 1-on-1s, giving constructive feedback, hiring, and building team culture.",
        "keywords": "making of a manager julie zhuo 1-on-1s feedback hiring culture",
        "cover": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&q=80"
    },
    {
        "title": "Turn the Ship Around!: A True Story of Building Leaders by Breaking the Rules",
        "author": "L. David Marquet",
        "category": "Management",
        "p12": "978159184640",
        "pub": "Portfolio",
        "year": 2013,
        "copies": 6,
        "rack": "Rack MGT-02, Shelf 2",
        "desc": "Empowerment through the leader-leader model on a nuclear submarine: creating control, competence, and clarity.",
        "keywords": "turn the ship around david marquet leadership intent-based",
        "cover": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80"
    },
    {
        "title": "An Elegant Puzzle: Systems of Engineering Management",
        "author": "Will Larson",
        "category": "Management",
        "p12": "978173226518",
        "pub": "Stripe Press",
        "year": 2019,
        "copies": 6,
        "rack": "Rack MGT-02, Shelf 3",
        "desc": "A systems approach to engineering management: organizational design, team sizing, sizing migrations, and technical debt.",
        "keywords": "engineering management will larson stripe press systems org design",
        "cover": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80"
    },
    {
        "title": "The Effective Executive",
        "author": "Peter F. Drucker",
        "category": "Management",
        "p12": "978006083345",
        "pub": "HarperBusiness",
        "year": 2006,
        "copies": 6,
        "rack": "Rack MGT-02, Shelf 4",
        "desc": "The definitive classic on time management, making effective decisions, capitalizing on strengths, and prioritizing results.",
        "keywords": "effective executive peter drucker time management decision making",
        "cover": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80"
    },
    {
        "title": "Creativity, Inc.: Overcoming the Unseen Forces That Stand in the Way of True Inspiration",
        "author": "Ed Catmull",
        "category": "Management",
        "p12": "978081299301",
        "pub": "Random House",
        "year": 2014,
        "copies": 7,
        "rack": "Rack MGT-03, Shelf 1",
        "desc": "Pixar co-founder Ed Catmull on nurturing creative talent, candor in Braintrust meetings, and postmortems.",
        "keywords": "creativity inc pixar ed catmull leadership culture braintrust",
        "cover": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&q=80"
    },

    # 19. Economics (9 books)
    {
        "title": "Thinking, Fast and Slow",
        "author": "Daniel Kahneman",
        "category": "Economics",
        "p12": "978037453355",
        "pub": "Farrar, Straus and Giroux",
        "year": 2011,
        "copies": 8,
        "rack": "Rack ECON-01, Shelf 1",
        "desc": "Nobel laureate Daniel Kahneman explores the two systems driving human judgment: fast intuitive System 1 and deliberate System 2.",
        "keywords": "behavioral economics kahneman biases cognitive heuristics",
        "cover": "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&q=80"
    },
    {
        "title": "Nudge: Improving Decisions About Health, Wealth, and Happiness",
        "author": "Richard H. Thaler",
        "category": "Economics",
        "p12": "978014311526",
        "pub": "Penguin Books",
        "year": 2009,
        "copies": 7,
        "rack": "Rack ECON-01, Shelf 2",
        "desc": "How choice architecture and behavioral nudges influence better decision-making without restricting individual freedom.",
        "keywords": "nudge thaler behavioral economics choice architecture incentives",
        "cover": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80"
    },
    {
        "title": "Freakonomics: A Rogue Economist Explores the Hidden Side of Everything",
        "author": "Steven D. Levitt",
        "category": "Economics",
        "p12": "978006073133",
        "pub": "William Morrow",
        "year": 2005,
        "copies": 8,
        "rack": "Rack ECON-01, Shelf 3",
        "desc": "Using empirical economics to unravel curious phenomena, incentives, cheating sumo wrestlers, and real estate agents.",
        "keywords": "freakonomics levitt dubner incentives empirical economics",
        "cover": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80"
    },
    {
        "title": "Principles for Dealing with the Changing World Order",
        "author": "Ray Dalio",
        "category": "Economics",
        "p12": "978198216027",
        "pub": "Avid Reader Press",
        "year": 2021,
        "copies": 7,
        "rack": "Rack ECON-01, Shelf 4",
        "desc": "Ray Dalio examines 500 years of economic cycles, debt crises, reserve currency transitions, and geopolitical shifts.",
        "keywords": "ray dalio world order economics debt cycles financial markets",
        "cover": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&q=80"
    },
    {
        "title": "Capital in the Twenty-First Century",
        "author": "Thomas Piketty",
        "category": "Economics",
        "p12": "978067443000",
        "pub": "Belknap Press",
        "year": 2014,
        "copies": 6,
        "rack": "Rack ECON-02, Shelf 1",
        "desc": "Historical data on wealth distribution, capital returns (r > g), and income inequality across two centuries.",
        "keywords": "capital piketty inequality wealth distribution macroeconomics",
        "cover": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80"
    },
    {
        "title": "The Wealth of Nations",
        "author": "Adam Smith",
        "category": "Economics",
        "p12": "978055358597",
        "pub": "Bantam Classics",
        "year": 2003,
        "copies": 6,
        "rack": "Rack ECON-02, Shelf 2",
        "desc": "The foundational classic of modern economics on the invisible hand, division of labor, free markets, and productivity.",
        "keywords": "adam smith wealth of nations invisible hand free markets",
        "cover": "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&q=80"
    },
    {
        "title": "Misbehaving: The Making of Behavioral Economics",
        "author": "Richard H. Thaler",
        "category": "Economics",
        "p12": "978039335279",
        "pub": "W. W. Norton & Company",
        "year": 2016,
        "copies": 6,
        "rack": "Rack ECON-02, Shelf 3",
        "desc": "The intellectual history of bringing human psychology into economic models of market behavior and asset pricing.",
        "keywords": "behavioral economics thaler misbehaving psychology finance",
        "cover": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80"
    },
    {
        "title": "Poor Economics: A Radical Rethinking of the Way to Fight Global Poverty",
        "author": "Abhijit V. Banerjee",
        "category": "Economics",
        "p12": "978161039160",
        "pub": "PublicAffairs",
        "year": 2012,
        "copies": 6,
        "rack": "Rack ECON-02, Shelf 4",
        "desc": "Nobel laureates Banerjee and Duflo apply randomized controlled trials (RCTs) to global poverty alleviation and education.",
        "keywords": "poor economics banerjee duflo rct development poverty",
        "cover": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80"
    },
    {
        "title": "Economics in One Lesson",
        "author": "Henry Hazlitt",
        "category": "Economics",
        "p12": "978051754823",
        "pub": "Currency",
        "year": 1988,
        "copies": 6,
        "rack": "Rack ECON-03, Shelf 1",
        "desc": "A timeless classic exposing the unseen secondary consequences of government price controls, tariffs, and subsidies.",
        "keywords": "economics one lesson hazlitt free market broken window fallacy",
        "cover": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&q=80"
    },

    # 20. General Knowledge (9 books)
    {
        "title": "Sapiens: A Brief History of Humankind",
        "author": "Yuval Noah Harari",
        "category": "General Knowledge",
        "p12": "978006231609",
        "pub": "Harper",
        "year": 2015,
        "copies": 9,
        "rack": "Rack GK-01, Shelf 1",
        "desc": "The international phenomenon detailing the Cognitive, Agricultural, and Scientific Revolutions that shaped human civilization.",
        "keywords": "sapiens yuval noah harari anthropology history cognitive evolution",
        "cover": "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&q=80"
    },
    {
        "title": "A Short History of Nearly Everything",
        "author": "Bill Bryson",
        "category": "General Knowledge",
        "p12": "978076790818",
        "pub": "Broadway Books",
        "year": 2004,
        "copies": 8,
        "rack": "Rack GK-01, Shelf 2",
        "desc": "A delightfully witty journey through physics, geology, paleontology, and astronomy from the Big Bang to the rise of humanity.",
        "keywords": "bill bryson science history big bang geology astronomy physics",
        "cover": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80"
    },
    {
        "title": "Cosmos",
        "author": "Carl Sagan",
        "category": "General Knowledge",
        "p12": "978034553943",
        "pub": "Ballantine Books",
        "year": 2013,
        "copies": 8,
        "rack": "Rack GK-01, Shelf 3",
        "desc": "Carl Sagan's poetic exploration of the universe, planetary science, human history, and our search for extraterrestrial life.",
        "keywords": "cosmos carl sagan astronomy universe science planetary exploration",
        "cover": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80"
    },
    {
        "title": "Guns, Germs, and Steel: The Fates of Human Societies",
        "author": "Jared Diamond",
        "category": "General Knowledge",
        "p12": "978039335432",
        "pub": "W. W. Norton & Company",
        "year": 2017,
        "copies": 7,
        "rack": "Rack GK-01, Shelf 4",
        "desc": "Pulitzer Prize winner examining how geography, food production, and ecology determined the divergent fates of human societies.",
        "keywords": "guns germs steel jared diamond geography history anthropology",
        "cover": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80"
    },
    {
        "title": "The Gene: An Intimate History",
        "author": "Siddhartha Mukherjee",
        "category": "General Knowledge",
        "p12": "978147673352",
        "pub": "Scribner",
        "year": 2016,
        "copies": 7,
        "rack": "Rack GK-02, Shelf 1",
        "desc": "The epic story of the birth, growth, and future of genetics from Mendel and Darwin to CRISPR gene editing.",
        "keywords": "the gene siddhartha mukherjee genetics crispr dna biology",
        "cover": "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&q=80"
    },
    {
        "title": "Prisoners of Geography: Ten Maps That Tell You Everything You Need to Know About Global Politics",
        "author": "Tim Marshall",
        "category": "General Knowledge",
        "p12": "978150112147",
        "pub": "Scribner",
        "year": 2016,
        "copies": 7,
        "rack": "Rack GK-02, Shelf 2",
        "desc": "How rivers, mountains, and plains constrain geopolitical decisions of world superpowers across Russia, China, and the US.",
        "keywords": "geopolitics tim marshall geography maps world politics",
        "cover": "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&q=80"
    },
    {
        "title": "The Selfish Gene",
        "author": "Richard Dawkins",
        "category": "General Knowledge",
        "p12": "978019878860",
        "pub": "Oxford University Press",
        "year": 2016,
        "copies": 6,
        "rack": "Rack GK-02, Shelf 3",
        "desc": "Dawkins' revolutionary gene-centric view of evolution, altruism, kin selection, and the introduction of the concept of memes.",
        "keywords": "selfish gene dawkins evolution biology genetics memes",
        "cover": "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&q=80"
    },
    {
        "title": "A Brief History of Time",
        "author": "Stephen Hawking",
        "category": "General Knowledge",
        "p12": "978055338016",
        "pub": "Bantam",
        "year": 1998,
        "copies": 8,
        "rack": "Rack GK-02, Shelf 4",
        "desc": "Stephen Hawking's landmark exploration of black holes, general relativity, quantum mechanics, and the arrow of time.",
        "keywords": "stephen hawking time black holes cosmology physics relativity",
        "cover": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80"
    },
    {
        "title": "The Structure of Scientific Revolutions",
        "author": "Thomas S. Kuhn",
        "category": "General Knowledge",
        "p12": "978022645812",
        "pub": "University of Chicago Press",
        "year": 2012,
        "copies": 6,
        "rack": "Rack GK-03, Shelf 1",
        "desc": "The groundbreaking philosophy text introducing paradigm shifts, normal science, and the nature of scientific progress.",
        "keywords": "thomas kuhn paradigm shift science philosophy revolution",
        "cover": "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&q=80"
    },

    # 21. Fiction (9 books)
    {
        "title": "Dune",
        "author": "Frank Herbert",
        "category": "Fiction",
        "p12": "978044117271",
        "pub": "Ace Books",
        "year": 1990,
        "copies": 8,
        "rack": "Rack FIC-01, Shelf 1",
        "desc": "The greatest sci-fi epic of all time set on Arrakis: ecology, spice melange, prophecy, galactic politics, and the Fremen.",
        "keywords": "dune frank herbert sci-fi arrakis spice sandworms space",
        "cover": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80"
    },
    {
        "title": "1984",
        "author": "George Orwell",
        "category": "Fiction",
        "p12": "978045152493",
        "pub": "Signet Classic",
        "year": 1961,
        "copies": 9,
        "rack": "Rack FIC-01, Shelf 2",
        "desc": "The haunting dystopian masterpiece warning against totalitarian surveillance, Big Brother, doublethink, and Newspeak.",
        "keywords": "1984 george orwell dystopia big brother surveillance fiction",
        "cover": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80"
    },
    {
        "title": "Neuromancer",
        "author": "William Gibson",
        "category": "Fiction",
        "p12": "978044156959",
        "pub": "Ace Books",
        "year": 1984,
        "copies": 7,
        "rack": "Rack FIC-01, Shelf 3",
        "desc": "The cyberpunk masterpiece that coined the term 'Cyberspace': matrix console cowboys, AI constructs, and megacorporations.",
        "keywords": "neuromancer cyberpunk william gibson ai cyberspace matrix",
        "cover": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80"
    },
    {
        "title": "The Three-Body Problem",
        "author": "Cixin Liu",
        "category": "Fiction",
        "p12": "978076538203",
        "pub": "Tor Books",
        "year": 2014,
        "copies": 8,
        "rack": "Rack FIC-01, Shelf 4",
        "desc": "Hugo Award-winning hard sci-fi exploring first contact, the Dark Forest theory, and Trisolaran civilization.",
        "keywords": "three-body problem cixin liu sci-fi aliens physics dark forest",
        "cover": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80"
    },
    {
        "title": "Foundation",
        "author": "Isaac Asimov",
        "category": "Fiction",
        "p12": "978055329335",
        "pub": "Spectra",
        "year": 1991,
        "copies": 7,
        "rack": "Rack FIC-02, Shelf 1",
        "desc": "Isaac Asimov's grand galactic empire saga of Hari Seldon and psychohistory predicting the fall of civilization.",
        "keywords": "foundation isaac asimov psychohistory space opera sci-fi",
        "cover": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80"
    },
    {
        "title": "Brave New World",
        "author": "Aldous Huxley",
        "category": "Fiction",
        "p12": "978006085052",
        "pub": "Harper Perennial",
        "year": 2006,
        "copies": 7,
        "rack": "Rack FIC-02, Shelf 2",
        "desc": "A prophetic vision of a technologically conditioned society enslaved by conditioning, consumerism, and the drug Soma.",
        "keywords": "brave new world aldous huxley dystopia soma conditioning",
        "cover": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80"
    },
    {
        "title": "Snow Crash",
        "author": "Neal Stephenson",
        "category": "Fiction",
        "p12": "978055338095",
        "pub": "Spectra",
        "year": 2000,
        "copies": 7,
        "rack": "Rack FIC-02, Shelf 3",
        "desc": "Fast-paced cyberpunk thriller introducing the Metaverse, Sumerian mythology, pizza delivery, and computer viruses.",
        "keywords": "snow crash metaverse neal stephenson cyberpunk virtual reality",
        "cover": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80"
    },
    {
        "title": "Fahrenheit 451",
        "author": "Ray Bradbury",
        "category": "Fiction",
        "p12": "978145167331",
        "pub": "Simon & Schuster",
        "year": 2012,
        "copies": 8,
        "rack": "Rack FIC-02, Shelf 4",
        "desc": "The poignant story of a fireman whose job is to burn books in a future where literature and free thought are outlawed.",
        "keywords": "fahrenheit 451 ray bradbury censorship books literature",
        "cover": "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&q=80"
    },
    {
        "title": "Do Androids Dream of Electric Sheep?",
        "author": "Philip K. Dick",
        "category": "Fiction",
        "p12": "978034540447",
        "pub": "Del Rey",
        "year": 1996,
        "copies": 7,
        "rack": "Rack FIC-03, Shelf 1",
        "desc": "The philosophical basis for Blade Runner: Rick Deckard's hunt for rogue Nexus-6 replicants in a dystopian post-nuclear world.",
        "keywords": "blade runner philip k dick replicants androids sci-fi empathy",
        "cover": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80"
    },

    # 22. Self-Development (11 books to make total = exactly 200)
    {
        "title": "Atomic Habits: An Easy & Proven Way to Build Good Habits & Break Bad Ones",
        "author": "James Clear",
        "category": "Self-Development",
        "p12": "978073521129",
        "pub": "Avery",
        "year": 2018,
        "copies": 9,
        "rack": "Rack SLF-01, Shelf 1",
        "desc": "The definitive guide on 1% compound improvements, habit loops (Cue, Craving, Response, Reward), and environment design.",
        "keywords": "atomic habits james clear habit formation productivity mindset",
        "cover": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80"
    },
    {
        "title": "Deep Work: Rules for Focused Success in a Distracted World",
        "author": "Cal Newport",
        "category": "Self-Development",
        "p12": "978145558669",
        "pub": "Grand Central Publishing",
        "year": 2016,
        "copies": 8,
        "rack": "Rack SLF-01, Shelf 2",
        "desc": "Cultivating intense concentration, eliminating shallow distractions, and producing elite cognitive work.",
        "keywords": "deep work cal newport focus productivity concentration time",
        "cover": "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&q=80"
    },
    {
        "title": "The 7 Habits of Highly Effective People",
        "author": "Stephen R. Covey",
        "category": "Self-Development",
        "p12": "978198213727",
        "pub": "Simon & Schuster",
        "year": 2020,
        "copies": 8,
        "rack": "Rack SLF-01, Shelf 3",
        "desc": "Character-ethic principles: proactivity, beginning with the end in mind, prioritizing first things, and seeking synergy.",
        "keywords": "7 habits covey effectiveness leadership personal growth",
        "cover": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80"
    },
    {
        "title": "Can't Hurt Me: Master Your Mind and Defy the Odds",
        "author": "David Goggins",
        "category": "Self-Development",
        "p12": "978154451228",
        "pub": "Lioncrest Publishing",
        "year": 2018,
        "copies": 8,
        "rack": "Rack SLF-01, Shelf 4",
        "desc": "Navy SEAL David Goggins on mental toughness, the 40% rule, callous your mind, and pushing past physical suffering.",
        "keywords": "david goggins mental toughness resilience discipline grit",
        "cover": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&q=80"
    },
    {
        "title": "Mindset: The New Psychology of Success",
        "author": "Carol S. Dweck",
        "category": "Self-Development",
        "p12": "978034547232",
        "pub": "Ballantine Books",
        "year": 2007,
        "copies": 7,
        "rack": "Rack SLF-02, Shelf 1",
        "desc": "Stanford psychologist Carol Dweck shows how adopting a growth mindset unleashes potential in learning, sports, and business.",
        "keywords": "growth mindset dweck psychology learning resilience success",
        "cover": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80"
    },
    {
        "title": "Peak: Secrets from the New Science of Expertise",
        "author": "Anders Ericsson",
        "category": "Self-Development",
        "p12": "978054494722",
        "pub": "Eamon Dolan/Mariner Books",
        "year": 2017,
        "copies": 6,
        "rack": "Rack SLF-02, Shelf 2",
        "desc": "The groundbreaking science of deliberate practice, mental representations, and how anyone can develop world-class mastery.",
        "keywords": "deliberate practice anders ericsson mastery expertise skill",
        "cover": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80"
    },
    {
        "title": "Essentialism: The Disciplined Pursuit of Less",
        "author": "Greg McKeown",
        "category": "Self-Development",
        "p12": "978080413738",
        "pub": "Crown Business",
        "year": 2014,
        "copies": 7,
        "rack": "Rack SLF-02, Shelf 3",
        "desc": "Focusing only on the vital few activities to make the highest possible contribution by systematically saying no.",
        "keywords": "essentialism greg mckeown priority focus productivity minimalism",
        "cover": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80"
    },
    {
        "title": "Grit: The Power of Passion and Perseverance",
        "author": "Angela Duckworth",
        "category": "Self-Development",
        "p12": "978150111110",
        "pub": "Scribner",
        "year": 2016,
        "copies": 7,
        "rack": "Rack SLF-02, Shelf 4",
        "desc": "Pioneering psychologist Angela Duckworth shows that secret to outstanding achievement is not talent but sustained passion and grit.",
        "keywords": "grit angela duckworth perseverance passion achievement psychology",
        "cover": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&q=80"
    },
    {
        "title": "Make It Stick: The Science of Successful Learning",
        "author": "Peter C. Brown",
        "category": "Self-Development",
        "p12": "978067472901",
        "pub": "Belknap Press",
        "year": 2014,
        "copies": 7,
        "rack": "Rack SLF-03, Shelf 1",
        "desc": "Cognitive psychology insights: retrieval practice, spaced repetition, interleaving, and elaboration for long-term memory.",
        "keywords": "make it stick spaced repetition retrieval practice learning memory",
        "cover": "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&q=80"
    },
    {
        "title": "So Good They Can't Ignore You",
        "author": "Cal Newport",
        "category": "Self-Development",
        "p12": "978145550912",
        "pub": "Grand Central Publishing",
        "year": 2012,
        "copies": 6,
        "rack": "Rack SLF-03, Shelf 2",
        "desc": "Why following your passion is bad advice: building rare career capital through the craftsman mindset and deliberate practice.",
        "keywords": "career capital cal newport craftsman mindset mastery work",
        "cover": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80"
    },
    {
        "title": "The Psychology of Money: Timeless Lessons on Wealth, Greed, and Happiness",
        "author": "Morgan Housel",
        "category": "Self-Development",
        "p12": "978085719768",
        "pub": "Harriman House",
        "year": 2020,
        "copies": 8,
        "rack": "Rack SLF-03, Shelf 3",
        "desc": "19 short stories exploring the strange ways people think about money, personal finance, compounding, and financial freedom.",
        "keywords": "psychology of money morgan housel finance compounding wealth",
        "cover": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80"
    }
]

def add_200_books():
    db = SessionLocal()
    print(f"Starting addition of {len(RAW_BOOKS)} realistic sample books...")

    # 1. Ensure all categories exist or map gracefully
    category_map = {}
    for c_def in CATEGORIES_DEF:
        cat = db.query(Category).filter(
            (Category.name == c_def["name"]) | (Category.slug == c_def["slug"])
        ).first()
        if not cat:
            # Generate unique slug if existing collision
            slug = c_def["slug"]
            existing_slug = db.query(Category).filter(Category.slug == slug).first()
            if existing_slug:
                slug = f"{slug}-domain"
            cat = Category(
                name=c_def["name"],
                slug=slug,
                icon=c_def["icon"],
                description=c_def["desc"]
            )
            db.add(cat)
            db.commit()
            db.refresh(cat)
            print(f"Created Category: {cat.name} (ID: {cat.id})")
        category_map[c_def["name"]] = cat

    # Also map all database categories
    all_cats = db.query(Category).all()
    for c in all_cats:
        category_map[c.name] = c

    # 2. Check existing books and calculate starting QR code number
    existing_books = db.query(Book).all()
    existing_isbns = set(b.isbn for b in existing_books)
    existing_titles = set(b.title.lower() for b in existing_books)
    max_existing_id = max([b.id for b in existing_books], default=0)
    print(f"Existing books in DB: {len(existing_books)} (Highest ID: {max_existing_id})")

    author_cache = {a.name: a for a in db.query(Author).all()}
    
    added_count = 0
    skipped_count = 0
    created_copies_count = 0

    for i, b_data in enumerate(RAW_BOOKS):
        # Calculate valid ISBN-13
        isbn13 = calc_isbn13(b_data["p12"])

        # Check duplicate by title or ISBN
        if b_data["title"].lower() in existing_titles or isbn13 in existing_isbns:
            print(f"Skipping existing book: {b_data['title']} (ISBN: {isbn13})")
            skipped_count += 1
            continue

        # Get or create Author
        author_name = b_data["author"]
        if author_name not in author_cache:
            author = Author(name=author_name)
            db.add(author)
            db.commit()
            db.refresh(author)
            author_cache[author_name] = author
        else:
            author = author_cache[author_name]

        # Resolve category
        cat_name = b_data["category"]
        category = category_map.get(cat_name)
        if not category:
            # Fallback if category name slight mismatch
            category = db.query(Category).first()

        # Sequential QR code
        qr_seq = max_existing_id + added_count + 1
        qr_code_str = f"LIB-BOOK-{qr_seq:04d}"

        # Create Book
        new_book = Book(
            title=b_data["title"],
            author_id=author.id,
            category_id=category.id,
            isbn=isbn13,
            qr_code=qr_code_str,
            shelf_location=b_data.get("rack", "Rack A-01, Shelf 1"),
            description=b_data["desc"],
            publisher=b_data.get("pub", "Academic Press"),
            publication_year=b_data.get("year", 2022),
            total_copies=b_data.get("copies", 5),
            available_copies=b_data.get("copies", 5),
            cover_image=b_data.get("cover", "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80"),
            keywords=b_data.get("keywords", "general education")
        )
        db.add(new_book)
        db.commit()
        db.refresh(new_book)

        # Create individual physical BookCopies
        for c_idx in range(1, new_book.total_copies + 1):
            copy = BookCopy(
                book_id=new_book.id,
                barcode=f"BC-{new_book.id:04d}-{c_idx:02d}",
                status="AVAILABLE"
            )
            db.add(copy)
            created_copies_count += 1

        db.commit()
        existing_isbns.add(isbn13)
        existing_titles.add(b_data["title"].lower())
        added_count += 1

    total_in_db = db.query(Book).count()
    print(f"\n========================================================")
    print(f"SUCCESS: Added {added_count} new books ({created_copies_count} individual physical copies).")
    print(f"Skipped {skipped_count} existing duplicates.")
    print(f"Total Books now in Library Database: {total_in_db}")
    print(f"========================================================\n")
    db.close()

if __name__ == "__main__":
    add_200_books()
