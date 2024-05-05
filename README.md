# Getting started

1. Do git clone of this repository in some directory of our local host
2. Do cd to the directory Team4, here We will see the necessary files for running the app

# How to run backend and frontend

## backend

1. Do cd into the **_backend_** folder, here We are going to install the python environment **venv** where We are going to keep the necessary dependencies, for that run: `python3 -m venv venv` or ``python -m venv venv`, for that We have to ensure that python or python3 and pip are installed. Now We should see the folder **_venv_**
2. After that, We will activate the virtual enironment running the command: `source venv/bin/activate` if We are using Linux or `source venv/Scripts/activate` if We are using Windows.
3. We should now see `(venv)` to the upper left in our terminal
4. Now is time to install the requirementes, We will see the file requirements.txt inside the folder backend, run the command: `pip install -r requirements.txt`
5. cd from 'backend' into `ServerBackend` using the command `cd ServerBackend`
6. Now We have to make the migrations running the command: `python3 manage.py makemigrations`, or `python manage.py makemigrations` based on our current version of python
7. After We have to effectively migrate it running the command: `python3 manage.py migrate`, or `python manage.py migrate` based on our current version of python
8. Once we get that done We ill be able to run the server running: `python3 manage.py runserver`, or `python manage.py runserver` based on our current version of python
9. The server is now running if it says **`Quit the server with CONTROL-C`** at the last line
10. you need to install some things:
  `sudo apt-get install` redis-server, aswell as `pip install celery redis`
## frontend

**if We have started the backend. We must open a new terminal. Navigate to the root directory**

We are using react so We have to have first of all npm installed, in Windows We only have to go to `[Node.js](https://nodejs.org/en)` and download and install it and for Linux it can be checked out on `https://linuxconfig.org/install-npm-on-linux`

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
