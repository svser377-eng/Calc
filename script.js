// ========== VARIABLES GLOBALES ==========
let currentTab = 'iva';
let calculatorHistory = JSON.parse(localStorage.getItem('calculatorHistory')) || [];
let activePercentageMode = 'calcular';
let activeOtherTax = 'renta';
let lastActiveInput = null;

// Tasas de impuestos
const TAX_RATES = {
    renta: 8,
    retencion: 3,
    consumo: 8,
    predial: 0.8
};

const TAX_NAMES = {
    renta: 'Impuesto Renta',
    retencion: 'Retención',
    consumo: 'Impuesto Consumo',
    predial: 'Impuesto Predial'
};

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadFromLocalStorage();
});

function setupEventListeners() {
    // Event listeners para tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });

    // Event listeners para inputs con cálculo automático
    document.getElementById('ivaAmount')?.addEventListener('input', calculateIVA);
    document.getElementById('ivaType')?.addEventListener('change', calculateIVA);
    document.getElementById('gmfAmount')?.addEventListener('input', calculateGMF);

    // Track active input para el teclado
    document.querySelectorAll('.calc-input').forEach(input => {
        input.addEventListener('focus', function() {
            lastActiveInput = this;
        });
    });

    // Historial
    document.getElementById('historyBtn')?.addEventListener('click', showHistory);
    document.getElementById('historyModal')?.addEventListener('click', function(e) {
        if (e.target === this) closeHistory();
    });
}

// ========== NAVEGACIÓN DE TABS ==========
function switchTab(tabName) {
    currentTab = tabName;
    
    // Actualizar botones
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Actualizar contenido
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
}

// ========== IVA CALCULATOR ==========
function calculateIVA() {
    const amount = parseFloat(document.getElementById('ivaAmount').value) || 0;
    const taxRate = parseFloat(document.getElementById('ivaType').value) || 19;

    document.getElementById('ivaPercent').textContent = taxRate;

    const ivaValue = amount * (taxRate / 100);
    const total = amount + ivaValue;

    document.getElementById('ivaValue').textContent = formatCurrency(ivaValue);
    document.getElementById('ivaTotal').textContent = formatCurrency(total);

    if (amount > 0) {
        saveToHistory('IVA', `${taxRate}%`, total);
    }
}

function clearAllIVA() {
    document.getElementById('ivaAmount').value = '';
    document.getElementById('ivaType').value = '19';
    document.getElementById('ivaValue').textContent = '$0.00';
    document.getElementById('ivaTotal').textContent = '$0.00';
    lastActiveInput = document.getElementById('ivaAmount');
}

// ========== PORCENTAJE CALCULATOR ==========
function showPercentageMode(mode) {
    activePercentageMode = mode;
    const label1 = document.getElementById('percentageLabel1');
    const label2 = document.getElementById('percentageLabel2');

    switch(mode) {
        case 'calcular':
            label1.textContent = 'Monto';
            label2.textContent = 'Porcentaje (%)';
            break;
        case 'aumento':
            label1.textContent = 'Valor original';
            label2.textContent = 'Aumento (%)';
            break;
        case 'descuento':
            label1.textContent = 'Valor original';
            label2.textContent = 'Descuento (%)';
            break;
        case 'margen':
            label1.textContent = 'Costo';
            label2.textContent = 'Margen (%)';
            break;
    }

    document.getElementById('percentageAmount').value = '';
    document.getElementById('percentageValue').value = '';
    document.getElementById('percentageResult').style.display = 'none';
    document.getElementById('percentageActions').style.display = 'none';
    lastActiveInput = document.getElementById('percentageAmount');
}

