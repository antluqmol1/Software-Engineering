from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User # not sure if we need this one
from django.contrib.auth import authenticate
from django.conf import settings
from channels.layers import get_channel_layer
from datetime import datetime as dt, timedelta, timezone
from .models import User, Game, Participant, PickedTasks, Tasks, Response
from .tasks import end_wheel_spin
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from channels.db import database_sync_to_async
from django.db import IntegrityError
from django.core.exceptions import ValidationError
from django.forms.models import model_to_dict



import jwt
import json

import logging

logger = logging.getLogger(__name__)

# close codes from client that will not 
# trigger a group wide message informing
# them that said client has disconnected
no_end_game_codes = [
    4001,
    1001,
    1006,
]
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
            print(f'WS: joined channel group {self.game_group_name}')

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
        logger.info(f"WebSocket disconnected: {self.channel_name} with code {close_code}")

        if close_code in no_end_game_codes:
            return

        # default value
        admin = False

        # get the username
        try: 
            print("WS: attempting to fetch user and game")
            user = await self.get_user()
            game = await self.get_participant_game(self.user_id)
            print("WS: can we not print game.admin")
            print("WS: game.admin ", game.admin)
            if game.admin == user:
                print("WS: player is admin!")
                admin = True
        except:
            print("WS: no username/game, not even connected")
            return

        # If disconnected player is admin, we need to end the game
        # Potentially check the code, so that in case it was unintentional 
        # disconnect, we can pass admin to another player

        if admin:
            print("WS: Adming ending game")
            game_ended = await self.end_game(game)
            if game_ended:
                print("WS: game deleted!")
            else:
                print("WS: error deleting game!")
                return
        else:
            left_game = await self.leave_game(game) 
            if left_game:
                print("WS: left game!")
            else:
                print("WS: error leaving game!")

        print("\nWS: sending message from ws\n")
        # send disconnect message to the group
        await self.channel_layer.group_send(
            self.game_group_name,
            {
                'type': 'Disconnect_Update',
                'message': user.username,
                'admin': admin,
                'msg_type': 'disconnect'
            }
        )

        # remove channel from group        
        await self.channel_layer.group_discard(
            self.game_group_name,
            self.channel_name
        )
        print(f"WS: {user.username} was removed from {self.game_group_name}")

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

                response = {}

                # Check if the overwhelming majority has voted, and end game if one-sided.
                if ((participants - 1)/2 - skipVotes) < yesVotes:                            # Player wins
                    # Removes responses for specific task, in specific game.
                    await self.next_task_preperation(game, task)
                    # Gives player points
                    response = await self.give_player_points(game, task)

                elif ((participants - 1)/2 - skipVotes) < noVotes:                            # Player loses
                    # Removes responses for specific task, in specific game.
                    await self.next_task_preperation(game, task)
                    response = {'winner': False}

                elif (yesVotes == noVotes) & yesVotes != 0:                                    # Draw, but player wins the task.
                    # Removes responses for specific task, in specific game.
                    await self.next_task_preperation(game, task)
                    # Gives player points
                    response = await self.give_player_points(game, task)

                else:                                                                   # Vote continues

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
                

                # WE NEED SOMETHING LIKE THIS SO THAT WE SEND A PARTICIPANT_DATA TO UPDATE THE PLAYER
                # LIST IN THE FRONTEND, OR WE SEND THE PLAYER WHO WON/GOT POINTS, AND WE CAN **ADD**
                # TO THE PLAYER LIST, LESS HASSLE FOR THE WEBSOCKET, MIGHT NOT EVEN HAVE TO DO A 
                # DATABASE QUERY
                # participants_in_same_game = Participant.objects.filter(game=game)
                # participant_data = [{'username': p.user.username, 'score': p.score} 
                #                     for p in participants_in_same_game]


                # Next task will be fetched from the frontend.
                await self.channel_layer.group_send(
                    self.game_group_name, 
                    {
                        'type': 'Task',  # This refers to the method name `Task`
                        'message': response,
                        'msg_type': 'task_done'
                    }
                    )

                # ADMIN DECIDES WHEN NEXT TASK IS FETCHED, WE CAN REMOVE THIS I THINK
                # # fetch the next task
                # response = await self.next_task(game)

                # await self.channel_layer.group_send(
                #     self.game_group_name, 
                #     {
                #         'type': 'Task',  # This refers to the method name `Task`
                #         'message': response,
                #         'msg_type': 'new_task'
                #     }
                #     )

            case 'new_task':

                game = await self.get_participant_game(self.user_id)
                response = await self.next_task(game)
                update_spin = await self.start_wheel_spin(game.game_id)

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

