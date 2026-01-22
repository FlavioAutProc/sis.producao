// app.js - Sistema de Controle de Produção

// Variáveis globais
let currentPage = "dashboard";
let productionRecords = [];
let wasteRecords = [];
let reassignmentRecords = [];
let currentReassignmentStep = 1;
let currentReassignmentType = null;
let currentOriginProduct = null;
let editingProductId = null;
let editingEmployeeId = null;

// ===== MOBILE NAVIGATION =====

// Função para inicializar navegação mobile
function initMobileNavigation() {
  const mobileNavItems = document.querySelectorAll(".mobile-nav-item");
  const sidebarToggle = document.getElementById("sidebarToggle");

  // Configurar toggle do menu lateral (para tablet)
  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", toggleSidebar);
  }

  // Configurar itens do menu mobile
  mobileNavItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const page = item.dataset.page;

      // Se for "Mais", mostrar dropdown
      if (page === "configuration") {
        showMobileMoreMenu();
        return;
      }

      // Ativar página normal
      showPage(page);
      activateMobileNavItem(item);
    });
  });

  // Swipe gestures para navegação
  initSwipeGestures();

  // Pull to refresh no dashboard
  initPullToRefresh();
}

// Ativar item do menu mobile
function activateMobileNavItem(selectedItem) {
  // Remover active de todos
  document.querySelectorAll(".mobile-nav-item").forEach((item) => {
    item.classList.remove("active");
  });

  // Adicionar ao selecionado
  selectedItem.classList.add("active");

  // Esconder menu "Mais" se aberto
  hideMobileMoreMenu();
}

// Mostrar menu "Mais" no mobile
function showMobileMoreMenu() {
  // Criar overlay do menu
  const menuOverlay = document.createElement("div");
  menuOverlay.className = "mobile-more-overlay";
  menuOverlay.innerHTML = `
        <div class="mobile-more-menu">
            <div class="more-menu-header">
                <h3>Mais Opções</h3>
                <button class="more-menu-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="more-menu-items">
                <a href="#" class="more-menu-item" data-page="records">
                    <i class="fas fa-clipboard-list"></i>
                    <span>Registros</span>
                </a>
                <a href="#" class="more-menu-item" data-page="reports">
                    <i class="fas fa-chart-bar"></i>
                    <span>Relatórios</span>
                </a>
                <a href="#" class="more-menu-item" data-page="configuration">
                    <i class="fas fa-cogs"></i>
                    <span>Configurações</span>
                </a>
                <hr class="menu-divider">
                <a href="#" class="more-menu-item" data-action="backup">
                    <i class="fas fa-download"></i>
                    <span>Backup</span>
                </a>
                <a href="#" class="more-menu-item text-danger" data-action="clear-data">
                    <i class="fas fa-trash-alt"></i>
                    <span>Limpar Dados</span>
                </a>
            </div>
        </div>
    `;

  document.body.appendChild(menuOverlay);

  // Animação de entrada
  setTimeout(() => {
    menuOverlay.classList.add("active");
  }, 10);

  // Configurar eventos
  const closeBtn = menuOverlay.querySelector(".more-menu-close");
  closeBtn.addEventListener("click", hideMobileMoreMenu);

  const menuItems = menuOverlay.querySelectorAll(".more-menu-item");
  menuItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();

      const page = item.dataset.page;
      const action = item.dataset.action;

      if (page) {
        showPage(page);
        activateMobileNavItem(
          document.querySelector('.mobile-nav-item[data-page="configuration"]'),
        );
        hideMobileMoreMenu();
      } else if (action === "backup") {
        backupData();
        hideMobileMoreMenu();
      } else if (action === "clear-data") {
        clearData();
        hideMobileMoreMenu();
      }
    });
  });

  // Fechar ao clicar fora
  menuOverlay.addEventListener("click", (e) => {
    if (e.target === menuOverlay) {
      hideMobileMoreMenu();
    }
  });
}

// Esconder menu "Mais"
function initSwipeGestures() {
  let startX = 0;
  let startY = 0;
  let endX = 0;
  let endY = 0;

  // AUMENTADO: Threshold maior para swipe intencional
  const threshold = 130; // Era 50
  const verticalThreshold = 30; // Máximo de movimento vertical permitido

  const content = document.getElementById("content");

  content.addEventListener("touchstart", (e) => {
    // VERIFICAÇÃO: Não processar se estiver em campo de entrada
    if (
      e.target.tagName === "INPUT" ||
      e.target.tagName === "TEXTAREA" ||
      e.target.tagName === "SELECT"
    ) {
      return;
    }

    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  });

  content.addEventListener("touchend", (e) => {
    // VERIFICAÇÃO: Não processar se estiver em campo de entrada
    if (
      e.target.tagName === "INPUT" ||
      e.target.tagName === "TEXTAREA" ||
      e.target.tagName === "SELECT"
    ) {
      return;
    }

    endX = e.changedTouches[0].clientX;
    endY = e.changedTouches[0].clientY;
    handleSwipe();
  });

  function handleSwipe() {
    const diffX = startX - endX;
    const diffY = startY - endY;

    // VERIFICAÇÃO: Se movimento vertical for maior que horizontal, é scroll, não swipe
    if (Math.abs(diffY) > Math.abs(diffX)) {
      return; // É scroll vertical, ignorar
    }

    // VERIFICAÇÃO: Se movimento vertical for significativo, provavelmente é scroll diagonal
    if (Math.abs(diffY) > verticalThreshold) {
      return; // Muito movimento vertical, provavelmente scroll
    }

    if (Math.abs(diffX) > threshold) {
      const pages = [
        "dashboard",
        "weighing",
        "waste",
        "reassignment",
        "records",
        "reports",
        "configuration",
      ];
      const currentIndex = pages.indexOf(currentPage);

      if (diff > 0) {
        // Swipe left -> próxima página
        if (currentIndex < pages.length - 1) {
          showPage(pages[currentIndex + 1]);
        }
      } else {
        // Swipe right -> página anterior
        if (currentIndex > 0) {
          showPage(pages[currentIndex - 1]);
        }
      }

      // Feedback visual
      showMobileToast(`Navegando: ${getPageName(currentPage)}`);
    }
  }
}

// Pull to refresh no dashboard
function initPullToRefresh() {
  let startY = 0;
  const dashboardPage = document.getElementById("dashboard-page");

  if (!dashboardPage) return;

  dashboardPage.addEventListener("touchstart", (e) => {
    startY = e.touches[0].clientY;
  });

  dashboardPage.addEventListener("touchend", (e) => {
    const endY = e.changedTouches[0].clientY;
    const diff = endY - startY;

    // Pull down (rolar para baixo) mais de 100px
    if (diff > 100 && window.scrollY === 0) {
      refreshDashboard();
    }
  });
}

// Refresh dashboard com animação
function refreshDashboard() {
  const refreshBtn = document.getElementById("refreshDashboard");
  if (refreshBtn) {
    refreshBtn.classList.add("refreshing");

    // Simular carregamento
    setTimeout(() => {
      loadDashboardData();
      refreshBtn.classList.remove("refreshing");
      showMobileToast("Dashboard atualizado!");
    }, 1000);
  }
}

// Toast mobile (feedback rápido)
function showMobileToast(message, duration = 3000) {
  const toast = document.getElementById("mobileToast");
  if (!toast) return;

  toast.textContent = message;
  toast.style.display = "block";

  // Animação de entrada
  setTimeout(() => (toast.style.opacity = "1"), 10);

  // Remover após duração
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => (toast.style.display = "none"), 300);
  }, duration);
}

// Obter nome amigável da página
function getPageName(page) {
  const names = {
    dashboard: "Painel",
    weighing: "Pesagem",
    waste: "Sobras/Perdas",
    reassignment: "Remanejamento",
    records: "Registros",
    reports: "Relatórios",
    configuration: "Configurações",
  };
  return names[page] || page;
}

// Atualizar showPage para mobile
const originalShowPage = showPage;
showPage = function (pageName) {
  originalShowPage(pageName);

  // Atualizar menu mobile
  const mobileItem = document.querySelector(
    `.mobile-nav-item[data-page="${pageName}"]`,
  );
  if (mobileItem) {
    activateMobileNavItem(mobileItem);
  }

  // Scroll para topo em mobile
  if (window.innerWidth <= 768) {
    window.scrollTo(0, 0);
  }

  // Feedback tátil (vibração se suportado)
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }
};

// ===== ESTILOS DINÂMICOS PARA MENU MOBILE =====
const mobileStyles = document.createElement("style");
mobileStyles.textContent = `
    /* Menu "Mais" overlay */
    .mobile-more-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 2000;
        display: flex;
        align-items: flex-end;
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .mobile-more-overlay.active {
        opacity: 1;
    }
    
    .mobile-more-menu {
        background: white;
        border-radius: 20px 20px 0 0;
        width: 100%;
        max-height: 70vh;
        transform: translateY(100%);
        transition: transform 0.3s ease;
        padding-bottom: env(safe-area-inset-bottom);
    }
    
    .mobile-more-overlay.active .mobile-more-menu {
        transform: translateY(0);
    }
    
    .more-menu-header {
        padding: 1.5rem 1rem 1rem;
        border-bottom: 1px solid var(--border-color);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .more-menu-header h3 {
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0;
    }
    
    .more-menu-close {
        background: none;
        border: none;
        font-size: 1.25rem;
        color: var(--gray);
        padding: 0.5rem;
    }
    
    .more-menu-items {
        padding: 1rem 0;
        max-height: 50vh;
        overflow-y: auto;
    }
    
    .more-menu-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem 1.5rem;
        text-decoration: none;
        color: var(--dark-color);
        transition: background 0.2s ease;
    }
    
    .more-menu-item:hover,
    .more-menu-item:active {
        background: var(--light-color);
    }
    
    .more-menu-item i {
        width: 20px;
        text-align: center;
        color: var(--gray);
    }
    
    .more-menu-item.text-danger {
        color: var(--danger-color);
    }
    
    .more-menu-item.text-danger i {
        color: var(--danger-color);
    }
    
    .menu-divider {
        margin: 0.5rem 1.5rem;
        border: none;
        border-top: 1px solid var(--border-color);
    }
    
    /* Botão de refresh animado */
    .btn.refreshing {
        position: relative;
        overflow: hidden;
    }
    
    .btn.refreshing::after {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
        animation: refreshing 1s infinite;
    }
    
    @keyframes refreshing {
        to { left: 100%; }
    }
    
    /* Badge para notificações no menu */
    .mobile-nav-item .badge {
        position: absolute;
        top: 5px;
        right: 10px;
        background: var(--danger-color);
        color: white;
        font-size: 0.6rem;
        padding: 0.1rem 0.3rem;
        border-radius: 10px;
        min-width: 16px;
        text-align: center;
    }
    
    /* Status bar para mobile */
    .mobile-status-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 1rem;
        background: var(--primary-color);
        color: white;
        font-size: 0.8rem;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1001;
        height: 30px;
    }
    
    /* Offline indicator */
    .offline-indicator {
        background: var(--danger-color);
        color: white;
        padding: 0.5rem;
        text-align: center;
        font-size: 0.8rem;
        position: fixed;
        top: 60px;
        left: 0;
        right: 0;
        z-index: 999;
        animation: slideDown 0.3s ease;
    }
    
    @keyframes slideDown {
        from { transform: translateY(-100%); }
        to { transform: translateY(0); }
    }
`;
document.head.appendChild(mobileStyles);

// ===== INICIALIZAÇÃO MOBILE =====
// Modifique o DOMContentLoaded para incluir mobile
document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
  setupEventListeners();
  initMobileNavigation(); // ← NOVO
  updateDateTime();
  loadDashboardData();
  loadEmployees();
  loadProductsTable();
  loadRecords();
  loadWasteRecords();

  // Detectar orientação
  detectOrientation();
  initMobileNavigation(); // ← ADICIONE AQUI
  detectOrientation(); // ← ADICIONE AQUI
});

// Detectar mudança de orientação
function detectOrientation() {
  const isPortrait = window.matchMedia("(orientation: portrait)").matches;

  if (!isPortrait && window.innerWidth <= 768) {
    // Modo paisagem no mobile
    document.body.classList.add("landscape-mode");
  } else {
    document.body.classList.remove("landscape-mode");
  }
}

window.addEventListener("orientationchange", detectOrientation);
window.addEventListener("resize", detectOrientation);
// Inicialização
document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
  setupEventListeners();
  updateDateTime();
  loadDashboardData();
  loadEmployees();
  loadProductsTable();
  loadRecords();
  loadWasteRecords();
});

// Funções de Inicialização
function initializeApp() {
  // Carregar dados do localStorage
  loadFromLocalStorage();

  // Atualizar data e hora continuamente
  setInterval(updateDateTime, 1000);

  // Mostrar página inicial
  showPage("dashboard");
}

// Função para carregar do localStorage (MODIFICADA)
function loadFromLocalStorage() {
  try {
    const savedProduction = localStorage.getItem("productionRecords");
    const savedWaste = localStorage.getItem("wasteRecords");
    const savedReassignment = localStorage.getItem("reassignmentRecords");

    // ADICIONADO: Carregar colaboradores e produtos
    const savedBaseData = localStorage.getItem("productBaseData");

    if (savedProduction) productionRecords = JSON.parse(savedProduction);
    if (savedWaste) wasteRecords = JSON.parse(savedWaste);
    if (savedReassignment) reassignmentRecords = JSON.parse(savedReassignment);

    // ADICIONADO: Restaurar colaboradores e produtos
    if (savedBaseData) {
      const baseData = JSON.parse(savedBaseData);

      // Restaurar produtos
      if (baseData.products && Array.isArray(baseData.products)) {
        // Limpar produtos existentes
        productBase.products = [];

        // Adicionar produtos salvos
        baseData.products.forEach((product) => {
          productBase.products.push(product);
        });
      }

      // Restaurar colaboradores
      if (baseData.employees && Array.isArray(baseData.employees)) {
        // Limpar colaboradores existentes
        productBase.employees = [];

        // Adicionar colaboradores salvos
        baseData.employees.forEach((employee) => {
          productBase.employees.push(employee);
        });
      }
    }
  } catch (error) {
    console.error("Erro ao carregar dados do localStorage:", error);
    productionRecords = [];
    wasteRecords = [];
    reassignmentRecords = [];
  }
}

// Função para salvar no localStorage (MODIFICADA)
function saveToLocalStorage() {
  try {
    localStorage.setItem(
      "productionRecords",
      JSON.stringify(productionRecords),
    );
    localStorage.setItem("wasteRecords", JSON.stringify(wasteRecords));
    localStorage.setItem(
      "reassignmentRecords",
      JSON.stringify(reassignmentRecords),
    );

    // ADICIONADO: Salvar colaboradores e produtos
    const baseData = {
      products: productBase.getAllProducts(),
      employees: productBase.getAllEmployees(),
    };
    localStorage.setItem("productBaseData", JSON.stringify(baseData));
  } catch (error) {
    console.error("Erro ao salvar dados no localStorage:", error);
    showNotification("Erro ao salvar dados", "error");
  }
}

