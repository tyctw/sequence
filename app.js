const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbyhTgVSZRz2OBklNDfjBUUoSl_ah6-9-rYe97-XsY7aKW9Dah5k-C-Ffp7tGBt-PnqV/exec';
const TOTAL_CANDIDATES = 16206;

// State Management
const state = {
    schools: [],
    loading: true,
    error: '',
    searchTerm: '',
    sortField: 'percent',
    sortDirection: 'asc',
    viewMode: 'list', // 'list' or 'chart'
    filterType: 'all', // 'all', 'general', 'vocational'
    onlyFavorites: false,
    minPercent: '',
    maxPercent: '',
    favorites: new Set(),
    chartInstance: null
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Load favorites
    const savedFavs = localStorage.getItem('school_favorites');
    if (savedFavs) {
        state.favorites = new Set(JSON.parse(savedFavs));
    }

    // Set Date
    const dateEl = document.getElementById('print-date');
    if(dateEl) dateEl.textContent = new Date().toLocaleDateString();
    
    const yearEl = document.getElementById('copyright-year');
    if(yearEl) yearEl.textContent = new Date().getFullYear();

    // Attach Event Listeners
    attachEventListeners();

    // Fetch Data
    fetchData();
});

// Fetch Data
async function fetchData() {
    if (!GAS_API_URL) {
        showError('系統設定錯誤：未設定資料來源網址。');
        return;
    }

    try {
        const [normalResponse, vocationalResponse] = await Promise.all([
            fetch(`${GAS_API_URL}?type=normal`),
            fetch(`${GAS_API_URL}?type=vocational`)
        ]);

        if (!normalResponse.ok || !vocationalResponse.ok) {
            throw new Error(`HTTP error! status: ${normalResponse.status} / ${vocationalResponse.status}`);
        }

        const normalJson = await normalResponse.json();
        const vocationalJson = await vocationalResponse.json();

        if (normalJson.error || vocationalJson.error) {
            throw new Error(normalJson.error || vocationalJson.error);
        }

        const processApiItem = (item, index, category) => {
            const parts = item.name.split('(');
            const schoolName = parts[0];
            let department = parts[1] ? parts[1].replace(')', '') : '';
            if (!department) {
                department = category === 'general' ? '普通科' : '職業類科';
            }

            const count = Number(String(item.rank).replace(/,/g, ''));
            const percent = Number.isFinite(count)
                ? Number(((count / TOTAL_CANDIDATES) * 100).toFixed(2))
                : 0;

            return {
                id: `${category}-${index}`,
                name: item.name,
                schoolName,
                department,
                percent,
                count,
                category: category
            };
        };

        const normalSchools = Array.isArray(normalJson) 
            ? normalJson.map((item, i) => processApiItem(item, i, 'general')) 
            : [];
            
        const vocationalSchools = Array.isArray(vocationalJson) 
            ? vocationalJson.map((item, i) => processApiItem(item, i, 'vocational')) 
            : [];

        state.schools = [...normalSchools, ...vocationalSchools];
        state.loading = false;
        
        updateUI();

    } catch (err) {
        console.error("Fetch error:", err);
        showError('無法取得資料，請檢查網路連線或稍後再試。');
    }
}

// UI Updates
function updateUI() {
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const contentArea = document.getElementById('content-area');

    if (state.loading) {
        loadingState.classList.remove('hidden');
        errorState.classList.add('hidden');
        contentArea.classList.add('hidden');
        return;
    }

    if (state.error) {
        loadingState.classList.add('hidden');
        errorState.classList.remove('hidden');
        contentArea.classList.add('hidden');
        document.getElementById('error-message').textContent = state.error;
        return;
    }

    loadingState.classList.add('hidden');
    errorState.classList.add('hidden');
    contentArea.classList.remove('hidden');

    const processedData = getProcessedData();

    // Render Data content
    renderListView(processedData);
    renderMobileCards(processedData);
    renderSortIcons();
    updateFilterButtons();

    // The results are shown as a list only.
    const listViewContainer = document.getElementById('list-view-container');
    if (listViewContainer) listViewContainer.classList.remove('hidden');


    // Empty State visibility
    const emptyState = document.getElementById('empty-state');
    if (processedData.length === 0 && state.viewMode === 'list') {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
    }

    // Re-init icons
    if (window.lucide) {
        lucide.createIcons();
    }
}

