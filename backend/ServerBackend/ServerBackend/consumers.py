from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User # not sure if we need this one
from django.contrib.auth import authenticate
from django.conf import settings
from channels.layers import get_channel_layer
from datetime import datetime as dt, timedelta, timezone
from .models import User, Game, Participant, PickedTasks, Tasks, Response, GameHistory, PickedTasksHistory, ParticipantHistory
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
        logger.debug("WS: gamelobby, connecting...")
        # add to a group? or is the group the participant/game
        token = self.scope['cookies'].get('auth_token')

        payload = validate_jwt(token)

        if token and payload:
            await self.accept()

            # get the user id from the token payload
            self.user_id = payload.get('user_id')
            logger.debug(f'WS: user connecting is {self.user_id}')

            # query the database for the game via participant
            game = await self.get_participant_game(user_id=self.user_id)
            logger.debug(f'WS: Game_id: {game.game_id}')
            logger.debug(f'WS: num_players: {game.num_players}')

            # set the name of the group, all people in same group has the same name
            self.game_group_name = f'game_{game.game_id}'
            logger.debug(f'WS: joined channel group {self.game_group_name}')

            # Add this channel to a group based on game_id
            logger.debug(f'WS: Joining group')
            await self.channel_layer.group_add(
                self.game_group_name,
                self.channel_name
            )

            # extracting participant list
            participant_data = await self.get_new_player()

            logger.info(f"WebSocket connected: {self.channel_name}")

            logger.debug("\nWS: sending message from ws\n")
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
        logger.debug(f"WS: connection closed: {close_code}")
        logger.info(f"WebSocket disconnected: {self.channel_name} with code {close_code}")

        if close_code in no_end_game_codes:
            return

        # default value
        admin = False
        user = await self.get_user()
        game = await self.get_participant_game(self.user_id)

        # try:
        #     logger.debug("WS: fetching user")
        #     logger.debug("WS: fetching game")
        #     logger.debug("WS: gameid is ", game.game_id)
        #     game_admin = await self.get_game_admin(game)

        #     logger.debug(f"WS: comparing {game_admin} and {user}")
        #     if game_admin == user:
        #         logger.debug("WS: player is admin!")
        #         admin = True
        #     else:
        #         logger.debug("WS: player is a user")
        # except Exception as e:
        #     logger.debug("WS: Error: ", e)
        #     logger.debug("WS: no username/game, not even connected")
        #     return

        # # If disconnected player is admin, we need to end the game
        # # Potentially check the code, so that in case it was unintentional 
        # # disconnect, we can pass admin to another player

        # if admin:
        #     logger.debug("WS: Adming ending game")
        #     game_ended = await self.end_game(game)
        #     if game_ended:
        #         logger.debug("WS: game deleted!")
        #     else:
        #         logger.debug("WS: error deleting game!")
        #         return
        # else:
        left_game = await self.leave_game(game) 
        if left_game:
            logger.debug("WS: left game!")
        else:
            logger.debug("WS: error leaving game!")

        logger.debug("\nWS: sending message from ws\n")
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
        logger.debug(f"WS: {user.username} was removed from {self.game_group_name}")

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        logger.debug("\nWS: recieve ...")
        logger.debug(f'\nWS: message: \n{text_data_json}\n')
        # message = text_data_json['message']
        msg_type = text_data_json['type']

        logger.debug("WS: checking message type\n")

        match msg_type:
            case "task_vote":
                logger.debug("WS: task_vote")

                task_id = text_data_json['taskId']
                vote = text_data_json['taskVote']

                logger.debug(f'WS: taskId: {task_id}, vote: {vote}')

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

                logger.debug(f'WS: following information added to database:\n{vote_user}, {task}, {game}, {vote}')
                logger.debug(f'WS: vote_input: {vote_input}')
                
                # Create new vote.
                previous_vote, newVote = await self.add_new_vote(vote_user, task, game, vote_input)

                # Obtain the different types of votes from DB.
                yesVotes, noVotes, skipVotes = await self.get_game_votes(game)  

                response = {}

                # Check if the overwhelming majority has voted, and end game if one-sided.
                if ((participants - 1)/2 - skipVotes) < yesVotes or (yesVotes == noVotes) & yesVotes != 0:  
                    # Removes responses for specific task, in specific game.
                    await self.next_task_preperation(game, task)                                # Player wins
                    # Gives player points.
                    response = await self.give_player_points(game, task)
                    # Add Task to history table.
                    await self.update_PickedTasksHistory(game, task, True)


                elif ((participants - 1)/2 - skipVotes) < noVotes:                            
                    # Removes responses for specific task, in specific game.                    # Player loses
                    await self.next_task_preperation(game, task)
                    response = {'winner': False}
                    # Add Task to history table.    
                    await self.update_PickedTasksHistory(game, task, False)


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

                    logger.debug(f'WS: Vote response: {response}')

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
                logger.debug("WS: game_end")
                response = {
                    'game_end': True
                }
                game = await self.get_participant_game(self.user_id)
                end_game = await self.end_game(game)

                if end_game:
                    logger.debug("WS: game ended")
                else:
                    logger.debug("WS: failed to end game")

                logger.debug("WS: sending game_end message to other members")
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
        logger.debug("WS: Game_End message method")
        message = event['message']
        msg_type = event.get('msg_type', 'No msg_type')

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
        logger.debug("\nWS: CEL IS SENDING MESSAGE!\n")
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
    def update_PickedTasksHistory(self, game, task, bool):
        try:
            current_task = PickedTasks.objects.get(game=game, task=task)
            task_history = PickedTasksHistory(task=task, game_id=game.game_id, user=current_task.user.username, time=dt.now(), win=bool)
            task_history.save()
            return True
        except Exception as e:
            print(f'WS: Error when updating task history: {e}')
            return False


    # Database function
    @database_sync_to_async
    def get_participant_game(self, user_id):
        logger.debug("\tWS: get_participant_game")
        try:
            logger.debug("\tWS: querying database")
            part = Participant.objects.get(user_id=user_id)
            logger.debug("\tWS: query complete")
            game = part.game
            logger.debug("\tWS: returning game")
            # game_dict = model_to_dict(game)
            # logger.debug("\tWS: admin: ", game.admin)
            # logger.debug("\tWS: returning game: ", game_dict)

            return game
        except Participant.DoesNotExist:
            logger.debug("\tWS: Participant does not exist")
            return None
    
    @database_sync_to_async
    def get_game_admin(self, game):
        logger.debug("\tWS: get_game_admin")
        try:
            return game.admin
        except Exception as e:
            logger.debug(f"failed to get game admin, error {str(e)}")
            
        
    # Database function
    @database_sync_to_async
    def leave_game(self, game):
        logger.debug("\tWS: leave_game")
        try:
            player = Participant.objects.get(user=self.user_id)
            
            participantHist = ParticipantHistory(user=player.user, game=player.game.game_id)
            participantHist.save()

            player.delete()
            game.num_players -= 1
            game.save()
            logger.debug("\tWS: successfully left the game")
            return True
        except:
            logger.debug("\tWS: failed to leave the game")
            return False
    
    # Database function
    @database_sync_to_async
    def end_game(self, game):
        logger.debug("\tWS: end_game")

        try:
            participants = Participant.objects.filter(game=game)

            gameWinner = None
            for participant in participants:
                participantHist = ParticipantHistory(user=participant.user, game_id=participant.game.game_id)
                participantHist.save()
                if gameWinner is None or participant.score > gameWinner.score:
                    gameWinner = participant

            game_history = GameHistory(game_id=game.game_id, 
                                    title=game.title, 
                                    description=game.description,
                                    winner=gameWinner.user.username, 
                                    start_time=game.start_time, 
                                    end_time=dt.date(dt.now()))
            game_history.save()
            
        except Exception as e:
            print("WS: Error when updating game history: ", e)
            return False
         

        try:
            game_to_delete = Game.objects.get(game_id=game.game_id)
            logger.debug("\tWS: Fetch successfull, ", game_to_delete.game_id)

        except Exception as e:
            logger.debug(f"\tWS: Fetch failed error: {str(e)}")
            return False

        try:
            game_to_delete.delete()
            logger.debug("\tWS: Delete successfull")
            return True
        except Exception as e:
            logger.debug(f"\tWS: Delete failed error: {str(e)}")
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
        logger.debug("WS: start_wheel_spin")
        try:
            # Logic to start the wheel spinning
            game = Game.objects.get(game_id=game_id)
            game.wheel_spinning = True
            game.save()

            # Schedule the Celery task to change wheel_spinning value after 12 seconds
            try:
                end_wheel_spin.apply_async((game_id,), countdown=12)
            except Exception as e:
                logger.debug(str(e))
            logger.debug("WS: successfully called celery")

            # return {'success': True, 'message': 'Wheel is spinning!'}
            return True
        except Exception as e:
            logger.debug(f"WS: start_wheel_spin failed!, {str(e)}")
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

        logger.debug("above logger")
        logger.info(f"WS: Retrieved task count, task_count = {task_count}")

        # Check if task is available
        for _ in range(task_count):

            try:
                random_task = Tasks.objects.filter(type = game.type).order_by('?').first()
                # check if this task is already picked
                taskExist = PickedTasks.objects.filter(task=random_task, game=game).exists()
            except:
                logger.error("WS: Error when querying tasks")
                return None

            # if not, we save it to PickedTasks, and return the question
            if not taskExist:
                random_player = Participant.objects.filter(game=game, isPicked=False).order_by('?').first()

                if not random_player:           # if no player was picked, then we refresh the wheel and pick a player.
                    try:
                        participants = Participant.objects.filter(game=game)
                        for p in participants:
                            p.isPicked = False
                            p.save()
                    except Exception as e:
                        logger.error(f"WS: Error when refreshing players: {e}")
                        return None

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

            logger.debug(f'WS: new participant being added: {new_participant.user}')

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
        logger.debug("\tWS: get_user")
        try:
            player = User.objects.get(id=self.user_id)
            logger.debug(f"\tWS: Returning player: {player.username}")
            return player
        except User.DoesNotExist:
            logger.debug("\tWS: User does not exist")
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
                logger.debug("WS: vote exists, editing the vote")

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
                logger.debug("WS: Creatig new vote")
                logger.debug(f'WS: New record: user: {user}, task: {task}, game: {game}, vote: {vote}')
                new_vote = Response(user=user,
                                    task=task,
                                    game=game,
                                    vote=vote)
                new_vote.save()
                return None, new_vote
            
        except IntegrityError as e:
            logger.debug(f"WS: IntegrityError - {str(e)}")
            return None
        except ValidationError as e:
            logger.debug(f"WS: ValidationError - {str(e)}")
            return None
        except Exception as e:
            logger.debug(f"WS: Unexpected error - {str(e)}")
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
        logger.debug(f'WS: payload')
        return payload
    except ExpiredSignatureError:
        # Handle expired token, e.g., return False or raise an error
        logger.debug("WS: expired token")
        return False
    except InvalidTokenError:
        # Handle invalid token, e.g., return False or raise an error
        logger.debug("WS: invalid token")
        return False
