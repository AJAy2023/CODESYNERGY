import { Navigate } from "react-router-dom";
import { useUser } from "@clerk/react";   //  useUser is  hook
function PrivateRoute({children}){
  const {isSignedIn ,  isLoaded} =  useUser();
  if(!isLoaded)
  {
    return <div>Loading.....</div>
  }
  if(!isSignedIn)
  {
    return <Navigate to="/" />
  }
  return children;
}

export default PrivateRoute