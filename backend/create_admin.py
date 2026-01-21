import requests
import json

# Create admin account
url = "http://localhost:5000/admin/create"

admin_data = {
    "full_name": "Admin User",
    "email": "admin@sign-lingo.com",
    "password": "admin123"
}

try:
    response = requests.post(url, json=admin_data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
