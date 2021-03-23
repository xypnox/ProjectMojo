import React, { useEffect, useState } from "react";
import RenderTemplate from "../components/RenderTemplate";
import API from "../api";
import { useAuth, AuthContextType } from "../hooks/Auth";
import { useHistory } from "react-router-dom";

export default function CreateTemplate() {
  const [selectedFile, setSelectedFile] = useState(
    new File(["no-file"], "nameOfFile")
  );
  const [svgContent, setSVGContent] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const history = useHistory();
  const auth = useAuth() as AuthContextType;

  const [processing, setProcessing] = useState(false);

  const showSVGPreview = () => {
    let reader = new FileReader();
    reader.readAsText(selectedFile, "UTF-8");
    reader.onload = function (evt) {
      let svgData = evt && evt.target && (evt.target.result as string);
      setSVGContent(svgData as string);
    };
  };

  useEffect(showSVGPreview, [selectedFile]);

  const createTemplate = () => {
    setProcessing(true);
    if (svgContent === "no-file") {
      console.log("empty file, not uploading");
      return;
    }
    console.log(templateName, isPublic);
    API.post(
      "templates",
      {
        svg_data: svgContent,
        template_name: templateName,
        public: isPublic,
      },
      {
        headers: {
          Authorization: "Token " + auth.user?.token,
        },
      }
    )
      .then((resp) => {
        if (resp.status === 201) {
          setUploadMessage(
            "The template was uploaded successfully! Redirecting to dashboard"
          );
          setTimeout(() => {
            history.push("/");
            setProcessing(false);
          }, 2000);
        } else {
          setUploadMessage("The template could not be uploaded");
        }
      })
      .catch((e) => {
        setUploadMessage("An error was encountered while uploading");
        setProcessing(false);
        console.log(e);
      });
  };

  return (
    <div className="create_template">
      <div className="upload_form">
        <h1>Upload Template</h1>

        <div className="input">
          <input
            type="file"
            accept="image/svg+xml"
            onChange={(event) => {
              // @ts-ignore
              setSelectedFile(event?.target?.files[0]);
            }}
          />
          {svgContent !== "no-file" && (
            <p className="hint">You can test the template below the form</p>
          )}
        </div>

        <div className="input">
          <span>Template Title:</span>
          <input
            type="text"
            value={templateName}
            onChange={(event) => {
              setTemplateName(event.target.value);
            }}
          />
        </div>

        <div className="select">
          <input
            type="checkbox"
            name="public"
            id="public"
            checked={isPublic}
            onChange={(e) => {
              setIsPublic(!isPublic);
            }}
          />
          <label htmlFor="public"> Public?</label>
        </div>

        <button
          className="button primary"
          onClick={createTemplate}
          disabled={processing}
        >
          {processing ? "Uploading" : "Upload Template"}
        </button>

        {uploadMessage !== "" && <p>{uploadMessage}</p>}
      </div>
      <div>
        {svgContent !== "no-file" && (
          <RenderTemplate
            SVGContent={svgContent}
            key={svgContent}
            title="Test the template"
          />
        )}
      </div>
    </div>
  );
}
