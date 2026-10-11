import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div style={{ textAlign: "center", paddingTop: "4rem" }}>
      <h1>404 — Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link to="/">Return Home</Link>
    </div>
  );
};

export default NotFound;
