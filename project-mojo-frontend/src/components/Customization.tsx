import React from "react";
import { CustomizationData, ImgObj } from "../types";
// cstm -> customization
import * as Icon from "react-feather";

import { image_id_prefix } from "../constants";

interface CustomizationProps {
  data: CustomizationData;
  refFunc: () => void;
}

export default function Customization(props: CustomizationProps) {
  let { colors, fonts, images } = props.data;

  return (
    <div className="customization">
      <h1>Styles</h1>
      {Object.keys(colors).length > 0 && (
        <>
          <div className="colors">
            <h2>Colors</h2>
            {Object.entries(colors).map(([color, value]) => (
              <input
                type="color"
                name={`color-${color}`}
                id={`color-${color}`}
                key={`color-${color}`}
                defaultValue={value}
                ref={props.refFunc}
              />
            ))}
          </div>
        </>
      )}

      {Object.keys(fonts).length > 0 && (
        <>
          <h2>Fonts</h2>
          <div className="fonts">
            {Object.entries(fonts).map(([font, value]) => (
              <span className="input" key={`font-${font}`}>
                <label htmlFor={`font-${font}`}>{font}</label>

                <input
                  type="text"
                  name={`font-${font}`}
                  id={`font-${font}`}
                  defaultValue={value}
                  ref={props.refFunc}
                />
              </span>
            ))}
          </div>
        </>
      )}

      {Object.keys(images).length > 0 && (
        <>
          <h2>Images</h2>
          <div className="images">
            {Object.entries(images).map(([img, value]) => {
              // console.log(img, value);
              return (
                <InputFile img={img} value={value} refFunc={props.refFunc} />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function InputFile(props: { img: string; value: ImgObj; refFunc: () => void }) {
  const message =
    props.img.replace(image_id_prefix, "").toUpperCase() +
    ": " +
    (props.value?.filename || "Upload Image");
  return (
    <div className="input input-file" key={`img-${props.img}`}>
      <button>
        <Icon.Image />
        <span className="label">{message}</span>
      </button>
      <input
        // className="cursor-pointer absolute block opacity-0 h-full w-full top-0"
        type="file"
        accept="image/png"
        multiple={false}
        name={`img-${props.img}`}
        id={`img-${props.img}`}
        ref={props.refFunc}
      />
    </div>
  );
}
