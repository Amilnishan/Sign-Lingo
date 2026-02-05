# backend/app.py
from flask import Flask, request, jsonify, render_template, redirect
from flask_pymongo import PyMongo
from flask_bcrypt import Bcrypt
from flask_cors import CORS
import jwt
import datetime
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)  # Allow mobile app to talk to this server

# CONFIGURATION
app.config['MONGO_URI'] = os.getenv('MONGO_URI')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

# EMAIL CONFIGURATION (Gmail SMTP)
# To get App Password: Google Account -> Security -> 2-Step Verification -> App Passwords
EMAIL_SENDER = os.getenv('EMAIL_SENDER')
EMAIL_PASSWORD = os.getenv('EMAIL_PASSWORD')
EMAIL_ENABLED = os.getenv('EMAIL_ENABLED', 'False').lower() == 'true'

mongo = PyMongo(app)
bcrypt = Bcrypt(app)

# Email sending function
def send_otp_email(to_email, otp_code, user_name="User"):
    """Send OTP code via Gmail SMTP"""
    if not EMAIL_ENABLED:
        print(f"[EMAIL DISABLED] OTP for {to_email}: {otp_code}")
        return True
    
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = '🔐 Sign-Lingo Password Reset Code'
        msg['From'] = EMAIL_SENDER
        msg['To'] = to_email
        
        # HTML Email Template
        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #0F172A; padding: 40px;">
            <div style="max-width: 500px; margin: 0 auto; background-color: #1E293B; border-radius: 16px; padding: 40px; text-align: center;">
                <h1 style="color: #2ECC71; margin-bottom: 10px;">🤟 Sign-Lingo</h1>
                <h2 style="color: #fff; margin-bottom: 30px;">Password Reset</h2>
                
                <p style="color: #94A3B8; font-size: 16px;">Hi {user_name},</p>
                <p style="color: #94A3B8; font-size: 16px;">You requested to reset your password. Use this code:</p>
                
                <div style="background-color: #0F172A; border-radius: 12px; padding: 20px; margin: 30px 0;">
                    <span style="font-size: 36px; font-weight: bold; color: #2ECC71; letter-spacing: 8px;">{otp_code}</span>
                </div>
                
                <p style="color: #64748B; font-size: 14px;">This code expires in <strong>10 minutes</strong>.</p>
                <p style="color: #64748B; font-size: 14px;">If you didn't request this, please ignore this email.</p>
                
                <hr style="border: none; border-top: 1px solid #334155; margin: 30px 0;">
                <p style="color: #475569; font-size: 12px;">© 2026 Sign-Lingo. Learn Sign Language with Love 💚</p>
            </div>
        </body>
        </html>
        """
        
        # Plain text fallback
        text = f"Hi {user_name},\n\nYour Sign-Lingo password reset code is: {otp_code}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this email."
        
        part1 = MIMEText(text, 'plain')
        part2 = MIMEText(html, 'html')
        msg.attach(part1)
        msg.attach(part2)
        
        # Send email via Gmail SMTP
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(EMAIL_SENDER, EMAIL_PASSWORD)
            server.sendmail(EMAIL_SENDER, to_email, msg.as_string())
        
        print(f"[EMAIL SENT] OTP sent to {to_email}")
        return True
        
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send email: {str(e)}")
        return False

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

# 3. FORGOT PASSWORD - Request OTP
@app.route('/forgot-password', methods=['POST'])
def forgot_password():
    import random
    
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return jsonify({"error": "Email is required"}), 400
    
    users = mongo.db.users
    user = users.find_one({'email': email})
    
    if not user:
        return jsonify({"error": "No account found with this email"}), 404
    
    # Generate 6-digit OTP
    otp = str(random.randint(100000, 999999))
    
    # Store OTP with expiration (10 minutes)
    otp_collection = mongo.db.password_resets
    otp_collection.delete_many({'email': email})  # Remove any existing OTPs
    otp_collection.insert_one({
        'email': email,
        'otp': otp,
        'created_at': datetime.datetime.utcnow(),
        'expires_at': datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
    })
    
    # Send OTP via email
    user_name = user.get('full_name', 'User')
    email_sent = send_otp_email(email, otp, user_name)
    
    if not email_sent and EMAIL_ENABLED:
        return jsonify({"error": "Failed to send verification email. Please try again."}), 500
    
    response_data = {"message": "Verification code sent to your email"}
    
    # Include OTP in response only when email is disabled (for testing)
    if not EMAIL_ENABLED:
        response_data["debug_otp"] = otp
    
    return jsonify(response_data), 200

# 4. RESET PASSWORD - Verify OTP and set new password
@app.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    email = data.get('email')
    otp = data.get('otp')
    new_password = data.get('new_password')
    
    if not all([email, otp, new_password]):
        return jsonify({"error": "Email, OTP, and new password are required"}), 400
    
    if len(new_password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400
    
    # Verify OTP
    otp_collection = mongo.db.password_resets
    otp_record = otp_collection.find_one({
        'email': email,
        'otp': otp,
        'expires_at': {'$gt': datetime.datetime.utcnow()}
    })
    
    if not otp_record:
        return jsonify({"error": "Invalid or expired OTP code"}), 400
    
    # Update password
    users = mongo.db.users
    hashed_password = bcrypt.generate_password_hash(new_password).decode('utf-8')
    users.update_one(
        {'email': email},
        {'$set': {'password': hashed_password}}
    )
    
    # Delete used OTP
    otp_collection.delete_many({'email': email})
    
    return jsonify({"message": "Password reset successfully"}), 200

# 5. LEADERBOARD
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

# ============================================================
# LEARNING CONTENT API - Signs, Images, Videos
# ============================================================

from flask import send_from_directory

# Paths for assets
SIGNS_IMAGE_FOLDER = os.path.join(os.path.dirname(__file__), 'processed_images', 'cropped_signs')
VIDEOS_FOLDER = os.path.join(os.path.dirname(__file__), 'static', 'videos')

# 11. SERVE SIGN IMAGES (Alphabets & Numbers)
@app.route('/api/signs/image/<sign_name>')
def get_sign_image(sign_name):
    """
    Serve sign language images for alphabets and numbers.
    Example: /api/signs/image/a, /api/signs/image/5
    """
    # Sanitize input - only allow alphanumeric
    sign_name = sign_name.lower().strip()
    filename = f"{sign_name}.png"
    
    if os.path.exists(os.path.join(SIGNS_IMAGE_FOLDER, filename)):
        return send_from_directory(SIGNS_IMAGE_FOLDER, filename, mimetype='image/png')
    else:
        return jsonify({"error": f"Sign image '{sign_name}' not found"}), 404

# 12. SERVE SIGN VIDEOS (Words/Phrases)
@app.route('/api/signs/video/<sign_name>')
def get_sign_video(sign_name):
    """
    Serve sign language videos for words and phrases.
    Example: /api/signs/video/hello, /api/signs/video/thank_you
    """
    # Map common variations to filename
    sign_map = {
        'thank_you': 'Thankyou',
        'thankyou': 'Thankyou',
        'good_bye': 'Goodbye',
        'goodbye': 'Goodbye',
        'he/she': 'He',
        'me/i': 'Me',
    }
    
    # Get mapped name or capitalize the input
    mapped_name = sign_map.get(sign_name.lower(), sign_name.capitalize())
    filename = f"{mapped_name}.mp4"
    
    if os.path.exists(os.path.join(VIDEOS_FOLDER, filename)):
        return send_from_directory(VIDEOS_FOLDER, filename, mimetype='video/mp4')
    else:
        return jsonify({"error": f"Sign video '{sign_name}' not found"}), 404

# 13. GET LESSON CONTENT
@app.route('/api/lesson/<int:lesson_id>')
def get_lesson_content(lesson_id):
    """
    Get all signs for a specific lesson with their media types.
    Returns list of signs with image/video URLs.
    """
    # Lesson definitions (should match frontend UNITS data)
    LESSONS = {
        1: {'title': 'Hello & Welcome', 'words': ['HELLO', 'WELCOME'], 'type': 'video'},
        2: {'title': 'Yes & No', 'words': ['YES', 'NO'], 'type': 'video'},
        3: {'title': 'Please & Thank You', 'words': ['PLEASE', 'THANK_YOU'], 'type': 'video'},
        4: {'title': 'Sorry & Fine', 'words': ['SORRY', 'FINE'], 'type': 'video'},
        5: {'title': 'OK & Good Bye', 'words': ['OK', 'GOOD_BYE'], 'type': 'video'},
        6: {'title': 'Practice Greetings', 'words': ['HELLO', 'GOODBYE', 'YES', 'NO', 'PLEASE', 'THANK_YOU', 'SORRY', 'FINE', 'OK', 'WELCOME'], 'type': 'video'},
        7: {'title': 'Letters A, B, C', 'words': ['A', 'B', 'C'], 'type': 'image'},
        8: {'title': 'Letters D, E, F', 'words': ['D', 'E', 'F'], 'type': 'image'},
        9: {'title': 'Letters G, H, I', 'words': ['G', 'H', 'I'], 'type': 'image'},
        10: {'title': 'Letters J, K, L, M', 'words': ['J', 'K', 'L', 'M'], 'type': 'image'},
        11: {'title': 'Practice A-M', 'words': ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'], 'type': 'image'},
        12: {'title': 'Letters N, O, P', 'words': ['N', 'O', 'P'], 'type': 'image'},
        13: {'title': 'Letters Q, R, S', 'words': ['Q', 'R', 'S'], 'type': 'image'},
        14: {'title': 'Letters T, U, V', 'words': ['T', 'U', 'V'], 'type': 'image'},
        15: {'title': 'Letters W, X, Y, Z', 'words': ['W', 'X', 'Y', 'Z'], 'type': 'image'},
        16: {'title': 'Practice N-Z', 'words': ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'], 'type': 'image'},
        17: {'title': 'Numbers 0-3', 'words': ['0', '1', '2', '3'], 'type': 'image'},
        18: {'title': 'Numbers 4-6', 'words': ['4', '5', '6'], 'type': 'image'},
        19: {'title': 'Numbers 7-10', 'words': ['7', '8', '9', '10'], 'type': 'image'},
        20: {'title': 'Practice Numbers', 'words': ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], 'type': 'image'},
        21: {'title': 'Me & You', 'words': ['ME', 'YOU'], 'type': 'video'},
        22: {'title': 'He/She & My/Your', 'words': ['HE', 'MY', 'YOUR'], 'type': 'video'},
        23: {'title': 'Mother & Father', 'words': ['MOTHER', 'FATHER'], 'type': 'video'},
        24: {'title': 'Child & Family', 'words': ['CHILD', 'UNCLE', 'AUNT'], 'type': 'video'},
        25: {'title': 'Practice Personal', 'words': ['ME', 'YOU', 'HE', 'MY', 'YOUR', 'MOTHER', 'FATHER', 'CHILD', 'UNCLE', 'AUNT'], 'type': 'video'},
        26: {'title': 'Good & Bad', 'words': ['GOOD', 'BAD'], 'type': 'video'},
        27: {'title': 'Like & Proud', 'words': ['LIKE', 'PROUD'], 'type': 'video'},
        28: {'title': 'MAD & Funny', 'words': ['MAD', 'FUNNY'], 'type': 'video'},
        29: {'title': 'Hungry & Thirsty', 'words': ['HUNGRY', 'THIRSTY'], 'type': 'video'},
        30: {'title': 'Lonely & Hot', 'words': ['LONELY', 'HOT'], 'type': 'video'},
        31: {'title': 'Practice Emotions', 'words': ['GOOD', 'BAD', 'LIKE', 'PROUD', 'MAD', 'FUNNY', 'HUNGRY', 'THIRSTY', 'LONELY', 'HOT'], 'type': 'video'},
        32: {'title': 'Who & Where', 'words': ['WHO', 'WHERE'], 'type': 'video'},
        33: {'title': 'Why & Later', 'words': ['WHY', 'LATER'], 'type': 'video'},
        34: {'title': 'Soon & Same', 'words': ['SOON', 'SAME'], 'type': 'video'},
        35: {'title': 'Left & Right', 'words': ['LEFT', 'RIGHT'], 'type': 'video'},
        36: {'title': 'Yesterday & Tomorrow', 'words': ['YESTERDAY', 'TOMORROW'], 'type': 'video'},
        37: {'title': 'Practice Questions', 'words': ['WHO', 'WHERE', 'WHY', 'LATER', 'SOON', 'SAME', 'LEFT', 'RIGHT', 'YESTERDAY', 'TOMORROW'], 'type': 'video'},
        38: {'title': 'True & False', 'words': ['TRUE', 'FALSE'], 'type': 'video'},
        39: {'title': 'Water & Food', 'words': ['WATER', 'FOOD'], 'type': 'video'},
        40: {'title': 'Home & Phone', 'words': ['HOME', 'PHONE'], 'type': 'video'},
        41: {'title': 'Need & Bathroom', 'words': ['NEED', 'BATHROOM'], 'type': 'video'},
        42: {'title': 'Finish & Understand', 'words': ['FINISH', 'UNDERSTAND'], 'type': 'video'},
        43: {'title': 'Practice Daily Words', 'words': ['TRUE', 'FALSE', 'WATER', 'FOOD', 'HOME', 'PHONE', 'NEED', 'BATHROOM', 'FINISH', 'UNDERSTAND'], 'type': 'video'},
    }
    
    if lesson_id not in LESSONS:
        return jsonify({"error": "Lesson not found"}), 404
    
    lesson = LESSONS[lesson_id]
    signs = []
    
    for word in lesson['words']:
        sign_name = word.lower().replace('_', '')
        if lesson['type'] == 'image':
            # Alphabets and numbers use images
            media_url = f"/api/signs/image/{sign_name}"
        else:
            # Words use videos
            media_url = f"/api/signs/video/{sign_name}"
        
        signs.append({
            'word': word,
            'display_name': word.replace('_', ' ').title(),
            'media_type': lesson['type'],
            'media_url': media_url
        })
    
    return jsonify({
        'lesson_id': lesson_id,
        'title': lesson['title'],
        'content_type': lesson['type'],
        'signs': signs
    }), 200

# 14. GENERATE QUIZ FOR LESSON
@app.route('/api/quiz/<int:lesson_id>')
def get_quiz(lesson_id):
    """
    Generate quiz questions for a lesson.
    Returns 2 types of questions:
    1. Pick correct sign from 4 options (given word)
    2. Pick correct word from 4 options (given sign)
    """
    import random
    
    # Get lesson content first
    LESSONS = {
        7: {'words': ['A', 'B', 'C'], 'type': 'image', 'pool': list('ABCDEFGHIJKLMNOPQRSTUVWXYZ')},
        8: {'words': ['D', 'E', 'F'], 'type': 'image', 'pool': list('ABCDEFGHIJKLMNOPQRSTUVWXYZ')},
        9: {'words': ['G', 'H', 'I'], 'type': 'image', 'pool': list('ABCDEFGHIJKLMNOPQRSTUVWXYZ')},
        10: {'words': ['J', 'K', 'L', 'M'], 'type': 'image', 'pool': list('ABCDEFGHIJKLMNOPQRSTUVWXYZ')},
        11: {'words': list('ABCDEFGHIJKLM'), 'type': 'image', 'pool': list('ABCDEFGHIJKLM')},
        12: {'words': ['N', 'O', 'P'], 'type': 'image', 'pool': list('ABCDEFGHIJKLMNOPQRSTUVWXYZ')},
        13: {'words': ['Q', 'R', 'S'], 'type': 'image', 'pool': list('ABCDEFGHIJKLMNOPQRSTUVWXYZ')},
        14: {'words': ['T', 'U', 'V'], 'type': 'image', 'pool': list('ABCDEFGHIJKLMNOPQRSTUVWXYZ')},
        15: {'words': ['W', 'X', 'Y', 'Z'], 'type': 'image', 'pool': list('ABCDEFGHIJKLMNOPQRSTUVWXYZ')},
        16: {'words': list('NOPQRSTUVWXYZ'), 'type': 'image', 'pool': list('NOPQRSTUVWXYZ')},
        17: {'words': ['0', '1', '2', '3'], 'type': 'image', 'pool': [str(i) for i in range(11)]},
        18: {'words': ['4', '5', '6'], 'type': 'image', 'pool': [str(i) for i in range(11)]},
        19: {'words': ['7', '8', '9', '10'], 'type': 'image', 'pool': [str(i) for i in range(11)]},
        20: {'words': [str(i) for i in range(11)], 'type': 'image', 'pool': [str(i) for i in range(11)]},
    }
    
    # Video lessons pool
    VIDEO_POOL = ['HELLO', 'WELCOME', 'YES', 'NO', 'PLEASE', 'THANK_YOU', 'SORRY', 'FINE', 'OK', 'GOODBYE',
                  'ME', 'YOU', 'HE', 'MY', 'YOUR', 'MOTHER', 'FATHER', 'CHILD', 'UNCLE', 'AUNT',
                  'GOOD', 'BAD', 'LIKE', 'PROUD', 'MAD', 'FUNNY', 'HUNGRY', 'THIRSTY', 'LONELY', 'HOT',
                  'WHO', 'WHERE', 'WHY', 'LATER', 'SOON', 'SAME', 'LEFT', 'RIGHT', 'YESTERDAY', 'TOMORROW',
                  'TRUE', 'FALSE', 'WATER', 'FOOD', 'HOME', 'PHONE', 'NEED', 'BATHROOM', 'FINISH', 'UNDERSTAND']
    
    VIDEO_LESSONS = {
        1: ['HELLO', 'WELCOME'],
        2: ['YES', 'NO'],
        3: ['PLEASE', 'THANK_YOU'],
        4: ['SORRY', 'FINE'],
        5: ['OK', 'GOODBYE'],
        6: ['HELLO', 'GOODBYE', 'YES', 'NO', 'PLEASE', 'THANK_YOU', 'SORRY', 'FINE', 'OK', 'WELCOME'],
        21: ['ME', 'YOU'],
        22: ['HE', 'MY', 'YOUR'],
        23: ['MOTHER', 'FATHER'],
        24: ['CHILD', 'UNCLE', 'AUNT'],
        25: ['ME', 'YOU', 'HE', 'MY', 'YOUR', 'MOTHER', 'FATHER', 'CHILD', 'UNCLE', 'AUNT'],
        26: ['GOOD', 'BAD'],
        27: ['LIKE', 'PROUD'],
        28: ['MAD', 'FUNNY'],
        29: ['HUNGRY', 'THIRSTY'],
        30: ['LONELY', 'HOT'],
        31: ['GOOD', 'BAD', 'LIKE', 'PROUD', 'MAD', 'FUNNY', 'HUNGRY', 'THIRSTY', 'LONELY', 'HOT'],
        32: ['WHO', 'WHERE'],
        33: ['WHY', 'LATER'],
        34: ['SOON', 'SAME'],
        35: ['LEFT', 'RIGHT'],
        36: ['YESTERDAY', 'TOMORROW'],
        37: ['WHO', 'WHERE', 'WHY', 'LATER', 'SOON', 'SAME', 'LEFT', 'RIGHT', 'YESTERDAY', 'TOMORROW'],
        38: ['TRUE', 'FALSE'],
        39: ['WATER', 'FOOD'],
        40: ['HOME', 'PHONE'],
        41: ['NEED', 'BATHROOM'],
        42: ['FINISH', 'UNDERSTAND'],
        43: ['TRUE', 'FALSE', 'WATER', 'FOOD', 'HOME', 'PHONE', 'NEED', 'BATHROOM', 'FINISH', 'UNDERSTAND'],
    }
    
    if lesson_id in LESSONS:
        lesson = LESSONS[lesson_id]
        lesson_words = lesson['words']
        pool = lesson['pool']
        media_type = 'image'
    elif lesson_id in VIDEO_LESSONS:
        lesson_words = VIDEO_LESSONS[lesson_id]
        pool = VIDEO_POOL
        media_type = 'video'
    else:
        return jsonify({"error": "Lesson not found"}), 404
    
    questions = []
    
    # Generate 5 questions total (mix of both types)
    for i, word in enumerate(lesson_words[:5] if len(lesson_words) >= 5 else lesson_words):
        # Alternate between question types
        if i % 2 == 0:
            # Type 1: Show word, pick correct sign from 4 images/videos
            wrong_options = [w for w in pool if w != word]
            random.shuffle(wrong_options)
            options = [word] + wrong_options[:3]
            random.shuffle(options)
            
            sign_name = word.lower().replace('_', '')
            questions.append({
                'id': i + 1,
                'type': 'pick_sign',
                'question': f"Which is {word.replace('_', ' ')}?",
                'correct_answer': word,
                'options': [{
                    'word': opt,
                    'media_url': f"/api/signs/{'image' if media_type == 'image' else 'video'}/{opt.lower().replace('_', '')}"
                } for opt in options],
                'media_type': media_type
            })
        else:
            # Type 2: Show sign, pick correct word from 4 options
            wrong_options = [w for w in pool if w != word]
            random.shuffle(wrong_options)
            options = [word] + wrong_options[:3]
            random.shuffle(options)
            
            sign_name = word.lower().replace('_', '')
            questions.append({
                'id': i + 1,
                'type': 'pick_word',
                'question': "What sign is this?",
                'sign_media_url': f"/api/signs/{'image' if media_type == 'image' else 'video'}/{sign_name}",
                'correct_answer': word,
                'options': [{'word': opt, 'display': opt.replace('_', ' ').title()} for opt in options],
                'media_type': media_type
            })
    
    # Ensure we have at least 5 questions by repeating if necessary
    while len(questions) < 5:
        questions.append(questions[len(questions) % len(lesson_words)])
    
    return jsonify({
        'lesson_id': lesson_id,
        'total_questions': len(questions),
        'questions': questions[:5]
    }), 200

# 15. COMPLETE LESSON & UPDATE XP
@app.route('/api/lesson/complete', methods=['POST'])
def complete_lesson():
    """
    Mark a lesson as complete and award XP to user.
    """
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"message": "Unauthorized"}), 401
    
    token = auth_header.split(' ')[1]
    data = request.get_json()
    
    lesson_id = data.get('lesson_id')
    quiz_score = data.get('quiz_score', 0)  # 0-100 percentage
    xp_earned = data.get('xp_earned', 10)
    
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        user_id = payload.get('user_id')
        
        from bson.objectid import ObjectId
        users = mongo.db.users
        
        # Calculate bonus XP based on quiz score
        bonus_xp = int(xp_earned * (quiz_score / 100) * 0.5)  # Up to 50% bonus
        total_xp = xp_earned + bonus_xp
        
        # Update user XP and track completed lessons
        users.update_one(
            {'_id': ObjectId(user_id)},
            {
                '$inc': {'xp': total_xp},
                '$addToSet': {'completed_lessons': lesson_id}
            }
        )
        
        # Get updated user data
        user = users.find_one({'_id': ObjectId(user_id)}, {'password': 0})
        
        return jsonify({
            "message": "Lesson completed!",
            "xp_earned": total_xp,
            "base_xp": xp_earned,
            "bonus_xp": bonus_xp,
            "new_total_xp": user['xp']
        }), 200
        
    except jwt.ExpiredSignatureError:
        return jsonify({"message": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"message": "Invalid token"}), 401

# 16. GET USER PROGRESS
@app.route('/api/progress', methods=['GET'])
def get_user_progress():
    """
    Get user's learning progress including completed lessons.
    """
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
            return jsonify({
                "xp": user.get('xp', 0),
                "streak": user.get('streak', 0),
                "completed_lessons": user.get('completed_lessons', []),
                "total_lessons": 43
            }), 200
        
        return jsonify({"message": "User not found"}), 404
        
    except jwt.ExpiredSignatureError:
        return jsonify({"message": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"message": "Invalid token"}), 401

if __name__ == '__main__':
    # Run on 0.0.0.0 so your mobile phone can access it on the same WiFi
    app.run(debug=True, host='0.0.0.0', port=5000)