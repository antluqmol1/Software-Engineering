import json
import jwt
import base64
import logging
import os
import re
from django.core.files.storage import default_storage
from django.contrib.sites.shortcuts import get_current_site
from datetime import datetime as dt, timedelta, timezone
from .models import User, Game, Participant, Tasks, PickedTasks, GameHistory, PickedTasksHistory, ParticipantHistory
from .tasks import end_wheel_spin
from django.core.exceptions import ValidationError
from django.http import Http404, JsonResponse
from django.shortcuts import redirect, render
from django.http import HttpResponse, HttpResponseRedirect, HttpResponseForbidden
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from django.db.models import Count
from django.conf import settings
from functools import wraps
from django_ratelimit.decorators import ratelimit


# Logger
logger = logging.getLogger(__name__)


# Function to prevent DOS attacks
def rate_limit_exceeded():
    return HttpResponseForbidden('Rate limit exceeded, try again later.')

# wrapper for required method, or methods, should we allow more
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


#|======================================================================================|
#| auth views                                                                           |
#| views for user authentication                                                        |
#|======================================================================================|

def generate_JWT(user):
    logger.info(f"generating JWT token for user {user.username}")
    payload = {
        'user_id': user.id,
        'exp': dt.now(timezone.utc) + timedelta(hours=12),
        'iat': dt.now(timezone.utc)
    }

    logger.debug(f'testing datetime: {dt.now(timezone.utc)}')

    JWToken = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
    return JWToken


@require_http_method(['GET'])
def grab_token(request):
    '''
    Generates a csrf token for the user
    returns:
    @csrfToken : string
    '''
    # Ensure a CSRF token is set in the user's session
    # must be generated again if the user logs in

    csrf_token = get_token(request)
    logger.debug(f"{request.user.username} assigned token: {csrf_token}")
    return JsonResponse({'csrfToken': csrf_token}, status=200)


@require_http_method(['POST'])
def user_login(request):
    '''
    Logs the user in using djangos built in authentication
    Also generates a JWT token for the user, neccessary for websocket
    returns:
    @JWT : string
    '''
    data = json.loads(request.body)

    username = data.get('username')
    password = data.get('password')

    if not (username and password):
        return JsonResponse({'success': False, 'error': 'Missing username or password'}, status=400)

    logger.info("attempting to authenticate...")
    
    # Use Django's authenticate function to verify credentials
    user = authenticate(username=username, password=password)

    if user is not None:
        login(request, user)
        logger.info("authentication complete!")
        logger.info("generating JWT")
        token = generate_JWT(user)

        response = JsonResponse({'success': True, 'msg': 'Login successful','JWT': token}, status=200)

        logger.info("adding JWT to httpOnly cookie")
        response.set_cookie('auth_token', token, httponly=True, path='/ws/', samesite='Lax', secure=True)
        return response
    else: 
        logger.info("login failed")
        return JsonResponse({'success': False, 'error': 'Invalid credentials'}, status=401)


@require_http_method(['POST'])
@require_authentication
def user_logout(request):
    '''
    Logs the user out
    '''
    logger.debug("logging out")
    try:
        logout(request)
        success = True
        status = 200
    except Exception as e:
        # should never end up here
        logger.debug(f"Error logging out, error: {e}")
        success = False
        status = 500

    return JsonResponse({'success': success}, status=status)


#|======================================================================================|
#| user views                                                                           |
#| views for user logic/status                                                          |
#|======================================================================================|

@require_http_method(['GET'])
@require_authentication
def get_username(request):
    '''
    Gets the username of the client
    returns:
    @username : string
    '''

    user = request.user

    return JsonResponse({'success': True, 'username': user.username}, status=200)


