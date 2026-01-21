# backend/app.py
from flask import Flask, request, jsonify, render_template, redirect
from flask_pymongo import PyMongo
from flask_bcrypt import Bcrypt
from flask_cors import CORS
import jwt
import datetime
import os

app = Flask(__name__)
CORS(app)  # Allow mobile app to talk to this server

# CONFIGURATION
app.config['MONGO_URI'] = "mongodb+srv://amil:Amil1234@cluster0.vrpmvmv.mongodb.net/Signlingo_db?appName=Cluster0&retryWrites=true&w=majority"
app.config['SECRET_KEY'] = "super_secret_key_for_jwt_tokens" # Change this later

mongo = PyMongo(app)
bcrypt = Bcrypt(app)

# --- ROUTES ---

@app.route('/')
def home():
    return jsonify({"message": "Sign-Lingo Backend is Running!"})

# 1. USER REGISTRATION
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Check if user already exists
    users = mongo.db.users
    existing_user = users.find_one({'email': data['email']})
    
    if existing_user:
        return jsonify({"message": "Email already exists!"}), 400
    
    # Hash the password
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    
    # Create User Object
    new_user = {
        "full_name": data['full_name'],
        "email": data['email'],
        "password": hashed_password,
        "role": "user",  # Default role
        "xp": 0,
        "streak": 0,
        "joined_at": datetime.datetime.utcnow()
    }
    
    # Save to DB
    users.insert_one(new_user)
    
    return jsonify({"message": "User registered successfully!"}), 201

# 2. USER LOGIN
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    users = mongo.db.users
    user = users.find_one({'email': data['email']})
    
    if user and bcrypt.check_password_hash(user['password'], data['password']):
        # Generate JWT Token
        token = jwt.encode({
            'user_id': str(user['_id']),
            'role': user['role'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }, app.config['SECRET_KEY'], algorithm="HS256")
        
        return jsonify({
            "message": "Login successful!",
            "token": token,
            "user": {
                "full_name": user['full_name'],
                "email": user['email'],
                "xp": user['xp'],
                "streak": user.get('streak', 0)
            }
        }), 200
    
    return jsonify({"message": "Invalid credentials"}), 401

# 3. LEADERBOARD
@app.route('/leaderboard', methods=['GET'])
def get_leaderboard():
    period = request.args.get('period', 'allTime')
    
    users = mongo.db.users
    # Get all users sorted by XP (descending)
    user_list = list(users.find(
        {'role': 'user'},
        {'password': 0}
    ).sort('xp', -1).limit(50))
    
    # Convert ObjectId to string
    for user in user_list:
        user['_id'] = str(user['_id'])
        if 'joined_at' in user:
            user['joined_at'] = user['joined_at'].isoformat() if hasattr(user['joined_at'], 'isoformat') else str(user['joined_at'])
    
    return jsonify({"players": user_list}), 200

# 4. USER PROFILE
@app.route('/user/profile', methods=['GET'])
def get_user_profile():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"message": "Unauthorized"}), 401
    
    token = auth_header.split(' ')[1]
    
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        user_id = payload.get('user_id')
        
        from bson.objectid import ObjectId
        users = mongo.db.users
        user = users.find_one({'_id': ObjectId(user_id)}, {'password': 0})
        
        if user:
            user['_id'] = str(user['_id'])
            if 'joined_at' in user:
                user['joined_at'] = user['joined_at'].isoformat()
            return jsonify(user), 200
        
        return jsonify({"message": "User not found"}), 404
        
    except jwt.ExpiredSignatureError:
        return jsonify({"message": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"message": "Invalid token"}), 401

# --- ADMIN ROUTES ---

# 3. ADMIN LOGIN PAGE (Web)
@app.route('/admin')
def admin_login_page():
    return render_template('admin_login.html')

