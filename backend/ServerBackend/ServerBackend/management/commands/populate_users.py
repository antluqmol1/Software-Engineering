from django.core.management.base import BaseCommand
import json
from ServerBackend.models import Tasks, User
import os
from django.conf import settings

class Command(BaseCommand):
    help = 'Load users from a JSON file into the database'

    def handle(self, *args, **kwargs):
        # Hardcoded path relative to the Django project root directory
        json_user_path = os.path.join(settings.BASE_DIR, "ServerBackend", "management", "sourceData", "users.json")

        # Load and create users from the user JSON file
        with open(json_user_path, 'r') as file:
            users = json.load(file)
            for user_data in users:
                User.objects.create_user(
                    username=user_data['username'],
                    email=user_data['email'],
                    password=user_data['password'],
                    first_name=user_data['first_name'],
                    last_name=user_data['last_name']
                )

        self.stdout.write(self.style.SUCCESS('Successfully populated users from JSON file'))
