import json
from .models import User
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