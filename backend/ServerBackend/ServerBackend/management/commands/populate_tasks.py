# myapp/management/commands/populate_tasks.py

from django.core.management.base import BaseCommand
import json
from ServerBackend.models import Tasks, User
import os
from django.conf import settings

class Command(BaseCommand):
    help = 'Load tasks from a JSON file into the database'

    def handle(self, *args, **kwargs):
        # Hardcoded path relative to the Django project root directory
        json_file_path = os.path.join(settings.BASE_DIR, "ServerBackend", "management", "sourceData", "tasks.json")
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

        # # Create two users
        # user1 = User.objects.create_user(
        #     username="bob",
        #     email="user1@example.com",
        #     password="bob",
        #     first_name="Bob",
        #     last_name="Doe"
        # )

        # user2 = User.objects.create_user(
        #     username="alice",
        #     email="alice@gmail.com",
        #     password="alice",
        #     first_name="Alice",
        #     last_name="Smith"
        # )

        # user3 = User.objects.create_user(
        #     username="clark",
        #     email="clark@gmail.com",
        #     password="clark",
        #     first_name="Clark",
        #     last_name="Kent"
        # )

        # user4 = User.objects.create_user(
        #     username="dina",
        #     email="dina@gmail.com",
        #     password="dina",
        #     first_name="Dina",
        #     last_name="Yhesani"
        # )

        # create tasks from the tasks JSON file
        with open(json_file_path, 'r') as file:
            tasks = json.load(file)
            for task_data in tasks:
                Tasks.objects.create(
                    description=task_data['description'],
                    points=task_data['points'],
                    type=task_data['type'],
                    individual=task_data['individual']
                )

        self.stdout.write(self.style.SUCCESS('Successfully populated tasks from JSON file'))