# 4. ADMIN LOGIN API
@app.route('/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json()
    users = mongo.db.users
    user = users.find_one({'email': data['email'], 'role': 'admin'})
    
    if user and bcrypt.check_password_hash(user['password'], data['password']):
        # Generate JWT Token for Admin
        token = jwt.encode({
            'user_id': str(user['_id']),
            'role': user['role'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)  # Shorter expiry for admin
        }, app.config['SECRET_KEY'], algorithm="HS256")
        
        return jsonify({
            "message": "Admin login successful!",
            "token": token,
            "user": {
                "full_name": user['full_name'],
                "email": user['email'],
                "role": user['role']
            }
        }), 200
    
    return jsonify({"message": "Invalid admin credentials"}), 401

# 5. ADMIN DASHBOARD PAGE (Web)
@app.route('/admin/dashboard')
def admin_dashboard():
    return render_template('admin_dashboard.html')

# 5a. ADMIN USERS PAGE (Web)
@app.route('/admin/users')
def admin_users_page():
    return render_template('admin_users.html')

# 5b. ADMIN TOP PERFORMERS PAGE (Web)
@app.route('/admin/top-performers')
def admin_top_performers_page():
    return render_template('admin_top_performers.html')

# 5c. ADMIN FEEDBACK PAGE (Web)
@app.route('/admin/feedback')
def admin_feedback_page():
    return render_template('admin_feedback.html')

# 6. CREATE ADMIN ACCOUNT (Run once to create admin)
@app.route('/admin/create', methods=['POST'])
def create_admin():
    data = request.get_json()
    
    # Check if admin already exists
    users = mongo.db.users
    existing_admin = users.find_one({'email': data['email']})
    
    if existing_admin:
        return jsonify({"message": "Admin email already exists!"}), 400
    
    # Hash the password
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    
    # Create Admin User
    new_admin = {
        "full_name": data['full_name'],
        "email": data['email'],
        "password": hashed_password,
        "role": "admin",
        "joined_at": datetime.datetime.utcnow()
    }
    
    users.insert_one(new_admin)
    
    return jsonify({"message": "Admin account created successfully!"}), 201

# 7. ADMIN DASHBOARD STATS API
@app.route('/admin/api/stats')
def admin_stats():
    # Get authorization header
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"message": "Unauthorized"}), 401
    
    token = auth_header.split(' ')[1]
    
    try:
        # Verify token
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        if payload.get('role') != 'admin':
            return jsonify({"message": "Admin access required"}), 403
        
        # Get period filter
        period = request.args.get('period', 'all')
        
        # Get stats
        users = mongo.db.users
        feedback = mongo.db.feedback
        quiz_sessions = mongo.db.quiz_sessions
        
        # Build date query based on period
        now = datetime.datetime.utcnow()
        date_query = {}
        
        if period == '7days':
            date_query = {'joined_at': {'$gte': now - datetime.timedelta(days=7)}}
        elif period == '30days':
            date_query = {'joined_at': {'$gte': now - datetime.timedelta(days=30)}}
        elif period == 'thisMonth':
            start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            date_query = {'joined_at': {'$gte': start_of_month}}
        
        user_query = {'role': 'user'}
        if date_query:
            user_query.update(date_query)
        
        total_students = users.count_documents(user_query)
        
        # Fix: Use try/except for collections that may not exist
        try:
            quizzes_taken = quiz_sessions.count_documents({})
        except:
            quizzes_taken = 0
            
        try:
            pending_feedback = feedback.count_documents({'status': 'pending'})
        except:
            pending_feedback = 0
        
        # Active today (users who logged in today - simplified)
        today = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        active_today = 0  # Will implement with last_active field later
        
        return jsonify({
            "total_students": total_students,
            "quizzes_taken": quizzes_taken,
            "active_today": active_today,
            "pending_feedback": pending_feedback
        }), 200
        
    except jwt.ExpiredSignatureError:
        return jsonify({"message": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"message": "Invalid token"}), 401

# 8. GET ALL USERS (Admin only)
@app.route('/admin/api/users')
def get_all_users():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"message": "Unauthorized"}), 401
    
    token = auth_header.split(' ')[1]
    
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        if payload.get('role') != 'admin':
            return jsonify({"message": "Admin access required"}), 403
        
        # Get period filter
        period = request.args.get('period', 'all')
        
        users = mongo.db.users
        
        # Build date query based on period
        now = datetime.datetime.utcnow()
        query = {'role': 'user'}
        
        if period == '7days':
            query['joined_at'] = {'$gte': now - datetime.timedelta(days=7)}
        elif period == '30days':
            query['joined_at'] = {'$gte': now - datetime.timedelta(days=30)}
        elif period == 'thisMonth':
            start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            query['joined_at'] = {'$gte': start_of_month}
        
        user_list = list(users.find(query, {'password': 0}).sort('xp', -1))
        
        # Convert ObjectId to string
        for user in user_list:
            user['_id'] = str(user['_id'])
            if 'joined_at' in user:
                user['joined_at'] = user['joined_at'].isoformat()
        
        return jsonify({"users": user_list}), 200
        
    except jwt.ExpiredSignatureError:
        return jsonify({"message": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"message": "Invalid token"}), 401

