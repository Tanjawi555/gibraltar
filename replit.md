# Car Rental Management System

## Overview
A multilingual (Arabic, English, French) car rental management web application with admin-only access. The system manages cars, clients, rentals, expenses, and profit tracking.

## Tech Stack
- **Backend**: Python Flask
- **Database**: SQLite
- **Frontend**: HTML + Bootstrap 5
- **Authentication**: Flask-Login with password hashing

## Features
- **Multilingual**: Arabic (default), English, French with language switcher
- **Cars**: Add, manage status (Available/Rented/Reserved)
- **Clients**: Add with document uploads (passport/ID, driving license)
- **Rentals**: Assign cars to clients with automatic status updates
- **Expenses**: Track by category (maintenance, insurance, fuel, other)
- **Profits**: Auto-calculate revenue minus expenses
- **Dashboard**: Real-time stats and notifications

## Default Admin Users
- Username: `admin` / Password: `admin123`
- Username: `manager` / Password: `manager123`

## Running the App
```bash
python app.py
```
The app runs on port 5000.

## File Structure
```
├── app.py              # Main Flask application
├── models.py           # Database models and operations
├── translations.py     # Multilingual translations
├── templates/          # HTML templates
│   ├── base.html
│   ├── login.html
│   ├── dashboard.html
│   ├── cars.html
│   ├── clients.html
│   ├── rentals.html
│   ├── expenses.html
│   └── profits.html
├── static/
│   ├── css/style.css
│   ├── js/main.js
│   └── uploads/documents/  # Client document uploads
└── car_rental.db       # SQLite database (auto-created)
```

## Security
- Password hashing with Werkzeug
- Login required for all pages
- File upload validation (images only, max 5MB)
- Secure document viewing (authenticated only)
