const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyhTgVSZRz2OBklNDfjBUUoSl_ah6-9-rYe97-XsY7aKW9Dah5k-C-Ffp7tGBt-PnqV/exec';

let currentView = 'table';
let currentSchools = [];
let schoolChart = null;

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
    row.innerHTML = `
      <td class="school-name">${school.name}</td>
      <td class="rate tooltip">${school.rate}<span class="tooltiptext">序位累積比率表示該校在全部學校中的相對位置</span></td>
      <td class="rank">${school.rank}</td>
    `;
    tableBody.appendChild(row);
  });
}

function sortTable(n) {
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

function showLoading() {
  document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loading').style.display = 'none';
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
  const csvContent = [
    headers.join(','),
    ...schools.map(school => `${school.name},${school.rate},${school.rank}`)
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = '學校序位資料.csv';
  link.click();
  showNotification('已成功匯出 CSV 檔案');
}

function initializeEventListeners() {
  const normalBtn = document.getElementById('normalBtn');
  const vocationalBtn = document.getElementById('vocationalBtn');
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');

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
  });

  document.addEventListener('click', (event) => {
    if (!mobileMenu.contains(event.target) && !menuToggle.contains(event.target)) {
      mobileMenu.classList.remove('active');
      menuToggle.classList.remove('active');
    }
  });

  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', (e) => filterSchools(e.target.value));

  const tableViewBtn = document.getElementById('tableViewBtn');
  const chartViewBtn = document.getElementById('chartViewBtn');
  const tableView = document.getElementById('tableView');
  const chartView = document.getElementById('chartView');

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

  document.getElementById('exportCSV').addEventListener('click', () => {
    exportToCSV(currentSchools);
  });

  document.getElementById('exportPDF').addEventListener('click', () => {
    showNotification('PDF 匯出功能即將推出');
  });

  document.addEventListener('copy', (e) => e.preventDefault());
  document.addEventListener('keyup', (e) => {
    if (e.key === 'PrintScreen') {
      navigator.clipboard.writeText('');
      alert('截圖功能已被禁用');
    }
  });
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  document.onselectstart = () => false;
}

async function fetchAndDisplayData(type) {
  const schools = await fetchSchoolData(type);
  currentSchools = schools;
  populateTable(schools);
  if (currentView === 'chart') {
    initializeChart(schools);
  }
  updateDataSummary(schools);
  return schools;
}

document.addEventListener('DOMContentLoaded', async () => {
  initializeEventListeners();
  const initialNormalSchools = await fetchAndDisplayData('normal');
  sortTable(2);
});