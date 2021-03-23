import React from "react";
import { ChevronRight, ChevronLeft } from "react-feather";
import { Link } from "react-router-dom";
import Image from "./Image";
interface TemplateThumb {
  id: string;
  name: string;
  url: string;
}

const TemplateRow = React.memo(
  (props: { title: string; templates: TemplateThumb[] }) => {
    let [scrollLeft, setScrollLeft] = React.useState(false);
    let [scrollRight, setScrollRight] = React.useState(true);
    let { title, templates } = props;
    templates = [...templates, ...templates, ...templates];

    let hideArrows = (idname: string) => {
      setInterval(() => {
        let el = document.getElementById(idname);
        if (el) {
          let scrollpp =
            (100 * el.scrollLeft) / (el.scrollWidth - el.clientWidth);
          if (el.clientWidth === el.scrollWidth) {
            setScrollRight(false);
            setScrollLeft(false);
          } else if (scrollpp > 99) {
            setScrollRight(false);
            setScrollLeft(true);
          } else if (scrollpp < 1) {
            setScrollLeft(false);
            setScrollRight(true);
          } else {
            setScrollLeft(true);
            setScrollRight(true);
          }
        }
      }, 1000);
    };

    React.useEffect(() => {
      hideArrows(title);
    }, [title]);

    return (
      <div className="template_row" key={title.trim()}>
        <div className="array" id={title.trim()}>
          {templates.map((template, i) => (
            <Link
              to={"editor/" + template.id}
              className="template"
              key={`${title}-${template.name}-${i}`}
            >
              <Image src={template.url} alt={template.name} />
              <div className="info">
                <p>{template.name}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className={"scroll left" + (scrollLeft ? "" : " hidden")}>
          <ChevronLeft
            onClick={() => {
              let el = document.getElementById(title.trim())!;
              el.scrollBy({
                top: 0,
                left: -el.offsetWidth * 0.75,
                behavior: "smooth",
              });
              setScrollLeft(true);
            }}
          ></ChevronLeft>
        </div>
        <div className={"scroll right " + (scrollRight ? "" : " hidden")}>
          <ChevronRight
            onClick={() => {
              let el = document.getElementById(title.trim())!;
              el.scrollBy({
                top: 0,
                left: el.offsetWidth * 0.75,
                behavior: "smooth",
              });
              setScrollRight(true);
            }}
          ></ChevronRight>
        </div>
      </div>
    );
  }
);

export default TemplateRow;
