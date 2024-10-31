import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleCreateAccount = () => {
    navigate('/signup');
  };

  const handleSignIn = () => {
    navigate('/login');
  };

  return (
    <div className="landing-page">
      <div className="landing-container">
        <div className="logo">Task Manager</div>
        <h2>Welcome to Task Manager</h2>
        <h3>Organize your tasks efficiently</h3>       
        <div className="auth-buttons">
          <button className="create-account" onClick={handleCreateAccount}>
            Create account
          </button>
        </div>
        <div className="footer">
          <p>
            Already have an account?{' '}
            <span onClick={handleSignIn} className="sign-in-link">
              Sign in
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;