// Configuração de Event Listeners
function setupEventListeners() {
  // Menu lateral
  document.querySelectorAll(".menu-item").forEach((item) => {
    item.addEventListener("click", () => {
      const page = item.dataset.page;
      showPage(page);
    });
  });

  // Sidebar toggle (mobile)
  document
    .getElementById("sidebarToggle")
    .addEventListener("click", toggleSidebar);

  // Botões do dashboard
  document
    .getElementById("refreshDashboard")
    .addEventListener("click", loadDashboardData);
  document
    .getElementById("newProduction")
    .addEventListener("click", () => showPage("weighing"));

  // Pesagem
  document
    .getElementById("product-search")
    .addEventListener("input", handleProductSearch);
  document
    .getElementById("gross-weight")
    .addEventListener("input", calculateWeighing);
  document
    .getElementById("clear-weighing")
    .addEventListener("click", clearWeighingForm);
  document
    .getElementById("register-weighing")
    .addEventListener("click", registerWeighing);

  document
    .getElementById("product-search")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        const searchTerm = this.value.trim();
        if (searchTerm) {
          // Buscar produto pelo código exato
          const product = productBase.getProductByCode(searchTerm);
          if (product) {
            selectProduct(product);
            document.getElementById("search-results").innerHTML = "";
          } else {
            // Se não encontrar pelo código exato, tentar pela busca normal
            handleProductSearch();
          }
        }
      }
    });

  // Sobras/Perdas
  document
    .getElementById("waste-product-search")
    .addEventListener("input", handleWasteProductSearch);
  document.getElementById("new-waste").addEventListener("click", showWasteForm);
  document
    .getElementById("register-waste")
    .addEventListener("click", registerWaste);
  document
    .getElementById("cancel-waste")
    .addEventListener("click", clearWasteForm);

  // Remanejamento
  document
    .getElementById("reassignment-product-search")
    .addEventListener("input", handleReassignmentSearch);
  document.querySelectorAll(".type-option").forEach((option) => {
    option.addEventListener("click", () =>
      selectReassignmentType(option.dataset.type),
    );
  });
  document
    .getElementById("initial-weight")
    .addEventListener("input", calculateReassignment);
  document
    .getElementById("final-weight")
    .addEventListener("input", calculateReassignment);
  document
    .getElementById("destination-price")
    .addEventListener("input", calculateReassignment);
  document
    .getElementById("prev-step")
    .addEventListener("click", prevReassignmentStep);
  document
    .getElementById("next-step")
    .addEventListener("click", nextReassignmentStep);
  document
    .getElementById("register-reassignment")
    .addEventListener("click", registerReassignment);

  // Registros
  document
    .getElementById("apply-filters")
    .addEventListener("click", applyRecordFilters);
  document
    .getElementById("clear-filters")
    .addEventListener("click", clearRecordFilters);

  // Relatórios
  document
    .getElementById("apply-report-filters")
    .addEventListener("click", applyReportFilters);
  document
    .getElementById("clear-report-filters")
    .addEventListener("click", clearReportFilters);
  document.getElementById("export-pdf").addEventListener("click", exportToPDF);
  document
    .getElementById("export-excel")
    .addEventListener("click", exportToExcel);

  // Configurações
  document
    .getElementById("new-product")
    .addEventListener("click", showProductModal);
  document
    .getElementById("new-employee")
    .addEventListener("click", showEmployeeModal);
  document
    .getElementById("config-product-search")
    .addEventListener("input", filterProductsTable);
  document
    .getElementById("save-product")
    .addEventListener("click", saveProduct);
  document
    .getElementById("save-employee")
    .addEventListener("click", saveEmployee);
  document
    .getElementById("cancel-product")
    .addEventListener("click", closeProductModal);
  document
    .getElementById("cancel-employee")
    .addEventListener("click", closeEmployeeModal);
  document
    .getElementById("close-product-modal")
    .addEventListener("click", closeProductModal);
  document
    .getElementById("close-employee-modal")
    .addEventListener("click", closeEmployeeModal);
  document.getElementById("backup-data").addEventListener("click", backupData);
  document.getElementById("export-data").addEventListener("click", exportData);
  document.getElementById("import-data").addEventListener("click", importData);
  document.getElementById("clear-data").addEventListener("click", clearData);

  // Modais
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeAllModals();
      }
    });
  });

  // Fechar modais com ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAllModals();
  });
}

// Adicionar estilos CSS para a nova interface de sobras
const reassignmentStyles = document.createElement("style");
reassignmentStyles.textContent = `
    .interactive-section {
        background: #f8fafc;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 15px;
        border: 1px solid #e2e8f0;
    }
    
    .section-header {
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid #e2e8f0;
    }
    
    .section-header h4 {
        margin: 0 0 5px 0;
        color: #334155;
        font-size: 14px;
    }
    
    .section-header p {
        margin: 0;
        color: #64748b;
        font-size: 12px;
    }
    
    .product-waste-section {
        background: white;
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 10px;
        border: 1px solid #e2e8f0;
    }
    
    .product-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        padding-bottom: 8px;
        border-bottom: 1px dashed #e2e8f0;
    }
    
    .product-header strong {
        color: #1e293b;
        font-size: 14px;
    }
    
    .product-code, .waste-total {
        font-size: 12px;
        color: #64748b;
        background: #f1f5f9;
        padding: 2px 6px;
        border-radius: 4px;
    }
    
    .waste-details {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    
    .waste-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px;
        background: #f8fafc;
        border-radius: 4px;
        border-left: 3px solid #3b82f6;
    }
    
    .waste-info {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 5px;
        flex-grow: 1;
    }
    
    .waste-periodo, .waste-quantity, .waste-value, .waste-motivo {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 12px;
    }
    
    .waste-periodo i, .waste-quantity i, .waste-value i, .waste-motivo i {
        color: #64748b;
        font-size: 10px;
    }
    
    .btn-select {
        background: #10b981;
        color: white;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        cursor: pointer;
        white-space: nowrap;
    }
    
    .btn-select:hover {
        background: #059669;
    }
    
    .waste-indicator {
        color: #10b981;
        font-size: 11px;
        margin-top: 3px;
    }
    
    .selected-waste-info {
        background: #f0f9ff;
        border-radius: 6px;
        padding: 10px;
        margin-top: 10px;
        border: 1px solid #bae6fd;
    }
    
    .selected-waste-info .waste-details {
        display: flex;
        flex-direction: column;
        gap: 5px;
        font-size: 12px;
    }
    
    .selected-waste-info strong {
        color: #0369a1;
        display: block;
        margin-bottom: 5px;
    }
`;
document.head.appendChild(reassignmentStyles);

// Funções de UI
function showPage(pageName) {
  // Esconder todas as páginas
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("active");
  });

  // Remover active de todos os itens do menu
  document.querySelectorAll(".menu-item").forEach((item) => {
    item.classList.remove("active");
  });

  // Mostrar página selecionada
  const pageElement = document.getElementById(`${pageName}-page`);
  if (pageElement) {
    pageElement.classList.add("active");
  }

  // Ativar item do menu correspondente
  const menuItem = document.querySelector(
    `.menu-item[data-page="${pageName}"]`,
  );
  if (menuItem) {
    menuItem.classList.add("active");
  }

  // Atualizar conteúdo específico da página
  switch (pageName) {
    case "dashboard":
      loadDashboardData();
      break;
    case "weighing":
      clearWeighingForm();
      loadEmployees();
      break;
    case "waste":
      loadWasteRecords();
      break;
    case "reassignment":
      resetReassignment();
      break;
    case "records":
      loadRecords();
      break;
    case "reports":
      loadReports();
      break;
    case "configuration":
      loadProductsTable();
      loadEmployeesTable();
      break;
  }

  currentPage = pageName;

  // Fechar sidebar no mobile
  if (window.innerWidth <= 768) {
    document.querySelector(".sidebar").classList.remove("active");
  }
}

function toggleSidebar() {
  const sidebar = document.querySelector(".sidebar");
  sidebar.classList.toggle("active");
}

function updateDateTime() {
  const now = new Date();

  // Formatar data
  const dateOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  };
  const formattedDate = now.toLocaleDateString("pt-BR", dateOptions);

  // Formatar hora
  const timeOptions = { hour: "2-digit", minute: "2-digit", second: "2-digit" };
  const formattedTime = now.toLocaleTimeString("pt-BR", timeOptions);

  // Atualizar elementos
  document.getElementById("current-date").textContent = formattedDate;
  document.getElementById("current-time").textContent = formattedTime;
}

function showNotification(message, type = "info", duration = 5000) {
  const notifications = document.getElementById("notifications");

  const notification = document.createElement("div");
  notification.className = `notification ${type}`;

  let icon = "info-circle";
  if (type === "success") icon = "check-circle";
  if (type === "error") icon = "exclamation-circle";
  if (type === "warning") icon = "exclamation-triangle";

  notification.innerHTML = `
        <i class="fas fa-${icon} notification-icon"></i>
        <div class="notification-content">
            <div class="notification-title">${type === "error" ? "Erro" : type === "success" ? "Sucesso" : "Informação"}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;

  notifications.appendChild(notification);

  // Fechar notificação
  const closeBtn = notification.querySelector(".notification-close");
  closeBtn.addEventListener("click", () => {
    notification.style.animation = "slideIn 0.3s ease reverse";
    setTimeout(() => notification.remove(), 300);
  });

  // Remover automaticamente após duração
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = "slideIn 0.3s ease reverse";
      setTimeout(() => notification.remove(), 300);
    }
  }, duration);
}

// Funções do Dashboard
function loadDashboardData() {
  const today = new Date().toISOString().split("T")[0];

  // Filtrar registros de hoje
  const todayProduction = productionRecords.filter((record) =>
    record.date.startsWith(today),
  );

  const todayWaste = wasteRecords.filter((record) =>
    record.date.startsWith(today),
  );

  // Calcular totais
  const totalWeight = todayProduction.reduce(
    (sum, record) => sum + record.netWeight,
    0,
  );
  const totalValue = todayProduction.reduce(
    (sum, record) => sum + record.totalValue,
    0,
  );
  const totalWasteWeight = todayWaste.reduce(
    (sum, record) => sum + record.quantity,
    0,
  );
  const totalWasteValue = todayWaste.reduce(
    (sum, record) => sum + record.quantity * record.pricePerKg,
    0,
  );

  // Atualizar cards
  document.getElementById("today-production").textContent =
    `${totalWeight.toFixed(3)} kg`;
  document.getElementById("today-value").textContent =
    `R$ ${totalValue.toFixed(2)}`;
  document.getElementById("items-produced").textContent =
    todayProduction.length;

  // Contar tipos únicos de produtos
  const uniqueProducts = [
    ...new Set(todayProduction.map((p) => p.productName)),
  ];
  document.getElementById("products-types").textContent =
    `${uniqueProducts.length} tipos`;

  // Produto mais produzido
  const productCounts = {};
  todayProduction.forEach((record) => {
    productCounts[record.productName] =
      (productCounts[record.productName] || 0) + record.netWeight;
  });

  const topProduct = Object.entries(productCounts).sort(
    (a, b) => b[1] - a[1],
  )[0];
  document.getElementById("top-product").textContent = topProduct
    ? topProduct[0]
    : "-";

  // Perdas
  document.getElementById("today-waste").textContent =
    `${totalWasteWeight.toFixed(3)} kg`;
  document.getElementById("waste-value").textContent =
    `R$ ${totalWasteValue.toFixed(2)}`;

  // Última pesagem
  if (todayProduction.length > 0) {
    const lastRecord = todayProduction[todayProduction.length - 1];
    const time = lastRecord.time.split(":").slice(0, 2).join(":");
    document.getElementById("last-weighing-time").textContent = time;
    document.getElementById("last-weighing-product").textContent =
      lastRecord.productName;
    document.getElementById("weighing-status").textContent = "Registrado";
  } else {
    document.getElementById("last-weighing-time").textContent = "--:--";
    document.getElementById("last-weighing-product").textContent =
      "Nenhuma ainda";
    document.getElementById("weighing-status").textContent = "Sem registros";
  }

  // Atualizar comparações (simplificado)
  document.getElementById("production-comparison").textContent = "0%";
  document.getElementById("waste-comparison").textContent = "0%";

  // Atualizar tabela de atividade recente
  updateRecentActivityTable(todayProduction.slice(-5).reverse());
}

function updateRecentActivityTable(activities) {
  const tbody = document.getElementById("recent-activity");
  tbody.innerHTML = "";

  if (activities.length === 0) {
    tbody.innerHTML = `
            <tr class="no-data-row">
                <td colspan="5">Nenhuma atividade registrada hoje</td>
            </tr>
        `;
    return;
  }

  activities.forEach((activity) => {
    const time = activity.time.split(":").slice(0, 2).join(":");
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${time}</td>
            <td><span class="badge badge-production">Produção</span></td>
            <td>${activity.productName}</td>
            <td>${activity.netWeight.toFixed(3)} kg</td>
            <td>R$ ${activity.totalValue.toFixed(2)}</td>
        `;
    tbody.appendChild(row);
  });
}

// Funções de Pesagem
function handleProductSearch() {
  const searchTerm = document
    .getElementById("product-search")
    .value.toLowerCase();
  const resultsContainer = document.getElementById("search-results");

  // CORREÇÃO: Permitir busca mesmo com 1 caractere (para códigos)
  // Verificar se é apenas um número (código)
  const isNumericCode = /^\d+$/.test(searchTerm);

  if (searchTerm.length === 0) {
    resultsContainer.innerHTML = "";
    return;
  }

  // CORREÇÃO: Se for um código numérico, buscar mesmo com 1 caractere
  // Se for texto, manter o mínimo de 2 caracteres
  if (!isNumericCode && searchTerm.length < 2) {
    resultsContainer.innerHTML = "";
    return;
  }

  const products = productBase.searchProduct(searchTerm);
  resultsContainer.innerHTML = "";

  if (products.length === 0) {
    resultsContainer.innerHTML =
      '<div class="search-result-item">Nenhum produto encontrado</div>';
    return;
  }

  products.slice(0, 10).forEach((product) => {
    const item = document.createElement("div");
    item.className = "search-result-item";
    item.innerHTML = `
            <div class="product-name">${product.name}</div>
            <div class="product-code">Código: ${product.code}</div>
        `;

    item.addEventListener("click", () => {
      selectProduct(product);
      resultsContainer.innerHTML = "";
    });

    resultsContainer.appendChild(item);
  });
}

function selectProduct(product) {
  document.getElementById("product-search").value = product.name;

  // Mostrar card do produto selecionado
  const card = document.getElementById("selected-product-card");
  card.style.display = "block";

  // Preencher informações do produto
  document.getElementById("selected-code").textContent = product.code;
  document.getElementById("selected-name").textContent = product.name;
  document.getElementById("selected-tara").textContent = product.tara
    ? product.tara.toFixed(3)
    : "0.000";
  document.getElementById("selected-price").textContent = product.pricePerKg
    ? product.pricePerKg.toFixed(2)
    : "0.00";

  // Atualizar valores na pesagem
  document.getElementById("tara-display").textContent = product.tara
    ? product.tara.toFixed(3)
    : "0.000";
  document.getElementById("price-per-kg").textContent = product.pricePerKg
    ? product.pricePerKg.toFixed(2)
    : "0.00";

  // Calcular novamente se já houver peso bruto
  const grossWeight =
    parseFloat(document.getElementById("gross-weight").value) || 0;
  if (grossWeight > 0) {
    calculateWeighing();
  }
}

function calculateWeighing() {
  const tara =
    parseFloat(document.getElementById("tara-display").textContent) || 0;
  const grossWeight =
    parseFloat(document.getElementById("gross-weight").value) || 0;
  const pricePerKg =
    parseFloat(document.getElementById("price-per-kg").textContent) || 0;

  // Calcular peso líquido
  const netWeight = Math.max(0, grossWeight - tara);
  document.getElementById("net-weight").textContent = netWeight.toFixed(3);

  // Calcular valor total
  const totalValue = netWeight * pricePerKg;
  document.getElementById("total-value").textContent = totalValue.toFixed(2);
}

function clearWeighingForm() {
  document.getElementById("product-search").value = "";
  document.getElementById("selected-product-card").style.display = "none";
  document.getElementById("employee-select").selectedIndex = 0;
  document.getElementById("gross-weight").value = "";
  document.getElementById("observations").value = "";

  // Resetar valores calculados
  document.getElementById("tara-display").textContent = "0.000";
  document.getElementById("net-weight").textContent = "0.000";
  document.getElementById("price-per-kg").textContent = "0.00";
  document.getElementById("total-value").textContent = "0.00";
}

function registerWeighing() {
  // Validar dados
  const productName = document.getElementById("selected-name").textContent;
  if (productName === "-") {
    showNotification("Selecione um produto primeiro", "error");
    return;
  }

  const employeeId = document.getElementById("employee-select").value;
  if (!employeeId) {
    showNotification("Selecione um colaborador", "error");
    return;
  }

  const grossWeight = parseFloat(document.getElementById("gross-weight").value);
  if (!grossWeight || grossWeight <= 0) {
    showNotification("Informe o peso bruto", "error");
    return;
  }

  // Coletar dados
  const now = new Date();
  const record = {
    id: `PROD${Date.now()}`,
    type: "production",
    productCode: document.getElementById("selected-code").textContent,
    productName: productName,
    employeeId: employeeId,
    employeeName:
      document.getElementById("employee-select").selectedOptions[0].text,
    tara: parseFloat(document.getElementById("tara-display").textContent),
    grossWeight: grossWeight,
    netWeight: parseFloat(document.getElementById("net-weight").textContent),
    pricePerKg: parseFloat(document.getElementById("price-per-kg").textContent),
    totalValue: parseFloat(document.getElementById("total-value").textContent),
    observations: document.getElementById("observations").value,
    date: now.toISOString().split("T")[0],
    time: now.toTimeString().split(" ")[0],
    timestamp: now.getTime(),
  };

  // Adicionar ao array
  productionRecords.push(record);

  // Salvar no localStorage
  saveToLocalStorage();

  // Limpar formulário
  clearWeighingForm();

  // Mostrar notificação
  showNotification("Pesagem registrada com sucesso!", "success");

  // Atualizar dashboard
  loadDashboardData();
}

// Funções de Colaboradores
function loadEmployees() {
  const select = document.getElementById("employee-select");
  const activeEmployees = productBase.getActiveEmployees();

  select.innerHTML = '<option value="">Selecione um colaborador</option>';

  activeEmployees.forEach((employee) => {
    const option = document.createElement("option");
    option.value = employee.id;
    option.textContent = `${employee.name} - ${employee.position}`;
    select.appendChild(option);
  });
}

