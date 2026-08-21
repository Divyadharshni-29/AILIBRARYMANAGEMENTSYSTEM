"""
AI-Powered College Library Management System
College Expansion & Physical Location Migration Script
- Preserves all existing 803 books and creates ~100 new books (50 Business & Leadership + 50 Software Engineering).
- Backfills physical library locations (Building, Floor, Section, Shelf, Rack) for all books.
- Resets demo borrowing state to ZERO (Borrowed = 0, Overdue = 0, Available = Total Copies).
- Re-indexes AI TF-IDF NLP Search & Recommendation matrix.
"""

import sys
import re
import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_
from backend.app.database import engine, SessionLocal, Base
from backend.app.models.entities import (
    Book, Author, Category, BookCopy, Transaction, Fine, Payment, Notification,
    LibraryLocation, Rating, Feedback
)
from backend.app.ai.content_based import content_recommender
from backend.app.ai.nlp_search import nlp_search_engine

# --- 50 Realistic Business & Leadership Books ---
BUSINESS_LEADERSHIP_BOOKS = [
    {
        "title": "Good to Great: Why Some Companies Make the Leap and Others Don't",
        "author": "Jim Collins",
        "isbn": "978-0066620992",
        "publisher": "HarperBusiness",
        "publication_year": 2001,
        "language": "English",
        "copies": 6,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-A",
        "rack": "Rack BUS-01",
        "description": "Examines how ordinary companies make the transition to lasting greatness and outshine their competitors through Level 5 Leadership and the Hedgehog Concept.",
        "keywords": "business, leadership, strategy, management, organizational growth, hedgehog concept"
    },
    {
        "title": "The Effective Executive: The Definitive Guide to Getting the Right Things Done",
        "author": "Peter F. Drucker",
        "isbn": "978-0060834340",
        "publisher": "HarperBusiness",
        "publication_year": 2006,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-A",
        "rack": "Rack BUS-01",
        "description": "Essential management principles for executives, focusing on time management, decision making, strengths mobilization, and prioritizing effectiveness.",
        "keywords": "management, executive leadership, productivity, time management, decision making"
    },
    {
        "title": "The Lean Startup: How Today's Entrepreneurs Use Continuous Innovation",
        "author": "Eric Ries",
        "isbn": "978-0307887894",
        "publisher": "Crown Business",
        "publication_year": 2011,
        "language": "English",
        "copies": 6,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-A",
        "rack": "Rack BUS-02",
        "description": "A pioneering approach to business that leverages validated learning, rapid prototyping, Minimum Viable Product (MVP), and agile iteration.",
        "keywords": "startup, entrepreneurship, lean, MVP, innovation, business agility"
    },
    {
        "title": "Zero to One: Notes on Startups, or How to Build the Future",
        "author": "Peter Thiel & Blake Masters",
        "isbn": "978-0804139298",
        "publisher": "Crown Currency",
        "publication_year": 2014,
        "language": "English",
        "copies": 6,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-A",
        "rack": "Rack BUS-02",
        "description": "Philosophy and strategy for modern tech entrepreneurs on escaping competition, creating proprietary value, and building monopolies.",
        "keywords": "entrepreneurship, technology, monopoly, venture capital, startup strategy"
    },
    {
        "title": "Start with Why: How Great Leaders Inspire Everyone to Take Action",
        "author": "Simon Sinek",
        "isbn": "978-1591846444",
        "publisher": "Portfolio",
        "publication_year": 2009,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-A",
        "rack": "Rack BUS-03",
        "description": "Introduces the Golden Circle model of inspirational leadership, showing why articulating the core 'Why' moves people to achieve remarkable results.",
        "keywords": "leadership, motivation, inspiration, golden circle, team culture"
    },
    {
        "title": "Leaders Eat Last: Why Some Teams Pull Together and Others Don't",
        "author": "Simon Sinek",
        "isbn": "978-1591845324",
        "publisher": "Portfolio",
        "publication_year": 2014,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-A",
        "rack": "Rack BUS-03",
        "description": "Explores how great leaders build a 'Circle of Safety' fostering trust, biological cooperation, psychological safety, and collective resilience.",
        "keywords": "leadership, team building, trust, organizational culture, psychology"
    },
    {
        "title": "The Intelligent Investor: The Definitive Book on Value Investing",
        "author": "Benjamin Graham",
        "isbn": "978-0060555665",
        "publisher": "HarperBusiness",
        "publication_year": 2003,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-A",
        "rack": "Rack BUS-04",
        "description": "The foundational bible of value investing, introducing the concept of Margin of Safety and disciplined risk management for long-term financial success.",
        "keywords": "finance, investing, value investing, stocks, portfolio management, economics"
    },
    {
        "title": "Competitive Strategy: Techniques for Analyzing Industries and Competitors",
        "author": "Michael E. Porter",
        "isbn": "978-0684841489",
        "publisher": "Free Press",
        "publication_year": 1998,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-A",
        "rack": "Rack BUS-04",
        "description": "The classic framework introducing the Five Forces analysis, cost leadership, differentiation, and competitive positioning across industries.",
        "keywords": "strategy, competitive analysis, five forces, economics, market dynamics"
    },
    {
        "title": "The Innovator's Dilemma: When New Technologies Cause Great Firms to Fail",
        "author": "Clayton M. Christensen",
        "isbn": "978-1633691780",
        "publisher": "Harvard Business Review Press",
        "publication_year": 2016,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-A",
        "rack": "Rack BUS-05",
        "description": "The landmark theory on disruptive innovation and why successful companies must proactively embrace technological transformation.",
        "keywords": "innovation, disruption, technology strategy, management, transformation"
    },
    {
        "title": "Blue Ocean Strategy: How to Create Uncontested Market Space",
        "author": "W. Chan Kim & Renee Mauborgne",
        "isbn": "978-1625274496",
        "publisher": "Harvard Business Review Press",
        "publication_year": 2015,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-A",
        "rack": "Rack BUS-05",
        "description": "Practical tools for creating new market demand (Blue Oceans) rather than competing in crowded, bloody markets (Red Oceans).",
        "keywords": "business strategy, blue ocean, value innovation, market creation, marketing"
    },
    {
        "title": "Marketing Management (Global Edition)",
        "author": "Philip Kotler & Kevin Lane Keller",
        "isbn": "978-0133856460",
        "publisher": "Pearson Education",
        "publication_year": 2015,
        "language": "English",
        "copies": 6,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-B",
        "rack": "Rack BUS-06",
        "description": "The gold standard marketing textbook covering STP, 4Ps, digital consumer journeys, branding, and global marketing strategies.",
        "keywords": "marketing, consumer behavior, brand management, advertising, market research"
    },
    {
        "title": "Financial Management: Theory and Practice",
        "author": "Prasanna Chandra",
        "isbn": "978-9353166526",
        "publisher": "McGraw Hill India",
        "publication_year": 2019,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-B",
        "rack": "Rack BUS-06",
        "description": "Comprehensive textbook on corporate finance, working capital management, capital budgeting, cost of capital, and valuation.",
        "keywords": "finance, financial management, capital budgeting, corporate finance, accounting"
    },
    {
        "title": "Human Resource Management: Text and Cases",
        "author": "K. Aswathappa",
        "isbn": "978-9387432611",
        "publisher": "McGraw Hill India",
        "publication_year": 2017,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-B",
        "rack": "Rack BUS-07",
        "description": "Comprehensive Indian textbook on recruitment, talent acquisition, training, performance appraisal, industrial relations, and labor laws.",
        "keywords": "human resources, HR, talent management, organizational behavior, labor relations"
    },
    {
        "title": "The Habit of Winning: Stories to Inspire, Motivate and Unleash the Winner in You",
        "author": "Prakash Iyer",
        "isbn": "978-0143417149",
        "publisher": "Penguin India",
        "publication_year": 2011,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-B",
        "rack": "Rack BUS-07",
        "description": "Inspiring stories on leadership, personal mastery, self-belief, resilience, and building winning career habits.",
        "keywords": "leadership, personal development, motivation, success, career growth"
    },
    {
        "title": "The Secret of Leadership: Stories to Boost Your Life and Unleash the Leader in You",
        "author": "Prakash Iyer",
        "isbn": "978-0143420842",
        "publisher": "Penguin India",
        "publication_year": 2013,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-B",
        "rack": "Rack BUS-07",
        "description": "Powerful parables and practical lessons on empathy, communication, team leadership, and humility from an experienced Indian CEO.",
        "keywords": "leadership, team building, communication, motivation, empathy"
    },
    {
        "title": "Fault Lines: How Hidden Fractures Still Threaten the World Economy",
        "author": "Raghuram G. Rajan",
        "isbn": "978-0691152639",
        "publisher": "Princeton University Press",
        "publication_year": 2011,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-B",
        "rack": "Rack BUS-08",
        "description": "Financial Times Business Book of the Year analyzing the systemic economic flaws, inequality, and banking credit risks that triggered the global crisis.",
        "keywords": "economics, banking, monetary policy, finance, macroeconomics, reserve bank"
    },
    {
        "title": "I Do What I Do: On Reform, Rhetoric and Resolve",
        "author": "Raghuram G. Rajan",
        "isbn": "978-9352770281",
        "publisher": "HarperCollins India",
        "publication_year": 2017,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-B",
        "rack": "Rack BUS-08",
        "description": "Speeches, economic insights, and reflections during Dr. Rajan's tenure as Governor of the Reserve Bank of India on inflation, bad loans, and macroeconomic reforms.",
        "keywords": "RBI, Indian economy, banking, monetary policy, governance, finance"
    },
    {
        "title": "The Hard Thing About Hard Things: Building a Business When There Are No Easy Answers",
        "author": "Ben Horowitz",
        "isbn": "978-0062273208",
        "publisher": "HarperBusiness",
        "publication_year": 2014,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-B",
        "rack": "Rack BUS-08",
        "description": "Practical Silicon Valley startup guidance on managing difficult crises, firing executives, leading during downturns, and wartime CEO leadership.",
        "keywords": "startup, CEO, venture capital, crisis management, leadership"
    },
    {
        "title": "Principles: Life and Work",
        "author": "Ray Dalio",
        "isbn": "978-1501124020",
        "publisher": "Simon & Schuster",
        "publication_year": 2017,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-B",
        "rack": "Rack BUS-09",
        "description": "The unconventional principles that created Bridgewater Associates, focusing on radical transparency, idea meritocracy, and systematic decision making.",
        "keywords": "principles, management, investment, decision making, organizational culture"
    },
    {
        "title": "Measure What Matters: OKRs - The Simple Idea that Drives 10x Growth",
        "author": "John Doerr",
        "isbn": "978-0525536222",
        "publisher": "Portfolio",
        "publication_year": 2018,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-B",
        "rack": "Rack BUS-09",
        "description": "How Objectives and Key Results (OKRs) helped tech giants like Google, Intel, and Bono drive hyper-growth through focus and accountability.",
        "keywords": "OKRs, goal setting, management, performance, strategy, execution"
    },
    {
        "title": "Never Split the Difference: Negotiating As If Your Life Depended On It",
        "author": "Chris Voss & Tahl Raz",
        "isbn": "978-0062407801",
        "publisher": "HarperBusiness",
        "publication_year": 2016,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-B",
        "rack": "Rack BUS-09",
        "description": "Former lead FBI international hostage negotiator reveals high-stakes tactical empathy, calibrated questions, and negotiation strategies for business.",
        "keywords": "negotiation, communication, psychology, business influence, persuasion"
    },
    {
        "title": "Getting to Yes: Negotiating Agreement Without Giving In",
        "author": "Roger Fisher & William Ury",
        "isbn": "978-0143118756",
        "publisher": "Penguin Books",
        "publication_year": 2011,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-B",
        "rack": "Rack BUS-10",
        "description": "Harvard Negotiation Project classic on principled negotiation, separating the people from the problem, and achieving win-win outcomes.",
        "keywords": "negotiation, conflict resolution, communication, business strategy"
    },
    {
        "title": "Crucial Conversations: Tools for Talking When Stakes Are High",
        "author": "Kerry Patterson, Joseph Grenny, Ron McMillan, Al Switzler",
        "isbn": "978-0071771320",
        "publisher": "McGraw-Hill",
        "publication_year": 2011,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-B",
        "rack": "Rack BUS-10",
        "description": "Proven strategies to handle high-stakes workplace dialogues with emotional intelligence, clarity, and constructive action.",
        "keywords": "communication, leadership, interpersonal skills, conflict management"
    },
    {
        "title": "Dare to Lead: Brave Work. Tough Conversations. Whole Hearts.",
        "author": "Brené Brown",
        "isbn": "978-0399592522",
        "publisher": "Random House",
        "publication_year": 2018,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-B",
        "rack": "Rack BUS-10",
        "description": "Explores courage, vulnerability, empathy, and values-driven leadership in high-performance organizations.",
        "keywords": "leadership, emotional intelligence, vulnerability, team culture"
    },
    {
        "title": "Atomic Habits: An Easy & Proven Way to Build Good Habits & Break Bad Ones",
        "author": "James Clear",
        "isbn": "978-0735211292",
        "publisher": "Avery",
        "publication_year": 2018,
        "language": "English",
        "copies": 6,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-A",
        "rack": "Rack BUS-03",
        "description": "Practical framework for continuous 1% improvement through habit stacking, environmental design, and identity-based behavior change.",
        "keywords": "habits, productivity, personal growth, psychology, time management"
    },
    {
        "title": "Deep Work: Rules for Focused Success in a Distracted World",
        "author": "Cal Newport",
        "isbn": "978-1455586691",
        "publisher": "Grand Central Publishing",
        "publication_year": 2016,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-A",
        "rack": "Rack BUS-03",
        "description": "The ability to focus without distraction on a cognitively demanding task as a superpower in modern knowledge economies.",
        "keywords": "productivity, focus, deep work, knowledge management, efficiency"
    },
    {
        "title": "Thinking, Fast and Slow",
        "author": "Daniel Kahneman",
        "isbn": "978-0374533557",
        "publisher": "Farrar, Straus and Giroux",
        "publication_year": 2011,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-A",
        "rack": "Rack BUS-04",
        "description": "Nobel laureate Daniel Kahneman explains the dual-system model of the human mind: Fast intuitive System 1 and deliberate System 2 thinking.",
        "keywords": "behavioral economics, psychology, decision making, cognitive bias"
    },
    {
        "title": "Nudge: Improving Decisions About Health, Wealth, and Happiness",
        "author": "Richard H. Thaler & Cass R. Sunstein",
        "isbn": "978-0143115266",
        "publisher": "Penguin Books",
        "publication_year": 2009,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-A",
        "rack": "Rack BUS-04",
        "description": "Nobel Prize-winning behavioral economics on choice architecture and gentle nudges that guide better financial and policy choices.",
        "keywords": "behavioral economics, choice architecture, decision making, public policy"
    },
    {
        "title": "The Psychology of Money: Timeless Lessons on Wealth, Greed, and Happiness",
        "author": "Morgan Housel",
        "isbn": "978-0857197689",
        "publisher": "Harriman House",
        "publication_year": 2020,
        "language": "English",
        "copies": 6,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-A",
        "rack": "Rack BUS-04",
        "description": "19 short stories exploring the strange ways people think about money, behavioral biases, compounding, and emotional discipline.",
        "keywords": "finance, personal finance, investing, money psychology, wealth management"
    },
    {
        "title": "Rich Dad Poor Dad: What the Rich Teach Their Kids About Money",
        "author": "Robert T. Kiyosaki",
        "isbn": "978-1612680194",
        "publisher": "Plata Publishing",
        "publication_year": 2017,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-A",
        "rack": "Rack BUS-04",
        "description": "Personal finance classic contrasting asset accumulation, passive cash flow, and financial literacy against traditional employment.",
        "keywords": "finance, wealth, assets, cash flow, financial literacy, investing"
    },
    {
        "title": "Hooked: How to Build Habit-Forming Products",
        "author": "Nir Eyal",
        "isbn": "978-1591847786",
        "publisher": "Portfolio",
        "publication_year": 2014,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-B",
        "rack": "Rack BUS-06",
        "description": "The Hook Model (Trigger, Action, Variable Reward, Investment) used by top tech companies to build habit-forming apps.",
        "keywords": "product management, marketing, UX, psychology, consumer behavior"
    },
    {
        "title": "Sprint: How to Solve Big Problems and Test New Ideas in Just Five Days",
        "author": "Jake Knapp, John Zeratsky, Braden Kowitz",
        "isbn": "978-1501121746",
        "publisher": "Simon & Schuster",
        "publication_year": 2016,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-B",
        "rack": "Rack BUS-06",
        "description": "Google Ventures 5-day design sprint methodology for rapid prototyping, problem solving, and real user testing.",
        "keywords": "design thinking, sprint, agile, product development, innovation"
    },
    {
        "title": "Inspired: How to Create Tech Products Customers Love",
        "author": "Marty Cagan",
        "isbn": "978-1119387503",
        "publisher": "Wiley",
        "publication_year": 2017,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-B",
        "rack": "Rack BUS-06",
        "description": "The product management master guide on discovering and delivering technology products that solve genuine customer pain points.",
        "keywords": "product management, technology, product discovery, UX, leadership"
    },
    {
        "title": "No Rules Rules: Netflix and the Culture of Reinvention",
        "author": "Reed Hastings & Erin Meyer",
        "isbn": "978-1984877864",
        "publisher": "Penguin Press",
        "publication_year": 2020,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-B",
        "rack": "Rack BUS-07",
        "description": "Co-founder Reed Hastings reveals Netflix's corporate philosophy of talent density, candor, and freedom with responsibility.",
        "keywords": "corporate culture, management, leadership, Netflix, talent management"
    },
    {
        "title": "The Ride of a Lifetime: Lessons in Creative Leadership",
        "author": "Robert Iger",
        "isbn": "978-0399592096",
        "publisher": "Random House",
        "publication_year": 2019,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-B",
        "rack": "Rack BUS-07",
        "description": "Memoir of Disney CEO Bob Iger sharing leadership lessons from acquiring Pixar, Marvel, Lucasfilm, and 21st Century Fox.",
        "keywords": "leadership, Disney, acquisitions, media, corporate strategy"
    },
    {
        "title": "Shoe Dog: A Memoir by the Creator of Nike",
        "author": "Phil Knight",
        "isbn": "978-1501135927",
        "publisher": "Scribner",
        "publication_year": 2016,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-B",
        "rack": "Rack BUS-07",
        "description": "Candid memoir tracing Nike's journey from a $50 borrowed startup importing Japanese running shoes to a global sports titan.",
        "keywords": "entrepreneurship, memoir, Nike, startup, business story"
    },
    {
        "title": "Rework: Change the Way You Work Forever",
        "author": "Jason Fried & David Heinemeier Hansson",
        "isbn": "978-0307463746",
        "publisher": "Crown Business",
        "publication_year": 2010,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-B",
        "rack": "Rack BUS-08",
        "description": "Basecamp creators share practical, contrarian wisdom on remote work, lean teams, avoiding meetings, and building profitable businesses.",
        "keywords": "productivity, startup, business, remote work, entrepreneurship"
    },
    {
        "title": "Trillion Dollar Coach: The Leadership Playbook of Silicon Valley's Bill Campbell",
        "author": "Eric Schmidt, Jonathan Rosenberg, Alan Eagle",
        "isbn": "978-0062839268",
        "publisher": "HarperBusiness",
        "publication_year": 2019,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-B",
        "rack": "Rack BUS-08",
        "description": "Management principles of legendary executive coach Bill Campbell who mentored Steve Jobs, Larry Page, Sergey Brin, and Sundar Pichai.",
        "keywords": "leadership, coaching, executive management, team dynamics, Silicon Valley"
    },
    {
        "title": "High Output Management",
        "author": "Andrew S. Grove",
        "isbn": "978-0679762881",
        "publisher": "Vintage",
        "publication_year": 1995,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-B",
        "rack": "Rack BUS-08",
        "description": "Legendary Intel CEO Andy Grove teaches the fundamentals of managerial leverage, performance reviews, meeting hygiene, and operational output.",
        "keywords": "management, operations, leadership, Intel, productivity"
    },
    {
        "title": "Creativity, Inc.: Overcoming the Unseen Forces That Stand in the Way of True Inspiration",
        "author": "Ed Catmull & Amy Wallace",
        "isbn": "978-0812993011",
        "publisher": "Random House",
        "publication_year": 2014,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-B",
        "rack": "Rack BUS-09",
        "description": "Pixar co-founder Ed Catmull reveals how to build a creative culture, manage the Braintrust, and nurture originality.",
        "keywords": "creativity, leadership, Pixar, management, innovation"
    },
    {
        "title": "Built to Last: Successful Habits of Visionary Companies",
        "author": "Jim Collins & Jerry I. Porras",
        "isbn": "978-0060516406",
        "publisher": "HarperBusiness",
        "publication_year": 2004,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-A",
        "rack": "Rack BUS-01",
        "description": "A six-year research project examining 18 visionary companies and identifying the core ideology that allowed them to endure for decades.",
        "keywords": "business, leadership, visionary companies, strategy, management"
    },
    {
        "title": "Competitive Advantage: Creating and Sustaining Superior Performance",
        "author": "Michael E. Porter",
        "isbn": "978-0684841465",
        "publisher": "Free Press",
        "publication_year": 1998,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-A",
        "rack": "Rack BUS-04",
        "description": "Introduces the concept of the Value Chain and explains how firms create and maintain cost advantages and differentiation.",
        "keywords": "strategy, value chain, competitive advantage, economics, management"
    },
    {
        "title": "Corporate Chanakya: Successful Management the Chanakya Way",
        "author": "Radhakrishnan Pillai",
        "isbn": "978-8184951332",
        "publisher": "Jaico Publishing House",
        "publication_year": 2010,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-B",
        "rack": "Rack BUS-07",
        "description": "Adapts timeless statecraft and leadership sutras from Kautilya's Arthashastra into modern corporate management strategies.",
        "keywords": "Chanakya, Arthashastra, Indian management, leadership, strategy"
    },
    {
        "title": "Chanakya in Daily Life",
        "author": "Radhakrishnan Pillai",
        "isbn": "978-9385856426",
        "publisher": "Rupa Publications",
        "publication_year": 2016,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-B",
        "rack": "Rack BUS-07",
        "description": "Practical lessons on decision making, family finance, leadership, and emotional resilience from ancient Indian wisdom.",
        "keywords": "Chanakya, self help, leadership, strategy, Indian wisdom"
    },
    {
        "title": "Business Maharajas",
        "author": "Gita Piramal",
        "isbn": "978-0140264425",
        "publisher": "Penguin India",
        "publication_year": 1997,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-B",
        "rack": "Rack BUS-08",
        "description": "Inside the business empires and strategies of India's foremost tycoons: Ambani, Tata, Birla, Bajaj, Mahindra, and Goenka.",
        "keywords": "Indian business, tycoons, industrial history, entrepreneurship, Tata, Ambani"
    },
    {
        "title": "The Tata Group: From Torchbearers to Trailblazers",
        "author": "Shashank Shah",
        "isbn": "978-0670091393",
        "publisher": "Penguin India",
        "publication_year": 2018,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-B",
        "rack": "Rack BUS-08",
        "description": "Comprehensive corporate chronicle of the 150-year legacy of the Tata Group, ethics in capitalism, and global nation-building.",
        "keywords": "Tata, corporate governance, Indian business, ethics, leadership"
    },
    {
        "title": "Stay Hungry Stay Foolish",
        "author": "Rashmi Bansal",
        "isbn": "978-8190453011",
        "publisher": "Westland",
        "publication_year": 2008,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-A",
        "rack": "Rack BUS-02",
        "description": "Inspiring stories of 25 IIM Ahmedabad graduates who chose the path of entrepreneurship to build prominent Indian ventures.",
        "keywords": "entrepreneurship, IIM, startup, Indian business, motivation"
    },
    {
        "title": "Connect the Dots: Inspiring Stories of 20 Non-MBA Entrepreneurs",
        "author": "Rashmi Bansal",
        "isbn": "978-9380658421",
        "publisher": "Westland",
        "publication_year": 2010,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-A",
        "rack": "Rack BUS-02",
        "description": "Stories of 20 Indian entrepreneurs without elite business degrees who created thriving enterprises through grit and passion.",
        "keywords": "entrepreneurship, Indian startups, grit, business stories, success"
    },
    {
        "title": "The 7 Habits of Highly Effective People",
        "author": "Stephen R. Covey",
        "isbn": "978-0743269513",
        "publisher": "Free Press",
        "publication_year": 2004,
        "language": "English",
        "copies": 6,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-A",
        "rack": "Rack BUS-01",
        "description": "Timeless principle-centered approach for personal and professional effectiveness, proactivity, synergy, and renewal.",
        "keywords": "effectiveness, habits, leadership, personal development, management"
    },
    {
        "title": "Drive: The Surprising Truth About What Motivates Us",
        "author": "Daniel H. Pink",
        "isbn": "978-1594484803",
        "publisher": "Riverhead Books",
        "publication_year": 2011,
        "language": "English",
        "copies": 5,
        "floor": "2nd Floor",
        "section": "Business, Management & Leadership Wing",
        "shelf": "Shelf BUS-A",
        "rack": "Rack BUS-03",
        "description": "Examines human motivation, showing that Autonomy, Mastery, and Purpose outperform traditional carrot-and-stick rewards.",
        "keywords": "motivation, psychology, workplace management, human behavior, leadership"
    }
]

