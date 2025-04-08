const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyhTgVSZRz2OBklNDfjBUUoSl_ah6-9-rYe97-XsY7aKW9Dah5k-C-Ffp7tGBt-PnqV/exec';

let currentView = 'table';
let currentSchools = [];
let schoolChart = null;

window.sortTable = function(n) {
  var table = document.getElementById("schoolTable");
  var switching = true;
  var dir = "asc";
  var switchcount = 0;

  while (switching) {
    switching = false;
    var rows = table.rows;

    for (var i = 1; i < (rows.length - 1); i++) {
      var shouldSwitch = false;
      var x = rows[i].getElementsByTagName("TD")[n];
      var y = rows[i + 1].getElementsByTagName("TD")[n];

      var comparison = dir === "asc" ? 
        (n === 0 ? x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase() : 
                   parseFloat(x.innerHTML) > parseFloat(y.innerHTML)) :
        (n === 0 ? x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase() : 
                   parseFloat(x.innerHTML) < parseFloat(y.innerHTML));

      if (comparison) {
        shouldSwitch = true;
        break;
      }
    }

    if (shouldSwitch) {
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
      switchcount++;
    } else if (switchcount === 0 && dir === "asc") {
      dir = "desc";
      switching = true;
    }
  }
}

async function fetchSchoolData(type) {
  showLoading();
  try {
    const response = await fetch(`${SCRIPT_URL}?type=${type}`);
    const data = await response.json();
    hideLoading();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    hideLoading();
    return [];
  }
}

function populateTable(schools) {
  const tableBody = document.getElementById('tableBody');
  tableBody.innerHTML = '';
  schools.forEach((school, index) => {
    const row = document.createElement('tr');
    row.className = 'fade-in';
    row.style.animationDelay = `${index * 0.05}s`;
    
    // Add data-attributes for mobile view
    row.innerHTML = `
      <td class="school-name" data-label="學校名稱">${school.name}</td>
      <td class="rate tooltip" data-label="序位累積比率">${school.rate}<span class="tooltiptext">序位累積比率表示該校在全部學校中的相對位置</span></td>
      <td class="rank" data-label="序位累積人數">${school.rank}</td>
    `;
    tableBody.appendChild(row);
  });
}

function showLoading() {
  document.getElementById('loading').style.display = 'flex';
  
  // Add staggered animation to loader text
  const loaderTextSpans = document.querySelectorAll('.loader-text span');
  loaderTextSpans.forEach((span, index) => {
    span.style.opacity = '0';
    setTimeout(() => {
      span.style.opacity = '1';
    }, 150 * index);
  });
}

function hideLoading() {
  // Fade out effect
  const loader = document.getElementById('loading');
  loader.style.opacity = '0';
  loader.style.transition = 'opacity 0.5s ease';
  
  setTimeout(() => {
    loader.style.display = 'none';
    loader.style.opacity = '1';
  }, 500);
}

