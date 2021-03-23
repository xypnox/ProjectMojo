(ns project-mojo-backend.svg-utils
  (:require
   [me.raynes.conch.low-level :as sh]
   [clojure.string :as cs]
   [clojure.java.io :as io])
  (:import [java.io File]))


(defn rsvg-convert-exists?
  []
  (let [exit (future (sh/exit-code (sh/proc "rsvg-convert" "--version")))]
    (= @exit 0)))

(defn svg-file->png-file
  ([in-file]
   (let [f (File/createTempFile "temp" ".png")]
     (let [out-stream (:out (sh/proc "rsvg-convert" "-h" "1600" in-file))]
       (io/copy out-stream f)
       (.getAbsolutePath f))))
  ([in-file out-file]
   (svg-file->png-file "1600" in-file out-file))
  ([height in-file out-file]
   (let [out-stream (:out (sh/proc "rsvg-convert" "-h" height in-file))]
     (io/copy out-stream (io/file out-file))
     out-file)))

(defn svg->png-file
  ([svg-data]
   (svg->png-file "1600" svg-data))
  ([height svg-data]
   (let [svg-file (File/createTempFile "temp" ".svg")
         _ (spit svg-file svg-data)]
     (svg-file->png-file (.getAbsolutePath svg-file)))))

(defn find-vars*
  "NOTE: The variables contain the curly braces as well"
  [svg]
  (re-seq #"\{\{\w+\}\}" svg))

(defn replace-vars
  [svg params]
  (reduce (fn [agg [k v]]
            (cs/replace agg
                        (format "{{%s}}" (name k))
                        v))
          svg
          params))


(defn replace-attributes
  [svg params]
  (reduce (fn [agg [k v]]
            (cs/replace agg
                        (format "=\"%s\"" (name k))
                        (format "=\"%s\"" v)))
          svg
          params))

(defn apply-customization
  [template customization]
  (let [{:keys [colors fonts images]} customization]
    ; (def c* images)
    (-> template
        (replace-attributes colors)
        (replace-attributes fonts))))

