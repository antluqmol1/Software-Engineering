from django.test import TestCase, Client
from django.urls import reverse
from ServerBackend.models import User, Tasks, Game, PickedTasks, Participant
import logging
import json

logger = logging.getLogger(__name__)

class AuthTestCase(TestCase):
    def setUp(self):
        logger.info("Setting up test auth...\n")
        self.client = Client()
        # Create a user
        self.user = User.objects.create_user(first_name="something",
                                             last_name="else",
                                             username="test_user",
                                             email="test@example.com",
                                             password="password123")
        self.login_url = reverse('auth:user_login')
        self.logout_url = reverse('auth:user_logout')
        self.token_url = reverse('auth:grab_token')
        self.get_profile_url = reverse('user:profile:get_profile')

        # token variables
        self.token1 = None
        self.token2 = None
        
    def tearDown(self):
        logger.info("Tearing down test auth...\n\n")
        # Clean up any resources used by the tests
        User.objects.filter(username="test_user").delete()
        
    def test_login(self):
        # Test the login functionality
        logger.info("Testing login...")
        # Attempt to login with wrong password
        logger.info("\nTesting with wrong password...")
        response = self.client.post(self.login_url, 
                                    data=json.dumps({'username': 'test_user', 'password': 'wrong_password'}),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()['error'], 'Invalid credentials')

        logger.info("\nTesting with missing fields...")
        # login with missing fields
        response = self.client.post(self.login_url, 
                                    data=json.dumps({'username': None, 'password': None}),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()['error'], 'Missing username or password')

        logger.info("\nTesting with correct info...")
        # Login with proper password
        response = self.client.post(self.login_url, 
                                    data=json.dumps({'username': 'test_user', 'password': 'password123'}),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['msg'], 'Login successful')

        # check that JWT is issued, now that we are logged in
        self.assertIsNotNone(response.json()["JWT"])

    def test_logout(self):
        logger.info("Testing logout...")
        # Test the logout functionality
        # Login with proper password
        # Might still be logged in, might remove this
        logger.info("\nLogging in...")
        response = self.client.post(self.login_url, 
                                    data=json.dumps({'username': 'test_user', 'password': 'password123'}),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['msg'], 'Login successful')

        # Logout
        logger.info("\nLogging out...")
        response = self.client.post(self.logout_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['success'], True)

        # Logout when not logged in
        logger.info("\nLogging out when not logged in...")
        response = self.client.post(self.logout_url)
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()['success'], False)
        self.assertEqual(response.json()['msg'], 'not authenticated')
        
        # Attempt to access a protected resource after logout
        logger.info("\nAccessing protected resource after logout...")
        response = self.client.get(self.get_profile_url)
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()['success'], False)
        self.assertEqual(response.json()['msg'], 'not authenticated')

    def test_csrf_token(self):
        logger.info("Testing token...")

        # Test the csrf token functionality when not logged in
        logger.info("\nTesting token when not logged in...")
        response = self.client.get(self.token_url)
        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(response.json()['csrfToken'])
        self.token1 = response.json()['csrfToken']

        # login
        logger.info("\nLogging in...")
        response = self.client.post(self.login_url,
                                    data=json.dumps({'username': 'test_user', 'password': 'password123'}),
                                    content_type='application/json',
                                    HTTP_X_CSRFTOKEN=self.token1)
        
        # Test the csrf token functionality when logged in
        logger.info("\nTesting token when logged in...")
        response = self.client.get(self.token_url)
        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(response.json()['csrfToken'])
        self.token2 = response.json()['csrfToken']

        # token from when logged in and not logged in should not be the same
        self.assertNotEqual(self.token1, self.token2)
