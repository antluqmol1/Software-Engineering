# myapp/management/commands/populate_tasks.py

from django.core.management.base import BaseCommand
import json
from ServerBackend.models import Task, User
import os
from django.conf import settings

class Command(BaseCommand):
    help = 'Load tasks from a JSON file into the database'

    def handle(self, *args, **kwargs):
        # Hardcoded path relative to the Django project root directory
        json_file_path = os.path.join(settings.BASE_DIR, "ServerBackend", "management", "sourceData", "tasks.json")

        # Create two users
        user1 = User.objects.create_user(
            username="bob",
            email="user1@example.com",
            password="bob",
            first_name="Bob",
            last_name="Doe"
        )

        user2 = User.objects.create_user(
            username="alice",
            email="alice@gmail.com",
            password="alice",
            first_name="Alice",
            last_name="Smith"
        )

        with open(json_file_path, 'r') as file:
            tasks = json.load(file)
            for task_data in tasks:
                Task.objects.create(
                    description=task_data['description'],
                    points=task_data['points'],
                    type=task_data['type'],
                    individual=task_data['individual']
                )

        self.stdout.write(self.style.SUCCESS('Successfully populated tasks from JSON file'))