function initializeChart(schools) {
  const ctx = document.getElementById('schoolChart').getContext('2d');
  if (schoolChart) {
    schoolChart.destroy();
  }
  
  schoolChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: schools.map(school => school.name),
      datasets: [{
        label: '序位累積人數',
        data: schools.map(school => school.rank),
        backgroundColor: 'rgba(74, 144, 226, 0.6)',
        borderColor: 'rgba(74, 144, 226, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function updateDataSummary(schools) {
  const totalSchools = schools.length;
  const averageRank = (schools.reduce((sum, school) => sum + parseFloat(school.rank), 0) / totalSchools).toFixed(0);
  const averageRate = (schools.reduce((sum, school) => sum + parseFloat(school.rate), 0) / totalSchools).toFixed(2);

  document.getElementById('totalSchools').textContent = totalSchools;
  document.getElementById('averageRank').textContent = averageRank;
  document.getElementById('averageRate').textContent = `${averageRate}%`;
}

function filterSchools(searchText) {
  const filteredSchools = currentSchools.filter(school => 
    school.name.toLowerCase().includes(searchText.toLowerCase())
  );
  populateTable(filteredSchools);
  if (currentView === 'chart') {
    initializeChart(filteredSchools);
  }
  updateDataSummary(filteredSchools);
}

function showNotification(message) {
  const notification = document.getElementById('notification');
  const notificationText = document.getElementById('notificationText');
  notificationText.textContent = message;
  notification.classList.add('show');
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

function exportToCSV(schools) {
  const headers = ['學校名稱', '序位累積比率', '序位累積人數'];
  const watermark = 'Data Source: https://rcpett.vercel.app/';
  const title = document.getElementById('normalBtn').classList.contains('active') ? '桃園市高中普通科序位資料' : '桃園市高職職業類科序位資料';
  const dateString = new Date().toLocaleDateString('zh-TW');
  
  const csvContent = [
    watermark,
    `${title} - 產生日期: ${dateString}`,
    '',
    headers.join(','),
    ...schools.map(school => `"${school.name}",${school.rate},${school.rank}`)
  ].join('\n');

  // Add UTF-8 BOM to ensure correct Chinese character display
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${title}_${dateString}.csv`;
  link.click();
  showNotification('已成功匯出 CSV 檔案');
}

function exportToPDF() {
  const isPrintSaveAsPDF = window.confirm('請使用瀏覽器的列印功能，選擇「另存為 PDF」來完成匯出。按確定繼續。');
  
  if (!isPrintSaveAsPDF) {
    showNotification('已取消 PDF 匯出');
    return;
  }
  
  // Create a styled version for PDF export
  const printContent = document.createElement('div');
  printContent.className = 'pdf-export-content';
  
  // Add header with logo and title
  const header = document.createElement('div');
  header.className = 'pdf-header';
  const title = document.getElementById('normalBtn').classList.contains('active') ? '桃園市高中普通科序位資料' : '桃園市高職職業類科序位資料';
  const dateString = new Date().toLocaleDateString('zh-TW');
  
  header.innerHTML = `
    <div class="pdf-logo"><i class="fas fa-chart-bar"></i> TYCTW 會考分析</div>
    <h1>${title}</h1>
    <p>產生日期: ${dateString}</p>
  `;
  
  // Create styled table
  const table = document.createElement('table');
  table.className = 'pdf-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>學校名稱</th>
        <th>序位累積比率</th>
        <th>序位累積人數</th>
      </tr>
    </thead>
    <tbody>
      ${currentSchools.map(school => `
        <tr>
          <td>${school.name}</td>
          <td>${school.rate}%</td>
          <td>${school.rank}</td>
        </tr>
      `).join('')}
    </tbody>
  `;
  
  // Add footer with watermark
  const footer = document.createElement('div');
  footer.className = 'pdf-footer';
  footer.innerHTML = `
    <p>資料來源: https://rcpett.vercel.app/</p>
    <p>  ${new Date().getFullYear()} TYCTW 桃園市高中職序位分析</p>
  `;
  
  // Add summary info
  const summary = document.createElement('div');
  summary.className = 'pdf-summary';
  summary.innerHTML = `
    <div class="summary-item">
      <h3>總學校數</h3>
      <p>${currentSchools.length}</p>
    </div>
    <div class="summary-item">
      <h3>平均序位人數</h3>
      <p>${(currentSchools.reduce((sum, school) => sum + parseFloat(school.rank), 0) / currentSchools.length).toFixed(0)}</p>
    </div>
    <div class="summary-item">
      <h3>平均比率</h3>
      <p>${(currentSchools.reduce((sum, school) => sum + parseFloat(school.rate), 0) / currentSchools.length).toFixed(2)}%</p>
    </div>
  `;
  
  // Assemble all parts
  printContent.appendChild(header);
  printContent.appendChild(table);
  printContent.appendChild(summary);
  printContent.appendChild(footer);
  
  // Add styles for PDF export
  const style = document.createElement('style');
  style.textContent = `
    .pdf-export-content {
      font-family: 'Noto Sans TC', sans-serif;
      padding: 20px;
      color: #333;
    }
    .pdf-header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #4a90e2;
    }
    .pdf-logo {
      font-size: 24px;
      font-weight: bold;
      color: #4a90e2;
      margin-bottom: 10px;
    }
    .pdf-header h1 {
      margin: 10px 0;
      color: #2c3e50;
    }
    .pdf-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .pdf-table th {
      background-color: #4a90e2;
      color: white;
      padding: 12px;
      text-align: left;
    }
    .pdf-table td {
      padding: 10px;
      border-bottom: 1px solid #e0e0e0;
    }
    .pdf-table tr:nth-child(even) {
      background-color: #f8f9fa;
    }
    .pdf-summary {
      display: flex;
      justify-content: space-around;
      margin: 30px 0;
    }
    .summary-item {
      text-align: center;
      padding: 15px;
      background-color: #f0f4f8;
      border-radius: 8px;
      min-width: 150px;
    }
    .summary-item h3 {
      margin: 0 0 10px 0;
      color: #2c3e50;
    }
    .summary-item p {
      font-size: 24px;
      font-weight: bold;
      color: #4a90e2;
      margin: 0;
    }
    .pdf-footer {
      margin-top: 30px;
      text-align: center;
      font-size: 12px;
      color: #666;
      border-top: 1px solid #e0e0e0;
      padding-top: 15px;
    }
    @media print {
      body * {
        visibility: hidden;
      }
      .pdf-export-content, .pdf-export-content * {
        visibility: visible;
      }
      .pdf-export-content {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
      }
    }
  `;
  
  // Append to body, print, then remove
  document.body.appendChild(style);
  document.body.appendChild(printContent);
  
  setTimeout(() => {
    window.print();
    
    // Clean up after printing
    document.body.removeChild(printContent);
    document.body.removeChild(style);
    
    showNotification('PDF 匯出完成');
  }, 300);
}

function printData() {
  // Add print header with date and watermark
  const printHeader = document.createElement('div');
  printHeader.className = 'printHeader';
  const now = new Date();
  const dateString = now.toLocaleDateString('zh-TW', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
  
  printHeader.innerHTML = `
    <h2>桃園市高中職序位報表</h2>
    <p>產生日期: ${dateString}</p>
    <p>資料類型: ${document.getElementById('normalBtn').classList.contains('active') ? '普通科' : '職業類科'}</p>
    <p class="watermark">Data Source: https://rcpett.vercel.app/</p>
  `;
  
  document.body.prepend(printHeader);
  
  // Print the page
  window.print();
  
  // Remove the header after printing
  setTimeout(() => {
    document.body.removeChild(printHeader);
  }, 100);
  
  showNotification('正在準備列印...');
}

function initializeEventListeners() {
  const normalBtn = document.getElementById('normalBtn');
  const vocationalBtn = document.getElementById('vocationalBtn');
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const menuCloseBtn = document.querySelector('.menu-close');
  const menuExportCSV = document.getElementById('menuExportCSV');
  const menuExportPDF = document.getElementById('menuExportPDF');
  const menuPrintButton = document.getElementById('menuPrintButton');
  const tableViewBtn = document.getElementById('tableViewBtn');
  const chartViewBtn = document.getElementById('chartViewBtn');
  const tableView = document.getElementById('tableView');
  const chartView = document.getElementById('chartView');
  const exportCSV = document.getElementById('exportCSV');
  const exportPDF = document.getElementById('exportPDF');
  const printButton = document.getElementById('printButton');
  const searchInput = document.getElementById('searchInput');

  // Mobile menu close button
  menuCloseBtn.addEventListener('click', () => {
    mobileMenu.classList.remove('active');
    menuToggle.classList.remove('active');
    document.body.style.overflow = ''; // Restore body scrolling
  });
  
  // Menu export buttons
  menuExportCSV.addEventListener('click', () => {
    mobileMenu.classList.remove('active');
    menuToggle.classList.remove('active');
    exportToCSV(currentSchools);
  });
  
  menuExportPDF.addEventListener('click', () => {
    mobileMenu.classList.remove('active');
    menuToggle.classList.remove('active');
    exportToPDF();
  });
  
  menuPrintButton.addEventListener('click', () => {
    mobileMenu.classList.remove('active');
    menuToggle.classList.remove('active');
    printData();
  });

  normalBtn.addEventListener('click', async () => {
    const normalSchools = await fetchAndDisplayData('normal');
    normalBtn.classList.add('active');
    vocationalBtn.classList.remove('active');
    sortTable(2);
  });

  vocationalBtn.addEventListener('click', async () => {
    const vocationalSchools = await fetchAndDisplayData('vocational');
    vocationalBtn.classList.add('active');
    normalBtn.classList.remove('active');
    sortTable(2);
  });

  menuToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
    menuToggle.classList.toggle('active');
    
    // Toggle body scrolling
    if (mobileMenu.classList.contains('active')) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  });

  document.addEventListener('click', (event) => {
    if (!mobileMenu.contains(event.target) && !menuToggle.contains(event.target)) {
      mobileMenu.classList.remove('active');
      menuToggle.classList.remove('active');
      document.body.style.overflow = ''; // Restore body scrolling
    }
  });

  searchInput.addEventListener('input', (e) => filterSchools(e.target.value));

  // Mobile search focus behavior
  if (searchInput) {
    searchInput.addEventListener('focus', (e) => {
      if (window.innerWidth <= 480) {
        document.querySelector('.search-container').classList.add('active');
      }
    });
    
    searchInput.addEventListener('blur', (e) => {
      document.querySelector('.search-container').classList.remove('active');
    });
  }
  
  tableViewBtn.addEventListener('click', () => {
    currentView = 'table';
    tableView.classList.add('active');
    chartView.classList.remove('active');
    tableViewBtn.classList.add('active');
    chartViewBtn.classList.remove('active');
  });

  chartViewBtn.addEventListener('click', () => {
    currentView = 'chart';
    chartView.classList.add('active');
    tableView.classList.remove('active');
    chartViewBtn.classList.add('active');
    tableViewBtn.classList.remove('active');
    initializeChart(currentSchools);
  });

  exportCSV.addEventListener('click', () => {
    exportToCSV(currentSchools);
  });

  exportPDF.addEventListener('click', () => {
    exportToPDF();
  });
  
  printButton.addEventListener('click', printData);

  document.addEventListener('copy', (e) => e.preventDefault());
  document.addEventListener('keyup', (e) => {
    if (e.key === 'PrintScreen') {
      navigator.clipboard.writeText('');
      alert('截圖功能已被禁用');
    }
  });
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  document.onselectstart = () => false;

  // Add touch event handling for mobile swipe
  let touchStartX = 0;
  let touchEndX = 0;
  
  const container = document.querySelector('.container');
  
  container.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
  });
  
  container.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  });
  
  function handleSwipe() {
    if (touchEndX - touchStartX > 100) {
      // Swipe right - show table view
      if (currentView !== 'table') {
        currentView = 'table';
        tableView.classList.add('active');
        chartView.classList.remove('active');
        tableViewBtn.classList.add('active');
        chartViewBtn.classList.remove('active');
      }
    } else if (touchStartX - touchEndX > 100) {
      // Swipe left - show chart view
      if (currentView !== 'chart') {
        currentView = 'chart';
        chartView.classList.add('active');
        tableView.classList.remove('active');
        chartViewBtn.classList.add('active');
        tableViewBtn.classList.remove('active');
        initializeChart(currentSchools);
      }
    }
  }

  // Add touch event for mobile scrolling hint
  const mobileHint = document.querySelector('.mobile-swipe-hint');
  if (mobileHint) {
    const tableResponsive = document.querySelector('.table-responsive');
    if (tableResponsive) {
      tableResponsive.addEventListener('scroll', () => {
        // Hide hint when user has scrolled
        if (mobileHint.style.opacity !== '0') {
          mobileHint.style.opacity = '0';
          mobileHint.style.transition = 'opacity 0.5s ease';
          
          setTimeout(() => {
            mobileHint.style.display = 'none';
          }, 500);
        }
      });
    }
  }
  
  // Handle orientation change to refresh layout
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      if (currentView === 'chart' && schoolChart) {
        schoolChart.resize();
      }
    }, 300);
  });

  window.addEventListener('appLoaded', function(e) {
    if (currentSchools.length > 0) {
      document.title = `桃園市高中職序位 - ${currentSchools.length}所學校資料分析 | TYCTW`;
    }
  });
}

async function fetchAndDisplayData(type) {
  const schools = await fetchSchoolData(type);
  currentSchools = schools;
  populateTable(schools);
  if (currentView === 'chart') {
    initializeChart(schools);
  }
  updateDataSummary(schools);
  
  // Update meta description with current data
  const typeText = type === 'normal' ? '普通科' : '職業類科';
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', 
      `桃園市高中職${typeText}會考序位分析平台，顯示${schools.length}所學校的最新排名與序位數據。更新日期：${new Date().toLocaleDateString('zh-TW')}`);
  }
  
  // Dispatch event that app is loaded with data
  window.dispatchEvent(new CustomEvent('appLoaded'));
  
  return schools;
}

document.addEventListener('DOMContentLoaded', async () => {
  initializeEventListeners();
  const initialNormalSchools = await fetchAndDisplayData('normal');
  sortTable(2);
});