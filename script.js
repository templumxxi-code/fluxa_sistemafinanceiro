// Estado Global da Aplicação
let appState = {
    receitas: [],
    despesas: [],
    investimentos: [],
    centrosFinanceiros: [],
    selectedCentroId: 'all',
    selectedMonth: null,
    orcamento: 0,
    orcamentoAutomatico: true,
    meta: 0,
    metaReceitas: 0,
    metaDespesas: 0,
    metaInvestimentos: 0,
    theme: 'light',
    userName: '',
    categoriasReceitas: ['salario', 'bonus', 'freelance', 'investimentos', 'outros'],
    categoriasDespesas: ['alimentacao', 'moradia', 'transporte', 'lazer', 'saude', 'educacao', 'outros'],
    tiposInvestimentos: ['renda_fixa', 'renda_variavel', 'fundos', 'criptomoedas', 'outros'],
    deletedCenterBackups: [],
    appliedFilters: {
        period: 'current-month',
        categories: [],
        dateFrom: null,
        dateTo: null
    },
    selectedReceitasCentroId: 'all',
    selectedDespesasCentroId: 'all',
    selectedInvestimentosCentroId: 'all',
    paretoComparisonPeriod: 'previous-month'
};

function loadAuthUserInfo() {
    const user = getCurrentUser();
    if (user) {
        appState.userName = user.name;
        appState.userEmail = user.email;
        appState.userRole = user.role;
    }
}

function initializeLogoutButton() {
    const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutBtnLocked = document.getElementById('logoutBtnLocked');

    [sidebarLogoutBtn, logoutBtn, logoutBtnLocked].forEach(button => {
        if (!button) return;
        if (button.dataset.logoutInitialized === 'true') return;
        button.dataset.logoutInitialized = 'true';
        button.addEventListener('click', () => {
            clearAuthState();
            window.location.href = '/login';
        });
    });
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOMContentLoaded triggered');
    console.log('🔐 Checking authentication...');

    // Verificar autenticação e não processar mais se falhar
    if (!isAuthenticated()) {
        console.log('❌ Not authenticated, redirecting to login');
        window.location.href = '/login';
        return;
    }

    console.log('✅ Auth passed, loading data from API');
    loadDataFromAPI().then(() => {
        console.log('📊 Data loaded successfully, initializing UI');
        loadAuthUserInfo();
        console.log('🎨 Initializing theme...');
        initializeTheme();
        console.log('📱 Initializing sidebar...');
        initializeSidebarToggle();
        console.log('🚪 Initializing logout...');
        initializeLogoutButton();
        console.log('🧭 Initializing navigation...');
        initializeNavigation();
        console.log('📝 Initializing modals...');
        initializeModals();
        console.log('📋 Initializing forms...');
        initializeForms();
        console.log('👤 Initializing user name...');
        initializeUserName();
        console.log('🏷️ Initializing categories...');
        initializeCategories();
        console.log('🏦 Initializing center selectors...');
        initializeCenterSelectors();
        console.log('📅 Initializing month selector...');
        initializeMonthSelector();
        console.log('📊 Initializing pareto comparison...');
        initializeParetoComparisonSelector();
        console.log('🔍 Initializing filters...');
        initializeFilters();
        console.log('📈 Updating dashboard...');
        updateDashboard();
        console.log('📅 Updating current date...');
        updateCurrentDate();
        console.log('📊 Rendering all data...');
        renderAllData();
        console.log('✅ UI initialization complete');
    }).catch(error => {
        console.error('❌ Erro na inicialização:', error);
    });
});

function loadDataFromAPI() {
    console.log('🔄 Starting to load data from API...');
    
    // Validar que temos token antes de fazer requisições
    if (!getToken()) {
        console.log('⚠️ No token available, loading from localStorage');
        loadFromLocalStorage();
        return Promise.resolve();
    }
    
    return Promise.all([
        apiRequest('/api/financial-data')
            .then(res => {
                if (!res.ok) throw new Error(`API error: ${res.status}`);
                console.log('💰 Financial data response:', res.status);
                return res.json();
            })
            .catch(err => {
                console.error('❌ Error fetching financial data:', err);
                return [];
            }),
        apiRequest('/api/financial-centers')
            .then(res => {
                if (!res.ok) throw new Error(`API error: ${res.status}`);
                console.log('🏦 Financial centers response:', res.status);
                return res.json();
            })
            .catch(err => {
                console.error('❌ Error fetching financial centers:', err);
                return [];
            })
    ]).then(([financialData, centers]) => {
        console.log('📊 Processing financial data...');
        
        // Validar que temos dados antes de processar
        if (!Array.isArray(financialData)) financialData = [];
        if (!Array.isArray(centers)) centers = [];
        
        // Organize financial data by type
        appState.receitas = financialData
            .filter(item => item.type === 'receita')
            .map(item => ({
                ...item,
                valor: parseFloat(item.amount ?? item.valor) || 0,
                categoria: item.category || item.categoria || 'outros',
                centroId: item.centro_id || item.centroId || 'default'
            }));
        appState.despesas = financialData
            .filter(item => item.type === 'despesa')
            .map(item => ({
                ...item,
                valor: parseFloat(item.amount ?? item.valor) || 0,
                categoria: item.category || item.categoria || 'outros',
                tipo: item.tipo || item.category || item.recorrencia || 'eventual',
                natureza: item.natureza || item.natureza || 'variavel',
                centroId: item.centro_id || item.centroId || 'default'
            }));
        appState.investimentos = financialData
            .filter(item => item.type === 'investimento')
            .map(item => ({
                ...item,
                valorInvestido: parseFloat(item.amount ?? item.valor) || 0,
                rendimento: parseFloat(item.rendimento ?? 0) || 0,
                tipo: item.category || item.tipo || 'outros',
                categoria: item.category || item.categoria || 'outros',
                centroId: item.centro_id || item.centroId || 'default'
            }));
        appState.centrosFinanceiros = centers.map(center => ({
            id: center.id.toString(),
            nome: center.name,
            type: center.type,
            balance: center.balance
        }));

        console.log('✅ Data organized:', {
            receitas: appState.receitas.length,
            despesas: appState.despesas.length,
            investimentos: appState.investimentos.length,
            centros: appState.centrosFinanceiros.length
        });

        ensureDefaultCentro();
        console.log('🏠 Default center ensured');
    }).catch(error => {
        console.error('❌ Error in loadDataFromAPI:', error);
        // Fallback to localStorage if API fails
        loadFromLocalStorage();
    });
}

function saveFinancialData(type, data) {
    const apiData = {
        type,
        category: data.tipo || data.categoria || data.category,
        amount: parseFloat(String(data.valorInvestido ?? data.valor ?? data.amount).replace(',', '.')) || 0,
        rendimento: parseFloat(String(data.rendimento ?? 0).replace(',', '.')) || 0,
        date: data.data,
        description: data.descricao || data.description,
        centro_id: data.centroId || 'default'
    };

    return apiRequest('/api/financial-data', {
        method: 'POST',
        body: JSON.stringify(apiData)
    }).then(res => {
        if (!res.ok) {
            return res.json().then(err => {
                throw new Error(err.error || 'Erro ao salvar dados');
            });
        }
        return res.json();
    });
}

function updateFinancialData(id, type, data) {
    const apiData = {
        type,
        category: data.tipo || data.categoria || data.category,
        amount: parseFloat(String(data.valorInvestido ?? data.valor ?? data.amount).replace(',', '.')) || 0,
        rendimento: parseFloat(String(data.rendimento ?? 0).replace(',', '.')) || 0,
        date: data.data,
        description: data.descricao || data.description,
        centro_id: data.centroId || 'default'
    };

    return apiRequest(`/api/financial-data/${id}`, {
        method: 'PUT',
        body: JSON.stringify(apiData)
    }).then(res => {
        if (!res.ok) {
            return res.json().then(err => {
                throw new Error(err.error || 'Erro ao atualizar dados');
            });
        }
        return res.json();
    });
}

function deleteFinancialData(id) {
    return apiRequest(`/api/financial-data/${id}`, {
        method: 'DELETE'
    });
}

function saveCentroFinanceiro(data) {
    const apiData = {
        name: data.nome,
        type: data.type || 'conta',
        balance: data.balance || 0
    };

    return apiRequest('/api/financial-centers', {
        method: 'POST',
        body: JSON.stringify(apiData)
    }).then(res => res.json());
}

