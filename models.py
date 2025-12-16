import sqlite3
import os
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

DATABASE = 'car_rental.db'

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Cars table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cars (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            model TEXT NOT NULL,
            plate_number TEXT UNIQUE NOT NULL,
            status TEXT DEFAULT 'available',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Clients table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            passport_id TEXT NOT NULL,
            driving_license TEXT NOT NULL,
            passport_image TEXT,
            license_image TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Rentals table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS rentals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            car_id INTEGER NOT NULL,
            client_id INTEGER NOT NULL,
            start_date DATE NOT NULL,
            return_date DATE NOT NULL,
            rental_price REAL DEFAULT 0,
            status TEXT DEFAULT 'reserved',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (car_id) REFERENCES cars (id),
            FOREIGN KEY (client_id) REFERENCES clients (id)
        )
    ''')
    
    # Expenses table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            amount REAL NOT NULL,
            expense_date DATE NOT NULL,
            car_id INTEGER,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (car_id) REFERENCES cars (id)
        )
    ''')
    
    conn.commit()
    
    # Create default admin users if they don't exist
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        cursor.execute(
            "INSERT INTO users (username, password_hash) VALUES (?, ?)",
            ('admin', generate_password_hash('admin123'))
        )
        cursor.execute(
            "INSERT INTO users (username, password_hash) VALUES (?, ?)",
            ('manager', generate_password_hash('manager123'))
        )
        conn.commit()
    
    conn.close()

class User:
    def __init__(self, id, username):
        self.id = id
        self.username = username
        self.is_active = True
        self.is_authenticated = True
        self.is_anonymous = False
    
    def get_id(self):
        return str(self.id)
    
    @staticmethod
    def get_by_id(user_id):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT id, username FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return User(row['id'], row['username'])
        return None
    
    @staticmethod
    def get_by_username(username):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT id, username, password_hash FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()
        conn.close()
        return row
    
    @staticmethod
    def verify_password(stored_hash, password):
        return check_password_hash(stored_hash, password)

class Car:
    @staticmethod
    def get_all():
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM cars ORDER BY created_at DESC")
        rows = cursor.fetchall()
        conn.close()
        return rows
    
    @staticmethod
    def get_by_id(car_id):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM cars WHERE id = ?", (car_id,))
        row = cursor.fetchone()
        conn.close()
        return row
    
    @staticmethod
    def create(model, plate_number):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO cars (model, plate_number) VALUES (?, ?)",
            (model, plate_number)
        )
        conn.commit()
        conn.close()
    
    @staticmethod
    def update_status(car_id, status):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE cars SET status = ? WHERE id = ?",
            (status, car_id)
        )
        conn.commit()
        conn.close()
    
    @staticmethod
    def delete(car_id):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM cars WHERE id = ?", (car_id,))
        conn.commit()
        conn.close()
    
    @staticmethod
    def get_stats():
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as total FROM cars")
        total = cursor.fetchone()['total']
        cursor.execute("SELECT COUNT(*) as count FROM cars WHERE status = 'available'")
        available = cursor.fetchone()['count']
        cursor.execute("SELECT COUNT(*) as count FROM cars WHERE status = 'rented'")
        rented = cursor.fetchone()['count']
        cursor.execute("SELECT COUNT(*) as count FROM cars WHERE status = 'reserved'")
        reserved = cursor.fetchone()['count']
        conn.close()
        return {'total': total, 'available': available, 'rented': rented, 'reserved': reserved}

class Client:
    @staticmethod
    def get_all():
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM clients ORDER BY created_at DESC")
        rows = cursor.fetchall()
        conn.close()
        return rows
    
    @staticmethod
    def get_by_id(client_id):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM clients WHERE id = ?", (client_id,))
        row = cursor.fetchone()
        conn.close()
        return row
    
    @staticmethod
    def create(full_name, passport_id, driving_license, passport_image=None, license_image=None):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO clients (full_name, passport_id, driving_license, passport_image, license_image) VALUES (?, ?, ?, ?, ?)",
            (full_name, passport_id, driving_license, passport_image, license_image)
        )
        conn.commit()
        client_id = cursor.lastrowid
        conn.close()
        return client_id
    
    @staticmethod
    def update_images(client_id, passport_image=None, license_image=None):
        conn = get_db()
        cursor = conn.cursor()
        if passport_image:
            cursor.execute("UPDATE clients SET passport_image = ? WHERE id = ?", (passport_image, client_id))
        if license_image:
            cursor.execute("UPDATE clients SET license_image = ? WHERE id = ?", (license_image, client_id))
        conn.commit()
        conn.close()
    
    @staticmethod
    def delete(client_id):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM clients WHERE id = ?", (client_id,))
        conn.commit()
        conn.close()

