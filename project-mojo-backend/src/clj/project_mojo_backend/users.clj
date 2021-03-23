(ns project-mojo-backend.users
  (:require
   [project-mojo-backend.db.core :refer [*db*] :as db]
   [buddy.hashers :as hashers]))


(defn create-user!
  [{:keys [name email plan password]
    :as params}]
  (let [hash (hashers/derive password {:alg :bcrypt+sha512})]
    (-> (db/create-user! (assoc params :password hash))
        first)))


(defn update-user!
  [{:keys [email plan] :as params}]
  (db/update-user! params))


(defn get-user-by-email
  [email]
  (db/get-user-by-email {:email email}))


(defn get-user
  [id]
  (db/get-user {:id id}))

(defn get-requests-from-ts
  [userid ts]
  (db/get-requests! {:userid userid
                     :ts ts}))

(defn get-plan-details
  [identity]
  (let [user (get-user (:id identity))
        requests (get-requests-from-ts
                  (:id user)
                  (:last_billing_ts user))]
    {:requests (map
                #(hash-map
                  :url (:url %)
                  :created_at (:created_at %)
                  :request_method (:request_method %))
                requests)
     :last_billing_ts (:last_billing_ts user)}))
