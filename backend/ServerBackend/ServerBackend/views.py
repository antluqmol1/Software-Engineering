import json
import datetime
from .models import User, Game, Participant
from django.core.exceptions import ValidationError
from django.http import Http404, JsonResponse
from django.shortcuts import redirect, render
from django.http import HttpResponse, HttpResponseRedirect
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout


@csrf_exempt
def hello_world(request):
    return JsonResponse({'message': 'Welcome to boozechase'})



@csrf_exempt
def home_page(request):
    return JsonResponse({'message': 'Welcome to boozechase'})

def join_game(request):
    print("joining game")

    if request.method == "GET":
        print("valid method")
        user = request.user

        data = json.loads(request.body)

        gameId = data.get('gameid')
        print(f'attempting to join game {gameId}')

        if user.is_authenticated:

            # should return a unique game
            game = Game.objects.get(game_id = gameId)
            
            if not game:
                print("game not found")
                return JsonResponse({'success': False, 'msg': 'invalid game code'})
            
            print("joining game")
            player = Participant(game = game,
                                 user = user,
                                 score = 0)
            
            player.save()

            return JsonResponse({'success': True, 'msg': 'joined game'})
            
        else:
            print("user not authenticated")
            return JsonResponse({'success': False, 'msg': 'not logged in/authenticated'})


def create_game(request):
    print("creating game")

    if request.method == "POST":
        print("valid method")
        user = request.user

        data = json.loads(request.body)

        gameId = data.get('gameid')
        type = data.get('id')
        title = data.get('title')
        description = data.get('description')
        print(gameId)

        # print(f'user data: {user.data}')

        if user.is_authenticated:
            print("creating game")

            # Check if user is already in a game
            print("checking if player is already in game")
            #this is not the right way to do it, leads to traceback error on backend
            potential_participant = Participant.objects.filter(user=user).exists()
            # potential_participant = Participant.objects.get(user=user)
            if potential_participant:
                print("in a game, deleting user")
                potential_participant = Participant.objects.filter(user=user)
                #print for clarity
                print(potential_participant.values())
                Participant.objects.filter(user=user).delete()
                return JsonResponse({'success': False})
            else:
                print("not in a game")
            # potential_game = potential_participant.game_id


            # create game in the database
            new_game = Game(game_id = gameId,
                            title=title,
                            type=type,
                            description=description, 
                            admin=user,
                            start_time=datetime.datetime.now(), 
                            end_time=None)
            
            new_game.save()
            
            # Create a participant in the created game(admin)
            player = Participant(game = new_game,
                                 user = user,
                                 score = 0)
            
            player.save()

            return JsonResponse({'success': True})
        else:
            return JsonResponse({'success': False})
        
def get_game(request):
    print("get game")
    


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


# not used, going with @csrf_exempt instead

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
        logout(request)
        return JsonResponse({'success': True})


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



def user_login(request):
    print("inside user_login")
    if request.method == 'POST':

        print("method is POST")
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
            # Return a JSON response or redirect as per your application's flow
            return JsonResponse({'status': 'success'})
        else:
            print("not valid")
            return JsonResponse({'error': 'Invalid credentials'}, status=401)

    return JsonResponse({'error': 'Only POST method allowed'}, status=405)

    # maybe we should go for this instead?
    # # If not a POST request, show the login form (or handle accordingly)
    # return HttpResponse("Login page")


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