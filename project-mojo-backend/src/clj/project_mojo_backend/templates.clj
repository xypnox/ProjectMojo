(ns project-mojo-backend.templates
  (:require
   [project-mojo-backend.db.core :refer [*db*] :as db]))


(defn create-template!
  [{:keys [name svg_data public owner_id] :as params}]
  (db/create-template! params))

(defn get-templates
  [owner_id]
  (db/get-templates {:owner_id owner_id}))

(defn get-templates-user
  [userid]
  (db/get-templates-user {:owner_id userid}))

(defn set-public-template
  [id owner_id public]
  (def p* public)
  (db/set-public-template {:id id
                           :owner_id owner_id
                           :public public}))

(defn get-template
  [id owner_id]
  (db/get-template {:id id :owner_id owner_id}))


(defn delete-template!
  [id owner_id]
  (db/delete-template! {:id id :owner_id owner_id}))
