#!/usr/bin/env python
"""
Script to test API endpoints.
"""
import os
import sys
import django
import requests
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rodocheck_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


def test_api_endpoints():
    """Test all API endpoints."""
    client = APIClient()
    
    print("Testing API Endpoints...")
    
    # Test 1: Health check
    print("\n1. Testing health check...")
    try:
        response = client.get('/api/')
        print(f"   Status: {response.status_code}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 2: Authentication endpoints
    print("\n2. Testing authentication endpoints...")
    
    # Test user info (should fail without auth)
    response = client.get('/api/auth/me/')
    print(f"   GET /api/auth/me/ - Status: {response.status_code}")
    
    # Test 3: Vehicle endpoints
    print("\n3. Testing vehicle endpoints...")
    
    # Test vehicle list (should fail without auth)
    response = client.get('/api/vehicles/')
    print(f"   GET /api/vehicles/ - Status: {response.status_code}")
    
    # Test 4: Checklist endpoints
    print("\n4. Testing checklist endpoints...")
    
    # Test checklist list (should fail without auth)
    response = client.get('/api/checklists/')
    print(f"   GET /api/checklists/ - Status: {response.status_code}")
    
    print("\nAPI endpoint tests completed!")


def create_test_user():
    """Create a test user for manual testing."""
    try:
        user = User.objects.create_user(
            username='test@example.com',
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User',
            role='driver'
        )
        print(f"Test user created: {user.email}")
        return user
    except Exception as e:
        print(f"Error creating test user: {e}")
        return None


if __name__ == '__main__':
    print("Starting API tests...")
    
    # Create test user
    user = create_test_user()
    
    # Run endpoint tests
    test_api_endpoints()
    
    print("\nAll tests completed!")