# 9. GET ALL FEEDBACK (Admin only)
@app.route('/admin/api/feedback')
def get_all_feedback():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"message": "Unauthorized"}), 401
    
    token = auth_header.split(' ')[1]
    
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        if payload.get('role') != 'admin':
            return jsonify({"message": "Admin access required"}), 403
        
        # Get filter parameters
        status_filter = request.args.get('status', '')
        category_filter = request.args.get('category', '')
        period_filter = request.args.get('period', 'all')
        
        feedback = mongo.db.feedback
        
        # Build query based on filters
        query = {}
        if status_filter:
            query['status'] = status_filter
        if category_filter:
            query['category'] = category_filter
        
        # Date filtering
        now = datetime.datetime.utcnow()
        if period_filter == '7days':
            query['date'] = {'$gte': now - datetime.timedelta(days=7)}
        elif period_filter == '30days':
            query['date'] = {'$gte': now - datetime.timedelta(days=30)}
        elif period_filter == 'thisMonth':
            start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            query['date'] = {'$gte': start_of_month}
        
        feedback_list = list(feedback.find(query).sort('date', -1))
        
        # Calculate rating distribution
        all_feedback = list(feedback.find({}))
        rating_counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        total_ratings = 0
        total_score = 0
        
        for item in all_feedback:
            rating = item.get('rating', 5)
            rating_counts[rating] = rating_counts.get(rating, 0) + 1
            total_ratings += 1
            total_score += rating
        
        avg_rating = round(total_score / total_ratings, 1) if total_ratings > 0 else 0
        
        rating_distribution = {}
        for rating, count in rating_counts.items():
            rating_distribution[rating] = round((count / total_ratings * 100), 0) if total_ratings > 0 else 0
        
        # Convert ObjectId to string
        for item in feedback_list:
            item['_id'] = str(item['_id'])
            item['id'] = item['_id']
            if 'date' in item:
                item['date'] = item['date'].isoformat() if hasattr(item['date'], 'isoformat') else item['date']
        
        return jsonify({
            "feedback": feedback_list,
            "stats": {
                "total": total_ratings,
                "average_rating": avg_rating,
                "rating_distribution": rating_distribution
            }
        }), 200
        
    except jwt.ExpiredSignatureError:
        return jsonify({"message": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"message": "Invalid token"}), 401

# 9b. UPDATE FEEDBACK STATUS (Admin only)
@app.route('/admin/api/feedback/<feedback_id>', methods=['PUT'])
def update_feedback_status(feedback_id):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"message": "Unauthorized"}), 401
    
    token = auth_header.split(' ')[1]
    
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        if payload.get('role') != 'admin':
            return jsonify({"message": "Admin access required"}), 403
        
        data = request.get_json()
        from bson.objectid import ObjectId
        
        mongo.db.feedback.update_one(
            {'_id': ObjectId(feedback_id)},
            {'$set': {'status': data.get('status', 'pending')}}
        )
        
        return jsonify({"message": "Feedback updated successfully"}), 200
        
    except Exception as e:
        return jsonify({"message": str(e)}), 500

# 9c. DELETE FEEDBACK (Admin only)
@app.route('/admin/api/feedback/<feedback_id>', methods=['DELETE'])
def delete_feedback(feedback_id):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"message": "Unauthorized"}), 401
    
    token = auth_header.split(' ')[1]
    
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        if payload.get('role') != 'admin':
            return jsonify({"message": "Admin access required"}), 403
        
        from bson.objectid import ObjectId
        mongo.db.feedback.delete_one({'_id': ObjectId(feedback_id)})
        
        return jsonify({"message": "Feedback deleted successfully"}), 200
        
    except Exception as e:
        return jsonify({"message": str(e)}), 500

# 10. SUBMIT FEEDBACK (User)
@app.route('/feedback', methods=['POST'])
def submit_feedback():
    data = request.get_json()
    
    feedback = mongo.db.feedback
    new_feedback = {
        "user_name": data.get('user_name', 'Anonymous'),
        "user_email": data.get('user_email', ''),
        "rating": data.get('rating', 5),
        "category": data.get('category', 'general'),
        "message": data.get('message', ''),
        "date": datetime.datetime.utcnow(),
        "status": "pending"
    }
    
    feedback.insert_one(new_feedback)
    
    return jsonify({"message": "Feedback submitted successfully!"}), 201

if __name__ == '__main__':
    # Run on 0.0.0.0 so your mobile phone can access it on the same WiFi
    app.run(debug=True, host='0.0.0.0', port=5000)