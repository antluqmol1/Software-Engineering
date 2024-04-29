from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User # not sure if we need this one
from django.contrib.auth import authenticate
from django.conf import settings
from channels.layers import get_channel_layer
from .models import User, Game, Participant, PickedTasks, Tasks, Response
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from channels.db import database_sync_to_async
from django.db import IntegrityError
from django.core.exceptions import ValidationError


import jwt
import json

import logging

logger = logging.getLogger(__name__)
'''
We use http cookies that contain JWT, given upon login, to validate connections
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

            logger.info(f"WebSocket connected: {self.channel_name}")

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
            logger.info(f'Websocket attempted connection: refused')
            await self.close(reason="Not logged in", code=4001)

    async def disconnect(self, close_code):
        print("WS: connection closed: ", close_code)
        print("WS: Sending message to group...")

        logger.info(f"WebSocket disconnected: {self.channel_name} with code {close_code}")

        # get the username
        try: 
            username = await self.get_username()
            # user = await self.get_user()
            # game = await self.get_participant_game(self.user_id)
            # if game.admin == user:
            #     admin = True
            # else:
            #     admin = False
        except:
            print("no username, not even connected")

        print("\nWS: sending message from ws\n")

        response = {
            'username': username,
            'admin': True
        }

        # send disconnect message to the group
        await self.channel_layer.group_send(
            self.game_group_name,
            {
                'type': 'Disconnect_Update',
                'message': username,
                'admin': True,
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
            case "task_vote":
                print("WS: task_vote")

                task_id = text_data_json['taskId']
                vote = text_data_json['taskVote']

                print(f'WS: taskId: {task_id}, vote: {vote}')

                vote_user = await self.get_user()

                game = await self.get_participant_game(vote_user)
                participants = await self.get_participants(game)
                task = await self.get_task_from_id(task_id)


                vote_input = None
                match vote:
                    case 'yes':
                        vote_input = True
                    case 'no':
                        vote_input = False

                print(f'WS: following information added to database:\n{vote_user}, {task}, {game}, {vote}')
                print(f'WS: vote_input: {vote_input}')
                
                # Create new vote.
                previous_vote, newVote = await self.add_new_vote(vote_user, task, game, vote_input)

                # Obtain the different types of votes from DB.
                yesVotes, noVotes, skipVotes = await self.get_game_votes(game)  

                # Check if the overwhelming majority has voted, and end game if one-sided.
                if (participants/2 - skipVotes) <= yesVotes:                                    # Player wins
                    # Removes responses for specific task, in specific game.
                    await self.next_task_preperation(game, task)
                    # Gives player points
                    await self.give_player_points(game, task)


                elif (participants/2 - skipVotes) < noVotes:                                    # Player loses
                    # Removes responses for specific task, in specific game.
                    await self.next_task_preperation(game, task)

                else: 
                                                                                                # Vote continues
                    # This is jørgens, i suggest we send each new vote to every 
                    # participant, instead of the entire list all the time                                                                                    
                    # response = {
                    #     'yesVotes': yesVotes,
                    #     'noVotes': noVotes,
                    #     'skipVotes': skipVotes,
                    # }

                    response = {

                    }

                    if previous_vote == None:
                        response = {
                            'newVote': 'yes' if newVote.vote is True else 'no' if newVote.vote is False else 'skip'
                        }
                    else:
                        response = {
                            'prevVote': previous_vote,
                            'newVote': 'yes' if newVote.vote is True else 'no' if newVote.vote is False else 'skip'
                        }

                    print(f'WS: Vote response: {response}')

                    await self.channel_layer.group_send(
                    self.game_group_name, 
                    {
                        'type': 'Task',  # This refers to the method name `Task`
                        'message': response,
                        'msg_type': 'task_new_vote'
                    }
                    )
                    return          # Return here if vote continues
                
                response = {
                    'task_done': True
                }

                # Next task will be fetched from the frontend.
                await self.channel_layer.group_send(
                    self.game_group_name, 
                    {
                        'type': 'Task',  # This refers to the method name `Task`
                        'message': response,
                        'msg_type': 'task_done'
                    }
                    )

                # fetch the next task
                response = await self.next_task(game)

                await self.channel_layer.group_send(
                    self.game_group_name, 
                    {
                        'type': 'Task',  # This refers to the method name `Task`
                        'message': response,
                        'msg_type': 'new_task'
                    }
                    )

            case 'new_task':

                game = await self.get_participant_game(self.user_id)
                response = await self.next_task(game)

                await self.channel_layer.group_send(
                self.game_group_name, 
                {
                    'type': 'Task',  # This refers to the method name Task
                    'message': response,
                    'msg_type': 'new_task'
                }
                )

            case 'game_end':
                print("WS: game_end")
                response = {
                    'game_end': True
                }

                print("WS: sending game_end message to other members")
                await self.channel_layer.group_send(
                self.game_group_name, 
                {
                    'type': 'Game_End',  # This refers to the method name Game_End
                    'message': response,
                    'msg_type': 'game_end'
                }
                )

    async def Game_End(self, event):
        message = event['message']
        msg_type = event.get('mgs_type', 'No msg_type')

        await self.send(text_data=json.dumps({
            'message': message,
            'msg_type': msg_type
        }))


    # message function
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
        admin = event['admin']
        # Send message to WebSocket; this sends the message to each client in the group
        await self.send(text_data=json.dumps({
            'message': message,
            'admin': admin,
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
        
    # Database function
    # gets the amount of players in the game
    # returns INT
    @database_sync_to_async
    def get_participants(self, game):
        try:
            participants = Participant.objects.filter(game=game).count()
            return participants
        except Participant.DoesNotExist:
            return None
    
    # Database function
    @database_sync_to_async
    def next_task_preperation(self, game, task):
        # Clears responses for specific task/game in Response.
        respones = Response.objects.filter(game=game, task=task)
        respones.delete()
        # Sets task as done in PickedTasks.
        current_task = PickedTasks.objects.get(game=game, task=task)
        current_task.done = True
        current_task.save()


    # Database function
    @database_sync_to_async
    def give_player_points(self, game, task):
        current_task = PickedTasks.objects.get(game=game, task=task)
        player = Participant.objects.get(user=current_task.user)
        player.score += Tasks.objects.get(task_id=current_task.task.task_id).points
        player.save()

    # Database function
    @database_sync_to_async
    def next_task(self, game):
        
        task_count = Tasks.objects.filter(type=game.type).count()

        # Check if task is available
        for _ in range(task_count):

            random_task = Tasks.objects.filter(type = game.type).order_by('?').first()
            # check if this task is already picked
            taskExist = PickedTasks.objects.filter(task=random_task, game=game).exists()

            # if not, we save it to PickedTasks, and return the question
            if not taskExist:
                random_player = Participant.objects.filter(game=game, isPicked=False).order_by('?').first()

                if not random_player:           # if no player was picked, then we refresh the wheel and pick a player.
                    participants = Participant.objects.filter(game=game)
                    for p in participants:
                        p.isPicked = False
                        p.save()

                    random_player = Participant.objects.filter(game=game, isPicked=False).order_by('?').first()

                random_player.isPicked = True
                random_player.save()

                picked_task = PickedTasks(task=random_task, game=game, user=random_player.user)
                picked_task.save()

                game.game_started = True
                game.save()

                participants_in_same_game = Participant.objects.filter(game=game)
                participant_data = [{'username': p.user.username, 'score': p.score} 
                                    for p in participants_in_same_game]

                response = {
                    'taskId': random_task.task_id,
                    'taskText': random_task.description,
                    'taskPoints': random_task.points,
                    'pickedPlayer': random_player.user.username,
                    'gameStarted': game.game_started,
                    'participants': participant_data,
                }

                return response


    
    '''
    DATABASE FUNCTION
    DESC: gets the participant data of a newly joined player
    Same information/structure that the playerlist in frontend use
    Returns: Dictionary, containing username and score
    '''
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
    
    '''
    DATABASE FUNCTION 
    DESC: gets the current connecting clients username
    Returns: String
    '''
    @database_sync_to_async
    def get_username(self):
        try:
            player = User.objects.get(id=self.user_id)

            return player.username
        except User.DoesNotExist:
            return None
        
    '''
    DATABASE FUNCTION
    DESC: fets the user profile of the player making the connection
    Returns: User model object
    '''
    @database_sync_to_async
    def get_user(self):
        try:
            player = User.objects.get(id=self.user_id)

            return player
        except User.DoesNotExist:
            return None
        
    '''
    DATABASE FUNCTION
    DESC: gets the user corresponding to the input username
    Returns: User model object
    '''
    @database_sync_to_async
    def get_user_from_username(self, username):
        try:
            player = User.objects.get(username=username)

            return player
        except User.DoesNotExist:
            return None
        
    '''
    DATABASE FUNCTION
    DESC: gets the task record based on input task_id
    Returns: Task model object
    '''
    @database_sync_to_async
    def get_task_from_id(self, task_id):
        try:
            task = Tasks.objects.get(task_id=task_id)

            return task
        except Tasks.DoesNotExist:
            return None

    '''
    DATABASE FUNCTION
    DESC: Adds a new or edits existing vote:
    Returns: true, if new vote, false, if edited vote
    '''
    @database_sync_to_async
    def add_new_vote(self, user, task, game, vote):
        try:
            existing_vote = Response.objects.filter(user=user, game=game, task=task).first()
            if existing_vote:   # check for existing Response record and edit it
                print("WS: vote exists, editing the vote")

                previous_vote = None
                
                # Set the corresponding prev vote for return
                if existing_vote.vote == True:
                    previous_vote = 'yes'
                elif existing_vote.vote == False:
                    previous_vote = 'no'
                else: 
                    previous_vote = 'skip'

                existing_vote.vote = vote
                existing_vote.save()
                return previous_vote, existing_vote
            
            else:    # create new Response record
                print("WS: Creatig new vote")
                print(f'WS: New record: user: {user}, task: {task}, game: {game}, vote: {vote}')
                new_vote = Response(user=user,
                                    task=task,
                                    game=game,
                                    vote=vote)
                new_vote.save()
                return None, new_vote
            
        except IntegrityError as e:
            print(f"WS: IntegrityError - {str(e)}")
            return None
        except ValidationError as e:
            print(f"WS: ValidationError - {str(e)}")
            return None
        except Exception as e:
            print(f"WS: Unexpected error - {str(e)}")
            return None
    
    # database function
    @database_sync_to_async
    def get_game_votes(self, game):
        try:
            votes = Response.objects.filter(game=game)
            yesVotes = 0
            noVotes = 0
            skipVotes = 0

            for i in votes:
                match i.vote:
                    case True:
                        yesVotes += 1
                    case False:
                        noVotes += 1
                    case None:
                        skipVotes += 1

            return yesVotes, noVotes, skipVotes
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
