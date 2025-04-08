// guide.js - Handles the user guide modal functionality

document.addEventListener('DOMContentLoaded', () => {
  // Get modal elements
  const userGuideModal = document.getElementById('userGuideModal');
  const helpBtn = document.getElementById('helpBtn');
  const menuHelpBtn = document.getElementById('menuHelpBtn');
  const closeBtn = document.querySelector('.close-btn');
  const guideCloseBtn = document.querySelector('.guide-close-btn');
  const dontShowAgain = document.getElementById('dontShowAgain');
  const guideTabs = document.querySelector('.guide-tabs');
  const tabButtons = document.querySelectorAll('.guide-tab-btn');
  const tabContents = document.querySelectorAll('.guide-tab-content');

  // Open modal function
  function openGuideModal() {
    userGuideModal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    // Add animation to guide sections
    const sections = document.querySelectorAll('.guide-section');
    sections.forEach((section, index) => {
      section.style.opacity = '0';
      section.style.transform = 'translateY(20px)';

      // Staggered animation
      setTimeout(() => {
        section.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        section.style.opacity = '1';
        section.style.transform = 'translateY(0)';
      }, 100 * index);
    });
    
    // Adjust for mobile
    if (window.innerWidth <= 768) {
      const guideIcons = document.querySelectorAll('.guide-icon');
      guideIcons.forEach((icon, index) => {
        icon.style.transform = 'scale(0.8)';
        setTimeout(() => {
          icon.style.transition = 'transform 0.5s ease';
          icon.style.transform = 'scale(1)';
        }, 200 + (100 * index));
      });
    }
  }

  // Close modal function
  function closeGuideModal() {
    userGuideModal.style.display = 'none';
    document.body.style.overflow = 'auto';

    // Save preference if checked
    if (dontShowAgain && dontShowAgain.checked) {
      localStorage.setItem('dontShowGuide', 'true');
    }
  }

  // Tab switching functionality
  function switchTab(tabId) {
    // Update active tab button
    tabButtons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.tab === tabId) {
        btn.classList.add('active');
      }
    });

    // Update active tab content
    tabContents.forEach(content => {
      content.classList.remove('active');
      if (content.id === `${tabId}-tab`) {
        content.classList.add('active');
      }
    });

    // Update the indicator position
    guideTabs.dataset.activeTab = tabId;
  }

  // Event listeners
  helpBtn.addEventListener('click', openGuideModal);

  menuHelpBtn.addEventListener('click', () => {
    // First close the mobile menu
    const mobileMenu = document.querySelector('.mobile-menu');
    const menuToggle = document.querySelector('.menu-toggle');
    mobileMenu.classList.remove('active');
    menuToggle.classList.remove('active');

    // Then open modal
    openGuideModal();
  });

  closeBtn.addEventListener('click', closeGuideModal);
  guideCloseBtn.addEventListener('click', closeGuideModal);

  window.addEventListener('click', (event) => {
    if (event.target === userGuideModal) {
      closeGuideModal();
    }
  });

  // Tab switching
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.dataset.tab;
      switchTab(tabId);
    });
  });

  // Show help guide on first visit unless opted out
  window.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('dontShowGuide') && !localStorage.getItem('visitedBefore')) {
      setTimeout(() => {
        openGuideModal();
        localStorage.setItem('visitedBefore', 'true');
      }, 2000);
    }
  });

  // Add keyboard support
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && userGuideModal.style.display === 'block') {
      closeGuideModal();
    }
  });
});