function updateCentroFinanceiro(id, data) {
    const apiData = {
        name: data.nome,
        type: data.type,
        balance: data.balance
    };

    return apiRequest(`/api/financial-centers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(apiData)
    });
}

function deleteCentroFinanceiro(id) {
    return apiRequest(`/api/financial-centers/${id}`, {
        method: 'DELETE'
    });
}

// Replace saveToLocalStorage calls with API calls
function saveData() {
    // This function is called instead of saveToLocalStorage
    // Individual saves are handled by specific functions
    console.log('Dados salvos via API');
}

// LocalStorage (fallback)
function saveToLocalStorage() {
    localStorage.setItem('financeApp', JSON.stringify(appState));
}

function getDefaultCentroFinanceiro() {
    return {
        id: 'centro-geral',
        nome: 'Geral',
        descricao: 'Centro financeiro principal',
        orcamento: 0,
        alertaPercentual: 90,
        meta: 0
    };
}

function ensureDefaultCentro() {
    if (appState.centrosFinanceiros === undefined || appState.centrosFinanceiros === null) {
        appState.centrosFinanceiros = [getDefaultCentroFinanceiro()];
    }
}

function loadFromLocalStorage() {
    const stored = localStorage.getItem('financeApp');
    if (stored) {
        const loadedState = JSON.parse(stored);
        appState = {
            ...appState,
            ...loadedState,
            categoriasReceitas: loadedState.categoriasReceitas || ['salario', 'bonus', 'freelance', 'investimentos', 'outros'],
            categoriasDespesas: loadedState.categoriasDespesas || ['alimentacao', 'moradia', 'transporte', 'lazer', 'saude', 'educacao', 'outros'],
            tiposInvestimentos: loadedState.tiposInvestimentos || ['renda_fixa', 'renda_variavel', 'fundos', 'criptomoedas', 'outros'],
            centrosFinanceiros: loadedState.centrosFinanceiros || [],
            deletedCenterBackups: loadedState.deletedCenterBackups || [],
            appliedFilters: loadedState.appliedFilters || {
                period: 'current-month',
                categories: [],
                dateFrom: null,
                dateTo: null
            },
            paretoComparisonPeriod: loadedState.paretoComparisonPeriod || 'previous-month'
        };

        appState.selectedCentroId = loadedState.selectedCentroId || 'all';
        appState.selectedMonth = loadedState.selectedMonth || getCurrentMonthKey();
        appState.orcamentoAutomatico = loadedState.orcamentoAutomatico !== false;
        appState.selectedReceitasCentroId = loadedState.selectedReceitasCentroId || 'all';
        appState.selectedDespesasCentroId = loadedState.selectedDespesasCentroId || 'all';
        appState.selectedInvestimentosCentroId = loadedState.selectedInvestimentosCentroId || 'all';

        ensureDefaultCentro();

        // Garantir que há pelo menos um centro, senão criar um padrão
        if (appState.centrosFinanceiros.length === 0) {
            appState.centrosFinanceiros.push({
                id: 'centro-principal',
                nome: 'Principal',
                orcamento: 0,
                meta: 5000,
                moeda: 'BRL'
            });
        }

        const defaultCentroId = appState.centrosFinanceiros[0]?.id;
        
        // Migração: Garantir que todos os itens tenham um centroId válido
        appState.receitas = (appState.receitas || []).map((receita) => {
            // Se não tem centroId ou tem um que não existe nos centros, usar o padrão
            const centroValido = receita.centroId && appState.centrosFinanceiros.some(c => c.id === receita.centroId);
            return {
                ...receita,
                centroId: centroValido ? receita.centroId : defaultCentroId
            };
        });
        
        appState.despesas = (appState.despesas || []).map((despesa) => {
            const centroValido = despesa.centroId && appState.centrosFinanceiros.some(c => c.id === despesa.centroId);
            return {
                ...despesa,
                centroId: centroValido ? despesa.centroId : defaultCentroId,
                categoria: despesa.categoria || 'outros',
                tipo: despesa.tipo || despesa.recorrencia || 'eventual',
                natureza: despesa.natureza || 'variavel'
            };
        });
        
        appState.investimentos = (appState.investimentos || []).map((investimento) => {
            const centroValido = investimento.centroId && appState.centrosFinanceiros.some(c => c.id === investimento.centroId);
            return {
                ...investimento,
                centroId: centroValido ? investimento.centroId : defaultCentroId,
                valorInvestido: investimento.valorInvestido ?? investimento.valor ?? 0,
                rendimento: investimento.rendimento ?? 0,
                tipo: investimento.tipo || investimento.categoria || 'outros',
                categoria: investimento.categoria || investimento.tipo || 'outros'
            };
        });

        // Se o selectedCentroId não existe mais nos centros, resetar para 'all'
        if (appState.selectedCentroId !== 'all' && !appState.centrosFinanceiros.some(c => c.id === appState.selectedCentroId)) {
            appState.selectedCentroId = 'all';
        }
    } else {
        ensureDefaultCentro();
        appState.selectedMonth = getCurrentMonthKey();
    }
}

// Tema
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    appState.theme = savedTheme;
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    document.getElementById('themeToggle').addEventListener('click', () => {
        const newTheme = appState.theme === 'light' ? 'dark' : 'light';
        appState.theme = newTheme;
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

// Sidebar Toggle
function initializeSidebarToggle() {
    const toggleBtn = document.getElementById('toggleSidebarBtn');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (!toggleBtn || !sidebar) return;
    
    const savedSidebarState = localStorage.getItem('sidebarCollapsed') === 'true';
    if (savedSidebarState) {
        collapseSidebar();
    }
    
    toggleBtn.addEventListener('click', () => {
        const isCollapsed = sidebar.classList.contains('collapsed');
        if (isCollapsed) {
            expandSidebar();
        } else {
            collapseSidebar();
        }
    });
    
    function collapseSidebar() {
        sidebar.classList.add('collapsed');
        mainContent.classList.add('sidebar-collapsed');
        localStorage.setItem('sidebarCollapsed', 'true');
    }
    
    function expandSidebar() {
        sidebar.classList.remove('collapsed');
        mainContent.classList.remove('sidebar-collapsed');
        localStorage.setItem('sidebarCollapsed', 'false');
    }
}

// Nome do Usuário
function initializeUserName() {
    const userNameInput = document.getElementById('userName');
    const userNameDisplay = document.getElementById('userNameDisplay');
    
    // Mostrar nome salvo
    updateUserNameDisplay();
    updateWelcomeText();
    
    // Removido: edição direta no sidebar - agora só nas configurações
    
    function saveUserName() {
        appState.userName = userNameInput.value.trim();
        saveToLocalStorage();
        updateUserNameDisplay();
        updateWelcomeText();
        userNameInput.style.display = 'none';
        userNameDisplay.style.display = 'inline';
    }
}

function updateUserNameDisplay() {
    const userNameDisplay = document.getElementById('userNameDisplay');
    if (appState.userName) {
        userNameDisplay.textContent = `- ${appState.userName}`;
    } else {
        userNameDisplay.textContent = '';
    }
}

function updateWelcomeText() {
    const welcomeText = document.getElementById('welcomeText');
    if (appState.userName) {
        welcomeText.textContent = `Bem-vindo(a), ${appState.userName}!`;
    } else {
        welcomeText.textContent = 'Bem-vindo(a)!';
    }
}

// Gerenciamento de Categorias
function initializeCategories() {
    populateSelectCategories();
    
    // Usar event delegation para os botões que estão dentro dos modais
    document.addEventListener('click', (e) => {
        if (e.target.id === 'addCategoriaReceita') {
            e.preventDefault();
            addNewCategory('receita');
        } else if (e.target.id === 'addCategoriaDespesa') {
            e.preventDefault();
            addNewCategory('despesa');
        } else if (e.target.id === 'addCategoriaInvestimento') {
            e.preventDefault();
            addNewCategory('investimento');
        } else if (e.target.id === 'editCategoriaReceita') {
            e.preventDefault();
            editCategory('receita');
        } else if (e.target.id === 'editCategoriaDespesa') {
            e.preventDefault();
            editCategory('despesa');
        } else if (e.target.id === 'editCategoriaInvestimento') {
            e.preventDefault();
            editCategory('investimento');
        }
    });
}

function populateSelectCategories() {
    // Preencher select de receitas
    const selectReceita = document.getElementById('receitaTipo');
    if (selectReceita) {
        selectReceita.innerHTML = appState.categoriasReceitas.map(cat => 
            `<option value="${cat}">${capitalize(cat)}</option>`
        ).join('');
    }
    
    // Preencher select de despesas
    const selectDespesa = document.getElementById('despesaCategoria');
    if (selectDespesa) {
        selectDespesa.innerHTML = appState.categoriasDespesas.map(cat => 
            `<option value="${cat}">${capitalize(cat)}</option>`
        ).join('');
    }
    
    // Preencher select de investimentos
    const selectInvestimento = document.getElementById('investimentoTipo');
    if (selectInvestimento) {
        selectInvestimento.innerHTML = appState.tiposInvestimentos.map(cat => 
            `<option value="${cat}">${capitalize(cat.replace('_', ' '))}</option>`
        ).join('');
    }
    
    // Preencher filtros
    const filterReceita = document.getElementById('filterTipoReceita');
    if (filterReceita) {
        filterReceita.innerHTML = '<option value="todos">Todos os tipos</option>' + 
            appState.categoriasReceitas.map(cat => 
                `<option value="${cat}">${capitalize(cat)}</option>`
            ).join('');
    }
    
    const filterDespesa = document.getElementById('filterCategoriaDespesa');
    if (filterDespesa) {
        filterDespesa.innerHTML = '<option value="todos">Todas as categorias</option>' + 
            appState.categoriasDespesas.map(cat => 
                `<option value="${cat}">${capitalize(cat)}</option>`
            ).join('');
    }
}

function populateCenterSelectors() {
    ensureDefaultCentro();
    const centerOptions = appState.centrosFinanceiros.length > 0
        ? appState.centrosFinanceiros.map(c => `<option value="${c.id}">${capitalize(c.nome)}</option>`).join('')
        : '';

    const dashboardCenter = document.getElementById('dashboardCenterSelector');
    if (dashboardCenter) {
        dashboardCenter.innerHTML = '<option value="all">Todos os Centros</option>' + centerOptions;
        dashboardCenter.value = appState.selectedCentroId || 'all';
    }

    const receitasCenter = document.getElementById('receitasCenterSelector');
    if (receitasCenter) {
        receitasCenter.innerHTML = '<option value="all">Todos os Centros</option>' + centerOptions;
        receitasCenter.value = appState.selectedReceitasCentroId || 'all';
    }

    const despesasCenter = document.getElementById('despesasCenterSelector');
    if (despesasCenter) {
        despesasCenter.innerHTML = '<option value="all">Todos os Centros</option>' + centerOptions;
        despesasCenter.value = appState.selectedDespesasCentroId || 'all';
    }

    const investimentosCenter = document.getElementById('investimentosCenterSelector');
    if (investimentosCenter) {
        investimentosCenter.innerHTML = '<option value="all">Todos os Centros</option>' + centerOptions;
        investimentosCenter.value = appState.selectedInvestimentosCentroId || 'all';
    }

    ['receitaCentro', 'despesaCentro', 'investimentoCentro', 'gastoRapidoCentro'].forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        if (centerOptions) {
            select.innerHTML = centerOptions;
            const defaultCentro = appState.selectedCentroId && appState.selectedCentroId !== 'all'
                ? appState.selectedCentroId
                : (appState.centrosFinanceiros[0]?.id || '');
            if (select.querySelector(`option[value="${defaultCentro}"]`)) {
                select.value = defaultCentro;
            }
        } else {
            select.innerHTML = '<option value="" disabled>Sem centros cadastrados</option>';
            select.value = '';
        }
    });
}

function initializeCenterSelectors() {
    populateCenterSelectors();

    const dashboardCenter = document.getElementById('dashboardCenterSelector');
    if (dashboardCenter) {
        dashboardCenter.addEventListener('change', (e) => {
            appState.selectedCentroId = e.target.value;
            saveToLocalStorage();
            updateDashboard();
            renderAllData();
        });
    }

    const receitasCenter = document.getElementById('receitasCenterSelector');
    if (receitasCenter) {
        receitasCenter.addEventListener('change', (e) => {
            appState.selectedReceitasCentroId = e.target.value;
            saveToLocalStorage();
            renderReceitas();
        });
    }

    const despesasCenter = document.getElementById('despesasCenterSelector');
    if (despesasCenter) {
        despesasCenter.addEventListener('change', (e) => {
            appState.selectedDespesasCentroId = e.target.value;
            saveToLocalStorage();
            renderDespesas();
        });
    }

    const investimentosCenter = document.getElementById('investimentosCenterSelector');
    if (investimentosCenter) {
        investimentosCenter.addEventListener('change', (e) => {
            appState.selectedInvestimentosCentroId = e.target.value;
            saveToLocalStorage();
            renderInvestimentos();
        });
    }

    const manageCentersBtn = document.getElementById('manageCentersBtn');
    if (manageCentersBtn) {
        manageCentersBtn.addEventListener('click', () => {
            const tab = document.querySelector('.nav-item[data-tab="centros"]');
            if (tab) tab.click();
        });
    }

    const clearCentersBtn = document.getElementById('clearCentersBtn');
    if (clearCentersBtn) {
        clearCentersBtn.addEventListener('click', () => {
            if (verifyPasswordForAction('apagar todos os centros')) {
                clearAllCenters();
            }
        });
    }

    updateUndoButtonState();

    const clearUnusedCentersBtn = document.getElementById('clearUnusedCentersBtn');
    if (clearUnusedCentersBtn) {
        clearUnusedCentersBtn.addEventListener('click', () => {
            if (verifyPasswordForAction('remover centros não usados')) {
                clearUnusedCenters();
            }
        });
    }

    const undoDeleteBtn = document.getElementById('undoDeleteBtn');
    if (undoDeleteBtn) {
        undoDeleteBtn.addEventListener('click', () => {
            if (verifyPasswordForAction('desfazer a última exclusão')) {
                undoLastCenterDeletion();
            }
        });
    }
}

function getSelectedCentroId() {
    return appState.selectedCentroId || 'all';
}

function getSelectedCentro() {
    return appState.centrosFinanceiros.find(c => c.id === getSelectedCentroId()) || null;
}

function filterBySelectedCentro(items) {
    const centroId = getSelectedCentroId();
    if (centroId === 'all') return items;
    return items.filter(item => item.centroId === centroId);
}

function syncCenterInputsWithSelectedCentro() {
    // Determinar qual aba está ativa para usar o centro correto
    const activeTab = document.querySelector('.nav-item.active');
    let selectedCentro = null;
    
    if (activeTab) {
        const tabId = activeTab.getAttribute('data-tab');
        switch (tabId) {
            case 'receitas':
                selectedCentro = appState.selectedReceitasCentroId === 'all' 
                    ? appState.centrosFinanceiros[0]?.id 
                    : appState.selectedReceitasCentroId;
                break;
            case 'despesas':
                selectedCentro = appState.selectedDespesasCentroId === 'all' 
                    ? appState.centrosFinanceiros[0]?.id 
                    : appState.selectedDespesasCentroId;
                break;
            case 'investimentos':
                selectedCentro = appState.selectedInvestimentosCentroId === 'all' 
                    ? appState.centrosFinanceiros[0]?.id 
                    : appState.selectedInvestimentosCentroId;
                break;
            default:
                selectedCentro = getSelectedCentroId() === 'all'
                    ? appState.centrosFinanceiros[0]?.id
                    : getSelectedCentroId();
        }
    } else {
        selectedCentro = getSelectedCentroId() === 'all'
            ? appState.centrosFinanceiros[0]?.id
            : getSelectedCentroId();
    }

    ['receitaCentro', 'despesaCentro', 'investimentoCentro', 'gastoRapidoCentro'].forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        if (selectedCentro && select.querySelector(`option[value="${selectedCentro}"]`)) {
            select.value = selectedCentro;
        } else if (select.options.length) {
            select.value = select.options[0].value;
        }
    });
}

function normalizeCategoryName(name) {
    return name.trim().toLowerCase().replace(/\s+/g, '_');
}

// Retorna a chave do mês atual no formato YYYY-MM
function getCurrentMonthKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
}

function getSelectedMonthKey() {
    return appState.selectedMonth || getCurrentMonthKey();
}

function getPreviousMonthKey(monthKey = getSelectedMonthKey()) {
    const [year, month] = monthKey.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    date.setMonth(date.getMonth() - 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getSuggestedDateForMonth(monthKey = getSelectedMonthKey()) {
    const today = new Date();
    const [year, month] = monthKey.split('-').map(Number);
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const day = Math.min(today.getDate(), lastDayOfMonth);
    return `${monthKey}-${String(day).padStart(2, '0')}`;
}

function getCompareDateRange(comparePeriod, referenceMonthKey = getSelectedMonthKey()) {
    const [year, month] = referenceMonthKey.split('-').map(Number);
    const end = new Date(year, month - 1, 0); // last day of previous month for current month reference

    switch (comparePeriod) {
        case 'last-3-months': {
            const start = new Date(year, month - 4, 1);
            return { start, end };
        }
        case 'same-month-last-year': {
            const start = new Date(year - 1, month - 1, 1);
            const lastDay = new Date(year - 1, month, 0).getDate();
            return { start, end: new Date(year - 1, month - 1, lastDay) };
        }
        case 'previous-month':
            return { start: new Date(year, month - 2, 1), end: new Date(year, month - 1, 0) };
        default:
            return null;
    }
}

function getDespesaPeriodo(comparePeriod, referenceMonthKey = getSelectedMonthKey()) {
    if (comparePeriod === 'none') return [];
    const dateRange = getCompareDateRange(comparePeriod, referenceMonthKey);
    if (!dateRange) return [];
    const despesas = filterBySelectedCentro(appState.despesas);
    return despesas.filter(d => {
        if (!d.data) return false;
        const data = new Date(d.data);
        return data >= dateRange.start && data <= dateRange.end;
    });
}

function initializeParetoComparisonSelector() {
    const select = document.getElementById('paretoComparePeriodSelector');
    if (!select) return;
    select.value = appState.paretoComparisonPeriod || 'previous-month';
    select.addEventListener('change', (e) => {
        appState.paretoComparisonPeriod = e.target.value;
        saveToLocalStorage();
        updateDashboard();
    });
}

function syncDateInputsWithSelectedMonth(onlyIfEmpty = false) {
    const defaultDate = getSuggestedDateForMonth();
    ['receitaData', 'despesaData', 'investimentoData', 'gastoRapidoData'].forEach((inputId) => {
        const input = document.getElementById(inputId);
        if (!input) return;
        if (!onlyIfEmpty || !input.value) {
            input.value = defaultDate;
        }
    });
}

function getMonthTotals(monthKey = getSelectedMonthKey()) {
    const receitasMes = filterBySelectedCentro(appState.receitas).filter(r => r.data && r.data.substring(0, 7) === monthKey);
    const despesasMes = filterBySelectedCentro(appState.despesas).filter(d => d.data && d.data.substring(0, 7) === monthKey);
    const investimentosMes = filterBySelectedCentro(appState.investimentos).filter(inv => inv.data && inv.data.substring(0, 7) === monthKey);

    return {
        receitasMes,
        despesasMes,
        investimentosMes,
        totalReceitas: receitasMes.reduce((sum, r) => sum + r.valor, 0),
        totalDespesas: despesasMes.reduce((sum, d) => sum + d.valor, 0),
        totalInvestido: investimentosMes.reduce((sum, inv) => sum + inv.valorInvestido, 0)
    };
}

function getFilteredMonthTotals(monthKey = getSelectedMonthKey()) {
    let receitasMes = filterBySelectedCentro(appState.receitas);
    let despesasMes = filterBySelectedCentro(appState.despesas);
    let investimentosMes = filterBySelectedCentro(appState.investimentos);
    
    // Aplicar filtros de período
    const filters = appState.appliedFilters;
    if (filters.period === 'custom' && filters.dateFrom && filters.dateTo) {
        const fromDate = new Date(filters.dateFrom);
        const toDate = new Date(filters.dateTo);
        receitasMes = receitasMes.filter(r => {
            const rDate = new Date(r.data);
            return rDate >= fromDate && rDate <= toDate;
        });
        despesasMes = despesasMes.filter(d => {
            const dDate = new Date(d.data);
            return dDate >= fromDate && dDate <= toDate;
        });
        investimentosMes = investimentosMes.filter(inv => {
            const invDate = new Date(inv.data);
            return invDate >= fromDate && invDate <= toDate;
        });
    } else if (filters.period !== 'current-month') {
        const now = new Date();
        let fromDate;
        switch (filters.period) {
            case 'last-30-days':
                fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'last-3-months':
                fromDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
                break;
            case 'this-year':
                fromDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        receitasMes = receitasMes.filter(r => new Date(r.data) >= fromDate);
        despesasMes = despesasMes.filter(d => new Date(d.data) >= fromDate);
        investimentosMes = investimentosMes.filter(inv => new Date(inv.data) >= fromDate);
    } else {
        // Filtro padrão por mês
        receitasMes = receitasMes.filter(r => r.data && r.data.substring(0, 7) === monthKey);
        despesasMes = despesasMes.filter(d => d.data && d.data.substring(0, 7) === monthKey);
        investimentosMes = investimentosMes.filter(inv => inv.data && inv.data.substring(0, 7) === monthKey);
    }
    
    // Aplicar filtros de categoria
    if (filters.categories.length > 0) {
        receitasMes = receitasMes.filter(r => filters.categories.includes(r.tipo || 'outros'));
        despesasMes = despesasMes.filter(d => filters.categories.includes(d.categoria || 'outros'));
        investimentosMes = investimentosMes.filter(inv => filters.categories.includes(inv.tipo || 'outros'));
    }
    
    return {
        receitasMes,
        despesasMes,
        investimentosMes,
        totalReceitas: receitasMes.reduce((sum, r) => sum + r.valor, 0),
        totalDespesas: despesasMes.reduce((sum, d) => sum + d.valor, 0),
        totalInvestido: investimentosMes.reduce((sum, inv) => sum + inv.valorInvestido, 0)
    };
}

function formatMonthLabel(key) {
    if (!key) return '';
    const [y, m] = key.split('-');
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${meses[parseInt(m, 10) - 1]}/${y}`;
}

function populateMonthSelector() {
    const select = document.getElementById('dashboardMonthSelector');
    if (!select) return;
    select.innerHTML = '';
    const today = new Date();
    // Mostrar mês seguinte + últimos 24 meses
    for (let i = 1; i >= -24; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const option = document.createElement('option');
        option.value = key;
        option.textContent = formatMonthLabel(key);
        select.appendChild(option);
    }
    // Selecionar mês salvo ou mês atual
    const selected = appState.selectedMonth || getCurrentMonthKey();
    select.value = selected;
    if (select.value !== selected) {
        appState.selectedMonth = getCurrentMonthKey();
        select.value = appState.selectedMonth;
    }
}

function initializeMonthSelector() {
    populateMonthSelector();
    const select = document.getElementById('dashboardMonthSelector');
    if (!select) return;
    select.addEventListener('change', (e) => {
        appState.selectedMonth = e.target.value;
        saveToLocalStorage();
        updateDashboard();
        syncDateInputsWithSelectedMonth();
    });

    const resetBtn = document.getElementById('resetMonthBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            const current = getCurrentMonthKey();
            appState.selectedMonth = current;
            saveToLocalStorage();
            // Atualizar select e dashboard
            if (select) select.value = current;
            updateDashboard();
            syncDateInputsWithSelectedMonth();
            // Atualizar texto da data também
            updateCurrentDate();
        });
    }
}

function initializeFilters() {
    // Dashboard filters
    populateCategoryFilters('categoryFilters');
    const periodFilter = document.getElementById('periodFilter');
    const customDateRange = document.getElementById('customDateRange');
    const toggleCategoriesBtn = document.getElementById('toggleCategoriesBtn');
    const categoriesContainer = document.getElementById('categoriesContainer');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');

    if (periodFilter) {
        periodFilter.addEventListener('change', () => {
            customDateRange.style.display = periodFilter.value === 'custom' ? 'flex' : 'none';
        });
    }

    if (toggleCategoriesBtn) {
        toggleCategoriesBtn.addEventListener('click', () => {
            const isVisible = categoriesContainer.style.display === 'block';
            categoriesContainer.style.display = isVisible ? 'none' : 'block';
            toggleCategoriesBtn.textContent = isVisible ? 'Filtrar por Categorias ▼' : 'Filtrar por Categorias ▲';
        });
    }

    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyDashboardFilters);
    }

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearDashboardFilters);
    }

    // Report filters
    populateCategoryFilters('reportCategoryFilters');
    const reportPeriodFilter = document.getElementById('reportPeriodFilter');
    const reportCustomDateRange = document.getElementById('reportCustomDateRange');
    const toggleReportCategoriesBtn = document.getElementById('toggleReportCategoriesBtn');
    const reportCategoriesContainer = document.getElementById('reportCategoriesContainer');
    const applyReportFiltersBtn = document.getElementById('applyReportFiltersBtn');
    const clearReportFiltersBtn = document.getElementById('clearReportFiltersBtn');

    if (reportPeriodFilter) {
        reportPeriodFilter.addEventListener('change', () => {
            reportCustomDateRange.style.display = reportPeriodFilter.value === 'custom' ? 'flex' : 'none';
        });
    }

    if (toggleReportCategoriesBtn) {
        toggleReportCategoriesBtn.addEventListener('click', () => {
            const isVisible = reportCategoriesContainer.style.display === 'block';
            reportCategoriesContainer.style.display = isVisible ? 'none' : 'block';
            toggleReportCategoriesBtn.textContent = isVisible ? 'Filtrar por Categorias ▼' : 'Filtrar por Categorias ▲';
        });
    }

    if (applyReportFiltersBtn) {
        applyReportFiltersBtn.addEventListener('click', applyReportFilters);
    }

    if (clearReportFiltersBtn) {
        clearReportFiltersBtn.addEventListener('click', clearReportFilters);
    }
}

function populateCategoryFilters(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const allCategories = [...new Set([
        ...appState.categoriasReceitas,
        ...appState.categoriasDespesas
    ])];

    container.innerHTML = '';
    allCategories.forEach(category => {
        const div = document.createElement('div');
        div.className = 'category-filter';
        div.innerHTML = `
            <input type="checkbox" id="${containerId}-${category}" value="${category}">
            <label for="${containerId}-${category}">${category}</label>
        `;
        const checkbox = div.querySelector('input');
        checkbox.addEventListener('change', () => {
            div.classList.toggle('selected', checkbox.checked);
        });
        container.appendChild(div);
    });
}

function applyDashboardFilters() {
    const period = document.getElementById('periodFilter').value;
    const selectedCategories = Array.from(document.querySelectorAll('#categoryFilters input:checked')).map(cb => cb.value);
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;
    
    // Salvar filtros aplicados no estado
    appState.appliedFilters = {
        period: period,
        categories: selectedCategories,
        dateFrom: dateFrom || null,
        dateTo: dateTo || null
    };
    
    saveToLocalStorage();
    
    // Aplicar filtros e atualizar dashboard
    updateDashboard();
}

function clearDashboardFilters() {
    document.getElementById('periodFilter').value = 'current-month';
    document.getElementById('customDateRange').style.display = 'none';
    document.getElementById('categoriesContainer').style.display = 'none';
    document.getElementById('toggleCategoriesBtn').textContent = 'Filtrar por Categorias ▼';
    document.querySelectorAll('#categoryFilters input').forEach(cb => {
        cb.checked = false;
        cb.closest('.category-filter').classList.remove('selected');
    });
    
    // Limpar filtros aplicados
    appState.appliedFilters = {
        period: 'current-month',
        categories: [],
        dateFrom: null,
        dateTo: null
    };
    saveToLocalStorage();
    
    updateDashboard();
}

function applyReportFilters() {
    const period = document.getElementById('reportPeriodFilter').value;
    const selectedCategories = Array.from(document.querySelectorAll('#reportCategoryFilters input:checked')).map(cb => cb.value);
    // Aplicar filtros (lógica básica)
    updateReports();
}

function clearReportFilters() {
    document.getElementById('reportPeriodFilter').value = 'current-month';
    document.getElementById('reportCustomDateRange').style.display = 'none';
    document.getElementById('reportCategoriesContainer').style.display = 'none';
    document.getElementById('toggleReportCategoriesBtn').textContent = 'Filtrar por Categorias ▼';
    document.querySelectorAll('#reportCategoryFilters input').forEach(cb => {
        cb.checked = false;
        cb.closest('.category-filter').classList.remove('selected');
    });
    updateReports();
}

function addNewCategory(type) {
    const categoryName = prompt(`Digite o nome da nova categoria:`);
    
    if (categoryName && categoryName.trim()) {
        const normalizedName = normalizeCategoryName(categoryName);
        
        if (type === 'receita') {
            if (!appState.categoriasReceitas.includes(normalizedName)) {
                appState.categoriasReceitas.push(normalizedName);
                saveToLocalStorage();
                populateSelectCategories();
                document.getElementById('receitaTipo').value = normalizedName;
            } else {
                alert('Esta categoria já existe!');
            }
        } else if (type === 'despesa') {
            if (!appState.categoriasDespesas.includes(normalizedName)) {
                appState.categoriasDespesas.push(normalizedName);
                saveToLocalStorage();
                populateSelectCategories();
                document.getElementById('despesaCategoria').value = normalizedName;
            } else {
                alert('Esta categoria já existe!');
            }
        } else if (type === 'investimento') {
            if (!appState.tiposInvestimentos.includes(normalizedName)) {
                appState.tiposInvestimentos.push(normalizedName);
                saveToLocalStorage();
                populateSelectCategories();
                document.getElementById('investimentoTipo').value = normalizedName;
            } else {
                alert('Esta categoria já existe!');
            }
        }
    }
}

