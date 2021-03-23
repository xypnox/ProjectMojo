(ns project-mojo-backend.handler
  (:require
    [project-mojo-backend.middleware :as middleware]
    [project-mojo-backend.routes.services :refer [service-routes]]
    [ring.middleware.resource :refer [wrap-resource]]
    [reitit.swagger-ui :as swagger-ui]
    [reitit.ring :as ring]
    [ring.middleware.content-type :refer [wrap-content-type]]
    [ring.middleware.webjars :refer [wrap-webjars]]
    [project-mojo-backend.env :refer [defaults]]
    [mount.core :as mount]))

(mount/defstate init-app
  :start ((or (:init defaults) (fn [])))
  :stop  ((or (:stop defaults) (fn []))))

(mount/defstate app-routes
  :start
  (ring/ring-handler
   (ring/router
    [(service-routes)])
   (ring/routes
    (ring/create-resource-handler {:path "/"
                                   :root "frontend_dist"})
    (ring/create-default-handler))))

(defn app []
  (middleware/wrap-base #'app-routes))
