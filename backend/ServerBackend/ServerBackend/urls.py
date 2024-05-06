"""
URL configuration for ServerBackend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.conf import settings
from django.urls import path
from django.conf.urls.static import static
from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('helloworld', views.hello_world, name='hello_world'),
    path('', views.home_page, name='home_page'),
    path('grabtoken/', views.grab_token, name='grab_token'),
    path('token/', views.grab_token, name='grab_token'),
    path('putuser/', views.put_user, name='put_user'),
    path('putadmin/', views.put_admin, name='put_admin'),
    path('profile/', views.get_profile, name='get_profile'),
    path('profile/update-profile/', views.update_profile, name='update-profile'),
    path('login/', views.user_login, name='user_login'),
    path('logout/', views.user_logout, name='user_logout'),
    path('create-game/', views.create_game, name='create_game'),
    path('delete-game/', views.delete_game, name='delete-game'),
    path('get-game-participants/', views.get_game_participants, name='get_game_participants'),
    path('get-game/', views.get_game, name='get_game'),
    path('join-game/', views.join_game, name='join-game'),
    path('leave-game/', views.leave_game, name='leave-game'),
    path('game/next-task/', views.next_task, name='next-task'),
    path('game/give-points/', views.give_points, name='give-points'),
    path('game/current-task/', views.current_task, name='current-task'),
    path('user/get-login-status/', views.get_login_status, name='get_login_status'),
    path('user/get-username/', views.get_username, name='get_user'),
    path('profile/get-profile-picture/', views.get_image_base64, name='get_profile_picture'),
    path('profile/upload-profile-picture/', views.upload_image_base64, name='get_profile_picture'),
    path('profile/get-all-profile-pictures/', views.get_all_images_base64, name='get_all_profile_pictures'),
    path('profile/update-profile-picture/', views.select_image, name='update_profile_picture'),
    path('profile/delete-profile-picture/', views.delete_image, name='delete_profile_picture'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


