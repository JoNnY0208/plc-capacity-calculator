/**
 * PLC Capacity Calculator - Main Application Logic
 * Version 1.0.0
 */

// ============================================
// Application State & Constants
// ============================================

const APP_VERSION = '1.0';
const STORAGE_KEY = 'plc_calc_data';
const BYTES_PER_MB = 1048576;

// Default values for inputs
const DEFAULT_VALUES = {
  inputs: {
    inputEM: 6,
    inputUN: 1,
    alarmsPerEM: 19,
    alarmsPerUN: 60,
    inputAOI: 6,
    percentageError: 15,
    spareCapacity: 30
  },
  constants: {
    constFramework: 353123,
    constEM: 136801,
    constUN: 340889,
    constAlarmsEM: 1145,
    constAlarmsUN: 1145,
    constAOI: 6044
  },
  project: {
    projectName: '',
    projectNumber: '',
    projectNotes: ''
  }
};

// Chart colours for each category
const CHART_COLOURS = {
  framework: '#17a2b8',
  em: '#e67e22',
  un: '#27ae60',
  alarmsEM: '#3498db',
  alarmsUN: '#9b59b6',
  aoi: '#2ecc71',
  percentError: '#2c3e50',
  spare: '#a0522d'
};

// ============================================
// PWA Installation
// ============================================

let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallButton();
});

window.addEventListener('appinstalled', () => {
  hideInstallButton();
  showToast('App installed successfully!', 'success');
});

function showInstallButton() {
  const btn = document.getElementById('installBtn');
  if (btn) {
    btn.classList.remove('hidden');
  }
}

function hideInstallButton() {
  const btn = document.getElementById('installBtn');
  if (btn) {
    btn.classList.add('hidden');
  }
}

async function installApp() {
  if (!deferredPrompt) {
    showToast('App is already installed or cannot be installed', 'warning');
    return;
  }
  
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  
  if (outcome === 'accepted') {
    deferredPrompt = null;
  }
}

// ============================================
// Service Worker Registration
// ============================================

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      console.log('ServiceWorker registered:', registration.scope);
    } catch (error) {
      console.log('ServiceWorker registration failed:', error);
    }
  });
}

// ============================================
// DOM Elements Cache
// ============================================

const elements = {};

function cacheElements() {
  // Project fields
  elements.projectName = document.getElementById('projectName');
  elements.projectNumber = document.getElementById('projectNumber');
  elements.projectNotes = document.getElementById('projectNotes');
  
  // Input fields
  elements.inputEM = document.getElementById('inputEM');
  elements.inputUN = document.getElementById('inputUN');
  elements.alarmsPerEM = document.getElementById('alarmsPerEM');
  elements.totalAlarmsPerEM = document.getElementById('totalAlarmsPerEM');
  elements.alarmsPerUN = document.getElementById('alarmsPerUN');
  elements.inputAOI = document.getElementById('inputAOI');
  elements.percentageError = document.getElementById('percentageError');
  elements.spareCapacity = document.getElementById('spareCapacity');
  
  // Constant fields
  elements.constFramework = document.getElementById('constFramework');
  elements.constEM = document.getElementById('constEM');
  elements.constUN = document.getElementById('constUN');
  elements.constAlarmsEM = document.getElementById('constAlarmsEM');
  elements.constAlarmsUN = document.getElementById('constAlarmsUN');
  elements.constAOI = document.getElementById('constAOI');
  
  // Results display
  elements.resultTotal = document.getElementById('resultTotal');
  elements.resultBytes = document.getElementById('resultBytes');
  elements.resultFormula = document.getElementById('resultFormula');
  elements.resultsTableBody = document.getElementById('resultsTableBody');
  
  // Chart
  elements.chartCanvas = document.getElementById('capacityChart');
  
  // Buttons
  elements.installBtn = document.getElementById('installBtn');
  elements.exportBtn = document.getElementById('exportBtn');
  elements.importBtn = document.getElementById('importBtn');
  elements.importInput = document.getElementById('importInput');
  elements.pdfBtn = document.getElementById('pdfBtn');
  elements.resetBtn = document.getElementById('resetBtn');
  
  // Modal
  elements.modalOverlay = document.getElementById('modalOverlay');
  elements.modalTitle = document.getElementById('modalTitle');
  elements.modalMessage = document.getElementById('modalMessage');
  elements.modalConfirm = document.getElementById('modalConfirm');
  elements.modalCancel = document.getElementById('modalCancel');
}