function calculatePercentage() {
    const amount = parseFloat(document.getElementById('percentageAmount').value) || 0;
    const percentage = parseFloat(document.getElementById('percentageValue').value) || 0;

    if (amount <= 0 || percentage < 0) {
        alert('Por favor ingresa valores válidos');
        return;
    }

    let result, finalValue, label;
    const percentageValue = amount * (percentage / 100);

    switch(activePercentageMode) {
        case 'calcular':
            result = percentageValue;
            finalValue = amount + result;
            label = `${percentage}% de ${formatCurrency(amount)}`;
            break;
        case 'aumento':
            result = percentageValue;
            finalValue = amount + result;
            label = `Aumento del ${percentage}%`;
            break;
        case 'descuento':
            result = percentageValue;
            finalValue = amount - result;
            label = `Descuento del ${percentage}%`;
            break;
        case 'margen':
            result = percentageValue;
            finalValue = amount + result;
            label = `Margen de ganancia ${percentage}%`;
            break;
    }

    document.getElementById('percentageResultLabel').textContent = label;
    document.getElementById('percentageResultValue').textContent = formatCurrency(result);
    document.getElementById('percentageFinalValue').textContent = formatCurrency(finalValue);
    document.getElementById('percentageResult').style.display = 'block';
    document.getElementById('percentageActions').style.display = 'flex';

    saveToHistory(label, formatCurrency(result), finalValue);
}

function clearAllPercentage() {
    document.getElementById('percentageAmount').value = '';
    document.getElementById('percentageValue').value = '';
    document.getElementById('percentageResult').style.display = 'none';
    document.getElementById('percentageActions').style.display = 'none';
    lastActiveInput = document.getElementById('percentageAmount');
}

// ========== 4x1000 CALCULATOR ==========
function calculateGMF() {
    const amount = parseFloat(document.getElementById('gmfAmount').value) || 0;
    const rate = 0.004; // 4x1000 = 0.4%
    const gmfValue = Math.max(amount * rate, 800); // Mínimo $800

    const total = amount + gmfValue;

    document.getElementById('gmfValue').textContent = formatCurrency(gmfValue);
    document.getElementById('gmfTotal').textContent = formatCurrency(total);

    if (amount > 0) {
        saveToHistory('Gravamen 4x1000', '0.4%', total);
    }
}

function clearAllGMF() {
    document.getElementById('gmfAmount').value = '';
    document.getElementById('gmfValue').textContent = '$0.00';
    document.getElementById('gmfTotal').textContent = '$0.00';
    lastActiveInput = document.getElementById('gmfAmount');
}

// ========== OTROS IMPUESTOS ==========
function showOtherTax(taxType) {
    activeOtherTax = taxType;
    const label = document.getElementById('otherLabel');
    const percentLabel = document.getElementById('otherPercentLabel');
    const rate = TAX_RATES[taxType];

    label.textContent = 'Monto';
    percentLabel.textContent = `Porcentaje (%) - ${rate}%`;

    document.getElementById('otherAmount').value = '';
    document.getElementById('otherPercent').value = rate;
    document.getElementById('otherResult').style.display = 'none';
    document.getElementById('otherActions').style.display = 'none';
    lastActiveInput = document.getElementById('otherAmount');
}

function calculateOtherTax() {
    const amount = parseFloat(document.getElementById('otherAmount').value) || 0;
    const percent = parseFloat(document.getElementById('otherPercent').value) || 0;

    if (amount <= 0 || percent < 0) {
        alert('Por favor ingresa valores válidos');
        return;
    }

    const taxValue = amount * (percent / 100);
    const total = amount + taxValue;

    document.getElementById('otherResultLabel').textContent = `${TAX_NAMES[activeOtherTax]} (${percent}%)`;
    document.getElementById('otherTaxValue').textContent = formatCurrency(taxValue);
    document.getElementById('otherFinalValue').textContent = formatCurrency(total);
    document.getElementById('otherResult').style.display = 'block';
    document.getElementById('otherActions').style.display = 'flex';

    saveToHistory(TAX_NAMES[activeOtherTax], `${percent}%`, total);
}

function clearAllOther() {
    document.getElementById('otherAmount').value = '';
    document.getElementById('otherPercent').value = TAX_RATES[activeOtherTax];
    document.getElementById('otherResult').style.display = 'none';
    document.getElementById('otherActions').style.display = 'none';
    lastActiveInput = document.getElementById('otherAmount');
}

// ========== CALCULADORA NUMÉRICA (CORREGIDA) ==========
function getActiveCalculatorInput() {
    // Si no hay input activo, obtener el primero del tab activo
    if (!lastActiveInput || !document.body.contains(lastActiveInput)) {
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab) {
            const inputs = activeTab.querySelectorAll('.calc-input');
            if (inputs.length > 0) {
                lastActiveInput = inputs[0];
                return lastActiveInput;
            }
        }
        return null;
    }
    return lastActiveInput;
}