function editCategory(type) {
    let categorias = [];
    if (type === 'receita') categorias = appState.categoriasReceitas;
    if (type === 'despesa') categorias = appState.categoriasDespesas;
    if (type === 'investimento') categorias = appState.tiposInvestimentos;

    if (!categorias.length) {
        alert('Não há categorias para editar.');
        return;
    }

    const atual = prompt(`Digite a categoria que deseja editar:\n${categorias.join(', ')}`);
    if (atual === null || !atual.trim()) return;

    const atualNormalizada = normalizeCategoryName(atual);
    if (!categorias.includes(atualNormalizada)) {
        alert('Categoria não encontrada.');
        return;
    }

    const nova = prompt('Digite o novo nome da categoria:');
    if (nova === null || !nova.trim()) return;

    const novaNormalizada = normalizeCategoryName(nova);
    if (novaNormalizada === atualNormalizada) return;
    if (categorias.includes(novaNormalizada)) {
        alert('Esta categoria já existe!');
        return;
    }

    const index = categorias.indexOf(atualNormalizada);
    categorias[index] = novaNormalizada;

    if (type === 'receita') {
        appState.receitas.forEach(r => {
            if (r.tipo === atualNormalizada) r.tipo = novaNormalizada;
        });
    } else if (type === 'despesa') {
        appState.despesas.forEach(d => {
            if (d.categoria === atualNormalizada) d.categoria = novaNormalizada;
        });
    } else if (type === 'investimento') {
        appState.investimentos.forEach(i => {
            if (i.tipo === atualNormalizada) i.tipo = novaNormalizada;
        });
    }

    saveToLocalStorage();
    populateSelectCategories();
    updateDashboard();
    renderAllData();
    checkBudgetAlert();
}

// Navegação entre Abas
function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tab = item.getAttribute('data-tab');
            
            // Atualizar navegação ativa
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Mostrar conteúdo da aba
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(tab).classList.add('active');
            
            // Atualizar dados específicos da aba
            if (tab === 'receitas') renderReceitas();
            if (tab === 'despesas') renderDespesas();
            if (tab === 'investimentos') renderInvestimentos();
            if (tab === 'relatorios') renderRelatorios();
            if (tab === 'centros') renderCentros();
        });
    });
}

// Modais
function initializeModals() {
    // Modal Receita
    document.getElementById('addReceitaBtn').addEventListener('click', () => {
        openModal('modalReceita');
    });
    
    // Modal Despesa
    document.getElementById('addDespesaBtn').addEventListener('click', () => {
        openModal('modalDespesa');
    });
    
    // Modal Investimento
    document.getElementById('addInvestimentoBtn').addEventListener('click', () => {
        openModal('modalInvestimento');
    });
    
    // Modal Centro Financeiro
    const addCentroBtn = document.getElementById('addCentroBtn');
    if (addCentroBtn) {
        addCentroBtn.addEventListener('click', () => {
            if (!verifyPasswordForAction('adicionar um novo centro')) return;
            document.getElementById('modalCentroTitle').textContent = 'Novo Centro Financeiro';
            document.getElementById('centroId').value = '';
            document.getElementById('centroNome').value = '';
            document.getElementById('centroDescricao').value = '';
            document.getElementById('centroOrcamento').value = '';
            document.getElementById('centroAlertaPercentual').value = '90';
            openModal('modalCentro');
        });
    }
    
    // Modal Orçamento
    document.getElementById('setBudgetBtn').addEventListener('click', () => {
        const autoCheckbox = document.getElementById('orcamentoAutomatico');
        const manualGroup = document.getElementById('orcamentoManualGroup');
        
        autoCheckbox.checked = appState.orcamentoAutomatico !== false;
        document.getElementById('orcamentoValor').value = appState.orcamento || '';
        manualGroup.style.display = autoCheckbox.checked ? 'none' : 'block';
        
        openModal('modalOrcamento');
    });
    
    // Toggle orçamento automático/manual
    document.getElementById('orcamentoAutomatico').addEventListener('change', (e) => {
        const manualGroup = document.getElementById('orcamentoManualGroup');
        manualGroup.style.display = e.target.checked ? 'none' : 'block';
    });
    
    // Modal Gasto Rápido
    document.getElementById('addGastoRapidoBtn').addEventListener('click', () => {
        const { totalReceitas, totalDespesas, totalInvestido } = getMonthTotals();
        const saldoAtual = totalReceitas - totalDespesas - totalInvestido;
        
        document.getElementById('gastoRapidoDescricao').value = '';
        document.getElementById('gastoRapidoValor').value = '';
        document.getElementById('gastoRapidoData').value = getSuggestedDateForMonth();
        document.getElementById('gastoRapidoSaldoAtual').textContent = formatCurrency(saldoAtual);
        document.getElementById('gastoRapidoSaldoDepois').textContent = formatCurrency(saldoAtual);
        
        openModal('modalGastoRapido');
        setTimeout(() => document.getElementById('gastoRapidoDescricao').focus(), 100);
    });
    
    // Atualizar preview do saldo ao digitar valor
    document.getElementById('gastoRapidoValor').addEventListener('input', (e) => {
        const { totalReceitas, totalDespesas, totalInvestido } = getMonthTotals();
        const saldoAtual = totalReceitas - totalDespesas - totalInvestido;
        const valorGasto = parseFloat(e.target.value) || 0;
        
        document.getElementById('gastoRapidoSaldoDepois').textContent = formatCurrency(saldoAtual - valorGasto);
    });
    
    // Modal Meta
    document.getElementById('setGoalBtn').addEventListener('click', () => {
        document.getElementById('metaValor').value = appState.meta || '';
        openModal('modalMeta');
    });
    
    // Fechar modais
    document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            closeAllModals();
        });
    });
    
    // Fechar ao clicar fora
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAllModals();
            }
        });
    });
}

function openModal(modalId) {
    syncDateInputsWithSelectedMonth(true);
    syncCenterInputsWithSelectedCentro();
    document.getElementById(modalId).classList.add('active');
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

function showNotification(message) {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Formulários
function initializeForms() {
    // Form Receita
    document.getElementById('formReceita').addEventListener('submit', (e) => {
        e.preventDefault();
        const receita = {
            id: Date.now(),
            data: document.getElementById('receitaData').value,
            descricao: document.getElementById('receitaDescricao').value,
            centroId: document.getElementById('receitaCentro').value,
            categoria: document.getElementById('receitaTipo').value,
            valor: parseFloat(document.getElementById('receitaValor').value)
        };

        saveFinancialData('receita', receita).then(() => {
            // Recarregar dados da API para consistência
            loadDataFromAPI().then(() => {
                closeAllModals();
                e.target.reset();
                updateDashboard();
                renderReceitas();
            });
        }).catch(error => {
            console.error('Erro ao salvar receita:', error);
            alert('Erro ao salvar receita: ' + (error.message || 'Erro desconhecido'));
        });
    });
    
    // Form Despesa
    document.getElementById('formDespesa').addEventListener('submit', (e) => {
        e.preventDefault();
        const despesa = {
            id: Date.now(),
            data: document.getElementById('despesaData').value,
            descricao: document.getElementById('despesaDescricao').value,
            centroId: document.getElementById('despesaCentro').value,
            categoria: document.getElementById('despesaCategoria').value,
            tipo: document.getElementById('despesaTipo').value,
            natureza: document.getElementById('despesaNatureza').value,
            valor: parseFloat(document.getElementById('despesaValor').value)
        };
// Recarregar dados da API para consistência
            loadDataFromAPI().then(() => {
                closeAllModals();
                e.target.reset();
                updateDashboard();
                renderAllData();
                checkBudgetAlert();
            });
        }).catch(error => {
            console.error('Erro ao salvar despesa:', error);
            alert('Erro ao salvar despesa: ' + (error.message || 'Erro desconhecido')
            console.error('Erro ao salvar despesa:', error);
            alert('Erro ao salvar despesa');
        });
    });
    
    // Form Investimento
    document.getElementById('formInvestimento').addEventListener('submit', (e) => {
        e.preventDefault();
        const despesaId = Date.now() + 1;
        const investimento = {
            id: Date.now(),
            data: document.getElementById('investimentoData').value,
            descricao: document.getElementById('investimentoDescricao').value,
            centroId: document.getElementById('investimentoCentro').value,
            tipo: document.getElementById('investimentoTipo').value,
            categoria: document.getElementById('investimentoTipo').value,
            valorInvestido: parseFloat(String(document.getElementById('investimentoValor').value).replace(',', '.')) || 0,
            rendimento: parseFloat(String(document.getElementById('investimentoRendimento').value).replace(',', '.')) || 0,
            despesaId
        };

        // Criar despesa automaticamente para descontar do saldo
        const despesaInvestimento = {
            id: despesaId,
            data: investimento.data,
            descricao: `Investimento: ${investimento.descricao}`,
            centroId: investimento.centroId,
            categoria: 'investimentos',
            tipo: 'eventual',
            natureza: 'variavel',
            valor: investimento.valorInvestido
        };

        Promise.all([
            saveFinancialData('investimento', investimento),
            saveFinancialData('despesa', despesaInvestimento)
        ]).then(() => {
            // Não adicionar ao appState local - recarregar dados da API para garantir consistência
            loadDataFromAPI().then(() => {
                closeAllModals();
                e.target.reset();
                updateDashboard();
                renderInvestimentos();
                checkBudgetAlert();
            });
        }).catch(error => {
            console.error('Erro ao salvar investimento:', error);
            alert('Erro ao salvar investimento: ' + (error.message || 'Erro desconhecido'));
        });
    });
    
    // Form Orçamento
    document.getElementById('formOrcamento').addEventListener('submit', (e) => {
        e.preventDefault();
        const autoCheckbox = document.getElementById('orcamentoAutomatico');
        appState.orcamentoAutomatico = autoCheckbox.checked;
        
        if (!autoCheckbox.checked) {
            appState.orcamento = parseFloat(document.getElementById('orcamentoValor').value) || 0;
        }
        
        saveToLocalStorage();
        closeAllModals();
        updateDashboard();
        checkBudgetAlert();
    });
    
    // Form Gasto Rápido
    document.getElementById('formGastoRapido').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const novaDespesa = {
            id: Date.now(),
            descricao: document.getElementById('gastoRapidoDescricao').value,
            centroId: document.getElementById('gastoRapidoCentro').value,
            valor: parseFloat(document.getElementById('gastoRapidoValor').value),
            categoria: document.getElementById('gastoRapidoCategoria').value,
            data: document.getElementById('gastoRapidoData').value,
            tipo: 'eventual',
            natureza: 'variavel',
            recorrencia: 'nao-recorrente'
        };
        
        appState.despesas.push(novaDespesa);
        saveToLocalStorage();
        closeAllModals();
        updateDashboard();
        renderAllData();
        checkBudgetAlert();
        
        // Mostrar feedback visual
        showNotification('✅ Gasto registrado com sucesso!');
    });
    
    // Form Meta
    document.getElementById('formMeta').addEventListener('submit', (e) => {
        e.preventDefault();
        appState.meta = parseFloat(document.getElementById('metaValor').value);
        saveToLocalStorage();
        closeAllModals();
        updateDashboard();
    });

    // Form Centro Financeiro
    document.getElementById('formCentro').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('centroId').value;
        const centroData = {
            id: id || `centro-${Date.now()}`,
            nome: document.getElementById('centroNome').value.trim(),
            descricao: document.getElementById('centroDescricao').value.trim(),
            orcamento: parseFloat(document.getElementById('centroOrcamento').value) || 0,
            alertaPercentual: parseFloat(document.getElementById('centroAlertaPercentual').value) || 90,
            meta: 0
        };
        if (!centroData.nome) {
            alert('Nome do centro é obrigatório.');
            return;
        }

        const savePromise = id ?
            updateCentroFinanceiro(id, centroData) :
            saveCentroFinanceiro(centroData);

        savePromise.then(() => {
            const existingIndex = appState.centrosFinanceiros.findIndex(c => c.id === centroData.id);
            if (existingIndex >= 0) {
                appState.centrosFinanceiros[existingIndex] = centroData;
            } else {
                appState.centrosFinanceiros.push(centroData);
            }

            closeAllModals();
            updateDashboard();
            renderCentros();
        }).catch(error => {
            console.error('Erro ao salvar centro:', error);
            alert('Erro ao salvar centro financeiro');
        });
    });
    
    // Filtros
    document.getElementById('filterTipoReceita').addEventListener('change', renderReceitas);
    document.getElementById('filterCategoriaDespesa').addEventListener('change', renderDespesas);
    document.getElementById('filterRecorrencia').addEventListener('change', renderDespesas);
    document.getElementById('filterNaturezaDespesa').addEventListener('change', renderDespesas);
}

