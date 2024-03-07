import json
from .models import User
from django.core.exceptions import ValidationError
from django.http import Http404, JsonResponse
from django.shortcuts import redirect, render
from django.http import HttpResponse, HttpResponseRedirect
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login


@csrf_exempt
def hello_world(request):
    return JsonResponse({'message': 'Hello World'})



@csrf_exempt
def home_page(request):
    return JsonResponse({'message': 'Hello World'})


# not used, going with @csrf_exempt instead
@csrf_exempt
def grab_token(request):
    # Ensure a CSRF token is set in the user's session
    csrf_token = get_token(request)
    print("returning token: ", csrf_token)
    # Return the token in a JSON response
    return JsonResponse({'csrfToken': csrf_token})


@csrf_exempt
def get_profile(request):
    
    print(request.method)

    data = json.load(request.body)
    header = json.load(request.header)

    print(header)
    print(data)

    return


@csrf_exempt
def user_login(request):
    print("inside user_login")
    if request.method == 'POST':

        print("method is a post")
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



@csrf_exempt
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