// Funções de Sobras/Perdas
function handleWasteProductSearch() {
  const searchTerm = document
    .getElementById("waste-product-search")
    .value.trim()
    .toLowerCase();
  const selectedProduct = document.getElementById("selected-waste-product");
  const periodoContainer = document.getElementById("periodo-select-container");

  // Verificar se o container do período existe, se não, criar
  if (!periodoContainer) {
    const form = document.querySelector(".waste-form");
    const periodoHtml = `
            <div class="form-group" id="periodo-select-container" style="display: none;">
                <label for="waste-periodo-select">
                    <i class="fas fa-calendar-alt"></i>
                    Período de Produção
                </label>
                <select id="waste-periodo-select">
                    <option value="">Selecione o período</option>
                </select>
            </div>
        `;
    const productSearchElement = document
      .getElementById("waste-product-search")
      .closest(".form-group");
    productSearchElement.insertAdjacentHTML("afterend", periodoHtml);
  }

  if (searchTerm.length === 0) {
    selectedProduct.style.display = "none";
    if (periodoContainer) periodoContainer.style.display = "none";

    // Limpar select de períodos
    const periodoSelect = document.getElementById("waste-periodo-select");
    if (periodoSelect) {
      periodoSelect.innerHTML = '<option value="">Selecione o período</option>';
    }

    // Remover campo de motivo se existir
    const motivoField = document.getElementById("waste-motivo-container");
    if (motivoField) {
      motivoField.remove();
    }

    return;
  }

  // Verificar se é apenas número (código)
  const isNumericCode = /^\d+$/.test(searchTerm);

  // Para códigos, buscar exato mesmo com 1 caractere
  // Para nomes, mínimo de 2 caracteres
  if (!isNumericCode && searchTerm.length < 2) {
    selectedProduct.style.display = "none";
    if (periodoContainer) periodoContainer.style.display = "none";
    return;
  }

  let products = [];
  if (isNumericCode) {
    // Buscar por código exato
    const product = productBase.getProductByCode(searchTerm);
    if (product) products = [product];
  } else {
    // Buscar por nome
    products = productBase.searchProduct(searchTerm);
  }

  if (products.length > 0) {
    const product = products[0];
    selectedProduct.style.display = "block";

    // Atualizar nome do produto
    document.getElementById("waste-product-name").textContent = product.name;

    // Armazenar dados do produto no elemento para uso posterior
    document.getElementById("selected-waste-product").dataset.code =
      product.code;
    document.getElementById("selected-waste-product").dataset.price =
      product.pricePerKg || 0;

    // *** CORREÇÃO CRÍTICA: NÃO ACUMULAR ENTRE DATAS DIFERENTES ***
    // Agrupar produção POR DATA, cada data é TOTALMENTE INDEPENDENTE
    const producoesPorData = {};

    // Filtrar produções deste produto e agrupar POR DATA
    productionRecords
      .filter((p) => p.productCode === product.code)
      .forEach((record) => {
        const data = record.date; // Data do registro

        // Inicializar registro para esta data se não existir
        if (!producoesPorData[data]) {
          producoesPorData[data] = {
            total: 0,
            registros: [],
            pesagens: 0,
            jaTemFechamento: false,
            sobrasRegistradas: 0,
            perdasRegistradas: 0,
            sobrasDisponiveis: 0,
          };
        }

        // *** CORREÇÃO: Somar APENAS produção desta data específica ***
        producoesPorData[data].total += record.netWeight;
        producoesPorData[data].registros.push(record);
        producoesPorData[data].pesagens++;
      });

    // Verificar se há registros de fechamento para cada data (APENAS NA MESMA DATA)
    wasteRecords
      .filter(
        (w) => w.productCode === product.code && w.motivo === "fechamento",
      )
      .forEach((waste) => {
        if (producoesPorData[waste.periodoId]) {
          producoesPorData[waste.periodoId].jaTemFechamento = true;
        }
      });

    // *** CORREÇÃO: Calcular sobras/perdas já registradas POR PERÍODO ESPECÍFICO ***
    wasteRecords
      .filter((w) => w.productCode === product.code)
      .forEach((waste) => {
        if (producoesPorData[waste.periodoId]) {
          if (waste.type === "sobra") {
            producoesPorData[waste.periodoId].sobrasRegistradas +=
              waste.quantity;
          } else if (waste.type === "perda") {
            producoesPorData[waste.periodoId].perdasRegistradas +=
              waste.quantity;
          }
        }
      });

    // *** CORREÇÃO: Calcular sobras disponíveis POR PERÍODO (produção daquela data - sobras registradas naquela data) ***
    Object.keys(producoesPorData).forEach((data) => {
      const periodo = producoesPorData[data];
      periodo.sobrasDisponiveis = periodo.total - periodo.sobrasRegistradas;
    });

    // Limpar select de períodos
    const periodoSelect = document.getElementById("waste-periodo-select");
    periodoSelect.innerHTML = '<option value="">Selecione o período</option>';

    // Adicionar opções para cada data (cada data é um período independente)
    Object.keys(producoesPorData)
      .sort()
      .reverse()
      .forEach((data) => {
        const periodo = producoesPorData[data];

        // Formatar data para exibição
        const dataObj = new Date(data + "T00:00:00");
        const dataFormatada = dataObj.toLocaleDateString("pt-BR");

        const option = document.createElement("option");
        option.value = data;

        // *** CORREÇÃO: Criar texto descritivo MOSTRANDO APENAS produção daquela data ***
        let status = "";
        if (periodo.jaTemFechamento) {
          status = " [FECHADO]";
        } else if (periodo.sobrasRegistradas > 0) {
          status = " [SOBRAS REGISTRADAS]";
        }

        option.textContent = `${dataFormatada} - ${periodo.total.toFixed(3)} kg (${periodo.pesagens} pesagens)${status}`;
        option.dataset.producaoTotal = periodo.total;
        option.dataset.sobrasDisponiveis = periodo.sobrasDisponiveis;
        option.dataset.jaTemFechamento = periodo.jaTemFechamento;
        option.dataset.pesagens = periodo.pesagens;

        // *** CORREÇÃO IMPORTANTE: Desabilitar opção se já tiver fechamento ***
        if (periodo.jaTemFechamento) {
          option.disabled = true;
        }

        periodoSelect.appendChild(option);
      });

    // Mostrar select de período
    document.getElementById("periodo-select-container").style.display = "block";

    // Adicionar evento para atualizar informações quando selecionar período
    periodoSelect.onchange = function () {
      const selectedOption = this.options[this.selectedIndex];
      if (selectedOption.value) {
        const producaoTotal =
          parseFloat(selectedOption.dataset.producaoTotal) || 0;
        const sobrasDisponiveis =
          parseFloat(selectedOption.dataset.sobrasDisponiveis) || 0;
        const jaFechado = selectedOption.dataset.jaTemFechamento === "true";
        const pesagens = parseInt(selectedOption.dataset.pesagens) || 0;

        // *** CORREÇÃO: Atualizar informações MOSTRANDO APENAS dados daquele período ***
        document.getElementById("period-production-total").textContent =
          producaoTotal.toFixed(3);
        document.getElementById("available-waste").textContent =
          sobrasDisponiveis.toFixed(3);

        // Mostrar aviso se período já está fechado
        const avisoContainer = document.getElementById(
          "periodo-aviso-container",
        );
        if (jaFechado) {
          if (!avisoContainer) {
            const avisoHtml = `
                            <div class="alert alert-warning" id="periodo-aviso-container" style="margin-top: 10px; padding: 10px; border-radius: 4px; background-color: #fff3cd; color: #856404; border: 1px solid #ffeaa7;">
                                <i class="fas fa-exclamation-triangle"></i>
                                <strong>Atenção:</strong> Este período já foi finalizado com sobra fechamento. Não é possível registrar novas sobras/perdas.
                            </div>
                        `;
            periodoSelect.insertAdjacentHTML("afterend", avisoHtml);
          }

          // Desabilitar campos do formulário
          document.getElementById("waste-type").disabled = true;
          document.getElementById("waste-motivo").disabled = true;
          document.getElementById("waste-quantity").disabled = true;
        } else {
          // Remover aviso se existir
          if (avisoContainer) avisoContainer.remove();

          // Habilitar campos
          document.getElementById("waste-type").disabled = false;
          document.getElementById("waste-motivo").disabled = false;
          document.getElementById("waste-quantity").disabled = false;
        }
      }
    };

    // Resto do código permanece igual...
    // [O restante da função permanece inalterado]
  } else {
    selectedProduct.style.display = "none";

    // Ocultar select de período
    if (periodoContainer) periodoContainer.style.display = "none";

    // Limpar select de períodos
    const periodoSelect = document.getElementById("waste-periodo-select");
    if (periodoSelect) {
      periodoSelect.innerHTML = '<option value="">Selecione o período</option>';
    }

    // Remover campos adicionais
    const motivoContainer = document.getElementById("waste-motivo-container");
    if (motivoContainer) motivoContainer.remove();

    const valorUnitarioContainer = document.getElementById(
      "valor-unitario-container",
    );
    if (valorUnitarioContainer) valorUnitarioContainer.remove();

    const valorTotalContainer = document.getElementById(
      "valor-total-container",
    );
    if (valorTotalContainer) valorTotalContainer.remove();

    const periodoAviso = document.getElementById("periodo-aviso-container");
    if (periodoAviso) periodoAviso.remove();
  }
}

function showWasteForm() {
  clearWasteForm();
  document.getElementById("waste-form").style.display = "block";
}

function clearWasteForm() {
  document.getElementById("waste-product-search").value = "";
  document.getElementById("selected-waste-product").style.display = "none";
  document.getElementById("waste-date").value = new Date()
    .toISOString()
    .split("T")[0];
  document.getElementById("waste-type").selectedIndex = 0;
  document.getElementById("waste-quantity").value = "";
  document.getElementById("waste-observations").value = "";

  // ADICIONADO: Limpar e ocultar campos novos
  const periodoContainer = document.getElementById("periodo-select-container");
  if (periodoContainer) {
    periodoContainer.style.display = "none";
    const periodoSelect = document.getElementById("waste-periodo-select");
    if (periodoSelect) {
      periodoSelect.innerHTML = '<option value="">Selecione o período</option>';
    }
  }

  const motivoSelect = document.getElementById("waste-motivo");
  if (motivoSelect) {
    motivoSelect.selectedIndex = 0;
  }

  // Remover aviso se existir
  const periodoAviso = document.getElementById("periodo-aviso-container");
  if (periodoAviso) periodoAviso.remove();

  // Remover campos de valor
  const valorUnitarioContainer = document.getElementById(
    "valor-unitario-container",
  );
  if (valorUnitarioContainer) valorUnitarioContainer.remove();

  const valorTotalContainer = document.getElementById("valor-total-container");
  if (valorTotalContainer) valorTotalContainer.remove();

  const motivoContainer = document.getElementById("waste-motivo-container");
  if (motivoContainer) motivoContainer.remove();

  // Habilitar campos que possam ter sido desabilitados
  document.getElementById("waste-type").disabled = false;

  // Restaurar botão de registro se estava em modo edição
  const registerBtn = document.getElementById("register-waste");
  if (registerBtn) {
    registerBtn.innerHTML =
      '<i class="fas fa-save"></i> Registrar Sobras/Perdas';
    registerBtn.onclick = registerWaste;
    registerBtn.disabled = false;
  }

  // Remover botão de cancelar edição se existir
  const cancelEditBtn = document.getElementById("cancel-edit-waste");
  if (cancelEditBtn) cancelEditBtn.remove();
}

// Modificar a função registerWaste para incluir o motivo:
function registerWaste() {
  // Validar dados
  const productName = document.getElementById("waste-product-name").textContent;
  if (productName === "-") {
    showNotification("Selecione um produto primeiro", "error");
    return;
  }

  const wasteType = document.getElementById("waste-type").value;
  if (!wasteType) {
    showNotification("Selecione o tipo", "error");
    return;
  }

  // ADICIONADO: Capturar o motivo
  const wasteMotivo = document.getElementById("waste-motivo").value;
  if (!wasteMotivo) {
    showNotification("Informe o motivo da sobra/perda", "error");
    return;
  }

  const quantity = parseFloat(document.getElementById("waste-quantity").value);
  if (!quantity || quantity <= 0) {
    showNotification("Informe a quantidade", "error");
    return;
  }

  // ADICIONADO: Capturar o período selecionado
  const periodoSelect = document.getElementById("waste-periodo-select");
  const periodoId = periodoSelect.value;
  const periodoText = periodoSelect.options[periodoSelect.selectedIndex].text;

  if (!periodoId) {
    showNotification("Selecione um período de produção", "error");
    return;
  }

  // Verificar se já existe registro de fechamento para este período
  if (wasteMotivo === "fechamento") {
    const existingFechamento = wasteRecords.find(
      (w) => w.periodoId === periodoId && w.motivo === "fechamento",
    );
    if (existingFechamento) {
      showNotification(
        "Este período já foi finalizado com sobra fechamento",
        "error",
      );
      return;
    }
  }

  // Coletar dados
  const now = new Date();
  const record = {
    id: `WASTE${Date.now()}`,
    type: wasteType,
    motivo: wasteMotivo, // ADICIONADO
    productCode: document.getElementById("selected-waste-product").dataset.code,
    productName: productName,
    quantity: quantity,
    pricePerKg:
      parseFloat(
        document.getElementById("selected-waste-product").dataset.price,
      ) || 0,
    date:
      document.getElementById("waste-date").value ||
      now.toISOString().split("T")[0],
    periodoId: periodoId, // ADICIONADO
    periodoText: periodoText, // ADICIONADO
    observations: document.getElementById("waste-observations").value,
    timestamp: now.getTime(),

    // ADICIONADO: Calcular valores automaticamente
    valorTotal:
      quantity *
      (parseFloat(
        document.getElementById("selected-waste-product").dataset.price,
      ) || 0),
    // Produção total será adicionada depois
    producaoTotal: 0,
    diferencaPeso: 0,
    prejuizo: 0,
  };

  // Adicionar ao array
  wasteRecords.push(record);

  // Salvar no localStorage
  saveToLocalStorage();

  // Limpar formulário
  clearWasteForm();

  // Mostrar notificação
  showNotification("Registro de sobras/perdas salvo com sucesso!", "success");

  // Atualizar tabela
  loadWasteRecords();
}

// Adicionar esta correção também na função loadWasteRecords
// Localize a função loadWasteRecords e substitua a parte do cálculo de produção total:

