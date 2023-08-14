// Import necessary styles and libraries
import "./App.css";
import axios from "axios";
import { useState } from "react";
import jwt_decode from "jwt-decode"; // Library to decode JWT tokens

// Define the main App component
function App() {
  // State variables to manage user data, input fields, and messages
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  // Function to refresh the JWT token
  const refreshToken = async () => {
    try {
      // Send a request to the server to refresh the token
      const response = await axios.post("/refresh", { token: user.refreshToken });
      // Extract new tokens from the response
      const { accessToken, refreshToken } = response.data;
      // Update user data with new tokens
      setUser({
        ...user,
        accessToken,
        refreshToken,
      });
      // Return the response data
      return response.data;
    } catch (error) {
      console.log(error);
    }
  };

  // Create an instance of Axios specifically for JWT-based requests
  const axiosJWT = axios.create();

  // Intercept requests to attach JWT token to Authorization header
  axiosJWT.interceptors.request.use(
    async (config) => {
      const currentDate = new Date();
      const decodedToken = jwt_decode(user.accessToken); // Decode the JWT token
      if (decodedToken.exp < currentDate.getTime()) { // Check if token is expired
        const data = await refreshToken(); // Refresh the token
        config.headers["Authorization"] = "Bearer " + data.accessToken;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Handle form submission for user login
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Send a POST request with username and password
      const res = await axios.post("/login", { username, password });
      // Set user data upon successful login
      setUser(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  // Handle user deletion
  const handleDelete = async (id) => {
    setSuccess(false);
    setError(false);
    try {
      // Send a DELETE request with the user's access token in headers
      await axiosJWT.delete("/users/" + id, {
        headers: { authorization: "Bearer " + user.accessToken },
      });
      // Set success message if deletion is successful
      setSuccess(true);
    } catch (err) {
      // Set error message if an error occurs during deletion
      setError(true);
    }
  };

  // JSX rendering based on user authentication status
  return (
    <div className="container">
      {user ? ( // If user is authenticated, show the dashboard
        <div className="home">
          {/* Display user-specific information */}
          <span>
            Welcome to the <b>{user.isAdmin ? "admin" : "user"}</b> dashboard{" "}
            <b>{user.username}</b>.
          </span>
          {/* Buttons to delete users */}
          <span>Delete Users:</span>
          <button className="deleteButton" onClick={() => handleDelete(1)}>
            Delete John
          </button>
          <button className="deleteButton" onClick={() => handleDelete(2)}>
            Delete Jane
          </button>
          {/* Display error message if error state is true */}
          {error && (
            <span className="error">
              You are not allowed to delete this user!
            </span>
          )}
          {/* Display success message if success state is true */}
          {success && (
            <span className="success">
              User has been deleted successfully...
            </span>
          )}
        </div>
      ) : ( // If user is not authenticated, show the login form
        <div className="login">
          <form onSubmit={handleSubmit}>
            <span className="formTitle">Lama Login</span>
            {/* Input fields for username and password */}
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
            {/* Submit button for login */}
            <button type="submit" className="submitButton">
              Login
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// Export the App component
export default App;
