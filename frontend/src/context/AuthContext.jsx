import { createContext, useContext, useState, useEffect } from "react";
import API from "../api/axios.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On app load — check if token exists and load user
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('taskflow_token');
      const saveUser = localStorage.getItem('taskflow_user');

      if(token && saveUser) {
        try {
          //Verify token is still valid
          const res = await API.get('/auth/me');
          setUser(res.data.user);
        } catch (err) {
          localStorage.removeItem('taskflow_token');
          localStorage.removeItem('taskflow_user');
          setUser(null);
        }
      }

      setLoading(false);
    };
    initAuth();
  }, []);

  //Register
  const register = async (name, email, password, role) => {
    const res = await API.post('/auth/register', {
      name, email, password, role
    });

    localStorage.setItem('taskflow_token', res.data.token);
    localStorage.setItem('taskflow_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  }

  //Login
  const login = async (email, password) => {
    const res = await API.post('/auth/login', {
      email, password
    });

    localStorage.setItem('taskflow_token', res.data.token);
    localStorage.setItem('taskflow_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  }

  //Logout
  const logout = () => {
    localStorage.removeItem('taskflow_token');
    localStorage.removeItem('taskflow_user');
    setUser(null);
  }

  // ── Update user in context after profile changes ──────
  const updateUser = (updateUser) => {
    setUser(updateUser);
    localStorage.setItem('taskflow_user', JSON.stringify(updateUser));
  };

  return (
    <AuthContext.Provider value={{
      user, 
      loading, 
      register, 
      login, 
      updateUser,
      logout
    }}>{children}</AuthContext.Provider>
  )
};

//Custom Hooks
export const useAuth = () => {
  const context = useContext(AuthContext);
  if(!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};

export default AuthContext;