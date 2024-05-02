import json
import jwt
from datetime import datetime as dt, timedelta, timezone
from .models import User, Game, Participant, Tasks, PickedTasks
from .tasks import end_wheel_spin
from django.core.exceptions import ValidationError
from django.http import Http404, JsonResponse
from django.shortcuts import redirect, render
from django.http import HttpResponse, HttpResponseRedirect
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from django.db.models import Count
from django.conf import settings



@csrf_exempt
def hello_world(request):
    return JsonResponse({'message': 'Welcome to boozechase'})



@csrf_exempt
def home_page(request):
    return JsonResponse({'message': 'Welcome to boozechase'})


def generate_JWT(user):
    payload = {
        'user_id': user.id,
        'exp': dt.now(timezone.utc) + timedelta(hours=12),
        'iat': dt.now(timezone.utc)
    }

    print(f'testing datetime: {dt.now(timezone.utc)}')

    JWToken = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
    return JWToken

def join_game(request):
    print("joining game")

    if request.method == "POST":
        print("valid method")
        user = request.user

        data = json.loads(request.body)

        gameId = data.get('gameid').lower()
        print(f'attempting to join game {gameId}')

        if user.is_authenticated:

            # should return a unique game
            try:
                game = Game.objects.get(game_id = gameId)
                game.num_players += 1
                game.save()
            except:
                print("game not found")
                return JsonResponse({'success': False, 'msg': 'invalid game code'}, status=404)
            
            print("joining game")
            player = Participant(game = game,
                                 user = user,
                                 score = 0)
            
            player.save()

            return JsonResponse({'success': True, 'msg': 'joined game'})
            
        else:
            print("user not authenticated")
            return JsonResponse({'success': False, 'msg': 'not logged in/authenticated'}, status=401)
    else:
        return JsonResponse({'success': False, 'msg': 'invalid method'}, status= 405)
        

def leave_game(request):
    print("leaving game")

    if request.method == "PUT":
        print("valid method")

        user = request.user

        if user.is_authenticated:
            print("user is authenticated")
            player = Participant.objects.get(user=user)
            print(f'player {player.user.username} leaving game with id: {player.game.game_id}')

            game = Game.objects.get(game_id=player.game.game_id)
            game.num_players -= 1
            print(f'new game num_players: {game.num_players}')
            game.save()
            print("saved game to database")

            player.delete()
            print("player deleted from participants")

            return JsonResponse({'success': True})
        
        else:
            return JsonResponse({'success': False, 'msg': 'not authenticated'}, status=401)
        
    else:
        return JsonResponse({'success': False, 'msg': 'invalid method'}, status= 405)



def create_game(request):
    if request.method == "POST":
        user = request.user

        data = json.loads(request.body)

        gameId = data.get('gameid')
        type = data.get('id')
        title = data.get('title')
        description = data.get('description')
        print(gameId)

        if user.is_authenticated:

            potential_participant = Participant.objects.filter(user=user).exists()
            
            if potential_participant:
                potential_participant = Participant.objects.filter(user=user)

                Participant.objects.filter(user=user).delete()
                return JsonResponse({'success': False, 'error': 'already in a game'}, status=409)
            else:
                print("not in a game")

            # create game in the database
            new_game = Game(game_id = gameId,
                            type=type,
                            description=description, 
                            admin=user,
                            start_time=dt.now(), 
                            end_time=None,
                            game_started=False)
            
            new_game.save()
            
            # Create a participant in the created game(admin)
            player = Participant(game = new_game,
                                 user = user,
                                 score = 0)
            
            player.save()

            return JsonResponse({'success': True})
        else:
            return JsonResponse({'success': False, 'msg': 'not authenticated'})
        
        
