import React from 'react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="section-container">
        <p>&copy; {new Date().getFullYear()} GetChurnShield Engine Inc. All rights reserved.</p>
        <p style={{ fontSize: '0.75rem', marginTop: '8px', color: 'rgba(168, 155, 196, 0.5)' }}>
          High-performance onboarding telemetry wrapper & behavioral watchdogs. Billed strictly on recovered user LTV.
        </p>
      </div>
    </footer>
  );
}