@require_http_method(['GET'])
def get_status(request): # RENAME!
    '''
    Returns relevant user data:
    @loggedIn : boolean
    @username : string
    @inAGame : boolean
    '''

    user = request.user

    if user.is_authenticated:
        
        username = user.username

        if Participant.objects.filter(user=user).exists():
            in_a_game = True
        else:
            in_a_game = False

        return JsonResponse({'success': True, 'loggedIn': True, 'username': username, 'inAGame': in_a_game}, status=200)
    else:
        return JsonResponse({'success': False, 'msg': 'not logged in'}, status=204)
        


@require_http_method(['POST'])
def create_user(request):
    # Creates a new user
    try:
        data = json.loads(request.body)


        first_name = data.get('first_name')
        last_name = data.get('last_name')
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')



        # Check if the username or email is already in use
        existing_user = User.objects.filter(username=username).exists()
        existing_email = User.objects.filter(email=email).exists()

        if existing_user and existing_email:
            return JsonResponse({'success': False, 'error': 'Both username and email are already in use'}, status=409)
        elif existing_user:
            return JsonResponse({'success': False, 'error': f'Username "{username}" is already in use'}, status=409)
        elif existing_email:
            return JsonResponse({'success': False, 'error': f'Email "{email}" is already in use'}, status=409)
        new_user = User(first_name=first_name, last_name=last_name, username=username, email=email, password=password)
        # Set the password
        new_user.set_password(password)

        new_user.full_clean()  # Validate the information
        new_user.save()

        return JsonResponse({'success': True, 'message': 'User created successfully', 'user_id': new_user.id}, status=201)

    except json.JSONDecodeError as e:
        # JSON data could not be parsed
        logger.error(f"An error occurred, failed to decode json, error: {e}")
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except ValidationError as e:
        # Invalid data
        logger.error(f"An error occurred, invalid data, error {e}")
        return JsonResponse({'error': str(e)}, status=400)
    except Exception as e:
        # Any other errors
        logger.error(f"An error occurred, error: {e}")
        return JsonResponse({'error': 'An error occurred'}, status=500)


#|======================================================================================|
#| game views                                                                           |
#| views for game logic                                                                 |
#|======================================================================================|

@require_http_method(['POST'])
@require_authentication
def create_game(request):
    '''
    Creates a game in the database and adds the user as a participant
    returns:
    @success : boolean
    '''
    user = request.user

    data = json.loads(request.body)

    gameId = data.get('gameid')
    type = data.get('id')
    title = data.get('title')
    description = data.get('description')

    if not (gameId and type and title and description):
        return JsonResponse({'success': False, 'error': 'missing fields'}, status=400)
    if Game.objects.filter(game_id=gameId).exists():
        return JsonResponse({'success': False, 'error': 'game id already in use'}, status=409)


    potential_participant = Participant.objects.filter(user=user).exists()
    
    # check if player is already in a game
    # REVISE THIS, WE NEED TO FIGURE OUT WHAT WE WANT TO DO IF A PLAYER IS ALREADY IN A GAME AND THEY MAKE THIS REQUEST
    if potential_participant:
        potential_participant = Participant.objects.get(user=user)
        game_id = potential_participant.game.game_id
        return JsonResponse({'success': False, 'error': 'already in a game', 'gameId': game_id}, status=409)

    # create game in the database
    new_game = Game(game_id = gameId,
                    type=type,
                    title=title,
                    description=description, 
                    admin=user,
                    num_players=1,
                    start_time=dt.date(dt.now()), # CHANGE TO DJANGO TIME
                    game_started=False)
    # save the game record
    new_game.save()
    
    # Create a participant in the created game(admin)
    player = Participant(game = new_game,
                            user = user,
                            score = 0)
    
    # save the player record
    player.save()
    logger.info("game created and player added")

    return JsonResponse({'success': True, 'gameId': new_game.game_id}, status=201)


