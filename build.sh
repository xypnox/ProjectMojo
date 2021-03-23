# Build the frontend into a bundle
FRONTEND_DIR='project-mojo-frontend'
BACKEND_DIR='project-mojo-backend'
yarn --cwd=$FRONTEND_DIR build
# Copy the bundle to the backend
cp -r $FRONTEND_DIR/build/ $BACKEND_DIR/resources/frontend_dist/

(cd $BACKEND_DIR && lein uberjar)

# Creates DATABASE_URL enviornment variable
DATABASE_URL=$(heroku config:get DATABASE_URL)

# Run Migrations
# Rollbacks have to be done manually
# (cd $BACKEND_DIR && python manage.py db init )
# (cd $BACKEND_DIR && python manage.py db migrate )
# (cd $BACKEND_DIR && python manage.py db upgrade )

# Login to heroku
HEROKU_API_KEY='YOUR API KEY'
heroku container:login

# Push docker image to heroku container registry
NAME_OF_HEROKU_APP='projectmojo'
heroku container:push -a $NAME_OF_HEROKU_APP web

# Release the new app
heroku container:release -a $NAME_OF_HEROKU_APP web
