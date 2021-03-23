import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/Auth";
import axios from "axios";

import loader from "../images/loader.svg";

export default function Image(props: { src: string; alt: string }) {
  let [imgData, setImgData] = useState(loader);
  const [loading, setLoading] = useState(true);
  const auth = useAuth();

  useEffect(() => {
    axios
      .get(props.src, auth?.authHeader())
      .then((resp) => {
        const data = `data:${resp.headers["content-type"]};base64,${new Buffer(
          resp.data
        ).toString("base64")}`;
        setLoading(false);
        setImgData(data);
      })
      .catch((e) => {
        console.log(e);
      });
  });

  return (
    <img
      src={imgData}
      alt={props.alt}
      className={"auth-image" + (loading ? " loading" : "")}
    />
  );
}
