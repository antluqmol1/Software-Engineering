from django.urls import path, include
from . import views

urlpatterns = [
    path('create/', views.create_user, name='put_user'),
    path('get-username/', views.get_username, name='get_user'),
    path('profile/', include(('ServerBackend.urls_profile', 'profile'), namespace='profile')),
]