# --- 50 Realistic Software Engineering Books ---
SOFTWARE_ENGINEERING_BOOKS = [
    {
        "title": "Clean Code: A Handbook of Agile Software Craftsmanship",
        "author": "Robert C. Martin",
        "isbn": "978-0132350884",
        "publisher": "Prentice Hall",
        "publication_year": 2008,
        "language": "English",
        "copies": 6,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-A",
        "rack": "Rack SE-01",
        "description": "Essential software craftsmanship principles for writing readable, maintainable, self-documenting code with meaningful names and small functions.",
        "keywords": "clean code, agile, refactoring, best practices, programming, unit testing"
    },
    {
        "title": "The Clean Coder: A Code of Conduct for Professional Programmers",
        "author": "Robert C. Martin",
        "isbn": "978-0137081073",
        "publisher": "Prentice Hall",
        "publication_year": 2011,
        "language": "English",
        "copies": 5,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-A",
        "rack": "Rack SE-01",
        "description": "Practical advice on software professionalism, estimating, saying no, handling pressure, craftsmanship, and ethical software development.",
        "keywords": "professionalism, software engineering, ethics, estimation, craftsmanship"
    },
    {
        "title": "Clean Architecture: A Craftsman's Guide to Software Structure and Design",
        "author": "Robert C. Martin",
        "isbn": "978-0134494166",
        "publisher": "Prentice Hall",
        "publication_year": 2017,
        "language": "English",
        "copies": 6,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-A",
        "rack": "Rack SE-01",
        "description": "Explains SOLID design principles, component boundaries, dependency inversion, and building resilient, decoupled software systems.",
        "keywords": "clean architecture, SOLID, software design, decoupled architecture, microservices"
    },
    {
        "title": "Design Patterns: Elements of Reusable Object-Oriented Software",
        "author": "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides",
        "isbn": "978-0201633610",
        "publisher": "Addison-Wesley Professional",
        "publication_year": 1994,
        "language": "English",
        "copies": 6,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-A",
        "rack": "Rack SE-02",
        "description": "The seminal Gang of Four (GoF) catalog of 23 foundational creational, structural, and behavioral software design patterns.",
        "keywords": "design patterns, GoF, OOP, software architecture, object oriented design"
    },
    {
        "title": "Refactoring: Improving the Design of Existing Code (2nd Edition)",
        "author": "Martin Fowler",
        "isbn": "978-0134757599",
        "publisher": "Addison-Wesley Professional",
        "publication_year": 2018,
        "language": "English",
        "copies": 5,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-A",
        "rack": "Rack SE-02",
        "description": "The definitive guide to code refactoring with JavaScript examples, cataloging code smells, test-driven step-by-step transformations, and modularization.",
        "keywords": "refactoring, code smells, software quality, testing, clean code"
    },
    {
        "title": "Patterns of Enterprise Application Architecture",
        "author": "Martin Fowler",
        "isbn": "978-0321127426",
        "publisher": "Addison-Wesley Professional",
        "publication_year": 2002,
        "language": "English",
        "copies": 5,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-A",
        "rack": "Rack SE-02",
        "description": "Comprehensive reference of enterprise architectural patterns: Domain Model, Data Mapper, Unit of Work, Repository, and MVC.",
        "keywords": "enterprise architecture, patterns, ORM, data mapper, domain model"
    },
    {
        "title": "The Pragmatic Programmer: Your Journey to Mastery (20th Anniversary Edition)",
        "author": "David Thomas & Andrew Hunt",
        "isbn": "978-0135957059",
        "publisher": "Addison-Wesley Professional",
        "publication_year": 2019,
        "language": "English",
        "copies": 6,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-A",
        "rack": "Rack SE-03",
        "description": "Timeless engineering philosophy covering DRY principle, orthogonality, tracer bullets, prototyping, debugging mindset, and career mastery.",
        "keywords": "pragmatic programmer, software engineering, best practices, DRY, debugging"
    },
    {
        "title": "Designing Data-Intensive Applications: The Big Ideas Behind Reliable, Scalable Systems",
        "author": "Martin Kleppmann",
        "isbn": "978-1449373320",
        "publisher": "O'Reilly Media",
        "publication_year": 2017,
        "language": "English",
        "copies": 6,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-A",
        "rack": "Rack SE-03",
        "description": "The quintessential guide to distributed systems, database internals, replication, partitioning, transactions, consensus, and stream processing.",
        "keywords": "distributed systems, databases, scalability, stream processing, replication, consensus"
    },
    {
        "title": "Building Microservices: Designing Fine-Grained Systems (2nd Edition)",
        "author": "Sam Newman",
        "isbn": "978-1492034025",
        "publisher": "O'Reilly Media",
        "publication_year": 2021,
        "language": "English",
        "copies": 5,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-A",
        "rack": "Rack SE-04",
        "description": "Complete architectural handbook on microservices modeling, inter-service communication, distributed data, resilience, and deployment pipelines.",
        "keywords": "microservices, distributed architecture, API gateways, containers, scalability"
    },
    {
        "title": "Monolith to Microservices: Evolutionary Patterns to Transform Your Monolith",
        "author": "Sam Newman",
        "isbn": "978-1492047841",
        "publisher": "O'Reilly Media",
        "publication_year": 2019,
        "language": "English",
        "copies": 5,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-A",
        "rack": "Rack SE-04",
        "description": "Step-by-step strategies and patterns (Strangler Fig, Branch by Abstraction) for migrating legacy monolithic codebases to microservices.",
        "keywords": "microservices, monolith migration, strangler fig, refactoring, architecture"
    },
    {
        "title": "The Phoenix Project: A Novel about IT, DevOps, and Helping Your Business Win",
        "author": "Gene Kim, Kevin Behr, George Spafford",
        "isbn": "978-1942788294",
        "publisher": "IT Revolution Press",
        "publication_year": 2018,
        "language": "English",
        "copies": 5,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-A",
        "rack": "Rack SE-05",
        "description": "Engaging narrative illustrating the Three Ways of DevOps, Theory of Constraints, flow of work, and IT operations transformation.",
        "keywords": "DevOps, agile, IT management, continuous delivery, theory of constraints"
    },
    {
        "title": "The DevOps Handbook: How to Create World-Class Agility, Reliability, & Security",
        "author": "Gene Kim, Jez Humble, Patrick Debois, John Willis",
        "isbn": "978-1950508402",
        "publisher": "IT Revolution Press",
        "publication_year": 2021,
        "language": "English",
        "copies": 5,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-A",
        "rack": "Rack SE-05",
        "description": "Practical guide to continuous integration, continuous delivery (CI/CD), telemetry, automated testing, and blameless post-mortems.",
        "keywords": "DevOps, CI/CD, automation, deployment pipelines, cloud reliability"
    },
    {
        "title": "Continuous Delivery: Reliable Software Releases through Build, Test, and Deployment Automation",
        "author": "Jez Humble & David Farley",
        "isbn": "978-0321601919",
        "publisher": "Addison-Wesley Professional",
        "publication_year": 2010,
        "language": "English",
        "copies": 5,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-A",
        "rack": "Rack SE-05",
        "description": "The landmark text establishing modern automated deployment pipelines, infrastructure as code, release management, and zero-downtime rollouts.",
        "keywords": "continuous delivery, automation, CI/CD, testing, release management"
    },
    {
        "title": "Site Reliability Engineering: How Google Runs Production Systems",
        "author": "Betsy Beyer, Chris Jones, Jennifer Petoff, Niall Murphy",
        "isbn": "978-1491929124",
        "publisher": "O'Reilly Media",
        "publication_year": 2016,
        "language": "English",
        "copies": 5,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-B",
        "rack": "Rack SE-06",
        "description": "Google's landmark collection of essays explaining SLOs, SLAs, Error Budgets, eliminating toil, incident management, and distributed systems monitoring.",
        "keywords": "SRE, Google, reliability, monitoring, SLOs, distributed operations"
    },
    {
        "title": "Domain-Driven Design: Tackling Complexity in the Heart of Software",
        "author": "Eric Evans",
        "isbn": "978-0321125217",
        "publisher": "Addison-Wesley Professional",
        "publication_year": 2003,
        "language": "English",
        "copies": 5,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-B",
        "rack": "Rack SE-06",
        "description": "The definitive book on Ubiquitous Language, Bounded Contexts, Aggregates, Entities, and Value Objects for managing enterprise domain complexity.",
        "keywords": "domain driven design, DDD, bounded context, software architecture, modeling"
    },
    {
        "title": "Implementing Domain-Driven Design",
        "author": "Vaughn Vernon",
        "isbn": "978-0321834577",
        "publisher": "Addison-Wesley Professional",
        "publication_year": 2013,
        "language": "English",
        "copies": 5,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-B",
        "rack": "Rack SE-06",
        "description": "Concrete code-level implementation guide for DDD, event-driven architecture, CQRS, and Event Sourcing.",
        "keywords": "DDD, CQRS, event sourcing, domain model, software engineering"
    },
    {
        "title": "Software Engineering (10th Edition)",
        "author": "Ian Sommerville",
        "isbn": "978-0133943030",
        "publisher": "Pearson",
        "publication_year": 2015,
        "language": "English",
        "copies": 6,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-B",
        "rack": "Rack SE-07",
        "description": "The standard university textbook covering the full software lifecycle, requirements engineering, architectural design, agile processes, and dependability.",
        "keywords": "software engineering, SDLC, requirements engineering, agile, verification"
    },
    {
        "title": "Software Engineering: A Practitioner's Approach (9th Edition)",
        "author": "Roger S. Pressman & Bruce R. Maxim",
        "isbn": "978-1259872976",
        "publisher": "McGraw-Hill Education",
        "publication_year": 2019,
        "language": "English",
        "copies": 6,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-B",
        "rack": "Rack SE-07",
        "description": "Classic textbook on software process models, project metrics, quality assurance, formal methods, and software security.",
        "keywords": "software engineering, software quality, testing, metrics, project management"
    },
    {
        "title": "The Mythical Man-Month: Essays on Software Engineering (Anniversary Edition)",
        "author": "Frederick P. Brooks Jr.",
        "isbn": "978-0201835953",
        "publisher": "Addison-Wesley Professional",
        "publication_year": 1995,
        "language": "English",
        "copies": 5,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-B",
        "rack": "Rack SE-07",
        "description": "Seminal collection of essays on software project management, Brook's Law ('adding manpower to a late software project makes it later'), and the Second-System effect.",
        "keywords": "software engineering, project management, Brooks Law, software history"
    },
    {
        "title": "Test Driven Development: By Example",
        "author": "Kent Beck",
        "isbn": "978-0321146533",
        "publisher": "Addison-Wesley Professional",
        "publication_year": 2002,
        "language": "English",
        "copies": 5,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-B",
        "rack": "Rack SE-08",
        "description": "The definitive introduction to the Red-Green-Refactor rhythm of Test-Driven Development (TDD) by Extreme Programming pioneer Kent Beck.",
        "keywords": "TDD, unit testing, agile, refactoring, software quality"
    },
    {
        "title": "Working Effectively with Legacy Code",
        "author": "Michael Feathers",
        "isbn": "978-0131177055",
        "publisher": "Prentice Hall",
        "publication_year": 2004,
        "language": "English",
        "copies": 5,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-B",
        "rack": "Rack SE-08",
        "description": "Practical techniques for safely making changes in untested legacy systems, breaking dependencies, getting code under test harnesses.",
        "keywords": "legacy code, testing, refactoring, software maintenance, technical debt"
    },
    {
        "title": "Unit Testing Principles, Practices, and Patterns",
        "author": "Vladimir Khorikov",
        "isbn": "978-1617296277",
        "publisher": "Manning Publications",
        "publication_year": 2020,
        "language": "English",
        "copies": 5,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-B",
        "rack": "Rack SE-08",
        "description": "Defines what makes a good unit test, mocks vs stubs, avoiding test fragility, and integrating automated testing into CI pipelines.",
        "keywords": "unit testing, test automation, mocking, software quality, CI/CD"
    },
    {
        "title": "System Design Interview – An Insider's Guide (Volume 1)",
        "author": "Alex Xu",
        "isbn": "979-8664653403",
        "publisher": "Independently Published",
        "publication_year": 2020,
        "language": "English",
        "copies": 6,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-B",
        "rack": "Rack SE-09",
        "description": "Clear step-by-step system design architectures for rate limiters, key-value stores, distributed message queues, URL shorteners, and search crawlers.",
        "keywords": "system design, distributed systems, architecture, scalability, load balancing"
    },
    {
        "title": "System Design Interview – An Insider's Guide (Volume 2)",
        "author": "Alex Xu & Sahn Lam",
        "isbn": "979-8837367069",
        "publisher": "Independently Published",
        "publication_year": 2022,
        "language": "English",
        "copies": 6,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-B",
        "rack": "Rack SE-09",
        "description": "Advanced system design blueprints for payment systems, digital wallets, Google Maps, distributed stock exchanges, and gaming leaderboards.",
        "keywords": "system design, payments, distributed consensus, architecture, fintech"
    },
    {
        "title": "Software Architecture in Practice (4th Edition)",
        "author": "Len Bass, Paul Clements, Rick Kazman",
        "isbn": "978-0136886006",
        "publisher": "Addison-Wesley Professional",
        "publication_year": 2021,
        "language": "English",
        "copies": 5,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-B",
        "rack": "Rack SE-09",
        "description": "Comprehensive handbook from Carnegie Mellon SEI on software quality attributes, availability, modifiability, security, and architectural evaluation.",
        "keywords": "software architecture, quality attributes, SEI, system design, modifiability"
    },
    {
        "title": "Fundamentals of Software Architecture: An Engineering Approach",
        "author": "Mark Richards & Neal Ford",
        "isbn": "978-1492043454",
        "publisher": "O'Reilly Media",
        "publication_year": 2020,
        "language": "English",
        "copies": 5,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-B",
        "rack": "Rack SE-09",
        "description": "Modern holistic overview of software architecture styles (microkernel, event-driven, space-based, microservices) and soft skills for architects.",
        "keywords": "software architecture, architecture patterns, event driven, trade-offs, modularity"
    },
    {
        "title": "Software Architecture: The Hard Parts: Modern Input on Distributed Trade-Offs",
        "author": "Neal Ford, Mark Richards, Pramod Sadalage, Zhamak Dehghani",
        "isbn": "978-1492086895",
        "publisher": "O'Reilly Media",
        "publication_year": 2021,
        "language": "English",
        "copies": 5,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-B",
        "rack": "Rack SE-09",
        "description": "Deep-dive into the difficult trade-offs of distributed systems: data decomposition, distributed transactions, sagas, and data mesh.",
        "keywords": "distributed architecture, trade-offs, sagas, data mesh, microservices"
    },
    {
        "title": "Pro Git (2nd Edition)",
        "author": "Scott Chacon & Ben Straub",
        "isbn": "978-1484200773",
        "publisher": "Apress",
        "publication_year": 2014,
        "language": "English",
        "copies": 5,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-B",
        "rack": "Rack SE-10",
        "description": "The official comprehensive guide to Git version control, branching strategies, rebase vs merge, internals, submodules, and GitHub workflows.",
        "keywords": "Git, version control, GitHub, branching, merge, software engineering"
    },
    {
        "title": "Kubernetes in Action (2nd Edition)",
        "author": "Marko Luksa",
        "isbn": "978-1617293726",
        "publisher": "Manning Publications",
        "publication_year": 2024,
        "language": "English",
        "copies": 5,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-B",
        "rack": "Rack SE-10",
        "description": "Comprehensive practical guide to container orchestration with Kubernetes, Pods, Deployments, Services, ConfigMaps, Ingress, and Helm.",
        "keywords": "Kubernetes, containers, Docker, DevOps, cloud native, orchestration"
    },
    {
        "title": "Docker Deep Dive: Zero to Docker in a Single Book",
        "author": "Nigel Poulton",
        "isbn": "978-1521822807",
        "publisher": "Independently Published",
        "publication_year": 2020,
        "language": "English",
        "copies": 5,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-B",
        "rack": "Rack SE-10",
        "description": "Hands-on guide to containerization, Dockerfiles, multi-stage builds, container security, storage volumes, and Docker Compose.",
        "keywords": "Docker, containers, DevOps, virtualization, cloud engineering"
    },
    {
        "title": "Head First Design Patterns: A Brain-Friendly Guide (2nd Edition)",
        "author": "Eric Freeman & Elisabeth Robson",
        "isbn": "978-1492078005",
        "publisher": "O'Reilly Media",
        "publication_year": 2020,
        "language": "English",
        "copies": 6,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-A",
        "rack": "Rack SE-02",
        "description": "Engaging visual and neurobiology-based approach to learning Observer, Decorator, Factory, Singleton, Command, and Adapter design patterns.",
        "keywords": "design patterns, OOP, Java, visual learning, software craftsmanship"
    },
    {
        "title": "Head First Agile: A Brain-Friendly Guide to Agile Principles and the PMI-ACP",
        "author": "Andrew Stellman & Jennifer Greene",
        "isbn": "978-1491944691",
        "publisher": "O'Reilly Media",
        "publication_year": 2017,
        "language": "English",
        "copies": 5,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-A",
        "rack": "Rack SE-03",
        "description": "A visual guide to the Agile Manifesto, Scrum sprints, user stories, velocity, Kanban boards, and Lean product development.",
        "keywords": "Agile, Scrum, Kanban, user stories, sprint planning, project management"
    },
    {
        "title": "Scrum: The Art of Doing Twice the Work in Half the Time",
        "author": "Jeff Sutherland",
        "isbn": "978-0385346450",
        "publisher": "Crown Business",
        "publication_year": 2014,
        "language": "English",
        "copies": 5,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-A",
        "rack": "Rack SE-03",
        "description": "Scrum co-creator Jeff Sutherland explains the history, philosophy, cross-functional team dynamics, and daily standups of Scrum.",
        "keywords": "Scrum, agile, sprint, productivity, team management"
    },
    {
        "title": "User Story Mapping: Discover the Whole Story, Build the Right Product",
        "author": "Jeff Patton & Peter Economy",
        "isbn": "978-1491904909",
        "publisher": "O'Reilly Media",
        "publication_year": 2014,
        "language": "English",
        "copies": 5,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-A",
        "rack": "Rack SE-03",
        "description": "Essential product development practice for organizing backlogs into holistic user workflows and prioritizing releases effectively.",
        "keywords": "user stories, story mapping, agile, product backlog, UX"
    },
    {
        "title": "Release It!: Design and Deploy Production-Ready Software (2nd Edition)",
        "author": "Michael T. Nygard",
        "isbn": "978-1680502398",
        "publisher": "Pragmatic Bookshelf",
        "publication_year": 2018,
        "language": "English",
        "copies": 5,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-B",
        "rack": "Rack SE-06",
        "description": "Crucial stability patterns (Circuit Breaker, Bulkhead, Timeouts) and antipatterns for engineering resilient distributed production services.",
        "keywords": "stability patterns, circuit breaker, production readiness, resilience, microservices"
    },
    {
        "title": "Enterprise Integration Patterns: Designing, Building, and Deploying Messaging Solutions",
        "author": "Gregor Hohpe & Bobby Woolf",
        "isbn": "978-0321200686",
        "publisher": "Addison-Wesley Professional",
        "publication_year": 2003,
        "language": "English",
        "copies": 5,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-B",
        "rack": "Rack SE-06",
        "description": "The definitive catalog of 65 asynchronous messaging patterns (Message Bus, Content-Based Router, Publish-Subscribe, Dead Letter Channel).",
        "keywords": "integration patterns, messaging, asynchronous, Kafka, RabbitMQ, enterprise"
    },
    {
        "title": "Accelerate: The Science of Lean Software and DevOps",
        "author": "Nicole Forsgren, Jez Humble, Gene Kim",
        "isbn": "978-1942788331",
        "publisher": "IT Revolution Press",
        "publication_year": 2018,
        "language": "English",
        "copies": 5,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-A",
        "rack": "Rack SE-05",
        "description": "Groundbreaking DORA research presenting the Four Key Metrics (Lead Time, Deployment Frequency, MTTR, Change Failure Rate) driving engineering velocity.",
        "keywords": "DevOps, DORA metrics, lean software, performance, engineering leadership"
    },
    {
        "title": "Team Topologies: Organizing Business and Technology Teams for Fast Flow",
        "author": "Matthew Skelton & Manuel Pais",
        "isbn": "978-1942788812",
        "publisher": "IT Revolution Press",
        "publication_year": 2019,
        "language": "English",
        "copies": 5,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-A",
        "rack": "Rack SE-05",
        "description": "Pioneering organizational model defining four team types (Stream-aligned, Enabling, Complicated-subsystem, Platform) to optimize delivery.",
        "keywords": "team topologies, Conway's law, organizational design, platform engineering, agile"
    },
    {
        "title": "Microservice Patterns: With Examples in Java",
        "author": "Chris Richardson",
        "isbn": "978-1617294549",
        "publisher": "Manning Publications",
        "publication_year": 2018,
        "language": "English",
        "copies": 5,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-A",
        "rack": "Rack SE-04",
        "description": "Comprehensive architectural guide to Sagas, Event Sourcing, CQRS, API Gateways, and transactional outbox patterns.",
        "keywords": "microservices, saga pattern, event sourcing, CQRS, transactional outbox"
    },
    {
        "title": "Kafka: The Definitive Guide: Real-Time Data and Stream Processing at Scale",
        "author": "Gwen Shapira, Todd Palino, Rajini Sivaram, Krit Petty",
        "isbn": "978-1492043089",
        "publisher": "O'Reilly Media",
        "publication_year": 2021,
        "language": "English",
        "copies": 5,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-B",
        "rack": "Rack SE-10",
        "description": "The definitive guide to Apache Kafka architecture, producers, consumers, partition rebalancing, fault-tolerance, and stream processing.",
        "keywords": "Kafka, stream processing, distributed messaging, big data, event streaming"
    },
    {
        "title": "Designing Distributed Systems: Patterns and Paradigms for Scalable, Reliable Services",
        "author": "Brendan Burns",
        "isbn": "978-1491983645",
        "publisher": "O'Reilly Media",
        "publication_year": 2018,
        "language": "English",
        "copies": 5,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-B",
        "rack": "Rack SE-10",
        "description": "Kubernetes co-creator presents reusable container patterns: Sidecar, Ambassador, Adapter, and distributed batch computation.",
        "keywords": "distributed systems, containers, sidecar pattern, Kubernetes, microservices"
    },
    {
        "title": "API Design Patterns",
        "author": "JJ Geewax",
        "isbn": "978-1617295850",
        "publisher": "Manning Publications",
        "publication_year": 2021,
        "language": "English",
        "copies": 5,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-A",
        "rack": "Rack SE-04",
        "description": "Google engineer JJ Geewax provides best practices for REST, gRPC, pagination, idempotency, versioning, long-running operations, and authentication.",
        "keywords": "API design, REST, gRPC, pagination, idempotency, backend engineering"
    },
    {
        "title": "Software Engineering at Google: Lessons Learned from Programming Over Time",
        "author": "Titus Winters, Tom Manshreck, Hyrum Wright",
        "isbn": "978-1492082798",
        "publisher": "O'Reilly Media",
        "publication_year": 2020,
        "language": "English",
        "copies": 6,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-B",
        "rack": "Rack SE-07",
        "description": "Google engineers explain Hyrum's Law, monorepos, code review culture, static analysis, continuous testing, and software maintainability at global scale.",
        "keywords": "Google, software engineering, monorepo, code review, maintainability"
    },
    {
        "title": "Database Internals: A Deep Dive into How Distributed Data Systems Work",
        "author": "Alex Petrov",
        "isbn": "978-1492040347",
        "publisher": "O'Reilly Media",
        "publication_year": 2019,
        "language": "English",
        "copies": 5,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-A",
        "rack": "Rack SE-03",
        "description": "In-depth look at storage engines, B-Trees, LSM Trees, WAL, consensus algorithms (Paxos, Raft), and distributed transactions.",
        "keywords": "databases, storage engines, B-trees, LSM trees, Raft, Paxos"
    },
    {
        "title": "Staff Engineer: Leadership Beyond the Management Track",
        "author": "Will Larson",
        "isbn": "978-1736417904",
        "publisher": "Independently Published",
        "publication_year": 2021,
        "language": "English",
        "copies": 5,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-A",
        "rack": "Rack SE-01",
        "description": "Navigating the individual contributor engineering ladder: archetype models (Tech Lead, Architect, Solver, Right Hand), sponsorship, and setting technical direction.",
        "keywords": "staff engineer, technical leadership, career growth, engineering management"
    },
    {
        "title": "An Elegant Puzzle: Systems of Engineering Management",
        "author": "Will Larson",
        "isbn": "978-1732265189",
        "publisher": "Stripe Press",
        "publication_year": 2019,
        "language": "English",
        "copies": 5,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-A",
        "rack": "Rack SE-01",
        "description": "Structural engineering management frameworks for team sizing, technical debt management, organizational migration, and scaling engineering teams.",
        "keywords": "engineering management, systems thinking, technical debt, organizational design"
    },
    {
        "title": "Kill It with Fire: Manage Aging Computer Systems (and Future Proof Modern Ones)",
        "author": "Marianne Bellotti",
        "isbn": "978-1718501188",
        "publisher": "No Starch Press",
        "publication_year": 2021,
        "language": "English",
        "copies": 5,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-B",
        "rack": "Rack SE-08",
        "description": "Strategies from USDS expert on modernizing legacy government and banking architectures, managing technical debt, and migrating mainframes.",
        "keywords": "legacy systems, modernization, technical debt, software architecture"
    },
    {
        "title": "A Philosophy of Software Design (2nd Edition)",
        "author": "John Ousterhout",
        "isbn": "978-1732102217",
        "publisher": "Yaknyam Press",
        "publication_year": 2021,
        "language": "English",
        "copies": 5,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-A",
        "rack": "Rack SE-01",
        "description": "Stanford professor John Ousterhout discusses managing software complexity, creating 'deep modules', information hiding, and tactical vs strategic programming.",
        "keywords": "software design, complexity, deep modules, modularity, clean code"
    },
    {
        "title": "Effective Java (3rd Edition)",
        "author": "Joshua Bloch",
        "isbn": "978-0134685991",
        "publisher": "Addison-Wesley Professional",
        "publication_year": 2017,
        "language": "English",
        "copies": 6,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-A",
        "rack": "Rack SE-02",
        "description": "90 best-practice programming idioms for writing clear, robust, efficient, and idiomatic Java code by Java platform architect Joshua Bloch.",
        "keywords": "Java, best practices, OOP, design patterns, concurrency, generics"
    },
    {
        "title": "Fluent Python: Clear, Concise, and Effective Programming (2nd Edition)",
        "author": "Luciano Ramalho",
        "isbn": "978-1492056355",
        "publisher": "O'Reilly Media",
        "publication_year": 2022,
        "language": "English",
        "copies": 6,
        "floor": "1st Floor",
        "section": "Software Engineering & Cloud Architecture Wing",
        "shelf": "Shelf SE-A",
        "rack": "Rack SE-02",
        "description": "In-depth guide to idiomatic Python 3, special methods, data classes, closures, decorators, generators, coroutines, and async/await concurrency.",
        "keywords": "Python, programming, concurrency, async, data structures, OOP"
    }
]


