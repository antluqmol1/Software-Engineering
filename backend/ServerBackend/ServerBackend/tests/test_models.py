import unittest
from django.test import TestCase
from ServerBackend.models import User, Tasks, Game, PickedTasks, Participant

class UserModelTestCase(TestCase):
    def setUp(self):
        # Set up any necessary data for the test case
        pass

    def test_user_creation(self):
        # Test user creation and attribute assignment
        user = User.objects.create_user(username="testuser", email="test@example.com", password="password")
        self.assertEqual(user.username, "testuser")
        self.assertEqual(user.email, "test@example.com")

    def test_superuser_creation(self):
        # Test superuser creation and attribute assignment
        superuser = User.objects.create_superuser(username="admin", email="admin@example.com", password="password")
        self.assertEqual(superuser.username, "admin")
        self.assertEqual(superuser.email, "admin@example.com")
        self.assertTrue(superuser.is_superuser)
        self.assertTrue(superuser.is_staff)

class TasksModelTestCase(TestCase):
    def setUp(self):
        # Set up any necessary data for the test case
        pass

    def test_tasks_creation(self):
        # Test tasks creation and attribute assignment
        tasks = Tasks.objects.create(task_id=1, description="Task 1", points=10, type=1, individual=True)
        self.assertEqual(tasks.task_id, 1)
        self.assertEqual(tasks.description, "Task 1")
        self.assertEqual(tasks.points, 10)
        self.assertEqual(tasks.type, 1)
        self.assertTrue(tasks.individual)

class GameModelTestCase(TestCase):
    def setUp(self):
        # Set up any necessary data for the test case
        pass

    def test_game_creation(self):
        # Test game creation and attribute assignment
        user = User.objects.create_user(username="testuser", email="test@example.com", password="password")
        game = Game.objects.create(game_id="123", title="Game 1", type="Type 1", description="Description 1", admin=user, num_players=5, start_time="2022-01-01 00:00:00")
        self.assertEqual(game.game_id, "123")
        self.assertEqual(game.title, "Game 1")
        self.assertEqual(game.type, "Type 1")
        self.assertEqual(game.description, "Description 1")
        self.assertEqual(game.admin, user)
        self.assertEqual(game.num_players, 5)
        self.assertEqual(str(game.start_time), "2022-01-01 00:00:00")

class PickedTasksModelTestCase(TestCase):
    def setUp(self):
        # Set up any necessary data for the test case
        pass

    def test_picked_tasks_creation(self):
        # Test picked tasks creation and attribute assignment
        user = User.objects.create_user(username="testuser", email="test@example.com", password="password")
        tasks = Tasks.objects.create(task_id=1, description="Task 1", points=10, type=1, individual=True)
        game = Game.objects.create(game_id="123", title="Game 1", type="Type 1", description="Description 1", admin=user, num_players=5, start_time="2022-01-01 00:00:00")
        picked_tasks = PickedTasks.objects.create(task=tasks, game=game, user=user, done=False)
        self.assertEqual(picked_tasks.task, tasks)
        self.assertEqual(picked_tasks.game, game)
        self.assertEqual(picked_tasks.user, user)
        self.assertFalse(picked_tasks.done)

class ParticipantModelTestCase(TestCase):
    def setUp(self):
        # Set up any necessary data for the test case
        pass

    def test_participant_creation(self):
        # Test participant creation and attribute assignment
        user = User.objects.create_user(username="testuser", email="test@example.com", password="password")
        game = Game.objects.create(game_id="123", title="Game 1", type="Type 1", description="Description 1", admin=user, num_players=5, start_time="2022-01-01 00:00:00")
        participant = Participant.objects.create(user=user, game=game, score=100, isPicked=True)
        self.assertEqual(participant.user, user)
        self.assertEqual(participant.game, game)
        self.assertEqual(participant.score, 100)
        self.assertTrue(participant.isPicked)