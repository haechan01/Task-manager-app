import React, { useContext, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import AuthContext from '../../context/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.username, formData.password);
      navigate('/home');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="logo">Task Manager</div>
          <p>
            Don't have an account?{' '}
            <Link to="/signup">Sign up</Link>
          </p>
        {location.state?.message && (
          <div className="success-message">
            {location.state.message}
          </div>
        )}
        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="submit-button"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <div className="nav-links">
          <Link to="/">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;