import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../../contexts/AuthContext";

import {
  logout,
} from "../../services/auth";


function Navbar() {
  const {
    user,
    clearUser,
  } = useAuth();


  const navigate =
    useNavigate();


  async function handleLogout() {
    try {
      await logout();

      clearUser();

      navigate(
        "/login"
      );
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );
    }
  }


  return (
    <nav>
      <Link
        to="/"
      >
        Sentinel
      </Link>


      {" | "}


      <Link
        to="/dashboard"
      >
        Dashboard
      </Link>


      {" | "}


      <Link
        to="/emitter"
      >
        Emitter
      </Link>


      {user && (
        <>
          {" | "}


          <span>
            👤 {user.username}
          </span>


          {" | "}


          <button
            type="button"
            onClick={
              handleLogout
            }
          >
            Logout
          </button>
        </>
      )}


      {!user && (
        <>
          {" | "}


          <Link
            to="/login"
          >
            Login
          </Link>
        </>
      )}
    </nav>
  );
}


export default Navbar;