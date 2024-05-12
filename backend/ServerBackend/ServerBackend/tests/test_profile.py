from django.test import TestCase, Client
from django.urls import reverse
from ServerBackend.models import User
import logging

logger = logging.getLogger(__name__)

class TestProfile(TestCase):
    def setUp(self):
        logger.info("Setting up test profile...")
        self.client = Client()
        self.user = User.objects.create_user(first_name='test',
                                             last_name='testy',
                                             username='test_user',
                                             email='test.testy@testdomain.com',
                                             password='testing401')
        self.get_profile_url = reverse('get_profile')
        self.update_profile_url = reverse('update_profile')
        self.get_picture_url = reverse('get_profile_picture')
        self.upload_picture_url = reverse('upload_profile_picture')
        self.get_all_pictures_url = reverse('get_all_profile_pictures')
        self.update_picture_url = reverse('update_profile_picture')
        self.delete_picture_url = reverse('delete_profile_picture')

    def tearDown(self):
        logger.info("Tearing down test profile...")
        # Clean up any resources used by the tests
        User.objects.filter(username="test_user").delete()

    def test_profile_view(self):
        logger.info("Testing profile view...")
        self.client.login(username='test_user', password='testing401')

        response = self.client.get(self.get_profile_url)
        self.assertEqual(response.status_code, 200)

        # Check that the response data is as expected
        response_data = response.json()
        self.assertEqual(response_data['first_name'], 'test')
        self.assertEqual(response_data['last_name'], 'testy')
        self.assertEqual(response_data['username'], 'test_user')
        self.assertEqual(response_data['email'], 'test.testy@testdomain.com')

    def test_update_profile_view(self):
        logger.info("Testing update profile view...")
        pass

    def test_get_picture_view(self):
        logger.info("Testing get picture view...")
        pass

    def test_upload_picture_view(self):
        logger.info("Testing upload picture view...")
        pass

    def test_get_all_pictures_view(self):
        pass

    def test_update_picture_view(self):
        pass

    def test_delete_picture_view(self):
        pass