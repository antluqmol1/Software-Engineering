from django.urls import re_path
from . import consumers

# websocket url patterns, we only need one for the game lobby
websocket_urlpatterns = [
    re_path(r'^ws/gamelobby/$', consumers.GameLobby.as_asgi()), # game lobby url patter
]