def backfill_existing_books_location(db: Session):
    """Backfill physical location metadata for all existing 803 books according to college library layout."""
    books = db.query(Book).all()
    print(f"-> Backfilling physical locations for {len(books)} existing books...")

    for b in books:
        cat_name = b.category.name if b.category else "General Academic"
        
        # 1. Determine Floor & Section based on Category
        if "Tamil" in cat_name:
            b.floor = "Ground Floor"
            b.section = "Tamil Classical & Heritage Wing (தமிழ் செவ்வியல் பிரிவு)"
            b.shelf = "Shelf TAM-A" if b.id % 2 == 0 else "Shelf TAM-B"
            b.rack = f"Rack TAM-{(b.id % 15) + 1:02d}"
        elif "Computer Science" in cat_name or "Programming" in cat_name or "AI" in cat_name:
            b.floor = "1st Floor"
            b.section = "Computer Science & AI Wing"
            b.shelf = "Shelf CS-A" if b.id % 2 == 0 else "Shelf CS-B"
            b.rack = f"Rack CS-{(b.id % 15) + 1:02d}"
        elif "Software Engineering" in cat_name or "Cloud" in cat_name or "Cybersecurity" in cat_name:
            b.floor = "1st Floor"
            b.section = "Software Engineering & Cloud Architecture Wing"
            b.shelf = "Shelf SE-A" if b.id % 2 == 0 else "Shelf SE-B"
            b.rack = f"Rack SE-{(b.id % 10) + 1:02d}"
        elif "Business" in cat_name or "Economics" in cat_name or "Leadership" in cat_name:
            b.floor = "2nd Floor"
            b.section = "Business, Management & Leadership Wing"
            b.shelf = "Shelf BUS-A" if b.id % 2 == 0 else "Shelf BUS-B"
            b.rack = f"Rack BUS-{(b.id % 10) + 1:02d}"
        elif "Indian Literature" in cat_name or "History" in cat_name or "Culture" in cat_name or "Children" in cat_name:
            b.floor = "2nd Floor"
            b.section = "Indian Heritage & National Literature Wing"
            b.shelf = "Shelf IND-A" if b.id % 2 == 0 else "Shelf IND-B"
            b.rack = f"Rack IND-{(b.id % 20) + 1:02d}"
        elif "Math" in cat_name or "Statistics" in cat_name:
            b.floor = "3rd Floor"
            b.section = "Pure & Applied Mathematics Section"
            b.shelf = "Shelf MATH-A"
            b.rack = f"Rack MATH-{(b.id % 5) + 1:02d}"
        elif "Science" in cat_name or "Environment" in cat_name:
            b.floor = "3rd Floor"
            b.section = "Science & Environmental Studies Section"
            b.shelf = "Shelf SCI-A"
            b.rack = f"Rack SCI-{(b.id % 5) + 1:02d}"
        elif "Exam" in cat_name or "Aptitude" in cat_name:
            b.floor = "3rd Floor"
            b.section = "Competitive Examination & Career Cell"
            b.shelf = "Shelf EXAM-A"
            b.rack = f"Rack EXAM-{(b.id % 5) + 1:02d}"
        else:
            b.floor = "1st Floor"
            b.section = "General Academic Reading Wing"
            b.shelf = "Shelf GEN-A"
            b.rack = f"Rack GEN-{(b.id % 10) + 1:02d}"

        b.building = "Main Library Building"
        b.shelf_location = f"{b.shelf}, {b.rack}"
        b.status = "Available"

    db.commit()
    print("-> Physical location backfill completed.")


