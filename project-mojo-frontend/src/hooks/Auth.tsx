import React, { useContext, createContext, useState } from "react";
import API from "../api";
import { AxiosRequestConfig } from "axios";
import jwt_decode from "jwt-decode";

/*
Convention:

cb -> callback
cbe -> callback on error
*/

export type signupForm = {
  name: string;
  email: string;
  password: string;
};

export type LoginForm = {
  email: string;
  password: string;
};

class User {
  id: number;
  name: string;
  email: string;
  admin: boolean | null;
  last_login: string | null;
  plan: string;
  token: string;

  constructor(
    id: number,
    name: string,
    email: string,
    admin: boolean | null,
    last_login: string | null,
    plan: string,
    token: string
  ) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.admin = admin;
    this.last_login = last_login;
    this.plan = plan;
    this.token = token;
  }
}

// Authentication handling
const authConnector = {
  isAuthenticated: false,
  login(data: LoginForm, cb: (user: User) => void, cbe: (e: Error) => void) {
    // Signin in the db here
    authConnector.isAuthenticated = true;
    API.post(
      "/login",
      {},
      {
        auth: {
          username: data.email,
          password: data.password,
        },
      }
    )
      .then((resp) => {
        // Save user to localstorage
        cb(resp.data);
      })
      .catch(cbe);
  },
  signout(cb: () => void) {
    // Signout in the db here
    authConnector.isAuthenticated = false;
    cb();
  },
  signup(data: signupForm, cb: () => void, cbe: (e: Error) => void) {
    // Signup the user
    authConnector.isAuthenticated = false;
    API.post("/users", data)
      .then((resp) => {
        cb();
      })
      .catch(cbe);
  },
};

/** For more details on
 * `authContext`, `ProvideAuth`, `useAuth` and `useProvideAuth`
 * refer to: https://usehooks.com/useAuth/
 */

export type AuthContextType = {
  user: User | null;
  login: (data: LoginForm, cb: () => void, cbe: (e: Error) => void) => void;
  signout: (cb: () => void) => void;
  signup: (data: signupForm, cb: () => void, cbe: (e: Error) => void) => void;
  authHeader: () => AxiosRequestConfig;
};

export const authContext = createContext<AuthContextType | null>(null);

function ProvideAuth(props: { children: React.ReactNode }) {
  const auth = useProvideAuth();
  return (
    <authContext.Provider value={auth}>{props.children}</authContext.Provider>
  );
}

function useAuth() {
  return useContext(authContext);
}

function useProvideAuth() {
  const [user, setUser] = useState<User | null>(getUserFromLocalStorage());

  const login = (data: LoginForm, cb: () => void, cbe: (e: Error) => void) => {
    return authConnector.login(
      data,
      (user) => {
        setUser(user);
        localStorage.setItem("user", JSON.stringify(user));
        cb();
      },
      cbe
    );
  };

  const signout = (cb: () => void) => {
    return authConnector.signout(() => {
      setUser(null);
      localStorage.removeItem("user");
      cb();
    });
  };

  const signup = (
    data: signupForm,
    cb: () => void,
    cbe: (e: Error) => void
  ) => {
    return authConnector.signup(
      data,
      () => {
        setUser(null);
        cb();
      },
      cbe
    );
  };

  const authHeader = (): AxiosRequestConfig => {
    if (user !== null) {
      return {
        headers: {
          Authorization: "Token " + user?.token,
        },
      };
    }
    return {};
  };

  return {
    user,
    login,
    signout,
    signup,
    authHeader,
  };
}

interface JWTData {
  email: string;
  exp: number;
  id: number;
  name: string;
}

function getUserFromLocalStorage(): User | null {
  // Gets user from localstorage
  let userJSON = localStorage.getItem("user");
  if (userJSON) {
    let user = JSON.parse(userJSON);
    try {
      let decoded = jwt_decode(user.token) as JWTData;
      let now = new Date();

      // We remove the last three digits as the JS getTime returns ms and server sends in s
      let expired = decoded.exp < Math.floor(now.getTime() / 1000);

      if (!expired) {
        return user;
      } else {
        localStorage.removeItem("user");
      }
    } catch (error) {
      console.log(error);
      return null;
    }
  }
  return null;
}

export { ProvideAuth, useAuth };
