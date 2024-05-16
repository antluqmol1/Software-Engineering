from django.urls import path
from . import views

urlpatterns = [
    path('create/', views.create_game, name='create_game'),
    path('delete/', views.delete_game, name='delete_game'),
    path('join/', views.join_game, name='join_game'),
    path('leave/', views.leave_game, name='leave_game'), # websocket handles leaving, could be redundant unless we still want this option
    path('get/', views.get_game, name='get_game'),
    path('get-participants/', views.get_game_participants, name='get_game_participants'),
    path('get-participants-images/', views.get_image_urls, name='get_participants_urls'),
    path('current-task/', views.current_task, name='current_task'),
]