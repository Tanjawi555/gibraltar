import os
from flask import Flask, render_template, request, redirect, url_for, flash, session, send_from_directory, abort
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.utils import secure_filename
from PIL import Image
import uuid

from models import init_db, User, Car, Client, Rental, Expense
from translations import get_all_translations

app = Flask(__name__)
app.secret_key = os.environ.get('SESSION_SECRET', 'dev-secret-key-change-in-production')
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5MB max file size

UPLOAD_FOLDER = 'static/uploads/documents'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.get_by_id(int(user_id))

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_lang():
    return session.get('lang', 'ar')

@app.context_processor
def inject_translations():
    lang = get_lang()
    return {
        't': get_all_translations(lang),
        'current_lang': lang,
        'is_rtl': lang == 'ar'
    }

@app.before_request
def before_request():
    if request.args.get('lang'):
        session['lang'] = request.args.get('lang')

@app.route('/set_language/<lang>')
def set_language(lang):
    if lang in ['ar', 'en', 'fr']:
        session['lang'] = lang
    return redirect(request.referrer or url_for('dashboard'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user_data = User.get_by_username(username)
        if user_data and User.verify_password(user_data['password_hash'], password):
            user = User(user_data['id'], user_data['username'])
            login_user(user)
            return redirect(url_for('dashboard'))
        else:
            t = get_all_translations(get_lang())
            flash(t['invalid_credentials'], 'danger')
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/')
@login_required
def dashboard():
    car_stats = Car.get_stats()
    total_expenses = Expense.get_total()
    total_revenue = Rental.get_total_revenue()
    total_profit = total_revenue - total_expenses
    notifications = Rental.get_notifications()
    
    return render_template('dashboard.html',
                         car_stats=car_stats,
                         total_expenses=total_expenses,
                         total_revenue=total_revenue,
                         total_profit=total_profit,
                         notifications=notifications)

@app.route('/cars', methods=['GET', 'POST'])
@login_required
def cars():
    t = get_all_translations(get_lang())
    
    if request.method == 'POST':
        model = request.form.get('model')
        plate_number = request.form.get('plate_number')
        if model and plate_number:
            try:
                Car.create(model, plate_number)
                flash(t['success'], 'success')
            except:
                flash(t['error'], 'danger')
        return redirect(url_for('cars'))
    
    all_cars = Car.get_all()
    return render_template('cars.html', cars=all_cars)

@app.route('/cars/<int:car_id>/status/<status>')
@login_required
def update_car_status(car_id, status):
    if status in ['available', 'rented', 'reserved']:
        Car.update_status(car_id, status)
    return redirect(url_for('cars'))

@app.route('/cars/<int:car_id>/delete')
@login_required
def delete_car(car_id):
    Car.delete(car_id)
    return redirect(url_for('cars'))

@app.route('/clients', methods=['GET', 'POST'])
@login_required
def clients():
    t = get_all_translations(get_lang())
    
    if request.method == 'POST':
        full_name = request.form.get('full_name')
        passport_id = request.form.get('passport_id')
        driving_license = request.form.get('driving_license')
        
        passport_image = None
        license_image = None
        
        if 'passport_image' in request.files:
            file = request.files['passport_image']
            if file and file.filename and allowed_file(file.filename):
                filename = f"{uuid.uuid4()}_{secure_filename(file.filename)}"
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)
                try:
                    img = Image.open(filepath)
                    img.verify()
                    passport_image = filename
                except:
                    os.remove(filepath)
                    flash(t['invalid_file_type'], 'danger')
                    return redirect(url_for('clients'))
        
        if 'license_image' in request.files:
            file = request.files['license_image']
            if file and file.filename and allowed_file(file.filename):
                filename = f"{uuid.uuid4()}_{secure_filename(file.filename)}"
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)
                try:
                    img = Image.open(filepath)
                    img.verify()
                    license_image = filename
                except:
                    os.remove(filepath)
                    flash(t['invalid_file_type'], 'danger')
                    return redirect(url_for('clients'))
        
        if full_name and passport_id and driving_license:
            Client.create(full_name, passport_id, driving_license, passport_image, license_image)
            flash(t['success'], 'success')
        
        return redirect(url_for('clients'))
    
    all_clients = Client.get_all()
    return render_template('clients.html', clients=all_clients)

@app.route('/clients/<int:client_id>/delete')
@login_required
def delete_client(client_id):
    Client.delete(client_id)
    return redirect(url_for('clients'))

@app.route('/document/<filename>')
@login_required
def view_document(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/rentals', methods=['GET', 'POST'])
@login_required
def rentals():
    t = get_all_translations(get_lang())
    
    if request.method == 'POST':
        car_id = request.form.get('car_id')
        client_id = request.form.get('client_id')
        start_date = request.form.get('start_date')
        return_date = request.form.get('return_date')
        rental_price = request.form.get('rental_price', 0)
        
        if car_id and client_id and start_date and return_date:
            Rental.create(car_id, client_id, start_date, return_date, float(rental_price))
            flash(t['success'], 'success')
        
        return redirect(url_for('rentals'))
    
    all_rentals = Rental.get_all()
    available_cars = [car for car in Car.get_all() if car['status'] == 'available']
    all_clients = Client.get_all()
    
    return render_template('rentals.html', 
                         rentals=all_rentals, 
                         cars=available_cars,
                         clients=all_clients)

@app.route('/rentals/<int:rental_id>/status/<status>')
@login_required
def update_rental_status(rental_id, status):
    if status in ['reserved', 'rented', 'returned']:
        Rental.update_status(rental_id, status)
    return redirect(url_for('rentals'))

@app.route('/expenses', methods=['GET', 'POST'])
@login_required
def expenses():
    t = get_all_translations(get_lang())
    
    if request.method == 'POST':
        category = request.form.get('category')
        amount = request.form.get('amount')
        expense_date = request.form.get('expense_date')
        car_id = request.form.get('car_id')
        description = request.form.get('description')
        
        if category and amount and expense_date:
            Expense.create(category, float(amount), expense_date, 
                          int(car_id) if car_id else None, description)
            flash(t['success'], 'success')
        
        return redirect(url_for('expenses'))
    
    all_expenses = Expense.get_all()
    all_cars = Car.get_all()
    
    return render_template('expenses.html', expenses=all_expenses, cars=all_cars)

@app.route('/expenses/<int:expense_id>/delete')
@login_required
def delete_expense(expense_id):
    Expense.delete(expense_id)
    return redirect(url_for('expenses'))

@app.route('/profits')
@login_required
def profits():
    total_revenue = Rental.get_total_revenue()
    total_expenses = Expense.get_total()
    total_profit = total_revenue - total_expenses
    
    all_rentals = Rental.get_all()
    
    return render_template('profits.html',
                         total_revenue=total_revenue,
                         total_expenses=total_expenses,
                         total_profit=total_profit,
                         rentals=all_rentals)

@app.errorhandler(413)
def too_large(e):
    t = get_all_translations(get_lang())
    flash(t['file_too_large'], 'danger')
    return redirect(request.referrer or url_for('dashboard'))

if __name__ == '__main__':
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)