function loadWasteRecords() {
  const tbody = document.getElementById("waste-records");
  tbody.innerHTML = "";

  if (wasteRecords.length === 0) {
    tbody.innerHTML = `
            <tr class="no-data-row">
                <td colspan="9">Nenhum registro de sobras/perdas encontrado</td>
            </tr>
        `;
    return;
  }

  wasteRecords
    .sort((a, b) => b.timestamp - a.timestamp)
    .forEach((record) => {
      const date = new Date(record.timestamp);
      const formattedDate = date.toLocaleDateString("pt-BR");
      const formattedTime = date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      // *** CORREÇÃO: Buscar produção total APENAS do período específico (não acumular entre datas) ***
      let producaoTotalPeriodo = 0;
      if (record.periodoId) {
        // FILTRAR APENAS produção daquela data específica
        producaoTotalPeriodo = productionRecords
          .filter(
            (p) =>
              p.productCode === record.productCode &&
              p.date === record.periodoId,
          )
          .reduce((sum, p) => sum + p.netWeight, 0);
      }

      // Calcular diferença (peso sobra vs produção) - APENAS para aquele período
      const diferencaPeso = producaoTotalPeriodo - record.quantity;

      // Calcular prejuízo (diferenca * valor/kg)
      const prejuizo = diferencaPeso * record.pricePerKg;

      const row = document.createElement("tr");
      row.innerHTML = `
            <td>${formattedDate} ${formattedTime}</td>
            <td>${record.type === "sobra" ? "SOBRA" : "PERDA"}</td>
            <td>${record.productName}</td>
            <td>${record.quantity.toFixed(3)} kg</td>
            <td>R$ ${(record.quantity * record.pricePerKg).toFixed(2)}</td>
            <td>${producaoTotalPeriodo.toFixed(3)} kg</td>
            <td>${diferencaPeso.toFixed(3)} kg</td>
            <td>R$ ${prejuizo.toFixed(2)}</td>
            <td>
                <button class="btn btn-small btn-icon" onclick="editWasteRecord('${record.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-small btn-icon btn-danger" onclick="deleteWasteRecord('${record.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
      tbody.appendChild(row);
    });
}

// Funções de Remanejamento
function handleReassignmentSearch() {
  const searchTerm = document
    .getElementById("reassignment-product-search")
    .value.trim()
    .toLowerCase();
  const resultsContainer = document.getElementById("reassignment-results");

  if (searchTerm.length === 0) {
    resultsContainer.innerHTML = "";
    return;
  }

  // Verificar se é apenas número (código)
  const isNumericCode = /^\d+$/.test(searchTerm);

  // Para códigos, buscar exato mesmo com 1 caractere
  // Para nomes, mínimo de 2 caracteres
  if (!isNumericCode && searchTerm.length < 2) {
    resultsContainer.innerHTML = "";
    return;
  }

  let products = [];
  if (isNumericCode) {
    // Buscar por código exato
    const product = productBase.getProductByCode(searchTerm);
    if (product) products = [product];
  } else {
    // Buscar por nome
    products = productBase.searchProduct(searchTerm);
  }

  resultsContainer.innerHTML = "";

  if (products.length === 0) {
    resultsContainer.innerHTML =
      '<div class="search-result-item">Nenhum produto encontrado</div>';
    return;
  }

  // ADICIONADO: Nova seção mais interativa
  const interactiveSection = document.createElement("div");
  interactiveSection.className = "interactive-section";
  interactiveSection.innerHTML = `
        <div class="section-header">
            <h4><i class="fas fa-boxes"></i> Sobras Registradas por Produto</h4>
            <p>Selecione uma das sobras abaixo ou busque pelo código/nome</p>
        </div>
    `;
  resultsContainer.appendChild(interactiveSection);

  // ADICIONADO: Lista de sobras disponíveis por produto
  let hasWasteRecords = false;

  products.forEach((product) => {
    // BUSCAR SOBRAS ESPECÍFICAS (não produção)
    const wasteRecordsForProduct = wasteRecords.filter(
      (w) =>
        w.productCode === product.code && w.type === "sobra" && w.quantity > 0,
    );

    if (wasteRecordsForProduct.length > 0) {
      hasWasteRecords = true;

      const productSection = document.createElement("div");
      productSection.className = "product-waste-section";

      // Calcular total de sobras deste produto
      const totalWaste = wasteRecordsForProduct.reduce(
        (sum, w) => sum + w.quantity,
        0,
      );

      productSection.innerHTML = `
                <div class="product-header">
                    <strong>${product.name}</strong>
                    <span class="product-code">Código: ${product.code}</span>
                    <span class="waste-total">Sobras: ${totalWaste.toFixed(3)} kg</span>
                </div>
            `;

      // Adicionar detalhes por período
      const detailsDiv = document.createElement("div");
      detailsDiv.className = "waste-details";

      wasteRecordsForProduct.forEach((waste) => {
        const wasteDate = new Date(waste.timestamp);
        const formattedDate = wasteDate.toLocaleDateString("pt-BR");
        const formattedTime = wasteDate.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });

        const wasteItem = document.createElement("div");
        wasteItem.className = "waste-item";
        wasteItem.innerHTML = `
                    <div class="waste-info">
                        <div class="waste-periodo">
                            <i class="fas fa-calendar"></i>
                            <span>${waste.periodoText || formattedDate}</span>
                        </div>
                        <div class="waste-quantity">
                            <i class="fas fa-weight-hanging"></i>
                            <span>${waste.quantity.toFixed(3)} kg</span>
                        </div>
                        <div class="waste-value">
                            <i class="fas fa-money-bill-wave"></i>
                            <span>R$ ${((waste.quantity || 0) * (waste.pricePerKg || 0)).toFixed(2)}</span>
                        </div>
                        <div class="waste-motivo">
                            <i class="fas fa-tag"></i>
                            <span>${waste.motivo || "Sem motivo"}</span>
                        </div>
                    </div>
                    <button class="btn btn-small btn-select" data-waste-id="${waste.id}">
                        <i class="fas fa-check"></i>
                        Selecionar
                    </button>
                `;

        // Adicionar evento para selecionar esta sobra específica
        wasteItem
          .querySelector(".btn-select")
          .addEventListener("click", function () {
            selectOriginProduct(product, waste.quantity, waste.id, waste);
            resultsContainer.innerHTML = "";
          });

        detailsDiv.appendChild(wasteItem);
      });

      productSection.appendChild(detailsDiv);
      resultsContainer.appendChild(productSection);
    }
  });

  // Se não houver sobras registradas, manter a busca normal
  if (!hasWasteRecords) {
    interactiveSection.innerHTML = `
            <div class="section-header">
                <h4><i class="fas fa-info-circle"></i> Nenhuma sobra registrada encontrada</h4>
                <p>Busque pelo produto para ver produção disponível</p>
            </div>
        `;

    // MANTER A FUNCIONALIDADE ORIGINAL (não remover)
    products.slice(0, 10).forEach((product) => {
      // CALCULAR APENAS SOBRAS DISPONÍVEIS (não produção total)
      const productWaste = wasteRecords.filter(
        (w) => w.productCode === product.code && w.type === "sobra",
      );
      const totalWaste = productWaste.reduce((sum, w) => sum + w.quantity, 0);

      const item = document.createElement("div");
      item.className = "search-result-item";
      item.innerHTML = `
                <div class="product-name">${product.name}</div>
                <div class="product-code">Código: ${product.code} | Sobras: ${totalWaste.toFixed(3)} kg</div>
                ${totalWaste > 0 ? '<div class="waste-indicator"><i class="fas fa-check-circle"></i> Com sobras</div>' : ""}
            `;

      item.addEventListener("click", () => {
        selectOriginProduct(product, totalWaste);
        resultsContainer.innerHTML = "";
      });

      resultsContainer.appendChild(item);
    });
  }
}

function selectOriginProduct(
  product,
  availableWaste,
  wasteId = null,
  wasteRecord = null,
) {
  currentOriginProduct = {
    ...product,
    availableWaste: availableWaste,
    wasteId: wasteId,
    wasteRecord: wasteRecord,
  };

  const selectedDiv = document.getElementById("selected-origin-product");
  selectedDiv.style.display = "block";

  document.getElementById("origin-code").textContent = product.code;
  document.getElementById("origin-name").textContent = product.name;
  document.getElementById("origin-available").textContent =
    availableWaste.toFixed(3);
  document.getElementById("origin-price").textContent = product.pricePerKg
    ? product.pricePerKg.toFixed(2)
    : "0.00";

  document.getElementById("origin-price-display").textContent =
    product.pricePerKg ? product.pricePerKg.toFixed(2) : "0.00";

  // ADICIONADO: Mostrar informações da sobra específica se houver
  if (wasteRecord) {
    const wasteInfoDiv = document.createElement("div");
    wasteInfoDiv.className = "selected-waste-info";
    wasteInfoDiv.innerHTML = `
            <div class="waste-details">
                <strong>Detalhes da Sobra Selecionada:</strong>
                <div>Período: ${wasteRecord.periodoText || "Não informado"}</div>
                <div>Motivo: ${wasteRecord.motivo || "Não informado"}</div>
                <div>Data do Registro: ${new Date(wasteRecord.timestamp).toLocaleDateString("pt-BR")}</div>
            </div>
        `;

    // Inserir após as informações básicas do produto
    const originDetails = document.querySelector(".product-details");
    if (originDetails) {
      // Remover info anterior se existir
      const existingInfo = document.querySelector(".selected-waste-info");
      if (existingInfo) existingInfo.remove();

      originDetails.appendChild(wasteInfoDiv);
    }
  }

  // Atualizar informações do remanejamento
  document.getElementById("info-origin").textContent = product.name;

  // Avançar para próxima etapa
  nextReassignmentStep();
}

function selectReassignmentType(type) {
  currentReassignmentType = type;

  // Atualizar UI
  document.querySelectorAll(".type-option").forEach((option) => {
    option.classList.remove("active");
  });

  const selectedOption = document.querySelector(
    `.type-option[data-type="${type}"]`,
  );
  selectedOption.classList.add("active");

  // Atualizar informações
  let typeText = "";
  let destination = "";
  let destinationCode = "";

  switch (type) {
    case "farinha":
      typeText = "Sobra/Transformação";
      destination = "Farinha de Rosca";
      destinationCode = "FARINHA_ROSCA";
      break;
    case "torrada":
      typeText = "Sobra/Transformação";
      destination = "Torrada";
      destinationCode = "TORRADA";
      break;
    case "perda":
      typeText = "Perda/Descarte";
      destination = "Descarte";
      destinationCode = "DESCARTE";
      break;
  }

  document.getElementById("info-type").textContent = typeText;
  document.getElementById("info-destination").textContent = destination;

  // ADICIONADO: Verificar se o produto destino está na base de dados (para farinha/torrada)
  if (type === "farinha" || type === "torrada") {
    // Buscar produtos que correspondam ao destino
    const destinationProducts = productBase.searchProduct(
      destination.toLowerCase(),
    );

    // Criar ou atualizar select para escolher produto destino
    let destinationSelectContainer = document.getElementById(
      "destination-select-container",
    );

    if (!destinationSelectContainer) {
      destinationSelectContainer = document.createElement("div");
      destinationSelectContainer.id = "destination-select-container";
      destinationSelectContainer.className = "form-group";
      destinationSelectContainer.innerHTML = `
                <label for="destination-product-select">
                    <i class="fas fa-box"></i>
                    Produto Destino
                </label>
                <select id="destination-product-select">
                    <option value="">Selecione o produto destino...</option>
                </select>
            `;

      // Inserir antes dos campos de peso
      const initialWeightField = document
        .getElementById("initial-weight")
        .closest(".detail-group");
      if (initialWeightField) {
        initialWeightField.parentElement.insertBefore(
          destinationSelectContainer,
          initialWeightField.parentElement.firstChild,
        );
      }
    }

    const destinationSelect = document.getElementById(
      "destination-product-select",
    );
    destinationSelect.innerHTML =
      '<option value="">Selecione o produto destino...</option>';

    if (destinationProducts.length > 0) {
      destinationProducts.forEach((product) => {
        const option = document.createElement("option");
        option.value = product.code;
        option.textContent = `${product.name} (Código: ${product.code}) - R$ ${product.pricePerKg ? product.pricePerKg.toFixed(2) : "0.00"}/kg`;
        option.dataset.price = product.pricePerKg || 0;
        destinationSelect.appendChild(option);
      });

      // Adicionar opção para criar novo produto
      const newProductOption = document.createElement("option");
      newProductOption.value = "new";
      newProductOption.textContent = "➤ Cadastrar novo produto...";
      destinationSelect.appendChild(newProductOption);
    } else {
      // Se não encontrar produtos, oferecer opção para cadastrar
      destinationSelect.innerHTML = `
                <option value="">Nenhum produto "${destination}" encontrado</option>
                <option value="new">Cadastrar novo produto "${destination}"...</option>
            `;
    }

    // Adicionar evento para quando selecionar produto destino
    destinationSelect.onchange = function () {
      const selectedValue = this.value;

      if (selectedValue === "new") {
        // Oferecer para cadastrar novo produto
        if (
          confirm(
            `Deseja cadastrar o produto "${destination}" na base de dados?`,
          )
        ) {
          showProductModalForDestination(destination, destinationCode, type);
        } else {
          this.selectedIndex = 0;
        }
      } else if (selectedValue) {
        // Atualizar preço destino com base no produto selecionado
        const selectedOption = this.options[this.selectedIndex];
        const destinationPrice = parseFloat(selectedOption.dataset.price) || 0;
        document.getElementById("destination-price").value =
          destinationPrice.toFixed(2);

        // Calcular automaticamente
        calculateReassignment();
      }
    };
  } else {
    // Para perda/descarte, remover select se existir
    const destinationSelectContainer = document.getElementById(
      "destination-select-container",
    );
    if (destinationSelectContainer) {
      destinationSelectContainer.remove();
    }
  }

  // Mostrar informações
  document.getElementById("reassignment-info").style.display = "block";

  // Avançar para próxima etapa
  nextReassignmentStep();
}

function showProductModalForDestination(
  productName,
  productCode,
  reassignmentType,
) {
  const modal = document.getElementById("product-modal");
  const form = document.getElementById("product-form");

  // Preencher com dados sugeridos
  document.getElementById("modal-product-name").value = productName;
  document.getElementById("modal-product-code").value = productCode;
  document.getElementById("modal-product-tara").value = 0;
  document.getElementById("modal-product-price").value = 0;
  document.getElementById("modal-product-id").value = "";

  document.querySelector("#product-modal h3").innerHTML =
    `<i class="fas fa-box"></i> Cadastrar Produto para Remanejamento`;

  // Sobrescrever função save para lidar com o redirecionamento
  const originalSaveFunction = document.getElementById("save-product").onclick;

  document.getElementById("save-product").onclick = function () {
    // Validar formulário
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const productData = {
      name: document.getElementById("modal-product-name").value,
      code: document.getElementById("modal-product-code").value,
      tara: parseFloat(document.getElementById("modal-product-tara").value),
      pricePerKg: parseFloat(
        document.getElementById("modal-product-price").value,
      ),
    };

    try {
      // Adicionar novo produto
      productBase.addProduct(productData);

      // Salvar no localStorage
      saveToLocalStorage();

      showNotification("Produto cadastrado com sucesso!", "success");

      // Fechar modal
      closeProductModal();

      // Atualizar select de produtos destino
      const destinationSelect = document.getElementById(
        "destination-product-select",
      );
      if (destinationSelect) {
        destinationSelect.innerHTML =
          '<option value="">Selecione o produto destino...</option>';

        // Buscar produto recém-cadastrado
        const destinationProducts = productBase.searchProduct(
          productName.toLowerCase(),
        );

        destinationProducts.forEach((product) => {
          const option = document.createElement("option");
          option.value = product.code;
          option.textContent = `${product.name} (Código: ${product.code}) - R$ ${product.pricePerKg ? product.pricePerKg.toFixed(2) : "0.00"}/kg`;
          option.dataset.price = product.pricePerKg || 0;

          // Selecionar automaticamente o produto recém-cadastrado
          if (product.code === productCode) {
            option.selected = true;
            destinationSelect.value = product.code;

            // Atualizar preço destino
            document.getElementById("destination-price").value =
              product.pricePerKg ? product.pricePerKg.toFixed(2) : "0.00";

            // Calcular automaticamente
            calculateReassignment();
          }

          destinationSelect.appendChild(option);
        });
      }

      // Restaurar função original
      document.getElementById("save-product").onclick = originalSaveFunction;
    } catch (error) {
      showNotification("Erro ao cadastrar produto: " + error.message, "error");
    }
  };

  modal.classList.add("active");
}

function calculateReassignment() {
  const initialWeight =
    parseFloat(document.getElementById("initial-weight").value) || 0;
  const finalWeight =
    parseFloat(document.getElementById("final-weight").value) || 0;
  const originPrice =
    parseFloat(document.getElementById("origin-price-display").textContent) ||
    0;

  // ADICIONADO: Obter preço destino automaticamente
  let destinationPrice = 0;

  // Verificar se há select de produto destino
  const destinationSelect = document.getElementById(
    "destination-product-select",
  );
  if (
    destinationSelect &&
    destinationSelect.value &&
    destinationSelect.value !== "new"
  ) {
    const selectedOption =
      destinationSelect.options[destinationSelect.selectedIndex];
    destinationPrice = parseFloat(selectedOption.dataset.price) || 0;
  } else {
    // Usar valor digitado pelo usuário
    destinationPrice =
      parseFloat(document.getElementById("destination-price").value) || 0;
  }

  // Atualizar campo de preço destino com o valor atual
  document.getElementById("destination-price").value =
    destinationPrice.toFixed(2);

  // VALIDAÇÃO: Verificar se o peso inicial não excede as sobras disponíveis
  if (
    currentOriginProduct &&
    initialWeight > currentOriginProduct.availableWaste
  ) {
    showNotification(
      `Peso inicial excede as sobras disponíveis (${currentOriginProduct.availableWaste.toFixed(3)} kg)`,
      "error",
    );
    document.getElementById("initial-weight").style.borderColor = "#dc2626";
    return;
  } else {
    document.getElementById("initial-weight").style.borderColor = "";
  }

  // VALIDAÇÃO: Para perda, o peso final deve ser 0
  if (currentReassignmentType === "perda" && finalWeight > 0) {
    showNotification("Para perda/descarte, o peso final deve ser 0", "warning");
    document.getElementById("final-weight").style.borderColor = "#d97706";
  } else {
    document.getElementById("final-weight").style.borderColor = "";
  }

  // Cálculos
  const weightDifference = initialWeight - finalWeight;
  const initialValue = initialWeight * originPrice;
  const finalValue = finalWeight * destinationPrice;
  const lossValue = initialValue - finalValue;

  // Atualizar cards
  document.getElementById("weight-difference").textContent =
    `${weightDifference.toFixed(3)} kg`;
  document.getElementById("initial-value").textContent =
    `R$ ${initialValue.toFixed(2)}`;
  document.getElementById("final-value").textContent =
    `R$ ${finalValue.toFixed(2)}`;
  document.getElementById("loss-value").textContent =
    `R$ ${lossValue.toFixed(2)}`;

  // ADICIONADO: Destaque visual para valores negativos (prejuízo)
  const lossValueElement = document.getElementById("loss-value");
  if (lossValue > 0) {
    lossValueElement.style.color = "#dc2626";
    lossValueElement.innerHTML = `R$ ${lossValue.toFixed(2)} <i class="fas fa-arrow-down"></i>`;
  } else if (lossValue < 0) {
    lossValueElement.style.color = "#059669";
    lossValueElement.innerHTML = `R$ ${Math.abs(lossValue).toFixed(2)} <i class="fas fa-arrow-up"></i>`;
  } else {
    lossValueElement.style.color = "";
    lossValueElement.textContent = `R$ ${lossValue.toFixed(2)}`;
  }
}

function resetReassignment() {
  currentReassignmentStep = 1;
  currentReassignmentType = null;
  currentOriginProduct = null;

  // Resetar UI
  document.querySelectorAll(".step").forEach((step) => {
    step.classList.remove("active");
  });
  document.querySelector('.step[data-step="1"]').classList.add("active");

  document.querySelectorAll(".step-content").forEach((content) => {
    content.classList.remove("active");
  });
  document
    .querySelector('.step-content[data-step="1"]')
    .classList.add("active");

  document.querySelectorAll(".type-option").forEach((option) => {
    option.classList.remove("active");
  });

  // Limpar campos
  document.getElementById("reassignment-product-search").value = "";
  document.getElementById("selected-origin-product").style.display = "none";
  document.getElementById("reassignment-info").style.display = "none";
  document.getElementById("initial-weight").value = "";
  document.getElementById("final-weight").value = "";
  document.getElementById("destination-price").value = "";
  document.getElementById("reassignment-observations").value = "";

  // ADICIONADO: Remover elementos criados dinamicamente
  const destinationSelectContainer = document.getElementById(
    "destination-select-container",
  );
  if (destinationSelectContainer) {
    destinationSelectContainer.remove();
  }

  const selectedWasteInfo = document.querySelector(".selected-waste-info");
  if (selectedWasteInfo) {
    selectedWasteInfo.remove();
  }

  // Resetar cálculos
  document.getElementById("weight-difference").textContent = "0.000 kg";
  document.getElementById("initial-value").textContent = "R$ 0,00";
  document.getElementById("final-value").textContent = "R$ 0,00";
  document.getElementById("loss-value").textContent = "R$ 0,00";

  // Limpar estilos de validação
  document.getElementById("initial-weight").style.borderColor = "";
  document.getElementById("final-weight").style.borderColor = "";

  // Atualizar navegação
  updateReassignmentNavigation();
}

function prevReassignmentStep() {
  if (currentReassignmentStep > 1) {
    currentReassignmentStep--;
    updateReassignmentUI();
  }
}

function nextReassignmentStep() {
  // Validar etapa atual antes de avançar
  if (currentReassignmentStep === 1 && !currentOriginProduct) {
    showNotification("Selecione um produto de origem primeiro", "error");
    return;
  }

  if (currentReassignmentStep === 2 && !currentReassignmentType) {
    showNotification("Selecione um tipo de remanejamento", "error");
    return;
  }

  if (currentReassignmentStep < 3) {
    currentReassignmentStep++;
    updateReassignmentUI();
  }
}

function updateReassignmentUI() {
  // Atualizar steps
  document.querySelectorAll(".step").forEach((step) => {
    step.classList.remove("active");
    if (parseInt(step.dataset.step) <= currentReassignmentStep) {
      step.classList.add("active");
    }
  });

  // Atualizar conteúdo
  document.querySelectorAll(".step-content").forEach((content) => {
    content.classList.remove("active");
  });
  document
    .querySelector(`.step-content[data-step="${currentReassignmentStep}"]`)
    .classList.add("active");

  // Atualizar navegação
  updateReassignmentNavigation();
}

function updateReassignmentNavigation() {
  document.getElementById("current-step").textContent = currentReassignmentStep;

  const prevBtn = document.getElementById("prev-step");
  const nextBtn = document.getElementById("next-step");
  const registerBtn = document.getElementById("register-reassignment");

  if (currentReassignmentStep === 1) {
    prevBtn.style.display = "none";
    nextBtn.style.display = "flex";
    registerBtn.style.display = "none";
  } else if (currentReassignmentStep === 2) {
    prevBtn.style.display = "flex";
    nextBtn.style.display = "flex";
    registerBtn.style.display = "none";
  } else if (currentReassignmentStep === 3) {
    prevBtn.style.display = "flex";
    nextBtn.style.display = "none";
    registerBtn.style.display = "flex";
  }
}

function registerReassignment() {
  // Validar dados
  if (!currentOriginProduct) {
    showNotification("Produto de origem não selecionado", "error");
    return;
  }

  if (!currentReassignmentType) {
    showNotification("Tipo de remanejamento não selecionado", "error");
    return;
  }

  const initialWeight = parseFloat(
    document.getElementById("initial-weight").value,
  );
  if (!initialWeight || initialWeight <= 0) {
    showNotification("Informe o peso inicial", "error");
    return;
  }

  // Verificar se há sobras suficientes
  if (initialWeight > currentOriginProduct.availableWaste) {
    showNotification(
      `Peso inicial excede as sobras disponíveis (${currentOriginProduct.availableWaste.toFixed(3)} kg)`,
      "error",
    );
    return;
  }

  const finalWeight =
    parseFloat(document.getElementById("final-weight").value) || 0;
  const destinationPrice =
    parseFloat(document.getElementById("destination-price").value) || 0;

  // Calcular valores
  const originPrice = currentOriginProduct.pricePerKg || 0;
  const weightDifference = initialWeight - finalWeight;
  const initialValue = initialWeight * originPrice;
  const finalValue = finalWeight * destinationPrice;
  const lossValue = initialValue - finalValue;

  // Determinar tipo de destino
  let destinationType = "";
  let destinationName = "";

  switch (currentReassignmentType) {
    case "farinha":
      destinationType = "farinha_rosca";
      destinationName = "Farinha de Rosca";
      break;
    case "torrada":
      destinationType = "torrada";
      destinationName = "Torrada";
      break;
    case "perda":
      destinationType = "perda";
      destinationName = "Descarte";
      break;
  }

  // Criar registro
  const now = new Date();
  const record = {
    id: `REASSIGN${Date.now()}`,
    type: "reassignment",
    originProductCode: currentOriginProduct.code,
    originProductName: currentOriginProduct.name,
    destinationType: destinationType,
    destinationName: destinationName,
    initialWeight: initialWeight,
    finalWeight: finalWeight,
    weightDifference: weightDifference,
    originPricePerKg: originPrice,
    destinationPricePerKg: destinationPrice,
    initialValue: initialValue,
    finalValue: finalValue,
    lossValue: lossValue,
    observations: document.getElementById("reassignment-observations").value,
    date: now.toISOString().split("T")[0],
    time: now.toTimeString().split(" ")[0],
    timestamp: now.getTime(),
  };

  // Adicionar ao array
  reassignmentRecords.push(record);

  // Atualizar sobras disponíveis (remover do estoque)
  // Esta é uma simplificação - em um sistema real, seria mais complexo
  const wasteIndex = wasteRecords.findIndex(
    (w) => w.productCode === currentOriginProduct.code && w.type === "sobra",
  );

  if (wasteIndex !== -1) {
    wasteRecords[wasteIndex].quantity -= initialWeight;
    if (wasteRecords[wasteIndex].quantity <= 0) {
      wasteRecords.splice(wasteIndex, 1);
    }
  }

  // Salvar no localStorage
  saveToLocalStorage();

  // Mostrar notificação
  showNotification("Remanejamento registrado com sucesso!", "success");

  // Resetar formulário
  resetReassignment();

  // Atualizar outras páginas
  loadWasteRecords();
}

// Funções de Registros
function loadRecords(filters = {}) {
  // Combinar todos os registros
  let allRecords = [
    ...productionRecords.map((r) => ({ ...r, recordType: "production" })),
    ...wasteRecords.map((r) => ({
      ...r,
      recordType: r.type,
      date: r.date || new Date().toISOString().split("T")[0],
    })),
    ...reassignmentRecords.map((r) => ({ ...r, recordType: "reassignment" })),
  ];

  // Aplicar filtros
  if (filters.type) {
    allRecords = allRecords.filter((r) => {
      if (filters.type === "production") return r.recordType === "production";
      if (filters.type === "reassignment")
        return r.recordType === "reassignment";
      if (filters.type === "sobra" || filters.type === "perda")
        return r.recordType === filters.type;
      return true;
    });
  }

  if (filters.product) {
    const searchTerm = filters.product.toLowerCase();
    allRecords = allRecords.filter(
      (r) =>
        (r.productName && r.productName.toLowerCase().includes(searchTerm)) ||
        (r.originProductName &&
          r.originProductName.toLowerCase().includes(searchTerm)),
    );
  }

  if (filters.startDate) {
    allRecords = allRecords.filter((r) => r.date >= filters.startDate);
  }

  if (filters.endDate) {
    allRecords = allRecords.filter((r) => r.date <= filters.endDate);
  }

  // Ordenar por data mais recente
  allRecords.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  // Atualizar tabela
  updateRecordsTable(allRecords);
}

function applyRecordFilters() {
  const filters = {
    type: document.getElementById("record-type").value,
    product: document.getElementById("record-product").value,
    startDate: document.getElementById("start-date").value,
    endDate: document.getElementById("end-date").value,
  };

  loadRecords(filters);
}

function clearRecordFilters() {
  document.getElementById("record-type").selectedIndex = 0;
  document.getElementById("record-product").value = "";
  document.getElementById("start-date").value = "";
  document.getElementById("end-date").value = "";

  loadRecords();
}

function updateRecordsTable(records) {
  const tbody = document.getElementById("records-table");
  const totalWeightElem = document.getElementById("total-weight");
  const totalValueElem = document.getElementById("total-value-sum");
  const totalDifferenceElem = document.getElementById("total-difference");
  const totalLossElem = document.getElementById("total-loss");

  tbody.innerHTML = "";

  if (records.length === 0) {
    tbody.innerHTML = `
            <tr class="no-data-row">
                <td colspan="9">Nenhum registro encontrado</td>
            </tr>
        `;

    totalWeightElem.textContent = "0 kg";
    totalValueElem.textContent = "R$ 0,00";
    totalDifferenceElem.textContent = "0 kg";
    totalLossElem.textContent = "R$ 0,00";

    document.getElementById("records-count").textContent = "0";
    return;
  }

  // Calcular totais
  let totalWeight = 0;
  let totalValue = 0;
  let totalDifference = 0;
  let totalLoss = 0;

  records.forEach((record) => {
    const date = new Date(record.timestamp || Date.now());
    const formattedDate = date.toLocaleDateString("pt-BR");
    const formattedTime = date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    let typeBadge = "";
    let productName = "";
    let details = "";
    let weight = 0;
    let value = 0;
    let difference = "-";
    let loss = "-";

    switch (record.recordType) {
      case "production":
        typeBadge = '<span class="badge badge-production">Produção</span>';
        productName = record.productName;
        details = record.employeeName || "-";
        weight = record.netWeight || 0;
        value = record.totalValue || 0;
        totalWeight += weight;
        totalValue += value;
        break;

      case "sobra":
      case "perda":
        typeBadge =
          record.recordType === "sobra"
            ? '<span class="badge badge-waste">Sobra</span>'
            : '<span class="badge badge-danger">Perda</span>';
        productName = record.productName;
        details = record.observations || "-";
        weight = record.quantity || 0;
        value = (record.quantity || 0) * (record.pricePerKg || 0);
        totalWeight += weight;
        totalValue += value;
        break;

      case "reassignment":
        typeBadge =
          '<span class="badge badge-reassignment">Remanejamento</span>';
        productName = record.originProductName;
        details = `Para: ${record.destinationName}`;
        weight = record.initialWeight || 0;
        value = record.initialValue || 0;
        difference = `${record.weightDifference?.toFixed(3) || 0} kg`;
        loss = record.lossValue
          ? `R$ ${record.lossValue.toFixed(2)}`
          : "R$ 0,00";
        totalWeight += weight;
        totalValue += value;
        totalDifference += record.weightDifference || 0;
        totalLoss += record.lossValue || 0;
        break;
    }

    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${formattedDate} ${formattedTime}</td>
            <td>${typeBadge}</td>
            <td>${productName}</td>
            <td>${details}</td>
            <td>${weight.toFixed(3)} kg</td>
            <td>R$ ${value.toFixed(2)}</td>
            <td>${difference}</td>
            <td>${loss}</td>
            <td>
                <button class="btn btn-small btn-icon" onclick="viewRecordDetails('${record.id}', '${record.recordType}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
    tbody.appendChild(row);
  });

  // Atualizar totais
  totalWeightElem.textContent = `${totalWeight.toFixed(3)} kg`;
  totalValueElem.textContent = `R$ ${totalValue.toFixed(2)}`;
  totalDifferenceElem.textContent = `${totalDifference.toFixed(3)} kg`;
  totalLossElem.textContent = `R$ ${totalLoss.toFixed(2)}`;

  document.getElementById("records-count").textContent =
    records.length.toString();
}

function loadReports() {
    // Coletar valores dos filtros atuais
    const startDate = document.getElementById('report-start-date').value;
    const endDate = document.getElementById('report-end-date').value;
    const productName = document.getElementById('report-product-name').value.trim().toLowerCase();
    const productCode = document.getElementById('report-product-code').value.trim();
    const reportType = document.getElementById('report-type').value;
    
    // Se não houver datas definidas, mostrar últimos 7 dias por padrão
    if (!startDate && !endDate) {
        const defaultEndDate = new Date();
        const defaultStartDate = new Date();
        defaultStartDate.setDate(defaultStartDate.getDate() - 7);
        
        document.getElementById('report-start-date').value = defaultStartDate.toISOString().split('T')[0];
        document.getElementById('report-end-date').value = defaultEndDate.toISOString().split('T')[0];
        
        // Recarregar com datas padrão
        setTimeout(() => applyReportFilters(), 100);
        return;
    }
    
    // Filtrar produção por período
    let filteredProduction = productionRecords;
    if (startDate) filteredProduction = filteredProduction.filter(p => p.date >= startDate);
    if (endDate) filteredProduction = filteredProduction.filter(p => p.date <= endDate);
    if (productName) filteredProduction = filteredProduction.filter(p => 
        p.productName.toLowerCase().includes(productName)
    );
    if (productCode) filteredProduction = filteredProduction.filter(p => 
        p.productCode.includes(productCode)
    );
    if (reportType === 'production') {
        // Já estamos filtrando produção, não precisa fazer nada extra
    }
    
    // Filtrar sobras/perdas por período
    let filteredWaste = wasteRecords;
    if (startDate) filteredWaste = filteredWaste.filter(w => w.date >= startDate);
    if (endDate) filteredWaste = filteredWaste.filter(w => w.date <= endDate);
    if (productName) filteredWaste = filteredWaste.filter(w => 
        w.productName.toLowerCase().includes(productName)
    );
    if (productCode) filteredWaste = filteredWaste.filter(w => 
        w.productCode.includes(productCode)
    );
    if (reportType === 'waste') {
        filteredWaste = filteredWaste.filter(w => w.type === 'sobra' || w.type === 'perda');
    }
    
    // Filtrar remanejamento por período
    let filteredReassignment = reassignmentRecords;
    if (startDate) filteredReassignment = filteredReassignment.filter(r => r.date >= startDate);
    if (endDate) filteredReassignment = filteredReassignment.filter(r => r.date <= endDate);
    if (productName) filteredReassignment = filteredReassignment.filter(r => 
        r.originProductName.toLowerCase().includes(productName)
    );
    if (reportType === 'reassignment') {
        filteredReassignment = filteredReassignment.filter(r => r.type === 'reassignment');
    }
    
    // Agrupar por produto e período (cada data é independente)
    const productionByProductAndPeriod = {};
    
    // Processar produção (cada data é um período independente)
    filteredProduction.forEach(record => {
        const key = `${record.productCode}_${record.date}`;
        
        if (!productionByProductAndPeriod[key]) {
            productionByProductAndPeriod[key] = {
                name: record.productName,
                code: record.productCode,
                periodo: record.date,
                production: 0,
                waste: 0,      // Sobras transformadas
                loss: 0,       // Perdas/descartes
                value: 0,
                lossValue: 0   // Prejuízo total
            };
        }
        
        productionByProductAndPeriod[key].production += record.netWeight;
        productionByProductAndPeriod[key].value += record.totalValue;
    });
    
    // Processar SOBRAS (transformações) - vincular ao período correto
    filteredWaste.filter(w => w.type === 'sobra').forEach(waste => {
        const key = `${waste.productCode}_${waste.periodoId}`;
        
        if (productionByProductAndPeriod[key]) {
            // Sobra é consumo de produção
            productionByProductAndPeriod[key].waste += waste.quantity;
            
            // Calcular prejuízo da sobra
            const product = productBase.getProductByCode(waste.productCode);
            const pricePerKg = product ? product.pricePerKg : waste.pricePerKg || 0;
            productionByProductAndPeriod[key].lossValue += waste.quantity * pricePerKg;
        }
    });
    
    // Processar PERDAS/DESCARTES - vincular ao período correto
    filteredWaste.filter(w => w.type === 'perda').forEach(waste => {
        const key = `${waste.productCode}_${waste.periodoId}`;
        
        if (productionByProductAndPeriod[key]) {
            productionByProductAndPeriod[key].loss += waste.quantity;
            
            // Calcular prejuízo da perda
            const product = productBase.getProductByCode(waste.productCode);
            const pricePerKg = product ? product.pricePerKg : waste.pricePerKg || 0;
            productionByProductAndPeriod[key].lossValue += waste.quantity * pricePerKg;
        }
    });
    
    // Processar REMANEJAMENTOS (transformação de sobras)
    filteredReassignment.forEach(reassignment => {
        // Encontrar o período correto baseado na data do remanejamento
        // OU encontrar produção do mesmo produto na mesma data
        const possibleKeys = Object.keys(productionByProductAndPeriod).filter(key => 
            key.startsWith(`${reassignment.originProductCode}_`)
        );
        
        // Encontrar a data mais próxima (ou mesma data)
        let bestKey = null;
        if (possibleKeys.length > 0) {
            // Tentar encontrar exatamente a mesma data
            const sameDateKey = possibleKeys.find(key => 
                key.endsWith(`_${reassignment.date}`)
            );
            
            if (sameDateKey) {
                bestKey = sameDateKey;
            } else {
                // Usar a primeira data encontrada
                bestKey = possibleKeys[0];
            }
        }
        
        if (bestKey && productionByProductAndPeriod[bestKey]) {
            // Consome sobras do período
            productionByProductAndPeriod[bestKey].waste += reassignment.initialWeight;
            productionByProductAndPeriod[bestKey].lossValue += reassignment.lossValue || 0;
        }
    });
    
    // Calcular totais para os cards de resumo
    let totalProduction = 0;
    let totalProductionValue = 0;
    let totalWaste = 0;
    let totalLoss = 0;
    let totalLossValue = 0;
    
    Object.values(productionByProductAndPeriod).forEach(item => {
        totalProduction += item.production;
        totalProductionValue += item.value;
        totalWaste += item.waste;
        totalLoss += item.loss;
        totalLossValue += item.lossValue;
    });
    
    // Atualizar cards de resumo
    document.getElementById('report-production-total').textContent = `${totalProduction.toFixed(3)} kg`;
    document.getElementById('report-value-total').textContent = `R$ ${totalProductionValue.toFixed(2)}`;
    document.getElementById('report-loss-total').textContent = `${(totalWaste + totalLoss).toFixed(3)} kg`;
    document.getElementById('report-loss-value').textContent = `R$ ${totalLossValue.toFixed(2)}`;
    
    // Atualizar texto do filtro ativo
    let filterText = 'Todos os registros';
    if (startDate || endDate || productName || productCode || reportType) {
        filterText = 'Filtros aplicados:';
        if (startDate && endDate) filterText += ` ${startDate} a ${endDate}`;
        else if (startDate) filterText += ` a partir de ${startDate}`;
        else if (endDate) filterText += ` até ${endDate}`;
        if (productName) filterText += ` | Produto: "${productName}"`;
        if (productCode) filterText += ` | Código: "${productCode}"`;
        if (reportType) filterText += ` | Tipo: ${getReportTypeName(reportType)}`;
    }
    document.getElementById('active-filter').textContent = filterText;
    
    // Atualizar tabela de detalhes
    updateReportDetails(productionByProductAndPeriod);
    
    // Atualizar gráficos (se existirem)
    updateReportCharts(productionByProductAndPeriod);
}

// Função auxiliar para atualizar gráficos (se implementados posteriormente)
function updateReportCharts(productionData) {
    // Esta função pode ser implementada para atualizar gráficos
    // Por enquanto, apenas esconde os placeholders se houver dados
    const items = Object.values(productionData);
    
    if (items.length > 0) {
        // Esconder placeholders "Sem dados para exibir"
        document.querySelectorAll('.chart-placeholder .no-data').forEach(placeholder => {
            placeholder.style.display = 'none';
        });
    }
}

// Função auxiliar para converter tipos de relatório
function getReportTypeName(type) {
    const types = {
        'production': 'Produção',
        'waste': 'Sobras/Perdas',
        'reassignment': 'Remanejamento'
    };
    return types[type] || type;
}

function updateReportDetailsComPeriodos(dadosPorData) {
  const tbody = document.getElementById("report-details");
  tbody.innerHTML = "";

  // Ordenar datas (mais recente primeiro)
  const datasOrdenadas = Object.keys(dadosPorData).sort().reverse();

  if (datasOrdenadas.length === 0) {
    tbody.innerHTML = `
            <tr class="no-data-row">
                <td colspan="9">Nenhum dado para exibir no período selecionado</td>
            </tr>
        `;
    return;
  }

  // Para cada data/período INDIVIDUAL
  datasOrdenadas.forEach((data) => {
    const dia = dadosPorData[data];
    const dataFormatada = new Date(data + "T00:00:00").toLocaleDateString(
      "pt-BR",
    );

    // Para cada produto nesta data específica
    Object.values(dia.produtos).forEach((produto) => {
      // *** CORREÇÃO: Calcular eficiência APENAS com dados desta data ***
      const producaoUtil =
        produto.producaoKg - produto.sobrasKg - produto.perdasKg;
      const eficiencia =
        produto.producaoKg > 0
          ? ((producaoUtil / produto.producaoKg) * 100).toFixed(1)
          : "0.0";

      const prejuizoTotal =
        (produto.sobrasKg + produto.perdasKg) *
        (productBase.getProductByCode(produto.codigo)?.pricePerKg || 0);

      const row = document.createElement("tr");
      row.innerHTML = `
                <td><strong>${produto.nome}</strong><br><small>${dataFormatada}</small></td>
                <td>${produto.codigo}</td>
                <td>Produção</td>
                <td>${produto.producaoKg.toFixed(3)}</td>
                <td>${produto.sobrasKg.toFixed(3)}</td>
                <td>${produto.perdasKg.toFixed(3)}</td>
                <td>R$ ${produto.producaoValor.toFixed(2)}</td>
                <td>R$ ${prejuizoTotal.toFixed(2)}</td>
                <td>${eficiencia}%</td>
            `;
      tbody.appendChild(row);
    });

    // Linha separadora entre períodos (opcional)
    if (Object.values(dia.produtos).length > 0) {
      const separator = document.createElement("tr");
      separator.innerHTML = `
                <td colspan="9" style="background-color: #f5f5f5; height: 2px; padding: 0;">
                    <div style="border-top: 1px dashed #ddd; margin: 5px 0;"></div>
                </td>
            `;
      tbody.appendChild(separator);
    }
  });

  // Remover último separador se existir
  const lastRow = tbody.lastChild;
  if (lastRow && lastRow.innerHTML.includes("border-top")) {
    tbody.removeChild(lastRow);
  }
}


function applyReportFilters() {
  // Coletar valores dos filtros
  const startDate = document.getElementById("report-start-date").value;
  const endDate = document.getElementById("report-end-date").value;
  const productName = document
    .getElementById("report-product-name")
    .value.trim()
    .toLowerCase();
  const productCode = document
    .getElementById("report-product-code")
    .value.trim();
  const reportType = document.getElementById("report-type").value;

  // Validar datas
  if (startDate && endDate && startDate > endDate) {
    showNotification("Data início não pode ser maior que data fim", "error");
    return;
  }

  // Filtrar produção POR PERÍODO (cada data é independente)
  let filteredProduction = productionRecords;
  if (startDate)
    filteredProduction = filteredProduction.filter((p) => p.date >= startDate);
  if (endDate)
    filteredProduction = filteredProduction.filter((p) => p.date <= endDate);
  if (productName)
    filteredProduction = filteredProduction.filter((p) =>
      p.productName.toLowerCase().includes(productName),
    );
  if (productCode)
    filteredProduction = filteredProduction.filter((p) =>
      p.productCode.includes(productCode),
    );

  // Filtrar sobras/perdas POR PERÍODO
  let filteredWaste = wasteRecords;
  if (startDate)
    filteredWaste = filteredWaste.filter((w) => w.date >= startDate);
  if (endDate) filteredWaste = filteredWaste.filter((w) => w.date <= endDate);
  if (productName)
    filteredWaste = filteredWaste.filter((w) =>
      w.productName.toLowerCase().includes(productName),
    );
  if (productCode)
    filteredWaste = filteredWaste.filter((w) =>
      w.productCode.includes(productCode),
    );
  if (reportType === "waste") {
    filteredWaste = filteredWaste.filter(
      (w) => w.type === "sobra" || w.type === "perda",
    );
  }

  // Filtrar remanejamento POR PERÍODO
  let filteredReassignment = reassignmentRecords;
  if (startDate)
    filteredReassignment = filteredReassignment.filter(
      (r) => r.date >= startDate,
    );
  if (endDate)
    filteredReassignment = filteredReassignment.filter(
      (r) => r.date <= endDate,
    );
  if (productName)
    filteredReassignment = filteredReassignment.filter((r) =>
      r.originProductName.toLowerCase().includes(productName),
    );
  if (reportType === "reassignment") {
    filteredReassignment = filteredReassignment.filter(
      (r) => r.type === "reassignment",
    );
  }

  // NOVA LÓGICA: Agrupar por produto E POR PERÍODO (data)
  // Agrupar produção por produto E PERÍODO (cada data é independente)
  const productionByProductAndPeriod = {};

  // Processar produção agrupando por produto e período
  producaoFiltrada.forEach((record) => {
    const key = `${record.productCode}_${record.date}`;

    if (!productionByProductAndPeriod[key]) {
      productionByProductAndPeriod[key] = {
        name: record.productName,
        code: record.productCode,
        periodo: record.date,
        production: 0,
        waste: 0,
        loss: 0,
        value: 0,
        lossValue: 0,
      };
    }

    productionByProductAndPeriod[key].production += safeNumber(
      record.netWeight,
    );
    productionByProductAndPeriod[key].value += safeNumber(record.totalValue);
  });

  // Processar produção agrupando por produto e período
  filteredProduction.forEach((record) => {
    const key = `${record.productCode}_${record.date}`;

    if (!productionByProductAndPeriod[key]) {
      productionByProductAndPeriod[key] = {
        name: record.productName,
        code: record.productCode,
        periodo: record.date,
        production: 0,
        waste: 0,
        loss: 0,
        value: 0,
        lossValue: 0,
      };
    }

    productionByProductAndPeriod[key].production += record.netWeight;
    productionByProductAndPeriod[key].value += record.totalValue;
  });

  // Processar sobras (apenas as que correspondem aos períodos de produção)
  filteredWaste
    .filter((w) => w.type === "sobra")
    .forEach((waste) => {
      const key = `${waste.productCode}_${waste.periodoId}`;

      if (productionByProductAndPeriod[key]) {
        productionByProductAndPeriod[key].waste += waste.quantity;
      }
    });

  // Processar perdas (apenas as que correspondem aos períodos de produção)
  filteredWaste
    .filter((w) => w.type === "perda")
    .forEach((waste) => {
      const key = `${waste.productCode}_${waste.periodoId}`;

      if (productionByProductAndPeriod[key]) {
        productionByProductAndPeriod[key].loss += waste.quantity;

        // Calcular valor da perda
        const product = productBase.getProductByCode(waste.productCode);
        const pricePerKg = product ? product.pricePerKg : waste.pricePerKg || 0;
        productionByProductAndPeriod[key].lossValue +=
          waste.quantity * pricePerKg;
      }
    });

  // Processar remanejamentos (transformação de sobras)
  filteredReassignment.forEach((reassignment) => {
    const key = `${reassignment.originProductCode}_${reassignment.date}`;

    if (productionByProductAndPeriod[key]) {
      // Remanejamento consome sobras
      productionByProductAndPeriod[key].waste += reassignment.initialWeight;
      productionByProductAndPeriod[key].lossValue +=
        reassignment.lossValue || 0;
    }
  });

  // Calcular totais GERAIS (para os cards de resumo)
  let totalProduction = 0;
  let totalProductionValue = 0;
  let totalWaste = 0;
  let totalLoss = 0;
  let totalLossValue = 0;

  Object.values(productionByProductAndPeriod).forEach((item) => {
    totalProduction += item.production;
    totalProductionValue += item.value;
    totalWaste += item.waste;
    totalLoss += item.loss;
    totalLossValue += item.lossValue;
  });

  // Atualizar cards de resumo
  document.getElementById("report-production-total").textContent =
    `${totalProduction.toFixed(3)} kg`;
  document.getElementById("report-value-total").textContent =
    `R$ ${totalProductionValue.toFixed(2)}`;
  document.getElementById("report-loss-total").textContent =
    `${(totalWaste + totalLoss).toFixed(3)} kg`;
  document.getElementById("report-loss-value").textContent =
    `R$ ${totalLossValue.toFixed(2)}`;

  // Atualizar texto do filtro ativo
  let filterText = "Todos os registros";
  if (startDate || endDate || productName || productCode || reportType) {
    filterText = "Filtro personalizado";
    if (startDate && endDate) filterText += ` | ${startDate} a ${endDate}`;
    else if (startDate) filterText += ` | A partir de ${startDate}`;
    else if (endDate) filterText += ` | Até ${endDate}`;
    if (productName) filterText += ` | Produto: ${productName}`;
    if (productCode) filterText += ` | Código: ${productCode}`;
    if (reportType) filterText += ` | Tipo: ${getReportTypeName(reportType)}`;
  }
  document.getElementById("active-filter").textContent = filterText;

  // Atualizar tabela de detalhes com dados agrupados por período
  updateReportDetails(productionByProductAndPeriod);

  showNotification("Filtros aplicados com sucesso", "success");
}

function getReportTypeName(type) {
  const types = {
    production: "Produção",
    waste: "Sobras/Perdas",
    reassignment: "Remanejamento",
  };
  return types[type] || type;
}
function clearReportFilters() {
  document.getElementById("report-start-date").value = "";
  document.getElementById("report-end-date").value = "";
  document.getElementById("report-product-name").value = "";
  document.getElementById("report-product-code").value = "";
  document.getElementById("report-type").selectedIndex = 0;

  loadReports();
}

// Nova função updateReportDetails que aceita parâmetros filtrados
function updateReportDetails(productionByProductAndPeriod = {}) {
  const tbody = document.getElementById("report-details");
  tbody.innerHTML = "";

  const items = Object.values(productionByProductAndPeriod);

  if (items.length === 0) {
    tbody.innerHTML = `
            <tr class="no-data-row">
                <td colspan="9">Nenhum dado para exibir no período selecionado</td>
            </tr>
        `;
    return;
  }

  // Ordenar por produto e período
  items.sort((a, b) => {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return new Date(b.periodo) - new Date(a.periodo);
  });

  items.forEach((item) => {
    const formattedDate = new Date(
      item.periodo + "T00:00:00",
    ).toLocaleDateString("pt-BR");
    const efficiency =
      item.production > 0
        ? (
            ((item.production - item.waste - item.loss) / item.production) *
            100
          ).toFixed(1)
        : "0.0";

    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.code}</td>
            <td>${formattedDate}</td>
            <td>${item.production.toFixed(3)}</td>
            <td>${item.waste.toFixed(3)}</td>
            <td>${item.loss.toFixed(3)}</td>
            <td>R$ ${item.value.toFixed(2)}</td>
            <td>R$ ${item.lossValue.toFixed(2)}</td>
            <td>${efficiency}%</td>
        `;
    tbody.appendChild(row);
  });
}

