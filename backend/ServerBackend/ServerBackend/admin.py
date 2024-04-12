from django.contrib import admin
from .models import User, Game, Tasks, Participant#, Leaderboard, Response

admin.site.register(User)
admin.site.register(Game)
admin.site.register(Tasks)
admin.site.register(Participant)
# admin.site.register(Response)
# admin.site.register(Leaderboard)
