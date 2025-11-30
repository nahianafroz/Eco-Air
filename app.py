from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import sqlite3
import os
import json
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = 'ecoair_secret_key_2024'  


def init_db():
    conn = sqlite3.connect('database/ecoair.db')
    cursor = conn.cursor()
    

    cursor.execute('DROP TABLE IF EXISTS users')
    cursor.execute('DROP TABLE IF EXISTS user_activities')
    cursor.execute('DROP TABLE IF EXISTS user_points')
    cursor.execute('DROP TABLE IF EXISTS carbon_offset_investments')
    cursor.execute('DROP TABLE IF EXISTS renewable_energy_plans')
    cursor.execute('DROP TABLE IF EXISTS waste_management_data')
    cursor.execute('DROP TABLE IF EXISTS green_companies_wishlist')
    cursor.execute('DROP TABLE IF EXISTS offset_projects')
    
   
    cursor.execute('''
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            fullname TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE user_activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            activity_type TEXT NOT NULL,
            points_earned INTEGER,
            trees_planted INTEGER,
            energy_saved REAL,
            co2_reduced REAL,
            transport_type TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # User points table
    cursor.execute('''
        CREATE TABLE user_points (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE,
            total_points INTEGER DEFAULT 0,
            total_trees INTEGER DEFAULT 0,
            total_co2_reduced REAL DEFAULT 0,
            total_energy_saved REAL DEFAULT 0,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Offset projects table
    cursor.execute('''
        CREATE TABLE offset_projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            cost_per_ton REAL,
            location TEXT,
            image_url TEXT
        )
    ''')
    
    # Carbon offset investments table
    cursor.execute('''
        CREATE TABLE carbon_offset_investments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            project_id INTEGER,
            tons_offset REAL,
            amount_paid REAL,
            investment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Renewable energy plans table
    cursor.execute('''
        CREATE TABLE renewable_energy_plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            plan_type TEXT,
            monthly_cost REAL,
            estimated_savings REAL,
            start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Waste management data table
    cursor.execute('''
        CREATE TABLE waste_management_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            general_waste REAL,
            recyclable_waste REAL,
            compost_waste REAL,
            avoided_waste REAL,
            week_start_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Green companies wishlist table
    cursor.execute('''
        CREATE TABLE green_companies_wishlist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            company_name TEXT,
            company_industry TEXT,
            added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Insert sample offset projects
    cursor.execute('''
        INSERT INTO offset_projects (name, description, cost_per_ton, location, image_url)
        VALUES 
        ('Amazon Rainforest Protection', 'Protecting 10,000 hectares of rainforest from deforestation', 15.0, 'Brazil', 'forest'),
        ('Solar Farm in India', 'Installing solar panels to replace coal power', 20.0, 'India', 'solar'),
        ('Wind Energy in Kenya', 'Developing wind farms for clean energy', 18.0, 'Kenya', 'wind'),
        ('Methane Capture Project', 'Capturing landfill methane for energy production', 12.0, 'USA', 'methane'),
        ('Mangrove Restoration', 'Restoring coastal mangroves for carbon sequestration', 25.0, 'Indonesia', 'mangrove')
    ''')
    
    conn.commit()
    conn.close()
    print("Database initialized successfully!")


if not os.path.exists('database'):
    os.makedirs('database')


init_db()

def get_db_connection():
    conn = sqlite3.connect('database/ecoair.db')
    conn.row_factory = sqlite3.Row
    return conn

# Authentication routes
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    conn = get_db_connection()
    user = conn.execute(
        'SELECT * FROM users WHERE username = ?', 
        (username,)
    ).fetchone()
    conn.close()
    
    if user and check_password_hash(user['password_hash'], password):
        session['user_id'] = user['id']
        session['username'] = user['username']
        session['email'] = user['email']
        return jsonify({'success': True, 'message': 'Login successful'})
    else:
        return jsonify({'success': False, 'message': 'Invalid credentials'})

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    fullname = data.get('fullname')
    
    if not username or not email or not password:
        return jsonify({'success': False, 'message': 'All fields are required'})
    
    conn = get_db_connection()
    try:
        password_hash = generate_password_hash(password)
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO users (username, email, password_hash, fullname) VALUES (?, ?, ?, ?)',
            (username, email, password_hash, fullname)
        )
        user_id = cursor.lastrowid
        
    
        cursor.execute(
            'INSERT INTO user_points (user_id) VALUES (?)',
            (user_id,)
        )
        
        conn.commit()
        session['user_id'] = user_id
        session['username'] = username
        session['email'] = email
        return jsonify({'success': True, 'message': 'Registration successful'})
    except sqlite3.IntegrityError as e:
        return jsonify({'success': False, 'message': 'Username or email already exists'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Registration failed: {str(e)}'})
    finally:
        conn.close()

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

@app.route('/api/user-data')
def get_user_data():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'})
    
    conn = get_db_connection()
    

    user_points = conn.execute(
        'SELECT * FROM user_points WHERE user_id = ?', 
        (session['user_id'],)
    ).fetchone()
    

    activities = conn.execute(
        '''SELECT * FROM user_activities 
           WHERE user_id = ? 
           ORDER BY created_at DESC LIMIT 10''',
        (session['user_id'],)
    ).fetchall()
    
    conn.close()
    
    user_data = {
        'id': session['user_id'],
        'username': session['username'],
        'email': session.get('email', ''),
        'points': user_points['total_points'] if user_points else 0,
        'eco_points': user_points['total_points'] if user_points else 0,
        'total_trees': user_points['total_trees'] if user_points else 0,
        'total_co2_reduced': user_points['total_co2_reduced'] if user_points else 0,
        'total_energy_saved': user_points['total_energy_saved'] if user_points else 0,
        'recent_activities': [dict(activity) for activity in activities]
    }
    
    return jsonify(user_data)

@app.route('/api/update-data', methods=['POST'])
def update_user_data():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'})
    
    data = request.get_json()
    points = data.get('points', 0)
    trees = data.get('trees', 0)
    co2 = data.get('co2', 0)
    energy_saved = data.get('energy_saved', 0)
    activity_type = data.get('activity_type', 'general')
    transport_type = data.get('transport_type')
    
    conn = get_db_connection()
    
    try:
        conn.execute(
            '''UPDATE user_points 
               SET total_points = total_points + ?,
                   total_trees = total_trees + ?,
                   total_co2_reduced = total_co2_reduced + ?,
                   total_energy_saved = total_energy_saved + ?,
                   last_updated = CURRENT_TIMESTAMP
               WHERE user_id = ?''',
            (points, trees, co2, energy_saved, session['user_id'])
        )
        
    
        if points > 0 or trees > 0 or co2 > 0:
            conn.execute(
                '''INSERT INTO user_activities 
                   (user_id, activity_type, points_earned, trees_planted, energy_saved, co2_reduced, transport_type)
                   VALUES (?, ?, ?, ?, ?, ?, ?)''',
                (session['user_id'], activity_type, points, trees, energy_saved, co2, transport_type)
            )
        
        conn.commit()
        return jsonify({'success': True, 'message': 'Data updated successfully'})
    
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Error updating data: {str(e)}'})
    
    finally:
        conn.close()

# Carbon offset routes
@app.route('/api/carbon-offset/invest', methods=['POST'])
def invest_carbon_offset():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'})
    
    data = request.get_json()
    project_id = data.get('project_id')
    tons_offset = data.get('tons_offset', 1)
    amount_paid = data.get('amount_paid', 0)
    
    conn = get_db_connection()
    
    try:
        
        conn.execute(
            '''INSERT INTO carbon_offset_investments 
               (user_id, project_id, tons_offset, amount_paid)
               VALUES (?, ?, ?, ?)''',
            (session['user_id'], project_id, tons_offset, amount_paid)
        )
        
       
        conn.execute(
            '''UPDATE user_points 
               SET total_co2_reduced = total_co2_reduced + ?,
                   last_updated = CURRENT_TIMESTAMP
               WHERE user_id = ?''',
            (tons_offset, session['user_id'])
        )
        
        conn.commit()
        return jsonify({'success': True, 'message': 'Carbon offset investment recorded'})
    
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})
    
    finally:
        conn.close()

@app.route('/api/waste-management/log', methods=['POST'])
def log_waste_data():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'})
    
    data = request.get_json()
    general_waste = data.get('general_waste', 0)
    recyclable_waste = data.get('recyclable_waste', 0)
    compost_waste = data.get('compost_waste', 0)
    avoided_waste = data.get('avoided_waste', 0)
    
    conn = get_db_connection()
    
    try:
        
        points_earned = (recyclable_waste * 2) + (compost_waste * 3) + (avoided_waste * 5)
        co2_reduced = (recyclable_waste * 0.5) + (compost_waste * 0.3) + (avoided_waste * 1.0)
        
        
        conn.execute(
            '''INSERT INTO waste_management_data 
               (user_id, general_waste, recyclable_waste, compost_waste, avoided_waste, week_start_date)
               VALUES (?, ?, ?, ?, ?, DATE("now", "weekday 0", "-7 days"))''',
            (session['user_id'], general_waste, recyclable_waste, compost_waste, avoided_waste)
        )
        
        
        if points_earned > 0:
            conn.execute(
                '''UPDATE user_points 
                   SET total_points = total_points + ?,
                       total_co2_reduced = total_co2_reduced + ?,
                       last_updated = CURRENT_TIMESTAMP
                   WHERE user_id = ?''',
                (points_earned, co2_reduced, session['user_id'])
            )
            
            
            conn.execute(
                '''INSERT INTO user_activities 
                   (user_id, activity_type, points_earned, co2_reduced)
                   VALUES (?, "waste_management", ?, ?)''',
                (session['user_id'], points_earned, co2_reduced)
            )
        
        conn.commit()
        return jsonify({
            'success': True, 
            'message': 'Waste data logged successfully',
            'points_earned': points_earned,
            'co2_reduced': co2_reduced
        })
    
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})
    
    finally:
        conn.close()

@app.route('/api/green-companies/wishlist', methods=['POST'])
def add_to_wishlist():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'})
    
    data = request.get_json()
    company_name = data.get('company_name')
    company_industry = data.get('company_industry')
    
    conn = get_db_connection()
    
    try:
        
        conn.execute(
            '''INSERT INTO green_companies_wishlist 
               (user_id, company_name, company_industry)
               VALUES (?, ?, ?)''',
            (session['user_id'], company_name, company_industry)
        )
        
        
        conn.execute(
            '''UPDATE user_points 
               SET total_points = total_points + 10,
                   last_updated = CURRENT_TIMESTAMP
               WHERE user_id = ?''',
            (session['user_id'],)
        )
        

        conn.execute(
            '''INSERT INTO user_activities 
               (user_id, activity_type, points_earned)
               VALUES (?, "green_company_research", 10)''',
            (session['user_id'],)
        )
        
        conn.commit()
        return jsonify({'success': True, 'message': 'Company added to wishlist'})
    
    except sqlite3.IntegrityError:
        return jsonify({'success': False, 'message': 'Company already in wishlist'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})
    
    finally:
        conn.close()

@app.route('/api/renewable-energy/save-plan', methods=['POST'])
def save_energy_plan():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'})
    
    data = request.get_json()
    plan_type = data.get('plan_type')
    monthly_cost = data.get('monthly_cost', 0)
    estimated_savings = data.get('estimated_savings', 0)
    
    conn = get_db_connection()
    
    try:
        
        conn.execute(
            '''INSERT INTO renewable_energy_plans 
               (user_id, plan_type, monthly_cost, estimated_savings)
               VALUES (?, ?, ?, ?)''',
            (session['user_id'], plan_type, monthly_cost, estimated_savings)
        )
        
        
        conn.execute(
            '''UPDATE user_points 
               SET total_points = total_points + 25,
                   last_updated = CURRENT_TIMESTAMP
               WHERE user_id = ?''',
            (session['user_id'],)
        )
        
        
        conn.execute(
            '''INSERT INTO user_activities 
               (user_id, activity_type, points_earned)
               VALUES (?, "renewable_energy_plan", 25)''',
            (session['user_id'],)
        )
        
        conn.commit()
        return jsonify({'success': True, 'message': 'Energy plan saved successfully'})
    
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})
    
    finally:
        conn.close()


