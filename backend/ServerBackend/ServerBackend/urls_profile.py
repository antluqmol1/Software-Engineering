from django.urls import path
from . import views

urlpatterns = [
    path('get/', views.get_profile, name='get_profile'),
    path('update/', views.update_profile, name='update_profile'),
    path('get-picture/', views.get_image_base64, name='get_profile_picture'),
    path('upload-picture/', views.upload_image, name='upload_profile_picture'),
    path('get-all-pictures/', views.get_all_images, name='get_all_profile_pictures'),
    path('update-picture/', views.select_image, name='update_profile_picture'),
    path('delete-picture/', views.delete_image, name='delete_profile_picture'),
    path('game-details/', views.game_details, name='fetch_game_details'),
]