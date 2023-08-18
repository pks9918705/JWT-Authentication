import "./App.css";
import axios from "axios";
import { useEffect, useState } from "react";
import jwt_decode from "jwt-decode";

function App() {
  
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    
    const userAvailable = localStorage.getItem("token");
    if (userAvailable) {
      const decodedToken = jwt_decode(userAvailable);
      console.log("decoded token: ", decodedToken);
      const currentTime = Date.now() / 1000;

      if (decodedToken.exp > currentTime) {
        setUser({ accessToken: userAvailable });
      }
    }
  }, []);

  const axiosJWT = axios.create();

  axiosJWT.interceptors.request.use(
    async (config) => {
      if (user && user.accessToken) {
        const decodedToken = jwt_decode(user.accessToken);
        const currentTime = Date.now() / 1000;

        if (decodedToken.exp < currentTime) {
          await refreshToken();
        }
        config.headers["Authorization"] = "Bearer " + user.accessToken;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  const refreshToken = async () => {
    try {
      const response = await axios.post("/refresh", {
        token: user.refreshToken,
      });

      const { accessToken } = response.data;

      setUser({
        ...user,
        accessToken,
      });

      localStorage.setItem("token", accessToken);
    } catch (error) {
      console.log(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/login", { username, password });
      setUser(res.data);
      localStorage.setItem("token", res.data.accessToken);
    } catch (err) {
      console.log("Failed on Client side",err);
    }
  };

  const handleDelete = async (id) => {
    setSuccess(false);
    setError(false);
    try {
      await axiosJWT.delete("/users/" + id);
      setSuccess(true);
    } catch (err) {
      setError(true);
    }
  };

  const handleLogout = async () => {
    try {
      console.log("Logging out...");
  
      const axiosWithAuth = axios.create({
        headers: {
          Authorization: `Bearer ${user.accessToken}`, // Add authorization header
        },
      });
  
      const response = await axiosWithAuth.post("/logout", {
        token: user.refreshToken,
      });
  
      console.log("Logout response:", response);
  
      if (response.status === 200) {
        localStorage.clear(); // Clear the entire localStorage
        console.log("Cleared localStorage");
        setUser(null)
      } else {
        console.log("Logout failed"); // Handle the case where logout wasn't successful
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };
  
  

  return (
    <div className="container">
      {user ? (
        <div className="home">
          <button className="btn" onClick={handleLogout}>Logout</button>
          <span>
            Welcome to the <b>{user.isAdmin ? "admin" : "user"}</b> dashboard{" "}
            <b>{user.username}</b>.
          </span>
          <span>Delete Users:</span>
          <button className="deleteButton" onClick={() => handleDelete(1)}>
            Delete John
          </button>
          <button className="deleteButton" onClick={() => handleDelete(2)}>
            Delete Jane
          </button>
          {error && (
            <span className="error">You are not allowed to delete this user!</span>
          )}
          {success && (
            <span className="success">User has been deleted successfully...</span>
          )}
        </div>
      ) : (
        <div className="login">
          <form onSubmit={handleSubmit}>
            <span className="formTitle">Login</span>
            <input
              type="text"
              placeholder="username"
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="submitButton">
              Login
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