// ============================================
// Calculation Engine
// ============================================

function getInputValues() {
  return {
    inputEM: parseFloat(elements.inputEM.value) || 0,
    inputUN: parseFloat(elements.inputUN.value) || 0,
    alarmsPerEM: parseFloat(elements.alarmsPerEM.value) || 0,
    alarmsPerUN: parseFloat(elements.alarmsPerUN.value) || 0,
    inputAOI: parseFloat(elements.inputAOI.value) || 0,
    percentageError: parseFloat(elements.percentageError.value) || 0,
    spareCapacity: parseFloat(elements.spareCapacity.value) || 0
  };
}

function getConstantValues() {
  return {
    constFramework: parseFloat(elements.constFramework.value) || 0,
    constEM: parseFloat(elements.constEM.value) || 0,
    constUN: parseFloat(elements.constUN.value) || 0,
    constAlarmsEM: parseFloat(elements.constAlarmsEM.value) || 0,
    constAlarmsUN: parseFloat(elements.constAlarmsUN.value) || 0,
    constAOI: parseFloat(elements.constAOI.value) || 0
  };
}

function getProjectValues() {
  return {
    projectName: elements.projectName.value.trim(),
    projectNumber: elements.projectNumber.value.trim(),
    projectNotes: elements.projectNotes.value.trim()
  };
}

function calculate() {
  const inputs = getInputValues();
  const constants = getConstantValues();
  
  // Calculate total alarms per EM
  const totalAlarmsPerEM = inputs.inputEM * inputs.alarmsPerEM;
  elements.totalAlarmsPerEM.value = totalAlarmsPerEM;
  
  // Step 1: Calculate base components
  const EM_calculated = constants.constEM * inputs.inputEM;
  const UN_calculated = constants.constUN * inputs.inputUN;
  const AlarmsEM_calculated = totalAlarmsPerEM * constants.constAlarmsEM;
  const AlarmsUN_calculated = inputs.alarmsPerUN * constants.constAlarmsUN;
  const AOI_calculated = inputs.inputAOI * constants.constAOI;
  
  // Step 2: Calculate subtotal before error and spare
  const subtotal1 = constants.constFramework + EM_calculated + UN_calculated + 
                    AlarmsEM_calculated + AlarmsUN_calculated + AOI_calculated;
  
  // Step 3: Calculate % Error allocation
  const percentError_calculated = subtotal1 * (inputs.percentageError / 100);
  
  // Step 4: Calculate subtotal including error
  const subtotal2 = subtotal1 + percentError_calculated;
  
  // Step 5: Calculate Spare Capacity allocation
  const spare_calculated = subtotal2 * (inputs.spareCapacity / 100);
  
  // Step 6: Calculate Total
  const total = subtotal2 + spare_calculated;
  
  // Step 7: Convert to Megabytes
  const totalMb = total / BYTES_PER_MB;
  
  return {
    breakdown: {
      framework: constants.constFramework,
      em: EM_calculated,
      un: UN_calculated,
      alarmsEM: AlarmsEM_calculated,
      alarmsUN: AlarmsUN_calculated,
      aoi: AOI_calculated,
      percentError: percentError_calculated,
      spare: spare_calculated
    },
    subtotal1,
    subtotal2,
    total: Math.round(total),
    totalMb
  };
}

// ============================================
// UI Update Functions
// ============================================

