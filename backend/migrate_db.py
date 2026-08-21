"""
Database Migration Script: Adds qr_code and shelf_location to books table if not present.
Backfills qr_code and shelf_location for existing book records.
"""
import sqlite3
import os
import sys

def migrate_sqlite():
    db_path = os.path.join(os.path.dirname(__file__), "..", "ai_library.db")
    if not os.path.exists(db_path):
        print(f"Database file not found at {db_path}. Will be created by seed script.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Get current columns in books table
    columns = [col[1] for col in cursor.execute("PRAGMA table_info(books)").fetchall()]
    print(f"Existing columns in books: {columns}")

    # Add qr_code if missing
    if "qr_code" not in columns:
        print("Adding 'qr_code' column to books table...")
        cursor.execute("ALTER TABLE books ADD COLUMN qr_code VARCHAR(100) NULL")
        cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_books_qr ON books (qr_code)")

    # Add shelf_location if missing
    if "shelf_location" not in columns:
        print("Adding 'shelf_location' column to books table...")
        cursor.execute("ALTER TABLE books ADD COLUMN shelf_location VARCHAR(100) DEFAULT 'Rack A-01' NULL")

    # Backfill missing qr_codes and shelf_locations
    cursor.execute("SELECT id, title, isbn, category_id, qr_code, shelf_location FROM books")
    books = cursor.fetchall()
    
    racks = ["Rack A-01", "Rack A-02", "Rack B-01", "Rack B-02", "Rack C-01", "Rack C-02", "Rack D-01", "Rack D-02", "Rack E-01"]
    
    for book in books:
        book_id, title, isbn, cat_id, current_qr, current_shelf = book
        updated = False
        new_qr = current_qr
        new_shelf = current_shelf

        if not current_qr:
            new_qr = f"LIB-BOOK-{book_id:04d}"
            updated = True

        if not current_shelf or current_shelf == "Rack A-01":
            rack_idx = (cat_id or 1) % len(racks)
            shelf_num = (book_id % 4) + 1
            new_shelf = f"{racks[rack_idx]}, Shelf {shelf_num}"
            updated = True

        if updated:
            cursor.execute(
                "UPDATE books SET qr_code = ?, shelf_location = ? WHERE id = ?",
                (new_qr, new_shelf, book_id)
            )

    conn.commit()
    conn.close()
    print(f"Successfully migrated {len(books)} books with QR codes and shelf locations in SQLite.")

if __name__ == "__main__":
    migrate_sqlite()