function getProcessedData() {
    let data = [...state.schools];

    if (state.searchTerm) {
        const term = state.searchTerm.toLowerCase();
        data = data.filter(s => s.name.toLowerCase().includes(term));
    }

    if (state.filterType !== 'all') {
        data = data.filter(s => s.category === state.filterType);
    }

    if (state.onlyFavorites) {
        data = data.filter(s => state.favorites.has(s.id));
    }

    if (state.minPercent) {
        const min = parseFloat(state.minPercent);
        if (!isNaN(min)) data = data.filter(s => s.percent >= min);
    }
    if (state.maxPercent) {
        const max = parseFloat(state.maxPercent);
        if (!isNaN(max)) data = data.filter(s => s.percent <= max);
    }

    data.sort((a, b) => {
        let valA = a[state.sortField];
        let valB = b[state.sortField];
        
        if (state.sortField === 'name') {
            return state.sortDirection === 'asc' 
                ? valA.localeCompare(valB) 
                : valB.localeCompare(valA);
        }

        if (valA > valB) return state.sortDirection === 'asc' ? 1 : -1;
        if (valA < valB) return state.sortDirection === 'asc' ? -1 : 1;
        return 0;
    });

    return data;
}

function renderListView(data) {
    const container = document.getElementById('table-body');
    if (!container) return;
    container.innerHTML = '';

    data.forEach((school, index) => {
        const isFav = state.favorites.has(school.id);
        
        // Progress Bar & Colors
        let progressGradient = 'from-emerald-400 to-teal-500';
        let progressShadow = 'shadow-teal-500/20';
        let percentColor = 'text-emerald-600';
        
        if (school.percent < 20) {
            progressGradient = 'from-rose-400 to-red-500';
            progressShadow = 'shadow-rose-500/20';
            percentColor = 'text-rose-600';
        } else if (school.percent < 50) {
            progressGradient = 'from-amber-400 to-orange-500';
            progressShadow = 'shadow-orange-500/20';
            percentColor = 'text-amber-600';
        }
        const width = Math.min(school.percent, 100);

        const badgeClass = school.category === 'general' 
            ? 'bg-indigo-50 text-indigo-600 border-indigo-100 ring-indigo-500/10'
            : 'bg-emerald-50 text-emerald-600 border-emerald-100 ring-emerald-500/10';
        const categoryText = school.category === 'general' ? '普通科' : '職業類科';

        // Create a Div for "Floating Row"
        const rowDiv = document.createElement('div');
        rowDiv.className = `glass-card rounded-2xl p-4 flex items-center gap-4 hover:-translate-y-1 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5 group animate-fade-in`;
        rowDiv.style.animationDelay = `${Math.min(index * 0.05, 1)}s`;

        rowDiv.innerHTML = `
            <!-- Favorite -->
            <div class="w-12 flex justify-center shrink-0">
                <button onclick="toggleFavorite('${school.id}')" class="p-2.5 rounded-full transition-all duration-300 transform active:scale-90 ${isFav ? 'bg-amber-50 text-amber-400 shadow-sm ring-2 ring-amber-100' : 'text-slate-300 hover:text-amber-400 hover:bg-slate-50'}">
                    <i data-lucide="star" class="w-5 h-5 ${isFav ? 'fill-amber-400' : ''}"></i>
                </button>
            </div>

            <!-- Name -->
            <div class="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
                <div class="col-span-3">
                    <h4 class="font-bold text-slate-800 text-base leading-tight group-hover:text-indigo-600 transition-colors">${school.schoolName}</h4>
                    <span class="text-xs font-semibold text-slate-400 mt-1 inline-block bg-slate-100 px-2 py-0.5 rounded-md">${school.department}</span>
                </div>

                <!-- Percent Bar -->
                <div class="col-span-3">
                    <div class="flex flex-col gap-1.5">
                        <div class="flex items-center gap-2">
                            <span class="font-extrabold text-lg ${percentColor} tabular-nums">${school.percent}</span>
                            <span class="text-xs font-bold text-slate-400">%</span>
                        </div>
                        <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                            <div class="h-full rounded-full bg-gradient-to-r shadow-lg ${progressGradient} ${progressShadow} progress-stripes" style="width: ${width}%"></div>
                        </div>
                    </div>
                </div>

                <!-- Count -->
                <div class="col-span-2 flex items-center gap-2">
                    <div class="p-1.5 bg-slate-50 rounded-lg text-slate-400">
                        <i data-lucide="users" class="w-4 h-4"></i>
                    </div>
                    <span class="font-mono font-bold text-slate-600 tabular-nums">${school.count.toLocaleString()}</span>
                </div>

                <!-- Actions -->
                <div class="col-span-4 flex items-center justify-end gap-3">
                    <span class="inline-flex px-3 py-1 rounded-full text-xs font-extrabold border ring-1 ring-inset ${badgeClass}">
                        ${categoryText}
                    </span>
                    <div class="h-8 w-px bg-slate-200 mx-1 no-print"></div>
                    <div class="flex gap-1 no-print">
                        <button onclick="openGoogleSearch('${school.name}')" class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Google 搜尋">
                            <i data-lucide="search" class="w-4 h-4"></i>
                        </button>
                        <button onclick="openGoogleMaps('${school.schoolName}')" class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Google 地圖">
                            <i data-lucide="map-pin" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(rowDiv);
    });
}

function renderMobileCards(data) {
    const container = document.getElementById('mobile-cards-container');
    if (!container) return;
    container.innerHTML = '';

    data.forEach((school, index) => {
        const isFav = state.favorites.has(school.id);
        
        let progressGradient = 'from-emerald-400 to-teal-500';
        let percentColor = 'text-emerald-600';
        
        if (school.percent < 20) {
            progressGradient = 'from-rose-400 to-red-500';
            percentColor = 'text-rose-600';
        } else if (school.percent < 50) {
            progressGradient = 'from-amber-400 to-orange-500';
            percentColor = 'text-amber-600';
        }

        const badgeClass = school.category === 'general' 
            ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
            : 'bg-emerald-50 text-emerald-600 border-emerald-100';
        const categoryText = school.category === 'general' ? '普通' : '職科';

        const div = document.createElement('div');
        div.className = `glass-card rounded-[1.5rem] p-5 relative overflow-hidden active:scale-[0.99] transition-all duration-300 animate-fade-in shadow-sm hover:shadow-md border border-white/60`;
        div.style.animationDelay = `${Math.min(index * 0.05, 1)}s`;

        div.innerHTML = `
            <div class="absolute top-0 right-0 p-20 bg-gradient-to-br ${school.category === 'general' ? 'from-indigo-50/50 to-blue-50/20' : 'from-emerald-50/50 to-teal-50/20'} rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

            <div class="relative z-10">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex gap-3">
                         <button onclick="toggleFavorite('${school.id}')" class="mt-1 p-2 h-fit rounded-full transition-all ${isFav ? 'bg-amber-50 text-amber-400 shadow-sm ring-1 ring-amber-100' : 'text-slate-300 bg-slate-50'}">
                            <i data-lucide="star" class="w-5 h-5 ${isFav ? 'fill-amber-400' : ''}"></i>
                        </button>
                        <div>
                            <h3 class="text-lg font-extrabold text-slate-800 leading-tight">${school.schoolName}</h3>
                            <span class="text-xs font-bold text-slate-500 mt-1 inline-block bg-slate-100/80 px-2 py-0.5 rounded-md">${school.department}</span>
                        </div>
                    </div>
                    <span class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold border shadow-sm ${badgeClass}">
                        ${categoryText}
                    </span>
                </div>

                <div class="space-y-3">
                    <!-- Stats Block -->
                    <div class="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
                         <div class="flex flex-col gap-1">
                            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">錄取比率</span>
                            <div class="flex items-baseline gap-1">
                                <span class="text-2xl font-black ${percentColor} tracking-tight">${school.percent}</span>
                                <span class="text-xs font-bold text-slate-400">%</span>
                            </div>
                         </div>
                         <div class="h-10 w-px bg-slate-200"></div>
                         <div class="flex flex-col gap-1 text-right">
                            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">累積人數</span>
                            <div class="flex items-baseline gap-1 justify-end">
                                <span class="text-xl font-bold text-slate-700 tracking-tight font-mono">${school.count.toLocaleString()}</span>
                            </div>
                         </div>
                    </div>
                    
                    <!-- Progress -->
                    <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r ${progressGradient} progress-stripes" style="width: ${Math.min(school.percent, 100)}%"></div>
                    </div>
                </div>

                <div class="flex gap-2 mt-4 pt-4 border-t border-slate-100/80 no-print">
                    <button onclick="openGoogleSearch('${school.name}')" class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm">
                        <i data-lucide="search" class="w-3.5 h-3.5"></i>
                        搜尋
                    </button>
                    <button onclick="openGoogleMaps('${school.schoolName}')" class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm">
                        <i data-lucide="map-pin" class="w-3.5 h-3.5"></i>
                        地圖
                    </button>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

function renderChart(data) {
    const ctx = document.getElementById('statsChart');
    if (!ctx) {
        console.warn("Chart canvas not found");
        return;
    }

    try {
        if (state.chartInstance) {
            state.chartInstance.destroy();
        }

        const chartData = data.slice(0, 30);
        const labels = chartData.map(d => d.name);
        const percents = chartData.map(d => d.percent);
        // Modern Chart Colors
        const colors = chartData.map(d => d.category === 'general' ? '#6366f1' : '#10b981'); // Indigo-500 & Emerald-500

        // Set font defaults
        if (typeof Chart !== 'undefined') {
            Chart.defaults.font.family = "'Inter', sans-serif";
            Chart.defaults.color = '#64748b';

            state.chartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: '累積比率 (%)',
                        data: percents,
                        backgroundColor: colors,
                        borderRadius: 8,
                        barPercentage: 0.6,
                        categoryPercentage: 0.8
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            titleColor: '#1e293b',
                            bodyColor: '#475569',
                            borderColor: '#e2e8f0',
                            borderWidth: 1,
                            padding: 16,
                            cornerRadius: 16,
                            titleFont: { size: 13, weight: 'bold' },
                            bodyFont: { size: 12 },
                            displayColors: true,
                            boxPadding: 4,
                            callbacks: {
                                label: function(context) {
                                    return ` 累積比率: ${context.raw}%`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            min: 0,
                            max: 100,
                            grid: { color: '#f1f5f9', drawBorder: false },
                            ticks: { font: { size: 11, weight: '500' }, color: '#94a3b8' },
                            border: { display: false }
                        },
                        y: {
                            grid: { display: false, drawBorder: false },
                            ticks: { font: { size: 12, weight: '600' }, color: '#475569' },
                            border: { display: false }
                        }
                    },
                    animation: {
                        duration: 1000,
                        easing: 'easeOutQuart'
                    }
                }
            });
        }
    } catch (e) {
        console.error("Failed to render chart:", e);
    }
}