function formatNumber(num) {
  return Math.round(num).toLocaleString('en-GB');
}

function formatMb(num) {
  return num.toFixed(2);
}

function updateResults() {
  const results = calculate();
  
  // Update main total display
  elements.resultTotal.textContent = formatMb(results.totalMb);
  elements.resultBytes.textContent = `${formatNumber(results.total)} bytes`;
  elements.resultFormula.textContent = `${formatNumber(results.total)} ÷ 1,048,576 = ${formatMb(results.totalMb)} Mb`;
  
  // Update results table
  const { breakdown, total } = results;
  const categories = [
    { key: 'framework', label: 'Framework etc.' },
    { key: 'em', label: `EM (${getInputValues().inputEM} units)` },
    { key: 'un', label: `UN (${getInputValues().inputUN} unit${getInputValues().inputUN !== 1 ? 's' : ''})` },
    { key: 'alarmsEM', label: `Alarms EM (${elements.totalAlarmsPerEM.value})` },
    { key: 'alarmsUN', label: `Alarms UN (${getInputValues().alarmsPerUN})` },
    { key: 'aoi', label: `AOI (${getInputValues().inputAOI})` },
    { key: 'percentError', label: `Error Margin (${getInputValues().percentageError}%)` },
    { key: 'spare', label: `Spare Capacity (${getInputValues().spareCapacity}%)` }
  ];
  
  let tableHTML = '';
  categories.forEach(cat => {
    const value = breakdown[cat.key];
    const percentage = (value / total * 100).toFixed(1);
    tableHTML += `
      <tr>
        <td class="category">
          <span class="color-indicator" style="background: ${CHART_COLOURS[cat.key]}"></span>
          ${cat.label}
        </td>
        <td class="value">${formatNumber(value)}</td>
        <td class="percentage">${percentage}%</td>
      </tr>
    `;
  });
  
  tableHTML += `
    <tr class="total">
      <td class="category"><strong>TOTAL</strong></td>
      <td class="value"><strong>${formatNumber(total)}</strong></td>
      <td class="percentage"><strong>100%</strong></td>
    </tr>
  `;
  
  elements.resultsTableBody.innerHTML = tableHTML;
  
  // Update chart
  updateChart(results);
  
  // Save to localStorage
  saveToStorage();
}

// ============================================
// Chart Management
// ============================================

let capacityChart = null;

function initChart() {
  const ctx = elements.chartCanvas.getContext('2d');
  
  capacityChart = new Chart(ctx, {
    type: 'treemap',
    data: {
      datasets: [{
        tree: [],
        key: 'value',
        labels: {
          display: true,
          formatter: (ctx) => {
            if (ctx.raw && ctx.raw._data) {
              return ctx.raw._data.label;
            }
            return '';
          },
          color: '#fff',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        backgroundColor: (ctx) => {
          if (ctx.raw && ctx.raw._data) {
            return ctx.raw._data.color;
          }
          return '#666';
        },
        borderColor: '#1a1a2e',
        borderWidth: 2,
        spacing: 1,
        captions: {
          display: false
        }
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            title: (items) => {
              if (items[0] && items[0].raw && items[0].raw._data) {
                return items[0].raw._data.label;
              }
              return '';
            },
            label: (item) => {
              if (item.raw && item.raw._data) {
                const data = item.raw._data;
                return [
                  `Value: ${formatNumber(data.value)} bytes`,
                  `Percentage: ${data.percentage}%`
                ];
              }
              return '';
            }
          },
          backgroundColor: '#1f2940',
          titleColor: '#15C1AD',
          bodyColor: '#fff',
          borderColor: '#2d3748',
          borderWidth: 1,
          padding: 12
        }
      }
    }
  });
}

