# Generated by Django 5.0.1 on 2024-03-04 19:55

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('ServerBackend', '0002_user_username'),
    ]

    operations = [
        migrations.DeleteModel(
            name='user',
        ),
    ]
