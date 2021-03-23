import React, { useEffect, useState } from "react";
import { AxiosResponse } from "axios";
import API, { END_POINT } from "../api";
import Image from "./Image";
import { Link, useHistory } from "react-router-dom";

import { useAuth } from "../hooks/Auth";
import Modal from "react-modal";

import * as Icon from "react-feather";

interface Template {
  id: number;
  name: string;
  owner_id: number;
}

interface TemplateGalleryProps {
  title: string;
}

const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
  },
};

Modal.setAppElement("#root");

export default function TemplateGallery(props: TemplateGalleryProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [templates, setTemplates] = useState([] as Array<Template>);
  const auth = useAuth();
  const [deleteId, setDeleteId] = useState(-1);
  const history = useHistory();

  let overlay = Modal.defaultStyles.overlay;
  let content = Modal.defaultStyles.content;
  if (overlay && content) {
    overlay.backgroundColor = "#000000ca";
    content.backgroundColor = "var(--background-alt)";
    content.border = "1px solid var(--background)";
    content.borderRadius = "1.25rem";
  }
  const [modalIsOpen, setIsOpen] = React.useState(false);
  function openModal(id: number) {
    setDeleteId(id);
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
  }

  const link = "editor";

  useEffect(() => {
    if (!isLoading) {
      return;
    }
    if (isLoading) {
      API.get("templates", auth?.authHeader()).then((result: AxiosResponse) => {
        // console.log(result.data);
        setTemplates(result.data);
      });
      // console.log(templates);
      setIsLoading(false);
    }
  }, [isLoading, templates, auth]);

  let deleteTemplate = (e: React.MouseEvent): void => {
    e.preventDefault();
    let template = templates.find((x) => x.id === deleteId);
    if (template) {
      if (auth?.user?.id === template.owner_id) {
        API.delete("templates/" + deleteId, auth.authHeader()).then((resp) => {
          // console.log(resp);
          history.go(0);
        });
      }
    }
  };

  return (
    <div className="gallery">
      <h1>{props.title}</h1>
      <div className="templates">
        {templates.map((template, i) => (
          <div className="template" key={`${template.name}-${template.id}`}>
            <Link to={link + "/" + template.id} className="template_image">
              <Image src={END_POINT + "templates/" + template.id} alt="" />
            </Link>
            <div className="info">
              <Link to={link + "/" + template.id}>{template.name}</Link>

              {auth?.user && auth?.user.id === template.owner_id && (
                <div
                  className="action"
                  onClick={(e) => {
                    openModal(template.id);
                  }}
                >
                  <Icon.Trash2></Icon.Trash2>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        style={customStyles}
      >
        <div className="close_action">
          <button onClick={closeModal}>
            <Icon.X></Icon.X>
          </button>
        </div>
        <div className="info">
          <h1>Delete template?</h1>
          <p>This actioon cannot be reversed!</p>
          <button className="Delete" onClick={deleteTemplate}>
            <Icon.Trash2></Icon.Trash2>
            Delete!
          </button>
        </div>
      </Modal>
    </div>
  );
}
