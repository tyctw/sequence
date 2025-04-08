/**
 * User Guide Modal functionality
 * Extracted from app.js to reduce file size
 */

document.addEventListener('DOMContentLoaded', () => {
  initializeGuideModal();
});

function initializeGuideModal() {
  const helpBtn = document.getElementById('helpBtn');
  const menuHelpBtn = document.getElementById('menuHelpBtn');
  const userGuideModal = document.getElementById('userGuideModal');
  const closeBtn = document.querySelector('.close-btn');
  const guideCloseBtn = document.querySelector('.guide-close-btn');
  const mobileMenu = document.querySelector('.mobile-menu');
  const menuToggle = document.querySelector('.menu-toggle');
  
  // Show help guide on first visit
  if (!localStorage.getItem('visitedBefore')) {
    setTimeout(() => {
      showGuideModal();
      localStorage.setItem('visitedBefore', 'true');
    }, 2000);
  }
  
  // Open modal from header button
  helpBtn.addEventListener('click', () => {
    showGuideModal();
  });
  
  // Open modal from mobile menu
  menuHelpBtn.addEventListener('click', () => {
    mobileMenu.classList.remove('active');
    menuToggle.classList.remove('active');
    showGuideModal();
  });
  
  // Close modal with X button
  closeBtn.addEventListener('click', () => {
    hideGuideModal();
  });
  
  // Close modal with footer button
  if (guideCloseBtn) {
    guideCloseBtn.addEventListener('click', () => {
      hideGuideModal();
    });
  }
  
  // Close modal when clicking outside
  window.addEventListener('click', (event) => {
    if (event.target === userGuideModal) {
      hideGuideModal();
    }
  });
  
  // Add animations on modal open
  userGuideModal.addEventListener('animationend', (e) => {
    if (e.target.classList.contains('modal-content')) {
      const sections = document.querySelectorAll('.guide-section');
      sections.forEach(section => {
        section.style.opacity = '1';
        section.style.transform = 'translateY(0)';
      });
    }
  });
  
  // Add keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && userGuideModal.style.display === 'block') {
      hideGuideModal();
    }
  });
}

function showGuideModal() {
  const userGuideModal = document.getElementById('userGuideModal');
  userGuideModal.style.display = 'block';
  document.body.style.overflow = 'hidden';
  
  // Reset section animations
  const sections = document.querySelectorAll('.guide-section');
  sections.forEach((section, index) => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.animationDelay = `${0.1 * (index + 1)}s`;
  });
}

function hideGuideModal() {
  const userGuideModal = document.getElementById('userGuideModal');
  userGuideModal.style.display = 'none';
  document.body.style.overflow = 'auto';
}