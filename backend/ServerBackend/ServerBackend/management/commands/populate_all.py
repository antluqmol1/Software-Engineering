from django.core.management.base import BaseCommand
from django.core.management import call_command

class Command(BaseCommand):
    help = 'Populate both tasks and users from a JSON files'

    def handle(self, *args, **kwargs):
        call_command('populate_users')
        call_command('populate_tasks')

        self.stdout.write(self.style.SUCCESS('Successfully populated tasks and users from JSON files'))