function renderSortIcons() {
    document.querySelectorAll('.sort-icon').forEach(el => el.innerHTML = '<i data-lucide="chevrons-up-down" class="w-3 h-3 text-slate-300 ml-1"></i>');
    document.querySelectorAll('.mobile-sort-btn').forEach(el => el.classList.remove('bg-indigo-50', 'text-indigo-600', 'ring-1', 'ring-indigo-100', 'shadow-sm'));

    const iconContainer = document.getElementById(`sort-icon-${state.sortField}`);
    const headerText = document.getElementById(`header-${state.sortField}`);
    
    // Reset Header colors
    document.querySelectorAll('[id^="header-"]').forEach(el => el.classList.remove('text-indigo-600'));

    if (iconContainer) {
        const iconName = state.sortDirection === 'asc' ? 'chevron-up' : 'chevron-down';
        iconContainer.innerHTML = `<i data-lucide="${iconName}" class="w-3.5 h-3.5 text-indigo-600 ml-1 stroke-[3px]"></i>`;
        if(headerText) headerText.classList.add('text-indigo-600');
    }

    const activeMobileBtn = document.querySelector(`.mobile-sort-btn[data-sort="${state.sortField}"]`);
    if (activeMobileBtn) {
        activeMobileBtn.classList.add('bg-indigo-50', 'text-indigo-600', 'ring-1', 'ring-indigo-100', 'shadow-sm');
    }
}

