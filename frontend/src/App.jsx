import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Shield } from 'lucide-react';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import OnboardingModal from './components/OnboardingModal.jsx';

// Pages
import Home from './pages/Home.jsx';
import OnboardingVideo from './pages/OnboardingVideo.jsx';
import Pricing from './pages/Pricing.jsx';
import Sandbox from './pages/Sandbox.jsx';

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLeadData, setModalLeadData] = useState({
    leadName: '',
    leadUrl: '',
    leadEmail: ''
  });

  const handleOpenModal = (leadData = null) => {
    if (leadData && leadData.leadName) {
      setModalLeadData(leadData);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <Router>
      <div className="app-container">
        {/* Navigation Header */}
        <Header />

        {/* Global Onboarding Modal */}
        <OnboardingModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          initialLeadData={modalLeadData}
        />

        {/* Page Content Routes */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home onOpenModal={handleOpenModal} />} />
            <Route path="/onboarding" element={<OnboardingVideo />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/sandbox" element={<Sandbox />} />
          </Routes>
        </main>

        {/* Navigation Footer */}
        <Footer />

        {/* Floating "Secure Spot" CTA — visible on all pages */}
        <button
          className="floating-cta"
          onClick={() => handleOpenModal()}
          aria-label="Secure your onboarding spot"
        >
          <span className="floating-cta-dot" />
          <Shield size={16} />
          <span>Secure Spot</span>
        </button>
      </div>
    </Router>
  );
}
