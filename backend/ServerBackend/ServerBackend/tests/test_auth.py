from django.test import TestCase, Client
from django.urls import reverse
from ServerBackend.models import User, Tasks, Game, PickedTasks, Participant
import logging  

logger = logging.getLogger(__name__)

class AuthTestCase(TestCase):
    def setUp(self):
        logger.info("Setting up test auth...")
        self.client = Client()
        # Create a user
        self.user = User.objects.create_user(first_name="something",
                                             last_name="else",
                                             username="test_user",
                                             email="test@example.com",
                                             password="password123")
        self.login_url = reverse('user_login')
        self.logout_url = reverse('user_logout')
        self.get_profile_url = reverse('get_profile')
        
    def tearDown(self):
        logger.info("Tearing down test auth...")
        # Clean up any resources used by the tests
        User.objects.filter(username="test_user").delete()
        
    def test_login(self):
        # Test the login functionality
        logger.info("Testing login...")
        # Attempt to login with wrong password
        response = self.client.post(self.login_url, data={'username': 'test_user', 'password': 'wrong_password'})
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json['msg'], 'Invalid credentials')
        
        # Login with proper password
        response = self.client.post(self.login_url, data={'username': 'test_user', 'password': 'password123'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['msg'], 'Login successful')
        # check that token is issued
        self.assertIsNone(response.json["token"])

    def test_logout(self):
        logger.info("Testing logout...")
        # Test the logout functionality
        # Login with proper password
        # Might still be logged in, might remove this
        response = self.client.post(self.login_url, data={'username': 'test_user', 'password': 'password123'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['msg'], 'Login successful')
        
        # Logout
        response = self.client.post(self.logout_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['success'], True)

        # Logout when not logged in
        response = self.client.post(self.logout_url)
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json['success'], True)
        self.assertEqual(response.json['msg'], 'not authenticated')
        
        # Attempt to access a protected resource after logout
        response = self.client.get(self.get_profile_url)
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json['success'], False)
        self.assertEqual(response.json['msg'], 'not authenticated')