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
