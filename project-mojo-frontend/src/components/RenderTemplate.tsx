import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as Icons from "react-feather";

import {
  VarsDict,
  replaceVars,
  varsToVarsDict,
  findVars,
  createSVGUrl,
} from "../SVGUtils";
import { useEvents } from "../hooks/Analytics";

type RenderTemplateProps = {
  SVGContent: string;
  title: string;
  templateID?: number;
};

const RenderTemplate = React.memo((props: RenderTemplateProps) => {
  // console.log("RenderTemplate Rendered");
  const [svgContentUrl, setSVGContentUrl] = useState("");
  const initialSVGVars: VarsDict = {};
  const [svgVars, setSVGVars] = useState(initialSVGVars);

  useEffect(() => {
    setSVGVars(varsToVarsDict(findVars(props.SVGContent)));
    setSVGContentUrl(createSVGUrl(props.SVGContent));
  }, [props]);

  const varsForm = useForm<VarsDict>();
  const inputs = [];
  const event = useEvents();
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

  const onVarsSubmit = (data: VarsDict): void => {
    setSVGVars(data);
    const newSVGContent = replaceVars(props.SVGContent, data);
    setSVGContentUrl(createSVGUrl(newSVGContent));
  };

  const onRefresh = (e: React.MouseEvent): void => {
    let data = varsForm.getValues();
    setSVGVars(data);
    const newSVGContent = replaceVars(props.SVGContent, data);
    setSVGContentUrl(createSVGUrl(newSVGContent));
    event("test_template_upload", "test");
  };

  return (
    <div key={svgContentUrl} className="render_template">
      <div className="wrapper">
        <div className="preview">
          {svgContentUrl && <img alt="Preview" src={svgContentUrl}></img>}
        </div>
        <div className="toolkit">
          <h1 className="title">{props.title}</h1>
          {Object.keys(svgVars).length > 0 && (
            <form onSubmit={varsForm.handleSubmit(onVarsSubmit)}>
              <button className="button" onClick={onRefresh}>
                <Icons.RefreshCcw></Icons.RefreshCcw>
                Refresh
              </button>

              {inputs}
            </form>
          )}
        </div>
      </div>
    </div>
  );
});

export default RenderTemplate;
