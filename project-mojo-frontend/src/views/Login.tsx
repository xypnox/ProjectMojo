import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useHistory, useLocation } from "react-router-dom";
import { useAuth, AuthContextType, LoginForm } from "../hooks/Auth";

export default function Login() {
  const { register, handleSubmit, errors } = useForm();

  const [error, setError] = useState("");

  let history = useHistory();
  let location = useLocation();

  const auth = useAuth() as AuthContextType;

  let { from }: { from: { pathname: string } } = (location.state || {
    from: { pathname: "/" },
  }) as { from: { pathname: string } };

  const onSubmit = (data: LoginForm) => {
    console.log("Form data submitted: ", data);
    auth.login(
      data,
      () => {
        console.log("Login Successful");
        history.replace(from);
      },
      (e) => {
        console.log(e.message);
        if (e.message === "Request failed with status code 401") {
          setError("Incorrect Email/Password. Please try again");
        }
      }
    );
  };

  return (
    <div className="login auth_form">
      <h1>Login</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input
          name="email"
          ref={register({ required: true })}
          placeholder="Email"
        />
        {/* {errors.email && <span>This field is required</span>} */}

        <input
          name="password"
          ref={register({ required: true })}
          placeholder="Password"
          type="password"
        />
        {/* {errors.password && <span>This field is required</span>} */}

        <input type="submit" value="Login" />
        {error !== "" && <div className="error">{error}</div>}
      </form>

      <div className="alt_message">
        <p>Don't have an account?</p>
        <Link to="/signup" className="button">
          Register
        </Link>
      </div>
    </div>
  );
}
