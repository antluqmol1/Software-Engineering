from ServerBackend.models import User, Tasks, Game, PickedTasks, Participant, ParticipantHistory, GameHistory, PickedTasksHistory
from django.core.files.storage import default_storage
from channels.routing import get_default_application
from channels.testing import WebsocketCommunicator
from django.test import TestCase, Client
from django.urls import reverse
import logging
import json
import base64
import os


logger = logging.getLogger(__name__)


class GameTestCase(TestCase):
    def setUp(self):
        logger.info("Setting up test game...\n")
        self.client = Client()
        self.websocket_communicator = None  # Placeholder for WebSocket communicator

        # Create first test user
        self.user1 = User.objects.create_user(first_name='test',
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
        
        # urls
        self.login_url = reverse('auth:user_login')
        self.logout_url = reverse('auth:user_logout')
        self.create_game_url = reverse('game:create_game')
        self.delete_game_url = reverse('game:delete_game')
        self.join_game_url = reverse('game:join_game')
        self.leave_game_url = reverse('game:leave_game')
        self.get_game_url = reverse('game:get_game')
        self.get_participants_url = reverse('game:get_participants')
        self.get_participants_images_url = reverse('game:get_participants_images')
        self.current_task_url = reverse('game:current_task')
        self.next_task_url = reverse('game:next_task')
        self.give_points_url = reverse('game:give_points')

        # games list
        self.games = []
        # socket list
        self.sockets = []
        # user list
        self.user = [self.user1, self.user2]

    def tearDown(self):
        logger.info("Tearing down test game...")
        # Clean up any resources used by the tests
        User.objects.filter(username='test_user').delete()
        User.objects.filter(username='test_user2').delete()

        # Delete all games
        Game.objects.all().delete()

        # Disconnect from socket
        for socket in self.sockets:
            socket.disconnect()


    def test_create_game_no_login(self):
        # Test the creation of a game
        logger.info("Testing create game no login...")
        
        # Use helper function to create game
        response = self.create_game(game_id='7HTK24' ,title='test-game-1', game_type=1, description='test description 1')
        self.assertEqual(response.status_code, 401)
        self.assertFalse(response.json()['success'])
        self.assertEqual(response.json()['msg'], 'not authenticated')
        self.games.append()

        # Join game
        self.client.post(self.join_game_url,
                         data=json.dumps({'game_id': self.games[0]}),
                         content_type='application/json')
        
        # Use helper function to create websocket communicator, checks are done inside
        socket = self.create_websocket_communicator()
        self.sockets.append(socket)


    def test_create_game_login(self):
        logger.info("Testing create game login...")

        # Login
        self.client.post(self.login_url,
                         data=json.dumps({'username': 'test_user', 'password': 'testing401'}),
                         content_type='application/json')

        # Use helper function to create game
        response = self.create_game(game_id='7HTK24' ,title='test-game-1', game_type=1, description='test description 1')
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.json()['success'])

        # append game_id to list of games
        self.games.append(response.json()['gameId'])

        # Join game
        self.client.post(self.join_game_url,
                         data=json.dumps({'game_id': self.games[0]}),
                         content_type='application/json')
        
        # Use helper function to create and connect to websocket, some checks are done inside
        socket = self.create_websocket_communicator()
        # append socket to list
        self.sockets.append(socket)

    '''
    Helper functions
    Makes above tests easier to read
    '''

    # HELPER FUNCTION
    def create_game(self, game_id, title, game_type, description):
        '''
        Creates a game with the given parameters.
        Does NOT assume correct conditions for creating a game.

        returns:
            response: the response from the server
        '''
        logger.info("helper function, creating a game...")
        # Create a game
        response = self.client.post(self.create_game_url,
                                    data=json.dumps({'gameid': game_id, 'title': title, 'type': game_type, 'description': description}),
                                    content_type='application/json')
        return response

    # HELPER FUNCTION
    def create_websocket_communicator(self):
        '''
        Creates a WebSocket communicator, connects to it, and returns it.
        Assumes correct conditions for creating a websocket connection, such as being logged in.
        Checks if it created and connected successfully.

        returns:
            websocket_communicator: the WebSocket communicator
        '''
        logger.info("helper function, creating a websocket communicator...")
        # Set up WebSocket communicator
        try:
            application = get_default_application()
        except Exception as e:
            logger.error(f"Error setting up WebSocket communicator: {e}")
            self.assertEqual("Error setting up WebSocket communicator", "No errors") # neat little assert to tell if websocket is good
            return None
        websocket_communicator = WebsocketCommunicator(application, '/ws/gamelobby/')
        connected, _ = self.websocket_communicator.connect()
        self.assertTrue(connected) # make sure it connected first successfully
        return websocket_communicator