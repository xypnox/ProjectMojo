import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AxiosResponse } from "axios";

import API, { END_POINT } from "../api";

import TemplateGallery from "../components/templategallery";
import TemplateRow from "../components/templateRow";
import { useAuth, AuthContextType } from "../hooks/Auth";

import * as Icon from "react-feather";

interface Template {
  id: string;
  name: string;
}

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [templates, setTemplates] = useState([] as Array<Template>);

  const auth = useAuth() as AuthContextType;

  useEffect(() => {
    if (!isLoading) {
      return;
    }
    if (isLoading) {
      API.get("/templates", auth?.authHeader()).then(
        (result: AxiosResponse) => {
          setTemplates(result.data);
        }
      );
      setIsLoading(false);
    }
  }, [isLoading, templates, auth]);

  return (
    <div className="dashboard">
      <h1 className="title">Welcome {auth?.user && auth?.user.name}</h1>

      <h1 className="recent_title">Recents</h1>
      <div className="recent">
        <div className="trow">
          {templates.length > 0 && (
            <TemplateRow
              title="recents"
              templates={[...templates].reverse().map((t) => {
                return {
                  ...t,
                  url: END_POINT + "templates/" + t.id,
                };
              })}
            />
          )}
        </div>
        <Link className="upload" to="/create">
          <Icon.Upload size="124"></Icon.Upload>
          <div>Upload a Template</div>
        </Link>
      </div>

      <div className="trow">
        {templates.length > 0 && (
          <TemplateRow
            title="sample"
            templates={templates.map((t) => {
              return {
                ...t,
                url: END_POINT + "templates/" + t.id,
              };
            })}
          />
        )}
      </div>

      <div className="templates_dash">
        <TemplateGallery title="Template Gallery"></TemplateGallery>
      </div>
    </div>
  );
}
