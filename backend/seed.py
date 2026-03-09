"""
Run this after migrate to create a demo superuser.
  python seed.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print("✅ Created superuser: admin / admin123")
else:
    print("ℹ️  Superuser already exists")

if not User.objects.filter(username='demo').exists():
    User.objects.create_user('demo', 'demo@example.com', 'demo123', first_name='Demo', last_name='User')
    print("✅ Created demo user: demo / demo123")
else:
    print("ℹ️  Demo user already exists")
