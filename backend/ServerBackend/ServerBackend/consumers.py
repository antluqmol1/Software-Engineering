from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User # not sure if we need this one
from django.contrib.auth import authenticate
from django.conf import settings
from channels.layers import get_channel_layer
from .models import User, Game, Participant, PickedTasks, Task
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from channels.db import database_sync_to_async
import jwt
import json


class MyConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print("WS gamelobby, connecting...")
        # add to a group? or is the group the participant/game
        token = self.scope['cookies'].get('auth_token')

        payload = validate_jwt(token)

        if token and payload:
            await self.accept()

            # get the user id from the token payload
            self.user_id = payload.get('user_id')
            print(f'user connecting is {self.user_id}')


            # query the database for the game via participant
            game = await self.get_participant_game(user_id=self.user_id)
            print(f'the game_id is {game.game_id}')

            self.game_group_name = f'game_{game.game_id}'

            # Add this channel to a group based on game_id
            print(f'Joining group')
            await self.channel_layer.group_add(
                self.game_group_name,
                self.channel_name
            )

            # extracting participant list
            participants_data = await self.get_new_player_list(game)

            print("\nsending message from ws\n")
            await self.channel_layer.group_send(
            self.game_group_name, 
            {
                'type': 'Add_Update_player_List',  # This refers to the method name `chat_message`
                'message': participants_data,
                'msg_type': 'join'
            }
            )
        else:
            await self.close(reason="Not logged in", code=4001)

    async def disconnect(self, close_code):
        print("connection closed: ", close_code)
        print("Sending message to group...")

        username = await self.get_username()

        await self.channel_layer.group_send(
            self.game_group_name,
            {
                'type': 'Disconnect_Update',
                'message': username,
                'msg_type': 'disconnect'
            }
        )
        # token = self.scope['cookies'].get('auth_token')

        # payload = validate_jwt(token)

        # if token and payload:
        #     # get the user id from the token payload
        #     user_id = payload.get('user_id')
        #     print(f'user connecting is {user_id}')


        #     # The problem here is that once we get here, the player 
        #     # is removed from the database as a participan
        #     # query the database for the game via participant
        #     game = await self.get_participant_game(user_id=user_id)
        #     print(f'the game_id is {game.game_id}')

        #     self.game_group_name = f'game_{game.game_id}'

        #     # Add this channel to a group based on game_id
        #     print(f'Joining group')
        #     await self.channel_layer.group_add(
        #         self.game_group_name,
        #         self.channel_name
        #     )

        #     # extracting participant list
        #     participants_data = await self.get_new_player_list(game)

        #     print("\nsending message from ws\n")
        #     await self.channel_layer.group_send(
        #     self.game_group_name, 
        #     {
        #         'type': 'chat_message',  # This refers to the method name `chat_message`
        #         'message': participants_data
        #     }
        #     )

        # cleanup
        # disconnect message?
        pass

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        await self.send(text_data=json.dumps({
            'message': message
        }))

    async def Add_Update_player_List(self, event):
        message = event['message']
        # Send message to WebSocket; this sends the message to each client in the group
        await self.send(text_data=json.dumps({
            'message': message
    }))
        
    async def Disconnect_Update(self, event):
        message = event['message']
        msg_type = event.get('msg_type', 'No msg_type')
        # Send message to WebSocket; this sends the message to each client in the group
        await self.send(text_data=json.dumps({
            'message': message,
            'msg_type': msg_type
    }))

    @database_sync_to_async
    def get_participant_game(self, user_id):
        try: 
            part = Participant.objects.get(user_id=user_id)
            game = part.game
            return game
        except Participant.DoesNotExist:
            return None
    
    @database_sync_to_async
    def get_new_player_list(self, game):
        try:
            participants_in_same_game = Participant.objects.filter(game=game)

            participant_data = [{'username': p.user.username, 'score': p.score} 
                                for p in participants_in_same_game]
            print(f'participant in same game: {participant_data}')
            return participant_data
        except:
            pass

    @database_sync_to_async
    def get_username(self):
        try:
            player = User.objects.get(id=self.user_id)

            return player.username
        except User.DoesNotExist:
            return None


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