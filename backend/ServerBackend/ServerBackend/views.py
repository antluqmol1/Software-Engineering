import json
from .models import user, admin
from django.core.exceptions import ValidationError
from django.http import Http404, JsonResponse
from django.middleware.csrf import get_token

def hello_world(request):
    return JsonResponse({'message': 'Hello World'})

def home_page(request):
    return JsonResponse({'message': 'Hello World'})

def grab_token(request):
    # Ensure a CSRF token is set in the user's session
    csrf_token = get_token(request)
    print("returning token: ", csrf_token)
    # Return the token in a JSON response
    return JsonResponse({'csrfToken': csrf_token})

def put_admin(request):
    try:
        data = json.loads(request.body)

        first_name = data.get('first_name')
        last_name = data.get('last_name')
        email = data.get('email')


        # Validate the information
        if not (first_name and last_name and email):
            return JsonResponse({'error': 'Missing fields'}, status=400)

        new_admin = admin(first_name=first_name, last_name=last_name, email=email)
        new_admin.full_clean()  # Validate the information
        new_admin.save()

        return JsonResponse({'message': 'User created successfully', 'user_id': new_admin.id}, status=200)
    
    except json.JSONDecodeError:
        # JSON data could not be parsed
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except ValidationError as e:
        # Invalid data
        return JsonResponse({'error': str(e)}, status=400)
    except Exception as e:
        # Any other errors
        return JsonResponse({'error': 'An error occurred'}, status=500)

def put_user(request):
    # do something here to communicate with DATABASE
    # return json respons, 200 if OK, f.ex 400 if illegal request.
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

        new_user = user(first_name=first_name, last_name=last_name, username=username, email=email, password=password)
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