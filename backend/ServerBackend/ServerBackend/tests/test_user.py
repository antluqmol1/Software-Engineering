from django.test import TestCase, Client
from django.urls import reverse
from ServerBackend.models import User, Tasks, Game, PickedTasks, Participant
import logging
import json

logger = logging.getLogger(__name__)

class UserTestCase(TestCase):
    def setUp(self):
        logger.info("Setting up test user...\n")
        self.client = Client()
        # Create a user
        self.user = User.objects.create_user(first_name="morten",
                                             last_name="yehsani",
                                             username="test_user",
                                             email="test@example.com",
                                             password="password123")
        
        # urls
        self.login_url = reverse('auth:user_login')
        self.logout_url = reverse('auth:user_logout')
        self.get_status_url = reverse('auth:get_login_status')
        self.create_user_url = reverse('user:put_user')
        self.create_admin_url = reverse('user:put_admin')
        self.get_username_url = reverse('user:get_user')

        # token variables
        self.token1 = None
        self.token2 = None
        
    def tearDown(self):
        logger.info("Tearing down test user...\n\n")
        # Clean up any resources used by the tests

        # Delete all users
        Game.objects.all().delete()


    
    def test_create_user(self):
        # Test the create user functionality
        logger.info("Testing create user...")

        # try to create a user with username already taken
        response = self.client.post(self.create_user_url, 
                                    data=json.dumps({'first_name': 'test',
                                                     'last_name': 'user',
                                                     'username': 'test_user', 
                                                     'email': 'test.notused@example.com',
                                                     'password': 'password123'}),
                                    content_type='application/json')
        self.assertTrue(response.status_code == 409)
        
        # try to create a user with email already taken
        response = self.client.post(self.create_user_url, 
                                    data=json.dumps({'first_name': 'test',
                                                     'last_name': 'user',
                                                     'username': 'test_user1', 
                                                     'password': 'password123', 
                                                     'email': 'test@example.com',}),
                                    content_type='application/json')
        self.assertTrue(response.status_code == 409)
        
        # try to create a user with both username and email already taken
        response = self.client.post(self.create_user_url, 
                                    data=json.dumps({'first_name': 'test',
                                                     'last_name': 'user',
                                                     'username': 'test_user', 
                                                     'password': 'password123', 
                                                     'email': 'test@example.com'}),
                                    content_type='application/json')
        self.assertTrue(response.status_code == 409)

        # try to create a user with missing fields
        response = self.client.post(self.create_user_url, 
                                    data=json.dumps({'first_name': 'test',
                                                     'last_name': 'user',
                                                     'username': None, 
                                                     'password': 'password123', 
                                                     'email': 'test@example.com'}),
                                    content_type='application/json')
        self.assertTrue(response.status_code == 409)
        
        # Create a user
        response = self.client.post(self.create_user_url, 
                                    data=json.dumps({'first_name': 'test',
                                                     'last_name': 'user',
                                                     'username': 'test_user_notused', 
                                                     'password': 'password123', 
                                                     'email': 'test.notused@example.com'}),
                                    content_type='application/json')
        self.assertTrue(response.status_code == 201)

    def test_status_calls(self):
        # Test the status calls
        logger.info("Testing status calls...")

        # test get status when not logged in
        response = self.client.get(self.get_status_url)
        self.assertTrue(response.status_code == 204)

        # login
        response = self.client.post(self.login_url, 
                                    data=json.dumps({'username':'test_user',
                                                     'password':'password123'}),
                                                     content_type='application/json')
        self.assertEqual(response.status_code, 200)

        # test get status when logged in
        response = self.client.get(self.get_status_url)
        self.assertTrue(response.status_code == 200)

        # get username
        response = self.client.get(self.get_username_url)
        self.assertEqual(response.status_code, 200)

    
    # def test_create_admin(self):
    #     # Test the create admin functionality
    #     logger.info("Testing create admin...")

    #     # Create an admin
    #     response = self.client.post(reverse('user:put_admin'), 
    #                                 data=json.dumps({'first_name': 'test',
    #                                                  'last_name': 'admin',
    #                                                  'username': 'test_admin', 
    #                                                  'email': 'admin@admin.com',
    #                                                  'password': 'adminpassword'}),
    #                                 content_type='application/json')


        