@require_http_method(['GET'])
@require_authentication
def get_game(request):
    '''
    Used when checking if a player is in game
    Returns 
    @gameId : string
    @isAdmin : boolean
    '''
    user = request.user

    # Checks if player is currently in a game
    potential_participant = Participant.objects.filter(user=user).exists()
    if potential_participant:
        # Query the participant record for the player
        part = Participant.objects.get(user=user)
    
        # Check if there is an active task
        active_task = PickedTasks.objects.filter(game=part.game, done=False).first()

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

        response = {
            'success': True,
            'gameId': part.game.game_id,
            'isAdmin': is_admin,
            'username': user.username,
            'gameStarted': part.game.game_started,
            'isSpinning': part.game.wheel_spinning,
            'activeTask': task_data
        }

        return JsonResponse(response, status=200)
    else:
        # Player is not in a game
        return JsonResponse({'success': False, 'msg': 'not in a game'}, status=404)


@require_http_method(['POST'])
@require_authentication
def join_game(request):
    '''
    Adds the user to the game with the given game id
    '''

    user = request.user

    data = json.loads(request.body)

    gameId = data.get('gameid').lower()

    score = 0

    # should return a unique game
    try:
        game = Game.objects.get(game_id = gameId)
        game.num_players += 1
        game.save()
    except Game.DoesNotExist as e:
        logger.warning(f"game not found, error {e}")
    except Game.DoesNotExist as e:
        logger.warning(f"game not found, error {e}")
        return JsonResponse({'success': False, 'msg': 'invalid game code'}, status=404)
    
    # check if the user has already joined
    try: 
        parthist = ParticipantHistory.objects.get(user=user, game_id=gameId)
        score = parthist.score
    except ParticipantHistory.DoesNotExist as e: # user has not played before, nothing to do
        pass
    
    player = Participant(game = game,
                            user = user,
                            score = score)
    
    player.save()

    return JsonResponse({'success': True, 'msg': 'joined game'}, status=200)
        

@require_http_method(['PUT'])
@require_authentication
def leave_game(request):
    '''
    Leaves the game the user is currently in
    returns:
    @success : boolean
    '''
    user = request.user

    # attempt to retrieve the player
    try:
        player = Participant.objects.get(user=user)
    except Participant.DoesNotExist:
        logger.warning("player not found")
        return JsonResponse({'success': False, 'msg': 'not in a game'}, status=404)
    
    # attempt to retrieve the game
    # !!!!!!
    # Game is part of the player object, change this later to be more explicit
    # !!!!!!
    try:
        game = Game.objects.get(game_id=player.game.game_id)

        # check if exisiting participant history exists
        exists = ParticipantHistory.objects.filter(user=player.user, game_id=player.game.game_id).exists()

        if exists:
            logger.debug("player already left before, updating score")
            # get the record and update the score
            participantHist = ParticipantHistory.objects.get(user=player.user, game_id=player.game.game_id)
            participantHist.score = player.score
        else:
            logger.debug("player has not left before, creating record")
            # create a new record
            participantHist = ParticipantHistory(user=player.user, game_id=player.game.game_id, score=player.score)

        participantHist.save()    
        participantHist.save()    

        player.delete()
        logger.info("player deleted from participants")
        logger.info("player deleted from participants")
        game.num_players -= 1
        game.save()


    except Game.DoesNotExist:
        logger.warning("game not found")
        return JsonResponse({'success': False, 'msg': 'game not found'}, status=404)
    except Exception as e:
        logger.warning(f"error leaving game, error: {e}")
        return JsonResponse({'success': False, 'msg': 'error leaving game'}, status=500)

    return JsonResponse({'success': True}, status=200)


@require_http_method(['DELETE'])
@require_authentication
def delete_game(request):
    logger.debug('delete game')

    user = request.user

    potential_participant = Participant.objects.filter(user=user).exists()
    # potential_participant = Participant.objects.get(user=user)
    if potential_participant:
        logger.debug("in a game, checking if admin")
        part = Participant.objects.get(user=user)

        admin = part.game.admin
        logger.debug(f'is this a player ID?: {admin}')

        if user.id == admin.id:
            logger.debug("player is an admin, deleting game")
            game_id = part.game.game_id
            success, status = clean_up_game(game_id=game_id)
            if success:
                status = 200
            else:
                status = 500

            return JsonResponse({'success': success}, status=status)
        else:
            return JsonResponse({'success': False, 'msg': 'user is not admin of game'}, status=403)
    else:
        logger.debug("not in a game, fail")
        return JsonResponse({'success': False}, status=404)
    

