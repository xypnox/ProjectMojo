import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useHistory, useLocation, Link } from "react-router-dom";
import { useAuth, AuthContextType, signupForm } from "../hooks/Auth";

export default function Signup() {
  const { register, handleSubmit, watch, errors } = useForm();
  let history = useHistory();
  let location = useLocation();
  const auth = useAuth() as AuthContextType;

  const [error, setError] = useState("");

  let { from }: { from: { pathname: string } } = (location.state || {
    from: { pathname: "/" },
  }) as { from: { pathname: string } };

  const onSubmit = (data: signupForm) => {
    console.log(data);
    auth.signup(
      data,
      () => {
        console.log("Signup Successful");
        history.replace(from);
      },
      (e) => {
        console.log(e.message);
        if (e.message === "Request failed with status code 409") {
          setError("Email already exists. Please login.");
        }
      }
    );
  };

  console.log(watch("example")); // watch input value by passing the name of it

  return (
    <div className="signup auth_form">
      <h1>Register</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input
          name="name"
          ref={register({ required: true })}
          placeholder="Name"
        />
        {errors.name && <span>This field is required</span>}

        <input
          name="email"
          ref={register({ required: true })}
          placeholder="Email"
        />
        {errors.email && <span>This field is required</span>}

        <input
          name="password"
          ref={register({ required: true })}
          placeholder="Password"
          type="password"
        />
        {errors.password && <span>This field is required</span>}

        <input type="submit" value="Register" />

        {error !== "" && <div className="error">{error}</div>}
      </form>
      <div className="alt_message">
        <p>Already have an account?</p>
        <Link to="/login" className="button">
          Login
        </Link>
      </div>
    </div>
  );
}
