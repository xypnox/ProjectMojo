import React from 'react';
import {Route, Redirect} from 'react-router-dom'; 
import {useAuth} from '../hooks/Auth';
// A wrapper for <Route> that redirects to the login
// screen if you're not yet authenticated.export 
export default function PrivateRoute(props: any) {
    let auth = useAuth();
    let {children, ...rest} = props;
    return (
      <Route
        {...rest}
        render={({ location }) =>
          (auth !== null && auth.user) ? (
            props.children
          ) : (
            <Redirect
              to={{
                pathname: "/login",
                state: { from: location }
              }}
            />
          )
        }
      />
    );
  }