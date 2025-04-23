from channels.routing import ProtocolTypeRouter, URLRouter
from django.urls import path
from .ibkr.consumers import OptionsDataConsumer
from channels.auth import AuthMiddlewareStack

websocket_urlpatterns = [
    path('ws/options-stream/', OptionsDataConsumer.as_asgi()),
]

application = ProtocolTypeRouter({
    'websocket': AuthMiddlewareStack(
        URLRouter(
            websocket_urlpatterns
        )
    ),
})
