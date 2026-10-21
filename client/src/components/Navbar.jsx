import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="nav-links">
        <NavLink className="nav-link" to="/students">
          Students
        </NavLink>
        <NavLink className="nav-link" to="/dashboard">
          My Feedback
        </NavLink>
      </div>

      <div className="nav-user">
        <span className="user-badge">{user?.name}</span>
        <button className="logout-btn" onClick={logout} type="button">
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