@app.route('/')
def index():
    user_data = None
    if 'user_id' in session:
        conn = get_db_connection()
        user_points = conn.execute(
            'SELECT * FROM user_points WHERE user_id = ?', 
            (session['user_id'],)
        ).fetchone()
        conn.close()
        
        if user_points:
            user_data = {
                'id': session['user_id'],
                'username': session['username'],
                'points': user_points['total_points'],
                'trees': user_points['total_trees'],
                'co2_reduced': user_points['total_co2_reduced']
            }
    
    return render_template('index.html', user_data=user_data)

@app.route('/renewable-energy')
def renewable_energy():
    user_data = None
    if 'user_id' in session:
        conn = get_db_connection()
        user_points = conn.execute(
            'SELECT * FROM user_points WHERE user_id = ?', 
            (session['user_id'],)
        ).fetchone()
        conn.close()
        
        if user_points:
            user_data = {
                'id': session['user_id'],
                'username': session['username'],
                'points': user_points['total_points']
            }
    
    return render_template('renewable-energy.html', user_data=user_data)

@app.route('/waste-management')
def waste_management():
    user_data = None
    if 'user_id' in session:
        conn = get_db_connection()
        user_points = conn.execute(
            'SELECT * FROM user_points WHERE user_id = ?', 
            (session['user_id'],)
        ).fetchone()
        conn.close()
        
        if user_points:
            user_data = {
                'id': session['user_id'],
                'username': session['username'],
                'points': user_points['total_points']
            }
    
    return render_template('waste-management.html', user_data=user_data)

