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
        logger.info("Setting up test profile...\n")
        # Make a client
        self.client = Client()
        # Create first test user
        self.user = User.objects.create_user(first_name='test',
                                             last_name='testy',
                                             username='test_user',
                                             email='test.testy@testdomain.com',
                                             password='testing401')
        
        # Create second test user
        self.user2 = User.objects.create_user(first_name='test2',
                                             last_name='testy2',
                                             username='test_user2',
                                             email='test.testy2@testdomain.com',
                                            password='testing402')
        
        # Setup urls
        self.login_url = reverse('auth:user_login')
        self.logout_url = reverse('auth:user_logout')
        self.get_profile_url = reverse('user:profile:get_profile')
        self.update_profile_url = reverse('user:profile:update_profile')
        self.get_picture_url = reverse('user:profile:get_profile_picture')
        self.upload_picture_url = reverse('user:profile:upload_profile_picture')
        self.get_all_pictures_url = reverse('user:profile:get_all_profile_pictures')
        self.update_picture_url = reverse('user:profile:update_profile_picture')
        self.delete_picture_url = reverse('user:profile:delete_profile_picture')

        # Init relative_image_path
        self.relative_image_paths = []

        # Custom media url
        self.media_url = 'localhost:8000/media/'
        
        # Login first test user
        self.client.login(username='test_user', password='testing401')

    def tearDown(self):
        logger.info("Tearing down test profile...\n\n")
        # Clean up any resources used by the tests
        User.objects.filter(username="test_user").delete()
        User.objects.filter(username="test_user2").delete()

        for path in self.relative_image_paths:
            if default_storage.exists(path):
                default_storage.delete(path)

    def test_profile_view(self):
        logger.info("Testing profile view...")

        # get profile data when logged in
        logger.info("Getting profile data when logged in...\n")
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
        response = self.client.post(self.update_profile_url, 
                                    data=json.dumps({'field': 'first_name', 'value': 'newname'}),
                                    content_type='application/json')
        self.assertTrue(response.json()['success'])
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['msg'], 'Profile updated successfully')

        # update invalid field
        response = self.client.post(self.update_profile_url, 
                                    data=json.dumps({'field': 'password', 'value': 'newpasswordplease'}),
                                    content_type='application/json')
        self.assertFalse(response.json()['success'])
        self.assertEqual(response.status_code, 405)
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

        self.upload_image('profile_pic_test.png')
    
        # delete custom picture
        # delete current profile picture using local storage
        if default_storage.exists(self.relative_image_paths[0]):
            default_storage.delete(self.relative_image_paths[0])
        
        # attempt to get deleted custom picture
        response = self.client.get(self.get_picture_url)
        self.assertEqual(response.status_code, 404)
        self.assertFalse(response.json()['success'])


    def test_upload_picture_view(self):
        logger.info("Testing upload picture view...")

        # Upload a valid photo
        logger.info("Uploading a valid photo...")
        dir_path = os.path.dirname(os.path.realpath(__file__))
        file_path = os.path.join(dir_path, 'media_for_tests', 'profile_pic_test.png')
        with open(file_path, 'rb') as file:
            data = {'profileImage': file}
            # Upload the picture
            response = self.client.post(self.upload_picture_url, data, format='multipart')
            self.assertEqual(response.status_code, 201)
            self.assertTrue(response.json()['success'])
            self.assertEqual(response.json()['msg'], 'Updated image successfully')
            self.relative_image_paths.append(response.json()['path']) # append picture path to list

        # Upload an invalid photo format
        logger.info("Uploading an invalid photo...")
        dir_path = os.path.dirname(os.path.realpath(__file__))
        file_path = os.path.join(dir_path, 'media_for_tests', 'profile_pic_test_3.gif')
        with open(file_path, 'rb') as file:
            data = {'profileImage': file}
            # Upload the picture
            response = self.client.post(self.upload_picture_url, data, format='multipart')
            self.assertEqual(response.status_code, 400)
            self.assertFalse(response.json()['success'])
            self.assertEqual(response.json()['error'], 'Unsupported file format, must be png, jpg, or jpeg')

        # Upload with empty profileImage field    
        # THE POST REQUEST WILL NOT ACCEPT AND EMPTY VALUE WHEN MULTIPART, DOES NOT REACH SERVER, CAN NOT BE TESTED
        

    def test_get_all_pictures_view(self):
        logger.info("Testing get all pictures view...")

        # retrieving custom pictures when none exist
        logger.info("Retrieving custom pictures when none exist...")
        response = self.client.get(self.get_all_pictures_url)
        self.assertFalse(response.json()['success'])
        self.assertEqual(response.status_code, 404)

        # upload image
        logger.info("Uploading image...\n")
        self.upload_image('profile_pic_test.png')

        logger.info("Retrieving custom pictures when one exists...")
        response = self.client.get(self.get_all_pictures_url)
        self.assertTrue(response.json()['success'])
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()['files']), 1)


    def test_update_picture_view(self):
        logger.info("Testing update picture view...")

        # Open both test image and upload them
        self.upload_image('profile_pic_test.png')
        self.upload_image('profile_pic_test_2.png')

        # change profile picture to an invalid image
        logger.info("Attempting to change profile picture to an invalid image...")
        response = self.client.put(self.update_picture_url, 
                                   data=json.dumps({'newProfilePicUrl': self.media_url + 'custom/invalidphoto.png'}), #hardcoded media url, matches what is sendt from frontend
                                   content_type='application/json')
        self.assertEqual(response.status_code, 403)
        self.assertFalse(response.json()['success'])

        # change profile picture to a valid image
        logger.info("Changing profile picture to a valid image...")
        response = self.client.put(self.update_picture_url, 
                                   data=json.dumps({'newProfilePicUrl': self.media_url + self.relative_image_paths[0]}), #hardcoded media url, matches what is sendt from frontend
                                   content_type='application/json')
        logger.info(f'rel paths [0]{self.relative_image_paths[0]}')
        logger.info(f'rel paths [1]{self.relative_image_paths[1]}')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['success'])
        self.assertEqual(response.json()['msg'], 'Selected new image')

        # attempt to change profile picture to the current profile picture
        logger.info("Attempting to change profile picture to the current profile picture...")
        response = self.client.put(self.update_picture_url,
                                   data=json.dumps({'newProfilePicUrl': self.media_url + self.relative_image_paths[0]}),
                                   content_type='application/json')
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()['error'], 'Selected image is already the profile picture')

        # attempt to change profile picture with empty url
        logger.info("Attempting to change profile picture to the current profile picture...")
        response = self.client.put(self.update_picture_url,
                                   data=json.dumps({'newProfilePicUrl': None}),
                                   content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()['error'], 'No image URL provided')        

        # delete custom picture
        # delete test profile pic 2 using local storage
        logger.info("Deleting second upload via local_storage...")
        if default_storage.exists(self.relative_image_paths[1]):
            default_storage.delete(self.relative_image_paths[1])

        # attempt to change profile picture to the deleted picture
        logger.info("Attempting to change profile picture to the deleted picture...")
        response = self.client.put(self.update_picture_url,
                                   data=json.dumps({'newProfilePicUrl': self.media_url + self.relative_image_paths[1]}),
                                   content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()['error'], 'Image file does not exist')

        # logout first test user
        logger.info("Logging out first test user...")
        response = self.client.post(self.logout_url)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['success'])
        
        # login second test user
        logger.info("Logging in second test user...")
        response = self.client.post(self.login_url, 
                                    data=json.dumps({'username': 'test_user2', 'password': 'testing402'}),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['success'])
        
        # from second test user, attempt to use profile picture belonging to first test user
        logger.info("attempting to use profile picture belonging to first test user...")
        response = self.client.put(self.update_picture_url, 
                                   data=json.dumps({'newProfilePicUrl': self.media_url + self.relative_image_paths[0]}),
                                   content_type='application/json')
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()['error'], 'Invalid image URL provided')



    def test_delete_picture_view(self):
        logger.info("Testing delete picture view...")
        
        self.upload_image('profile_pic_test.png')
        self.upload_image('profile_pic_test_2.png')

        # attempt to delete picture with empty url
        logger.info("Attempting to delete picture with empty url...")
        response = self.client.delete(self.delete_picture_url,
                                      data=json.dumps({'imagePath': None}),
                                      content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.json()['success'])
        self.assertEqual(response.json()['error'], 'No image URL provided')

        # attempt to delete preset picture
        logger.info("Attempting to delete preset picture...")
        response = self.client.delete(self.delete_picture_url,
                                      data=json.dumps({'imagePath': 'presets/preset_1.png'}),
                                      content_type='application/json')
        self.assertEqual(response.status_code, 403)
        self.assertFalse(response.json()['success'])
        self.assertEqual(response.json()['error'], 'Cannot delete preset image')

        # delete first upload, which is not the current profile picture
        logger.info("Deleting first upload...")
        response = self.client.delete(self.delete_picture_url,
                                      data=json.dumps({'imagePath': self.relative_image_paths[0]}),
                                      content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['success'])
        self.assertEqual(response.json()['msg'], 'Profile picture deleted')

        # delete first upload again, nonexisting image at this point
        logger.info("Deleting first upload again...")
        response = self.client.delete(self.delete_picture_url,
                                      data=json.dumps({'imagePath': self.relative_image_paths[0]}),
                                      content_type='application/json')
        self.assertEqual(response.status_code, 404)
        self.assertFalse(response.json()['success'])
        self.assertEqual(response.json()['error'], 'Given picture does not exist')

        # logout first test user
        logger.info("Logging out first test user...")
        response = self.client.post(self.logout_url)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['success'])
        
        # login second test user
        logger.info("Logging in second test user...")
        response = self.client.post(self.login_url, 
                                    data=json.dumps({'username': 'test_user2', 'password': 'testing402'}),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['success'])

        # attempt to delete picture belonging to first test user
        logger.info("Attempting to delete picture belonging to first test user...")
        response = self.client.delete(self.delete_picture_url,
                                      data=json.dumps({'imagePath': self.relative_image_paths[1]}),
                                      content_type='application/json')
        self.assertEqual(response.status_code, 403)
        self.assertFalse(response.json()['success'])
        self.assertEqual(response.json()['error'], 'Invalid image URL provided')

        # logout second test user
        logger.info("Logging out second test user...")
        response = self.client.post(self.logout_url)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['success'])

        # login first test user
        logger.info("Logging in first test user...")
        response = self.client.post(self.login_url, 
                                    data=json.dumps({'username': 'test_user', 'password': 'testing401'}),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['success'])

        # delete current profile picture
        logger.info("Deleting current profile picture...")
        response = self.client.delete(self.delete_picture_url,
                                      data=json.dumps({'imagePath': self.relative_image_paths[1]}),
                                      content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['success'])
        self.assertEqual(response.json()['msg'], 'Profile picture deleted')

    def test_game_history(self):
        logger.info("Testing game history...")
        # Create a game, finnish it, and check if the game is in the history
        # finnish test_game first, and wait for jørgen to be done with the game history


    def upload_image(self, image_path):
        '''
        Assumes correct condition for successfull upload
        Uploads an image visa image_path on user, and adds
        the relative path to the relative_image_paths list
        
        @input image_path: the path to the image to upload
        '''
        logger.info("HELPER FUNCTION! Uploading images...")
        # Open first test image and upload
        dir_path = os.path.dirname(os.path.realpath(__file__))
        file_path = os.path.join(dir_path, 'media_for_tests', image_path)
        with open(file_path, 'rb') as file:
            data = {'profileImage': file}
            response = self.client.post(self.upload_picture_url, data, format='multipart')
            self.assertEqual(response.status_code, 201)
            self.assertTrue(response.json()['success'])
            self.assertEqual(response.json()['msg'], 'Updated image successfully')
            self.relative_image_paths.append(response.json()['path'])
