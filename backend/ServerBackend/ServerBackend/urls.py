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
from django.urls import path, include
from django.conf.urls.static import static
from . import views

urlpatterns = [
    path('admin/', admin.site.urls), # not sure where this leads

    path('auth/', include(([
        path('grabtoken/', views.grab_token, name='grab_token'), # duplicate, fix in fronted
        path('token/', views.grab_token, name='grab_token'), # not sure if we need to group these
        path('login/', views.user_login, name='user_login'),
        path('logout/', views.user_logout, name='user_logout'),
        path('get-status/', views.get_status, name='get_login_status'),
    ], 'auth'))),

    path('user/', include(([
        path('create/', views.create_user, name='put_user'),
        path('create-admin/', views.put_admin, name='put_admin'),
        path('get-username/', views.get_username, name='get_user'),
        path('profile/', include(([
            path('get/', views.get_profile, name='get_profile'),
            path('update/', views.update_profile, name='update-profile'),
            path('get-picture/', views.get_image_base64, name='get_profile_picture'),
            path('upload-picture/', views.upload_image_base64, name='get_profile_picture'),
            path('get-all-pictures/', views.get_all_images_base64, name='get_all_profile_pictures'),
            path('update-picture/', views.select_image, name='update_profile_picture'),
            path('delete-picture/', views.delete_image, name='delete_profile_picture'),
        ], 'profile'))),
    ], 'user'))),
    
    path('game/', include(([
        path('create/', views.create_game, name='create_game'),
        path('delete/', views.delete_game, name='delete-game'),
        path('join/', views.join_game, name='join-game'),
        path('leave/', views.leave_game, name='leave-game'), # websocket handles leaving, redundant
        path('get/', views.get_game, name='get_game'),
        path('get-participants/', views.get_game_participants, name='get_game_participants'),
        path('get-participants-images/', views.get_image_urls, name='get_participants_urls'),
        path('current-task/', views.current_task, name='current-task'),
        path('next-task/', views.next_task, name='next-task'),
        path('give-points/', views.give_points, name='give-points'),
    ], 'game'))),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