@app.route('/green-companies')
def green_companies():
    user_data = None
    if 'user_id' in session:
        conn = get_db_connection()
        user_points = conn.execute(
            'SELECT * FROM user_points WHERE user_id = ?', 
            (session['user_id'],)
        ).fetchone()
        
    
        wishlist = conn.execute(
            'SELECT * FROM green_companies_wishlist WHERE user_id = ?',
            (session['user_id'],)
        ).fetchall()
        conn.close()
        
        if user_points:
            user_data = {
                'id': session['user_id'],
                'username': session['username'],
                'points': user_points['total_points'],
                'wishlist': [dict(item) for item in wishlist]
            }
    
    return render_template('green-companies.html', user_data=user_data)

@app.route('/carbon-offset')
def carbon_offset():
    user_data = None
    conn = get_db_connection()
    
    
    projects = conn.execute('SELECT * FROM offset_projects').fetchall()
    project_list = [dict(project) for project in projects]
    
    if 'user_id' in session:
        user_points = conn.execute(
            'SELECT * FROM user_points WHERE user_id = ?', 
            (session['user_id'],)
        ).fetchone()
        
        
        investments = conn.execute(
            '''SELECT ci.*, op.name as project_name 
               FROM carbon_offset_investments ci
               JOIN offset_projects op ON ci.project_id = op.id
               WHERE ci.user_id = ?''',
            (session['user_id'],)
        ).fetchall()
        
        if user_points:
            user_data = {
                'id': session['user_id'],
                'username': session['username'],
                'points': user_points['total_points'],
                'total_co2_reduced': user_points['total_co2_reduced'],
                'investments': [dict(inv) for inv in investments]
            }
    
    conn.close()
    return render_template('carbon-offset.html', user_data=user_data, projects=project_list)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)