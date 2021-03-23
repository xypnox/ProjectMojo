import React from "react";
import { useHistory, NavLink, Link } from "react-router-dom";
import { useAuth, AuthContextType } from "../hooks/Auth";
import Gravatar from "react-gravatar";

export default function UserWidget(props: { setClosed: () => void }) {
  let history = useHistory();
  let auth = useAuth();

  if (auth !== null && auth.user) {
    // Enforce auth is ContextType
    let auth2 = auth as AuthContextType;

    return (
      <div className="user_widget">
        <div
          className="button"
          onClick={() => {
            props.setClosed();
            auth2.signout(() => history.push("/"));
          }}
        >
          Sign out
        </div>
        <Link to="/profile" onClick={props.setClosed}>
          <Gravatar email={auth2.user?.email} size={48} />
        </Link>
      </div>
    );
  }

  return <NavLink to="/login"> Log In</NavLink>;
}