class Rental:
    @staticmethod
    def get_all():
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT r.*, c.model as car_model, c.plate_number, cl.full_name as client_name
            FROM rentals r
            JOIN cars c ON r.car_id = c.id
            JOIN clients cl ON r.client_id = cl.id
            ORDER BY r.created_at DESC
        ''')
        rows = cursor.fetchall()
        conn.close()
        return rows
    
    @staticmethod
    def get_by_id(rental_id):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT r.*, c.model as car_model, c.plate_number, cl.full_name as client_name
            FROM rentals r
            JOIN cars c ON r.car_id = c.id
            JOIN clients cl ON r.client_id = cl.id
            WHERE r.id = ?
        ''', (rental_id,))
        row = cursor.fetchone()
        conn.close()
        return row
    
    @staticmethod
    def create(car_id, client_id, start_date, return_date, rental_price):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO rentals (car_id, client_id, start_date, return_date, rental_price, status) VALUES (?, ?, ?, ?, ?, 'reserved')",
            (car_id, client_id, start_date, return_date, rental_price)
        )
        cursor.execute("UPDATE cars SET status = 'reserved' WHERE id = ?", (car_id,))
        conn.commit()
        conn.close()
    
    @staticmethod
    def update_status(rental_id, status):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT car_id FROM rentals WHERE id = ?", (rental_id,))
        rental = cursor.fetchone()
        if rental:
            car_status = 'available' if status == 'returned' else status
            cursor.execute("UPDATE rentals SET status = ? WHERE id = ?", (status, rental_id))
            cursor.execute("UPDATE cars SET status = ? WHERE id = ?", (car_status, rental['car_id']))
        conn.commit()
        conn.close()
    
    @staticmethod
    def get_notifications():
        conn = get_db()
        cursor = conn.cursor()
        today = datetime.now().strftime('%Y-%m-%d')
        tomorrow = (datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)).strftime('%Y-%m-%d')
        
        from datetime import timedelta
        tomorrow_date = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        notifications = []
        
        # Reservations starting today
        cursor.execute('''
            SELECT r.*, c.model, c.plate_number, cl.full_name
            FROM rentals r
            JOIN cars c ON r.car_id = c.id
            JOIN clients cl ON r.client_id = cl.id
            WHERE r.start_date = ? AND r.status = 'reserved'
        ''', (today,))
        for row in cursor.fetchall():
            notifications.append({
                'type': 'start_today',
                'rental': dict(row),
                'severity': 'warning'
            })
        
        # Reservations starting tomorrow
        cursor.execute('''
            SELECT r.*, c.model, c.plate_number, cl.full_name
            FROM rentals r
            JOIN cars c ON r.car_id = c.id
            JOIN clients cl ON r.client_id = cl.id
            WHERE r.start_date = ? AND r.status = 'reserved'
        ''', (tomorrow_date,))
        for row in cursor.fetchall():
            notifications.append({
                'type': 'start_tomorrow',
                'rental': dict(row),
                'severity': 'info'
            })
        
        # Returns due today
        cursor.execute('''
            SELECT r.*, c.model, c.plate_number, cl.full_name
            FROM rentals r
            JOIN cars c ON r.car_id = c.id
            JOIN clients cl ON r.client_id = cl.id
            WHERE r.return_date = ? AND r.status = 'rented'
        ''', (today,))
        for row in cursor.fetchall():
            notifications.append({
                'type': 'return_today',
                'rental': dict(row),
                'severity': 'warning'
            })
        
        # Overdue rentals
        cursor.execute('''
            SELECT r.*, c.model, c.plate_number, cl.full_name
            FROM rentals r
            JOIN cars c ON r.car_id = c.id
            JOIN clients cl ON r.client_id = cl.id
            WHERE r.return_date < ? AND r.status = 'rented'
        ''', (today,))
        for row in cursor.fetchall():
            notifications.append({
                'type': 'overdue',
                'rental': dict(row),
                'severity': 'danger'
            })
        
        conn.close()
        return notifications
    
    @staticmethod
    def get_total_revenue():
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT COALESCE(SUM(rental_price), 0) as total FROM rentals")
        total = cursor.fetchone()['total']
        conn.close()
        return total

class Expense:
    @staticmethod
    def get_all():
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT e.*, c.model as car_model, c.plate_number
            FROM expenses e
            LEFT JOIN cars c ON e.car_id = c.id
            ORDER BY e.expense_date DESC
        ''')
        rows = cursor.fetchall()
        conn.close()
        return rows
    
    @staticmethod
    def create(category, amount, expense_date, car_id=None, description=None):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO expenses (category, amount, expense_date, car_id, description) VALUES (?, ?, ?, ?, ?)",
            (category, amount, expense_date, car_id if car_id else None, description)
        )
        conn.commit()
        conn.close()
    
    @staticmethod
    def delete(expense_id):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM expenses WHERE id = ?", (expense_id,))
        conn.commit()
        conn.close()
    
    @staticmethod
    def get_total():
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT COALESCE(SUM(amount), 0) as total FROM expenses")
        total = cursor.fetchone()['total']
        conn.close()
        return total
    
    @staticmethod
    def get_by_car(car_id):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE car_id = ?", (car_id,))
        total = cursor.fetchone()['total']
        conn.close()
        return total
