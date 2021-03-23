import axios, { AxiosResponse } from "axios";
import fileDownload from "js-file-download";
import { palette, image_ids } from "./constants";
import {
  CustomizationData,
  ImgObj,
  ImgData,
  CustomizationDataReq,
} from "./types";

type VarsDict = { [id: string]: string };

function removeBraces(text: string): string {
  const l = text.length;
  if (l >= 4) {
    return text.substr(2, l - 4);
  } else {
    return text;
  }
}

function findVars(text: string): Array<string> {
  const r = new RegExp(`{{[^\\s]+?}}`, "g");
  const resTemp = Array.from(text.matchAll(r), (m) => m[0]);
  return resTemp.map(removeBraces);
}

function varsToVarsDict(vars: Array<string>): VarsDict {
  let dict = {} as VarsDict;
  for (let var_ of vars) {
    dict[var_] = "";
  }
  return dict;
}

function createSVGUrl(svgText: string): string {
  if (svgText) {
    const blob = new Blob([svgText], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    return url;
  } else {
    return "";
  }
}

function replaceVars(text: string, varVals: VarsDict): string {
  let text_ = text;
  // console.log(varVals);
  for (let var_ in varVals) {
    if (varVals[var_]) {
      text_ = text_.replaceAll(`{{${var_}}}`, varVals[var_]);
      console.log("yolo");
    }
  }
  return text_;
}

function replaceParams(text: string, paramVals: VarsDict): string {
  let text_ = text;
  // console.log(paramVals);
  for (let var_ in paramVals) {
    if (paramVals[var_]) {
      text_ = text_.replaceAll(`${var_}`, paramVals[var_]);
    }
  }
  return text_;
}

function replaceImgBase64(text: string, params: ImgData): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "image/svg+xml");

  for (let key in params) {
    console.log(key, params[key]?.filename);
    if (params[key]?.filename && params[key]?.filename !== "") {
      let el: any = doc.getElementById(key);
      console.log(el["xlink:href"]);
      el.setAttributeNS(
        "http://www.w3.org/1999/xlink",
        "href",
        params[key]?.base64
      );
      // if (el) el["xlink:href"] = params[key]?.base64;
      console.log(el);
    }
  }

  var s = new XMLSerializer();
  return s.serializeToString(doc);
}

function getColors(text: string): VarsDict {
  let colors: VarsDict = {};
  let colorsA = [
    ...text.matchAll(/(?!=")#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})(?=")/g),
    // This regex returns [#color, color]. Maybe later we may want to switch to #color only.
  ];
  // console.log(colorsA, palette);
  colorsA.forEach((col) => {
    if (palette.includes(col[0])) colors[col[0]] = col[0];
  });
  // console.log(colors);
  return colors;
}

function getFonts(text: string): VarsDict {
  let fonts: VarsDict = {};
  let fontsA = [
    ...text.matchAll(/font-family="([^"]*)"/g),
    // This regex returns [#color, color]. Maybe later we may want to switch to #color only.
  ];
  fontsA.forEach((col) => {
    fonts[col[1]] = col[1];
  });
  delete fonts[""]; // Remove empty font-family attribute (ideally should be matched by the regex)
  return fonts;
}

function getImages(text: string): ImgData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "image/svg+xml");
  let params: ImgData = {};

  image_ids.forEach((el) => {
    if (doc.getElementById(el) !== null) {
      params[el] = null;
    }
  });

  return params;
}

function generateCstmObject(data: VarsDict, filter: string): VarsDict {
  let keys = Object.keys(data).filter((s) => s.startsWith(filter));
  // console.log("keys", keys);
  let params: VarsDict = {};
  keys.forEach((key) => {
    params[key.replace(filter, "")] = data[key];
  });
  return params;
}

interface ImgObjWithKey {
  key: string;
  data: ImgObj;
}

async function getBase64ImageObjPromise(
  file: File,
  key: string
): Promise<ImgObjWithKey> {
  const reader = new FileReader();
  let prom: Promise<ImgObjWithKey> = new Promise((resolve, reject) => {
    reader.onload = function () {
      if (typeof reader.result === "string") {
        // console.log("setting");
        resolve({
          key: key,
          data: {
            filename: file.name,
            base64: reader.result,
            file: file,
          },
        });
      } else {
        reject(null);
      }
    };
    reader.onerror = () => {
      reject(null);
    };
    reader.readAsDataURL(file);
  });
  return prom;
}

async function generateCstmImgObject(
  data: any,
  filter: string,
  prevData: ImgData
): Promise<ImgData> {
  let keys = Object.keys(data).filter((s) => s.startsWith(filter));
  // console.log("keys", keys);
  let params: ImgData = {};

  let promises = [];

  for (let i = 0; i < keys.length; i++) {
    let key = keys[i];
    let newkey = key.replace(filter, "");
    // console.log(key.replace(filter, ""), data[key]);

    if (data[key].length > 0) {
      let file = data[key][0];
      promises.push(getBase64ImageObjPromise(file, newkey));
    } else if (prevData[newkey]?.filename) {
      params[newkey] = prevData[newkey];
    } else {
      params[newkey] = null;
    }
  }

  await Promise.all(promises).then((values) => {
    values.map((value) => {
      params[value.key] = value.data;
    });
  });

  return params;
}

function applyCustomization(
  svgContent: string,
  cstmData: CustomizationData
): string {
  // console.log("Applying", cstmData);
  let processed = replaceParams(svgContent, cstmData.colors);
  processed = replaceParams(processed, cstmData.fonts);
  processed = replaceImgBase64(processed, cstmData.images);
  // console.log(processed);
  return processed;
}

function genCstmObjRequest(cstm: CustomizationData): CustomizationDataReq {
  let images: VarsDict = {};
  Object.keys(cstm.images).forEach((key) => {
    let base64 = cstm.images[key]?.base64;
    if (base64 !== undefined) {
      images[key] = base64;
    }
  });

  return {
    fonts: cstm.fonts,
    colors: cstm.colors,
    images: images,
  };
}

function getTemplates(): Promise<AxiosResponse> {
  return axios.get("http://localhost:5000/api/templates");
}

function getTemplate(template_id: string) {
  return axios.get(`http://localhost:5000/api/templates/${template_id}`);
}

function getZip(template_id: string, paramsArray: Array<VarsDict>): void {
  const data = {
    template_id,
    params_array: paramsArray,
  };

  axios.post("http://localhost:5000/api/image/bulk", data).then((response) => {
    // const blob = new Blob([response.data], { type: "application/zip" });
    // const url = URL.createObjectURL(blob);
    fileDownload(response.data, "images.zip", "application/zip");
    // window.open(url, "_blank");
    console.log("Downloading file");
  });
  return;
}

export {
  replaceVars,
  varsToVarsDict,
  findVars,
  createSVGUrl,
  getZip,
  getTemplates,
  getTemplate,
  getColors,
  replaceParams as replaceColors,
  getFonts,
  getImages,
  generateCstmObject,
  genCstmObjRequest,
  generateCstmImgObject,
  applyCustomization,
};
export type { VarsDict };
