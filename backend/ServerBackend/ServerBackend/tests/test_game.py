from django.contrib.sessions.models import Session
from django.core.files.storage import default_storage
from ServerBackend.models import User, Tasks, Game, PickedTasks, Participant, ParticipantHistory, GameHistory, PickedTasksHistory
from channels.routing import get_default_application
from channels.testing import WebsocketCommunicator, ChannelsLiveServerTestCase, HttpCommunicator
from asgiref.sync import sync_to_async
from channels.db import database_sync_to_async
from django.test import TestCase, Client, TransactionTestCase
from django.urls import reverse
from django.conf import settings
import logging
import json
import base64
import os


logger = logging.getLogger(__name__)


class GameTestCase(ChannelsLiveServerTestCase):
    def setUp(self):
        logger.info("Setting up test game...\n")
        self.client = Client()
        self.websocket_communicator = None  # WebSocket communicator

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
        self.get_token_url = reverse('auth:grab_token')
        self.login_url = reverse('auth:user_login')
        self.logout_url = reverse('auth:user_logout')
        self.create_game_url = reverse('game:create_game')
        self.delete_game_url = reverse('game:delete_game')
        self.join_game_url = reverse('game:join_game')
        self.leave_game_url = reverse('game:leave_game')
        self.get_game_url = reverse('game:get_game')
        self.get_participants_url = reverse('game:get_game_participants')
        self.get_participants_images_url = reverse('game:get_participants_urls')
        self.current_task_url = reverse('game:current_task')
        self.next_task_url = reverse('game:next_task')
        self.give_points_url = reverse('game:give_points')

        # games list
        self.games = []
        # socket list
        self.sockets = [] # all sockets are disconnected in their respective tests 
        # user list
        self.user = [self.user1, self.user2]
        # CSRF token
        self.token_list = []
        # JWT token
        self.jwt_token = None
        # Session ID
        self.sessionid = None

    def tearDown(self):
        logger.info("Tearing down test game...\n\n")
        # Clean up any resources used by the tests
        User.objects.filter(username='test_user').delete()
        User.objects.filter(username='test_user2').delete()

        # Delete all games
        Game.objects.all().delete()


    def test_create_game_no_login(self):
        # Test the creation of a game
        logger.info("Testing create game no login...\n")
        
        # Use helper function to attempt create game
        response = self.create_game(game_id='7HTK24' ,title='test-game-1', game_type=1, description='test description 1')
        self.assertEqual(response.status_code, 401)
        self.assertFalse(response.json()['success'])
        self.assertEqual(response.json()['msg'], 'not authenticated')

    async def test_create_game_login_and_connect_websocket(self):
        logger.info("Testing create game login and connect...\n")

        # Fetch a token before login
        token = await self.fetch_csrf_token(token_index=None)
        self.token_list.append(token)

        logger.debug(f"Token_list: {self.token_list}")

        # Login using HttpCommunicator
        login_communicator = HttpCommunicator(
            application=get_default_application(),
            method="POST",
            path=self.login_url,
            body=json.dumps({'username': 'test_user', 'password': 'testing401'}).encode('utf-8'),
            headers=[(b"content-type", b"application/json"),
                     (b"cookie", f"csrftoken={self.token_list[0]}".encode()),
                     (b"X-CSRFToken", self.token_list[0].encode())],
        )
        response = await login_communicator.get_response()
        self.assertEqual(response['status'], 200)

        # get index of sessionid in cookies (we already get JWT and csrftoken, though both are also present)
        self.cookies = [item[1].decode() for item in response['headers'] if item[0] == b"Set-Cookie"]
        sessionid_index = next((index for index, cookie in enumerate(self.cookies) if "sessionid" in cookie), None)

        # get the sessionid, this was a pain in the ass
        self.sessionid = self.cookies[sessionid_index].split(';')[0].split('=')[1]
        logger.debug(f"sessionid: {self.sessionid}")
        
        # parse response data to extract JWT from login response
        response_data = self.parse_json_response(response)
        logger.debug(f"Login response parsed: {response_data}")
        logger.debug(f"Login response: {response}")

        # Check that the JWT token is present
        self.jwt_token = response_data['JWT']
        self.assertTrue(self.jwt_token)

        # store sessionid
        temp_sessionid = self.sessionid
        self.sessionid = "31289jfduhjsvsnvhjvbfh" # set session id as random garbage

        # Create game using HttpCommunicator, with incorrect sessionid
        response = await self.create_game_async(game_id='7HTK24', game_type=1, title='test-game-1', description='test description', token_index=0)
        self.assertEqual(response['status'], 401)

        # restore sessionid
        self.sessionid = temp_sessionid

        # Fetch a new token csrftoken, since we are logged in
        self.token_list[0] = await self.fetch_csrf_token(token_index=0)
        logger.debug(f"Token_list: {self.token_list}")

        # attempt to get game when not part of one.
        # Make a get game 'request'
        response = await self.communicator_request("GET", self.get_game_url, None, token_index=0)
        self.assertEqual(response['status'], 404)

        # Create game using HttpCommunicator, with correct sessionid
        response = await self.create_game_async(game_id='7HTK24', game_type=1, title='test-game-1', description='test description', token_index=0)
        self.assertEqual(response['status'], 201)
        
        response_data = self.parse_json_response(response)

        # Make a get game request, now that we have created and joined a game
        response = await self.communicator_request("GET", self.get_game_url, None, token_index=0)
        self.assertEqual(response['status'], 200)
        # logger.debug(f"general function get game response: {response}")

        # Make a get participants request
        response = await self.communicator_request("GET", self.get_participants_url, None, token_index=0)
        self.assertEqual(response['status'], 200)

        # Make a get participants images request
        response = await self.communicator_request("GET", self.get_participants_images_url, None, token_index=0)
        self.assertEqual(response['status'], 200)

        #leave via api
        response = await self.communicator_request("POST", self.leave_game_url, None, token_index=0)
        self.assertEqual(response['status'], 200)

        # Make a current task request, when there is none
        response = await self.communicator_request("GET", self.current_task_url, None, token_index=0)
        self.assertEqual(response['status'], 404)

        # Connect to WebSocket
        communicator = await self.connect_to_websocket()
        self.assertIsNotNone(communicator, "WebSocket communicator is None.")
        self.sockets.append(communicator)

        await communicator.disconnect()

        # # Use helper function to create game
        # response = self.create_game(game_id='7htk24' ,title='test-game-1', game_type=1, description='test description 1')
        # self.assertEqual(response.status_code, 201)
        # self.assertTrue(response.json()['success'])

        # # Append game_id to list of games
        # self.games.append(response.json()['gameId'])

        # # Join game
        # self.client.post(self.join_game_url,
        #                  data=json.dumps({'gameid': self.games[0]}),
        #                  content_type='application/json')
        
        # Use helper function to create and connect to websocket, some checks are done inside
        # socket = self.create_websocket_communicator()
        # append socket to list
        # self.sockets.append(socket)


    async def test_websocket_join_game(self):
        pass

    async def communicator_request(self, method, path, data, token_index):

        '''
        General function to make a request to the server using HttpCommunicator.
        Assumes that the user is already logged in, and has A JWT token, does not need to be authenticated.

        args:
            method: the method to use, GET, POST, etc.
            path: the path to make the request to
            data: the data to send, if any
            token_index: the index of the token to use in self.token_list

        returns:
            response: the response from the server

        '''

        if not data:
            input_data = json.dumps(data).encode('utf-8')
        else:
            input_data = None

        

        communicator = HttpCommunicator(
            application=get_default_application(),
            method=method,
            path=path,
            body=input_data,
            headers=[(b"content-type", b"application/json"),
                     (b"cookie", f"auth_token={self.jwt_token}; sessionid={self.sessionid}".encode()),
                     (b"X-CSRFToken", self.token_list[token_index].encode())],
        )
        response = await communicator.get_response()
        return response
    
        # create_game_communicator = HttpCommunicator(
        #     application=get_default_application(),
        #     method="POST",
        #     path=self.create_game_url,
        #     body=json.dumps({'gameid': '7HTK24', 'id': 1, 'title': 'test-game-1', 'description': 'test description'}).encode('utf-8'),
        #     headers=[(b"content-type", b"application/json"),
        #              (b"cookie", f"auth_token={self.jwt_token}; csrftoken={self.token}".encode()),
        #              (b"X-CSRFToken", self.token.encode())],
        # )
        # response = await create_game_communicator.get_response()

    async def fetch_csrf_token(self, token_index):
        """Helper function to fetch a CSRF token from the server."""
        headers = [(b'content-type', b'application/json')]
        if token_index:
            # headers.append((b"cookie", f"csrftoken={self.token}".encode()))
            headers.append((b"cookie", f"sessionid={self.sessionid}".encode()))
            headers.append((b"X-CSRFToken", self.token_list[token_index].encode()))

        logger.debug(f'using this header: {headers}')

        token_communicator = HttpCommunicator(
            application=get_default_application(),
            method="GET",
            path=self.get_token_url,  # Ensure this path is correct and returns a CSRF token
            headers=headers,
        )
        response = await token_communicator.get_response()
        # The response body is in bytes, decode to str and convert to dict
        response_body = json.loads(response['body'].decode('utf-8'))
        return response_body['csrfToken']


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
        logger.info("helper function, creating a game...\n")
        # Create a game
        response = self.client.post(self.create_game_url,
                                    data=json.dumps({'gameid': game_id, 'title': title, 'id': game_type, 'description': description}),
                                    content_type='application/json')
        return response
    
    async def create_game_async(self, game_id, title, game_type, description, token_index):

        # Login using HttpCommunicator, with correct token, this was a pain in the ass
        create_game_communicator = HttpCommunicator(
            application=get_default_application(),
            method="POST",
            path=self.create_game_url,
            body=json.dumps({'gameid': game_id, 'id': game_type, 'title': title, 'description': description}).encode('utf-8'),
            headers=[(b"content-type", b"application/json"),
                     (b"cookie", f"auth_token={self.jwt_token}; csrftoken={self.token_list[token_index]}; sessionid={self.sessionid}".encode()),
                     (b"X-CSRFToken", self.token_list[token_index].encode())],
        )
        response = await create_game_communicator.get_response()
        return response

    # HELPER FUNCTION
    def parse_json_response(self, response):
        """
        Parses the JSON body from the HttpCommunicator response.
        
        Args:
            response (dict): The response dictionary from HttpCommunicator.get_response().
        
        Returns:
            dict: The parsed JSON content as a Python dictionary.
        
        Raises:
            ValueError: If the body cannot be decoded or parsed.
        """
        try:
            # Decode the response body from bytes to string
            body = response['body'].decode('utf-8')
            # Convert the JSON string to a Python dictionary
            return json.loads(body)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to decode JSON from response: {str(e)}")
        except KeyError:
            raise ValueError("Response does not contain a body.")
        except AttributeError:
            raise ValueError("Response body is not in the expected byte format.")

    # HELPER FUNCTION
    async def connect_to_websocket(self):
        """
        Helper function to create and connect a WebSocket communicator.
        Assumes that JWT token is already available in self.jwt_token.

        Returns:
            WebsocketCommunicator: A connected WebSocket communicator instance.
        """
        # Initialize WebSocket communicator with the path and the JWT as a cookie, we only have one websocket path

        communicator = WebsocketCommunicator(
            application=get_default_application(),
            path='/ws/gamelobby/',
            headers=[(b'cookie', f'auth_token={self.jwt_token}'.encode())]  # Pass the JWT cookie
        )
        connected, _ = await communicator.connect()
        if not connected:
            logger.error(f"WebSocket connection failed.")
            self.assertTrue(False, "WebSocket connection failed")
        return communicator
