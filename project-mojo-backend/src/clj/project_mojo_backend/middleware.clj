(ns project-mojo-backend.middleware
  (:require
   [project-mojo-backend.env :refer [defaults]]
   [project-mojo-backend.auth :as auth]
   [project-mojo-backend.requests :as requests]
   [project-mojo-backend.users :as users]
   [ring-ttl-session.core :refer [ttl-memory-store]]
   [ring.middleware.defaults :refer [site-defaults wrap-defaults]]
   [buddy.auth.middleware :refer [wrap-authentication wrap-authorization]]
   [buddy.auth.accessrules :refer [restrict]]
   [buddy.auth :refer [authenticated?]]
   [buddy.auth.backends.session :refer [session-backend]]))


;; ============= Authentication and Authorization =================

(defn auth
  "Middleware used in routes that require authentication. If request is not
   authenticated a 401 not authorized response will be returned"
  [handler]
  (fn [request]
    (if (authenticated? request)
      (handler request)
      {:status 401
       :body {:error "Authorization required"}})))

(defn basic-auth
  [handler]
  (wrap-authentication handler (auth/basic-auth-backend)))

(defn token-auth
  "Middleware used on routes requiring token authentication"
  [handler]
  (wrap-authentication handler (auth/token-backend)))

(defn on-error [request response]
  {:status 401
   :headers {}
   :body (str "Access to " (:uri request) " is not authorized")})

(defn wrap-restricted [handler]
  (restrict handler {:handler authenticated?
                     :on-error on-error}))

(defn wrap-auth [handler]
  (let [backend (session-backend)]
    (-> handler
        (wrap-authentication backend)
        (wrap-authorization backend))))

;; ============= Request Logging and Billing =================

(defn wrap-log-request
  [handler]
  (fn [{:keys [identity uri request-method] :as request}]
    (requests/log-request! {:url uri
                            :request_method (name request-method)
                            :userid (:id identity)
                            :query_params (:query-params request)})
    (handler request)))


;; TODO: Move this to some good place later
;;
;; TODO: These values are only for testing right now. Change these to
;; the actual values required
(def usage-limits
  {"free" 100 ;; 10 only for testing

   "premium" 10000 ;; 10 thousand
   })


(defn wrap-enforce-billing
  [handler]
  (fn [{:keys [identity] :as request}]
    (let [user (users/get-user (:id identity))
          request-count (requests/count-requests-from-ts
                         (:id user)
                         (:last_billing_ts user))
          _ (clojure.tools.logging/info (format "Request Count: %s" request-count))]
      (if (> (get usage-limits (:plan user))
             request-count)
        (handler request)
        {:status 429
         :body (format "Your usage limit has expired for current billing month. Please upgrade or contact support. You are currently on plan: %s" (:plan user))}))))


;; ====================== Base ===============================

(defn wrap-base [handler]
  (-> ((:middleware defaults) handler)
      wrap-auth
      (wrap-defaults
       (-> site-defaults
           (assoc-in [:security :anti-forgery] false)
           (assoc-in  [:session :store] (ttl-memory-store (* 60 30)))))))