// Renderizar Insights dos Maiores Gastos
function renderTopDespesasInsights() {
    const despesas = filterBySelectedCentro(appState.despesas);
    const currentMonth = getSelectedMonthKey();
    const despesasMes = despesas.filter(d => d.data && d.data.substring(0, 7) === currentMonth);
    
    // Agrupar por categoria e somar
    const despesasPorCategoria = {};
    despesasMes.forEach(d => {
        despesasPorCategoria[d.categoria] = (despesasPorCategoria[d.categoria] || 0) + d.valor;
    });
    
    // Ordenar e pegar top 5
    const topDespesas = Object.entries(despesasPorCategoria)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const totalDespesas = despesasMes.reduce((sum, d) => sum + d.valor, 0);
    
    // Ícones por categoria
    const iconsPorCategoria = {
        alimentacao: '🍔',
        moradia: '🏠',
        transporte: '🚗',
        lazer: '🎮',
        saude: '💊',
        educacao: '📚',
        outros: '📦'
    };
    
    const container = document.getElementById('topDespesasInsights');
    if (!container) return;
    
    if (topDespesas.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 2rem;"><p>Nenhuma despesa registrada este mês</p></div>';
        return;
    }
    
    container.innerHTML = topDespesas.map(([categoria, valor]) => {
        const percentual = totalDespesas > 0 ? (valor / totalDespesas * 100) : 0;
        const icone = iconsPorCategoria[categoria] || '📋';
        
        return `
            <div class="insight-item ${categoria}">
                <div class="insight-icon">${icone}</div>
                <div class="insight-content">
                    <div class="insight-title">
                        <span class="insight-category">${capitalize(categoria)}</span>
                        <span class="insight-percentage">${percentual.toFixed(1)}%</span>
                    </div>
                    <div class="insight-value">${formatCurrency(valor)}</div>
                    <div class="insight-bar">
                        <div class="insight-bar-fill" style="width: ${percentual}%"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Atualizar Dashboard
function updateDashboard() {
    // Determinar mês selecionado (se o usuário escolheu) ou mês atual
    const currentMonth = getSelectedMonthKey();
    const selectedCentro = getSelectedCentro();
    
    // Usar totais filtrados se filtros estiverem aplicados
    const hasActiveFilters = appState.appliedFilters.period !== 'current-month' || 
                            appState.appliedFilters.categories.length > 0 ||
                            (appState.appliedFilters.period === 'custom' && appState.appliedFilters.dateFrom);
    const { totalReceitas, totalDespesas, totalInvestido } = hasActiveFilters ? 
        getFilteredMonthTotals(currentMonth) : getMonthTotals(currentMonth);
    
    const saldo = totalReceitas - totalDespesas - totalInvestido;
    
    // Calcular orçamento (automático ou manual)
    let orcamentoAtual = appState.orcamento;
    if (selectedCentro && selectedCentro.id) {
        orcamentoAtual = selectedCentro.orcamento > 0 ? selectedCentro.orcamento : (appState.orcamentoAutomatico !== false ? totalReceitas - totalInvestido : appState.orcamento);
    } else if (appState.orcamentoAutomatico !== false) {
        orcamentoAtual = totalReceitas - totalInvestido;
    }
    
    const percentualGastos = orcamentoAtual > 0 ? (totalDespesas / orcamentoAtual * 100) : 0;
    
    // Atualizar cabeçalho com resumo rápido
    const summaryCenter = document.getElementById('summaryCenterName');
    const summarySaldo = document.getElementById('summarySaldoPrevisto');
    const summaryBudgetRemaining = document.getElementById('summaryOrcamentoRestante');
    const summaryMetaProgress = document.getElementById('summaryMetaProgresso');
    const centroNome = selectedCentro && selectedCentro.nome ? selectedCentro.nome : 'Todos os centros';
    const centroMetaResumo = selectedCentro && selectedCentro.meta > 0 ? selectedCentro.meta : appState.meta;
    const economizadoResumo = saldo > 0 ? saldo : 0;
    const progressoMetaResumo = centroMetaResumo > 0 ? (economizadoResumo / centroMetaResumo * 100) : 0;

    if (summaryCenter) summaryCenter.textContent = centroNome;
    if (summarySaldo) summarySaldo.textContent = formatCurrency(saldo);
    if (summaryBudgetRemaining) summaryBudgetRemaining.textContent = formatCurrency(Math.max(orcamentoAtual - totalDespesas, 0));
    if (summaryMetaProgress) summaryMetaProgress.textContent = centroMetaResumo > 0 ? progressoMetaResumo.toFixed(1) + '%' : '—';

    // Exibir valores do mês corrente no dashboard
    document.getElementById('totalReceitas').textContent = formatCurrency(totalReceitas);
    document.getElementById('totalDespesas').textContent = formatCurrency(totalDespesas);
    document.getElementById('saldoAtual').textContent = formatCurrency(saldo);

    // Atualizar legendas/subtítulos para refletir o mês selecionado
    const subtitles = document.querySelectorAll('#dashboard .card-subtitle');
    subtitles.forEach(sub => {
        sub.textContent = formatMonthLabel(currentMonth);
    });
    document.getElementById('percentualGastos').textContent = percentualGastos.toFixed(1) + '%';
    
    // Orçamento
    document.getElementById('receitasOrcamento').textContent = formatCurrency(totalReceitas);
    document.getElementById('investimentosOrcamento').textContent = formatCurrency(totalInvestido);
    document.getElementById('gastoAtual').textContent = formatCurrency(totalDespesas);
    document.getElementById('orcamentoTotal').textContent = formatCurrency(orcamentoAtual);
    document.getElementById('orcamentoRestante').textContent = formatCurrency(orcamentoAtual - totalDespesas);
    
    // Atualizar texto do modo de orçamento
    const modoTexto = document.getElementById('orcamentoModoTexto');
    if (selectedCentro && selectedCentro.id) {
        if (selectedCentro.orcamento > 0) {
            modoTexto.textContent = `Orçamento do centro: ${formatCurrency(selectedCentro.orcamento)}`;
        } else if (appState.orcamentoAutomatico !== false) {
            modoTexto.textContent = `Orçamento automático do centro: Receitas - Investimentos`;
        } else {
            modoTexto.textContent = '⚙️ Orçamento global definido manualmente';
        }
    } else {
        if (appState.orcamentoAutomatico !== false) {
            modoTexto.textContent = '✓ Orçamento calculado automaticamente: Receitas - Investimentos';
        } else {
            modoTexto.textContent = '⚙️ Orçamento definido manualmente';
        }
    }
    
    // Controle do Saldo Disponível
    document.getElementById('saldoDisponivelTotal').textContent = formatCurrency(saldo);
    document.getElementById('dinheiroGastavel').textContent = formatCurrency(saldo);
    
    const budgetProgress = document.getElementById('budgetProgress');
    const budgetPercent = orcamentoAtual > 0 ? (totalDespesas / orcamentoAtual * 100) : 0;
    budgetProgress.style.width = Math.min(budgetPercent, 100) + '%';
    budgetProgress.classList.remove('warning', 'danger');
    if (budgetPercent >= 90) budgetProgress.classList.add('danger');
    else if (budgetPercent >= 70) budgetProgress.classList.add('warning');
    
    // Meta de Economia
    const economizado = saldo > 0 ? saldo : 0;
    const centroMeta = selectedCentro && selectedCentro.meta > 0 ? selectedCentro.meta : appState.meta;
    const progressoMeta = centroMeta > 0 ? (economizado / centroMeta * 100) : 0;
    
    document.getElementById('economizado').textContent = formatCurrency(economizado);
    document.getElementById('metaTotal').textContent = formatCurrency(centroMeta);
    document.getElementById('progressoMeta').textContent = progressoMeta.toFixed(1) + '%';
    document.getElementById('goalProgress').style.width = Math.min(progressoMeta, 100) + '%';
    
    // Renderizar Insights dos Maiores Gastos
    renderTopDespesasInsights();
    
    // Atualizar Gráficos (apenas com dados do mês corrente)
    updateDashboardCharts();

    // Atualizar painéis detalhados por centro
    renderCenterPanels();
    
    // Atualizar Resumo Mensal
    updateMonthlySummary();
}

function getCenterMonthTotals(centroId, monthKey = getSelectedMonthKey()) {
    const receitasMes = appState.receitas
        .filter(r => r.centroId === centroId && r.data && r.data.substring(0, 7) === monthKey);
    const despesasMes = appState.despesas
        .filter(d => d.centroId === centroId && d.data && d.data.substring(0, 7) === monthKey);
    const investimentosMes = appState.investimentos
        .filter(inv => inv.centroId === centroId && inv.data && inv.data.substring(0, 7) === monthKey);

    return {
        receitasMes,
        despesasMes,
        investimentosMes,
        totalReceitas: receitasMes.reduce((sum, r) => sum + r.valor, 0),
        totalDespesas: despesasMes.reduce((sum, d) => sum + d.valor, 0),
        totalInvestido: investimentosMes.reduce((sum, inv) => sum + inv.valorInvestido, 0)
    };
}

function backupDeletedCenters(centros) {
    if (!Array.isArray(centros) || !centros.length) return;

    appState.deletedCenterBackups = appState.deletedCenterBackups || [];

    centros.forEach((centro) => {
        const receitas = appState.receitas.filter(r => r.centroId === centro.id);
        const despesas = appState.despesas.filter(d => d.centroId === centro.id);
        const investimentos = appState.investimentos.filter(i => i.centroId === centro.id);

        appState.deletedCenterBackups.push({
            centro,
            receitas,
            despesas,
            investimentos,
            removedAt: new Date().toISOString()
        });
    });

    if (appState.deletedCenterBackups.length > 20) {
        appState.deletedCenterBackups.splice(0, appState.deletedCenterBackups.length - 20);
    }
}

function clearAllCenters() {
    const confirmed = confirm('Tem certeza de que deseja apagar todos os centros financeiros? Essa ação não removerá receitas, despesas ou investimentos, apenas os registros de centros.');
    if (!confirmed) return;

    backupDeletedCenters(appState.centrosFinanceiros);
    appState.centrosFinanceiros = [];
    appState.selectedCentroId = 'all';
    saveToLocalStorage();
    populateCenterSelectors();
    renderCentros();
    updateDashboard();
    updateUndoButtonState();
    alert('Todos os centros financeiros foram apagados. Você pode desfazer a exclusão usando o botão de desfazer.');
}

function clearUnusedCenters() {
    const usedIds = new Set([
        ...appState.receitas.map(r => r.centroId),
        ...appState.despesas.map(d => d.centroId),
        ...appState.investimentos.map(i => i.centroId)
    ].filter(Boolean));

    const unusedCenters = appState.centrosFinanceiros.filter(c => !usedIds.has(c.id));
    if (!unusedCenters.length) {
        alert('Não há centros financeiros sem transações para remover.');
        return;
    }

    const confirmed = confirm(`Encontrados ${unusedCenters.length} centro(s) sem transações. Deseja removê-los?`);
    if (!confirmed) return;

    backupDeletedCenters(unusedCenters);
    appState.centrosFinanceiros = appState.centrosFinanceiros.filter(c => usedIds.has(c.id));
    if (!appState.centrosFinanceiros.some(c => c.id === appState.selectedCentroId)) {
        appState.selectedCentroId = 'all';
    }

    saveToLocalStorage();
    populateCenterSelectors();
    renderCentros();
    updateDashboard();
    updateUndoButtonState();
    alert(`${unusedCenters.length} centro(s) sem transações foram removidos. Você pode desfazer a exclusão se precisar.`);
}

function undoLastCenterDeletion() {
    if (!appState.deletedCenterBackups || !appState.deletedCenterBackups.length) {
        alert('Não há exclusões recentes para desfazer.');
        return;
    }

    const backup = appState.deletedCenterBackups.pop();
    if (!backup) {
        alert('Não foi possível desfazer a exclusão.');
        return;
    }

    if (backup.centro) {
        appState.centrosFinanceiros.push(backup.centro);
    }
    if (Array.isArray(backup.receitas)) {
        appState.receitas.push(...backup.receitas);
    }
    if (Array.isArray(backup.despesas)) {
        appState.despesas.push(...backup.despesas);
    }
    if (Array.isArray(backup.investimentos)) {
        appState.investimentos.push(...backup.investimentos);
    }

    saveToLocalStorage();
    populateCenterSelectors();
    renderCentros();
    updateDashboard();
    updateUndoButtonState();
    alert('Última exclusão de centro foi desfeita.');
}

function updateUndoButtonState() {
    const undoDeleteBtn = document.getElementById('undoDeleteBtn');
    if (!undoDeleteBtn) return;
    undoDeleteBtn.disabled = !appState.deletedCenterBackups || !appState.deletedCenterBackups.length;
}

function renderCenterPanels() {
    const grid = document.getElementById('centerPanelsGrid');
    if (!grid) return;

    if (!appState.centrosFinanceiros.length) {
        grid.innerHTML = '<div class="empty-center-panel">Nenhum centro financeiro cadastrado ainda.</div>';
        return;
    }

    const currentMonth = getSelectedMonthKey();
    const selectedCentroId = getSelectedCentroId();

    grid.innerHTML = appState.centrosFinanceiros.map(centro => {
        const { totalReceitas, totalDespesas, totalInvestido } = getCenterMonthTotals(centro.id, currentMonth);
        const saldo = totalReceitas - totalDespesas - totalInvestido;
        const budget = centro.orcamento > 0 ? centro.orcamento : Math.max(totalReceitas - totalInvestido, 0);
        const spentPercent = budget > 0 ? (totalDespesas / budget * 100) : 0;
        const alertClass = spentPercent >= centro.alertaPercentual ? 'center-alert' : '';
        const progressPercent = budget > 0 ? Math.min((totalDespesas / budget) * 100, 100) : 0;

        const highlight = selectedCentroId === 'all'
            ? ''
            : (selectedCentroId === centro.id ? 'center-panel-active' : 'center-panel-dimmed');

        return `
            <div class="center-panel-card ${highlight}">
                <div class="center-panel-header">
                    <div>
                        <h4>${capitalize(centro.nome)}</h4>
                        <p>${centro.descricao || 'Sem descrição'}</p>
                    </div>
                    <span class="center-tag">${formatMonthLabel(currentMonth)}</span>
                </div>

                <div class="center-panel-stats">
                    <div class="stat-item">
                        <span>Receitas</span>
                        <strong>${formatCurrency(totalReceitas)}</strong>
                    </div>
                    <div class="stat-item">
                        <span>Despesas</span>
                        <strong>${formatCurrency(totalDespesas)}</strong>
                    </div>
                    <div class="stat-item">
                        <span>Investimentos</span>
                        <strong>${formatCurrency(totalInvestido)}</strong>
                    </div>
                    <div class="stat-item">
                        <span>Saldo do Centro</span>
                        <strong>${formatCurrency(saldo)}</strong>
                    </div>
                </div>

                <div class="center-panel-progress">
                    <div class="center-progress-label">
                        <span>Uso do Orçamento</span>
                        <strong>${spentPercent.toFixed(1)}%</strong>
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill ${alertClass}" style="width: ${progressPercent}%"></div>
                    </div>
                    <div class="center-panel-meta">
                        <span>Orçamento: ${formatCurrency(budget)}</span>
                        <span>Meta: ${formatCurrency(centro.meta || 0)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Atualizar Resumo Mensal
function updateMonthlySummary() {
    // Agrupar receitas, despesas e investimentos por mês
    const monthlyData = {};
    
    // Processar receitas
    filterBySelectedCentro(appState.receitas).forEach(r => {
        const mes = r.data.substring(0, 7); // YYYY-MM
        if (!monthlyData[mes]) {
            monthlyData[mes] = { receitas: 0, despesas: 0, investimentos: 0 };
        }
        monthlyData[mes].receitas += r.valor;
    });
    
    // Processar despesas
    filterBySelectedCentro(appState.despesas).forEach(d => {
        const mes = d.data.substring(0, 7); // YYYY-MM
        if (!monthlyData[mes]) {
            monthlyData[mes] = { receitas: 0, despesas: 0, investimentos: 0 };
        }
        monthlyData[mes].despesas += d.valor;
    });
    
    // Processar investimentos
    filterBySelectedCentro(appState.investimentos).forEach(inv => {
        const mes = inv.data.substring(0, 7); // YYYY-MM
        if (!monthlyData[mes]) {
            monthlyData[mes] = { receitas: 0, despesas: 0, investimentos: 0 };
        }
        monthlyData[mes].investimentos += inv.valorInvestido;
    });
    
    // Ordenar meses (mais recente primeiro)
    const mesesOrdenados = Object.keys(monthlyData).sort().reverse();
    
    // Renderizar tabela
    const tbody = document.getElementById('monthlySummaryBody');
    tbody.innerHTML = '';
    
    if (mesesOrdenados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-tertiary); padding: 2rem;">Nenhum dado disponível</td></tr>';
        return;
    }
    
    mesesOrdenados.forEach(mes => {
        const data = monthlyData[mes];
        const totalSaido = data.despesas + data.investimentos;
        const sobras = data.receitas - totalSaido;
        const sobrasPercentual = data.receitas > 0 ? (sobras / data.receitas * 100) : 0;
        
        // Formatar o mês
        const [ano, mesNum] = mes.split('-');
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const mesFormatado = `${meses[parseInt(mesNum) - 1]}/${ano}`;
        
        // Determinar classe de cor
        const sobrasClass = sobras < 0 ? 'negative-value' : sobras > 0 ? 'positive-value' : 'neutral-value';
        const percentualClass = sobrasPercentual < 0 ? 'negative-value' : sobrasPercentual > 0 ? 'positive-value' : 'neutral-value';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="month-cell">${mesFormatado}</td>
            <td>${formatCurrency(totalSaido)}</td>
            <td class="${sobrasClass}">${formatCurrency(sobras)}</td>
            <td class="${percentualClass}">${sobrasPercentual.toFixed(1)}%</td>
        `;
        tbody.appendChild(tr);
    });
}

// Atualizar Gráficos do Dashboard
let chartDespesasPorCategoria, chartReceitasDespesas, chartEvolucaoReceitasDashboard;

function updateDashboardCharts() {
    // Usar apenas dados do mês selecionado (ou mês corrente) no dashboard
    const currentMonth = getSelectedMonthKey();
    const { despesasMes, receitasMes, investimentosMes } = getMonthTotals(currentMonth);

    // Despesas por Categoria: gráfico Pareto com comparação entre períodos variados
    const comparePeriod = appState.paretoComparisonPeriod || 'previous-month';
    const despesasMesComparativo = getDespesaPeriodo(comparePeriod, currentMonth);
    const despesasPorCategoriaAtual = {};
    const despesasPorCategoriaComparativo = {};

    despesasMes.forEach(d => {
        despesasPorCategoriaAtual[d.categoria] = (despesasPorCategoriaAtual[d.categoria] || 0) + d.valor;
    });
    despesasMesComparativo.forEach(d => {
        despesasPorCategoriaComparativo[d.categoria] = (despesasPorCategoriaComparativo[d.categoria] || 0) + d.valor;
    });

    const categorias = Array.from(new Set([
        ...Object.keys(despesasPorCategoriaAtual),
        ...Object.keys(despesasPorCategoriaComparativo)
    ])).sort((a, b) => (despesasPorCategoriaAtual[b] || 0) - (despesasPorCategoriaAtual[a] || 0));

    const currentValues = categorias.map(cat => despesasPorCategoriaAtual[cat] || 0);
    const compareValues = categorias.map(cat => despesasPorCategoriaComparativo[cat] || 0);
    const totalAtual = currentValues.reduce((sum, value) => sum + value, 0);
    const cumulativePercent = currentValues.reduce((acc, value, index) => {
        const next = (index === 0 ? 0 : acc[index - 1]) + value;
        acc.push(totalAtual ? (next / totalAtual) * 100 : 0);
        return acc;
    }, []);

    const ctx1 = document.getElementById('despesasPorCategoria').getContext('2d');
    if (chartDespesasPorCategoria) chartDespesasPorCategoria.destroy();
    
    const categoryColors = [
        { bg: 'rgba(99, 102, 241, 0.8)', border: '#6366f1' },
        { bg: 'rgba(16, 185, 129, 0.8)', border: '#10b981' },
        { bg: 'rgba(245, 158, 11, 0.8)', border: '#f59e0b' },
        { bg: 'rgba(239, 68, 68, 0.8)', border: '#ef4444' },
        { bg: 'rgba(59, 130, 246, 0.8)', border: '#3b82f6' },
        { bg: 'rgba(139, 92, 246, 0.8)', border: '#8b5cf6' },
        { bg: 'rgba(236, 72, 153, 0.8)', border: '#ec4899' },
        { bg: 'rgba(6, 182, 212, 0.8)', border: '#06b6d4' }
    ];

    const currentBarColors = categorias.map((_, index) => categoryColors[index % categoryColors.length].bg);
    const currentBorderColors = categorias.map((_, index) => categoryColors[index % categoryColors.length].border);
    
    chartDespesasPorCategoria = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: categorias.map(k => capitalize(k)),
            datasets: [
                {
                    type: 'bar',
                    label: `Período selecionado (${currentMonth})`,
                    data: currentValues,
                    backgroundColor: currentBarColors,
                    borderColor: currentBorderColors,
                    borderWidth: 2,
                    yAxisID: 'y',
                    order: 1
                },
                ...(comparePeriod !== 'none' ? [{
                    type: 'bar',
                    label: comparePeriod === 'last-3-months' ? 'Últimos 3 meses' : comparePeriod === 'same-month-last-year' ? 'Mesmo mês ano anterior' : `Período de comparação`,
                    data: compareValues,
                    backgroundColor: 'rgba(148, 163, 184, 0.45)',
                    borderColor: 'rgba(148, 163, 184, 1)',
                    borderWidth: 2,
                    yAxisID: 'y',
                    order: 1
                }] : []),
                {
                    type: 'line',
                    label: '% Acumulado',
                    data: cumulativePercent,
                    borderColor: 'rgba(250, 204, 21, 1)',
                    backgroundColor: 'rgba(250, 204, 21, 0.25)',
                    yAxisID: 'y1',
                    tension: 0.35,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: false,
                    order: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Valor (R$)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        callback: value => formatCurrency(value)
                    }
                },
                y1: {
                    beginAtZero: true,
                    max: 100,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false
                    },
                    title: {
                        display: true,
                        text: 'Acumulação (%)',
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        callback: value => `${value}%`
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            if (context.dataset.type === 'line') {
                                return `${label}: ${context.parsed.y.toFixed(1)}%`;
                            }
                            return `${label}: ${formatCurrency(context.parsed.y)}`;
                        }
                    }
                }
            }
        }
    });
    
    // Receitas vs Despesas - Gráfico de Barras Premium
    const ctx2 = document.getElementById('receitasDespesas').getContext('2d');
    if (chartReceitasDespesas) chartReceitasDespesas.destroy();
    
    const totalReceitas = receitasMes.reduce((sum, r) => sum + r.valor, 0);
    const totalDespesas = despesasMes.reduce((sum, d) => sum + d.valor, 0);
    const saldoMes = totalReceitas - totalDespesas;
    
    chartReceitasDespesas = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: ['Receitas', 'Despesas', 'Saldo'],
            datasets: [{
                label: 'Valor (R$)',
                data: [totalReceitas, totalDespesas, saldoMes],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    saldoMes >= 0 ? 'rgba(59, 130, 246, 0.8)' : 'rgba(245, 158, 11, 0.8)'
                ],
                borderColor: [
                    '#10b981',
                    '#ef4444',
                    saldoMes >= 0 ? '#3b82f6' : '#f59e0b'
                ],
                borderWidth: 2,
                borderRadius: 12,
                hoverBackgroundColor: [
                    'rgba(16, 185, 129, 1)',
                    'rgba(239, 68, 68, 1)',
                    saldoMes >= 0 ? 'rgba(59, 130, 246, 1)' : 'rgba(245, 158, 11, 1)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 800,
                easing: 'easeInOutQuart'
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    padding: 16,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                    cornerRadius: 12,
                    displayColors: true,
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return 'R$ ' + context.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        callback: function(value) {
                            return 'R$ ' + (value / 1000).toLocaleString('pt-BR') + 'k';
                        },
                        font: { size: 11 }
                    },
                    grid: {
                        color: 'rgba(203, 213, 225, 0.1)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        font: { size: 12, weight: '500' }
                    },
                    grid: {
                        display: false,
                        drawBorder: false
                    }
                }
            }
        }
    });
    
    // Evolução das Receitas - Gráfico de Linha Premium
    const receitasPorMes = {};
    receitasMes.forEach(r => {
        const mes = r.data.substring(0, 7);
        receitasPorMes[mes] = (receitasPorMes[mes] || 0) + r.valor;
    });

    const mesesOrdenados = Object.keys(receitasPorMes).sort();
    const mesesLabels = mesesOrdenados.map(mes => {
        const [ano, mesNum] = mes.split('-');
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return `${meses[parseInt(mesNum) - 1]}/${ano.substring(2)}`;
    });
    const valoresReceitas = mesesOrdenados.map(mes => receitasPorMes[mes]);
    
    const ctx3 = document.getElementById('evolucaoReceitasDashboard').getContext('2d');
    if (chartEvolucaoReceitasDashboard) chartEvolucaoReceitasDashboard.destroy();
    
    // Criar gradiente para área de preenchimento
    const gradientEvolucao = ctx3.createLinearGradient(0, 0, 0, 400);
    gradientEvolucao.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
    gradientEvolucao.addColorStop(1, 'rgba(16, 185, 129, 0.01)');
    
    chartEvolucaoReceitasDashboard = new Chart(ctx3, {
        type: 'line',
        data: {
            labels: mesesLabels,
            datasets: [{
                label: 'Receitas (R$)',
                data: valoresReceitas,
                borderColor: '#10b981',
                backgroundColor: gradientEvolucao,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 6,
                pointHoverRadius: 9,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 3,
                pointStyle: 'circle'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            },
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        font: { size: 13, weight: '500' },
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    padding: 16,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                    cornerRadius: 12,
                    displayColors: true,
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return 'Receitas: R$ ' + context.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        callback: function(value) {
                            return 'R$ ' + (value / 1000).toLocaleString('pt-BR') + 'k';
                        },
                        font: { size: 11 }
                    },
                    grid: {
                        color: 'rgba(203, 213, 225, 0.1)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
    
    // Gráfico detalhado de categorias
    updateDespesasDetalhadasPorCategoria();
}

// Gráfico Detalhado de Despesas por Categoria
function updateDespesasDetalhadasPorCategoria() {
    const hoje = new Date();
    
    // Obter últimos 6 meses
    const meses = [];
    for (let i = 5; i >= 0; i--) {
        const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        meses.push(data.toISOString().substring(0, 7));
    }
    
    // Organizar despesas + investimentos por mês e categoria
    const despesasPorMesCategoria = {};
    
    meses.forEach(mes => {
        despesasPorMesCategoria[mes] = {};
        // Categorias de despesas
        appState.categoriasDespesas.forEach(cat => {
            despesasPorMesCategoria[mes][cat] = 0;
        });
        // Adicionar investimentos como categoria
        despesasPorMesCategoria[mes]['investimentos'] = 0;
    });
    
    // Preencher com dados de despesas
    appState.despesas.forEach(d => {
        const mes = d.data.substring(0, 7);
        if (despesasPorMesCategoria[mes] && despesasPorMesCategoria[mes].hasOwnProperty(d.categoria)) {
            despesasPorMesCategoria[mes][d.categoria] += d.valor;
        }
    });
    
    // Preencher com dados de investimentos
    appState.investimentos.forEach(inv => {
        const mes = inv.data.substring(0, 7);
        if (despesasPorMesCategoria[mes]) {
            despesasPorMesCategoria[mes]['investimentos'] += inv.valorInvestido;
        }
    });
    
    // Preparar labels dos meses
    const mesesLabels = meses.map(mes => {
        const [ano, mesNum] = mes.split('-');
        const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return `${nomesMeses[parseInt(mesNum) - 1]}/${ano.substring(2)}`;
    });
    
    // Cores para as categorias
    const cores = {
        'alimentacao': '#f59e0b',
        'moradia': '#3b82f6',
        'transporte': '#ef4444',
        'lazer': '#8b5cf6',
        'saude': '#10b981',
        'educacao': '#06b6d4',
        'investimentos': '#14b8a6',  // Turquesa para investimentos
        'outros': '#94a3b8'
    };
    
    // Preparar datasets - incluindo investimentos
    const categoriasComInvestimentos = [...appState.categoriasDespesas, 'investimentos'];
    const datasets = categoriasComInvestimentos.map(categoria => {
        const dados = meses.map(mes => despesasPorMesCategoria[mes][categoria] || 0);
        return {
            label: categoria === 'investimentos' ? '💰 Investimentos' : capitalize(categoria),
            data: dados,
            backgroundColor: cores[categoria] || '#6366f1',
            borderColor: cores[categoria] ? cores[categoria].replace('0.8', '1') : '#6366f1',
            borderWidth: 2,
            borderRadius: 12,
            hoverBackgroundColor: cores[categoria] ? cores[categoria].replace('0.8', '1') : '#6366f1',
            borderSkipped: false
        };
    });
    
    // Criar gráfico premium
    const ctx = document.getElementById('despesasDetalhadasPorCategoria');
    if (ctx) {
        const canvasContext = ctx.getContext('2d');
        if (window.chartDespesasDetalhadas) window.chartDespesasDetalhadas.destroy();
        
        window.chartDespesasDetalhadas = new Chart(canvasContext, {
            type: 'bar',
            data: {
                labels: mesesLabels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                scales: {
                    x: {
                        stacked: false,
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                            font: { size: 12, weight: '500' }
                        },
                        grid: {
                            display: false,
                            drawBorder: false
                        }
                    },
                    y: {
                        stacked: false,
                        beginAtZero: true,
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                            callback: function(value) {
                                return 'R$ ' + (value / 1000).toLocaleString('pt-BR') + 'k';
                            },
                            font: { size: 11 }
                        },
                        grid: {
                            color: 'rgba(203, 213, 225, 0.1)',
                            drawBorder: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                            padding: 20,
                            font: { size: 12, weight: '500' },
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        padding: 16,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 },
                        cornerRadius: 12,
                        displayColors: true,
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                const valor = context.parsed.y;
                                return context.dataset.label + ': R$ ' + valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Atualizar tabela detalhada
    atualizarTabelaDespesasDetalhadas(despesasPorMesCategoria, meses, mesesLabels);
}

// Função para atualizar tabela detalhada
function atualizarTabelaDespesasDetalhadas(despesasPorMesCategoria, meses, mesesLabels) {
    const headerRow = document.getElementById('tabelaCategoriaHeaderRow');
    const bodyRows = document.getElementById('tabelaCategoriaBodyRows');
    
    if (!headerRow || !bodyRows) return;
    
    // Limpar linhas existentes (mantendo header)
    const existingCells = headerRow.querySelectorAll('th:not(:first-child)');
    existingCells.forEach(cell => cell.remove());
    bodyRows.innerHTML = '';
    
    // Adicionar headers das categorias
    appState.categoriasDespesas.forEach(categoria => {
        const th = document.createElement('th');
        th.textContent = capitalize(categoria);
        th.style.textAlign = 'right';
        headerRow.appendChild(th);
    });
    
    // Adicionar header de investimentos
    const thInv = document.createElement('th');
    thInv.textContent = '💰 Investimentos';
    thInv.style.textAlign = 'right';
    thInv.style.fontWeight = '600';
    thInv.style.color = '#14b8a6';
    thInv.style.borderLeft = '2px solid var(--border-color)';
    headerRow.appendChild(thInv);
    
    // Adicionar linha de Total
    const thTotal = document.createElement('th');
    thTotal.textContent = 'Total Saído';
    thTotal.style.textAlign = 'right';
    thTotal.style.fontWeight = '700';
    thTotal.style.borderLeft = '2px solid var(--border-color)';
    headerRow.appendChild(thTotal);
    
    // Preencher corpo da tabela
    meses.forEach((mes, index) => {
        const tr = document.createElement('tr');
        
        // Coluna de mês
        const tdMes = document.createElement('td');
        tdMes.textContent = mesesLabels[index];
        tdMes.className = 'month-cell';
        tdMes.style.fontWeight = '600';
        tr.appendChild(tdMes);
        
        // Colunas de categorias de despesas
        let totalDespesas = 0;
        appState.categoriasDespesas.forEach(categoria => {
            const td = document.createElement('td');
            const valor = despesasPorMesCategoria[mes][categoria];
            totalDespesas += valor;
            
            if (valor > 0) {
                td.textContent = formatCurrency(valor);
                td.style.color = 'var(--text-primary)';
            } else {
                td.textContent = '-';
                td.style.color = 'var(--text-tertiary)';
            }
            td.style.textAlign = 'right';
            tr.appendChild(td);
        });
        
        // Coluna de investimentos
        const tdInv = document.createElement('td');
        const valorInv = despesasPorMesCategoria[mes]['investimentos'] || 0;
        if (valorInv > 0) {
            tdInv.textContent = formatCurrency(valorInv);
            tdInv.style.color = '#14b8a6';
            tdInv.style.fontWeight = '600';
        } else {
            tdInv.textContent = '-';
            tdInv.style.color = 'var(--text-tertiary)';
        }
        tdInv.style.textAlign = 'right';
        tdInv.style.borderLeft = '2px solid var(--border-color)';
        tr.appendChild(tdInv);
        
        // Coluna de total
        const tdTotal = document.createElement('td');
        const totalMes = totalDespesas + valorInv;
        tdTotal.textContent = formatCurrency(totalMes);
        tdTotal.style.textAlign = 'right';
        tdTotal.style.fontWeight = '700';
        tdTotal.style.color = '#ef4444';
        tdTotal.style.borderLeft = '2px solid var(--border-color)';
        tr.appendChild(tdTotal);
        
        bodyRows.appendChild(tr);
    });
}

// Renderizar Receitas
let chartEvolucaoReceitas;

function renderReceitas() {
    const filter = document.getElementById('filterTipoReceita').value;
    let receitas = appState.receitas;
    
    // Filtrar por centro selecionado na aba de receitas
    if (appState.selectedReceitasCentroId && appState.selectedReceitasCentroId !== 'all') {
        receitas = receitas.filter(r => r.centroId === appState.selectedReceitasCentroId);
    }
    
    if (filter !== 'todos') {
        receitas = receitas.filter(r => r.tipo === filter);
    }
    
    const tbody = document.getElementById('receitasTableBody');
    tbody.innerHTML = '';
    
    receitas.sort((a, b) => new Date(b.data) - new Date(a.data)).forEach(receita => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatDate(receita.data)}</td>
            <td>${receita.descricao}</td>
            <td>${capitalize(receita.tipo)}</td>
            <td style="color: var(--revenue); font-weight: 600;">${formatCurrency(receita.valor)}</td>
            <td>
                <button class="action-btn edit" onclick="editItem('receitas', ${receita.id})" title="Editar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 20h9"/>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
                    </svg>
                </button>
                <button class="action-btn delete" onclick="deleteItem('receitas', ${receita.id})">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Gráfico de Evolução de Receitas Premium
    const receitasPorMes = {};
    receitas.forEach(r => {
        const mes = r.data.substring(0, 7);
        receitasPorMes[mes] = (receitasPorMes[mes] || 0) + r.valor;
    });
    
    const mesesReceitasOrdenados = Object.keys(receitasPorMes).sort();
    const mesesReceitasLabels = mesesReceitasOrdenados.map(mes => {
        const [ano, mesNum] = mes.split('-');
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return `${meses[parseInt(mesNum) - 1]}/${ano.substring(2)}`;
    });
    const valoresReceitasAba = mesesReceitasOrdenados.map(k => receitasPorMes[k]);
    
    const ctx = document.getElementById('evolucaoReceitas').getContext('2d');
    if (chartEvolucaoReceitas) chartEvolucaoReceitas.destroy();
    
    // Criar gradiente premium para área
    const gradientReceitasAba = ctx.createLinearGradient(0, 0, 0, 400);
    gradientReceitasAba.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
    gradientReceitasAba.addColorStop(1, 'rgba(16, 185, 129, 0.01)');
    
    chartEvolucaoReceitas = new Chart(ctx, {
        type: 'line',
        data: {
            labels: mesesReceitasLabels,
            datasets: [{
                label: 'Receitas (R$)',
                data: valoresReceitasAba,
                borderColor: '#10b981',
                backgroundColor: gradientReceitasAba,
                borderWidth: 4,
                fill: true,
                tension: 0.45,
                pointRadius: 7,
                pointHoverRadius: 10,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 3,
                pointStyle: 'circle',
                segment: {
                    borderDash: function(ctx) {
                        return ctx.p0DataIndex === undefined ? undefined : [];
                    }
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        font: { size: 13, weight: '500' },
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    padding: 16,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                    cornerRadius: 12,
                    displayColors: true,
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return 'Receitas: R$ ' + context.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                        },
                        afterLabel: function(context) {
                            if (context.dataIndex > 0) {
                                const anterior = context.dataset.data[context.dataIndex - 1];
                                const atual = context.parsed.y;
                                const variacao = atual - anterior;
                                const percentual = ((variacao / anterior) * 100).toFixed(1);
                                const icon = variacao >= 0 ? '↑' : '↓';
                                const cor = variacao >= 0 ? '#10b981' : '#ef4444';
                                return `Variação: ${icon} ${Math.abs(percentual)}%`;
                            }
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        callback: function(value) {
                            return 'R$ ' + (value / 1000).toLocaleString('pt-BR') + 'k';
                        },
                        font: { size: 11 }
                    },
                    grid: {
                        color: 'rgba(203, 213, 225, 0.1)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        font: { size: 11, weight: '500' }
                    },
                    grid: {
                        display: false,
                        drawBorder: false
                    }
                }
            }
        }
    });
}

// Renderizar Despesas
let chartDistribuicaoDespesas;

function renderDespesas() {
    const filterCategoria = document.getElementById('filterCategoriaDespesa').value;
    const filterRecorrencia = document.getElementById('filterRecorrencia').value;
    const filterNatureza = document.getElementById('filterNaturezaDespesa').value;
    
    let despesas = appState.despesas;
    
    // Filtrar por centro selecionado na aba de despesas
    if (appState.selectedDespesasCentroId && appState.selectedDespesasCentroId !== 'all') {
        despesas = despesas.filter(d => d.centroId === appState.selectedDespesasCentroId);
    }
    
    if (filterCategoria !== 'todos') {
        despesas = despesas.filter(d => d.categoria === filterCategoria);
    }
    
    if (filterRecorrencia !== 'todos') {
        despesas = despesas.filter(d => d.tipo === filterRecorrencia);
    }
    
    if (filterNatureza !== 'todos') {
        despesas = despesas.filter(d => d.natureza === filterNatureza);
    }
    
    const tbody = document.getElementById('despesasTableBody');
    tbody.innerHTML = '';
    
    despesas.sort((a, b) => new Date(b.data) - new Date(a.data)).forEach(despesa => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatDate(despesa.data)}</td>
            <td>${despesa.descricao}</td>
            <td>${capitalize(despesa.categoria)}</td>
            <td><span class="badge badge-${despesa.tipo}">${capitalize(despesa.tipo)}</span></td>
            <td><span class="badge badge-${despesa.natureza || 'variavel'}">${capitalize(despesa.natureza || 'variável')}</span></td>
            <td style="color: var(--expense); font-weight: 600;">${formatCurrency(despesa.valor)}</td>
            <td>
                <button class="action-btn edit" onclick="editItem('despesas', ${despesa.id})" title="Editar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 20h9"/>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
                    </svg>
                </button>
                <button class="action-btn delete" onclick="deleteItem('despesas', ${despesa.id})">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Gráfico de Distribuição de Despesas Premium
    const despesasPorCategoria = {};
    despesas.forEach(d => {
        despesasPorCategoria[d.categoria] = (despesasPorCategoria[d.categoria] || 0) + d.valor;
    });
    
    const ctx = document.getElementById('distribuicaoDespesas').getContext('2d');
    if (chartDistribuicaoDespesas) chartDistribuicaoDespesas.destroy();
    
    const despesasColors = [
        { bg: 'rgba(239, 68, 68, 0.8)', border: '#ef4444' },
        { bg: 'rgba(245, 158, 11, 0.8)', border: '#f59e0b' },
        { bg: 'rgba(16, 185, 129, 0.8)', border: '#10b981' },
        { bg: 'rgba(59, 130, 246, 0.8)', border: '#3b82f6' },
        { bg: 'rgba(139, 92, 246, 0.8)', border: '#8b5cf6' },
        { bg: 'rgba(236, 72, 153, 0.8)', border: '#ec4899' },
        { bg: 'rgba(6, 182, 212, 0.8)', border: '#06b6d4' },
        { bg: 'rgba(99, 102, 241, 0.8)', border: '#6366f1' }
    ];
    
    chartDistribuicaoDespesas = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(despesasPorCategoria).map(k => capitalize(k)),
            datasets: [{
                data: Object.values(despesasPorCategoria),
                backgroundColor: despesasColors.map(c => c.bg),
                borderColor: despesasColors.map(c => c.border),
                borderWidth: 3,
                hoverOffset: 12,
                hoverBorderWidth: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                animateRotate: true,
                animateScale: false,
                duration: 1000,
                easing: 'easeInOutQuart'
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        padding: 20,
                        font: { size: 13, weight: '500' },
                        usePointStyle: true,
                        pointStyle: 'circle',
                        generateLabels: function(chart) {
                            const data = chart.data;
                            return data.labels.map((label, i) => ({
                                text: label,
                                fillStyle: data.datasets[0].backgroundColor[i],
                                hidden: false,
                                index: i
                            }));
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    padding: 16,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                    cornerRadius: 12,
                    displayColors: true,
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: R$ ${context.parsed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Verificar Alerta de Orçamento
function checkBudgetAlert() {
    const receitas = filterBySelectedCentro(appState.receitas);
    const despesas = filterBySelectedCentro(appState.despesas);
    const investimentos = filterBySelectedCentro(appState.investimentos);
    const selectedCentro = getSelectedCentro();

    const totalReceitas = receitas.reduce((sum, r) => sum + r.valor, 0);
    const totalDespesas = despesas.reduce((sum, d) => sum + d.valor, 0);
    const totalInvestido = investimentos.reduce((sum, inv) => sum + inv.valorInvestido, 0);

    let orcamentoAtual;
    if (selectedCentro && selectedCentro.id) {
        orcamentoAtual = selectedCentro.orcamento > 0 ? selectedCentro.orcamento : (appState.orcamentoAutomatico !== false ? totalReceitas - totalInvestido : appState.orcamento);
    } else {
        orcamentoAtual = appState.orcamento;
        if (appState.orcamentoAutomatico !== false) {
            orcamentoAtual = totalReceitas - totalInvestido;
        }
    }

    const percentual = orcamentoAtual > 0 ? (totalDespesas / orcamentoAtual * 100) : 0;
    const alertBox = document.getElementById('budgetAlert');
    const alertText = document.getElementById('budgetAlertText');

    if (percentual >= 90) {
        alertBox.style.display = 'flex';
        alertText.textContent = `Atenção! Você já gastou ${percentual.toFixed(1)}% do orçamento.`;
    } else if (percentual >= 80) {
        alertBox.style.display = 'flex';
        alertBox.style.background = 'rgba(245, 158, 11, 0.1)';
        alertBox.style.borderColor = 'var(--warning)';
        alertBox.style.color = 'var(--warning)';
        alertText.textContent = `Você já utilizou ${percentual.toFixed(1)}% do orçamento.`;
    } else {
        alertBox.style.display = 'none';
    }
}

// Renderizar Investimentos
let chartEvolucaoInvestimentos;

function renderInvestimentos() {
    let investimentos = appState.investimentos;
    
    // Filtrar por centro selecionado na aba de investimentos
    if (appState.selectedInvestimentosCentroId && appState.selectedInvestimentosCentroId !== 'all') {
        investimentos = investimentos.filter(inv => inv.centroId === appState.selectedInvestimentosCentroId);
    }
    const tbody = document.getElementById('investimentosTableBody');
    tbody.innerHTML = '';
    
    let totalInvestido = 0;
    let rendimentoTotal = 0;
    
    investimentos.sort((a, b) => new Date(b.data) - new Date(a.data)).forEach(inv => {
        totalInvestido += inv.valorInvestido;
        rendimentoTotal += inv.rendimento;
        
        const valorAtual = inv.valorInvestido + inv.rendimento;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatDate(inv.data)}</td>
            <td>${inv.descricao}</td>
            <td>${capitalize(inv.tipo.replace('_', ' '))}</td>
            <td>${formatCurrency(inv.valorInvestido)}</td>
            <td style="color: ${inv.rendimento >= 0 ? 'var(--success)' : 'var(--expense)'}; font-weight: 600;">
                ${formatCurrency(inv.rendimento)}
            </td>
            <td style="font-weight: 600;">${formatCurrency(valorAtual)}</td>
            <td>
                <button class="action-btn edit" onclick="editItem('investimentos', ${inv.id})" title="Editar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 20h9"/>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
                    </svg>
                </button>
                <button class="action-btn delete" onclick="deleteItem('investimentos', ${inv.id})">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    document.getElementById('totalInvestido').textContent = formatCurrency(totalInvestido);
    document.getElementById('rendimentoTotal').textContent = formatCurrency(rendimentoTotal);
    document.getElementById('valorAtualInvestimentos').textContent = formatCurrency(totalInvestido + rendimentoTotal);
    
    // Gráfico de Evolução de Investimentos Premium
    const investimentosPorMes = {};
    investimentos.forEach(inv => {
        const mes = inv.data.substring(0, 7);
        const valorAtual = inv.valorInvestido + inv.rendimento;
        investimentosPorMes[mes] = (investimentosPorMes[mes] || 0) + valorAtual;
    });
    
    const ctx = document.getElementById('evolucaoInvestimentos').getContext('2d');
    if (chartEvolucaoInvestimentos) chartEvolucaoInvestimentos.destroy();
    
    // Gerar dados acumulados com labels formatados
    const mesesInvOrdenados = Object.keys(investimentosPorMes).sort();
    const mesesInvLabels = mesesInvOrdenados.map(mes => {
        const [ano, mesNum] = mes.split('-');
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return `${meses[parseInt(mesNum) - 1]}/${ano.substring(2)}`;
    });
    
    let acumulado = 0;
    const dadosAcumulados = mesesInvOrdenados.map(mes => {
        acumulado += investimentosPorMes[mes];
        return acumulado;
    });
    
    // Criar gradiente para investimentos
    const gradientInv = ctx.createLinearGradient(0, 0, 0, 400);
    gradientInv.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
    gradientInv.addColorStop(1, 'rgba(59, 130, 246, 0.01)');
    
    chartEvolucaoInvestimentos = new Chart(ctx, {
        type: 'line',
        data: {
            labels: mesesInvLabels,
            datasets: [{
                label: 'Investimentos Acumulados (R$)',
                data: dadosAcumulados,
                borderColor: '#3b82f6',
                backgroundColor: gradientInv,
                borderWidth: 4,
                fill: true,
                tension: 0.45,
                pointRadius: 7,
                pointHoverRadius: 10,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 3,
                pointStyle: 'circle'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        font: { size: 13, weight: '500' },
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    padding: 16,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                    cornerRadius: 12,
                    displayColors: true,
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return 'Total: R$ ' + context.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        callback: function(value) {
                            return 'R$ ' + (value / 1000).toLocaleString('pt-BR') + 'k';
                        },
                        font: { size: 11 }
                    },
                    grid: {
                        color: 'rgba(203, 213, 225, 0.1)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        font: { size: 11, weight: '500' }
                    },
                    grid: {
                        display: false,
                        drawBorder: false
                    }
                }
            }
        }
    });
}

// Análise Financeira Qualitativa
function renderFinancialAnalysis(receitas, despesas, investimentos, saldo, receitasDados = null, despesasDados = null, investimentosDados = null) {
    const analysisContainer = document.getElementById('financialAnalysis');
    const insightsContainer = document.getElementById('financialInsights');
    
    const receitasUsadas = receitasDados || filterBySelectedCentro(appState.receitas);
    const despesasUsadas = despesasDados || filterBySelectedCentro(appState.despesas);
    const investimentosUsados = investimentosDados || filterBySelectedCentro(appState.investimentos);
    
    // Calcular indicadores
    const taxaPoupanca = receitas > 0 ? ((saldo / receitas) * 100) : 0;
    const taxaInvestimento = receitas > 0 ? ((investimentos / receitas) * 100) : 0;
    const comprometimentoRenda = receitas > 0 ? ((despesas / receitas) * 100) : 0;
    const capacidadeEconomia = saldo;
    
    // Calcular despesas fixas vs variáveis
    const despesasFixas = despesasUsadas.filter(d => d.natureza === 'fixa').reduce((sum, d) => sum + d.valor, 0);
    const despesasVariaveis = despesasUsadas.filter(d => d.natureza === 'variavel').reduce((sum, d) => sum + d.valor, 0);
    const percentualFixas = despesas > 0 ? ((despesasFixas / despesas) * 100) : 0;
    
    // Análise por categoria
    const categorias = {};
    despesasUsadas.forEach(d => {
        categorias[d.categoria] = (categorias[d.categoria] || 0) + d.valor;
    });
    
    const insights = [];
    
    // Cards de Indicadores
    const indicators = [
        {
            title: 'Taxa de Poupança',
            value: `${taxaPoupanca.toFixed(1)}%`,
            label: 'do que você ganha está sendo economizado',
            status: taxaPoupanca >= 20 ? 'excellent' : taxaPoupanca >= 10 ? 'good' : taxaPoupanca >= 5 ? 'warning' : 'danger',
            statusText: taxaPoupanca >= 20 ? 'Excelente' : taxaPoupanca >= 10 ? 'Bom' : taxaPoupanca >= 5 ? 'Atenção' : 'Crítico',
            icon: taxaPoupanca >= 20 ? '🎯' : taxaPoupanca >= 10 ? '✅' : taxaPoupanca >= 5 ? '⚠️' : '🚨'
        },
        {
            title: 'Comprometimento de Renda',
            value: `${comprometimentoRenda.toFixed(1)}%`,
            label: 'da sua renda está comprometida',
            status: comprometimentoRenda <= 70 ? 'excellent' : comprometimentoRenda <= 80 ? 'good' : comprometimentoRenda <= 90 ? 'warning' : 'danger',
            statusText: comprometimentoRenda <= 70 ? 'Saudável' : comprometimentoRenda <= 80 ? 'Aceitável' : comprometimentoRenda <= 90 ? 'Alto' : 'Muito Alto',
            icon: comprometimentoRenda <= 70 ? '💪' : comprometimentoRenda <= 80 ? '👍' : comprometimentoRenda <= 90 ? '⚠️' : '⛔'
        },
        {
            title: 'Taxa de Investimento',
            value: `${taxaInvestimento.toFixed(1)}%`,
            label: 'da sua renda em investimentos',
            status: taxaInvestimento >= 15 ? 'excellent' : taxaInvestimento >= 10 ? 'good' : taxaInvestimento >= 5 ? 'warning' : 'danger',
            statusText: taxaInvestimento >= 15 ? 'Ótimo' : taxaInvestimento >= 10 ? 'Bom' : taxaInvestimento >= 5 ? 'Regular' : 'Baixo',
            icon: taxaInvestimento >= 15 ? '📈' : taxaInvestimento >= 10 ? '📊' : taxaInvestimento >= 5 ? '📉' : '⬇️'
        },
        {
            title: 'Equilíbrio Fixas/Variáveis',
            value: `${percentualFixas.toFixed(0)}/${(100 - percentualFixas).toFixed(0)}`,
            label: 'distribuição de despesas (%)',
            status: percentualFixas >= 40 && percentualFixas <= 60 ? 'excellent' : percentualFixas >= 30 && percentualFixas <= 70 ? 'good' : 'warning',
            statusText: percentualFixas >= 40 && percentualFixas <= 60 ? 'Equilibrado' : percentualFixas >= 30 && percentualFixas <= 70 ? 'Aceitável' : 'Desequilibrado',
            icon: percentualFixas >= 40 && percentualFixas <= 60 ? '⚖️' : percentualFixas >= 30 && percentualFixas <= 70 ? '📊' : '⚠️'
        }
    ];
    
    // Renderizar cards
    analysisContainer.innerHTML = indicators.map(ind => `
        <div class="analysis-card ${ind.status}">
            <div class="analysis-card-header">
                <span class="analysis-card-title">${ind.title}</span>
                <span class="analysis-card-icon">${ind.icon}</span>
            </div>
            <div class="analysis-card-value">${ind.value}</div>
            <div class="analysis-card-label">${ind.label}</div>
            <span class="analysis-card-status status-${ind.status}">${ind.statusText}</span>
        </div>
    `).join('');
    
    // Gerar insights
    
    // Insight 1: Taxa de Poupança
    if (taxaPoupanca >= 20) {
        insights.push({
            type: 'positive',
            icon: '🎉',
            title: 'Excelente capacidade de poupança!',
            description: `Você está economizando ${taxaPoupanca.toFixed(1)}% da sua renda, superando a recomendação mínima de 20%. Continue assim para alcançar seus objetivos financeiros mais rapidamente.`
        });
    } else if (taxaPoupanca < 10) {
        insights.push({
            type: 'negative',
            icon: '💡',
            title: 'Oportunidade de melhorar sua poupança',
            description: `Sua taxa de poupança está em ${taxaPoupanca.toFixed(1)}%. Especialistas recomendam poupar pelo menos 20% da renda. Considere revisar suas despesas variáveis para aumentar sua capacidade de economia.`
        });
    }
    
    // Insight 2: Regra 50/30/20
    const necessidades = despesasFixas / receitas * 100;
    const desejos = despesasVariaveis / receitas * 100;
    const economia = taxaPoupanca;
    
    if (necessidades > 50) {
        insights.push({
            type: 'neutral',
            icon: '🏠',
            title: 'Despesas essenciais acima do ideal',
            description: `Suas despesas fixas representam ${necessidades.toFixed(1)}% da renda. A regra 50/30/20 recomenda manter as necessidades em até 50%. Considere renegociar contratos ou buscar alternativas mais econômicas.`
        });
    }
    
    // Insight 3: Investimentos
    if (taxaInvestimento >= 10 && saldo > 0) {
        insights.push({
            type: 'positive',
            icon: '🚀',
            title: 'Boa estratégia de investimento',
            description: `Você está investindo ${taxaInvestimento.toFixed(1)}% da sua renda. Isso demonstra planejamento para o futuro e construção de patrimônio de longo prazo.`
        });
    } else if (taxaInvestimento < 5 && saldo > 0) {
        insights.push({
            type: 'neutral',
            icon: '💰',
            title: 'Considere aumentar seus investimentos',
            description: `Com uma economia de ${formatCurrency(saldo)}, você tem potencial para investir mais. Especialistas sugerem investir pelo menos 10% da renda para garantir independência financeira futura.`
        });
    }
    
    // Insight 4: Maior categoria de gasto
    if (Object.keys(categorias).length > 0) {
        const maiorCategoria = Object.entries(categorias).sort((a, b) => b[1] - a[1])[0];
        const percentualCategoria = (maiorCategoria[1] / despesas * 100).toFixed(1);
        
        if (percentualCategoria > 40) {
            insights.push({
                type: 'neutral',
                icon: '📊',
                title: `Alta concentração em ${capitalize(maiorCategoria[0])}`,
                description: `${percentualCategoria}% de suas despesas estão em ${capitalize(maiorCategoria[0])} (${formatCurrency(maiorCategoria[1])}). Considere diversificar seus gastos ou avaliar se há oportunidades de redução nesta categoria.`
            });
        }
    }
    
    // Insight 5: Saldo negativo
    if (saldo < 0) {
        insights.push({
            type: 'negative',
            icon: '🚨',
            title: 'Atenção: Déficit financeiro',
            description: `Suas despesas estão ${formatCurrency(Math.abs(saldo))} acima das receitas. É fundamental ajustar seus gastos ou buscar formas de aumentar sua renda para evitar endividamento.`
        });
    }
    
    // Insight 6: Saúde financeira geral
    if (taxaPoupanca >= 20 && comprometimentoRenda <= 70 && taxaInvestimento >= 10) {
        insights.push({
            type: 'positive',
            icon: '✨',
            title: 'Saúde financeira excelente!',
            description: 'Você está mantendo bons indicadores em poupança, investimento e controle de gastos. Continue monitorando seus resultados e ajustando conforme necessário.'
        });
    }
    
    // Renderizar insights
    insightsContainer.innerHTML = insights.length > 0 
        ? `<h4 style="margin-bottom: 1rem; color: var(--text-primary);">💡 Insights e Recomendações</h4>` + 
          insights.map(insight => `
            <div class="insight-card ${insight.type}">
                <div class="insight-title">
                    <span>${insight.icon}</span>
                    <span>${insight.title}</span>
                </div>
                <div class="insight-description">${insight.description}</div>
            </div>
          `).join('')
        : '<p style="color: var(--text-tertiary); text-align: center; padding: 2rem;">Adicione receitas e despesas para gerar análises personalizadas.</p>';
}

// Renderizar Relatórios
let chartComparativoMensal;

function renderRelatorios() {
    const receitas = filterBySelectedCentro(appState.receitas);
    const despesas = filterBySelectedCentro(appState.despesas);
    const investimentos = filterBySelectedCentro(appState.investimentos);

    const totalReceitas = receitas.reduce((sum, r) => sum + r.valor, 0);
    const totalDespesas = despesas.reduce((sum, d) => sum + d.valor, 0);
    const totalInvestimentos = investimentos.reduce((sum, i) => sum + i.valorInvestido, 0);
    const saldo = totalReceitas - totalDespesas;
    
    document.getElementById('reportReceitas').textContent = formatCurrency(totalReceitas);
    document.getElementById('reportDespesas').textContent = formatCurrency(totalDespesas);
    document.getElementById('reportInvestimentos').textContent = formatCurrency(totalInvestimentos);
    document.getElementById('reportSaldo').textContent = formatCurrency(saldo);
    
    // Análises Qualitativas
    renderFinancialAnalysis(totalReceitas, totalDespesas, totalInvestimentos, saldo, receitas, despesas, investimentos);
    
    // Gráfico Comparativo Mensal Premium
    const dadosMensais = {};
    
    receitas.forEach(r => {
        const mes = r.data.substring(0, 7);
        if (!dadosMensais[mes]) dadosMensais[mes] = { receitas: 0, despesas: 0 };
        dadosMensais[mes].receitas += r.valor;
    });
    
    despesas.forEach(d => {
        const mes = d.data.substring(0, 7);
        if (!dadosMensais[mes]) dadosMensais[mes] = { receitas: 0, despesas: 0 };
        dadosMensais[mes].despesas += d.valor;
    });
    
    const meses = Object.keys(dadosMensais).sort().slice(-6);
    const mesesLabelsReport = meses.map(mes => {
        const [ano, mesNum] = mes.split('-');
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return `${meses[parseInt(mesNum) - 1]}/${ano.substring(2)}`;
    });
    const receitasMeses = meses.map(m => dadosMensais[m].receitas);
    const despesasMeses = meses.map(m => dadosMensais[m].despesas);
    
    const ctx = document.getElementById('comparativoMensal').getContext('2d');
    if (chartComparativoMensal) chartComparativoMensal.destroy();
    
    chartComparativoMensal = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: mesesLabelsReport,
            datasets: [
                {
                    label: 'Receitas',
                    data: receitasMeses,
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderColor: '#10b981',
                    borderWidth: 2,
                    borderRadius: 12,
                    hoverBackgroundColor: 'rgba(16, 185, 129, 1)'
                },
                {
                    label: 'Despesas',
                    data: despesasMeses,
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    borderColor: '#ef4444',
                    borderWidth: 2,
                    borderRadius: 12,
                    hoverBackgroundColor: 'rgba(239, 68, 68, 1)'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 800,
                easing: 'easeInOutQuart'
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        font: { size: 13, weight: '500' },
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    padding: 16,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                    cornerRadius: 12,
                    displayColors: true,
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: R$ ${context.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        callback: function(value) {
                            return 'R$ ' + (value / 1000).toLocaleString('pt-BR') + 'k';
                        },
                        font: { size: 11 }
                    },
                    grid: {
                        color: 'rgba(203, 213, 225, 0.1)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                        font: { size: 12, weight: '500' }
                    },
                    grid: {
                        display: false,
                        drawBorder: false
                    }
                }
            }
        }
    });
    
    // Detalhamento por Categoria
    const despesasPorCategoria = {};
    despesas.forEach(d => {
        despesasPorCategoria[d.categoria] = (despesasPorCategoria[d.categoria] || 0) + d.valor;
    });
    
    const container = document.getElementById('categoriasDetalhamento');
    container.innerHTML = '';
    
    const totalDespesasGeral = Object.values(despesasPorCategoria).reduce((a, b) => a + b, 0);
    
    Object.entries(despesasPorCategoria).sort((a, b) => b[1] - a[1]).forEach(([categoria, valor]) => {
        const percentual = totalDespesasGeral > 0 ? (valor / totalDespesasGeral * 100).toFixed(1) : '0.0';
        const item = document.createElement('div');
        item.className = 'category-item';
        item.innerHTML = `
            <div>
                <div class="category-name">${capitalize(categoria)}</div>
                <div class="category-bar">
                    <div class="category-fill" style="width: ${percentual}%"></div>
                </div>
            </div>
            <div class="category-value">${formatCurrency(valor)} (${percentual}%)</div>
        `;
        container.appendChild(item);
    });
}

function renderCentros() {
    const tbody = document.getElementById('centrosTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    appState.centrosFinanceiros.forEach(centro => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${capitalize(centro.nome)}</td>
            <td>${centro.descricao || '—'}</td>
            <td>${centro.orcamento > 0 ? formatCurrency(centro.orcamento) : 'Automático'}</td>
            <td>${centro.alertaPercentual}%</td>
            <td>
                <button class="action-btn edit" onclick="editCentro('${centro.id}')" title="Editar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 20h9"/>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
                    </svg>
                </button>
                <button class="action-btn delete" onclick="deleteCentro('${centro.id}')" title="Excluir">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function editCentro(id) {
    const centro = appState.centrosFinanceiros.find(c => c.id === id);
    if (!centro) return;

    document.getElementById('modalCentroTitle').textContent = 'Editar Centro Financeiro';
    document.getElementById('centroId').value = centro.id;
    document.getElementById('centroNome').value = centro.nome;
    document.getElementById('centroDescricao').value = centro.descricao || '';
    document.getElementById('centroOrcamento').value = centro.orcamento || '';
    document.getElementById('centroAlertaPercentual').value = centro.alertaPercentual || 90;
    openModal('modalCentro');
}

function deleteCentro(id) {
    if (!confirm('Ao excluir o centro, todos os itens vinculados serão removidos. Continuar?')) return;
    const centro = appState.centrosFinanceiros.find(c => c.id === id);
    if (!centro) return;

    backupDeletedCenters([centro]);
    appState.centrosFinanceiros = appState.centrosFinanceiros.filter(c => c.id !== id);
    appState.receitas = appState.receitas.filter(r => r.centroId !== id);
    appState.despesas = appState.despesas.filter(d => d.centroId !== id);
    appState.investimentos = appState.investimentos.filter(i => i.centroId !== id);

    if (appState.selectedCentroId === id) {
        appState.selectedCentroId = 'all';
    }
    saveToLocalStorage();
    updateUndoButtonState();
    updateDashboard();
    renderAllData();
}

// Exportar Relatórios
document.getElementById('exportCsvBtn').addEventListener('click', () => {
    let csv = 'Tipo,Data,Descrição,Categoria/Tipo,Centro Financeiro,Valor\n';
    const receitas = filterBySelectedCentro(appState.receitas);
    const despesas = filterBySelectedCentro(appState.despesas);
    const investimentos = filterBySelectedCentro(appState.investimentos);
    
    receitas.forEach(r => {
        const centro = getSelectedCentroId() === 'all' ? (appState.centrosFinanceiros.find(c => c.id === r.centroId)?.nome || '') : (getSelectedCentro()?.nome || '');
        csv += `Receita,${r.data},${r.descricao},${r.tipo},${centro},${r.valor}\n`;
    });
    
    despesas.forEach(d => {
        const centro = getSelectedCentroId() === 'all' ? (appState.centrosFinanceiros.find(c => c.id === d.centroId)?.nome || '') : (getSelectedCentro()?.nome || '');
        csv += `Despesa,${d.data},${d.descricao},${d.categoria},${centro},${d.valor}\n`;
    });
    
    investimentos.forEach(i => {
        const centro = getSelectedCentroId() === 'all' ? (appState.centrosFinanceiros.find(c => c.id === i.centroId)?.nome || '') : (getSelectedCentro()?.nome || '');
        csv += `Investimento,${i.data},${i.descricao},${i.tipo},${centro},${i.valorInvestido}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-financeiro-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
});

document.getElementById('exportPdfBtn').addEventListener('click', async () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });
    
    const selectedCentro = getSelectedCentro();
    const receitas = filterBySelectedCentro(appState.receitas);
    const despesas = filterBySelectedCentro(appState.despesas);
    const investimentos = filterBySelectedCentro(appState.investimentos);
    const totalReceitas = receitas.reduce((sum, r) => sum + r.valor, 0);
    const totalDespesas = despesas.reduce((sum, d) => sum + d.valor, 0);
    const totalInvestimentos = investimentos.reduce((sum, i) => sum + i.valorInvestido, 0);
    const saldo = totalReceitas - totalDespesas;
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let currentY = margin;
    
    // Função para adicionar nova página se necessário
    const checkNewPage = (requiredHeight) => {
        if (currentY + requiredHeight > pageHeight - margin) {
            doc.addPage();
            currentY = margin;
        }
    };
    
    // Cabeçalho do Relatório
    doc.setFillColor(63, 102, 241); // Azul premium
    doc.rect(0, 0, pageWidth, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('Relatório Financeiro', margin, 15);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Centro: ${selectedCentro ? selectedCentro.nome : 'Todos os Centros'}`, margin, 22);
    
    // Retornar ao texto preto
    doc.setTextColor(40, 40, 40);
    currentY = 40;
    
    // Informações de Data
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Data do Relatório: ${new Date().toLocaleDateString('pt-BR')}`, margin, currentY);
    currentY += 8;
    
    // Resumo Financeiro em Grid
    doc.setFillColor(240, 248, 255); // Fundo azul claro
    doc.setDrawColor(100, 150, 255);
    
    const boxWidth = (pageWidth - 2 * margin) / 2 - 2;
    const boxHeight = 20;
    
    // Receitas
    doc.rect(margin, currentY, boxWidth, boxHeight, 'FD');
    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text('RECEITAS', margin + 3, currentY + 6);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(12);
    doc.setTextColor(16, 185, 129);
    doc.text(formatCurrency(totalReceitas), margin + 3, currentY + 14);
    
    // Despesas
    doc.setTextColor(40, 40, 40);
    doc.setFillColor(255, 240, 240);
    doc.setDrawColor(255, 100, 100);
    doc.rect(margin + boxWidth + 4, currentY, boxWidth, boxHeight, 'FD');
    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text('DESPESAS', margin + boxWidth + 7, currentY + 6);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(12);
    doc.setTextColor(239, 68, 68);
    doc.text(formatCurrency(totalDespesas), margin + boxWidth + 7, currentY + 14);
    
    currentY += 26;
    
    // Investimentos e Saldo
    doc.setTextColor(40, 40, 40);
    doc.setFillColor(240, 255, 240);
    doc.setDrawColor(100, 200, 100);
    doc.rect(margin, currentY, boxWidth, boxHeight, 'FD');
    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text('INVESTIMENTOS', margin + 3, currentY + 6);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(12);
    doc.setTextColor(59, 130, 246);
    doc.text(formatCurrency(totalInvestimentos), margin + 3, currentY + 14);
    
    // Saldo
    const saldoColor = saldo >= 0 ? [10, 185, 130] : [239, 68, 68];
    const saldoFillColor = saldo >= 0 ? [240, 255, 240] : [255, 240, 240];
    doc.setFillColor(saldoFillColor[0], saldoFillColor[1], saldoFillColor[2]);
    doc.setDrawColor(...saldoColor);
    doc.rect(margin + boxWidth + 4, currentY, boxWidth, boxHeight, 'FD');
    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text('SALDO', margin + boxWidth + 7, currentY + 6);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(12);
    doc.setTextColor(...saldoColor);
    doc.text(formatCurrency(saldo), margin + boxWidth + 7, currentY + 14);
    
    currentY += 30;
    
    // Tabela de Receitas
    checkNewPage(50);
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('RECEITAS DETALHADAS', margin, currentY);
    currentY += 8;
    
    const receitasTableData = receitas.map(r => [
        r.data,
        r.descricao,
        r.tipo,
        formatCurrency(r.valor)
    ]);
    
    if (receitasTableData.length > 0) {
        doc.autoTable({
            head: [['Data', 'Descrição', 'Tipo', 'Valor']],
            body: receitasTableData,
            startY: currentY,
            margin: margin,
            headStyles: {
                fillColor: [16, 185, 129],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'left'
            },
            bodyStyles: {
                textColor: [40, 40, 40]
            },
            alternateRowStyles: {
                fillColor: [245, 250, 245]
            },
            columnStyles: {
                3: { halign: 'right' }
            }
        });
        currentY = doc.lastAutoTable.finalY + 8;
    } else {
        doc.setFontSize(10);
        doc.text('Nenhuma receita registrada.', margin, currentY);
        currentY += 8;
    }
    
    // Tabela de Despesas
    checkNewPage(50);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('DESPESAS DETALHADAS', margin, currentY);
    currentY += 8;
    
    const despesasTableData = despesas.map(d => [
        d.data,
        d.descricao,
        d.categoria,
        formatCurrency(d.valor)
    ]);
    
    if (despesasTableData.length > 0) {
        doc.autoTable({
            head: [['Data', 'Descrição', 'Categoria', 'Valor']],
            body: despesasTableData,
            startY: currentY,
            margin: margin,
            headStyles: {
                fillColor: [239, 68, 68],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'left'
            },
            bodyStyles: {
                textColor: [40, 40, 40]
            },
            alternateRowStyles: {
                fillColor: [255, 245, 245]
            },
            columnStyles: {
                3: { halign: 'right' }
            }
        });
        currentY = doc.lastAutoTable.finalY + 8;
    } else {
        doc.setFontSize(10);
        doc.text('Nenhuma despesa registrada.', margin, currentY);
        currentY += 8;
    }
    
    // Tabela de Investimentos
    checkNewPage(50);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('INVESTIMENTOS DETALHADOS', margin, currentY);
    currentY += 8;
    
    const investimentosTableData = investimentos.map(i => [
        i.data,
        i.descricao,
        i.tipo,
        formatCurrency(i.valorInvestido),
        formatCurrency(i.rendimento)
    ]);
    
    if (investimentosTableData.length > 0) {
        doc.autoTable({
            head: [['Data', 'Descrição', 'Tipo', 'Valor Investido', 'Rendimento']],
            body: investimentosTableData,
            startY: currentY,
            margin: margin,
            headStyles: {
                fillColor: [59, 130, 246],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'left'
            },
            bodyStyles: {
                textColor: [40, 40, 40]
            },
            alternateRowStyles: {
                fillColor: [240, 245, 255]
            },
            columnStyles: {
                3: { halign: 'right' },
                4: { halign: 'right' }
            }
        });
        currentY = doc.lastAutoTable.finalY + 8;
    } else {
        doc.setFontSize(10);
        doc.text('Nenhum investimento registrado.', margin, currentY);
        currentY += 8;
    }
    
    // Rodapé em todas as páginas
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
        doc.text(`Relatório Financeiro Fluxa | Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, pageHeight - 8);
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 20, pageHeight - 8);
    }
    
    // Salvar PDF
    doc.save(`relatorio-financeiro-${new Date().toISOString().split('T')[0]}.pdf`);
});

function findLinkedInvestimentoDespesa(investimento) {
    if (investimento.despesaId) {
        const linked = appState.despesas.find(d => d.id === investimento.despesaId);
        if (linked) return linked;
    }

    return appState.despesas.find(d =>
        d.data === investimento.data &&
        d.valor === investimento.valorInvestido &&
        typeof d.descricao === 'string' &&
        d.descricao.startsWith('Investimento:') &&
        d.descricao.includes(investimento.descricao)
    );
}

function editItem(type, id) {
    const item = appState[type].find(i => i.id === id);
    if (!item) return;

    if (type === 'receitas') {
        const data = prompt('Data (YYYY-MM-DD):', item.data);
        if (data === null) return;
        const descricao = prompt('Descrição:', item.descricao);
        if (descricao === null) return;
        const tipo = prompt(`Tipo (${appState.categoriasReceitas.join(', ')}):`, item.tipo);
        if (tipo === null) return;
        const valorStr = prompt('Valor (R$):', item.valor);
        if (valorStr === null) return;

        const valor = parseFloat(String(valorStr).replace(',', '.'));
        if (isNaN(valor) || valor < 0) {
            alert('Valor inválido.');
            return;
        }

        const tipoNormalizado = normalizeCategoryName(tipo);
        if (!appState.categoriasReceitas.includes(tipoNormalizado)) {
            appState.categoriasReceitas.push(tipoNormalizado);
        }

        item.data = data;
        item.descricao = descricao.trim();
        item.tipo = tipoNormalizado;
        item.valor = valor;
        item.centroId = item.centroId || (appState.centrosFinanceiros[0]?.id || 'centro-geral');
    } else if (type === 'despesas') {
        const data = prompt('Data (YYYY-MM-DD):', item.data);
        if (data === null) return;
        const descricao = prompt('Descrição:', item.descricao);
        if (descricao === null) return;
        const categoria = prompt(`Categoria (${appState.categoriasDespesas.join(', ')}):`, item.categoria);
        if (categoria === null) return;
        const tipo = prompt('Recorrência (recorrente/eventual):', item.tipo);
        if (tipo === null) return;
        const natureza = prompt('Tipo de Despesa (fixa/variavel):', item.natureza || 'variavel');
        if (natureza === null) return;
        const valorStr = prompt('Valor (R$):', item.valor);
        if (valorStr === null) return;

        const valor = parseFloat(String(valorStr).replace(',', '.'));
        if (isNaN(valor) || valor < 0) {
            alert('Valor inválido.');
            return;
        }

        const categoriaNormalizada = normalizeCategoryName(categoria);
        if (!appState.categoriasDespesas.includes(categoriaNormalizada)) {
            appState.categoriasDespesas.push(categoriaNormalizada);
        }

        const tipoNormalizado = normalizeCategoryName(tipo);
        if (!['recorrente', 'eventual'].includes(tipoNormalizado)) {
            alert('Recorrência inválida. Use recorrente ou eventual.');
            return;
        }

        const naturezaNormalizada = normalizeCategoryName(natureza);
        if (!['fixa', 'variavel'].includes(naturezaNormalizada)) {
            alert('Tipo de despesa inválido. Use fixa ou variavel.');
            return;
        }

        item.data = data;
        item.descricao = descricao.trim();
        item.categoria = categoriaNormalizada;
        item.tipo = tipoNormalizado;
        item.natureza = naturezaNormalizada;
        item.valor = valor;
        item.centroId = item.centroId || (appState.centrosFinanceiros[0]?.id || 'centro-geral');
    } else if (type === 'investimentos') {
        const data = prompt('Data (YYYY-MM-DD):', item.data);
        if (data === null) return;
        const descricao = prompt('Descrição:', item.descricao);
        if (descricao === null) return;
        const tipo = prompt(`Tipo (${appState.tiposInvestimentos.join(', ')}):`, item.tipo);
        if (tipo === null) return;
        const valorStr = prompt('Valor Investido (R$):', item.valorInvestido);
        if (valorStr === null) return;
        const rendimentoStr = prompt('Rendimento (R$):', item.rendimento);
        if (rendimentoStr === null) return;

        const valorInvestido = parseFloat(String(valorStr).replace(',', '.'));
        const rendimento = parseFloat(String(rendimentoStr).replace(',', '.')) || 0;
        if (isNaN(valorInvestido) || valorInvestido < 0) {
            alert('Valor investido inválido.');
            return;
        }

        const tipoNormalizado = normalizeCategoryName(tipo);
        if (!appState.tiposInvestimentos.includes(tipoNormalizado)) {
            appState.tiposInvestimentos.push(tipoNormalizado);
        }

        item.data = data;
        item.descricao = descricao.trim();
        item.tipo = tipoNormalizado;
        item.valorInvestido = valorInvestido;
        item.rendimento = rendimento;
        item.centroId = item.centroId || (appState.centrosFinanceiros[0]?.id || 'centro-geral');

        let linkedDespesa = findLinkedInvestimentoDespesa(item);
        if (!linkedDespesa) {
            const despesaId = Date.now() + 2;
            linkedDespesa = {
                id: despesaId,
                data: item.data,
                descricao: `Investimento: ${item.descricao}`,
                centroId: item.centroId,
                categoria: 'investimentos',
                tipo: 'eventual',
                natureza: 'variavel',
                valor: item.valorInvestido
            };
            appState.despesas.push(linkedDespesa);
            item.despesaId = despesaId;
        } else {
            linkedDespesa.data = item.data;
            linkedDespesa.descricao = `Investimento: ${item.descricao}`;
            linkedDespesa.centroId = item.centroId;
            linkedDespesa.categoria = 'investimentos';
            linkedDespesa.tipo = 'eventual';
            linkedDespesa.natureza = 'variavel';
            linkedDespesa.valor = item.valorInvestido;
        }
    }

    saveToLocalStorage();
    populateSelectCategories();
    updateDashboard();
    renderAllData();
    checkBudgetAlert();
}

// Deletar Item
function deleteItem(type, id) {
    if (confirm('Tem certeza que deseja excluir este item?')) {
        let deletePromises = [deleteFinancialData(id)];

        if (type === 'investimentos') {
            const investimento = appState.investimentos.find(i => i.id === id);
            const linkedDespesa = investimento ? findLinkedInvestimentoDespesa(investimento) : null;
            if (linkedDespesa) {
                deletePromises.push(deleteFinancialData(linkedDespesa.id));
                appState.despesas = appState.despesas.filter(d => d.id !== linkedDespesa.id);
            }
        }

        Promise.all(deletePromises).then(() => {
            appState[type] = appState[type].filter(item => item.id !== id);
            updateDashboard();
            renderAllData();
        }).catch(error => {
            console.error('Erro ao deletar item:', error);
            alert('Erro ao deletar item');
        });
    }
}

// Renderizar Todos os Dados
function renderAllData() {
    renderReceitas();
    renderDespesas();
    renderInvestimentos();
    renderRelatorios();
    renderCentros();
}

// Utilitários
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatDate(dateString) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

function capitalize(str) {
    if (str === null || str === undefined) return '';
    const safe = String(str);
    if (!safe) return '';
    return safe.charAt(0).toUpperCase() + safe.slice(1);
}

function updateCurrentDate() {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = new Date().toLocaleDateString('pt-BR', options);
    document.getElementById('currentDate').textContent = dateStr;
}

// Definir data atual como padrão nos formulários
syncDateInputsWithSelectedMonth(true);

// ==================== CONFIGURAÇÕES ABA ====================

// Inicialize a aba de configurações
function initializeConfigurationsTab() {
    // Carregar informações do cadastro
    loadConfigurationInfo();
    
    // Inicializar acordeão do manual
    initializeAccordion();
    
    // Inicializar formulário de suporte
    initializeSupportForm();
    
    // Inicializar controles de configurações
    initializeConfigurationControls();
    
    // Inicializar gestão de usuários para Administrador central
    initializeUserManagement();
}

// Carregar informações do cadastro
function loadConfigurationInfo() {
    const userNameDisplay = document.getElementById('configUserName');
    const emailDisplay = document.getElementById('configEmail');
    const createdDate = document.getElementById('configCreatedDate');
    const lastUpdate = document.getElementById('configLastUpdate');
    const metaReceitasDisplay = document.getElementById('configMetaReceitas');
    const metaDespesasDisplay = document.getElementById('configMetaDespesas');
    const metaInvestimentosDisplay = document.getElementById('configMetaInvestimentos');
    
    if (userNameDisplay) {
        userNameDisplay.textContent = appState.userName || 'Usuário Não Definido';
    }
    
    if (emailDisplay) {
        const userEmail = appState.userEmail || localStorage.getItem('userEmail') || 'Não definido';
        emailDisplay.textContent = userEmail;
    }
    
    if (createdDate) {
        const createdAt = appState.userCreatedAt || localStorage.getItem('accountCreatedDate') || new Date().toLocaleDateString('pt-BR');
        if (!appState.userCreatedAt && !localStorage.getItem('accountCreatedDate')) {
            localStorage.setItem('accountCreatedDate', new Date().toLocaleDateString('pt-BR'));
        }
        createdDate.textContent = appState.userCreatedAt || localStorage.getItem('accountCreatedDate');
    }
    
    if (lastUpdate) {
        lastUpdate.textContent = new Date().toLocaleDateString('pt-BR');
    }
    
    if (metaReceitasDisplay) {
        metaReceitasDisplay.textContent = formatCurrency(appState.metaReceitas || 0);
    }
    
    if (metaDespesasDisplay) {
        metaDespesasDisplay.textContent = formatCurrency(appState.metaDespesas || 0);
    }
    
    if (metaInvestimentosDisplay) {
        metaInvestimentosDisplay.textContent = formatCurrency(appState.metaInvestimentos || 0);
    }
    
    // Botões de edição
    setupEditButtons();
}

// Configurar botões de edição
function setupEditButtons() {
    // Editar Nome de Usuário
    const editUserNameBtn = document.getElementById('editUserNameBtn');
    const saveEditUserName = document.getElementById('saveEditUserName');
    const cancelEditUserName = document.getElementById('cancelEditUserName');
    const configUserNameInput = document.getElementById('configUserNameInput');
    const editUserNameGroup = document.getElementById('editUserNameGroup');
    const configUserName = document.getElementById('configUserName');
    
    if (editUserNameBtn) {
        editUserNameBtn.addEventListener('click', () => {
            configUserName.parentElement.style.display = 'none';
            configUserNameInput.style.display = 'block';
            configUserNameInput.value = appState.userName || '';
            editUserNameGroup.style.display = 'flex';
            configUserNameInput.focus();
        });
    }
    
    if (saveEditUserName) {
        saveEditUserName.addEventListener('click', () => {
            if (configUserNameInput.value.trim()) {
                appState.userName = configUserNameInput.value.trim();
                saveToLocalStorage();
                configUserName.textContent = appState.userName;
                configUserName.parentElement.style.display = 'flex';
                configUserNameInput.style.display = 'none';
                editUserNameGroup.style.display = 'none';
                loadConfigurationInfo();
                updateUserNameDisplay();
                updateWelcomeText();
            } else {
                alert('Por favor, digite um nome válido');
            }
        });
    }
    
    if (cancelEditUserName) {
        cancelEditUserName.addEventListener('click', () => {
            configUserName.parentElement.style.display = 'flex';
            configUserNameInput.style.display = 'none';
            editUserNameGroup.style.display = 'none';
        });
    }
    
    // Editar Email
    const editEmailBtn = document.getElementById('editEmailBtn');
    const saveEditEmail = document.getElementById('saveEditEmail');
    const cancelEditEmail = document.getElementById('cancelEditEmail');
    const configEmailInput = document.getElementById('configEmailInput');
    const editEmailGroup = document.getElementById('editEmailGroup');
    const configEmail = document.getElementById('configEmail');
    
const isAdmin = appState.userRole === 'admin';

    if (editEmailBtn) {
        if (!isAdmin) {
            editEmailBtn.style.display = 'none';
        } else {
            editEmailBtn.addEventListener('click', () => {
                configEmail.parentElement.style.display = 'none';
                configEmailInput.style.display = 'block';
                configEmailInput.value = localStorage.getItem('userEmail') || '';
                editEmailGroup.style.display = 'flex';
                configEmailInput.focus();
            });
        }
    }

    if (saveEditEmail) {
        if (!isAdmin) {
            saveEditEmail.style.display = 'none';
        } else {
            saveEditEmail.addEventListener('click', () => {
                const email = configEmailInput.value.trim();
                if (email && isValidEmail(email)) {
                    localStorage.setItem('userEmail', email);
                    configEmail.textContent = email;
                    configEmail.parentElement.style.display = 'flex';
                    configEmailInput.style.display = 'none';
                    editEmailGroup.style.display = 'none';
                    loadConfigurationInfo();
                } else {
                    alert('Por favor, digite um email válido');
                }
            });
        }
    }
    
    if (cancelEditEmail) {
        cancelEditEmail.addEventListener('click', () => {
            configEmail.parentElement.style.display = 'flex';
            configEmailInput.style.display = 'none';
            editEmailGroup.style.display = 'none';
        });
    }
    
    // Editar Meta Receitas
    const editMetaReceitasBtn = document.getElementById('editMetaReceitasBtn');
    const saveEditMetaReceitas = document.getElementById('saveEditMetaReceitas');
    const cancelEditMetaReceitas = document.getElementById('cancelEditMetaReceitas');
    const configMetaReceitasInput = document.getElementById('configMetaReceitasInput');
    const editMetaReceitasGroup = document.getElementById('editMetaReceitasGroup');
    const configMetaReceitas = document.getElementById('configMetaReceitas');
    
    if (editMetaReceitasBtn) {
        editMetaReceitasBtn.addEventListener('click', () => {
            configMetaReceitas.parentElement.style.display = 'none';
            configMetaReceitasInput.style.display = 'block';
            configMetaReceitasInput.value = appState.metaReceitas || 0;
            editMetaReceitasGroup.style.display = 'flex';
            configMetaReceitasInput.focus();
        });
    }
    
    if (saveEditMetaReceitas) {
        saveEditMetaReceitas.addEventListener('click', () => {
            const value = parseFloat(configMetaReceitasInput.value) || 0;
            appState.metaReceitas = value;
            saveToLocalStorage();
            configMetaReceitas.textContent = formatCurrency(value);
            configMetaReceitas.parentElement.style.display = 'flex';
            configMetaReceitasInput.style.display = 'none';
            editMetaReceitasGroup.style.display = 'none';
            loadConfigurationInfo();
        });
    }
    
    if (cancelEditMetaReceitas) {
        cancelEditMetaReceitas.addEventListener('click', () => {
            configMetaReceitas.parentElement.style.display = 'flex';
            configMetaReceitasInput.style.display = 'none';
            editMetaReceitasGroup.style.display = 'none';
        });
    }
    
    // Editar Meta Despesas
    const editMetaDespesasBtn = document.getElementById('editMetaDespesasBtn');
    const saveEditMetaDespesas = document.getElementById('saveEditMetaDespesas');
    const cancelEditMetaDespesas = document.getElementById('cancelEditMetaDespesas');
    const configMetaDespesasInput = document.getElementById('configMetaDespesasInput');
    const editMetaDespesasGroup = document.getElementById('editMetaDespesasGroup');
    const configMetaDespesas = document.getElementById('configMetaDespesas');
    
    if (editMetaDespesasBtn) {
        editMetaDespesasBtn.addEventListener('click', () => {
            configMetaDespesas.parentElement.style.display = 'none';
            configMetaDespesasInput.style.display = 'block';
            configMetaDespesasInput.value = appState.metaDespesas || 0;
            editMetaDespesasGroup.style.display = 'flex';
            configMetaDespesasInput.focus();
        });
    }
    
    if (saveEditMetaDespesas) {
        saveEditMetaDespesas.addEventListener('click', () => {
            const value = parseFloat(configMetaDespesasInput.value) || 0;
            appState.metaDespesas = value;
            saveToLocalStorage();
            configMetaDespesas.textContent = formatCurrency(value);
            configMetaDespesas.parentElement.style.display = 'flex';
            configMetaDespesasInput.style.display = 'none';
            editMetaDespesasGroup.style.display = 'none';
            loadConfigurationInfo();
        });
    }
    
    if (cancelEditMetaDespesas) {
        cancelEditMetaDespesas.addEventListener('click', () => {
            configMetaDespesas.parentElement.style.display = 'flex';
            configMetaDespesasInput.style.display = 'none';
            editMetaDespesasGroup.style.display = 'none';
        });
    }
    
    // Editar Meta Investimentos
    const editMetaInvestimentosBtn = document.getElementById('editMetaInvestimentosBtn');
    const saveEditMetaInvestimentos = document.getElementById('saveEditMetaInvestimentos');
    const cancelEditMetaInvestimentos = document.getElementById('cancelEditMetaInvestimentos');
    const configMetaInvestimentosInput = document.getElementById('configMetaInvestimentosInput');
    const editMetaInvestimentosGroup = document.getElementById('editMetaInvestimentosGroup');
    const configMetaInvestimentos = document.getElementById('configMetaInvestimentos');
    
    if (editMetaInvestimentosBtn) {
        editMetaInvestimentosBtn.addEventListener('click', () => {
            configMetaInvestimentos.parentElement.style.display = 'none';
            configMetaInvestimentosInput.style.display = 'block';
            configMetaInvestimentosInput.value = appState.metaInvestimentos || 0;
            editMetaInvestimentosGroup.style.display = 'flex';
            configMetaInvestimentosInput.focus();
        });
    }
    
    if (saveEditMetaInvestimentos) {
        saveEditMetaInvestimentos.addEventListener('click', () => {
            const value = parseFloat(configMetaInvestimentosInput.value) || 0;
            appState.metaInvestimentos = value;
            saveToLocalStorage();
            configMetaInvestimentos.textContent = formatCurrency(value);
            configMetaInvestimentos.parentElement.style.display = 'flex';
            configMetaInvestimentosInput.style.display = 'none';
            editMetaInvestimentosGroup.style.display = 'none';
            loadConfigurationInfo();
        });
    }
    
    if (cancelEditMetaInvestimentos) {
        cancelEditMetaInvestimentos.addEventListener('click', () => {
            configMetaInvestimentos.parentElement.style.display = 'flex';
            configMetaInvestimentosInput.style.display = 'none';
            editMetaInvestimentosGroup.style.display = 'none';
        });
    }
}

function initializeUserManagement() {
    const currentUser = getCurrentUser();
    const adminSection = document.getElementById('adminUserManagementSection');
    const lockedSection = document.getElementById('userManagementLockedSection');
    const configTab = document.getElementById('configuracoes');
    const navConfigLabel = document.querySelector('.nav-item[data-tab="configuracoes"] span');
    const navConfigButton = document.querySelector('.nav-item[data-tab="configuracoes"]');
    const adminNavItem = document.querySelector('.nav-item.admin-only');
    const logoutBtn = document.getElementById('logoutBtn');

    if (!adminSection || !lockedSection || !configTab) return;

    const allConfigSections = Array.from(configTab.querySelectorAll('.config-section'));

    if (currentUser && currentUser.role === 'admin') {
        if (navConfigLabel) navConfigLabel.textContent = 'Administrador';
        if (navConfigButton) navConfigButton.setAttribute('aria-label', 'Administrador - controle de usuários');
        if (adminNavItem) adminNavItem.style.display = 'flex';

        allConfigSections.forEach(section => {
            section.style.display = 'none';
        });

        adminSection.style.display = 'block';
        lockedSection.style.display = 'none';
        populateUserList();
        setupUserCreateForm();
    } else {
        if (navConfigLabel) navConfigLabel.textContent = 'Configurações';
        if (navConfigButton) navConfigButton.setAttribute('aria-label', 'Configurações');
        if (adminNavItem) adminNavItem.style.display = 'none';

        allConfigSections.forEach(section => {
            section.style.display = 'block';
        });

        adminSection.style.display = 'none';
        lockedSection.style.display = 'block';
    }

    const logoutBtnLocked = document.getElementById('logoutBtnLocked');
    const logoutButtons = [logoutBtn, logoutBtnLocked].filter(Boolean);

    logoutButtons.forEach(button => {
        if (button.dataset.initialized === 'true') return;
        button.dataset.initialized = 'true';
        button.addEventListener('click', () => {
            clearAuthState();
            window.location.href = '/login';
        });
    });
}

function populateUserList() {
    const container = document.getElementById('userListContainer');
    if (!container) return;

    apiRequest('/api/users').then(response => response.json()).then(users => {
        const currentUser = getCurrentUser();

        container.innerHTML = users.map(user => {
            const isCurrent = currentUser && currentUser.id === user.id;
            const statusClass = user.is_active ? 'status-active' : 'status-inactive';
            const statusText = user.is_active ? 'Ativo' : 'Inativo';
            const lifetimeText = user.is_lifetime ? 'Vitalício' : 'Padrão';

            return `
                <div class="user-item ${isCurrent ? 'user-current' : ''}">
                    <div class="user-info">
                        <strong>${user.name}</strong>
                        <span>${user.email}</span>
                        <div class="user-status">
                            <span class="status-badge ${statusClass}">${statusText}</span>
                            <span class="lifetime-badge">${lifetimeText}</span>
                        </div>
                    </div>
                    <div class="user-controls">
                        <small>${user.role === 'admin' ? 'Administrador' : 'Usuário'}</small>
                        <small>${new Date(user.created_at).toLocaleDateString('pt-BR')}</small>
                        <div class="user-actions">
                            <button class="btn-small ${user.is_active ? 'btn-danger' : 'btn-success'}"
                                    onclick="toggleUserStatus(${user.id}, ${user.is_active})"
                                    ${isCurrent ? 'disabled' : ''}>
                                ${user.is_active ? 'Desativar' : 'Ativar'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }).catch(error => {
        console.error('Erro ao carregar usuários:', error);
        container.innerHTML = '<p>Erro ao carregar lista de usuários.</p>';
    });
}

function setupUserCreateForm() {
    const form = document.getElementById('userCreateForm');
    if (!form || form.dataset.initialized === 'true') return;

    const nameInput = document.getElementById('newUserName');
    const emailInput = document.getElementById('newUserEmail');
    const passwordInput = document.getElementById('newUserPassword');
    const messageElement = document.getElementById('userCreateMessage');

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        messageElement.textContent = '';

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!name || !email || !password) {
            messageElement.textContent = 'Preencha todos os campos para registrar o novo usuário.';
            return;
        }

        if (!isValidEmail(email)) {
            messageElement.textContent = 'Informe um e-mail válido para o novo usuário.';
            return;
        }

        if (password.length < 8) {
            messageElement.textContent = 'A senha deve ter pelo menos 8 caracteres.';
            return;
        }

        apiRequest('/api/users', {
            method: 'POST',
            body: JSON.stringify({ name, email, password })
        }).then(response => {
            if (response.ok) {
                return response.json();
            } else {
                return response.json().then(data => { throw new Error(data.error || 'Erro ao criar usuário'); });
            }
        }).then(() => {
            populateUserList();
            form.reset();
            messageElement.textContent = 'Usuário criado com sucesso!';
            messageElement.style.color = 'var(--success-color)';
        }).catch(error => {
            console.error('Erro ao criar usuário:', error);
            messageElement.textContent = error.message;
            messageElement.style.color = 'var(--error-color)';
        });
    });

    form.dataset.initialized = 'true';
}

