// guide.js - 處理使用說明模態框功能

document.addEventListener('DOMContentLoaded', () => {
  // 獲取模態框元素
  const userGuideModal = document.getElementById('userGuideModal');
  const helpBtn = document.getElementById('helpBtn');
  const menuHelpBtn = document.getElementById('menuHelpBtn');
  const closeBtn = document.querySelector('.close-btn');
  const guideCloseBtn = document.querySelector('.guide-close-btn');
  const dontShowAgain = document.getElementById('dontShowAgain');
  const guideTabs = document.querySelector('.guide-tabs');
  const tabButtons = document.querySelectorAll('.guide-tab-btn');
  const tabContents = document.querySelectorAll('.guide-tab-content');

  // 開啟模態框函數
  function openGuideModal() {
    userGuideModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // 添加模態框進入動畫
    setTimeout(() => {
      userGuideModal.classList.add('active');
    }, 10);

    // 為指南部分添加動畫
    const sections = document.querySelectorAll('.guide-section');
    sections.forEach((section, index) => {
      section.style.opacity = '0';
      section.style.transform = 'translateY(20px)';

      // 錯開動畫時間
      setTimeout(() => {
        section.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        section.style.opacity = '1';
        section.style.transform = 'translateY(0)';
      }, 150 * index);
    });
    
    // 為示範元素添加動畫
    const demoElements = document.querySelectorAll('.guide-demo');
    demoElements.forEach((demo, index) => {
      demo.style.opacity = '0';
      demo.style.transform = 'scale(0.95)';
      
      setTimeout(() => {
        demo.style.transition = 'all 0.5s ease';
        demo.style.opacity = '1';
        demo.style.transform = 'scale(1)';
      }, 300 + (100 * index));
    });
    
    // 為行動裝置調整
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

  // 關閉模態框函數
  function closeGuideModal() {
    // 添加退出動畫
    userGuideModal.classList.remove('active');
    
    // 等待動畫完成後隱藏模態框
    setTimeout(() => {
      userGuideModal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }, 300);

    // 如果勾選了不再顯示，則儲存設定
    if (dontShowAgain && dontShowAgain.checked) {
      localStorage.setItem('dontShowGuide', 'true');
    }
  }

  // 切換分頁功能
  function switchTab(tabId) {
    // 更新活動分頁按鈕
    tabButtons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.tab === tabId) {
        btn.classList.add('active');
      }
    });

    // 準備切換前的動畫
    tabContents.forEach(content => {
      if (content.classList.contains('active')) {
        content.style.opacity = '1';
        content.style.transform = 'translateY(0)';
        
        // 淡出動畫
        content.style.opacity = '0';
        content.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
          content.classList.remove('active');
          
          // 顯示新分頁
          const newContent = document.getElementById(`${tabId}-tab`);
          if (newContent) {
            newContent.classList.add('active');
            newContent.style.opacity = '0';
            newContent.style.transform = 'translateY(10px)';
            
            // 淡入動畫
            setTimeout(() => {
              newContent.style.transition = 'all 0.4s ease';
              newContent.style.opacity = '1';
              newContent.style.transform = 'translateY(0)';
              
              // 為新分頁中的元素添加動畫
              animateTabContent(newContent);
            }, 50);
          }
        }, 200);
      }
    });
  }
  
  // 為分頁內容添加動畫
  function animateTabContent(tabContent) {
    const sections = tabContent.querySelectorAll('.guide-section');
    sections.forEach((section, index) => {
      section.style.opacity = '0';
      section.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        section.style.transition = 'all 0.5s ease';
        section.style.opacity = '1';
        section.style.transform = 'translateY(0)';
      }, 100 * index);
    });
    
    const demos = tabContent.querySelectorAll('.guide-demo');
    demos.forEach((demo, index) => {
      demo.style.opacity = '0';
      demo.style.transform = 'scale(0.95)';
      
      setTimeout(() => {
        demo.style.transition = 'all 0.4s ease';
        demo.style.opacity = '1';
        demo.style.transform = 'scale(1)';
      }, 300 + (100 * index));
    });
  }

  // 事件監聽器
  helpBtn.addEventListener('click', openGuideModal);

  menuHelpBtn.addEventListener('click', () => {
    // 先關閉行動選單
    const mobileMenu = document.querySelector('.mobile-menu');
    const menuToggle = document.querySelector('.menu-toggle');
    mobileMenu.classList.remove('active');
    menuToggle.classList.remove('active');

    // 然後開啟模態框
    openGuideModal();
  });

  closeBtn.addEventListener('click', closeGuideModal);
  guideCloseBtn.addEventListener('click', closeGuideModal);

  window.addEventListener('click', (event) => {
    if (event.target === userGuideModal) {
      closeGuideModal();
    }
  });

  // 分頁切換
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.dataset.tab;
      switchTab(tabId);
    });
  });

  // 互動示範元素
  const demoButtons = document.querySelectorAll('.demo-btn, .tab-demo-btn');
  demoButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const parent = this.parentElement;
      const buttons = parent.querySelectorAll('button');
      
      buttons.forEach(button => button.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // 首次訪問時顯示使用說明，除非已選擇不再顯示
  window.addEventListener('load', () => {
    if (!localStorage.getItem('dontShowGuide') && !localStorage.getItem('visitedBefore')) {
      setTimeout(() => {
        openGuideModal();
        localStorage.setItem('visitedBefore', 'true');
      }, 1500);
    }
  });

  // 添加鍵盤支援
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && userGuideModal.style.display === 'block') {
      closeGuideModal();
    }
    
    // 使用左右方向鍵切換分頁
    if (userGuideModal.style.display === 'block') {
      const activeTab = document.querySelector('.guide-tab-btn.active');
      if (activeTab) {
        const tabs = Array.from(tabButtons);
        const currentIndex = tabs.indexOf(activeTab);
        
        if (e.key === 'ArrowRight' && currentIndex < tabs.length - 1) {
          switchTab(tabs[currentIndex + 1].dataset.tab);
        } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
          switchTab(tabs[currentIndex - 1].dataset.tab);
        }
      }
    }
  });
  
  // 添加觸控滑動支援
  let touchStartX = 0;
  let touchEndX = 0;
  
  const handleSwipe = (container) => {
    container.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, false);
    
    container.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipeGesture();
    }, false);
  };
  
  const handleSwipeGesture = () => {
    if (userGuideModal.style.display === 'block') {
      const activeTab = document.querySelector('.guide-tab-btn.active');
      if (activeTab) {
        const tabs = Array.from(tabButtons);
        const currentIndex = tabs.indexOf(activeTab);
        
        // 向左滑動 (下一個分頁)
        if (touchEndX < touchStartX - 50 && currentIndex < tabs.length - 1) {
          switchTab(tabs[currentIndex + 1].dataset.tab);
        }
        // 向右滑動 (上一個分頁)
        else if (touchEndX > touchStartX + 50 && currentIndex > 0) {
          switchTab(tabs[currentIndex - 1].dataset.tab);
        }
      }
    }
  };
  
  // 為指南內容容器添加滑動支援
  const guideContainer = document.querySelector('.guide-sections-container');
  if (guideContainer) {
    handleSwipe(guideContainer);
  }
  
  // 為CSS添加動畫類
  const style = document.createElement('style');
  style.textContent = `
    .modal {
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .modal.active {
      opacity: 1;
    }
    .guide-tab-content {
      transition: opacity 0.4s ease, transform 0.4s ease;
    }
  `;
  document.head.appendChild(style);
});