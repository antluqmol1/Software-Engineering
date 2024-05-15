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
        
        # Create test tasks
        self.task1 = Tasks.objects.create(task_id=1, description='Task 1', points=10, type=1, individual=True)
        self.task1 = Tasks.objects.create(task_id=2, description='Task 2', points=10, type=1, individual=True)
        # self.task1 = Tasks.objects.create(task_id=3, description='Task 3', points=10, type=1, individual=True)
        # self.task1 = Tasks.objects.create(task_id=4, description='Task 4', points=10, type=1, individual=True)
        
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
        # CSRF token list
        self.token_list = []
        # JWT token list
        self.jwt_token_list = []
        # Session ID list
        self.sessionid_list = []

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
        response = self.create_game(game_id='7htk24' ,title='test-game-1', game_type=1, description='test description 1')
        self.assertEqual(response.status_code, 401)
        self.assertFalse(response.json()['success'])
        self.assertEqual(response.json()['msg'], 'not authenticated')

    async def test_create_game_login_and_connect_websocket(self):
        logger.info("Testing create game login and connect...\n")

        # Fetch a token before login
        token = await self.fetch_csrf_token(token_index=None, sessionid_index=None)
        self.token_list.append(token)

        logger.debug(f"Token_list: {self.token_list}")

        # Login using HttpCommunicator
        # login_communicator = HttpCommunicator(
        #     application=get_default_application(),
        #     method="POST",
        #     path=self.login_url,
        #     body=json.dumps({'username': 'test_user', 'password': 'testing401'}).encode('utf-8'),
        #     headers=[(b"content-type", b"application/json"),
        #              (b"cookie", f"csrftoken={self.token_list[0]}".encode()),
        #              (b"X-CSRFToken", self.token_list[0].encode())],
        # )
        response = await self.communicator_request("POST", self.login_url, {'username': self.user1.username, 'password': 'testing401'}, token_index=0)
        # response = await login_communicator.get_response()
        self.assertEqual(response['status'], 200)

        # get index of sessionid in cookies (we already get JWT and csrftoken, though both are also present)
        cookies = [item[1].decode() for item in response['headers'] if item[0] == b"Set-Cookie"]
        sessionid_index = next((index for index, cookie in enumerate(cookies) if "sessionid" in cookie), None)

        # get the sessionid, this was a pain in the ass
        sessionid = cookies[sessionid_index].split(';')[0].split('=')[1]
        self.sessionid_list.append(sessionid)
        logger.debug(f"sessionids: {self.sessionid_list}")
        
        # parse response data to extract JWT from login response
        response_data = self.parse_json_response(response)
        logger.debug(f"Login response parsed: {response_data}")
        logger.debug(f"Login response: {response}")

        # Check that the JWT token is present
        self.jwt_token_list.append(response_data['JWT'])
        self.assertTrue(self.jwt_token_list)

        # store sessionid list
        temp_sessionid_list = self.sessionid_list
        self.sessionid_list = ["31289jfduhjsvsnvhjvbfh"] # set session id list to contain random garbage

        # Create game using HttpCommunicator, with incorrect sessionid
        response = await self.create_game_async(game_id='7htk24', game_type=1, title='test-game-1', description='test description', token_index=0, sessionid_index = 0)
        self.assertEqual(response['status'], 401)

        # restore sessionid list
        self.sessionid_list = temp_sessionid_list

        # Fetch a new token csrftoken, since we are logged in
        self.token_list[0] = await self.fetch_csrf_token(token_index=0, sessionid_index=0)
        logger.debug(f"Token_list: {self.token_list}")

        # attempt to get game when not part of one.
        # Make a get game 'request'
        response = await self.communicator_request("GET", self.get_game_url, None, token_index=0, sessionid_index=0)
        self.assertEqual(response['status'], 404)

        # Create game using HttpCommunicator, with correct sessionid
        response = await self.create_game_async(game_id='7htk24', game_type=1, title='test-game-1', description='test description', token_index=0, sessionid_index = 0)
        self.assertEqual(response['status'], 201)
        
        response_data = self.parse_json_response(response)

        # Make a get game request, now that we have created and joined a game
        response = await self.communicator_request("GET", self.get_game_url, None, token_index=0, sessionid_index=0)
        self.assertEqual(response['status'], 200)
        # logger.debug(f"general function get game response: {response}")

        # Make a get participants request
        response = await self.communicator_request("GET", self.get_participants_url, None, token_index=0, sessionid_index=0)
        self.assertEqual(response['status'], 200)

        # Make a get participants images request
        response = await self.communicator_request("GET", self.get_participants_images_url, None, token_index=0, sessionid_index=0)
        self.assertEqual(response['status'], 200)

        # Make a current task request, when there is none
        response = await self.communicator_request("GET", self.current_task_url, None, token_index=0, sessionid_index=0)
        self.assertEqual(response['status'], 404)

        #leave via api
        response = await self.communicator_request("PUT", self.leave_game_url, None, token_index=0, sessionid_index=0)
        self.assertEqual(response['status'], 200)

        #Join via api
        response = await self.communicator_request("POST", self.join_game_url, {'gameid': '7htk24'}, token_index=0, sessionid_index=0)
        logger.debug(f"\n\n\n\n\njoin via api response: {response}\n\n\n\n")
        self.assertEqual(response['status'], 200)

        # Connect to WebSocket
        communicator = await self.connect_to_websocket(jwt_token_index=0)
        self.assertIsNotNone(communicator, "WebSocket communicator is None.")
        self.sockets.append(communicator)

        await communicator.disconnect()

    # make this, another test
    # async def test_


    async def test_websocket_play_game(self):
        # Fetch a token before login

        player1_index = await self.login_fetch_tokens(self.user1.username, 'testing401')
        logger.debug("player 1 logged in\n\n\n\n")

        # logger.info("Testing websocket join game two players...\n")
        # token = await self.fetch_csrf_token(token_index=None, sessionid_index=None)
        # self.token_list.append(token)

        # logger.debug(f"Token_list: {self.token_list}")

        # # login first user
        # response = await self.communicator_request("POST", self.login_url, {'username': self.user1.username, 'password': 'testing401'}, token_index=0)
        # self.assertEqual(response['status'], 200)

        # # get sessionid
        # self.sessionid_list.append(await self.get_sessionId(response))
        # logger.debug(f"sessionids: {self.sessionid_list}")
        
        # # parse response data to extract JWT from login response
        # response_data = self.parse_json_response(response)

        # # Check that the JWT token is present
        # self.jwt_token_list.append(response_data['JWT'])
        # self.assertTrue(self.jwt_token_list)

        # # Fetch a new token csrftoken, since we are logged in
        # self.token_list[0] = await self.fetch_csrf_token(token_index=0, sessionid_index=0)
        # logger.debug(f"Token_list: {self.token_list}")

        #
        # successfully logged in one user, with tokens stored in the lists at index 0
        #

        # login another user

        player1_index = await self.login_fetch_tokens(self.user2.username, 'testing402')
        logger.debug("player 2 logged in\n\n\n\n")
        # # Fetch a token before login of second user
        # token = await self.fetch_csrf_token(token_index=None, sessionid_index=None)
        # self.token_list.append(token)

        # logger.debug(f"Token_list: {self.token_list}")

        # # Login second user
        # response = await self.communicator_request("POST", self.login_url, {'username': self.user2.username, 'password': 'testing402'}, token_index=1)
        # self.assertEqual(response['status'], 200)

        # # get the sessionid
        # self.sessionid_list.append(await self.get_sessionId(response))
        # logger.debug(f"sessionids: {self.sessionid_list}")
        
        # # parse response data to extract JWT from login response
        # response_data = self.parse_json_response(response)

        # # Check that the JWT token is present
        # self.jwt_token_list.append(response_data['JWT'])
        # self.assertTrue(self.jwt_token_list)

        # # Fetch a new token for second user csrftoken, since it is logged in
        # self.token_list[1] = await self.fetch_csrf_token(token_index=0, sessionid_index=0)
        # logger.debug(f"Token_list: {self.token_list}")

        #
        # successfully logged in second user, with tokens stored in the lists at index 1
        #


        # Both players are logged in. start game
        # PLAYER 1 = test_user (index 0), PLAYER 2 = test_user2 (index 1)
        logger.info("both players are logged in, current lists:")
        logger.info(f"Token list: {self.token_list}")
        logger.info(f"JWT list: {self.jwt_token_list}")
        logger.info(f"Sessionid list: {self.sessionid_list}")


        # PLAYER 1
        # Create game using HttpCommunicator, with correct sessionid
        logger.info("Player 1 creating game...")
        response = await self.create_game_async(game_id='7htk24', game_type=1, title='test-game-1', description='test description', token_index=0, sessionid_index=0)
        self.assertEqual(response['status'], 201)

        # create game automatically joins the game

        # Player 1 connect to websocket
        logger.info("Player 1 connecting to websocket...")
        communicator1 = await self.connect_to_websocket(jwt_token_index=0)
        self.assertIsNotNone(communicator1, "WebSocket communicator is None.")
        logger.info("Player 1 connected to websocket.")

        # Player 1 awaits a message from the websocket
        logger.debug(f'Player 1 awaiting message from websocket...')
        response = await communicator1.receive_json_from()
        self.assertEqual(response['msg_type'], "join")
        logger.debug(f'response from communicator1: {response}')

        # Player 2 is join game via API, with correct sessionid
        logger.info("Player 2 joining game via api...")
        response = await self.communicator_request("POST", self.join_game_url, {'gameid': '7htk24'}, token_index=1, sessionid_index=1)
        self.assertEqual(response['status'], 200)
        
        # Player 2 connect to websocket
        logger.info("Player 2 connecting to websocket...")
        communicator2 = await self.connect_to_websocket(jwt_token_index=1)
        self.assertIsNotNone(communicator2, "WebSocket communicator is None.")
        logger.info("Player 2 connected to websocket.")

        # Player 2 awaits a join message from the websocket
        logger.debug(f'Player 2 awaiting message from websocket...')
        response = await communicator2.receive_json_from()
        self.assertEqual(response['msg_type'], "join")
        logger.debug(f'response from communicator2: {response}')

        # Player 1 awaits a join message from the websocket
        logger.debug(f'Player 1 awaiting message from websocket...')
        response = await communicator1.receive_json_from()
        self.assertEqual(response['msg_type'], "join")
        logger.debug(f'response from communicator1: {response}')

        # only admin can send new_task and game_end messages
        # Player 2 sends a new_task message to the websocket
        message = {"type": "new_task"}
        await communicator2.send_json_to(message)

        # Player 2 should recieve error message back
        response = await communicator2.receive_json_from()
        logger.debug(f'response from communicator2 (new_task): {response}')
        self.assertEqual(response['message'], "Admin function only")
        self.assertEqual(response['msg_type'], "error")

        # Player 2 sends a game_end message to the websocket
        message = {"type": "game_end"}
        await communicator2.send_json_to(message)

        # Player 2 should recieve error message back
        response = await communicator2.receive_json_from()
        logger.debug(f'response from communicator2 (game_end): {response}')
        self.assertEqual(response['message'], "Admin function only")
        self.assertEqual(response['msg_type'], "error")



        ## ROUND ONE

        # Player 1 sends a new_task message to websocket
        message = {"type": "new_task"}
        await communicator1.send_json_to(message)

        # Player 1 should recieve a news_task message back
        response = await communicator1.receive_json_from()
        self.assertEqual(response['msg_type'], "new_task")
        # logger.debug(f'response from communicator1 (new_task): {response}')

        # Player 2 should also recieve a new_task message back
        response = await communicator2.receive_json_from()
        self.assertEqual(response['msg_type'], "new_task")
        logger.debug(f'response from communicator2 (new_task): {response}')

        # get picked player and task_id
        picked_player = response['message']['pickedPlayer']
        task_id = response['message']['taskId']
        logger.debug(f'Picked player: {picked_player}')

        # depending on who got the task, the other one votes yes
        message = {"type": "task_vote", "taskId": task_id, 'taskVote': 'yes'}
        if picked_player == 'test_user':
            logger.debug(f'Picked player is test_user')
            response = await communicator2.send_json_to(message)
        else:
            logger.debug(f'Picked player is test_user2')
            response = await communicator1.send_json_to(message)


        # only two players, one vote is enough to mark task as done
        # Player 1 should recieve a task_done message back
        response = await communicator1.receive_json_from()
        self.assertEqual(response['msg_type'], "task_done")
        logger.debug(f'response from communicator1 (task_done): {response}')

        # Player 2 should also recieve a task_done message back
        response = await communicator2.receive_json_from()
        self.assertEqual(response['msg_type'], "task_done")

        # Check win and updated score
        self.assertTrue(response['message']['winner'])
        self.assertEqual(response['message']['player&score']['score'], 10)



        ## ROUND TWO

        # Player 1 sends a new_task message to websocket
        message = {"type": "new_task"}
        await communicator1.send_json_to(message)

        # Player 1 should recieve a new_task message back
        response = await communicator1.receive_json_from()
        self.assertEqual(response['msg_type'], "new_task")

        # Player 2 should also recieve a new_task message back
        response = await communicator2.receive_json_from()
        self.assertEqual(response['msg_type'], "new_task")

        # get picked_player and task_id
        picked_player = response['message']['pickedPlayer']
        task_id = response['message']['taskId']
        logger.debug(f'Picked player: {picked_player}')

        # depending on who got the task, the other one votes no this time
        message = {"type": "task_vote", "taskId": task_id, 'taskVote': 'no'}
        if picked_player == 'test_user':
            logger.debug(f'Picked player is test_user')
            response = await communicator2.send_json_to(message)
        else:
            logger.debug(f'Picked player is test_user2')
            response = await communicator1.send_json_to(message)

        # Player 1 should recieve a task_done message back
        response = await communicator1.receive_json_from()
        self.assertEqual(response['msg_type'], "task_done")

        # Player 2 should also recieve a task_done message back
        response = await communicator2.receive_json_from()
        self.assertEqual(response['msg_type'], "task_done")

        logger.debug(f'this should contains player&score: {response}')

        # Check win
        self.assertFalse(response['message']['winner'])
        # no score returned since score has not changed



        # ROUND THREE

        # Player 1 sends a new_task message to websocket
        message = {"type": "new_task"}
        await communicator1.send_json_to(message)

        # Player 1 should recieve a new_task message back
        response = await communicator1.receive_json_from()
        logger.debug(f'Do we get an error?: {response}')
        # self.assertEqual(response['msg_type'], "new_task")

        # Player 2 should also recieve a new_task message back
        response = await communicator2.receive_json_from()
        logger.debug(f'Do we get an error?: {response}')

        if 'error' not in response['message']:
            self.assertTrue(False) # we should receive an error here
        else:
            self.assertEqual(response['message']['error'], "game end")

        # Player 1 sends a game_end message to websocket, since we should have received an error: game end message
        message = {"type": "game_end"}
        await communicator1.send_json_to(message)

        # Player 1 should recieve a game_end message back
        response = await communicator1.receive_json_from()
        self.assertEqual(response['msg_type'], "game_end")

        # Player 2 should receive a game_end message
        response = await communicator2.receive_json_from()
        self.assertEqual(response['msg_type'], "game_end")


        # Both players disconnect

        # Player 2 disconnects from websocket
        logger.info("Player 2 disconnecting from websocket...")
        await communicator2.disconnect()

        # Player 1 waits for player 2 disconnect message
        logger.debug(f'Player 1 awaiting message from websocket...')
        response = await communicator1.receive_json_from()
        self.assertEqual(response['msg_type'], "disconnect")
        logger.debug(f'response from communicator1: {response}')

        # Player 1 disconnects from websocket
        logger.info("Player 1 disconnecting from websocket...")
        await communicator1.disconnect()



    async def login_fetch_tokens(self, username, password):
        '''
        Helper function to login and fetch tokens
        '''
        logger.info("Logging in and fetching tokens helper function...\n\n\n")
        # Fetch a token before login
        logger.info("Testing websocket join game two players...\n")
        token = await self.fetch_csrf_token(token_index=None, sessionid_index=None)
        self.token_list.append(token)

        # get index of token to be replaced in list
        replace_index = self.token_list.index(token)

        # login
        response = await self.communicator_request("POST", self.login_url, {'username': username, 'password': password}, token_index=replace_index)
        self.assertEqual(response['status'], 200)

        # extract sessionid
        self.sessionid_list.append(await self.get_sessionId(response))
        logger.debug(f"sessionids: {self.sessionid_list}")
        session_index = len(self.sessionid_list) - 1
        
        # parse response data to extract JWT from login response
        response_data = self.parse_json_response(response)

        # Check that the JWT token is present
        self.jwt_token_list.append(response_data['JWT'])
        self.assertTrue(self.jwt_token_list)

        # Fetch a new token csrftoken, since we are logged in and replace old one
        self.token_list[replace_index] = await self.fetch_csrf_token(token_index=replace_index, sessionid_index=session_index)
        logger.debug(f"Token_list: {self.token_list}")

        return replace_index # return index of users tokens in the lists



    async def get_sessionId(self, response):
        '''
        Helper function to get the sessionid from a response, most likely login response
        Haven't checked if other responses work, but it should work for most responses
        '''

        # get index of sessionid in cookies (we already get JWT and csrftoken, though both are also present)
        cookies = [item[1].decode() for item in response['headers'] if item[0] == b"Set-Cookie"]
        sessionid_index = next((index for index, cookie in enumerate(cookies) if "sessionid" in cookie), None)
        sessionid = cookies[sessionid_index].split(';')[0].split('=')[1]
        self.assertIsNotNone(sessionid)
        return sessionid
        


    async def communicator_request(self, method, path, data, token_index=None, sessionid_index=None):

        '''
        General helper function that makes a request to the server using HttpCommunicator.
        Dynamically constructs the header based on the token and sessionid.
        Very proud of this section.

        args:
            method: the method to use, GET, POST, etc.
            path: the path to make the request to
            data: the data to send, if any
            token_index: the index of the token to use in self.token_list

        returns:
            response: the response from the server

        '''

        # Construct the header dynamically based on the token and sessionid
        headers=[(b"content-type", b"application/json")]
        cookies = (b"cookie",)
        if token_index is not None:
            cookie_list = list(cookies)
            cookie_list.append(f"csrftoken={self.token_list[token_index]}".encode())
            cookies = tuple(cookie_list)
            csrf = (b"X-CSRFToken", self.token_list[token_index].encode())
        if sessionid_index is not None:
            cookie_list = list(cookies)
            cookie_list[1] = (cookie_list[1].decode() + f"; sessionid={self.sessionid_list[sessionid_index]}").encode()
            cookies = tuple(cookie_list)

        # append cookies and csrf token to headers
        headers.append(cookies)
        if token_index is not None:
            headers.append(csrf)
        
        logger.debug(f"Using this header: {headers}")


        input_data = json.dumps(data).encode()
        communicator = HttpCommunicator(
            application=get_default_application(),
            method=method,
            path=path,
            body=input_data,
            headers=headers,
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

    async def fetch_csrf_token(self, token_index, sessionid_index):
        """Helper function to fetch a CSRF token from the server."""
        headers = [(b'content-type', b'application/json')]
        if sessionid_index:
            headers.append((b"cookie", f"sessionid={self.sessionid_list[sessionid_index]}".encode()))
        if token_index:
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
    
    async def create_game_async(self, game_id, title, game_type, description, token_index, sessionid_index):

        # Login using HttpCommunicator, with correct token, this was a pain in the ass
        create_game_communicator = HttpCommunicator(
            application=get_default_application(),
            method="POST",
            path=self.create_game_url,
            body=json.dumps({'gameid': game_id, 'id': game_type, 'title': title, 'description': description}).encode('utf-8'),
            headers=[(b"content-type", b"application/json"),
                     (b"cookie", f"csrftoken={self.token_list[token_index]}; sessionid={self.sessionid_list[sessionid_index]}".encode()),
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
    async def connect_to_websocket(self, jwt_token_index=0):
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
            headers=[(b'cookie', f'auth_token={self.jwt_token_list[jwt_token_index]}'.encode())]  # Pass the JWT cookie
        )
        connected, _ = await communicator.connect()
        if not connected:
            logger.error(f"WebSocket connection failed.")
            self.assertTrue(False, "WebSocket connection failed")
        return communicator
