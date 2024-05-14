"""
ASGI config for ServerBackend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
django_asgi_app = get_asgi_application()
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ServerBackend.settings')


from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import ServerBackend.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ServerBackend.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),  # ASGI application for HTTP requests
    "websocket": AuthMiddlewareStack( # websocket authentication middleware
        URLRouter(
            ServerBackend.routing.websocket_urlpatterns  # websocket url pattern
        )
    ),
})