function updateFilterButtons() {
    const advBtn = document.getElementById('btn-advanced-filter');
    const panel = document.getElementById('advanced-filters-panel');
    const btnReset = document.getElementById('btn-reset-empty'); // The one in empty state
    
    if (advBtn && panel) {
        // Logic to highlight advanced filter button
        if (!panel.classList.contains('hidden')) {
            advBtn.classList.add('bg-indigo-600', 'text-white', 'border-indigo-600', 'shadow-lg', 'shadow-indigo-500/30');
            advBtn.classList.remove('bg-white', 'text-slate-600', 'border-slate-200');
        } else if (state.minPercent || state.maxPercent) {
            advBtn.classList.add('bg-indigo-50', 'text-indigo-600', 'border-indigo-200', 'ring-2', 'ring-indigo-100');
            advBtn.classList.remove('bg-white', 'text-slate-600', 'border-slate-200', 'bg-indigo-600', 'text-white');
        } else {
            advBtn.classList.remove('bg-indigo-600', 'text-white', 'border-indigo-600', 'shadow-lg', 'bg-indigo-50', 'text-indigo-600', 'ring-2', 'ring-indigo-100');
            advBtn.classList.add('bg-white', 'text-slate-600', 'border-slate-200');
        }
    }

    // Favorites Button
    const favBtn = document.getElementById('btn-favorites');
    if (favBtn) {
        if (state.onlyFavorites) {
            favBtn.classList.add('bg-amber-50', 'text-amber-600', 'border-amber-200', 'ring-2', 'ring-amber-100', 'shadow-sm');
            favBtn.classList.remove('bg-white', 'text-slate-600', 'border-slate-200');
            const icon = favBtn.querySelector('i');
            if(icon) icon.classList.add('fill-amber-500', 'text-amber-500');
        } else {
            favBtn.classList.remove('bg-amber-50', 'text-amber-600', 'border-amber-200', 'ring-2', 'ring-amber-100', 'shadow-sm');
            favBtn.classList.add('bg-white', 'text-slate-600', 'border-slate-200');
            const icon = favBtn.querySelector('i');
            if(icon) icon.classList.remove('fill-amber-500', 'text-amber-500');
        }
    }

    // Type Buttons
    document.querySelectorAll('.filter-type-btn').forEach(btn => {
        const type = btn.getAttribute('data-type');
        const isActive = type === state.filterType;
        btn.setAttribute('aria-pressed', String(isActive));
        btn.classList.toggle('active', isActive);
        if (isActive) {
            btn.classList.add('bg-slate-800', 'text-white', 'shadow-lg', 'shadow-slate-500/30');
            btn.classList.remove('text-slate-500', 'hover:text-slate-700');
        } else {
            btn.classList.remove('bg-slate-800', 'text-white', 'shadow-lg', 'shadow-slate-500/30');
            btn.classList.add('text-slate-500', 'hover:text-slate-700');
        }
    });

    // Handle Reset Button inside Empty State
    if(btnReset) {
        btnReset.onclick = () => {
             const mainReset = document.getElementById('btn-reset');
             if(mainReset) mainReset.click();
        }
    }
}

