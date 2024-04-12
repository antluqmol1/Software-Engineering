from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User # not sure if we need this one
from django.contrib.auth import authenticate
from django.conf import settings
from .models import User, Game, Participant, PickedTasks, Task
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
import jwt
import json


class MyConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print("WS gamelobby, connecting...")
        # add to a group? or is the group the participant/game
        token = self.scope['cookies'].get('auth_token')
        # user = await self.get_user_from_token(token)
        if token and validate_jwt(token):
            await self.accept()
            # Send welcome message
            print("\nsending message\n")
            await self.send(text_data=json.dumps({
                'message': 'This is the websocket, welcome to the game lobby!'
            }))
        else:
            await self.close(reason="Not logged in", code=4001)

    def get_user_from_token(self, token):
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return None


    async def disconnect(self, close_code):
        print("connection closed: ", close_code)

        # cleanup
        #disconnect message?
        pass

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        await self.send(text_data=json.dumps({
            'message': message
        }))

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