def clean_up_game(game_id):

    try:
        game = Game.objects.get(game_id=game_id)
        participants = Participant.objects.filter(game=game)

        gameWinner = None
        for participant in participants:
            participantHist = ParticipantHistory(user=participant.user, game_id=participant.game.game_id, score=participant.score)
            participantHist.save()
            if gameWinner is None or participant.score > gameWinner.score:
                gameWinner = participant

        game_history = GameHistory(game_id=game.game_id, 
                                title=game.title, 
                                start_time=game.start_time)
        game_history.save()
    except Exception as e:
        logger.error(f"error saving game history, error: {e}")
        return False, 500

    try:
        games_to_delete = Game.objects.filter(game_id=game_id)
        logger.debug("retrieved game to delete")
    except:
        logger.debug("failed to retrieve game and participant")
        return False, 500

    try:
        games_to_delete.delete()
        logger.debug("deleted game and participants")
        return True, 200
    except:
        logger.debug("failed to delete game and players")
        return False


@require_http_method(['GET'])
@require_authentication
def current_task(request):
    '''
    Returns the current task of the game the player is currently in
    returns:
    @taskId : string
    @description : string
    @points : int
    @pickedPlayer : string
    '''
    user = request.user
    logger.info(f"{user.username} is getting current task")

    try:
        part = Participant.objects.get(user=user)
        game = part.game
    except Participant.DoesNotExist:
        logger.warning("player not in a game")
        return JsonResponse({'success': False, 'msg': 'not in a game'}, status=404)

    currTask = PickedTasks.objects.filter(game=game, done=False).first()
    
    if currTask:
        logger.info("returning current task")
        return JsonResponse({'success': True, 'taskId': currTask.task.task_id, 'description': currTask.task.description, 'points': currTask.task.points, 'pickedPlayer': currTask.user.username}, status=200)
    
    logger.info("no current task")
    return JsonResponse({'success': False, 'msg': 'no current task'}, status=404)

@require_http_method(['GET'])
@require_authentication
def get_game_participants(request):
    '''
    Gets all participants in the game the user is currently in
    returns:
    @participants : list
    '''

    user = request.user
    logger.info(f'{user.username} is getting participants table current game')

    try:
        logger.debug("getting user record in participant table")
        current_user_participant = Participant.objects.get(user=user)
    except Participant.DoesNotExist:
        logger.warning(f"{user.username} is not in a game")
        return JsonResponse({'success': False, 'msg': 'not in a game'}, status=404)
    # logger.debug("getting game in users participant table")
    current_game = current_user_participant.game

    # logger.debug("getting array of players in same game")
    participants_in_same_game = Participant.objects.filter(game=current_game)

    # logger.debug("sending back data")
    participant_data = [{'username': p.user.username, 'score': p.score} 
                        for p in participants_in_same_game]
    
    logger.info(f"returning participants: {participant_data}")
    return JsonResponse({'success': True, 'participants': participant_data}, status=200)

@require_http_method(['GET'])
@require_authentication
def get_image_urls(request):
    '''
    Gets the profile picture of all users in the game
    returns:
    @uris : list
    '''
    user = request.user

    logger.info(f'{user.username} is fetching game profile pictures')

    user_id_list = get_user_ids_from_usernames(user)

    username_list = get_usernames_in_game(user)

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

    uri_dict = {}
    for i in range(len(user_files_urls)):
        uri_dict[username_list[i]] = user_files_urls[i]

    logger.info(f'returning uris: {uri_dict}')

    return JsonResponse({"success": True, 'uris': uri_dict}, status=200)


