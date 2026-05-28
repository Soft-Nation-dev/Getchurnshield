/**
 * Main Logic for GetChurnShield Landing Page
 */

// Documentation Step Switcher
function switchDocStep(step) {
    // UI Update
    for (let i = 1; i <= 3; i++) {
        const btn = document.getElementById(`step-btn-${i}`);
        const code = document.getElementById(`code-block-${i}`);
        if (i === step) {
            btn.classList.add('border-blue-500/30', 'bg-blue-500/5');
            btn.querySelector('div').classList.replace('text-gray-400', 'text-white');
            code.classList.remove('hidden');
        } else {
            btn.classList.remove('border-blue-500/30', 'bg-blue-500/5');
            btn.querySelector('div').classList.replace('text-white', 'text-gray-400');
            code.classList.add('hidden');
        }
    }
}

// Modal and Form Handler
document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('funnel-signup-form');
    const modal = document.getElementById('onboarding-modal');

    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Sync values to hidden modal fields
        document.getElementById('hidden-lead-name').value = document.getElementById('signup-name').value;
        document.getElementById('hidden-lead-url').value = document.getElementById('signup-url').value;
        document.getElementById('hidden-lead-email').value = document.getElementById('signup-email').value;

        // Show Modal
        modal.classList.remove('hidden');
    });

    // Close modal if clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });
});