function padAppendNumber(num) {
    const activeInput = getActiveCalculatorInput();
    if (!activeInput) {
        console.warn('No hay campo activo para agregar número');
        return;
    }

    let value = activeInput.value;

    if (num === '.') {
        // No agregar punto si ya existe
        if (value.includes('.')) return;
        // No agregar punto si el campo está vacío
        if (value === '') value = '0';
        value += num;
    } else if (num === '%') {
        // Convertir valor a porcentaje
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue !== 0) {
            value = (numValue / 100).toString();
        }
    } else {
        // Agregar número normal
        value += num;
    }

    activeInput.value = value;
    activeInput.dispatchEvent(new Event('input'));
}

function padDeleteLast() {
    const activeInput = getActiveCalculatorInput();
    if (!activeInput) return;
    
    activeInput.value = activeInput.value.slice(0, -1);
    activeInput.dispatchEvent(new Event('input'));
}

function padToggleSign() {
    const activeInput = getActiveCalculatorInput();
    if (!activeInput) return;
    
    const value = parseFloat(activeInput.value);
    if (!isNaN(value) && value !== 0) {
        activeInput.value = (value * -1).toString();
        activeInput.dispatchEvent(new Event('input'));
    }
}

function padCalculate() {
    const activeInput = getActiveCalculatorInput();
    if (!activeInput) return;

    const value = parseFloat(activeInput.value) || 0;
    activeInput.value = value.toString();

    // Disparar el cálculo correspondiente
    if (currentTab === 'iva') calculateIVA();
    else if (currentTab === 'porcentaje') calculatePercentage();
    else if (currentTab === '4x1000') calculateGMF();
    else if (currentTab === 'otros') calculateOtherTax();
}

// ========== UTILIDADES ==========
function formatCurrency(value) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

function clearField(fieldId) {
    const field = document.getElementById(fieldId);
    field.value = '';
    lastActiveInput = field;
    field.dispatchEvent(new Event('input'));
}

function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        // Feedback visual
        const originalColor = element.style.color;
        element.style.color = 'var(--secondary)';
        setTimeout(() => {
            element.style.color = originalColor;
        }, 300);
    }).catch(err => {
        console.error('Error al copiar:', err);
    });
}

// ========== HISTORIAL ==========
function saveToHistory(name, rate, result) {
    const now = new Date();
    const entry = {
        id: Date.now(),
        name: name,
        rate: rate,
        result: result,
        time: now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
        date: now.toLocaleDateString('es-CO')
    };

    calculatorHistory.unshift(entry);
    if (calculatorHistory.length > 50) {
        calculatorHistory.pop(); // Limitar a 50 entradas
    }

    localStorage.setItem('calculatorHistory', JSON.stringify(calculatorHistory));
}

function showHistory() {
    const modal = document.getElementById('historyModal');
    const historyList = document.getElementById('historyList');

    if (calculatorHistory.length === 0) {
        historyList.innerHTML = '<p class="empty-message">No hay cálculos guardados</p>';
    } else {
        historyList.innerHTML = calculatorHistory.map(item => `
            <div class="history-item">
                <div class="history-item-title">${item.name} (${item.rate})</div>
                <div class="history-item-value">${formatCurrency(item.result)}</div>
                <div class="history-item-time">${item.date} - ${item.time}</div>
            </div>
        `).join('');
    }

    modal.classList.add('show');
}

function closeHistory() {
    document.getElementById('historyModal').classList.remove('show');
}

function clearHistory() {
    if (confirm('¿Estás seguro de que deseas borrar todo el historial?')) {
        calculatorHistory = [];
        localStorage.removeItem('calculatorHistory');
        closeHistory();
    }
}

// Cargar datos guardados
function loadFromLocalStorage() {
    // Expandible para cargar valores previos
}

// ========== KEYBOARD SUPPORT (DESKTOP) ==========
document.addEventListener('keydown', function(e) {
    // Solo para escritorio, no para móvil
    if (window.innerWidth > 768) {
        if (e.key >= '0' && e.key <= '9') {
            e.preventDefault();
            padAppendNumber(e.key);
        } else if (e.key === '.') {
            e.preventDefault();
            padAppendNumber('.');
        } else if (e.key === 'Backspace') {
            e.preventDefault();
            padDeleteLast();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            padCalculate();
        }
    }
});