// Validar Email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validar CPF
function isValidCPF(cpf) {
    cpf = cpf.replace(/[^\d]/g, '');
    
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    let sum = 0;
    let remainder;
    
    for (let i = 1; i <= 9; i++) {
        sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return false;
    
    sum = 0;
    for (let i = 1; i <= 10; i++) {
        sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11))) return false;
    
    return true;
}

// Inicializar Acordeão
function initializeAccordion() {
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    accordionHeaders.forEach(header => {
        header.setAttribute('type', 'button');
        header.addEventListener('click', (event) => {
            event.preventDefault();
            const accordionItem = header.parentElement;
            const isActive = accordionItem.classList.contains('active');
            
            // Fechar todos os outros itens
            document.querySelectorAll('.accordion-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Abrir o atual se não estava aberto
            if (!isActive) {
                accordionItem.classList.add('active');
            }
        });
    });

    // Abrir o primeiro item por padrão, se nenhum estiver aberto
    const firstItem = document.querySelector('.accordion-item');
    if (firstItem && !document.querySelector('.accordion-item.active')) {
        firstItem.classList.add('active');
    }
}

// Inicializar Formulário de Suporte
function initializeSupportForm() {
    const supportForm = document.getElementById('supportForm');
    
    if (supportForm) {
        supportForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('supportName').value;
            const email = document.getElementById('supportEmail').value;
            const subject = document.getElementById('supportSubject').value;
            const message = document.getElementById('supportMessage').value;
            
            // Simular envio (em produção, seria enviado para um servidor)
            const supportMessageDiv = document.getElementById('supportFeedback');
            
            if (name && email && subject && message) {
                supportMessageDiv.textContent = '✓ Mensagem enviada com sucesso! Você receberá uma resposta em breve.';
                supportMessageDiv.classList.remove('error');
                supportMessageDiv.style.display = 'block';
                supportForm.reset();
                
                // Salvar no localStorage como histórico
                const tickets = JSON.parse(localStorage.getItem('supportTickets') || '[]');
                tickets.push({
                    id: Date.now(),
                    name,
                    email,
                    subject,
                    message,
                    date: new Date().toLocaleDateString('pt-BR'),
                    status: 'pendente'
                });
                localStorage.setItem('supportTickets', JSON.stringify(tickets));
                
                setTimeout(() => {
                    supportMessageDiv.style.display = 'none';
                }, 5000);
            } else {
                supportMessageDiv.textContent = '✗ Por favor, preencha todos os campos';
                supportMessageDiv.classList.add('error');
                supportMessageDiv.style.display = 'block';
            }
        });
    }
}