// Global Helpers (exposed to window for onclick)
window.toggleFavorite = (id) => {
    if (state.favorites.has(id)) {
        state.favorites.delete(id);
    } else {
        state.favorites.add(id);
    }
    localStorage.setItem('school_favorites', JSON.stringify([...state.favorites]));
    updateUI();
};

window.openGoogleSearch = (query) => {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
};

window.openGoogleMaps = (query) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
};

window.closeGuide = () => {
    const modal = document.getElementById('guide-modal');
    if(modal) {
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = 'unset';
    document.getElementById('btn-guide')?.focus();
};

window.openSidebar = () => {
    const overlay = document.getElementById('sidebar-overlay');
    const panel = document.getElementById('sidebar-panel');
    
    if (overlay && panel) {
        overlay.classList.remove('hidden');
        overlay.setAttribute('aria-hidden', 'false');
        panel.setAttribute('aria-hidden', 'false');
        document.getElementById('btn-sidebar')?.setAttribute('aria-expanded', 'true');
        setTimeout(() => {
            overlay.classList.remove('opacity-0');
            panel.classList.remove('translate-x-full');
            panel.querySelector('button')?.focus();
        }, 10);
        document.body.style.overflow = 'hidden';
    }
    if(window.lucide) lucide.createIcons();
};

window.closeSidebar = () => {
    const overlay = document.getElementById('sidebar-overlay');
    const panel = document.getElementById('sidebar-panel');
    
    if (overlay && panel) {
        overlay.classList.add('opacity-0');
        panel.classList.add('translate-x-full');
        overlay.setAttribute('aria-hidden', 'true');
        panel.setAttribute('aria-hidden', 'true');
        document.getElementById('btn-sidebar')?.setAttribute('aria-expanded', 'false');
        
        setTimeout(() => {
            overlay.classList.add('hidden');
            document.body.style.overflow = 'unset';
            document.getElementById('btn-sidebar')?.focus();
        }, 300);
    }
};

// Internal Event Wiring
function attachEventListeners() {
    const safeAddListener = (id, event, handler) => {
        const el = document.getElementById(id);
        if(el) el.addEventListener(event, handler);
    };

    // Search
    safeAddListener('search-input', 'input', (e) => {
        state.searchTerm = e.target.value;
        updateUI();
    });

    // Sort Headers (Desktop)
    document.querySelectorAll('[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const field = th.getAttribute('data-sort');
            if (state.sortField === field) {
                state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                state.sortField = field;
                state.sortDirection = 'asc';
            }
            updateUI();
        });
    });

    // Sort Buttons (Mobile)
    document.querySelectorAll('.mobile-sort-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const field = btn.getAttribute('data-sort');
            if (state.sortField === field) {
                state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                state.sortField = field;
                state.sortDirection = 'asc';
            }
            updateUI();
        });
    });

    // Advanced Filter Toggle
    safeAddListener('btn-advanced-filter', 'click', () => {
        const panel = document.getElementById('advanced-filters-panel');
        if(panel) {
            panel.classList.toggle('hidden');
            document.getElementById('btn-advanced-filter')?.setAttribute('aria-expanded', String(!panel.classList.contains('hidden')));
        }
        updateUI();
    });

    // Min/Max Inputs
    safeAddListener('min-percent', 'input', (e) => {
        state.minPercent = e.target.value;
        updateUI();
    });
    safeAddListener('max-percent', 'input', (e) => {
        state.maxPercent = e.target.value;
        updateUI();
    });

    // Favorites Toggle
    safeAddListener('btn-favorites', 'click', () => {
        state.onlyFavorites = !state.onlyFavorites;
        updateUI();
    });

    // Filter Type Buttons
    document.querySelectorAll('.filter-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.filterType = btn.getAttribute('data-type');
            updateUI();
        });
    });

    // Reset Button
    safeAddListener('btn-reset', 'click', () => {
        state.searchTerm = '';
        const searchInput = document.getElementById('search-input');
        if(searchInput) searchInput.value = '';
        
        state.filterType = 'all';
        state.onlyFavorites = false;
        state.minPercent = '';
        const minEl = document.getElementById('min-percent');
        if(minEl) minEl.value = '';
        
        state.maxPercent = '';
        const maxEl = document.getElementById('max-percent');
        if(maxEl) maxEl.value = '';
        
        updateUI();
    });

    // Guide Modal
    safeAddListener('btn-guide', 'click', () => {
        const modal = document.getElementById('guide-modal');
        if(modal) {
            modal.classList.remove('hidden');
            modal.setAttribute('aria-hidden', 'false');
            setTimeout(() => modal.querySelector('button')?.focus(), 0);
        }
        document.body.style.overflow = 'hidden';
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        const guideModal = document.getElementById('guide-modal');
        const sidebar = document.getElementById('sidebar-panel');
        if (guideModal && !guideModal.classList.contains('hidden')) closeGuide();
        else if (sidebar && !sidebar.classList.contains('translate-x-full')) closeSidebar();
    });
}

function showError(msg) {
    state.error = msg;
    state.loading = false;
    updateUI();
}