#|======================================================================================|
#| profile views                                                                        |
#| views for user profile                                                               |
#|======================================================================================|


@require_http_method(['GET'])
@require_authentication
def get_profile(request):
    '''
    returns the profile of the user
    returns:
    @user_data : dict
    '''
    logger.info(f"{request.user.username} is fetching profile")

    user = request.user
    user_data = {
        'first_name': user.first_name,
        'last_name': user.last_name,
        'username': user.username,
        'email': user.email,
    }

    gamesPlayed = ParticipantHistory.objects.filter(user=user)
    gameHist = GameHistory.objects.filter(game_id__in=gamesPlayed.values_list('game_id', flat=True))

    gameList = []
    for game in gameHist:
        gameDict = {
            'game_id': game.game_id,
            'title': game.title,
            'start_time': game.start_time,
        }
        gameList.append(gameDict)

    return JsonResponse({'success': True, 'user_data': user_data, 'game_history': gameList}, status=200)


@require_http_method(['POST'])
@require_authentication
def game_details(request):

    data = json.loads(request.body)
    
    game_id = data.get('game_id')

    
    game = GameHistory.objects.get(game_id=game_id)
    gameDetails = {
        'title': game.title,
    }

    tasks = PickedTasksHistory.objects.filter(game_id=game_id)
    tasklist = []
    for task in tasks:
        taskDetails = Tasks.objects.get(task_id=task.task_id)
        tasklist.append({
            'description': taskDetails.description,
            'points': taskDetails.points,
            'pickedPlayer': task.username,
            'win': task.win,
            'time': task.time,
        })

    participants = ParticipantHistory.objects.filter(game_id=game_id)
    scoreboard = []
    for participant in participants:
        scoreboard.append({
            'username': participant.user.username,
            'score': participant.score,
        })


    return JsonResponse({'game_details': gameDetails, 'tasks': tasklist, 'scoreboard': scoreboard, 'success': True}, status=200)


@require_http_method(['POST'])
@require_authentication
def update_profile(request):
    '''
    Updates the profile of the user
    '''
    print("updating profile")

    user = request.user

    data = json.loads(request.body)

    field = data.get('field')
    print(f'field: {field}')
    new_value = data.get('value')
    logger.debug(f'field: {new_value}')

    if field not in ['first_name', 'last_name', 'username']:
        logger.error("invalid field")
        return JsonResponse({'success': False, 'error': 'Invalid field'}, status=405)
    
    # set attributes of the user
    setattr(user, field, new_value)

    # save it to the database
    user.save()
    return JsonResponse({'success': True, 'msg': 'Profile updated successfully'}, status=200)


@require_http_method(['GET'])
@require_authentication
def get_image_urls(request):
    '''
    Gets the profile picture of all users in the game
    returns:
    @uris : list
    '''
    print("get_all_images_participants")
    user = request.user

    user_id_list = get_user_ids_from_usernames(user)

    username_list = get_usernames_in_game(user)

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

    uri_dict = {}
    for i in range(len(user_files_urls)):
        uri_dict[username_list[i]] = user_files_urls[i]

    logger.info(f'returning uris: {uri_dict}')
    print(f'\n\n\n\n\nreturning uris: {uri_dict}\n\n\n\n\n')

    return JsonResponse({"success": True, 'uris': uri_dict}, status=200)


