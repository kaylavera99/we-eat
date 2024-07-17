import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { auth } from '../firebaseConfig';

const PrivateRoute = ({ component: Component, ...rest }: any) => (
  <Route
    {...rest}
    render={(props) =>
      auth.currentUser ? (
        <Component {...props} />
      ) : (
        <Redirect to="/login" />
      )
    }
  />
);

export default PrivateRoute;