function updateChart(results) {
  if (!capacityChart) return;
  
  const { breakdown, total } = results;
  
  const treeData = [
    { label: 'Framework', value: breakdown.framework, color: CHART_COLOURS.framework, percentage: (breakdown.framework / total * 100).toFixed(1) },
    { label: 'EM', value: breakdown.em, color: CHART_COLOURS.em, percentage: (breakdown.em / total * 100).toFixed(1) },
    { label: 'UN', value: breakdown.un, color: CHART_COLOURS.un, percentage: (breakdown.un / total * 100).toFixed(1) },
    { label: 'Alarms EM', value: breakdown.alarmsEM, color: CHART_COLOURS.alarmsEM, percentage: (breakdown.alarmsEM / total * 100).toFixed(1) },
    { label: 'Alarms UN', value: breakdown.alarmsUN, color: CHART_COLOURS.alarmsUN, percentage: (breakdown.alarmsUN / total * 100).toFixed(1) },
    { label: 'AOI', value: breakdown.aoi, color: CHART_COLOURS.aoi, percentage: (breakdown.aoi / total * 100).toFixed(1) },
    { label: '% Error', value: breakdown.percentError, color: CHART_COLOURS.percentError, percentage: (breakdown.percentError / total * 100).toFixed(1) },
    { label: 'Spare', value: breakdown.spare, color: CHART_COLOURS.spare, percentage: (breakdown.spare / total * 100).toFixed(1) }
  ].filter(item => item.value > 0);
  
  capacityChart.data.datasets[0].tree = treeData;
  capacityChart.update();
}

// ============================================
// Local Storage
// ============================================

function saveToStorage() {
  const data = {
    inputs: getInputValues(),
    constants: getConstantValues(),
    project: getProjectValues()
  };
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

function loadFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      applyValues(data);
      return true;
    }
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
  }
  return false;
}

function applyValues(data) {
  // Apply project values
  if (data.project) {
    elements.projectName.value = data.project.projectName || '';
    elements.projectNumber.value = data.project.projectNumber || '';
    elements.projectNotes.value = data.project.projectNotes || '';
  }
  
  // Apply input values
  if (data.inputs) {
    elements.inputEM.value = data.inputs.inputEM ?? DEFAULT_VALUES.inputs.inputEM;
    elements.inputUN.value = data.inputs.inputUN ?? DEFAULT_VALUES.inputs.inputUN;
    elements.alarmsPerEM.value = data.inputs.alarmsPerEM ?? DEFAULT_VALUES.inputs.alarmsPerEM;
    elements.alarmsPerUN.value = data.inputs.alarmsPerUN ?? DEFAULT_VALUES.inputs.alarmsPerUN;
    elements.inputAOI.value = data.inputs.inputAOI ?? DEFAULT_VALUES.inputs.inputAOI;
    elements.percentageError.value = data.inputs.percentageError ?? DEFAULT_VALUES.inputs.percentageError;
    elements.spareCapacity.value = data.inputs.spareCapacity ?? DEFAULT_VALUES.inputs.spareCapacity;
  }
  
  // Apply constant values
  if (data.constants) {
    elements.constFramework.value = data.constants.constFramework ?? DEFAULT_VALUES.constants.constFramework;
    elements.constEM.value = data.constants.constEM ?? DEFAULT_VALUES.constants.constEM;
    elements.constUN.value = data.constants.constUN ?? DEFAULT_VALUES.constants.constUN;
    elements.constAlarmsEM.value = data.constants.constAlarmsEM ?? DEFAULT_VALUES.constants.constAlarmsEM;
    elements.constAlarmsUN.value = data.constants.constAlarmsUN ?? DEFAULT_VALUES.constants.constAlarmsUN;
    elements.constAOI.value = data.constants.constAOI ?? DEFAULT_VALUES.constants.constAOI;
  }
}

function resetToDefaults() {
  applyValues({
    inputs: DEFAULT_VALUES.inputs,
    constants: DEFAULT_VALUES.constants,
    project: DEFAULT_VALUES.project
  });
  updateResults();
  showToast('Reset to default values', 'success');
}

// ============================================
// Export / Import Functions
// ============================================