'''
Used when checking if a player is in game
Returns 
@gameId : string
@isAdmin : boolean
'''
# returns game_id and admin boolean, fields 'success', 'gameId', 'isAdmin'  
def get_game(request):
    if request.method == 'GET':
        user = request.user

        if user.is_authenticated:

            # Checks if player is currently in a game
            potential_participant = Participant.objects.filter(user=user).exists()
            if potential_participant:

                # Query the participant record for the player
                part = Participant.objects.get(user=user)

                # Check if there is an active task
                active_task = PickedTasks.objects.filter(game=part.game, done=False).first()
                print(f'value of active_task: {active_task}')

                if active_task:
                    task_data = {
                        'description': active_task.task.description,
                        'points': active_task.task.points,
                        'pickedPlayer': active_task.user.username,
                        'taskId': active_task.task.task_id
                    }
                else:
                    task_data = None
                
                # checks if player is admin
                if user == part.game.admin:
                    is_admin = True
                else:
                    is_admin = False
                # return JsonResponse({'success': True, 'description': random_task.description, 'points': random_task.points, 'pickedPlayer': random_player.user.username, 'taskId': random_task.task_id})

                response = {
                    'success': True, 
                    'gameId': part.game.game_id, 
                    'isAdmin': is_admin, 
                    'username': user.username, 
                    'gameStarted': part.game.game_started, 
                    'isSpinning': part.game.wheel_spinning,
                    'activeTask': task_data
                }

                return JsonResponse({'success': True, 'gameId': part.game.game_id, 'isAdmin': is_admin, 'username': user.username, 'gameStarted': part.game.game_started, 'activeTask': task_data})
            else:
                # Player is not in a game
                return JsonResponse({'success': False, 'msg': 'not in a game'})
        else:
            # not logged in
            return JsonResponse({'success': False, 'msg': 'user not authenticated'})
    else:
        # invalid method
        return JsonResponse({'success': False, 'msg': "invalid method"})

def delete_game(request):
    print('delete game')
    print(request.method)

    if request.method == 'DELETE':
        print("valid method")

        user = request.user

        if user.is_authenticated:
            print("user is logged in")

            potential_participant = Participant.objects.filter(user=user).exists()
            # potential_participant = Participant.objects.get(user=user)
            if potential_participant:
                print("in a game, checking if admin")
                part = Participant.objects.get(user=user)

                admin = part.game.admin
                print(f'is this a player ID?: {admin}')

                if user == admin:
                    print("player is an admin, deleting game")
                    game_id = part.game.game_id
                    success = clean_up_game(game_id=game_id)
                    return JsonResponse({'success': success})
                else:
                    return JsonResponse({'success': False, 'msg': 'user is not admin of game'})
            else:
                print("not in a game, fail")
                return JsonResponse({'success': False})
    else:
        return JsonResponse({'success': False, 'msg': 'invalid method'})


def clean_up_game(game_id):

    try:
        games_to_delete = Game.objects.filter(game_id=game_id)
        players_to_delete = Participant.objects.filter(game_id=game_id)
        print("retrieved game and players")
    except:
        print("failed to retrieve game and participant")
        return False

    try:
        games_to_delete.delete()
        players_to_delete.delete()
        print("deleted game and participants")
        return True
    except:
        print("failed to delete game and players")
        return False


        
'''
Returns the next task of the game type the player is currently in.
Loops through the PickedTasks table until it finds a unique task for
the current game.
Returns:
@description : string
@points : int
'''
def next_task(request):
    if request.method == 'GET':
        user = request.user
        if user.is_authenticated:

            # get the participant, game, and extract type
            part = Participant.objects.get(user=user)
            game = part.game
            type = game.type

            # task_user = None

            # # Snakk med jørgen: han har gjort en del akkurat her.
            # # Burde jobbe mer med Sockets, og samkjøre med jørgen når det lar sæ gjøres

            # for _ in range(game.num_players):
            #     task_user = Participant.objects.filter(game=game).order_by('?').first
            #     # here we need to find a random player. 
            #     # is_picked = PickedTasks

            task_count = Tasks.objects.filter(type=type).count()

            # Check if task is available
            for _ in range(task_count):
                # get a random task, and total tasks
                # this might not actually work 100, we can't be sure that the random 
                # will not choose the same "picked" task multiple times, and we thus
                # we might end report no avaiable task when that is not the case
                random_task = Tasks.objects.filter(type = type).order_by('?').first()
                
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
                    print(f'response: description: random_task.description, points: random_task.points, pickedPlayer: random_player.user.username, taskId: random_task.task_id')
                    return JsonResponse({'success': True, 'description': random_task.description, 'points': random_task.points, 'pickedPlayer': random_player.user.username, 'taskId': random_task.task_id})
                


            # arrive here if all tasks have been checked, or no tasks available        
            return JsonResponse({'success': False, 'msg': 'no tasks'})
        
        else:
            return JsonResponse({'success': False, 'msg': 'Not authenticated'})
    else:
        return JsonResponse({'success': False, 'msg': 'Invalid method'})

