import React, { useState } from "react";

import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../hooks/Auth";

import UserWidget from "../components/UserWidget";

import * as Icon from "react-feather";

import logo from "../images/logo.svg";

export default function Navbar() {
  let auth = useAuth();
  const [open, setOpen] = useState(false);
  let links: React.ReactNode;

  function setClosed(): void {
    setOpen(false);
  }

  if (auth !== null && auth.user !== null) {
    links = (
      <ul>
        <li>
          <NavLink onClick={setClosed} exact to="/gallery">
            Templates
          </NavLink>
        </li>
        <li>
          <NavLink onClick={setClosed} exact to="/create">
            Upload Template
          </NavLink>
        </li>
        <UserWidget setClosed={setClosed} />
      </ul>
    );
  } else {
    links = (
      <ul>
        <li>
          <NavLink onClick={setClosed} exact to="/gallery">
            Templates
          </NavLink>
        </li>
        <li>
          <NavLink onClick={setClosed} exact to="/signup">
            Signup
          </NavLink>
        </li>
        <li>
          <NavLink onClick={setClosed} exact to="/login">
            Login
          </NavLink>
        </li>
      </ul>
    );
  }

  return (
    <nav className={open ? "open" : "closed"}>
      <Link to="/" id="project-name" onClick={setClosed}>
        <img src={logo} alt="Project Mojo logo" />
        ProjectMojo
      </Link>
      <div
        className="toogle"
        onClick={() => {
          setOpen(!open);
        }}
      >
        <Icon.Menu></Icon.Menu>
      </div>
      {links}
    </nav>
  );
}