// Inicializar Controles de Configurações
function initializeConfigurationControls() {
    // Backup de todos os dados
    const backupBtn = document.getElementById('backupAllDataBtn');
    if (backupBtn) {
        backupBtn.addEventListener('click', backupAllData);
    }
    
    // Restaurar Backup
    const restoreBtn = document.getElementById('restoreBackupBtn');
    const restoreFile = document.getElementById('restoreBackupFile');
    
    if (restoreBtn) {
        restoreBtn.addEventListener('click', () => {
            restoreFile.click();
        });
    }
    
    if (restoreFile) {
        restoreFile.addEventListener('change', (e) => {
            restoreFromBackup(e);
        });
    }
    
    // Alterar Senha
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', changePassword);
    }
    
    // Deletar Conta
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', deleteAccount);
    }
    
    // Limpar Cache
    const clearCacheBtn = document.getElementById('clearCacheBtn');
    if (clearCacheBtn) {
        clearCacheBtn.addEventListener('click', clearCache);
    }
    
    // Tema Selector
    const themeSelector = document.getElementById('themeSelector');
    if (themeSelector) {
        themeSelector.value = localStorage.getItem('themePreference') || 'auto';
        themeSelector.addEventListener('change', (e) => {
            localStorage.setItem('themePreference', e.target.value);
            applyThemePreference(e.target.value);
        });
    }
}