@require_http_method(['GET'])
@require_authentication
def get_image_base64(request):
    '''
    Returns the profile picture of the user as a base64 encoded string
    returns:
    @image : string
    '''

    user = request.user
    logger.info(f"{user.username} is fetching his profile picture")
    try:
        logger.debug("getting profile picture")
        path = user.profile_pic.path
        logger.debug(f'path to profile_pic: {path}')
        with open(path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
        logger.debug("sending image as base64 string")
        return JsonResponse({'success': True, 'image': encoded_string}, status=200)
    except IOError:
        logger.error("Could not locate file")
        return JsonResponse({'success': False, 'error': 'Image not found'}, status=404)


@require_http_method(['GET'])
@require_authentication
def get_all_images(request):
    '''
    Returns all images in the belonging to the user as a list of URLs
    '''
    user = request.user
    logger.info(f"{user.username} is fetching all profile pictures")
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
    
    if user_pics == []:
        logger.debug("no images found")
        return JsonResponse({'success': False, 'error': 'No images found'}, status=404)

    # Create full URLs for each file, so that they are reachable from the frontend
    user_files_urls = [
        f"{protocol}://{current_site.domain}{default_storage.url(os.path.join('custom/', file))}"
        for file in user_pics
    ]

    logger.info(f'returning sending urls: {user_files_urls}')
    return JsonResponse({'success': True, 'files': user_files_urls}, status=200)
    

@require_http_method(['PUT'])
@require_authentication
def select_image(request):
    '''
    Updates the current profile picture of the user based on the image path provided
    '''
    
    user = request.user
    logger.info(f"{user.username} is updating profile picture")
    data = json.loads(request.body)
    new_profile_pic_url = data.get('newProfilePicUrl')

    # check if an image URL was provided
    if not new_profile_pic_url:
        logger.error("no image URL provided")
        return JsonResponse({'success': False, 'error': 'No image URL provided'}, status=400)
    
    # create a relative path
    relative_path = '/'.join(new_profile_pic_url.split('/media/')[-1].split('/'))
    logger.debug(f'new profile pic url {relative_path}')

    
    # Use regex to check that the image path contains the user_id
    pattern = r'custom/' + str(user.id) + r'[\._]'
    logger.debug(f"patter = {pattern}")
    if not re.match(pattern, relative_path):
        logger.error("Invalid image URL provided")
        return JsonResponse({'success': False, 'error': 'Invalid image URL provided'}, status=403)

    # Dont update profile pic if it is the same as the current selected one
    if user.profile_pic == relative_path:
        logger.debug("same as current profile picture")
        return JsonResponse({'success': False, 'error': 'Selected image is already the profile picture'}, status=403)
    
    # Check if the file exists
    if not default_storage.exists(relative_path):
        logger.error("Image file does not exist")
        return JsonResponse({'success': False, 'error': 'Image file does not exist'}, status=400)

    try: 
        user.profile_pic = relative_path
        user.save()
    except Exception as e:
        logger.debug("error updating profile picture")
        return JsonResponse({'success': False, 'error': 'Could not change profile picture'}, status=500)
    
    logger.info("profile picture successfully updated")
    return JsonResponse({'success': True, 'msg': 'Selected new image'}, status=200)
    

@require_http_method(['DELETE'])
@require_authentication
def delete_image(request):
    '''
    Delets the image specified in the request
    '''
    
    logger.info(f'{request.user.username} is deleting a profile picture')

    # get the image path
    data = json.loads(request.body)
    delete_profile_pic_url = data.get('imagePath')

    logger.debug(f"deleting pic url: {delete_profile_pic_url}")

    # Check if an image URL was provided
    if not delete_profile_pic_url:
        logger.error("no image URL provided")
        return JsonResponse({'success': False, 'error': 'No image URL provided'}, status=400)
    
    if "presets" in delete_profile_pic_url:
        logger.debug("cannot delete preset images")
        return JsonResponse({'success': False, 'error': 'Cannot delete preset image'}, status=403)
    
    # create a relative path
    relative_path = '/'.join(delete_profile_pic_url.split('/media/')[-1].split('/'))
    logger.debug(f'deleting pic url {relative_path}')

    # Use regex to check that the image path contains the user_id
    pattern = r'custom/' + str(request.user.id) + r'[\._]'
    logger.debug(f"patter = {pattern}")
    if not re.match(pattern, relative_path):
        logger.error("Invalid image URL provided")
        return JsonResponse({'success': False, 'error': 'Invalid image URL provided'}, status=403)

    # check if attempting to delete current profile pic
    if relative_path == request.user.profile_pic:
        logger.debug("giving client default preset photo")
        request.user.profile_pic = 'presets/preset_1.png'
        request.user.save()
        deleted_current = True
    else:
        deleted_current = False
    
    # attempt to delete the image
    if delete_media_file(relative_path):
        logger.info("profile picture deleted")
        return JsonResponse({'success': True, 'msg': 'Profile picture deleted', 'deletedCurrent': deleted_current}, status=200)
    else:
        # should never run, default_storage.delete doesn't raise exceptions
        logger.error("failed to deleted photo")
        return JsonResponse({'success': False, 'error': 'Given picture does not exist'}, status=404)


'''
Updates the users profile picture
Recieves a DataForm form
'''
@require_http_method(['POST'])
@require_authentication
def upload_image(request):
    '''
    Uploads and updates the profile picture 
    of the user based on the image provided.
    '''

    user = request.user
    logger.info(f"{user.username} is uploading new profile picture")

    profile_picture = request.FILES.get('profileImage')

    if profile_picture:
        logger.debug("picture is valid")
        logger.debug(profile_picture)

        # extract the file extension
        extension = profile_picture.name.split('.')[-1].lower()
        if extension not in ['png', 'jpg', 'jpeg']:
            logger.warning("unsupported file format")
            return JsonResponse({'success': False, 'error': 'Unsupported file format, must be png, jpg, or jpeg'}, status=400)
        
        # Save new image
        try:
            user.profile_pic.save(f"{user.id}.{extension}", profile_picture)
            user.save()
            logger.info("New profile picture stored")
            return JsonResponse({'success': True, 'msg': 'Updated image successfully', 'path': user.profile_pic.path}, status=201)
        except Exception as e:
            # we should not get here with current implementation
            logger.info(f"could not save picture. error: {e}")
            return JsonResponse({'success': False}, status=500)
    else:
        logger.info("no image provided")
        return JsonResponse({'success': False, 'error': 'No image file provided'}, status=400)


def delete_media_file(file_path):
    """Deletes a file from the media storage."""
    if default_storage.exists(file_path):
        default_storage.delete(file_path)
        return True
    else:
        return False


def get_usernames_in_game(user):
    '''
    returns a list of usernames based on the game the user is in
    '''
    try:
        logger.debug("getting user record in participant table")
        current_user_participant = Participant.objects.get(user=user)
        logger.debug("getting game in users participant table")
        current_game = current_user_participant.game

        logger.debug("getting array of players in same game")
        participants_in_same_game = Participant.objects.filter(game=current_game)

        usernames = []
        for part in participants_in_same_game:
            usernames.append(part.user.username)

        # Extract relevant data to send back (e.g., usernames, scores)
        logger.debug("sending back data")
        return usernames
    except:
        logger.error("error getting usernames from game")


def get_user_ids_from_usernames(user):
    '''
    returns a list of user ids based on a list of usernames
    '''
    try:
        logger.debug("getting user record in participant table")
        current_user_participant = Participant.objects.get(user=user)
        logger.debug("getting game in users participant table")
        current_game = current_user_participant.game

        logger.debug("getting array of players in same game")
        participants_in_same_game = Participant.objects.filter(game=current_game)

        user_ids = []
        for part in participants_in_same_game:
            user_ids.append(part.user.id)

        # Extract relevant data to send back (e.g., usernames, scores)
        logger.debug("sending back data")
        return user_ids
    except:
        logger.error("error getting user ids from game")


def get_profile_picture_on_users(user_id_list):
    '''
    returns a list of profile picture urls based on user_id_list
    '''

    url_list = []
    for id in user_id_list:

        # retrieve user record
        user = User.objects.get(id=id)
        
        # append profile pic to the list
        url_list.append(user.profile_pic.path)

    return url_list