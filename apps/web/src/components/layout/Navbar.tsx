import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav>
      <Link to="/">Sentinel</Link>

      {" | "}

      <Link to="/dashboard">
        Dashboard
      </Link>

      {" | "}

      <Link to="/emitter">
        Emitter
      </Link>
    </nav>
  );
}

export default Navbar;