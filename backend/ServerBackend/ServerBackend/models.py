from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


# Custom manager for the User model
class UserManager(BaseUserManager):

    # Create a regular user
    def create_user(self, username, email, password=None, **extra_fields):

        # Ensure the email field is provided
        if not email:
            raise ValueError('The Email field must be set')
        
        # Normalize the email address
        email = self.normalize_email(email)

        # Create a new user instance with the provided fields
        user = self.model(username=username, email=email, **extra_fields)

        # Set the user's password
        user.set_password(password)

        # Save the user instance to the database and return
        user.save(using=self._db)
        return user

    # Create a superuser with additional permissions
    def create_superuser(self, username, email, password=None, **extra_fields):

        # Set default values for is_staff and is_superuser
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        # Create a superuser using the create_user method        
        return self.create_user(username, email, password, **extra_fields)


# Custom User model extending AbstractBaseUser and PermissionsMixin
class User(AbstractBaseUser, PermissionsMixin):

    # Fields for the User model
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    username = models.CharField(max_length=40, unique=True)
    email = models.EmailField(max_length=320, unique=True)
    
    # Additional fields for user roles and permissions
    is_superuser = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)

    # Groups to which the user belongs
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.',
        related_name="custom_user_set",
        related_query_name="user",
    )

    # Specific permissions granted to the user
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name="custom_user_set",
        related_query_name="user",
    )

    # Custom manager for the User model
    objects = UserManager()

    # Define the username field
    USERNAME_FIELD = 'username'

    # Specify additional required fields
    REQUIRED_FIELDS = ['first_name', 'last_name', 'email']

    def __str__(self):
        return self.username


'''
Define tasks or challenges that participants need to complete during the game.
'''
class Tasks(models.Model):

    task_id = models.IntegerField(primary_key=True, default=None)

    # Description of the task/challenge
    description = models.TextField()

    # Points awarded for completing the task
    points = models.IntegerField()

    # Type of task, corresponds to type in game and
    type = models.IntegerField(default=None)

    # Whether or not a task is individual
    individual = models.BooleanField(default=False)


'''
Store information about each game, including the start time, end time, and the admin/user who initiated the game.
'''
class Game(models.Model):

    # Primary key, which is the game key
    game_id = models.CharField(max_length=255, null=False, default=None, primary_key=True)

    # # Title of the game
    title = models.CharField(max_length=255)

    # Type of game, or the "title" in the front end
    type = models.CharField(max_length=255, default=0)
    
    # # Description providing additional details about the game
    description = models.TextField()
    
    # Admin/user who initiated the game; a ForeignKey links to the User model
    admin = models.ForeignKey(User, on_delete=models.CASCADE)

    # Number of players in the game
    num_players = models.IntegerField(default=0)

    # Active task in the game; a ForeignKey links to the Tasks model
    # active_task = models.ForeignKey(Tasks, on_delete=models.CASCADE, null=True, blank=True)
    
    # Start time of the game
    start_time = models.DateTimeField()
  
    # End time of the game; nullable and blank to handle ongoing games
    end_time = models.DateTimeField(null=True, blank=True)

    # boolen to check if game is started.
    game_started = models.BooleanField(default=False)

class PickedTasks(models.Model):
    
    task = models.ForeignKey(Tasks, on_delete=models.CASCADE)

    game = models.ForeignKey(Game, on_delete=models.CASCADE)

    user = models.ForeignKey(User, on_delete=models.DO_NOTHING)

    done = models.BooleanField(default=False)

    # this ensures that the combination of task and game must be unique
    class meta:
        unique_together = ('task', 'game', 'user')


'''
Keep track of users participating in a game, including their scores.
'''
class Participant(models.Model):
    # User participating in the game; ForeignKey links to the User model
    user = models.ForeignKey(User, on_delete=models.CASCADE, primary_key=True)
    
    # Game in which the user is participating; ForeignKey links to the Game model
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    
    # Score achieved by the participant; default is set to 0
    score = models.IntegerField(default=0)
    # her har jørgen adda is_game

    # Boolean indicating whether the user has been picked once during a round
    isPicked = models.BooleanField(default=False)


# '''
# Store user responses to challenges/tasks within a game.
# '''
class Response(models.Model):

    # User who submitted the response; ForeignKey links to the User model
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    # Task to which the response is associated; ForeignKey links to the Task model
    task = models.ForeignKey(Tasks, on_delete=models.CASCADE)

    # not sure if we should have a pointer to a game here, the pointer to the game
    # can be extracted from Participant via User, but the game will be deleted when over
    # We need to think about what happens when we move a game from Game to a future 
    # ArchivedGame perhaps
    game = models.ForeignKey(Game, on_delete=models.DO_NOTHING)
    
    # Textual content of the user's response
    # vote = models.TextField()
    
    # Marks the vote as yes or no (true or false)
    vote = models.BooleanField(default=False)
    
    # this ensures that the combination of task and game must be unique
    class meta:
        unique_together = ('user', 'task')




'''
Store the overall leaderboard for a game, ranking participants based on their scores.
'''
# class Leaderboard(models.Model):
#     # Game for which the leaderboard is created; OneToOneField ensures a one-to-one relationship
#     game_id = models.OneToOneField(Game, on_delete=models.CASCADE, primary_key=True)
    
#     # Participants included in the leaderboard; ManyToManyField links to the Participant model
#     participants = models.ManyToManyField(Participant, related_name='leaderboard_entries')
