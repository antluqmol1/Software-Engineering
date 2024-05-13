from django.core.files.storage import default_storage
from django.test import TestCase, Client
from django.urls import reverse
from ServerBackend.models import User
import logging
import json
import base64
import os

logger = logging.getLogger(__name__)


'''
NB!
The pictures are stored in the actual media folder of the server, 
user ID 1 should have no pictures stored when conducting the tests.

To see if user ID 1 has any pictures stored, check the media/customs
folder for any png or jpg files starting with the name "1_" or "1."

We could delete all pictures of user ID 1 before running the tests,
but we've decided not to
'''

class TestProfile(TestCase):
    def setUp(self):
        logger.info("Setting up test profile...")
        # Make a client
        self.client = Client()
        # Create a user
        self.user = User.objects.create_user(first_name='test',
                                             last_name='testy',
                                             username='test_user',
                                             email='test.testy@testdomain.com',
                                             password='testing401')
        
        # setup urls
        self.login_url = reverse('auth:user_login')
        self.get_profile_url = reverse('user:profile:get_profile')
        self.update_profile_url = reverse('user:profile:update_profile')
        self.get_picture_url = reverse('user:profile:get_profile_picture')
        self.upload_picture_url = reverse('user:profile:upload_profile_picture')
        self.get_all_pictures_url = reverse('user:profile:get_all_profile_pictures')
        self.update_picture_url = reverse('user:profile:update_profile_picture')
        self.delete_picture_url = reverse('user:profile:delete_profile_picture')

        # init relative_image_path
        self.relative_image_path = None

        self.client.login(username='test_user', password='testing401')

    def tearDown(self):
        logger.info("Tearing down test profile...")
        # Clean up any resources used by the tests
        User.objects.filter(username="test_user").delete()

        if self.relative_image_path is not None:
            if default_storage.exists(self.relative_image_path):
                success = default_storage.delete(self.relative_image_path)
                logger.info(f"Deleted image? \t{success}")

    def test_profile_view(self):
        logger.info("Testing profile view...")

        # get profile data
        response = self.client.get(self.get_profile_url)
        self.assertEqual(response.status_code, 200)

        # Check that the response data is correct
        response_data = response.json()['user_data']
        self.assertEqual(response_data['first_name'], 'test')
        self.assertEqual(response_data['last_name'], 'testy')
        self.assertEqual(response_data['username'], 'test_user')
        self.assertEqual(response_data['email'], 'test.testy@testdomain.com')

        # accessing profile without logging in is covered in test_auth.py

    def test_update_profile_view(self):
        logger.info("Testing update profile view...")

        # update first name of user
        response = self.client.put(self.update_profile_url, 
                                    data=json.dumps({'field': 'first_name', 'value': 'newname'}),
                                    content_type='application/json')
        self.assertTrue(response.json()['success'])
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['msg'], 'Profile updated successfully')

        # update invalid field
        response = self.client.put(self.update_profile_url, 
                                    data=json.dumps({'password': 'newpasswordplease'}),
                                    content_type='application/json')
        self.assertFalse(response.json()['success'])
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()['error'], 'Invalid field')


    def test_get_picture_view(self):
        logger.info("Testing get picture view...")
        response = self.client.get(self.get_picture_url)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['success'])
        
        # Get the base64 string from the response
        base64_string = response.json()['image']
        
        # Validate the base64 encoded string
        try:
            base64.b64decode(base64_string)
            self.assertTrue(True)
        except base64.binascii.Error:
            self.assertTrue(False)

    def test_upload_picture_view(self):
        logger.info("Testing upload picture view...")
        # Open the file

        # Get the directory where this file is located
        dir_path = os.path.dirname(os.path.realpath(__file__))
        # Construct the full path to the image file
        file_path = os.path.join(dir_path, 'media_for_tests', 'profile_pic_test.png')
        with open(file_path, 'rb') as file:
            # Create a dictionary with the file data
            data = {'profileImage': file}
            # Upload the picture
            response = self.client.post(self.upload_picture_url, data, format='multipart')
            self.assertEqual(response.status_code, 201)
            self.assertTrue(response.json()['success'])
            self.assertEqual(response.json()['msg'], 'Updated image successfully')
            self.relative_image_path = response.json()['path']

    def test_get_all_pictures_view(self):
        logger.info("Testing get all pictures view...")

        # retrieving custom pictures when none exist
        # ACTUALLY: we are saving the pictures in media folder,
        response = self.client.get(self.get_all_pictures_url)
        self.assertFalse(response.json()['success'])
        self.assertEqual(response.status_code, 404)

        # Open test image and upload
        dir_path = os.path.dirname(os.path.realpath(__file__))
        file_path = os.path.join(dir_path, 'media_for_tests', 'profile_pic_test.png')
        with open(file_path, 'rb') as file:
            # Create a dictionary with the file data
            data = {'profileImage': file}
            # Upload the picture
            response = self.client.post(self.upload_picture_url, data, format='multipart')
            self.assertEqual(response.status_code, 201)
            self.assertTrue(response.json()['success'])
            self.assertEqual(response.json()['msg'], 'Updated image successfully')

        response = self.client.get(self.get_all_pictures_url)
        self.assertTrue(response.json()['success'])
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()['images']), 1)


    def test_update_picture_view(self):
        logger.info("Testing update picture view...")


    def test_delete_picture_view(self):
        logger.info("Testing delete picture view...")