// Backup de Todos os Dados
function backupAllData() {
    const backup = {
        appState: appState,
        userEmail: localStorage.getItem('userEmail'),
        accountCreatedDate: localStorage.getItem('accountCreatedDate'),
        backupDate: new Date().toLocaleDateString('pt-BR'),
        backupTime: new Date().toLocaleTimeString('pt-BR')
    };
    
    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fluxa-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('✓ Backup realizado com sucesso!');
}

// Restaurar Backup
function restoreFromBackup(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const backup = JSON.parse(event.target.result);
            
            if (!backup.appState) {
                throw new Error('Arquivo de backup inválido');
            }
            
            if (confirm('⚠️ Isso irá SOBRESCREVER todos os seus dados atuais. Deseja continuar?')) {
                appState = backup.appState;
                if (backup.userEmail) localStorage.setItem('userEmail', backup.userEmail);
                if (backup.accountCreatedDate) localStorage.setItem('accountCreatedDate', backup.accountCreatedDate);
                
                saveToLocalStorage();
                alert('✓ Backup restaurado com sucesso! A página será recarregada...');
                location.reload();
            }
        } catch (error) {
            alert('✗ Erro ao restaurar backup: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// Alterar Senha
function changePassword() {
    const currentPassword = prompt('Digite sua senha atual:');
    if (currentPassword === null) return;
    
    const storedPassword = localStorage.getItem('appPassword') || '';
    
    if (storedPassword && currentPassword !== storedPassword) {
        alert('✗ Senha atual incorreta');
        return;
    }
    
    const newPassword = prompt('Digite sua nova senha:');
    if (newPassword === null) return;
    
    if (newPassword.length < 4) {
        alert('✗ A senha deve ter pelo menos 4 caracteres');
        return;
    }
    
    const confirmPassword = prompt('Confirme sua nova senha:');
    if (confirmPassword === null) return;
    
    if (newPassword !== confirmPassword) {
        alert('✗ As senhas não coincidem');
        return;
    }
    
    localStorage.setItem('appPassword', newPassword);
    alert('✓ Senha alterada com sucesso!');
}

function verifyPasswordForAction(actionName) {
    const storedPassword = localStorage.getItem('appPassword') || '';
    if (!storedPassword) {
        const setPassword = confirm('Nenhuma senha foi configurada. Deseja definir uma agora para proteger esta ação?');
        if (!setPassword) return false;
        changePassword();
        return false;
    }

    const password = prompt(`Digite sua senha para ${actionName}:`);
    if (password === null) return false;

    if (password !== storedPassword) {
        alert('✗ Senha incorreta. A ação foi cancelada.');
        return false;
    }

    return true;
}

// Deletar Conta
function deleteAccount() {
    const confirmDeletion = confirm('⚠️ ATENÇÃO: Isso irá DELETAR sua conta e TODOS os dados permanentemente. Essa ação NÃO pode ser desfeita. Deseja continuar?');
    
    if (!confirmDeletion) return;
    
    const finalConfirm = prompt('Para confirmar, digite "DELETAR TUDO" (sem aspas):');
    
    if (finalConfirm === 'DELETAR TUDO') {
        localStorage.clear();
        alert('✓ Conta e dados deletados. Redirecionando...');
        setTimeout(() => {
            location.reload();
        }, 1000);
    } else {
        alert('Deleção cancelada. Confirmação inválida.');
    }
}

// Limpar Cache
function clearCache() {
    const confirmClear = confirm('⚠️ Isto irá limpar os dados temporários. Seus dados principais serão mantidos. Deseja continuar?');
    
    if (!confirmClear) return;
    
    // Limpar apenas cache temporário, não dados principais
    localStorage.removeItem('tempData');
    alert('✓ Cache limpo com sucesso!');
}

// Aplicar Preferência de Tema
function applyThemePreference(preference) {
    if (preference === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        appState.theme = prefersDark ? 'dark' : 'light';
    } else {
        appState.theme = preference;
    }
    
    saveToLocalStorage();
    initializeTheme();
}

// Chamar inicialização quando a aba for ativada
document.addEventListener('DOMContentLoaded', () => {
    initializeAccordion();

    const configTab = document.getElementById('configuracoes');
    if (configTab) {
        // Usar um observador ou disparo de evento quando a aba for acionada
        const observer = new MutationObserver(() => {
            if (configTab.classList.contains('active')) {
                initializeConfigurationsTab();
            }
        });
        
        observer.observe(configTab, { attributes: true, attributeFilter: ['class'] });
        
        // Também inicializar se já estiver ativa
        if (configTab.classList.contains('active')) {
            initializeConfigurationsTab();
        }
    }
});

// Interceptar cliques no nav-item de configurações
document.addEventListener('click', (e) => {
    if (e.target.closest('[data-tab="configuracoes"]')) {
        setTimeout(() => {
            initializeConfigurationsTab();
        }, 100);
    }
});
