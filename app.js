const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyhTgVSZRz2OBklNDfjBUUoSl_ah6-9-rYe97-XsY7aKW9Dah5k-C-Ffp7tGBt-PnqV/exec';

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

function initializeEventListeners() {
  const normalBtn = document.getElementById('normalBtn');
  const vocationalBtn = document.getElementById('vocationalBtn');
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');

  normalBtn.addEventListener('click', async () => {
    const normalSchools = await fetchSchoolData('normal');
    populateTable(normalSchools);
    normalBtn.classList.add('active');
    vocationalBtn.classList.remove('active');
    sortTable(2);
  });

  vocationalBtn.addEventListener('click', async () => {
    const vocationalSchools = await fetchSchoolData('vocational');
    populateTable(vocationalSchools);
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

  // Security features
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

document.addEventListener('DOMContentLoaded', async () => {
  initializeEventListeners();
  const initialNormalSchools = await fetchSchoolData('normal');
  populateTable(initialNormalSchools);
  sortTable(2);
});