function exportData() {
  const inputs = getInputValues();
  const constants = getConstantValues();
  const project = getProjectValues();
  const results = calculate();
  
  const exportObj = {
    version: APP_VERSION,
    exportDate: new Date().toISOString(),
    project: {
      name: project.projectName,
      number: project.projectNumber,
      notes: project.projectNotes
    },
    inputs: {
      EM: inputs.inputEM,
      UN: inputs.inputUN,
      alarmsPerEM: inputs.alarmsPerEM,
      totalAlarmsPerEM: inputs.inputEM * inputs.alarmsPerEM,
      alarmsPerUN: inputs.alarmsPerUN,
      AOI: inputs.inputAOI,
      percentageError: inputs.percentageError,
      spareCapacity: inputs.spareCapacity
    },
    constants: {
      framework: constants.constFramework,
      EM: constants.constEM,
      UN: constants.constUN,
      alarmsEM: constants.constAlarmsEM,
      alarmsUN: constants.constAlarmsUN,
      AOI: constants.constAOI
    },
    results: {
      total: results.total,
      totalMb: parseFloat(results.totalMb.toFixed(2)),
      breakdown: {
        framework: Math.round(results.breakdown.framework),
        EM: Math.round(results.breakdown.em),
        UN: Math.round(results.breakdown.un),
        alarmsEM: Math.round(results.breakdown.alarmsEM),
        alarmsUN: Math.round(results.breakdown.alarmsUN),
        AOI: Math.round(results.breakdown.aoi),
        percentError: Math.round(results.breakdown.percentError),
        spare: Math.round(results.breakdown.spare)
      }
    }
  };
  
  const json = JSON.stringify(exportObj, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const date = new Date().toISOString().split('T')[0];
  const projectNum = project.projectNumber || 'UNTITLED';
  const filename = `PLC_Calc_${projectNum}_${date}.json`;
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast(`Exported: ${filename}`, 'success');
}

function triggerImport() {
  elements.importInput.click();
}

function handleImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      
      // Validate structure
      if (!data.version || !data.inputs || !data.constants) {
        throw new Error('Invalid file structure. Missing required fields.');
      }
      
      // Show confirmation
      showModal(
        'Import Data',
        'This will replace all current values with the imported data. Continue?',
        () => {
          importData(data);
          showToast('Data imported successfully', 'success');
        }
      );
    } catch (error) {
      showToast(`Import failed: ${error.message}`, 'error');
    }
  };
  
  reader.onerror = () => {
    showToast('Failed to read file', 'error');
  };
  
  reader.readAsText(file);
  event.target.value = '';
}

function importData(data) {
  // Map imported data to internal format
  const mappedData = {
    project: {
      projectName: data.project?.name || '',
      projectNumber: data.project?.number || '',
      projectNotes: data.project?.notes || ''
    },
    inputs: {
      inputEM: data.inputs.EM ?? DEFAULT_VALUES.inputs.inputEM,
      inputUN: data.inputs.UN ?? DEFAULT_VALUES.inputs.inputUN,
      alarmsPerEM: data.inputs.alarmsPerEM ?? DEFAULT_VALUES.inputs.alarmsPerEM,
      alarmsPerUN: data.inputs.alarmsPerUN ?? DEFAULT_VALUES.inputs.alarmsPerUN,
      inputAOI: data.inputs.AOI ?? DEFAULT_VALUES.inputs.inputAOI,
      percentageError: data.inputs.percentageError ?? DEFAULT_VALUES.inputs.percentageError,
      spareCapacity: data.inputs.spareCapacity ?? DEFAULT_VALUES.inputs.spareCapacity
    },
    constants: {
      constFramework: data.constants.framework ?? DEFAULT_VALUES.constants.constFramework,
      constEM: data.constants.EM ?? DEFAULT_VALUES.constants.constEM,
      constUN: data.constants.UN ?? DEFAULT_VALUES.constants.constUN,
      constAlarmsEM: data.constants.alarmsEM ?? DEFAULT_VALUES.constants.constAlarmsEM,
      constAlarmsUN: data.constants.alarmsUN ?? DEFAULT_VALUES.constants.constAlarmsUN,
      constAOI: data.constants.AOI ?? DEFAULT_VALUES.constants.constAOI
    }
  };
  
  applyValues(mappedData);
  updateResults();
}