def populate_library_locations(db: Session):
    """Seed initial college library layout locations for Admin customization."""
    default_locations = [
        {"building": "Main Library Building", "floor": "Ground Floor", "section": "Tamil Classical & Heritage Wing (தமிழ் செவ்வியல் பிரிவு)", "shelf": "Shelf TAM-A", "rack": "Rack TAM-01", "description": "Sangam 18, Epics & Thirukkural"},
        {"building": "Main Library Building", "floor": "Ground Floor", "section": "Tamil Classical & Heritage Wing (தமிழ் செவ்வியல் பிரிவு)", "shelf": "Shelf TAM-B", "rack": "Rack TAM-05", "description": "Modern Tamil Novels & Kalki Collection"},
        {"building": "Main Library Building", "floor": "1st Floor", "section": "Computer Science & AI Wing", "shelf": "Shelf CS-A", "rack": "Rack CS-01", "description": "AI, ML, Deep Learning & Python"},
        {"building": "Main Library Building", "floor": "1st Floor", "section": "Computer Science & AI Wing", "shelf": "Shelf CS-B", "rack": "Rack CS-05", "description": "Data Structures, Algorithms & Databases"},
        {"building": "Main Library Building", "floor": "1st Floor", "section": "Software Engineering & Cloud Architecture Wing", "shelf": "Shelf SE-A", "rack": "Rack SE-01", "description": "Clean Code, Architecture & GoF Design Patterns"},
        {"building": "Main Library Building", "floor": "1st Floor", "section": "Software Engineering & Cloud Architecture Wing", "shelf": "Shelf SE-B", "rack": "Rack SE-05", "description": "DevOps, Microservices & Distributed Systems"},
        {"building": "Main Library Building", "floor": "2nd Floor", "section": "Business, Management & Leadership Wing", "shelf": "Shelf BUS-A", "rack": "Rack BUS-01", "description": "Executive Leadership & Value Investing"},
        {"building": "Main Library Building", "floor": "2nd Floor", "section": "Business, Management & Leadership Wing", "shelf": "Shelf BUS-B", "rack": "Rack BUS-06", "description": "Marketing, Startups & Indian Business"},
        {"building": "Main Library Building", "floor": "2nd Floor", "section": "Indian Heritage & National Literature Wing", "shelf": "Shelf IND-A", "rack": "Rack IND-01", "description": "NBT Indian English Classics & Freedom History"},
        {"building": "Main Library Building", "floor": "3rd Floor", "section": "Pure & Applied Mathematics Section", "shelf": "Shelf MATH-A", "rack": "Rack MATH-01", "description": "Calculus, Linear Algebra & Statistics"},
        {"building": "Main Library Building", "floor": "3rd Floor", "section": "Science & Environmental Studies Section", "shelf": "Shelf SCI-A", "rack": "Rack SCI-01", "description": "Physics, Chemistry & Environmental Sciences"},
        {"building": "Main Library Building", "floor": "3rd Floor", "section": "Competitive Examination & Career Cell", "shelf": "Shelf EXAM-A", "rack": "Rack EXAM-01", "description": "UPSC, GATE, CAT & Quantitative Aptitude"},
    ]

    for loc_data in default_locations:
        existing = db.query(LibraryLocation).filter(
            LibraryLocation.building == loc_data["building"],
            LibraryLocation.floor == loc_data["floor"],
            LibraryLocation.section == loc_data["section"],
            LibraryLocation.rack == loc_data["rack"]
        ).first()
        if not existing:
            new_loc = LibraryLocation(
                building=loc_data["building"],
                floor=loc_data["floor"],
                section=loc_data["section"],
                shelf=loc_data["shelf"],
                rack=loc_data["rack"],
                description=loc_data["description"]
            )
            db.add(new_loc)
    db.commit()
    print("-> College library layout locations seeded.")


