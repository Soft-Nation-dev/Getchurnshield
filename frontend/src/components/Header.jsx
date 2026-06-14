import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Header() {
  return (
    <header className="header-wrapper">
      <div className="header-inner">
        <NavLink to="/" className="brand">
          <div className="logo-container">
            <img src="/logo.jpeg" alt="GetChurnShield" className="logo-img" />
          </div>
          <span className="brand-text">GetChurnShield</span>
        </NavLink>

        <nav className="nav-links">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Home
          </NavLink>
          <NavLink to="/onboarding" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Video Hub
          </NavLink>
          <NavLink to="/pricing" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Pricing
          </NavLink>
          <NavLink to="/sandbox" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Dev Sandbox
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
