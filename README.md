# How to run backend  and frontend
## backend
Start in the root directory, it should contain 'backend' 'frontend' and several other .md files
<br>
If you encounter any **errors** running the sever, check with **chat-gpt** what **imports** you may be missing.

1. cd into the ***backend*** folder, here you should see the folder ***venv***
2. start the virtual enviroment (venv), using the command `source venv/bin/activate`
3. you should now see `(venv)` to the left in your terminal
4. cd from `backend` into 'ServerBackend' using the command `cd ServerBackend`
5. here you should run `python3 manage.py runserver`, or `python manage.py runserver` based on your current version of python
6. The server is now running if it says **`Quit the server with CONTROL-C`** at the last line

## frontend
**if you have started the backend. you must open a new terminal. Navigate to the root directory**

1. cd into `frontend/src`
2. run `npm start`
3. a new browser tab should open with the react frontend.

# Git branches
when working on a new feature or specific changes/fixes, you should make your own branch.<br>
The name of the branch should reflect who is working on it, and what it aims to implement


>**Example:**
>- Branch Name: `Antonio-reactlogin`<br>
>- here, Antonio is working on a react login functionality.<br>

NB! when making a new branch, make sure you are at the correct branch you want to branch from<br>
if you want to branch from the main branch, make sure you are at main, or move there with `git checkout main`

### how to make and push to new branch
1. make a branch `git branch [your branch name]`
2. checkout the branch `git checkout [your branch name]`
3. make your first commit
4. make first push and set upstream branch at the same time using `git push -u origin [your branch name]`
5. step 4 makes sure that next time you do `git push` you will push to this branch, and not to the previous upstream branch (default is `main`)

### Merge branch back to main/other branches
1. Checkout the branch you want to merge into using f.ex. `git checkout main`.
2. Now do `git merge [your branch]`, where `[your branch]` is the branch with the changes that you want merged with main.

### How to merge to my local project the changes that other made in the main branch
1. cd to our path of the project, for example: `cd Documents/inf2900/Team4/`
2. Fetch the latest changes from Github: `git fetch origin`
3. Pull the changes into our local main branch: `git pull origin main`
   #### -> If conflicts, for example: error: `
       Your local changes to the following files would be overwritten by merge:
           frontend/src/App.js, frontend/src/components/FrontPage.js
       Please commit your changes or stash them before you merge. Aborting. Updating 890515c2..1f0fda69`
     We can stash our changes, Stash if you're in the middle of something and not ready to commit. You can always apply your stashed changes after pulling the updates from main.
   We can do that doing, for example: `git add frontend/src/App.js`, `git add frontend/src/components/FrontPage.js` and `git stash push -m "Describe your changes"`
   And afther that We can Pull the Latest changes from main: `git pull origin main`
4. Once conflicts solved, We can go to our branch, for example: `git checkout antonio-frontend`
5. And now, merge the changes from main: `git merge main`


# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

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
