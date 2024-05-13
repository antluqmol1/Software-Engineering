from django.urls import path
from . import views

urlpatterns = [
    path('grabtoken/', views.grab_token, name='grab_token'),
    path('login/', views.user_login, name='user_login'),
    path('logout/', views.user_logout, name='user_logout'),
    path('get-status/', views.get_status, name='get_login_status'),
]