import json
import jwt
import base64
import logging
import os
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.contrib.sites.shortcuts import get_current_site
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
from functools import wraps


# Logger
logger = logging.getLogger(__name__)


# wrapper for required method, or methods should we allow more
def require_http_method(request_method_list):
    def decorator(view_func):
        @wraps(view_func)
        def _method_check(request, *args, **kwargs):
            if request.method not in request_method_list:
                return JsonResponse(
                    {
                    'success': False, 
                    'msg': f'invalid method, expected {request_method_list}, got {request.method}'
                    }, status=405)
            return view_func(request, *args, **kwargs)
        return _method_check
    return decorator

# wrapper for requiring authentication
def require_authentication(view_func):
    @wraps(view_func)
    def _authentication_check(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({
                    'success': False, 
                    'msg': 'not authenticated'
                    }, status=401)
        return view_func(request, *args, **kwargs)
    return _authentication_check
    

@csrf_exempt
def hello_world(request):
    return JsonResponse({'message': 'Welcome to boozechase'})



@csrf_exempt
def home_page(request):
    return JsonResponse({'message': 'Welcome to boozechase'})


def generate_JWT(user):
    logger.error("this is a test error")
    payload = {
        'user_id': user.id,
        'exp': dt.now(timezone.utc) + timedelta(hours=12),
        'iat': dt.now(timezone.utc)
    }

    print(f'testing datetime: {dt.now(timezone.utc)}')

    JWToken = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
    return JWToken


@require_http_method(['POST'])
@require_authentication
def join_game(request):
    print("joining game")

    user = request.user

    data = json.loads(request.body)

    gameId = data.get('gameid').lower()
    print(f'attempting to join game {gameId}')

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

    return JsonResponse({'success': True, 'msg': 'joined game'}, status=200)
        

@require_http_method(['PUT'])
@require_authentication
def leave_game(request):
    print("leaving game")

    user = request.user

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

    return JsonResponse({'success': True}, status=200)


@require_http_method(['POST'])
@require_authentication
def create_game(request):
    user = request.user

    data = json.loads(request.body)

    gameId = data.get('gameid')
    type = data.get('id')
    title = data.get('title')
    description = data.get('description')
    print(gameId)

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

    return JsonResponse({'success': True}, status=200)
        
        
'''
Used when checking if a player is in game
Returns 
@gameId : string
@isAdmin : boolean
'''
@require_http_method(['GET'])
@require_authentication
def get_game(request):
    user = request.user

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

        return JsonResponse(response)
    else:
        # Player is not in a game
        return JsonResponse({'success': False, 'msg': 'not in a game'})


@require_http_method(['DELETE'])
@require_authentication
def delete_game(request):
    print('delete game')

    user = request.user

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

@require_http_method(['GET'])
@require_authentication
def next_task(request):
    user = request.user

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


@require_http_method(['GET'])
@require_authentication
def current_task(request):
    user = request.user

    part = Participant.objects.get(user=user)
    game = part.game

    currTask = PickedTasks.objects.filter(game=game, done=False).first()
    
    if currTask:
        return JsonResponse({'success': True, 'taskId': currTask.task.task_id, 'description': currTask.task.description, 'points': currTask.task.points, 'pickedPlayer': currTask.user.username})
    
    return JsonResponse({'success': False, 'msg': 'no current task'})
    

@require_http_method(['GET'])
@require_authentication
def give_points(request):
    user = request.user

    data = json.loads(request.body) 
    points = data.get('points')
    username = data.get('username')

    # get the participant record for the user receiving the points
    player = Participant.objects.get(user=User.objects.get(username=username))

    # update the score
    player.score += points
    player.save()

    return JsonResponse({'success': True})


@require_http_method(['GET'])
@require_authentication
def get_game_participants(request):
    print("get game participants")

    user = request.user


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


@require_http_method(['GET'])
def grab_token(request):
    # Ensure a CSRF token is set in the user's session
    csrf_token = get_token(request)
    print("returning token: ", csrf_token)
    # Return the token in a JSON response
    return JsonResponse({'csrfToken': csrf_token})


@require_http_method(['POST'])
@require_authentication
def user_logout(request):
    print("logging out")
    try:
        logout(request)
    except Exception as e:
        print("Error logging out, error: ", e)

    return JsonResponse({'success': True, 'msg': 'logged out'}, status=200)


@require_http_method(['GET'])
@require_authentication
def get_profile(request):
    print("get profile")

    user = request.user
    user_data = {
        'first_name': user.first_name,
        'last_name': user.last_name,
        'username': user.username,
        'email': user.email,
    }
    return JsonResponse({'user_data': user_data})


@require_http_method(['PUT'])
@require_authentication
def update_profile(request):
    print("updating profile")

    user = request.user

    data = json.loads(request.body)

    field = data.get('field')
    print(f'field: {field}')
    new_value = data.get('value')
    print(f'field: {new_value}')
    
    # set attributes of the user
    setattr(user, field, new_value)

    # save it to the database
    user.save()
    return JsonResponse({'success': True})



'''
Updates the users profile picture
Recieves a DataForm form
'''
@require_http_method(['POST'])
@require_authentication
def upload_image_base64(request):
    print("upload_image_base64")

    user = request.user

    profile_picture = request.FILES.get('profileImage')

    if profile_picture:
        print("picture is valid")

        extension = profile_picture.name.split('.')[-1].lower()
        if extension not in ['png', 'jpg', 'jpeg']:
            return JsonResponse({'success': False, 'error': 'Unsupported file format, must be png, jpg, or jpeg'}, status=400)
        
        file_path = f'ServerBackend/media/custom/{user.id}.{extension}'

        # delete old profile pic
        if "preset" not in user.profile_pic.path:
            print("user is using custom, delete old profile pic")
            try:
                # fix this
                # old_file_path = user.profile_pic.path
                # if default_storage.exists(old_file_path):
                #     default_storage.delete(old_file_path)
                print("old profile pic deleted")    
            except Exception as e:
                print(f"Error deleting old image: {str(e)}")
        
        # Save new image
        try:
            user.profile_pic.save(f"{user.id}.{extension}", profile_picture)
            user.save()
            print("New profile picture stored")
            return JsonResponse({'success': True}, status=201)
        except Exception as e:
            # Handle exceptions
            print("could not save picture. error: ", e)
            return JsonResponse({'success': False}, status=500)
    else:
        print("no image provided")
        return JsonResponse({'error': 'No image file provided'}, status=400)


@require_http_method(['GET'])
@require_authentication
def get_image_urls(request):
    print("get_all_images_base64")
    user = request.user

    user_id_list = get_user_ids_from_usernames(user)


    url_list = get_profile_picture_on_users(user_id_list)

    uri_list = []
    for file_path in url_list:
        # Find the index of 'custom' or 'preset' and slice the path from that point
        if 'custom' in file_path:
            index = file_path.find('custom')
            uri_list.append(file_path[index:])
        elif 'preset' in file_path:
            index = file_path.find('preset')
            uri_list.append(file_path[index:])

    # current site and protocol
    current_site = get_current_site(request)
    protocol = 'https' if request.is_secure() else 'http'

    user_files_urls = [
        f"{protocol}://{current_site.domain}{default_storage.url(file)}"
        for file in uri_list
    ]

    return JsonResponse({"success": True, 'uris': user_files_urls}, status=200)


@require_http_method(['GET'])
@require_authentication
def get_image_base64(request):
    print("get_image_base64")

    user = request.user
    try:
        print("getting profile picture")
        path = user.profile_pic.path
        print(f'path to profile_pic: {path}')
        with open(path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
        return JsonResponse({'image': encoded_string}, status=200)
    except IOError:
        print("Could not locate file")
        return JsonResponse({'error': 'Image not found'}, status=404)


@require_http_method(['GET'])
@require_authentication
def get_all_images_base64(request): #RENAME! NOT USING BASE64
    print("get_all_images_base64")
    user = request.user
    print("user is authenticated")
    # Construct the path where user's images are stored
    user_images_path_1 = f'{user.id}_'
    user_images_path_2 = f'{user.id}.'
    all_files = default_storage.listdir('custom/')[1]  # Second element contains file names
    
    # Filter files that start with the user ID followed by an underscore or dot
    edge_case_pic = [file for file in all_files if file.startswith(user_images_path_2)]
    additional_pics = [file for file in all_files if file.startswith(user_images_path_1)]

    # join the lists
    user_pics = edge_case_pic + additional_pics

    # current site and protocol
    current_site = get_current_site(request)
    protocol = 'https' if request.is_secure() else 'http'
    

    # Create full URLs for each file, so that they are reachable from the frontend
    user_files_urls = [
        f"{protocol}://{current_site.domain}{default_storage.url(os.path.join('custom/', file))}"
        for file in user_pics
    ]

    print(f'sending files: {user_files_urls}')
    return JsonResponse({'success': True, 'files': user_files_urls}, status=200)
    

@require_http_method(['PUT'])
@require_authentication
def select_image(request):
    print("select image")
    
    user = request.user
    data = json.loads(request.body)
    new_profile_pic_url = data.get('newProfilePicUrl')
    relative_path = '/'.join(new_profile_pic_url.split('/media/')[-1].split('/'))
    print(f'new profile pic url {relative_path}')

    if not new_profile_pic_url:
        return JsonResponse({'success': False, 'error': 'No image URL provided'}, status=400)
    
    try: 
        user.profile_pic = relative_path
        user.save()
    except Exception as e:
        print("error updating profile picture")
        return JsonResponse({'error': 'Could not change profile picture'}, status=500)

    return JsonResponse({'success': True}, status=200)
    

@require_http_method(['DELETE'])
@require_authentication
def delete_image(request):
    print("select image")
    
    user = request.user
    data = json.loads(request.body)
    new_profile_pic_url = data.get('imagePath')
    print("is authenticated")
    relative_path = '/'.join(new_profile_pic_url.split('/media/')[-1].split('/'))
    print(f'new profile pic url {relative_path}')

    if not new_profile_pic_url:
        return JsonResponse({'success': False, 'error': 'No image URL provided'}, status=400)
    
    if delete_media_file(relative_path):
        return JsonResponse({'success': True}, status=200)
    else:
        return JsonResponse({'error': 'Could not delete profile picture'}, status=500)


def delete_media_file(file_path):
    """Deletes a file from the media storage."""
    if default_storage.exists(file_path):
        default_storage.delete(file_path)
        return True
    else:
        return False

def get_user_ids_from_usernames(user):

    try:
        print("getting user record in participant table")
        current_user_participant = Participant.objects.get(user=user)
        print("getting game in users participant table")
        current_game = current_user_participant.game

        print("getting array of players in same game")
        participants_in_same_game = Participant.objects.filter(game=current_game)

        user_ids = []
        for part in participants_in_same_game:
            user_ids.append(part.user.id)

        # Extract relevant data to send back (e.g., usernames, scores)
        print("sending back data")
        return user_ids
    except:
        logger.error("error getting user ids from game")


def get_profile_picture_on_users(user_id_list):

    url_list = []
    for id in user_id_list:

        # retrieve user record
        user = User.objects.get(id=id)
        
        # append profile pic to the list
        url_list.append(user.profile_pic.path)

    return url_list



# @require_authentication
@require_http_method(['POST'])
def user_login(request):
    print("inside user_login")

    # Get username and password from request.POST
    data = json.loads(request.body)

    username = data.get('username')
    password = data.get('password')

    print(username)
    print(password)

    logger.info("attempting to authenticate...")
    # Use Django's authenticate function to verify credentials
    user = authenticate(username=username, password=password)
    logger.info("authentication complete!")

    if user is not None:
        logger.info("attempting to login")
        login(request, user)
        logger.info("Login complete!")
        logger.info("generating JWT")
        token = generate_JWT(user)
        print(f'JWT: {token}')

        response = JsonResponse({'success': True, 'JWT': token}, status=200)

        response.set_cookie('auth_token', token, httponly=True, path='/ws/', samesite='Lax', secure=True)
        # Return a JSON response or redirect as per your application's flow
        return response

'''
Gets the username of the client
'''
@require_http_method(['GET'])
@require_authentication
def get_username(request):
    print("get_username")

    user = request.user

    return JsonResponse({'success': True, 'username': user.username}, status=200)

'''
Tells the client wether they are logged in or not
'''
@require_http_method(['GET'])
@require_authentication
def get_login_status(request):
    print("get_login_status")

    user = request.user

    if user.is_authenticated:
        print("user is logged in, returning 200")
        return JsonResponse({'success': True, 'msg': 'logged in'}, status=200)
    else:
        print("not logged in")
        return JsonResponse({'success': False, 'msg': 'not logged in'}, status=204)
        

@require_http_method(['POST'])
@require_authentication
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


@require_http_method(['POST'])
@require_authentication
def create_user(request):
    # Creates a new user
    print("put_user")
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

        # Check if the username or email is already in use
        existing_user = User.objects.filter(username=username).first()
        existing_email = User.objects.filter(email=email).first()
        
        if existing_user and existing_email:
            return JsonResponse({'error': 'Both username and email are already in use'}, status=409)
        elif existing_user:
            return JsonResponse({'error': f'Username "{existing_user.username}" is already in use'}, status=409)
        elif existing_email:
            return JsonResponse({'error': f'Email "{existing_email.email}" is already in use'}, status=409)

        new_user = User(first_name=first_name, last_name=last_name, username=username, email=email, password=password)

        # Set the password
        new_user.set_password(password)

        new_user.full_clean()  # Validate the information
        new_user.save()

        return JsonResponse({'success': True, 'message': 'User created successfully', 'user_id': new_user.id}, status=200)

    except json.JSONDecodeError:
        # JSON data could not be parsed
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except ValidationError as e:
        # Invalid data
        return JsonResponse({'error': str(e)}, status=400)
    except Exception as e:
        # Any other errors
        return JsonResponse({'error': 'An error occurred'}, status=500)


# have not done this yet
@require_http_method(['DELETE'])
@require_authentication
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