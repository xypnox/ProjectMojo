FRONTEND_DIR='project-mojo-frontend'
BACKEND_DIR='project-mojo-backend'
REMOTE_USER="app@app.projectmojo.co"
yarn --cwd=$FRONTEND_DIR install
yarn --cwd=$FRONTEND_DIR build
echo "Deploying Frontend Directory"
rsync -r $FRONTEND_DIR/build/ $REMOTE_USER:/var/www/app
echo "Stoping already deployed backend docker"
ssh -o StrictHostKeyChecking=no $REMOTE_USER "docker stop \$(docker ps -a -q --filter ancestor=project_mojo --format=\"{{.ID}}\")"
echo "Syncing Backend Directory"
rsync -r $BACKEND_DIR/ $REMOTE_USER:~/project-mojo/$BACKEND_DIR
echo "Building Docker file again"
ssh -o StrictHostKeyChecking=no $REMOTE_USER "cd ~/project-mojo/ && docker build . -t project_mojo"
echo "Spinning up docker again"
ssh -o StrictHostKeyChecking=no $REMOTE_USER "cd ~/project-mojo/ && docker run -d -p 5000:5000 --env-file=.env project_mojo"