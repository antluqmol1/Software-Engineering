from django.http import Http404, JsonResponse

def hello_world(request):
    return JsonResponse({'message': 'Hello World'})

def home_page(request):
    return JsonResponse({'message': 'Hello World'})

def putuser(request):
    # do something here to communicate with DATABASE
    # return json respons, 200 if OK, f.ex 400 if illegal request.
    pass