function exportToPDF() {
  try {
    // Coletar dados
    const startDate =
      document.getElementById("report-start-date").value ||
      new Date().toISOString().split("T")[0];
    const endDate =
      document.getElementById("report-end-date").value ||
      new Date().toISOString().split("T")[0];

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("portrait");

    // Configurações
    const margin = 15;
    const pageWidth = doc.internal.pageSize.width;
    const contentWidth = pageWidth - 2 * margin;

    // FUNÇÕES AUXILIARES
    const formatDate = (dateString) => {
      try {
        return new Date(dateString + "T00:00:00").toLocaleDateString("pt-BR");
      } catch {
        return dateString;
      }
    };

    const safeNumber = (value) => parseFloat(value) || 0;

    // Função para desenhar label e value com cor para value
    const drawLabelValue = (
      doc,
      label,
      value,
      x,
      y,
      valueColor = [0, 0, 0],
    ) => {
      doc.setTextColor(0, 0, 0);
      doc.text(label, x, y);
      doc.setTextColor(...valueColor);
      doc.text(value, x + doc.getTextWidth(label), y);
    };

    // ========== CABEÇALHO ==========
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 255); // Azul para o cabeçalho superior
    doc.text("CONTROLE DE PRODUÇÃO E QUALIDADE", pageWidth / 2, 10, {
      align: "center",
    });

    // Título Principal
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text("RELATÓRIO DE PRODUÇÃO - POR PRODUTO", pageWidth / 2, 25, {
      align: "center",
    });

    // Período
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `Período: ${formatDate(startDate)} até ${formatDate(endDate)}`,
      pageWidth / 2,
      35,
      { align: "center" },
    );

    // Data de geração
    const now = new Date();
    const dataGeracao = now.toLocaleDateString("pt-BR");
    const horaGeracao = now.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Gerado em: ${dataGeracao} ${horaGeracao}`, pageWidth / 2, 42, {
      align: "center",
    });

    // Linha divisória
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(margin, 48, pageWidth - margin, 48);

    // Subtítulo RESULTADO GERAL DO PERÍODO
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("RESULTADO GERAL DO PERÍODO", margin, 58);

    // Agrupar dados para resumo
    const producaoFiltrada = productionRecords.filter(
      (p) => p.date >= startDate && p.date <= endDate,
    );
    const wasteFiltrado = wasteRecords.filter(
      (w) => w.date >= startDate && w.date <= endDate,
    );
    const reassignmentFiltrado = reassignmentRecords.filter(
      (r) => r.date >= startDate && r.date <= endDate,
    );

    // Cálculos gerais
    const totalProducaoKg = producaoFiltrada.reduce(
      (sum, p) => sum + safeNumber(p.netWeight),
      0,
    );
    const totalProducaoValor = producaoFiltrada.reduce(
      (sum, p) => sum + safeNumber(p.totalValue),
      0,
    );
    const totalSobrasKg = reassignmentFiltrado.reduce(
      (sum, r) => sum + safeNumber(r.initialWeight),
      0,
    );
    const totalPerdasKg = wasteFiltrado
      .filter((w) => w.type === "perda")
      .reduce((sum, w) => sum + safeNumber(w.quantity), 0);
    const prejuizoSobras = reassignmentFiltrado.reduce(
      (sum, r) => sum + safeNumber(r.lossValue),
      0,
    );
    const prejuizoPerdas = wasteFiltrado
      .filter((w) => w.type === "perda")
      .reduce((sum, w) => {
        const product = productBase.getProductByCode(w.productCode);
        const price = product ? product.pricePerKg : 0;
        return sum + safeNumber(w.quantity) * safeNumber(price);
      }, 0);

    // Agrupar por produto para eficiência média
    const productionByProduct = {};
    producaoFiltrada.forEach((record) => {
      if (!productionByProduct[record.productCode]) {
        productionByProduct[record.productCode] = {
          name: record.productName,
          code: record.productCode,
          production: 0,
          waste: 0,
          loss: 0,
        };
      }
      productionByProduct[record.productCode].production += safeNumber(
        record.netWeight,
      );
    });

    // Adicionar sobras e perdas
    reassignmentFiltrado.forEach((r) => {
      if (productionByProduct[r.originProductCode]) {
        productionByProduct[r.originProductCode].waste += safeNumber(
          r.initialWeight,
        );
      }
    });

    wasteFiltrado
      .filter((w) => w.type === "perda")
      .forEach((w) => {
        if (productionByProduct[w.productCode]) {
          productionByProduct[w.productCode].loss += safeNumber(w.quantity);
        }
      });

    // Calcular eficiência média
    let totalEficiencia = 0;
    let produtosComProducao = 0;

    Object.values(productionByProduct).forEach((produto) => {
      if (produto.production > 0) {
        const producaoUtil = produto.production - produto.waste - produto.loss;
        const eficiencia = (producaoUtil / produto.production) * 100;
        totalEficiencia += eficiencia;
        produtosComProducao++;
      }
    });

    const eficienciaMedia =
      produtosComProducao > 0 ? totalEficiencia / produtosComProducao : 100;

    // Tabela de Resultado Geral - Layout horizontal com fundo claro
    const startYGeral = 68;
    doc.setFontSize(10);

    // Fundo claro (light blue)
    doc.setFillColor(240, 248, 255);
    doc.rect(margin, startYGeral - 5, contentWidth, 25, "F");

    const y1 = startYGeral + 5;
    const y2 = y1 + 10;

    // Primeira linha
    drawLabelValue(
      doc,
      "Total Produção: ",
      `${totalProducaoKg.toFixed(3)} kg`,
      margin + 5,
      y1,
    );
    drawLabelValue(
      doc,
      "Total Sobras: ",
      `${totalSobrasKg.toFixed(3)} kg`,
      margin + 70,
      y1,
    );
    drawLabelValue(
      doc,
      "Prejuízo Total: ",
      `R$ ${(prejuizoSobras + prejuizoPerdas).toFixed(2)}`,
      margin + 130,
      y1,
      [255, 0, 0],
    );
    drawLabelValue(
      doc,
      "Eficiência Média: ",
      `${eficienciaMedia.toFixed(1)}%`,
      margin + 70,
      y2,
      [0, 128, 0],
    );

    // Segunda linha
    drawLabelValue(
      doc,
      "Valor Total: ",
      `R$ ${totalProducaoValor.toFixed(2)}`,
      margin + 5,
      y2,
    );
    drawLabelValue(
      doc,
      "Total Perdas: ",
      `${totalPerdasKg.toFixed(3)} kg`,
      margin + 130,
      y2,
    );
    drawLabelValue(
      doc,
      "Produtos Analisados: ",
      `${Object.keys(productionByProduct).length}`,
      margin + 5,
      y1 + 20,
    );

    // ========== PRODUTOS INDIVIDUAIS ==========

    let startYProduto = startYGeral + 40;

    // Processar cada produto
    Object.values(productionByProduct).forEach((produto, indexProduto) => {
      // Verificar se precisa de nova página
      if (startYProduto > 220 && indexProduto > 0) {
        doc.addPage("portrait");
        startYProduto = 20;
      }

      // Título do Produto (azul)
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 255);
      doc.text(
        `${produto.name.toUpperCase()} (Código: ${produto.code})`,
        margin,
        startYProduto,
      );

      startYProduto += 10;

      // Subtítulo RESUMO DO PRODUTO:
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text("RESUMO DO PRODUTO:", margin, startYProduto);

      startYProduto += 10;

      // Buscar dados específicos do produto
      const producaoProduto = producaoFiltrada.filter(
        (p) => p.productCode === produto.code,
      );
      const transformacoes = reassignmentFiltrado.filter(
        (r) => r.originProductCode === produto.code,
      );
      const perdasProduto = wasteFiltrado.filter(
        (w) => w.productCode === produto.code && w.type === "perda",
      );

      // Cálculos específicos
      const totalProducaoProduto = producaoProduto.reduce(
        (sum, p) => sum + safeNumber(p.netWeight),
        0,
      );
      const totalValorProduto = producaoProduto.reduce(
        (sum, p) => sum + safeNumber(p.totalValue),
        0,
      );
      const totalSobrasProduto = transformacoes.reduce(
        (sum, t) => sum + safeNumber(t.initialWeight),
        0,
      );
      const totalPerdasProduto = perdasProduto.reduce(
        (sum, p) => sum + safeNumber(p.quantity),
        0,
      );
      const prejuizoSobrasProduto = transformacoes.reduce(
        (sum, t) => sum + safeNumber(t.lossValue),
        0,
      );
      const prejuizoPerdasProduto = perdasProduto.reduce((sum, p) => {
        const product = productBase.getProductByCode(produto.code);
        const price = product ? product.pricePerKg : 0;
        return sum + safeNumber(p.quantity) * safeNumber(p.pricePerKg || price);
      }, 0);

      const producaoUtilProduto =
        totalProducaoProduto - totalSobrasProduto - totalPerdasProduto;
      const eficienciaProduto =
        totalProducaoProduto > 0
          ? ((producaoUtilProduto / totalProducaoProduto) * 100).toFixed(1)
          : "100.0";

      // Fundo claro para resumo (light gray)
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, startYProduto - 5, contentWidth, 35, "F");

      const yProd1 = startYProduto + 5;
      const yProd2 = yProd1 + 10;
      const yProd3 = yProd2 + 10;

      // Resumo do Produto - Layout horizontal
      doc.setFontSize(10);
      drawLabelValue(
        doc,
        "Produção Normal: ",
        `${totalProducaoProduto.toFixed(3)} kg`,
        margin + 5,
        yProd1,
      );
      drawLabelValue(
        doc,
        "Valor Total: ",
        `R$ ${totalValorProduto.toFixed(2)}`,
        margin + 80,
        yProd1,
      );

      drawLabelValue(
        doc,
        "Sobras Transformadas: ",
        `${totalSobrasProduto.toFixed(3)} kg`,
        margin + 5,
        yProd2,
      );
      drawLabelValue(
        doc,
        "Prejuízo Sobras: ",
        `R$ ${prejuizoSobrasProduto.toFixed(2)}`,
        margin + 80,
        yProd2,
        [255, 0, 0],
      );
      drawLabelValue(
        doc,
        "Eficiência: ",
        `${eficienciaProduto}%`,
        margin + 150,
        yProd2,
        [0, 128, 0],
      );

      drawLabelValue(
        doc,
        "Perdas/Descartes: ",
        `${totalPerdasProduto.toFixed(3)} kg`,
        margin + 5,
        yProd3,
      );
      drawLabelValue(
        doc,
        "Prejuízo Perdas: ",
        `R$ ${prejuizoPerdasProduto.toFixed(2)}`,
        margin + 80,
        yProd3,
        [255, 0, 0],
      );

      startYProduto += 40;

      // ========== DETALHAMENTO DA PRODUÇÃO NORMAL ==========

      if (producaoProduto.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text("DETALHAMENTO DA PRODUÇÃO NORMAL:", margin, startYProduto);

        startYProduto += 10;

        // Cabeçalho da tabela (verde)
        doc.setFillColor(0, 128, 0);
        doc.rect(margin, startYProduto, contentWidth, 10, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text("Data", margin + 5, startYProduto + 7);
        doc.text("Peso Liq. (kg)", margin + 60, startYProduto + 7);
        doc.text("Valor/kg (R$)", margin + 120, startYProduto + 7);
        doc.text(
          "Valor Total (R$)",
          pageWidth - margin - 5,
          startYProduto + 7,
          { align: "right" },
        );

        startYProduto += 10;

        // Linha abaixo do cabeçalho
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.1);
        doc.line(margin, startYProduto, pageWidth - margin, startYProduto);

        // Dados da produção
        doc.setTextColor(0, 0, 0);
        producaoProduto.slice(0, 6).forEach((registro, idx) => {
          const yRow = startYProduto + idx * 10 + 7;
          const dataFormatada = formatDate(registro.date);
          const horaFormatada = registro.time.split(":").slice(0, 2).join(":");

          doc.text(`${dataFormatada} ${horaFormatada}`, margin + 5, yRow);
          doc.text(
            `${safeNumber(registro.netWeight).toFixed(3)}`,
            margin + 65,
            yRow,
          );
          doc.text(
            `R$ ${safeNumber(registro.pricePerKg).toFixed(2)}`,
            margin + 125,
            yRow,
          );
          doc.text(
            `R$ ${safeNumber(registro.totalValue).toFixed(2)}`,
            pageWidth - margin - 5,
            yRow,
            { align: "right" },
          );
        });

        const numRows = Math.min(producaoProduto.length, 6);
        const tableProducaoHeight = numRows * 10;

        // Linha final da tabela
        doc.line(
          margin,
          startYProduto + tableProducaoHeight,
          pageWidth - margin,
          startYProduto + tableProducaoHeight,
        );

        startYProduto += tableProducaoHeight + 10;
      }

      // ========== TRANSFORMAÇÕES DE SOBRAS ==========

      if (transformacoes.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text("TRANSFORMAÇÕES DE SOBRAS:", margin, startYProduto);

        startYProduto += 10;

        // Cabeçalho da tabela (azul)
        doc.setFillColor(0, 102, 204);
        doc.rect(margin, startYProduto, contentWidth, 10, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text("Data", margin + 5, startYProduto + 7);
        doc.text("Peso Inicial (kg)", margin + 60, startYProduto + 7);
        doc.text("Destino", margin + 110, startYProduto + 7);
        doc.text("Peso Final (kg)", margin + 150, startYProduto + 7);
        doc.text("Prejuízo (R$)", pageWidth - margin - 5, startYProduto + 7, {
          align: "right",
        });

        startYProduto += 10;

        // Linha abaixo do cabeçalho
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.1);
        doc.line(margin, startYProduto, pageWidth - margin, startYProduto);

        // Dados das transformações
        doc.setTextColor(0, 0, 0);
        transformacoes.forEach((transformacao, idx) => {
          const yRow = startYProduto + idx * 10 + 7;
          const dataFormatada = formatDate(transformacao.date);
          const horaFormatada = transformacao.time
            ? transformacao.time.split(":").slice(0, 2).join(":")
            : "";

          doc.text(`${dataFormatada} ${horaFormatada}`, margin + 5, yRow);
          doc.text(
            `${safeNumber(transformacao.initialWeight).toFixed(3)}`,
            margin + 65,
            yRow,
          );
          doc.text(transformacao.destinationName, margin + 115, yRow);
          doc.text(
            `${safeNumber(transformacao.finalWeight).toFixed(3)}`,
            margin + 155,
            yRow,
          );
          doc.text(
            `R$ ${safeNumber(transformacao.lossValue).toFixed(2)}`,
            pageWidth - margin - 5,
            yRow,
            { align: "right" },
          );
        });

        const tableTransformacaoHeight = transformacoes.length * 10;

        // Linha final da tabela
        doc.line(
          margin,
          startYProduto + tableTransformacaoHeight,
          pageWidth - margin,
          startYProduto + tableTransformacaoHeight,
        );

        startYProduto += tableTransformacaoHeight + 20;
      } else {
        startYProduto += 15;
      }

      // Nova página se necessário
      if (
        startYProduto > 250 &&
        indexProduto < Object.values(productionByProduct).length - 1
      ) {
        doc.addPage("portrait");
        startYProduto = 20;
      }
    });

    // ========== PÁGINA FINAL: ANÁLISE COMPARATIVA ==========

    if (Object.keys(productionByProduct).length > 1) {
      // Verificar se precisa de nova página
      if (startYProduto > 150) {
        doc.addPage("portrait");
        startYProduto = 20;
      } else {
        startYProduto += 10;
      }

      // Título ANÁLISE COMPARATIVA
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(
        "ANÁLISE COMPARATIVA ENTRE PRODUTOS",
        pageWidth / 2,
        startYProduto,
        { align: "center" },
      );

      startYProduto += 15;

      // Cabeçalho da tabela comparativa (azul)
      doc.setFillColor(0, 102, 204);
      doc.rect(margin, startYProduto, contentWidth, 10, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text("Produto", margin + 5, startYProduto + 7);
      doc.text("Produção (kg)", margin + 50, startYProduto + 7);
      doc.text("Valor (R$)", margin + 90, startYProduto + 7);
      doc.text("Sobras (kg)", margin + 125, startYProduto + 7);
      doc.text("Perdas (kg)", margin + 160, startYProduto + 7);
      doc.text("Prejuízo (R$)", margin + 190, startYProduto + 7);
      doc.text("Eficiência", pageWidth - margin - 5, startYProduto + 7, {
        align: "right",
      });

      startYProduto += 10;

      // Linha abaixo do cabeçalho
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, startYProduto, pageWidth - margin, startYProduto);

      // Dados comparativos
      doc.setTextColor(0, 0, 0);
      let linhaAtual = 0;
      Object.values(productionByProduct).forEach((produto) => {
        // Buscar dados específicos para este produto
        const producaoProduto = producaoFiltrada.filter(
          (p) => p.productCode === produto.code,
        );
        const transformacoes = reassignmentFiltrado.filter(
          (r) => r.originProductCode === produto.code,
        );
        const perdasProduto = wasteFiltrado.filter(
          (w) => w.productCode === produto.code && w.type === "perda",
        );

        // Cálculos
        const totalProducaoProduto = producaoProduto.reduce(
          (sum, p) => sum + safeNumber(p.netWeight),
          0,
        );
        const totalValorProduto = producaoProduto.reduce(
          (sum, p) => sum + safeNumber(p.totalValue),
          0,
        );
        const totalSobrasProduto = transformacoes.reduce(
          (sum, t) => sum + safeNumber(t.initialWeight),
          0,
        );
        const totalPerdasProduto = perdasProduto.reduce(
          (sum, p) => sum + safeNumber(p.quantity),
          0,
        );
        const prejuizoSobrasProduto = transformacoes.reduce(
          (sum, t) => sum + safeNumber(t.lossValue),
          0,
        );
        const prejuizoPerdasProduto = perdasProduto.reduce((sum, p) => {
          const product = productBase.getProductByCode(produto.code);
          const price = product ? product.pricePerKg : 0;
          return (
            sum + safeNumber(p.quantity) * safeNumber(p.pricePerKg || price)
          );
        }, 0);

        const producaoUtilProduto =
          totalProducaoProduto - totalSobrasProduto - totalPerdasProduto;
        const eficienciaProduto =
          totalProducaoProduto > 0
            ? ((producaoUtilProduto / totalProducaoProduto) * 100).toFixed(1)
            : "100.0";

        // Escrever dados
        const yPos = startYProduto + linhaAtual * 10 + 7;

        // Nome do produto (primeira palavra em upper)
        const nomeCurto = produto.name.toUpperCase();
        doc.text(nomeCurto, margin + 5, yPos);

        doc.text(`${totalProducaoProduto.toFixed(3)}`, margin + 55, yPos);
        doc.text(`R$ ${totalValorProduto.toFixed(2)}`, margin + 95, yPos);
        doc.text(`${totalSobrasProduto.toFixed(3)}`, margin + 130, yPos);
        doc.text(`${totalPerdasProduto.toFixed(3)}`, margin + 165, yPos);
        doc.setTextColor(255, 0, 0);
        doc.text(
          `R$ ${(prejuizoSobrasProduto + prejuizoPerdasProduto).toFixed(2)}`,
          margin + 195,
          yPos,
        );
        doc.setTextColor(0, 128, 0);
        doc.text(`${eficienciaProduto}%`, pageWidth - margin - 5, yPos, {
          align: "right",
        });
        doc.setTextColor(0, 0, 0);

        linhaAtual++;
      });

      const tableComparativaHeight = linhaAtual * 10;

      // Linha final da tabela
      doc.line(
        margin,
        startYProduto + tableComparativaHeight,
        pageWidth - margin,
        startYProduto + tableComparativaHeight,
      );

      startYProduto += tableComparativaHeight + 15;

      // ========== CONCLUSÃO ==========

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("CONCLUSÃO:", margin, startYProduto);

      startYProduto += 10;

      // Texto da conclusão
      doc.setFontSize(10);
      const textoConclusao = [
        `O período analisado compreende ${Object.keys(productionByProduct).length} produtos diferentes,`,
        `com produção total de ${totalProducaoKg.toFixed(3)} kg e valor total de R$ ${totalProducaoValor.toFixed(2)}.`,
        `Foram transformadas ${totalSobrasKg.toFixed(3)} kg em sobras e registradas ${totalPerdasKg.toFixed(3)} kg`,
        `em perdas/descartes. O prejuízo total foi de R$ ${(prejuizoSobras + prejuizoPerdas).toFixed(2)}.`,
        `A eficiência média de produção foi de ${eficienciaMedia.toFixed(1)}%.`,
      ];

      textoConclusao.forEach((linha, idx) => {
        doc.text(linha, margin, startYProduto + idx * 8);
      });

      startYProduto += textoConclusao.length * 8;
    }

    // ========== RODAPÉ ==========

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      // Rodapé esquerdo
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        "Sistema de Controle de Produção • Relatório por Produto",
        margin,
        doc.internal.pageSize.height - 10,
      );

      // Número da página direito
      doc.text(
        `Página ${i} de ${totalPages}`,
        pageWidth - margin,
        doc.internal.pageSize.height - 10,
        { align: "right" },
      );
    }

    // ========== SALVAR PDF ==========

    const fileName = `relatorio_producao_${startDate.replace(/-/g, "")}_${endDate.replace(/-/g, "")}.pdf`;
    doc.save(fileName);

    showNotification("Relatório PDF gerado com sucesso!", "success");
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    showNotification("Erro ao gerar relatório: " + error.message, "error");
  }
}

function exportToExcel() {
  showNotification("Exportação para Excel em desenvolvimento", "info");
}

// Funções de Configurações
function loadProductsTable() {
  const tbody = document.getElementById("products-table");
  const products = productBase.getAllProducts();

  tbody.innerHTML = "";

  products.forEach((product) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.code}</td>
            <td>${product.tara ? product.tara.toFixed(3) : "0.000"}</td>
            <td>R$ ${product.pricePerKg ? product.pricePerKg.toFixed(2) : "0.00"}</td>
            <td>
                <button class="btn btn-small btn-icon" onclick="editProduct('${product.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-small btn-icon btn-danger" onclick="deleteProduct('${product.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
    tbody.appendChild(row);
  });
}

function loadEmployeesTable() {
  const tbody = document.getElementById("employees-table");
  const employees = productBase.getAllEmployees();

  tbody.innerHTML = "";

  employees.forEach((employee) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${employee.name}</td>
            <td>${employee.position}</td>
            <td>${employee.code}</td>
            <td><span class="badge ${employee.status === "ativo" ? "badge-success" : "badge-danger"}">${employee.status}</span></td>
            <td>
                <button class="btn btn-small btn-icon" onclick="editEmployee('${employee.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-small btn-icon btn-danger" onclick="deleteEmployee('${employee.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
    tbody.appendChild(row);
  });
}

function filterProductsTable() {
  const searchTerm = document
    .getElementById("config-product-search")
    .value.toLowerCase();
  const rows = document.querySelectorAll("#products-table tr");

  rows.forEach((row) => {
    const productName = row.cells[0]?.textContent.toLowerCase() || "";
    const productCode = row.cells[1]?.textContent.toLowerCase() || "";

    if (productName.includes(searchTerm) || productCode.includes(searchTerm)) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}

function showProductModal(productId = null) {
  const modal = document.getElementById("product-modal");
  const form = document.getElementById("product-form");

  if (productId) {
    // Modo edição
    const product = productBase.getProductById(productId);
    if (product) {
      document.getElementById("modal-product-name").value = product.name;
      document.getElementById("modal-product-code").value = product.code;
      document.getElementById("modal-product-tara").value = product.tara || 0;
      document.getElementById("modal-product-price").value =
        product.pricePerKg || 0;
      document.getElementById("modal-product-id").value = product.id;

      document.querySelector("#product-modal h3").innerHTML =
        '<i class="fas fa-edit"></i> Editar Produto';
    }
  } else {
    // Modo cadastro
    form.reset();
    document.getElementById("modal-product-id").value = "";
    document.querySelector("#product-modal h3").innerHTML =
      '<i class="fas fa-box"></i> Cadastrar Novo Produto';
  }

  modal.classList.add("active");
}

function closeProductModal() {
  document.getElementById("product-modal").classList.remove("active");
  document.getElementById("product-form").reset();
}

// Função saveProduct (MODIFICADA)
function saveProduct() {
  const form = document.getElementById("product-form");

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const productData = {
    name: document.getElementById("modal-product-name").value,
    code: document.getElementById("modal-product-code").value,
    tara: parseFloat(document.getElementById("modal-product-tara").value),
    pricePerKg: parseFloat(
      document.getElementById("modal-product-price").value,
    ),
  };

  const productId = document.getElementById("modal-product-id").value;

  try {
    if (productId) {
      // Atualizar produto existente
      productBase.updateProduct(productId, productData);
      showNotification("Produto atualizado com sucesso!", "success");
    } else {
      // Adicionar novo produto
      productBase.addProduct(productData);
      showNotification("Produto cadastrado com sucesso!", "success");
    }

    // ADICIONADO: Salvar no localStorage
    saveToLocalStorage();

    closeProductModal();
    loadProductsTable();
  } catch (error) {
    showNotification("Erro ao salvar produto: " + error.message, "error");
  }
}
function editProduct(productId) {
  showProductModal(productId);
}

// Função deleteProduct (MODIFICADA)
function deleteProduct(productId) {
  showConfirmModal(
    "Excluir Produto",
    "Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.",
    () => {
      if (productBase.deleteProduct(productId)) {
        // ADICIONADO: Salvar no localStorage
        saveToLocalStorage();

        showNotification("Produto excluído com sucesso!", "success");
        loadProductsTable();
      } else {
        showNotification("Erro ao excluir produto", "error");
      }
    },
  );
}

function showEmployeeModal(employeeId = null) {
  const modal = document.getElementById("employee-modal");
  const form = document.getElementById("employee-form");

  if (employeeId) {
    // Modo edição
    const employee = productBase.getEmployeeById(employeeId);
    if (employee) {
      document.getElementById("modal-employee-name").value = employee.name;
      document.getElementById("modal-employee-position").value =
        employee.position;
      document.getElementById("modal-employee-code").value = employee.code;
      document.getElementById("modal-employee-status").value = employee.status;
      document.getElementById("modal-employee-id").value = employee.id;

      document.querySelector("#employee-modal h3").innerHTML =
        '<i class="fas fa-user-edit"></i> Editar Colaborador';
    }
  } else {
    // Modo cadastro
    form.reset();
    document.getElementById("modal-employee-status").value = "ativo";
    document.getElementById("modal-employee-id").value = "";
    document.querySelector("#employee-modal h3").innerHTML =
      '<i class="fas fa-user-plus"></i> Cadastrar Colaborador';
  }

  modal.classList.add("active");
}

function closeEmployeeModal() {
  document.getElementById("employee-modal").classList.remove("active");
  document.getElementById("employee-form").reset();
}

// Função saveEmployee (MODIFICADA)
function saveEmployee() {
  const form = document.getElementById("employee-form");

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const employeeData = {
    name: document.getElementById("modal-employee-name").value,
    position: document.getElementById("modal-employee-position").value,
    code: document.getElementById("modal-employee-code").value,
    status: document.getElementById("modal-employee-status").value,
  };

  const employeeId = document.getElementById("modal-employee-id").value;

  try {
    if (employeeId) {
      // Atualizar colaborador existente
      productBase.updateEmployee(employeeId, employeeData);
      showNotification("Colaborador atualizado com sucesso!", "success");
    } else {
      // Adicionar novo colaborador
      productBase.addEmployee(employeeData);
      showNotification("Colaborador cadastrado com sucesso!", "success");
    }

    // ADICIONADO: Salvar no localStorage
    saveToLocalStorage();

    closeEmployeeModal();
    loadEmployeesTable();
    loadEmployees(); // Atualizar select de colaboradores
  } catch (error) {
    showNotification("Erro ao salvar colaborador: " + error.message, "error");
  }
}

function editEmployee(employeeId) {
  showEmployeeModal(employeeId);
}

// Função deleteEmployee (MODIFICADA)
function deleteEmployee(employeeId) {
  showConfirmModal(
    "Excluir Colaborador",
    "Tem certeza que deseja excluir este colaborador? Esta ação não pode ser desfeita.",
    () => {
      if (productBase.deleteEmployee(employeeId)) {
        // ADICIONADO: Salvar no localStorage
        saveToLocalStorage();

        showNotification("Colaborador excluído com sucesso!", "success");
        loadEmployeesTable();
        loadEmployees(); // Atualizar select de colaboradores
      } else {
        showNotification("Erro ao excluir colaborador", "error");
      }
    },
  );
}

function backupData() {
  const data = {
    productionRecords,
    wasteRecords,
    reassignmentRecords,
    products: productBase.getAllProducts(),
    employees: productBase.getAllEmployees(),
    timestamp: new Date().toISOString(),
  };

  const dataStr = JSON.stringify(data, null, 2);
  const dataUri =
    "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

  const exportFileDefaultName = `backup-procontrol-${new Date().toISOString().split("T")[0]}.json`;

  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", dataUri);
  linkElement.setAttribute("download", exportFileDefaultName);
  linkElement.click();

  showNotification("Backup criado com sucesso!", "success");
}

function exportData() {
  showNotification("Exportação de dados em desenvolvimento", "info");
}

function importData() {
  showNotification("Importação de dados em desenvolvimento", "info");
}

function clearData() {
  showConfirmModal(
    "Apagar Todos os Dados",
    "ATENÇÃO: Esta ação irá remover TODOS os registros de produção, sobras, perdas e remanejamentos. Esta ação NÃO pode ser desfeita. Tem certeza?",
    () => {
      productionRecords = [];
      wasteRecords = [];
      reassignmentRecords = [];
      saveToLocalStorage();

      showNotification("Todos os dados foram apagados com sucesso!", "success");

      // Atualizar todas as páginas
      loadDashboardData();
      loadWasteRecords();
      loadRecords();
      loadReports();
    },
  );
}

function showConfirmModal(title, message, confirmCallback) {
  const modal = document.getElementById("confirm-modal");
  document.getElementById("confirm-message").textContent = message;

  // Atualizar título (se houver elemento para isso)
  const titleElement = modal.querySelector("h3");
  if (titleElement) {
    titleElement.innerHTML = `<i class="fas fa-question-circle"></i> ${title}`;
  }

  // Configurar botão de confirmação
  const confirmBtn = document.getElementById("confirm-ok");
  confirmBtn.onclick = () => {
    modal.classList.remove("active");
    if (confirmCallback) confirmCallback();
  };

  // Configurar botão de cancelar
  const cancelBtn = document.getElementById("confirm-cancel");
  cancelBtn.onclick = () => {
    modal.classList.remove("active");
  };

  modal.classList.add("active");
}

function closeAllModals() {
  document.querySelectorAll(".modal.active").forEach((modal) => {
    modal.classList.remove("active");
  });
}

// Funções auxiliares para ações
function editWasteRecord(id) {
  const record = wasteRecords.find((r) => r.id === id);
  if (!record) return;

  // Preencher formulário com dados do registro
  document.getElementById("waste-product-search").value = record.productName;

  // Simular seleção do produto
  const product = productBase.getProductByCode(record.productCode);
  if (product) {
    // Atualizar interface para mostrar produto selecionado
    document.getElementById("selected-waste-product").style.display = "block";
    document.getElementById("waste-product-name").textContent = product.name;

    // Carregar períodos disponíveis
    const producoesPorData = {};
    productionRecords
      .filter((p) => p.productCode === product.code)
      .forEach((p) => {
        if (!producoesPorData[p.date]) producoesPorData[p.date] = 0;
        producoesPorData[p.date] += p.netWeight;
      });

    // Preencher select de período
    const periodoSelect = document.getElementById("waste-periodo-select");
    periodoSelect.innerHTML = '<option value="">Selecione o período</option>';
    Object.keys(producoesPorData).forEach((data) => {
      const option = document.createElement("option");
      option.value = data;
      option.textContent = `${data} - ${producoesPorData[data].toFixed(3)} kg`;
      if (data === record.periodoId) option.selected = true;
      periodoSelect.appendChild(option);
    });

    // Mostrar select de período
    document.getElementById("periodo-select-container").style.display = "block";
  }

  // Preencher outros campos
  document.getElementById("waste-date").value = record.date;
  document.getElementById("waste-type").value = record.type;
  document.getElementById("waste-motivo").value = record.motivo || "";
  document.getElementById("waste-quantity").value = record.quantity;
  document.getElementById("waste-observations").value =
    record.observations || "";

  // Mostrar botão de atualizar em vez de registrar
  const registerBtn = document.getElementById("register-waste");
  registerBtn.innerHTML = '<i class="fas fa-save"></i> Atualizar Registro';
  registerBtn.onclick = () => updateWasteRecord(id);

  // Adicionar botão de cancelar edição
  if (!document.getElementById("cancel-edit-waste")) {
    const cancelBtn = document.createElement("button");
    cancelBtn.id = "cancel-edit-waste";
    cancelBtn.className = "btn btn-secondary";
    cancelBtn.innerHTML = '<i class="fas fa-times"></i> Cancelar Edição';
    cancelBtn.onclick = () => {
      clearWasteForm();
      registerBtn.innerHTML =
        '<i class="fas fa-save"></i> Registrar Sobras/Perdas';
      registerBtn.onclick = registerWaste;
      cancelBtn.remove();
    };

    const formActions = document.querySelector(".form-actions");
    formActions.insertBefore(cancelBtn, registerBtn);
  }

  showNotification("Editando registro...", "info");
}

function updateWasteRecord(id) {
  const index = wasteRecords.findIndex((r) => r.id === id);
  if (index === -1) return;

  // Atualizar dados (similar ao registerWaste, mas mantendo o ID)
  const record = wasteRecords[index];

  // Atualizar campos
  record.type = document.getElementById("waste-type").value;
  record.motivo = document.getElementById("waste-motivo").value;
  record.quantity = parseFloat(document.getElementById("waste-quantity").value);
  record.periodoId = document.getElementById("waste-periodo-select").value;
  record.observations = document.getElementById("waste-observations").value;

  // Recalcular valores
  const product = productBase.getProductByCode(record.productCode);
  if (product) {
    record.pricePerKg = product.pricePerKg || 0;
    record.valorTotal = record.quantity * record.pricePerKg;
  }

  // Salvar
  saveToLocalStorage();
  loadWasteRecords();
  clearWasteForm();

  // Restaurar botão original
  const registerBtn = document.getElementById("register-waste");
  registerBtn.innerHTML = '<i class="fas fa-save"></i> Registrar Sobras/Perdas';
  registerBtn.onclick = registerWaste;

  // Remover botão de cancelar
  const cancelBtn = document.getElementById("cancel-edit-waste");
  if (cancelBtn) cancelBtn.remove();

  showNotification("Registro atualizado com sucesso!", "success");
}

function deleteWasteRecord(id) {
  showConfirmModal(
    "Excluir Registro",
    "Tem certeza que deseja excluir este registro de sobras/perdas?",
    () => {
      const index = wasteRecords.findIndex((r) => r.id === id);
      if (index !== -1) {
        wasteRecords.splice(index, 1);
        saveToLocalStorage();
        loadWasteRecords();
        showNotification("Registro excluído com sucesso!", "success");
      }
    },
  );
}

function viewRecordDetails(id, type) {
  showNotification("Visualização de detalhes em desenvolvimento", "info");
}

// Adicionar alguns estilos CSS dinâmicos
const style = document.createElement("style");
style.textContent = `
    .badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .badge-production {
        background-color: #dbeafe;
        color: #1d4ed8;
    }
    
    .badge-waste {
        background-color: #f0fdf4;
        color: #047857;
    }
    
    .badge-danger {
        background-color: #fee2e2;
        color: #dc2626;
    }
    
    .badge-reassignment {
        background-color: #fef3c7;
        color: #d97706;
    }
    
    .badge-success {
        background-color: #d1fae5;
        color: #059669;
    }
    
    .value-display {
        padding: 0.75rem;
        background: white;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        font-size: 1rem;
        font-weight: 500;
        color: var(--dark-color);
    }
`;
document.head.appendChild(style);
