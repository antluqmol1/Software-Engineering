from django.http import Http404, JsonResponse

def hello_world(request):
    return JsonResponse({'message': 'Hello World'})

def home_page(request):
    return JsonResponse({'message': 'Hello World'})
