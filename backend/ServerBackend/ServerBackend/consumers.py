from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User # not sure if we need this one
from django.contrib.auth import authenticate
from django.conf import settings
from .models import User, Game, Participant, PickedTasks, Task
import json
import jwt

class MyConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # add to a group? or is the group the participant/game
        token = self.scope["query_string"].decode().split("token=")[1]
        user = await self.get_user_from_token(token)
        if user is not None:
            self.scope["user"] = user
            await self.accept()
            # Send welcome message
            print("\nsending message\n")
            await self.send(text_data=json.dumps({
                'message': 'Welcome to the game lobby!'
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