def get_or_create_category(name: str, description: str, icon: str, db: Session) -> Category:
    slug = re.sub(r'[^a-zA-Z0-9]', '-', name.lower()).strip('-')
    cat = db.query(Category).filter(
        or_(Category.name.ilike(name), Category.slug == slug)
    ).first()
    if not cat:
        cat = Category(
            name=name,
            slug=slug,
            icon=icon,
            description=description
        )
        db.add(cat)
        db.commit()
        db.refresh(cat)
    return cat


def get_or_create_author(name: str, db: Session) -> Author:
    author = db.query(Author).filter(Author.name.ilike(name.strip())).first()
    if not author:
        author = Author(name=name.strip(), bio=f"Author of renowned academic publications.")
        db.add(author)
        db.commit()
        db.refresh(author)
    return author


def seed_expansion_books(db: Session):
    """Seed 50 Business & Leadership + 50 Software Engineering books."""
    print("-> Seeding Business & Leadership and Software Engineering collections...")
    
    # 1. Get or create Categories
    bus_cat = get_or_create_category(
        name="Business & Leadership",
        description="Core management, strategic leadership, entrepreneurship, finance, and organizational culture.",
        icon="TrendingUp",
        db=db
    )
    
    se_cat = get_or_create_category(
        name="Software Engineering",
        description="Software architecture, design patterns, clean code, agile practices, testing, and DevOps.",
        icon="Layers",
        db=db
    )

    all_books_to_add = [
        (BUSINESS_LEADERSHIP_BOOKS, bus_cat),
        (SOFTWARE_ENGINEERING_BOOKS, se_cat)
    ]

    inserted_count = 0

    for book_list, category in all_books_to_add:
        for item in book_list:
            clean_isbn = item["isbn"].strip()
            # Check if book already exists
            existing = db.query(Book).filter(
                or_(
                    Book.isbn == clean_isbn,
                    Book.isbn == clean_isbn.replace("-", ""),
                    Book.title.ilike(item["title"].strip())
                )
            ).first()
            if existing:
                continue

            author = get_or_create_author(item["author"], db)
            copies_num = item.get("copies", 5)

            new_book = Book(
                title=item["title"].strip(),
                author_id=author.id,
                category_id=category.id,
                isbn=clean_isbn,
                shelf_location=f"{item['shelf']}, {item['rack']}",
                description=item["description"].strip(),
                publisher=item["publisher"],
                publication_year=item["publication_year"],
                total_copies=copies_num,
                available_copies=copies_num,
                cover_image=f"https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80",
                keywords=item["keywords"],
                language=item.get("language", "English"),
                edition="Library Edition",
                source="College Library Master Collection",
                building="Main Library Building",
                floor=item["floor"],
                section=item["section"],
                shelf=item["shelf"],
                rack=item["rack"],
                status="Available"
            )
            db.add(new_book)
            db.commit()
            db.refresh(new_book)

            # Assign QR Code
            new_book.qr_code = f"BOOK-CBE-{new_book.id:05d}"
            db.commit()

            # Create physical BookCopy entities
            for c_idx in range(1, copies_num + 1):
                copy = BookCopy(
                    book_id=new_book.id,
                    barcode=f"BOOK-CBE-{new_book.id:05d}-C{c_idx:02d}",
                    status="AVAILABLE"
                )
                db.add(copy)
            db.commit()

            inserted_count += 1

    print(f"-> Inserted {inserted_count} new academic books into catalog.")


