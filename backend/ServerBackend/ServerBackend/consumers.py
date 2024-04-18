from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User # not sure if we need this one
from django.contrib.auth import authenticate
from django.conf import settings
from channels.layers import get_channel_layer
from .models import User, Game, Participant, PickedTasks, Tasks, Response
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from channels.db import database_sync_to_async
import jwt
import json

'''
We use http cookies that contain JWT given upon login to validate connections
'''
class GameLobby(AsyncWebsocketConsumer):
    async def connect(self):
        print("WS: gamelobby, connecting...")
        # add to a group? or is the group the participant/game
        token = self.scope['cookies'].get('auth_token')

        payload = validate_jwt(token)

        if token and payload:
            await self.accept()

            # get the user id from the token payload
            self.user_id = payload.get('user_id')
            print(f'WS: user connecting is {self.user_id}')


            # query the database for the game via participant
            game = await self.get_participant_game(user_id=self.user_id)
            print(f'WS: Game_id: {game.game_id}')
            print(f'WS: num_players: {game.num_players}')

            # set the name of the group, all people in same group has the same name
            self.game_group_name = f'game_{game.game_id}'

            # Add this channel to a group based on game_id
            print(f'WS: Joining group')
            await self.channel_layer.group_add(
                self.game_group_name,
                self.channel_name
            )

            # extracting participant list
            participant_data = await self.get_new_player()

            print("\nWS: sending message from ws\n")
            await self.channel_layer.group_send(
            self.game_group_name, 
            {
                'type': 'Add_Update_Player',
                'message': participant_data,
                'msg_type': 'join'
            }
            )
        else:
            await self.close(reason="Not logged in", code=4001)

    async def disconnect(self, close_code):
        print("WS: connection closed: ", close_code)
        print("WS: Sending message to group...")

        # get the username
        try: 
            username = await self.get_username()
        except:
            print("no username, not even connected")

        print("\nWS: sending message from ws\n")

        # send disconnect message to the group
        await self.channel_layer.group_send(
            self.game_group_name,
            {
                'type': 'Disconnect_Update',
                'message': username,
                'msg_type': 'disconnect'
            }
        )

        # remove channel from group        
        await self.channel_layer.group_discard(
            self.game_group_name,
            self.channel_name
        )
        print(f"WS: {username} was removed from {self.game_group_name}")

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        print("\nWS: recieve ...")
        print(f'\nWS: message: \n{text_data_json}\n')
        # message = text_data_json['message']
        msg_type = text_data_json['type']

        print("WS: checking message type\n")

        match msg_type:
            case 'task_done':
                print("WS: task_done\n sending response to group")
                points = str(text_data_json['taskPoints'])

                username = await self.get_username()

                response = {
                    'username': username,
                    'task': text_data_json['taskText'],
                    'points': points,
                    'taskId': text_data_json['taskId']
                }
                print(response)
                await self.channel_layer.group_send(
                self.game_group_name, 
                {
                    'type': 'Task',  # This refers to the method name Task
                    'message': response,
                    'msg_type': 'task_done'
                }
                )

            case "task_vote":
                print("WS: task_vote")

                vote_task_username = text_data_json['username']
                task_id = text_data_json['taskId']
                vote = text_data_json['taskVote']

                

                vote_user = await self.get_user()
                task_user = await self.get_user_from_username(vote_task_username)

                game = await self.get_participant_game(vote_user)
                task = await self.get_task_from_id(task_id)

                print(f'WS: {vote_user.username} voted {vote} on {task_user.username}\'s task')

                # HERE WE NEED TO UPDATE THE DATABASE, WAS THINKING WE USE THE RESPONSE TABLE

                vote_input

                match vote:
                    case 'yes':
                        vote_input = True
                    case 'no':
                        vote_input = False
                    case "skip":
                        vote_input = None

                print(f'WS: following information added to database:\n{vote_user}, {task}, {game}, {vote}')

                # Create new vote.
                new_vote = await self.add_new_vote(vote_user, task, game, vote)

                # Check if more that half the game has voted

                vote_list = await self.get_game_votes(game)

                # for i in range(vote_list):
                #     print(f'{vote_list.user.username} has voted')

                # WE SHOULD MAYBE DEAL WITH TASK ID INSTEAD OF THE TEXT
                response = {
                    'vote': vote,
                    'task': task_id
                }

                await self.channel_layer.group_send(
                self.game_group_name, 
                {
                    'type': 'Task',  # This refers to the method name `Task_Done`
                    'message': response,
                    'msg_type': 'task_new_vote'
                }
                )

            case 'new_task':

                print("WS: new_task")

                task = await self.get_task_from_id(text_data_json['taskId'])

                task_text = task.description
                task_points = task.points


                response = {
                    'taskId': task.task_id,
                    'taskText': task_text,
                    'taskPoints': task_points,
                    'pickedPlayer': text_data_json['pickedPlayer'],
                    'gameStarted': text_data_json['gameStarted'],
                }

                await self.channel_layer.group_send(
                self.game_group_name, 
                {
                    'type': 'Task',  # This refers to the method name Task
                    'message': response,
                    'msg_type': 'new_task'
                }
                )
        

    async def Task(self, event):
        message = event['message']
        msg_type = event.get('msg_type', 'No msg_type')

        await self.send(text_data=json.dumps({
            'message': message,
            'msg_type': msg_type
        }))
    

    # message function
    async def Add_Update_Player(self, event):
        message = event['message']
        msg_type = event.get('msg_type', 'No msg_type')
        # Send message to WebSocket; this sends the message to each client in the group
        await self.send(text_data=json.dumps({
            'message': message,
            'msg_type': msg_type
        }))
    
    # message function
    async def Disconnect_Update(self, event):
        message = event['message']
        msg_type = event.get('msg_type', 'No msg_type')
        # Send message to WebSocket; this sends the message to each client in the group
        await self.send(text_data=json.dumps({
            'message': message,
            'msg_type': msg_type
        }))

    # Database function
    @database_sync_to_async
    def get_participant_game(self, user_id):
        try: 
            part = Participant.objects.get(user_id=user_id)
            game = part.game
            return game
        except Participant.DoesNotExist:
            return None
    
    # database function
    @database_sync_to_async
    def get_new_player(self):
        try:
            # participants_in_same_game = Participant.objects.filter(game=game)
            new_participant = Participant.objects.get(user=self.user_id)

            print(f'WS: new participant being added: {new_participant.user}')

            participant_data = {
                'username': new_participant.user.username,
                'score': new_participant.score
            }

            return participant_data
        except Participant.DoesNotExist:
            return None
    
    # database function
    @database_sync_to_async
    def get_username(self):
        try:
            player = User.objects.get(id=self.user_id)

            return player.username
        except User.DoesNotExist:
            return None
        
    # database function
    @database_sync_to_async
    def get_user(self):
        try:
            player = User.objects.get(id=self.user_id)

            return player
        except User.DoesNotExist:
            return None
        
    # database function
    @database_sync_to_async
    def get_user_from_username(self, username):
        try:
            player = User.objects.get(username=username)

            return player
        except User.DoesNotExist:
            return None
        
    # database function
    @database_sync_to_async
    def get_task_from_id(self, task_id):
        try:
            task = Tasks.objects.get(task_id=task_id)

            return task
        except Tasks.DoesNotExist:
            return None

    # database function
    @database_sync_to_async
    def add_new_vote(self, user, task, game, vote):
        try:
            print("WS: adding Reponse record")
            # create new Response record
            new_vote = Response(user=user,
                                task=task,
                                game=game,
                                vote=vote)
            new_vote.save()
            return new_vote
        except:
            print("WS: failed to add Response record")
            return None
    
    # database function
    @database_sync_to_async
    def get_game_votes(self, game):
        try:
            votes = Response.objects.get(game=game)

            return votes
        except Response.DoesNotExist:
            return None



'''
Validate the JWT from the incoming connection.
'''
def validate_jwt(token):
    try:
        # Decode the token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        # Optionally, you could return the payload if needed
        print(f' payload')
        return payload
    except ExpiredSignatureError:
        # Handle expired token, e.g., return False or raise an error
        print("expired token")
        return False
    except InvalidTokenError:
        # Handle invalid token, e.g., return False or raise an error
        print("invalid token")
        return False