// ============================================
// PDF Generation
// ============================================

async function generatePDF() {
  const project = getProjectValues();
  
  // Validate required fields
  if (!project.projectName || !project.projectNumber) {
    showToast('Please enter Project Name and Project Number to generate the report', 'warning');
    return;
  }
  
  showToast('Generating PDF report...', 'success');
  
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');
  
  const inputs = getInputValues();
  const constants = getConstantValues();
  const results = calculate();
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let y = margin;
  let pageNumber = 1;
  
  // Check if we need a new page
  const checkPageBreak = (requiredSpace) => {
    if (y + requiredSpace > pageHeight - 20) {
      addFooter();
      doc.addPage();
      pageNumber++;
      y = margin;
      return true;
    }
    return false;
  };
  
  // Add footer to current page
  const addFooter = () => {
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated: ${new Date().toLocaleString('en-GB')}  |  PLC Capacity Calculator v${APP_VERSION}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  };
  
  // Helper functions
  const addTitle = (text, size = 16) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(21, 193, 173);
    doc.text(text, pageWidth / 2, y, { align: 'center' });
    y += size * 0.5;
  };
  
  const addSectionHeader = (text) => {
    checkPageBreak(15);
    y += 5;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(21, 193, 173);
    doc.text(text, margin, y);
    y += 3;
    doc.setDrawColor(21, 193, 173);
    doc.line(margin, y, pageWidth - margin, y);
    y += 7;
  };
  
  const addText = (label, value, indent = 0) => {
    checkPageBreak(8);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(label, margin + indent, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text(String(value), margin + 55 + indent, y);
    y += 6;
  };
  
  const addBullet = (text, indent = 5) => {
    checkPageBreak(7);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text('•', margin + indent, y);
    doc.text(text, margin + indent + 5, y);
    y += 5;
  };
  
  // ===== HEADER =====
  addTitle('PLC MEMORY CAPACITY REQUIREMENTS', 16);
  y += 2;
  addTitle('REPORT', 12);
  y += 8;
  
  // ===== PROJECT INFORMATION =====
  addSectionHeader('PROJECT INFORMATION');
  addText('Project Name:', project.projectName);
  addText('Project Number:', project.projectNumber);
  addText('Generated:', new Date().toLocaleString('en-GB'));
  addText('Generated By:', 'PLC Capacity Calculator v' + APP_VERSION);
  
  // ===== MAIN RESULT BOX =====
  checkPageBreak(35);
  y += 3;
  doc.setFillColor(21, 193, 173);
  doc.roundedRect(margin, y, contentWidth, 28, 3, 3, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('MINIMUM REQUIRED PLC CAPACITY', pageWidth / 2, y + 9, { align: 'center' });
  
  doc.setFontSize(18);
  doc.text(`${formatMb(results.totalMb)} Mb`, pageWidth / 2, y + 20, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`(${formatNumber(results.total)} bytes)`, pageWidth / 2, y + 26, { align: 'center' });
  
  y += 35;
  
  // ===== CAPACITY BREAKDOWN TABLE =====
  addSectionHeader('CAPACITY BREAKDOWN');
  
  // Table header
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y - 2, contentWidth, 8, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text('Category', margin + 3, y + 3);
  doc.text('Value (bytes)', margin + 85, y + 3, { align: 'left' });
  doc.text('Percentage', margin + 130, y + 3, { align: 'left' });
  y += 10;
  
  // Table rows
  const categories = [
    { label: 'Framework etc.', value: results.breakdown.framework },
    { label: `EM (${inputs.inputEM} units)`, value: results.breakdown.em },
    { label: `UN (${inputs.inputUN} unit${inputs.inputUN !== 1 ? 's' : ''})`, value: results.breakdown.un },
    { label: `Alarms EM (${inputs.inputEM * inputs.alarmsPerEM})`, value: results.breakdown.alarmsEM },
    { label: `Alarms UN (${inputs.alarmsPerUN})`, value: results.breakdown.alarmsUN },
    { label: `AOI (${inputs.inputAOI})`, value: results.breakdown.aoi },
    { label: `Error Margin (${inputs.percentageError}%)`, value: results.breakdown.percentError },
    { label: `Spare Capacity (${inputs.spareCapacity}%)`, value: results.breakdown.spare }
  ];
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  categories.forEach((cat, i) => {
    checkPageBreak(8);
    if (i % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y - 4, contentWidth, 6, 'F');
    }
    doc.setTextColor(60, 60, 60);
    doc.text(cat.label, margin + 3, y);
    doc.text(formatNumber(cat.value), margin + 85, y, { align: 'left' });
    doc.text(`${(cat.value / results.total * 100).toFixed(1)}%`, margin + 130, y, { align: 'left' });
    y += 6;
  });
  
  // Total row
  doc.setFillColor(21, 193, 173);
  doc.rect(margin, y - 4, contentWidth, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL', margin + 3, y + 1);
  doc.text(formatNumber(results.total), margin + 85, y + 1, { align: 'left' });
  doc.text('100%', margin + 130, y + 1, { align: 'left' });
  y += 12;
  
  // ===== INPUT PARAMETERS USED =====
  addSectionHeader('INPUT PARAMETERS USED');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text('Equipment Configuration:', margin, y);
  y += 6;
  
  addBullet(`Number of EM: ${inputs.inputEM}`);
  addBullet(`Number of UN: ${inputs.inputUN}`);
  addBullet(`Alarms per EM: ${inputs.alarmsPerEM} (Total: ${inputs.inputEM * inputs.alarmsPerEM})`);
  addBullet(`Alarms per UN: ${inputs.alarmsPerUN}`);
  addBullet(`Number of AOI: ${inputs.inputAOI}`);
  
  y += 2;
  checkPageBreak(15);
  doc.setFont('helvetica', 'bold');
  doc.text('Safety Margins:', margin, y);
  y += 6;
  
  addBullet(`Percentage Error: ${inputs.percentageError}%`);
  addBullet(`Spare Capacity for Expansion: ${inputs.spareCapacity}%`);
  
  // ===== CONSTANTS USED =====
  addSectionHeader('CONSTANTS USED (Memory per Unit)');
  
  addBullet(`Framework: ${formatNumber(constants.constFramework)} bytes`);
  addBullet(`Per EM: ${formatNumber(constants.constEM)} bytes`);
  addBullet(`Per UN: ${formatNumber(constants.constUN)} bytes`);
  addBullet(`Per EM Alarm: ${formatNumber(constants.constAlarmsEM)} bytes`);
  addBullet(`Per UN Alarm: ${formatNumber(constants.constAlarmsUN)} bytes`);
  addBullet(`Per AOI: ${formatNumber(constants.constAOI)} bytes`);
  
  // ===== NOTES (if provided) =====
  if (project.projectNotes) {
    addSectionHeader('NOTES / COMMENTS');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    
    const splitNotes = doc.splitTextToSize(project.projectNotes, contentWidth);
    splitNotes.forEach(line => {
      checkPageBreak(6);
      doc.text(line, margin, y);
      y += 4;
    });
    y += 2;
  }
  
  // ===== RECOMMENDATION =====
  addSectionHeader('RECOMMENDATION');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  
  const nextStandardSize = getNextStandardSize(results.totalMb);
  const recommendation = `Based on the calculated requirements, please procure a PLC with a minimum memory capacity of ${formatMb(results.totalMb)} Mb. Consider selecting a PLC with at least ${nextStandardSize} Mb to accommodate the calculated requirements.`;
  
  const splitRec = doc.splitTextToSize(recommendation, contentWidth);
  splitRec.forEach(line => {
    checkPageBreak(6);
    doc.text(line, margin, y);
    y += 5;
  });
  
  // ===== FOOTER on last page =====
  addFooter();
  
  // Save
  const date = new Date().toISOString().split('T')[0];
  const filename = `PLC_Capacity_Report_${project.projectNumber}_${date}.pdf`;
  doc.save(filename);
  
  showToast(`PDF saved: ${filename}`, 'success');
}

function getNextStandardSize(mb) {
  const standardSizes = [1, 2, 4, 8, 16, 32, 64, 128];
  for (const size of standardSizes) {
    if (size >= mb) return size;
  }
  return Math.ceil(mb);
}

// ============================================
// Modal Functions
// ============================================

let modalCallback = null;

function showModal(title, message, onConfirm) {
  elements.modalTitle.textContent = title;
  elements.modalMessage.textContent = message;
  modalCallback = onConfirm;
  elements.modalOverlay.classList.add('active');
}

function hideModal() {
  elements.modalOverlay.classList.remove('active');
  modalCallback = null;
}

function confirmModal() {
  if (modalCallback) {
    modalCallback();
  }
  hideModal();
}

// ============================================
// Toast Notifications
// ============================================

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠'
  };
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type]}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 5000);
}

