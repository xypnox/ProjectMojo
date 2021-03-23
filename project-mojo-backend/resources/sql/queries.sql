-- Reference: https://www.hugsql.org/#detail

-- :name create-user! :<!
-- :doc creates a new user record
INSERT INTO users
(name, email, plan, password)
VALUES (:name, :email, :plan::user_plan, :password) RETURNING id, name, email, plan;

-- :name update-user! :! :n
-- :doc updates an existing user record
UPDATE users
SET name = :name, email = :email, plan = :plan
WHERE id = :id

-- :name get-user :? :1
-- :doc retrieves a user record given the id
SELECT * FROM users
WHERE id = :id

-- :name get-users :? :*
-- :doc retrieves a users
SELECT * FROM users

-- :name get-user-by-email :? :1
-- :doc retrieves a user record given the id
SELECT * FROM users
WHERE email = :email

-- :name delete-user! :! :n
-- :doc deletes a user record given the id
DELETE FROM users
WHERE id = :id

-- :name create-template! :<!
-- :doc creates a new template
INSERT INTO templates
(name, svg_data, owner_id, public)
values (:name, :svg_data, :owner_id, :public) RETURNING id, name;

-- :name get-template :? :1
-- :doc get a single template
SELECT * from templates
WHERE id = :id AND (public = true OR owner_id = :owner_id)

-- :name get-templates :? :*
-- :doc get all accessible templates (but not their data)
SELECT id, name, owner_id, public from templates
WHERE public = true OR owner_id = :owner_id;

-- :name get-templates-user :? :*
-- :doc get all the templates of a user (but not their data)
SELECT id, name, owner_id, public from templates
WHERE owner_id = :owner_id;

-- :name set-public-template :! :n
-- :doc set the public column as prvided for given template
UPDATE templates SET public = :public
WHERE id = :id AND owner_id = :owner_id;

-- :name delete-template! :! :n
-- :doc deletes a template record given the id and owner_id
DELETE FROM templates
WHERE id = :id AND owner_id = :owner_id;

-- :name log-request! :<!
-- :doc logs a request in the db
INSERT INTO requests
(userid, url, request_method, query_params)
values (:userid, :url, :request_method, :query_params) RETURNING *;

-- :name count-requests-from-ts :? :1
-- :doc Counter the number of requests made by user after given timestamp
SELECT COUNT(*) FROM requests
WHERE userid = :userid AND created_at > :ts;

-- :name get-requests! :? :*
-- :doc fetches request url and created_at for user_id
SELECT * FROM requests
WHERE userid = :userid AND created_at > :ts;