def reset_demo_borrowings(db: Session):
    """
    Reset demo/test borrowing state to ZERO:
    - Borrowed = 0
    - Overdue = 0
    - Active Issues = 0
    - available_copies = total_copies for all books
    - All BookCopy status = 'AVAILABLE'
    """
    print("-> Resetting demo borrowing and loan records to ZERO...")

    # 1. Mark all transactions as closed / remove demo active loans
    active_txs = db.query(Transaction).filter(
        Transaction.status.in_(["BORROWED", "OVERDUE"])
    ).all()
    
    for tx in active_txs:
        tx.status = "RETURNED"
        tx.return_date = datetime.datetime.utcnow()
        tx.fine_amount = 0.0
        tx.fine_paid = True

    # 2. Reset all BookCopy records to AVAILABLE
    db.query(BookCopy).update({"status": "AVAILABLE"})

    # 3. Recalculate and restore available_copies = total_copies for every book
    all_books = db.query(Book).all()
    for b in all_books:
        b.available_copies = b.total_copies
        b.status = "Available"

    # 4. Clean up any open unpaid demo fines
    db.query(Fine).filter(Fine.status == "UNPAID").update({"status": "PAID"})

    db.commit()
    print("-> Borrow state reset complete. Active Borrowed = 0, Overdue = 0.")