// ============================================
// Event Listeners Setup
// ============================================

function setupEventListeners() {
  // Input listeners for real-time calculation
  const inputFields = [
    'inputEM', 'inputUN', 'alarmsPerEM', 'alarmsPerUN', 'inputAOI',
    'percentageError', 'spareCapacity',
    'constFramework', 'constEM', 'constUN', 'constAlarmsEM', 'constAlarmsUN', 'constAOI'
  ];
  
  inputFields.forEach(id => {
    const el = elements[id];
    if (el) {
      el.addEventListener('input', updateResults);
    }
  });
  
  // Project fields save on change
  ['projectName', 'projectNumber', 'projectNotes'].forEach(id => {
    elements[id]?.addEventListener('input', saveToStorage);
  });
  
  // Button listeners
  elements.installBtn?.addEventListener('click', installApp);
  elements.exportBtn?.addEventListener('click', exportData);
  elements.importBtn?.addEventListener('click', triggerImport);
  elements.importInput?.addEventListener('change', handleImport);
  elements.pdfBtn?.addEventListener('click', generatePDF);
  elements.resetBtn?.addEventListener('click', () => {
    showModal(
      'Reset to Defaults',
      'This will reset all values to their defaults. Continue?',
      resetToDefaults
    );
  });
  
  // Modal listeners
  elements.modalConfirm?.addEventListener('click', confirmModal);
  elements.modalCancel?.addEventListener('click', hideModal);
  elements.modalOverlay?.addEventListener('click', (e) => {
    if (e.target === elements.modalOverlay) {
      hideModal();
    }
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideModal();
    }
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 's') {
        e.preventDefault();
        exportData();
      }
      if (e.key === 'o') {
        e.preventDefault();
        triggerImport();
      }
      if (e.key === 'p') {
        e.preventDefault();
        generatePDF();
      }
    }
  });
}

// ============================================
// Initialisation
// ============================================

function init() {
  cacheElements();
  setupEventListeners();
  
  // Load saved data or use defaults
  if (!loadFromStorage()) {
    applyValues({
      inputs: DEFAULT_VALUES.inputs,
      constants: DEFAULT_VALUES.constants,
      project: DEFAULT_VALUES.project
    });
  }
  
  // Initialise chart
  initChart();
  
  // Initial calculation
  updateResults();
  
  console.log('PLC Capacity Calculator v' + APP_VERSION + ' initialised');
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
