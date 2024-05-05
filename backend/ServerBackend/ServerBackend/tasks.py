# ServerBackend/tasks.py
from celery import shared_task
from .models import Game
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

@shared_task
def end_wheel_spin(game_id):
    print("setting wheel_spinning to false")
    Game.objects.filter(game_id=game_id, wheel_spinning=True).update(wheel_spinning=False)

    # Notify via WebSocket
    channel_layer = get_channel_layer()
    group_name = f'game_{game_id}'
    print(f"Sending message to group: {group_name}")
    print(f"channel layer: {channel_layer}")
    async_to_sync(channel_layer.group_send)(
        group_name, 
        {
            'type': 'wheel_stop_message',  # Method in your consumer
            'message': {
                'wheel_spinning': False  # Additional data can be included if needed
            },
            'msg_type': 'wheel_stopped'  # Indicates what the message is about
        }
    )