def ensure_schema_columns():
    """Ensure newly added columns exist in the database without dropping tables."""
    from sqlalchemy import text
    with engine.connect() as conn:
        columns_to_add = [
            ("building", "VARCHAR(100) DEFAULT 'Main Library Building'"),
            ("floor", "VARCHAR(50) DEFAULT '1st Floor'"),
            ("section", "VARCHAR(100) DEFAULT 'General Academic Wing'"),
            ("shelf", "VARCHAR(50) DEFAULT 'Shelf A'"),
            ("rack", "VARCHAR(50) DEFAULT 'Rack A-01'"),
            ("status", "VARCHAR(50) DEFAULT 'Available'"),
        ]
        for col_name, col_type in columns_to_add:
            try:
                conn.execute(text(f"ALTER TABLE books ADD COLUMN {col_name} {col_type};"))
                conn.commit()
                print(f"Added column {col_name} to books table.")
            except Exception:
                # Column already exists
                pass


def main():
    print("============================================================")
    print("AI COLLEGE LIBRARY MANAGEMENT SYSTEM - EXPANSION & RESET")
    print("============================================================")
    
    ensure_schema_columns()
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        initial_book_count = db.query(Book).count()
        print(f"Initial Database Books: {initial_book_count}")

        # 1. Backfill physical locations for existing books
        backfill_existing_books_location(db)

        # 2. Populate customizable library locations
        populate_library_locations(db)

        # 3. Seed 50 Business & Leadership + 50 Software Engineering books
        seed_expansion_books(db)

        # 4. Reset borrowing data to 0
        reset_demo_borrowings(db)

        # 5. Re-fit AI models
        print("-> Re-indexing AI TF-IDF Semantic Search and Recommenders...")
        content_recommender.fit(db)
        print("-> AI Re-indexing complete.")

        final_book_count = db.query(Book).count()
        total_copies = db.query(BookCopy).count()
        active_loans = db.query(Transaction).filter(Transaction.status.in_(["BORROWED", "OVERDUE"])).count()
        bus_count = db.query(Book).join(Category).filter(Category.name.ilike("%Business%")).count()
        se_count = db.query(Book).join(Category).filter(Category.name.ilike("%Software%")).count()

        print("============================================================")
        print("COLLEGE EXPANSION & MIGRATION REPORT")
        print("============================================================")
        print(f"Master Catalog Total Books:   {final_book_count}")
        print(f"Total Physical Copies:        {total_copies}")
        print(f"Business & Leadership Books:  {bus_count}")
        print(f"Software Engineering Books:   {se_count}")
        print(f"Active Borrowed Books:        {active_loans} (Reset to Zero)")
        print("============================================================")

    finally:
        db.close()

if __name__ == "__main__":
    main()