def current_task(request):
    if request.method == 'GET':
        user = request.user

        if user.is_authenticated:
            part = Participant.objects.get(user=user)
            game = part.game

            currTask = PickedTasks.objects.filter(game=game, done=False).first()
            
            if currTask:
                return JsonResponse({'success': True, 'taskId': currTask.task.task_id, 'description': currTask.task.description, 'points': currTask.task.points, 'pickedPlayer': currTask.user.username})
            
            return JsonResponse({'success': False, 'msg': 'no current task'})
        
        else:
            return JsonResponse({'success': False, 'msg': 'not authenticated'})
    else:
        return JsonResponse({'success': False, 'msg': 'invalid method'})

def give_points(request):
    if request.method == 'PUT':
        user = request.user

        if user.is_authenticated:
            data = json.loads(request.body) 
            points = data.get('points')
            username = data.get('username')

            # get the participant record for the user receiving the points
            player = Participant.objects.get(user=User.objects.get(username=username))

            # update the score
            player.score += points
            player.save()

            return JsonResponse({'success': True})
        else:
            return JsonResponse({'success': False, 'msg': 'not authenticated'})
    else:
        return JsonResponse({'success': False, 'msg': 'invalid method'})


def get_game_participants(request):
    print("get game participants")

    if request.method == 'GET':
        print("valid method")
        user = request.user

        if user.is_authenticated:
            print("validated")

            print("getting user record in participant table")
            current_user_participant = Participant.objects.get(user=user)
            print("getting game in users participant table")
            current_game = current_user_participant.game

            print("getting array of players in same game")
            participants_in_same_game = Participant.objects.filter(game=current_game)

            # Extract relevant data to send back (e.g., usernames, scores)
            print("sending back data")
            participant_data = [{'username': p.user.username, 'score': p.score} 
                                for p in participants_in_same_game]

            return JsonResponse({'participants': participant_data})
        else:
            print("not validated")
            return JsonResponse({'message': "not authenticated"})
        
    else:
        print("invalid method")
        return JsonResponse({'message': "incorrect method"})


def grab_token(request):
    # Ensure a CSRF token is set in the user's session
    csrf_token = get_token(request)
    print("returning token: ", csrf_token)
    # Return the token in a JSON response
    return JsonResponse({'csrfToken': csrf_token})


def user_logout(request):
    print("logging out")
    if request.method == 'POST':
        print("Valid method")
        user = request.user

        if user.is_authenticated:
            print("user is logged in, logging out")
            logout(request)
            return JsonResponse({'success': True, 'msg': 'logged out'}, status=200)
        else:
            return JsonResponse({'success': False, 'msg': 'must be logged in to log out'}, status=204)
    else:
        return JsonResponse({'success': False, 'msg': 'invalid method, must be POST'}, status=405)


        # if user.is_authenticated:
        #     return JsonResponse({'success': True})
        # else:
        #     return JsonResponse({'success': False, 'message': 'No user was logged in.'})


def get_profile(request):
    print("get profile")    
    if request.method == 'GET':
        print("Valid method")
        
        user = request.user

        if user.is_authenticated:
            user_data = {
                'first_name': user.first_name,
                'last_name': user.last_name,
                'username': user.username,
                'email': user.email,
            }
            return JsonResponse({'user_data': user_data})
        else:
            return JsonResponse({'error': 'User not authenticated'}, status=401)

    else:
        # If the request method is not GET, return an error
        return JsonResponse({'error': 'Invalid request method'}, status=405)

def update_profile(request):
    print("updating profile")

    if request.method == 'PUT':
        print("valid method")

        user = request.user

        data = json.loads(request.body)

        field = data.get('field')
        print(f'field: {field}')
        new_value = data.get('value')
        print(f'field: {new_value}')

        if user.is_authenticated:
            
            # set attributes of the user
            setattr(user, field, new_value)

            # save it to the database
            user.save()
            return JsonResponse({'success': True})

        else:
            return JsonResponse({'error': 'user not logged in'})
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=405)