#|======================================================================|
#|                       MESSAGE                                        |
#|                       FUNCTIONS                                      |
#|======================================================================|

    # Message methods
    async def Game_End(self, event):
        message = event['message']
        msg_type = event.get('mgs_type', 'No msg_type')

        await self.send(text_data=json.dumps({
            'message': message,
            'msg_type': msg_type
        }))


    # Message methods
    async def Task(self, event):
        message = event['message']
        msg_type = event.get('msg_type', 'No msg_type')

        await self.send(text_data=json.dumps({
            'message': message,
            'msg_type': msg_type
        }))

    # Message methods
    async def Add_Update_Player(self, event):
        message = event['message']
        msg_type = event.get('msg_type', 'No msg_type')
        # Send message to WebSocket; this sends the message to each client in the group
        await self.send(text_data=json.dumps({
            'message': message,
            'msg_type': msg_type
        }))
    
    # Message methods
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

    # Message method
    async def wheel_stop_message(self, event):
        message = event['message']
        msg_type = event.get('msg_type', 'No msg_type')
        print("\nWS: CEL IS SENDING MESSAGE!\n")
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message,
            'msg_type': msg_type
        }))


#|======================================================================|
#|                   DATABASE                                           |
#|                   FUNCTIONS                                          |
#|======================================================================|
    # Database function
    @database_sync_to_async
    def get_participant_game(self, user_id):
        print("\tWS: get_participant_game")
        try: 
            part = Participant.objects.get(user_id=user_id)
            game = part.game
            game_dict = model_to_dict(game)
            print("\tWS: admin: ", game.admin)
            print("\tWS: returning game: ", game_dict)
            return game
        except Participant.DoesNotExist:
            print("\tWS: Participant does not exist")
            return None
        
    # Database function
    @database_sync_to_async
    def leave_game(self, game):
        print("\tWS: leave_game")
        try:
            player = Participant.objects.get(user=self.user_id)
            player.delete()
            game.num_players -= 1
            game.save()
            print("\tWS: successfully left the game")
            return True
        except:
            print("\tWS: failed to leave the game")
            return False
    
    # Database function
    @database_sync_to_async
    def end_game(self, game):
        print("\tWS: end_game")
        try:
            game_to_delete = Game.objects.get(game_id=game.game_id)
            print("\tWS: Fetch successfull, ", game_to_delete.game_id)
        except Exception as e:
            print("\tWS: Fetch failed error: ", str(e))
            return False

        try:
            game_to_delete.delete()
            print("\tWS: Delete successfull")
            return True
        except Exception as e:
            print("\tWS: Delete failed error: ", str(e))
            return False
        
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
        try:
            # Clears responses for specific task/game in Response.
            respones = Response.objects.filter(game=game, task=task)
            respones.delete()
            # Sets task as done in PickedTasks.
            current_task = PickedTasks.objects.get(game=game, task=task)
            current_task.done = True
            current_task.save()
        except:
            return None


    # Database function
    @database_sync_to_async
    def give_player_points(self, game, task):
        current_task = PickedTasks.objects.get(game=game, task=task)
        player = Participant.objects.get(user=current_task.user)
        player.score += Tasks.objects.get(task_id=current_task.task.task_id).points
        player.save()

        response = {
            'winner': True,
            'player&score': {'username': player.user.username, 'score': player.score}
        }
        return response
    
    # Database function
    @database_sync_to_async
    def start_wheel_spin(self, game_id):
        print("WS: start_wheel_spin")
        try:
            # Logic to start the wheel spinning
            game = Game.objects.get(game_id=game_id)
            game.wheel_spinning = True
            game.save()

            # Schedule the Celery task to change wheel_spinning value after 12 seconds
            try:
                end_wheel_spin.apply_async((game_id,), countdown=12)
            except Exception as e:
                print(str(e))
            print("WS: successfully called celery")

            # return {'success': True, 'message': 'Wheel is spinning!'}
            return True
        except Exception as e:
            print("WS: start_wheel_spin failed!, ", str(e))
            return False


    # Database function
    @database_sync_to_async
    def next_task(self, game):

        # Query database for tasks
        try: 
            task_count = Tasks.objects.filter(type=game.type).count()
            if task_count == 0:
                logger.warning("WS: no task found for this game type")
                return 0
        except Exception as e:
            logger.error(f'Error when querying tasks: {e}')
            return None

        print("above logger")
        logger.info("WS: Retrieved task count, task_count = ", task_count)

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

                picked_task = PickedTasks(task=random_task, game=game, user=random_player.user, time=dt.now())
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
    DESC: fets the user profile of the player making the connection
    Returns: User model object
    '''
    @database_sync_to_async
    def get_user(self):
        print("\tWS: get_user")
        try:
            player = User.objects.get(id=self.user_id)
            print("\tWS: Returning player: ", player.username)
            return player
        except User.DoesNotExist:
            print("\tWS: User does not exist")
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
        
    def get_participant(self):

        try:
            return True
        except: 
            return False
        pass
        
        
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
        print(f'WS: payload')
        return payload
    except ExpiredSignatureError:
        # Handle expired token, e.g., return False or raise an error
        print("WS: expired token")
        return False
    except InvalidTokenError:
        # Handle invalid token, e.g., return False or raise an error
        print("WS: invalid token")
        return False
