# Getting started

1. Do git clone of this repository in some directory of our local host
2. Do cd to the directory Team4, here We will see the necessary files for running the app
3. This was developed on linux (ubuntu 22.04), and will work using this guide. 

# Installs 
1. Make sure you have python installed, preferably python 3.10.12 or above, might work with other versions
2. `sudo apt install python3-venv`
3. `sudo apt install python3-dev`
4. `sudo apt install redis-server`
5. `sudo apt install celery`
6. `sudo apt install npm`

## For mac
redis-server must be installed via homebrew

## For windows
in Windows we can install npm from via this link `https://nodejs.org/en`, if apt install does not work

# Setup
## backend
1. Do cd into the **backend** folder, here we are going to setup a python virtual environment, **venv** where we are going to keep the necessary dependencies. In **backend** run: `python3 -m venv [your venv name]` or `python -m venv [your venv name]`, You can place it where you'd like, but we recommend placing it in the **backend/** or **backend/ServerBackend/** folder.
2. Activate the venv using `source [your venv name]/bin/acivate` (Linux) or `source [your venv name]/Scripts/acivate` (Windows)
3. you should see `(venv)` or the name of your venv on the left side of the console in most cases
4. From within the venv and the **backend** folder, install the requirements using pip install -r requirements.txt. If you're using python 3.10.12 all pip installs should be successful
5. all backend dependencies should now be installed in your venv folder.
## frontend
1. Navigate to the **frontend/src/** folder. Run `npm install` 

# Running backend and frontend

## backend

### Django
1. Make sure you're are using virtual enironment, if not run the command from the previous steps.
2. cd into into `backend/ServerBackend/` folder, where we will find manage.py.
3. Setup database migrations by running the command: `python3 manage.py makemigrations`, or `python manage.py makemigrations` based on our current version of python
4. Make the database migrations by running the command: `python3 manage.py migrate`, or `python manage.py migrate` based on our current version of python
5. Populate the tasks (games challenges): `python3 manage.py populate_tasks`, or `python manage.py populate_tasks` based on our current version of python
6. Run the backend server using the command: `python3 manage.py runserver`, or `python manage.py runserver` based on our current version of python
7. The server is now running if it says **`Quit the server with CONTROL-C`** at the last line
8. To use the server, the terminal and proccess must remain open

### Celery and redis
1. Open up a new terminal
2. cd into the same directory where we find manage.py, `backend/ServerBackend`
    1. **Only For macOS**: Start the redis server using `brew services start redis` before following the next step
4. Run `python3 -m celery -A ServerBackend worker -l info` to start the celery app


## frontend

**if We have started the backend. We must open a new terminal**

After that We wil do:

1. cd into `frontend/src`
2. run `npm start`
3. a new browser tab should open with the react frontend.

# Git branches

when working on a new feature or specific changes/fixes, We should make our own branch.<br>
The name of the branch should reflect who is working on it, and what it aims to implement

> **Example:**
>
> - Branch Name: `Antonio-reactlogin`<br>
> - here, Antonio is working on a react login functionality.<br>

NB! when making a new branch, make sure We are at the correct branch We want to branch from<br>
if We want to branch from the main branch, make sure We are at main, or move there with `git checkout main`

### how to make and push to new branch

1. make a branch `git branch [our branch name]`
2. checkout the branch `git checkout [our branch name]`
3. make our first commit
4. make first push and set upstream branch at the same time using `git push -u origin [our branch name]`
5. step 4 makes sure that next time We do `git push` We will push to this branch, and not to the previous upstream branch (default is `main`)

### Merge branch back to main/other branches

1. Checkout the branch We want to merge into using f.ex. `git checkout main`.
2. Now do `git merge [our branch]`, where `[our branch]` is the branch with the changes that We want merged with main.

### How to merge to my local project the changes that other made in the main branch

1.  cd to our path of the project, for example: `cd Documents/inf2900/Team4/`
2.  Fetch the latest changes from Github: `git fetch origin`
3.  Pull the changes into our local main branch: `git pull origin main`
    #### -> If conflicts, for example: error: `
        our local changes to the following files would be overwritten by merge:
            frontend/src/App.js, frontend/src/components/FrontPage.js
        Please commit our changes or stash them before We merge. Aborting. Updating 890515c2..1f0fda69`
    We can stash our changes, Stash if We're in the middle of something and not ready to commit. We can always apply our stashed changes after pulling the updates from main.
    We can do that doing, for example: `git add frontend/src/App.js`, `git add frontend/src/components/FrontPage.js` and `git stash push -m "Describe our changes"`
    And afther that We can Pull the Latest changes from main: `git pull origin main`
4.  Once conflicts solved, We can go to our branch, for example: `git checkout antonio-frontend`
5.  And now, merge the changes from main: `git merge main`

# Testing

Coverage - see what code is being tested

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, We can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in our browser.

The page will reload when We make changes.\
We may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
our app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once We `eject`, We can't go back!**

If We aren't satisfied with the build tool and configuration choices, We can `eject` at any time. This command will remove the single build dependency from our project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into our project so We have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so We can tweak them. At this point We're on our own.

We don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and We shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if We couldn't customize it when We are ready for it.

## Learn More

We can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
