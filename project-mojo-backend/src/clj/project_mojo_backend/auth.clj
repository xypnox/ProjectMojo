(ns project-mojo-backend.auth
  (:require
   [project-mojo-backend.config :refer [env]]
   [project-mojo-backend.users :as users]
   [buddy.sign.jwt :as jwt]
   [buddy.auth.backends :refer [jws]]
   [buddy.auth.backends.httpbasic :refer [http-basic-backend]]
   [buddy.hashers :as hashers]))


(defn sign
  [payload]
  (jwt/sign payload (:auth-key env) {:alg :hs512}))

(defn unsign
  [payload]
  (jwt/unsign payload (:auth-key env) {:alg :hs512}))

(defn create-token
  "Creates signed jwt-token with user data as payload.

  `valid-seconds` sets the expiration span
  `terse?` include only users :id in payload (fits in URL)"
  [user & {:keys [valid-seconds]
           :or   {valid-seconds 7200}}] ;; 2 hours
  (let [payload (-> user
                    (assoc :exp (.plusSeconds
                                 (java.time.Instant/now) valid-seconds)))]
    (sign payload)))

(defn basic-auth
  [request {:keys [username password]}]
  (let [user (users/get-user-by-email username)]
    (if (and user
             (:valid (hashers/verify password (:password user))))
      (-> user
          (dissoc :password :last_billing_ts)
          (assoc :token (create-token (select-keys user [:id :email :name]))))
      false)))

(defn basic-auth-backend
  []
  (http-basic-backend {:authfn basic-auth}))

(defn token-backend
  []
  ;; env is initialized after the core function is run
  ;; So can't make toke-backend a def
  (jws {:secret (:auth-key env) :options {:alg :hs512}}))