def user_login(request):
    print("inside user_login")
    if request.method == 'POST':

        print("valid method")
        # Get username and password from request.POST
        data = json.loads(request.body)

        username = data.get('username')
        password = data.get('password')

        print(username)
        print(password)

        print("attempting to authenticate...")
        # Use Django's authenticate function to verify credentials
        user = authenticate(username=username, password=password)
        print("authentication complete!")

        if user is not None:
            print("attempting to login")
            login(request, user)
            print("Login complete!")
            print("generating JWT")
            token = generate_JWT(user)
            print(f'JWT: {token}')

            response = JsonResponse({'status': 'success', 'JWT': token}, status=200)

            response.set_cookie('auth_token', token, httponly=True, path='/ws/', samesite='Lax', secure=True)
            # Return a JSON response or redirect as per your application's flow
            return response
        else:
            print("not valid")
            return JsonResponse({'error': 'Invalid credentials'}, status=401)

    return JsonResponse({'error': 'Only POST method allowed'}, status=405)

'''
Gets the username of the client
'''
def get_username(request):
    print("get_username")
    if request.method == 'GET':
        print("valid method")
        user = request.user
        if user.is_authenticated:
            print("user is authenticated")
            return JsonResponse({'success': True, 'username': user.username}, status=200)
        else:
            return JsonResponse({'success': False, 'msg': 'not logged in'}, status=204)
    else:
        print("error, invalid method")
        return JsonResponse({'success': False, 'msg': 'invalid method'}, status=405)

'''
Tells the client wether they are logged in or not
'''
def get_login_status(request):
    print("get_login_status")
    if request.method == 'GET':
        print("valid method")

        user = request.user

        if user.is_authenticated:
            print("user is logged in, returning 200")
            return JsonResponse({'success': True, 'msg': 'logged in'}, status=200)
        else:
            print("not logged in")
            return JsonResponse({'success': False, 'msg': 'not logged in'}, status=204)
        
    else:
        print("invalid method")
        return JsonResponse({'success': False, 'msg': 'invalid method'}, status=405)


@csrf_exempt
def put_admin(request):
    try:
        data = json.loads(request.body)

        first_name = data.get('first_name')
        last_name = data.get('last_name')
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')


        # Validate the information
        if not (first_name and last_name and email and password):
            return JsonResponse({'error': 'Missing fields'}, status=400)

        # Create a new user instance but don't save it yet
        new_user = User(first_name=first_name, last_name=last_name, username=username, email=email)

        # Set the password
        new_user.set_password(password)

        # Validate and save the user
        new_user.full_clean()
        new_user.save()

        return JsonResponse({'message': 'User created successfully', 'user_id': new_user.id}, status=200)
    
    except json.JSONDecodeError:
        # JSON data could not be parsed
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except ValidationError as e:
        # Invalid data
        return JsonResponse({'error': str(e)}, status=400)
    except Exception as e:
        # Any other errors
        return JsonResponse({'error': 'An error occurred'}, status=500)



@csrf_exempt
def put_user(request):
    # Creates a new user
    try:
        data = json.loads(request.body)

        first_name = data.get('first_name')
        last_name = data.get('last_name')
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        # Validate the information
        if not (first_name and last_name and username and email and password):
            return JsonResponse({'error': 'Missing fields'}, status=400)

        new_user = User(first_name=first_name, last_name=last_name, username=username, email=email, password=password)

        # Set the password
        new_user.set_password(password)

        new_user.full_clean()  # Validate the information
        new_user.save()

        return JsonResponse({'message': 'User created successfully', 'user_id': new_user.id}, status=200)

    except json.JSONDecodeError:
        # JSON data could not be parsed
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except ValidationError as e:
        # Invalid data
        return JsonResponse({'error': str(e)}, status=400)
    except Exception as e:
        # Any other errors
        return JsonResponse({'error': 'An error occurred'}, status=500)



def delete_user(request):

    try:
        pass
    except json.JSONDecodeError:
        return JsonResponse({'error': 'invalid JSON'}, status=400)
    except ValidationError as e:
        return JsonResponse({'error': str(e)}, status=400)
    except Exception as e:
        # Any other errors
        return JsonResponse({'error': 'An error occurred'}, status=500)