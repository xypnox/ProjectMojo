(ns project-mojo-backend.media
  (:require [project-mojo-backend.templates :as templates]
            [project-mojo-backend.svg-utils :as svg-utils]))


;; Regex {{[^\\s]+?}}

(defn template->image
  [template-id owner_id params customization]
  (let [template (templates/get-template template-id owner_id)]
    (if template
      (svg-utils/svg->png-file (-> (:svg_data template)
                                   (svg-utils/apply-customization customization)
                                   (svg-utils/replace-vars params)))
      nil)))
