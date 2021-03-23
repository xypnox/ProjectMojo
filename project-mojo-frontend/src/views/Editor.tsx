import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { saveAs } from "file-saver";
import * as Icons from "react-feather";
import { Link, useParams } from "react-router-dom";
import Papa from "papaparse";
import API from "../api";
import JSZip from "jszip";

import {
  VarsDict,
  replaceVars,
  varsToVarsDict,
  findVars,
  createSVGUrl,
  getColors,
  getFonts,
  generateCstmObject,
  applyCustomization,
  getImages,
  generateCstmImgObject,
  genCstmObjRequest,
} from "../SVGUtils";

import { useAuth } from "../hooks/Auth";
import { CustomizationData } from "../types";
import Customization from "../components/Customization";
import { useEvents } from "../hooks/Analytics";

interface Dic {
  [key: string]: string;
}

const Editor = React.memo(() => {
  // console.log("RenderTemplate Rendered");
  const [svgContent, setSVGContent] = useState("");
  const [svgContentUrl, setSVGContentUrl] = useState("");

  const initialSVGVars: VarsDict = {};
  const [svgVars, setSVGVars] = useState(initialSVGVars);
  const auth = useAuth();

  const [selectedFile, setSelectedFile] = useState(
    new File(["no-file"], "nameOfFile")
  );
  const [fileSet, setFileSet] = useState(false);
  const [CSVContent, setCSVContent] = useState([] as Dic[]);

  const [processing, setProcessing] = useState(false);

  const [csvKeys, setCsvKeys] = useState([] as string[]);

  const [tab, setTab] = useState(0);

  const event = useEvents();

  const [cstmData, setCstmData] = useState<CustomizationData>({
    colors: {},
    fonts: {},
    images: {},
  });
  const cstmForm = useForm();

  const onFileUpload = () => {
    let reader = new FileReader();
    reader.readAsText(selectedFile, "UTF-8");
    reader.onload = function (evt) {
      let result = evt && evt.target && (evt.target.result as string);
      // setCSVContent(result as string);

      let data = Papa.parse(result as string, {
        header: true,
      });

      console.log(data.data);

      let csvarr: Dic[] = data.data as Dic[];

      if (csvarr.length > 0) {
        let keys = Object.keys(csvarr[0]);
        console.log(keys);
        setCsvKeys(keys);
        setCSVContent(csvarr);

        event("upload", "csv");
      }

      setFileSet(true);
    };
  };

  let { id }: { id: string } = useParams();

  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchTemplate = () => {
      API.get("templates/" + id, auth?.authHeader()).then((resp) => {
        setSVGContent(resp.data);
        setCstmData({
          colors: getColors(resp.data),
          fonts: getFonts(resp.data),
          images: getImages(resp.data),
        });
        // console.log("Images", getImages(resp.data));
        // console.log("auth", auth?.user);
      });
    };
    fetchTemplate();
  }, [auth, id]);

  useEffect(() => {
    setSVGVars(varsToVarsDict(findVars(svgContent)));
    setSVGContentUrl(createSVGUrl(svgContent));
  }, [svgContent]);

  const varsForm = useForm<VarsDict>();
  const inputs = [];

  if (fileSet) {
    for (let var_ in svgVars) {
      inputs.push(
        <div key={var_}>
          <span className="label">{var_}:</span>
          {csvKeys.length > 0 && (
            <select name={var_} ref={varsForm.register}>
              {csvKeys.map((k) => {
                return (
                  <option value={k} key={k + var_ + "dallas"}>
                    {k}
                  </option>
                );
              })}
            </select>
          )}
        </div>
      );
    }
  } else {
    for (let var_ in svgVars) {
      let values = varsForm.getValues();

      inputs.push(
        <div key={var_}>
          <span className="label">{var_}:</span>
          <input
            name={var_}
            defaultValue={values[var_] ? values[var_] : ""}
            ref={varsForm.register}
          />
        </div>
      );
    }
  }

  const onReset = (e: React.MouseEvent): void => {
    setCSVContent([]);
    setCsvKeys([]);
    setFileSet(false);
    setSelectedFile(new File(["no-file"], "nameOfFile"));
  };

  const onRefresh = async (e: React.MouseEvent): Promise<void> => {
    e.preventDefault();
    let cstmdata = cstmForm.getValues();
    // console.log("applystyles", data);
    let cstm = {
      colors: generateCstmObject(cstmdata, "color-"),
      fonts: generateCstmObject(cstmdata, "font-"),
      images: await generateCstmImgObject(cstmdata, "img-", cstmData.images),
    };

    // console.log(cstm);

    setCstmData(cstm);
    let customizedSvgContent = applyCustomization(svgContent, cstm);

    if (fileSet) {
      setSVGContentUrl(createSVGUrl(customizedSvgContent));
    } else {
      let data = varsForm.getValues();
      setSVGVars(data);
      const newSVGContent = replaceVars(customizedSvgContent, data);
      setSVGContentUrl(createSVGUrl(newSVGContent));
    }
  };

  const onDownload = async (e: React.MouseEvent): Promise<void> => {
    e.preventDefault();
    setProcessing(true);

    let values = varsForm.getValues();
    let processed = 0; // stores number of processed

    let cstmdata = cstmForm.getValues();
    console.log("formdata", cstmdata);
    let cstm = {
      colors: generateCstmObject(cstmdata, "color-"),
      fonts: generateCstmObject(cstmdata, "font-"),
      images: await generateCstmImgObject(cstmdata, "img-", cstmData.images),
    };

    setCstmData(cstm);
    console.log("formdata", cstm, cstmdata);

    let customizedSvgContent = applyCustomization(svgContent, cstm);

    console.log("Download initiated", values, cstmdata); //dev X
    // setProcessing(false); //dev X
    // return; //dev X

    let zip = new JSZip();

    CSVContent.forEach((p) => {
      let params = { ...values };
      let filename = "";

      Object.keys(values).forEach((k, v) => {
        params[k] = p[csvKeys[v]];
        filename += p[csvKeys[v]];
      });

      const newSVGContent = replaceVars(customizedSvgContent, params);
      console.log(params);

      API.post(
        "render/svg",
        {
          svg: newSVGContent,
        },
        {
          ...auth?.authHeader(),
          responseType: "arraybuffer",
        }
      )
        .then((resp) => {
          console.log("We got it", p, filename, processed, CSVContent.length);

          zip.file(filename + ".png", resp.data);
          processed++;
          if (processed === CSVContent.length) {
            console.log("Zipping and saving");
            zip.generateAsync({ type: "blob" }).then(function (content) {
              saveAs(content, "batch.zip");
              setProcessing(false);
              event("media_download_batch", id);
            });
          }
        })
        .catch((e) => {
          console.log(e.message);
          if (e.message === "Request failed with status code 429") {
            setMessage("Account limit exhausted");
          }
          setProcessing(false);
        });
    });
  };

  const onDownloadSingle = async (e: React.MouseEvent): Promise<void> => {
    e.preventDefault();
    setProcessing(true);
    let cstmdata = cstmForm.getValues();
    console.log("formdata", cstmdata);
    let cstm = {
      colors: generateCstmObject(cstmdata, "color-"),
      fonts: generateCstmObject(cstmdata, "font-"),
      images: await generateCstmImgObject(cstmdata, "img-", cstmData.images),
    };
    setCstmData(cstm);
    console.log("formdata", cstm, cstmdata);

    let customizedSvgContent = applyCustomization(svgContent, cstm);

    let data = varsForm.getValues();
    setSVGVars(data);
    const newSVGContent = replaceVars(customizedSvgContent, data);
    // setSVGContentUrl(createSVGUrl(newSVGContent));
    API.post(
      "render/svg",
      {
        svg: newSVGContent,
      },
      {
        ...auth?.authHeader(),
        responseType: "arraybuffer",
      }
    ).then((resp) => {
      var blob = new Blob([resp.data], {
        type: resp.headers["content-type"],
      });
      // TODO: Create a better filename based on the variables or template name
      saveAs(blob, "MyCerti.png");
      setProcessing(false);
      event("media_download_single", id);
    });
  };

  return (
    <div key={svgContentUrl} className="editor">
      {svgContent ? (
        <div className="wrapper">
          <div className="preview">
            {svgContentUrl && <img alt="Preview" src={svgContentUrl}></img>}
          </div>
          {Object.keys(svgVars).length > 0 && (
            <div className="toolkit">
              <h1 className="title">Editor</h1>
              <div className="tablist">
                <div
                  className={`tab` + (tab === 0 ? " selected" : "")}
                  onClick={() => {
                    setTab(0);
                  }}
                >
                  Variables
                </div>
                <div
                  className={`tab` + (tab === 1 ? " selected" : "")}
                  onClick={() => {
                    setTab(1);
                    event("customization", "switched");
                  }}
                >
                  Styling
                </div>
              </div>

              <div className={`tab-content` + (tab === 0 ? " selected" : "")}>
                {!fileSet ? (
                  <div className="file-input">
                    <h1>Variables:</h1>
                    {inputs}

                    <div className="tools">
                      {auth?.user && (
                        <button
                          className="button primary"
                          onClick={onDownloadSingle}
                          disabled={processing}
                        >
                          {processing ? (
                            <span>
                              <Icons.Loader></Icons.Loader>
                              Processing
                            </span>
                          ) : (
                            <span>
                              <Icons.Download></Icons.Download>
                              PNG
                            </span>
                          )}
                        </button>
                      )}
                      <button className="button" onClick={onRefresh}>
                        <Icons.RefreshCcw></Icons.RefreshCcw>
                        Refresh
                      </button>
                    </div>

                    {auth?.user ? (
                      <div>
                        <div className="alt_message">
                          Or upload CSV to generate multiple copies:
                        </div>
                        <input
                          type="file"
                          accept=" text/csv"
                          onChange={(event) => {
                            // @ts-ignore
                            setSelectedFile(event?.target?.files[0]);
                          }}
                        />

                        <button
                          className="button primary"
                          onClick={onFileUpload}
                        >
                          Submit CSV
                        </button>
                      </div>
                    ) : (
                      <div className="logins">
                        <Link className="button primary" to="/login">
                          Login to Download
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="csv_toolkit">
                    <button className="button" onClick={onReset}>
                      <Icons.X></Icons.X>
                      Remove CSV
                    </button>
                    <h1>Columns:</h1>
                    {inputs}

                    <div className="tools">
                      <button
                        className="button primary"
                        onClick={onDownload}
                        disabled={processing}
                      >
                        {processing ? (
                          <span>
                            <Icons.Loader></Icons.Loader>
                            Processing
                          </span>
                        ) : (
                          <span>
                            <Icons.Download></Icons.Download>
                            Download ZIP
                          </span>
                        )}
                      </button>

                      {message}
                    </div>
                  </div>
                )}
              </div>
              <div className={`tab-content` + (tab === 1 ? " selected" : "")}>
                <Customization
                  data={cstmData}
                  refFunc={cstmForm.register}
                ></Customization>
                <div className="tools">
                  <button className="button" onClick={onRefresh}>
                    <Icons.RefreshCcw></Icons.RefreshCcw>
                    Apply Styles
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="loader">
          <Icons.Loader></Icons.Loader>
          <p>Loading</p>
        </div>
      )}
    </div>
  );
});

export default Editor;
