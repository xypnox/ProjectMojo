(ns project-mojo-backend.requests
  (:require
   [project-mojo-backend.db.core :refer [*db*] :as db]
   [project-mojo-backend.users :as users]
   [java-time :as jt]))


(defn log-request!
  [{:keys [url request_method userid query_params] :as params}]
  (db/log-request! params))

;; Add indexes on created_at and userid

(defn count-requests-from-ts
  [userid ts]
  (-> (db/count-requests-from-ts {:userid userid
                                  :ts ts})
      :count))

