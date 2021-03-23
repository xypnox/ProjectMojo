import React, { useEffect } from "react";
import "./styles/main.scss";

import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import Navbar from "./components/Navbar";

import CreateTemplate from "./views/CreateTemplate";
import TemplateGallery from "./components/templategallery";
import PrivateRoute from "./components/privateRoute";
import Dashboard from "./views/Dashboard";
import Login from "./views/Login";
import Signup from "./views/Signup";

import { ProvideAuth } from "./hooks/Auth";
import Editor from "./views/Editor";
import UserPage from "./views/UserPage";
import Footer from "./components/Footer";

function App() {
  return (
    <ProvideAuth>
      <Router>
        <div>
          <Navbar />

          <Switch>
            <Route path="/login">
              <Login />
            </Route>
            <Route path="/signup">
              <Signup />
            </Route>
            <PrivateRoute path="/create">
              <CreateTemplate />
            </PrivateRoute>
            <Route path="/gallery">
              <TemplateGallery title="Choose and edit templates" />
            </Route>
            <PrivateRoute path="/profile/">
              <UserPage />
            </PrivateRoute>
            <PrivateRoute exact path="/">
              {/* <MainArea /> */}
              <Dashboard />
            </PrivateRoute>
            <Route path="/editor/:id">
              <Editor />
            </Route>
          </Switch>
        </div>

        <Footer></Footer>
      </Router>
    </ProvideAuth>
  );
}

export default App;
