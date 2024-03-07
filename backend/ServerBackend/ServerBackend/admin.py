from django.contrib import admin
from .models import User, Game, Task, Response, Participant, Leaderboard

admin.site.register(User)
admin.site.register(Game)
admin.site.register(Task)
admin.site.register(Response)
admin.site.register(Participant)
admin.site.register(Leaderboard)
