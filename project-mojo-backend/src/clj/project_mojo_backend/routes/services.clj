(ns project-mojo-backend.routes.services
  (:require
   [reitit.swagger :as swagger]
   [reitit.swagger-ui :as swagger-ui]
   [reitit.ring.coercion :as coercion]
   [reitit.coercion.spec :as spec-coercion]
   [reitit.ring.middleware.muuntaja :as muuntaja]
   [reitit.ring.middleware.multipart :as multipart]
   [reitit.ring.middleware.parameters :as parameters]
   [ring.middleware.cors :refer [wrap-cors]]
   [project-mojo-backend.middleware :as mw]
   [project-mojo-backend.middleware.formats :as formats]
   [project-mojo-backend.templates :as templates]
   [project-mojo-backend.media :as media]
   [project-mojo-backend.auth :as auth]
   [project-mojo-backend.users :as users]
   [project-mojo-backend.svg-utils :as svg-utils]
   [ring.util.http-response :refer :all]
   [clojure.java.io :as io]
   [clojure.set :as cset]))

(defn service-routes []
  ["/api"
   {:coercion spec-coercion/coercion
    :muuntaja formats/instance
    :swagger {:id ::api}
    :middleware [;; query-params & form-params
                 parameters/parameters-middleware
                 ;; content-negotiation
                 muuntaja/format-negotiate-middleware
                 ;; encoding response body
                 muuntaja/format-response-middleware
                 ;; exception handling
                 coercion/coerce-exceptions-middleware
                 ;; decoding request body
                 muuntaja/format-request-middleware
                 ;; coercing response bodys
                 coercion/coerce-response-middleware
                 ;; coercing request parameters
                 coercion/coerce-request-middleware
                 ;; multipart
                 multipart/multipart-middleware
                 (fn [handler]
                   (wrap-cors handler
                              ;; TODO: Change this to allow all sites
                              :access-control-allow-origin [#"http://localhost:3000"]
                              :access-control-allow-methods [:get :put :post :delete]))]}

   ;; swagger documentation
   ["" {:no-doc true
        :swagger {:info {:title "my-api"
                         :description "https://cljdoc.org/d/metosin/reitit"}}}

    ["/swagger.json"
     {:get (swagger/create-swagger-handler)}]

    ["/api-docs/*"
     {:get (swagger-ui/create-swagger-ui-handler
            {:url "/api/swagger.json"
             :config {:validator-url nil}})}]]

   ["/login"
    {:post
     {:middleware [mw/basic-auth mw/auth]
      :handler (fn [{:keys [identity]}]
                 {:status 200
                  :body identity})}}]

   ["/ping"
    {:get (constantly (ok {:message "pong"}))}]

   ["/checkcreds"
    {:get {:parameters {}
           :middleware [mw/token-auth mw/auth]
           :handler (fn [_]
                      {:status 200
                       :body "true"})}}]

   ["/users"
    {:post {:parameters {:body {:name string?
                                :email string?
                                :password string?}}
            :handler (fn [{{params :body} :parameters}]
                       (let [user (try (users/create-user! (assoc params
                                                                  :plan "free"))
                                       ;; TODO: Check error type
                                       ;; it may always not be duplicate key
                                       (catch Exception _
                                         nil))]
                         (if user
                           {:status 200
                            :body user}
                           {:status 409})))}}]




   ["/templates"
    {:get {:handler (fn [req]
                      (let [token (-> req
                                      (get-in [:headers "authorization"] "")
                                      (clojure.string/split #" ")
                                      (second))
                            identity (try (auth/unsign token)
                                          (catch Exception e nil))]
                        {:status 200
                         :body (templates/get-templates (:id identity))}))}

     ;; NOTE: Make sure log-request happens after enforce billling
     ;; otherwise we might keep counting requests which aren't doing anything
     :post {:middleware [mw/token-auth mw/auth mw/wrap-enforce-billing  mw/wrap-log-request]
            ;; TODO: Rename the parameter to just name
            :parameters {:body {:template_name string?
                                :svg_data string?
                                :public boolean?}}
            :handler (fn [{{params :body} :parameters
                           :keys [identity]}]

                       (when (not= 0 (templates/create-template! (-> params
                                                                     (cset/rename-keys {:template_name :name})
                                                                     (assoc :owner_id (:id identity)))))

                         {:status 201}))}}]

   ["/user/templates"
    ;; TODO: merge this with query parameters with templates get request
    {:get {:parameters {}
           :middleware [mw/token-auth mw/auth]
           :handler (fn [{:keys [identity]}]
                      {:status 200
                       :body (templates/get-templates-user (:id identity))})}}]


   ["/templates/{id}"
    {:get {:parameters {:path {:id int?}}
           :handler (fn [{{{:keys [id]} :path} :parameters :as req}]

                      (let [token (-> req
                                      (get-in [:headers "authorization"] "")
                                      (clojure.string/split #" ")
                                      (second))
                            identity (try (auth/unsign token)
                                          (catch Exception e nil))
                            template (templates/get-template id (:id identity))]
                        ;; Template will be nil if not found or access denied
                        (if (some? template)
                          {:status 200
                           :headers {"Content-Type" "image/svg+xml"}
                           :body (:svg_data template)}
                          {:status 404})))}

     :delete {:middleware [mw/token-auth mw/auth]
              :parameters {:path {:id int?}}
              :handler (fn [{{{:keys [id]} :path} :parameters
                             :keys [identity]}]
                         {:status 200
                          :body {:changed (templates/delete-template! id (:id identity))}})}}]



   ["/templates/{id}/public"
    {:post {:parameters {:path {:id int?}
                         :body {:public boolean?}}
            :middleware [mw/token-auth mw/auth]
            :handler (fn [{{{:keys [id]} :path
                            {:keys [public]} :body} :parameters
                           :keys [identity]}]
                       {:status 200
                        :body {:changed (templates/set-public-template
                                         id (:id identity) public)}})}}]



   ["/media/{template-id}"
    {:post {:parameters {:path {:template-id int?}
                         :body {:params map?
                                :customization map?}}
            :middleware [mw/token-auth mw/auth mw/wrap-enforce-billing  mw/wrap-log-request]
            :handler (fn [{{{:keys [template-id]} :path
                            {:keys [params customization]} :body} :parameters
                           :keys [identity]}]
                       (let [media (media/template->image
                                    template-id (:id identity) params customization)]
                         (if media
                           {:status 200
                            :headers {"Content-Type" "image/png"}
                            :body (-> media
                                      (java.io.File.)
                                      (io/input-stream))}
                           {:status 404})))}}]

   ["/render/svg"
    {:post {:parameters {:body {:svg string?}}
            :middleware [mw/token-auth mw/auth mw/wrap-enforce-billing  mw/wrap-log-request]
            :handler (fn [{{{:keys [svg]} :body} :parameters
                           :keys [identity]}]
                       (let [media (svg-utils/svg->png-file svg)]
                         (if media
                           {:status 200
                            :headers {"Content-Type" "image/png"}
                            :body (-> media
                                      (java.io.File.)
                                      (io/input-stream))}
                           {:status 404})))}}]


   ["/plan"
    {:get {:parameters {}
           :middleware [mw/token-auth mw/auth]
           :handler (fn [{:keys [identity]}]
                      {:status 200
                       :body (users/get-plan-details identity)})}}]



   ["/math"
    {:swagger {:tags ["math"]}}

    ["/plus"
     {:get {:summary "plus with spec query parameters"
            :parameters {:query {:x int?, :y int?}}
            :responses {200 {:body {:total pos-int?}}}
            :middleware [mw/token-auth mw/auth mw/wrap-enforce-billing  mw/wrap-log-request]
            :handler (fn [{{{:keys [x y]} :query} :parameters}]
                       {:status 200
                        :body {:total (+ x y)}})}
      :post {:summary "plus with spec body parameters"
             :parameters {:body {:x int?, :y int?}}
             :responses {200 {:body {:total pos-int?}}}
             :handler (fn [{{{:keys [x y]} :body} :parameters}]
                        {:status 200
                         :body {:total (+ x y)}})}}]]

   ["/files"
    {:swagger {:tags ["files"]}}

    ["/upload"
     {:post {:summary "upload a file"
             :parameters {:multipart {:file multipart/temp-file-part}}
             :responses {200 {:body {:name string?, :size int?}}}
             :handler (fn [{{{:keys [file]} :multipart} :parameters}]
                        {:status 200
                         :body {:name (:filename file)
                                :size (:size file)}})}}]

    ["/download"
     {:get {:summary "downloads a file"
            :swagger {:produces ["image/png"]}
            :handler (fn [_]
                       {:status 200
                        :headers {"Content-Type" "image/png"}
                        :body (-> "public/img/warning_clojure.png"
                                  (io/resource)
                                  (io/input-stream))})}}]]])
