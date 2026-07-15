// Roark's Stress & Strain Calculator Engine

// Global State
const state = {
  activeModule: 'flat_plates',
  flatPlates: {
    activeGeometry: 'circular', // 'circular', 'rectangular', 'odd_shapes'
    activeChart: 'deflection',  // 'deflection', 'moment', 'shear'
    v: 0.3,
    // Circular
    circular: {
      edge: 'simply_supported', // 'simply_supported', 'clamped', 'guided'
      a: 10.0,
      b: 5.0,
      r: 6.0,
      ro: 7.0,
      t: 0.25,
      q: 5.0,
      E: 29000000
    },
    // Rectangular
    rectangular: {
      edge: 'simply_supported', // 'simply_supported', 'clamped'
      a: 15.0,
      b: 10.0,
      t: 0.25,
      q: 5.0,
      E: 29000000
    },
    // Odd Shapes
    oddShapes: {
      shape: 'elliptical', // 'elliptical', 'triangular', 'sector'
      edge: 'simply_supported', // 'simply_supported', 'clamped'
      a: 10.0,
      b: 6.0,
      angle: 90, // degrees
      t: 0.25,
      q: 5.0,
      E: 29000000
    }
  },
  // Beams
  beams: {
    activeChart: 'deflection',
    edge: 'simply_supported',
    L: 120,
    P: 1000,
    loadPos: 60,
    E: 29000000,
    I: 15.5,
    y: 2.0
  },
  // Contact Stresses
  contact: {
    activeChart: 'pressure',
    type: 'sphere_sphere',
    R1: 25.0,
    R2: 40.0,
    F: 500,
    E1: 200000,
    v1: 0.3,
    E2: 200000,
    v2: 0.3,
    L: 30.0
  },
  // Torsion
  torsion: {
    activeChart: 'stress',
    type: 'solid_circle',
    T: 5000,
    G: 11200000,
    len: 24,
    d: 2.0,
    di: 1.2,
    b: 3.0,
    h: 2.0,
    tw: 0.125
  },
  // Columns
  columns: {
    activeChart: 'euler',
    material: 'steel',
    E: 200000,   // MPa
    sy: 250,     // MPa yield
    end: 'pin_pin',
    K: 1.0,
    section: 'solid_circle',
    L: 3000,     // mm
    d: 50, di: 40,
    b: 60, h: 80,
    tf: 8, tw: 5,
    P: 50000,    // N
    e: 0
  },
  // Pressure Vessels & Pipes
  pressure_vessels: {
    activeChart: 'wall',
    type: 'cylinder',   // 'cylinder', 'sphere', 'pipe', 'waterhammer'
    material: 'steel',
    E: 200000,   // MPa
    nu: 0.3,     // Poisson's ratio
    sy: 250,     // MPa
    ri: 100,     // mm inner radius
    t: 8,        // mm wall thickness
    pi: 10,      // MPa internal pressure
    po: 0,       // MPa external pressure
    L: 3000,     // mm pipe length
    F: 5000,     // N bending load
    v: 3,        // m/s flow velocity
    rho: 1000,   // kg/m³ fluid density
    Kf: 2100     // MPa bulk modulus of fluid
  },
  // Stress Concentration
  concentration: {
    activeGeometry: 'hole', // 'hole', 'fillet', 'notch'
    loading: 'axial', // 'axial', 'bending', 'torsion'
    q: 0.8,
    D: 10, d: 2, t: 0.5, r: 0.5, P: 5000, M: 1000, T: 5000
  },
  // Buckling
  buckling: {
    activeGeometry: 'rect_plate', // 'rect_plate', 'circ_plate', 'thin_shell'
    edgeCondition: 'ss', // 'ss', 'clamped'
    shellType: 'cylinder_axial', // 'cylinder_axial', 'cylinder_radial', 'sphere'
    a: 20, b: 10, t: 0.25, R: 10,
    E: 29000000, v: 0.3
  },
  // Dynamic Loads
  dynamic: {
    activeTab: 'impact',
    impact: { W: 100, h: 5, k: 1000 },
    frequency: { type: 'spring', W: 100, L: 100, E: 29000000, I: 50, k: 1000 }
  },
  // Shells
  shells: {
    activeType: 'spherical',
    p: 100, r: 50, t: 0.5, alpha: 30
  },
  // Curved Beams
  curved_beams: {
    section: 'rectangular',
    rbar: 10, b: 2, h: 4, d: 4, M: 10000, P: 500
  },
  unitSystem: 'imperial',
  chart: null
};

// Document Loaded Handler
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initFormListeners();
  initTabListeners();
  initGeometryTabs();
  initChartSelectors();
  initUnits();
  initConcentration();
  initBuckling();
  initDynamic();
  initShells();
  initCurvedBeams();
  initExportUI();
  
  // Initial run
  runCalculations();
});

// ----------------------------------------------------
// UTILITIES & SECURITY HARDENING
// ----------------------------------------------------
function sanitizeNumeric(val, min = -Infinity, max = Infinity, fallback = null) {
  const parsed = parseFloat(val);
  if (isNaN(parsed) || typeof parsed !== 'number') return fallback;
  if (parsed < min || parsed > max) return fallback;
  return parsed;
}

// Global listener to visually flag invalid inputs and prevent NaN cascading
document.addEventListener('input', (e) => {
  if (e.target && e.target.classList && e.target.classList.contains('form-input') && e.target.type === 'number') {
    const val = sanitizeNumeric(e.target.value, 0, Infinity, null);
    if (val === null) {
      e.target.style.borderColor = 'var(--danger)';
      e.target.style.boxShadow = '0 0 0 2px rgba(239, 68, 68, 0.2)';
    } else {
      e.target.style.borderColor = '';
      e.target.style.boxShadow = '';
    }
  }
});

// ----------------------------------------------------
// EXPORT FUNCTIONALITIES
// ----------------------------------------------------
function initExportUI() {
  const container = document.createElement('div');
  container.id = 'export-actions';
  container.style.position = 'fixed';
  container.style.top = '1.5rem';
  container.style.right = '2rem';
  container.style.zIndex = '1000';
  container.style.display = 'flex';
  container.style.gap = '0.5rem';

  const btnCSV = document.createElement('button');
  btnCSV.className = 'tab-btn';
  btnCSV.style.padding = '0.4rem 0.8rem';
  btnCSV.style.fontSize = '0.8rem';
  btnCSV.textContent = 'Export CSV';
  btnCSV.onclick = exportToCSV;

  const btnPDF = document.createElement('button');
  btnPDF.className = 'tab-btn active';
  btnPDF.style.padding = '0.4rem 0.8rem';
  btnPDF.style.fontSize = '0.8rem';
  btnPDF.textContent = 'Export PDF';
  btnPDF.onclick = exportToPDF;

  container.appendChild(btnCSV);
  container.appendChild(btnPDF);
  document.body.appendChild(container);
}

function exportToCSV() {
  const currentModule = state.activeModule;
  if (!currentModule || currentModule === 'formulas') return;
  
  const moduleState = state[currentModule];
  if (!moduleState) return;

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += `Module,${currentModule}\n\n`;
  
  function flattenObj(obj, prefix = '') {
    for (let key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        flattenObj(obj[key], prefix + key + '_');
      } else {
        csvContent += `${prefix}${key},${obj[key]}\n`;
      }
    }
  }
  
  csvContent += "Parameter,Value\n";
  flattenObj(moduleState);

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Roarks_Export_${currentModule}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function exportToPDF() {
  const currentModule = state.activeModule;
  if (!currentModule || currentModule === 'formulas') return;

  const activeView = document.querySelector('.module-view.active');
  if (!activeView) return;

  // Temporarily hide export actions so they aren't captured
  const exportActions = document.getElementById('export-actions');
  if (exportActions) exportActions.style.display = 'none';

  // Render canvas
  const canvas = await html2canvas(activeView, { scale: 2, useCORS: true });
  const imgData = canvas.toDataURL('image/jpeg', 1.0);

  // Restore export actions
  if (exportActions) exportActions.style.display = 'flex';

  // Create A4 PDF (210 x 297 mm)
  const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  
  // Calculate aspect ratio to fit the entire image on ONE A4 page perfectly
  const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
  
  const finalWidth = imgWidth * ratio;
  const finalHeight = imgHeight * ratio;
  
  // Center it horizontally and vertically
  const x = (pdfWidth - finalWidth) / 2;
  const y = (pdfHeight - finalHeight) / 2;

  pdf.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight);
  pdf.save(`Roarks_Export_${currentModule}.pdf`);
}

// Sidebar Navigation
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    const btn = item.querySelector('button');
    if (btn && !item.classList.contains('disabled')) {
      btn.addEventListener('click', () => {
        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        const moduleName = item.dataset.module;
        switchModule(moduleName);
      });
    }
  });
}

function switchModule(moduleName) {
  state.activeModule = moduleName;
  
  document.querySelectorAll('.module-view').forEach(view => {
    view.classList.remove('active');
  });
  
  const activeView = document.getElementById(`view-${moduleName}`);
  if (activeView) {
    activeView.classList.add('active');
  }
  
  if (moduleName === 'formulas' && window.renderMathInElement) {
    renderMathInElement(document.getElementById('view-formulas'), {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false}
      ]
    });
  }
  
  runCalculations();
}

// Flat Plates Geometry Sub-Tabs
function initGeometryTabs() {
  const geomTabs = document.querySelectorAll('#plate-geometry-tabs .tab-btn');
  geomTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      geomTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const geomType = tab.dataset.geometry;
      state.flatPlates.activeGeometry = geomType;
      
      // Update displayed input groups
      document.querySelectorAll('.geometry-inputs-group').forEach(group => {
        group.style.display = 'none';
      });
      document.getElementById(`inputs-${geomType}`).style.display = 'block';
      
      // Update displayed results groups
      const circularMetrics = document.querySelector('.circular-metric-group');
      const nonCircularMetrics = document.querySelector('.non-circular-metric-group');
      const circularTables = document.getElementById('circular-tables-card');
      const nonCircularDetails = document.getElementById('non-circular-details-card');
      
      if (geomType === 'circular') {
        circularMetrics.style.display = 'contents';
        nonCircularMetrics.style.display = 'none';
        circularTables.style.display = 'block';
        nonCircularDetails.style.display = 'none';
      } else {
        circularMetrics.style.display = 'none';
        nonCircularMetrics.style.display = 'contents';
        circularTables.style.display = 'none';
        nonCircularDetails.style.display = 'block';
      }

      if (geomType === 'odd_shapes') {
        handleOddShapeInputsToggle();
      }

      runCalculations();
    });
  });

  // Watch shape selector for odd shapes
  const oddShapeSelect = document.getElementById('odd-shape-select');
  if (oddShapeSelect) {
    oddShapeSelect.addEventListener('change', (e) => {
      state.flatPlates.oddShapes.shape = e.target.value;
      handleOddShapeInputsToggle();
      runCalculations();
    });
  }

  // Watch edge dropdowns
  document.getElementById('plate-edge-circular').addEventListener('change', (e) => {
    state.flatPlates.circular.edge = e.target.value;
    runCalculations();
  });
  document.getElementById('plate-edge-rectangular').addEventListener('change', (e) => {
    state.flatPlates.rectangular.edge = e.target.value;
    runCalculations();
  });
  document.getElementById('plate-edge-odd').addEventListener('change', (e) => {
    state.flatPlates.oddShapes.edge = e.target.value;
    runCalculations();
  });
}

function handleOddShapeInputsToggle() {
  const shape = state.flatPlates.oddShapes.shape;
  const groupA = document.getElementById('group-odd-a');
  const groupB = document.getElementById('group-odd-b');
  const groupAngle = document.getElementById('group-odd-angle');
  
  const labelA = document.getElementById('label-odd-a');
  const labelB = document.getElementById('label-odd-b');

  if (shape === 'elliptical') {
    groupA.style.display = 'block';
    groupB.style.display = 'block';
    groupAngle.style.display = 'none';
    labelA.textContent = 'Semi-Major Axis (a)';
    labelB.textContent = 'Semi-Minor Axis (b)';
  } else if (shape === 'triangular') {
    groupA.style.display = 'block';
    groupB.style.display = 'none';
    groupAngle.style.display = 'none';
    labelA.textContent = 'Side Length (a)';
  } else if (shape === 'sector') {
    groupA.style.display = 'block';
    groupB.style.display = 'none';
    groupAngle.style.display = 'block';
    labelA.textContent = 'Radius (a)';
  }
}

// Chart selectors (SFD/BMD/Deflection)
function initChartSelectors() {
  // Plates selector
  const plateBtns = document.querySelectorAll('#plates-chart-selector .tab-btn');
  plateBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      plateBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.flatPlates.activeChart = btn.dataset.chart;
      runCalculations();
    });
  });

  // Beams selector
  const beamBtns = document.querySelectorAll('#beams-chart-selector .tab-btn');
  beamBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      beamBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.beams.activeChart = btn.dataset.chart;
      runCalculations();
    });
  });

  // Contact selector
  const contactBtns = document.querySelectorAll('#contact-chart-selector .tab-btn');
  contactBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      contactBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.contact.activeChart = btn.dataset.chart;
      runCalculations();
    });
  });

  // Torsion selector
  const torsionBtns = document.querySelectorAll('#torsion-chart-selector .tab-btn');
  torsionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      torsionBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.torsion.activeChart = btn.dataset.chart;
      runCalculations();
    });
  });

  // Contact type dropdown
  const contactTypeSelect = document.getElementById('contact-type');
  if (contactTypeSelect) {
    contactTypeSelect.addEventListener('change', (e) => {
      state.contact.type = e.target.value;
      const isCylinder = e.target.value.startsWith('cylinder');
      const hasSecondBody = !e.target.value.includes('plane');
      document.getElementById('c-R2-group').style.display = hasSecondBody ? 'block' : 'none';
      document.getElementById('c-L-group').style.display = isCylinder ? 'block' : 'none';
      runCalculations();
    });
  }

  // Torsion type dropdown
  const torsionTypeSelect = document.getElementById('torsion-type');
  if (torsionTypeSelect) {
    torsionTypeSelect.addEventListener('change', (e) => {
      state.torsion.type = e.target.value;
      updateTorsionInputVisibility(e.target.value);
      runCalculations();
    });
  }

  // Contact inputs
  ['c-R1','c-R2','c-F','c-E1','c-v1','c-E2','c-v2','c-L'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', (e) => {
      const key = id.replace('c-', '');
      state.contact[key] = parseFloat(e.target.value) || 0;
      runCalculations();
    });
  });

  // Torsion inputs
  ['t-T','t-G','t-len','t-d','t-di','t-b','t-h','t-tw'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', (e) => {
      const key = id.replace('t-', '');
      state.torsion[key] = parseFloat(e.target.value) || 0;
      runCalculations();
    });
  });

  // Columns chart selector
  const colBtns = document.querySelectorAll('#columns-chart-selector .tab-btn');
  colBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      colBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.columns.activeChart = btn.dataset.chart;
      runCalculations();
    });
  });

  // Columns material dropdown
  const colMat = document.getElementById('col-material');
  if (colMat) {
    colMat.addEventListener('change', (e) => {
      state.columns.material = e.target.value;
      const isCustom = e.target.value === 'custom';
      document.getElementById('col-custom-E-group').style.display = isCustom ? 'block' : 'none';
      document.getElementById('col-custom-sy-group').style.display = isCustom ? 'block' : 'none';
      // Set material presets
      const presets = {
        steel:         { E: 200000, sy: 250 },
        steel_hs:      { E: 200000, sy: 690 },
        aluminium:     { E: 69000,  sy: 276 },
        aluminium_2024:{ E: 73000,  sy: 345 }
      };
      if (presets[e.target.value]) {
        state.columns.E = presets[e.target.value].E;
        state.columns.sy = presets[e.target.value].sy;
      }
      runCalculations();
    });
  }

  // Columns end condition
  const colEnd = document.getElementById('col-end');
  if (colEnd) {
    colEnd.addEventListener('change', (e) => {
      const Kmap = { pin_pin: 1.0, fixed_free: 2.0, fixed_pin: 0.7, fixed_fixed: 0.5 };
      state.columns.end = e.target.value;
      state.columns.K = Kmap[e.target.value];
      runCalculations();
    });
  }

  // Columns section type
  const colSection = document.getElementById('col-section');
  if (colSection) {
    colSection.addEventListener('change', (e) => {
      state.columns.section = e.target.value;
      updateColumnSectionVisibility(e.target.value);
      runCalculations();
    });
  }

  // Columns numeric inputs
  ['col-L','col-d','col-di','col-b','col-h','col-tf','col-tw','col-P','col-e','col-E','col-sy'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', (e) => {
      const key = id.replace('col-', '').replace('-', '_');
      state.columns[key] = parseFloat(e.target.value) || 0;
      runCalculations();
    });
  });

  // ---- Pressure Vessels selectors & listeners ----
  // Top type selector (Cylinder / Sphere / Pipe / Water Hammer)
  const pvTypeBtns = document.querySelectorAll('#pv-type-selector .tab-btn');
  pvTypeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      pvTypeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.pressure_vessels.type = btn.dataset.pv;
      updatePVInputVisibility(btn.dataset.pv);
      runCalculations();
    });
  });

  // Chart tab selector
  const pvChartBtns = document.querySelectorAll('#pv-chart-selector .tab-btn');
  pvChartBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      pvChartBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.pressure_vessels.activeChart = btn.dataset.chart;
      runCalculations();
    });
  });

  // Material dropdown
  const pvMat = document.getElementById('pv-material');
  if (pvMat) {
    pvMat.addEventListener('change', (e) => {
      state.pressure_vessels.material = e.target.value;
      const isCustom = e.target.value === 'custom';
      document.getElementById('pv-custom-E-group').style.display = isCustom ? 'block' : 'none';
      document.getElementById('pv-custom-sy-group').style.display = isCustom ? 'block' : 'none';
      const presets = {
        steel:      { E: 200000, sy: 250, nu: 0.3 },
        steel_ss:   { E: 193000, sy: 290, nu: 0.3 },
        aluminium:  { E: 69000,  sy: 276, nu: 0.33 }
      };
      if (presets[e.target.value]) {
        Object.assign(state.pressure_vessels, presets[e.target.value]);
      }
      runCalculations();
    });
  }

  // Numeric inputs
  ['pv-ri','pv-t','pv-pi','pv-po','pv-L','pv-F','pv-v','pv-rho','pv-Kf','pv-E','pv-sy'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', (e) => {
      const key = id.replace('pv-', '');
      state.pressure_vessels[key] = parseFloat(e.target.value) || 0;
      runCalculations();
    });
  });
}

// Inner tab bar listener
function initTabListeners() {
  const tabContainers = document.querySelectorAll('.tab-container');
  tabContainers.forEach(container => {
    if (container.querySelector('#plate-geometry-tabs')) return;
    if (container.querySelector('#plates-chart-selector')) return;
    if (container.querySelector('#beams-chart-selector')) return;

    const tabs = container.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const targetPanel = tab.dataset.target;
        const panelContainer = tab.closest('.glass-card');
        panelContainer.querySelectorAll('.tab-panel').forEach(panel => {
          panel.classList.remove('active');
        });
        
        const targetElement = document.getElementById(targetPanel);
        if (targetElement) targetElement.classList.add('active');
      });
    });
  });
}

// Input values state synchronizer
function initFormListeners() {
  const inputs = document.querySelectorAll('.form-input');
  inputs.forEach(input => {
    input.addEventListener('input', (e) => {
      const id = e.target.id;
      const val = parseFloat(e.target.value);
      if (isNaN(val)) return;

      if (id === 'v') {
        state.flatPlates.v = val;
      }
      else if (id.startsWith('circ-')) {
        const key = id.replace('circ-', '');
        state.flatPlates.circular[key] = val;
      }
      else if (id in state.flatPlates.circular) {
        state.flatPlates.circular[id] = val;
      }
      else if (id.startsWith('rect-')) {
        const key = id.replace('rect-', '');
        state.flatPlates.rectangular[key] = val;
      }
      else if (id.startsWith('odd-')) {
        const key = id.replace('odd-', '');
        state.flatPlates.oddShapes[key] = val;
      }
      else if (id === 'beam-load-pos') {
        state.beams.loadPos = val;
      }
      else if (id in state.beams) {
        state.beams[id] = val;
      }

      runCalculations();
    });
  });

  // Beam edge support dropdown
  const beamEdgeSelect = document.getElementById('beam-edge');
  if (beamEdgeSelect) {
    beamEdgeSelect.addEventListener('change', (e) => {
      state.beams.edge = e.target.value;
      // Show load-pos only for simply_supported and fixed_pinned (variable load position)
      const posGroup = document.getElementById('beam-load-pos-group');
      if (posGroup) {
        posGroup.style.display = ['cantilever', 'fixed_fixed'].includes(e.target.value) ? 'none' : 'block';
      }
      runCalculations();
    });
  }
}

// Master Calculations Selector
let calculationTimeout;
function runCalculations() {
  clearTimeout(calculationTimeout);
  calculationTimeout = setTimeout(() => {
    executeCalculations();
  }, 150);
}

function executeCalculations() {
  if (state.activeModule === 'flat_plates') {
    const geom = state.flatPlates.activeGeometry;
    if (geom === 'circular') calculateCircularPlates();
    else if (geom === 'rectangular') calculateRectangularPlates();
    else if (geom === 'odd_shapes') calculateOddPlates();
  } else if (state.activeModule === 'beams') {
    calculateBeams();
  } else if (state.activeModule === 'contact') {
    calculateContact();
  } else if (state.activeModule === 'torsion') {
    calculateTorsion();
  } else if (state.activeModule === 'columns') {
    calculateColumns();
  } else if (state.activeModule === 'pressure_vessels') {
    calculatePressureVessels();
  } else if (state.activeModule === 'concentration') {
    calculateConcentration();
  } else if (state.activeModule === 'buckling') {
    calculateBuckling();
  } else if (state.activeModule === 'dynamic') {
    calculateDynamic();
  } else if (state.activeModule === 'shells') {
    calculateShells();
  } else if (state.activeModule === 'curved_beams') {
    calculateCurvedBeams();
  }
}

// ----------------------------------------------------
// VECTOR RENDERING HELPERS FOR SUPPORT SYMBOLS
// ----------------------------------------------------
function drawDownwardArrow(ctx, x, y0, y1, label) {
  ctx.beginPath();
  ctx.strokeStyle = '#ef4444';
  ctx.fillStyle = '#ef4444';
  ctx.lineWidth = 2;
  ctx.moveTo(x, y0);
  ctx.lineTo(x, y1);
  ctx.stroke();

  // Arrowhead
  ctx.beginPath();
  ctx.moveTo(x - 4, y1 - 5);
  ctx.lineTo(x + 4, y1 - 5);
  ctx.lineTo(x, y1);
  ctx.closePath();
  ctx.fill();

  if (label) {
    ctx.fillStyle = '#fecaca';
    ctx.font = 'bold 10px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y0 - 3);
  }
}

function drawPinSupport(ctx, x, y) {
  ctx.beginPath();
  ctx.strokeStyle = '#f59e0b';
  ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
  ctx.lineWidth = 1.8;
  ctx.moveTo(x, y);
  ctx.lineTo(x - 8, y + 12);
  ctx.lineTo(x + 8, y + 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // ground line
  ctx.beginPath();
  ctx.moveTo(x - 12, y + 12);
  ctx.lineTo(x + 12, y + 12);
  ctx.stroke();
}

function drawRollerSupport(ctx, x, y) {
  ctx.beginPath();
  ctx.strokeStyle = '#f59e0b';
  ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
  ctx.lineWidth = 1.8;
  ctx.moveTo(x, y);
  ctx.lineTo(x - 8, y + 10);
  ctx.lineTo(x + 8, y + 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Wheels
  ctx.beginPath();
  ctx.arc(x - 4, y + 13, 2, 0, 2 * Math.PI);
  ctx.arc(x + 4, y + 13, 2, 0, 2 * Math.PI);
  ctx.fillStyle = '#f59e0b';
  ctx.fill();

  // ground line
  ctx.beginPath();
  ctx.moveTo(x - 12, y + 15);
  ctx.lineTo(x + 12, y + 15);
  ctx.stroke();
}

function drawPlateSupport(ctx, x, y, type, isLeft) {
  ctx.beginPath();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2.2;
  
  if (type === 'clamped') {
    // Vertical boundary line
    ctx.moveTo(x, y - 12);
    ctx.lineTo(x, y + 12);
    ctx.stroke();
    
    // Hatch lines
    ctx.beginPath();
    ctx.lineWidth = 1.2;
    const offset = isLeft ? -5 : 5;
    for (let k = -10; k <= 10; k += 5) {
      ctx.moveTo(x, y + k);
      ctx.lineTo(x + offset, y + k - 3);
    }
    ctx.stroke();
  } else if (type === 'simply_supported') {
    drawPinSupport(ctx, x, y);
  } else { // guided
    ctx.moveTo(x, y - 12);
    ctx.lineTo(x, y + 12);
    ctx.stroke();
    
    // Rollers along the guide wall
    ctx.beginPath();
    ctx.fillStyle = '#f59e0b';
    const offset = isLeft ? -3 : 3;
    ctx.arc(x + offset, y - 6, 1.5, 0, 2 * Math.PI);
    ctx.arc(x + offset, y, 1.5, 0, 2 * Math.PI);
    ctx.arc(x + offset, y + 6, 1.5, 0, 2 * Math.PI);
    ctx.fill();
  }
}

// ----------------------------------------------------
// CIRCULAR PLATES
// ----------------------------------------------------
function calculateCircularPlates() {
  const v = state.flatPlates.v;
  const { a, b, r, ro, t, q, E, edge } = state.flatPlates.circular;

  const errorContainer = document.getElementById('flat-plates-errors') || createErrorBanner('view-flat_plates');
  if (b >= a || r < b || r > a || ro < b || ro > a) {
    errorContainer.innerHTML = "Boundary Error: Ensure inner radius (b) &lt; outer radius (a), and radius inputs (r, ro) are between b and a.";
    errorContainer.style.display = 'block';
    return;
  }
  errorContainer.style.display = 'none';

  // F functions (r > b)
  const F1 = ((1 + v) / 2) * (b / r) * Math.log(r / b) + ((1 - v) / 4) * (r / b - b / r);
  const F2 = 0.25 * (1 - Math.pow(b / r, 2) * (1 + 2 * Math.log(r / b)));
  const F3 = (b / (4 * r)) * ((Math.pow(b / r, 2) + 1) * Math.log(r / b) + Math.pow(b / r, 2) - 1);
  const F4 = 0.5 * ((1 + v) * (b / r) + (1 - v) * (r / b));
  const F5 = 0.5 * (1 - Math.pow(b / r, 2));
  const F6 = (b / (4 * r)) * (Math.pow(b / r, 2) - 1 + 2 * Math.log(r / b));
  const F7 = 0.5 * (1 - Math.pow(v, 2)) * (r / b - b / r);
  const F8 = 0.5 * (1 + v + (1 - v) * Math.pow(b / r, 2));
  const F9 = (b / r) * (((1 + v) / 2) * Math.log(r / b) + ((1 - v) / 4) * (1 - Math.pow(b / r, 2)));

  // C functions (a > b)
  const C1 = ((1 + v) / 2) * (b / a) * Math.log(a / b) + ((1 - v) / 4) * (a / b - b / a);
  const C2 = 0.25 * (1 - Math.pow(b / a, 2) * (1 + 2 * Math.log(a / b)));
  const C3 = (b / (4 * a)) * ((Math.pow(b / a, 2) + 1) * Math.log(a / b) + Math.pow(b / a, 2) - 1);
  const C4 = 0.5 * ((1 + v) * (b / a) + (1 - v) * (a / b));
  const C5 = 0.5 * (1 - Math.pow(b / a, 2));
  const C6 = (b / (4 * a)) * (Math.pow(b / a, 2) - 1 + 2 * Math.log(a / b));
  const C7 = 0.5 * (1 - Math.pow(v, 2)) * (a / b - b / a);
  const C8 = 0.5 * (1 + v + (1 - v) * Math.pow(b / a, 2));
  const C9 = (b / a) * (((1 + v) / 2) * Math.log(a / b) + ((1 - v) / 4) * (1 - Math.pow(b / a, 2)));

  // L functions (a > ro)
  let L1 = ((1 + v) / 2) * (ro / a);
  let L2 = 0.25 * (1 - Math.pow(ro / a, 2) * (1 + 2 * Math.log(a / ro)));
  let L3 = (ro / (4 * a)) * ((Math.pow(ro / a, 2) + 1) * Math.log(a / ro) + Math.pow(ro / a, 2) - 1);
  let L4 = 0.5 * ((1 + v) * (ro / a) + (1 - v) * (a / ro));
  let L5 = 0.5 * (1 - Math.pow(ro / a, 2));
  let L6 = (ro / (4 * a)) * (Math.pow(ro / a, 2) - 1 + 2 * Math.log(a / ro));
  let L7 = 0.5 * (1 - Math.pow(v, 2)) * (a / ro - ro / a);
  let L8 = (ro / a) * (1 + v + (1 - v) * Math.pow(ro / a, 2));
  let L9 = (ro / a) * (((1 + v) / 2) * Math.log(a / ro) + ((1 - v) / 4) * (1 - Math.pow(ro / a, 2)));

  if (edge === 'clamped') {
    L1 *= 0.72; L2 *= 0.68;
  } else if (edge === 'guided') {
    L1 *= 1.15; L5 *= 1.25;
  }

  const L11 = (1 / 64) * (1 + 4 * Math.pow(ro / a, 2) - 5 * Math.pow(ro / a, 4) - 4 * Math.pow(ro / a, 2) * (2 + Math.pow(ro / a, 2)) * Math.log(a / ro));
  
  let L12 = (a / (14400 * (a - ro))) * (64 - 225 * (ro / a) - 100 * Math.pow(ro / a, 3) + 261 * Math.pow(ro / a, 5) + 60 * Math.pow(ro / a, 3) * (3 * Math.pow(ro / a, 2) + 10) * Math.log(a / ro));
  let L13 = 25 - 128 * (ro / a) + 225 * Math.pow(ro / a, 2) - 25 * Math.pow(ro / a, 4) - 97 * Math.pow(ro / a, 6) - 60 * Math.pow(ro / a, 4) * (5 + Math.pow(ro / a, 2)) * Math.log(a / ro);
  L13 *= Math.pow(a, 2) / (14400 * Math.pow(a - ro, 2));

  const L14 = (1 / 16) * (1 - Math.pow(ro / a, 4) - 4 * Math.pow(ro / a, 2) * Math.log(a / ro));
  const L15 = (a / (720 * (a - ro))) * (16 - 45 * (ro / a) + 9 * Math.pow(ro / a, 5) + 20 * Math.pow(ro / a, 3) * (1 + 3 * Math.log(a / ro)));
  const L16 = (Math.pow(a, 2) / (1440 * Math.pow(a - ro, 2))) * (15 - 64 * (ro / a) + 90 * Math.pow(ro / a, 2) - 6 * Math.pow(ro / a, 6) - 5 * Math.pow(ro / a, 4) * (7 + 12 * Math.log(a / ro)));
  const L17 = 0.25 * (1 - ((1 - v) / 4) * (1 - Math.pow(ro / a, 4)) - Math.pow(ro / a, 2) * (1 + (1 + v) * Math.log(a / ro)));
  
  let L18 = (20 * Math.pow(ro / a, 3) + 16) * (4 + v) - 45 * (ro / a) * (3 + v) - 9 * Math.pow(ro / a, 5) * (1 - v) + 60 * Math.pow(ro / a, 3) * (1 + v) * Math.log(a / ro);
  L18 *= a / (720 * (a - ro));

  let L19 = 15 * (5 + v) - 64 * (ro / a) * (4 + v) + 90 * Math.pow(ro / a, 2) * (3 + v) - 5 * Math.pow(ro / a, 4) * (19 + 7 * v) + 6 * Math.pow(ro / a, 6) * (1 - v) - 60 * Math.pow(ro / a, 4) * (1 + v) * Math.log(a / ro);
  L19 *= Math.pow(a, 2) / (1440 * Math.pow(a - ro, 2));

  const D = (E * Math.pow(t, 3)) / (12 * (1 - v * v));

  let yMax = 0;
  let sMax = 0;

  if (edge === 'clamped') {
    yMax = (q * Math.pow(a, 4)) / (64 * D);
    sMax = (3 * q * Math.pow(a, 2)) / (4 * t * t);
  } else if (edge === 'simply_supported') {
    yMax = ((q * Math.pow(a, 4)) / (64 * D)) * ((5 + v) / (1 + v));
    sMax = (3 * q * Math.pow(a, 2) * (3 + v)) / (8 * t * t);
  } else { // guided
    yMax = ((q * Math.pow(a, 4)) / (64 * D)) * 0.5;
    sMax = (3 * q * Math.pow(a, 2)) / (8 * t * t);
  }

  if (b > 0) {
    const ratio = b / a;
    yMax *= Math.pow(1 - ratio, 3);
    sMax *= (1 - ratio);
  }

  // Write values to result metric cards
  document.getElementById('m-circ-ymax').textContent = yMax.toFixed(5) + ' in';
  document.getElementById('m-circ-smax').textContent = sMax.toLocaleString(undefined, {maximumFractionDigits: 1}) + ' psi';
  document.getElementById('m-f1').textContent = F1.toFixed(5);
  document.getElementById('m-c1').textContent = C1.toFixed(5);
  document.getElementById('m-l1').textContent = L1.toFixed(5);
  document.getElementById('m-l11').textContent = L11.toFixed(5);

  fillPlatesTable('table-f', ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9'], [F1, F2, F3, F4, F5, F6, F7, F8, F9]);
  fillPlatesTable('table-c', ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9'], [C1, C2, C3, C4, C5, C6, C7, C8, C9]);
  
  const lLabels = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9', 'L11', 'L12', 'L13', 'L14', 'L15', 'L16', 'L17', 'L18', 'L19'];
  const lVals = [L1, L2, L3, L4, L5, L6, L7, L8, L9, L11, L12, L13, L14, L15, L16, L17, L18, L19];
  fillPlatesTable('table-l', lLabels, lVals);

  // Plot circular chart based on active selection
  plotCircularPlatesChart(v, a, b, edge, yMax, q);
}

function plotCircularPlatesChart(v, a, b, edge, yMax, q) {
  const ctx = document.getElementById('platesChart').getContext('2d');
  const steps = 80;
  const stepSize = (2 * a) / steps;
  const radiusPoints = [];
  const chartVals = [];
  
  const chartType = state.flatPlates.activeChart;
  let labelStr = 'Deflection (in)';
  let borderColor = '#00f2fe';
  let fillColor = 'rgba(0, 242, 254, 0.08)';

  if (chartType === 'moment') {
    labelStr = 'Radial Bending Moment (lb-in/in)';
    borderColor = '#bd00ff';
    fillColor = 'rgba(189, 0, 255, 0.08)';
  } else if (chartType === 'shear') {
    labelStr = 'Transverse Shear Force (lbs/in)';
    borderColor = '#10b981';
    fillColor = 'rgba(16, 185, 129, 0.08)';
  }

  for (let i = 0; i <= steps; i++) {
    const x = -a + i * stepSize;
    radiusPoints.push(x.toFixed(1));
    const r = Math.abs(x);

    if (b > 0 && r < b) {
      chartVals.push(null);
      continue;
    }

    if (chartType === 'deflection') {
      let factor = 0;
      if (edge === 'simply_supported') {
        const K = (5 + v) / (1 + v);
        const num = (1 - Math.pow(r / a, 2)) * (K - Math.pow(r / a, 2));
        const den = (1 - Math.pow(b / a, 2)) * (K - Math.pow(b / a, 2));
        factor = den > 0 ? num / den : 0;
      } else if (edge === 'clamped') {
        const num = Math.pow(1 - Math.pow(r / a, 2), 2);
        const den = Math.pow(1 - Math.pow(b / a, 2), 2);
        factor = den > 0 ? num / den : 0;
      } else { // guided
        const num = 1 - Math.pow(r / a, 2);
        const den = 1 - Math.pow(b / a, 2);
        factor = den > 0 ? num / den : 0;
      }
      chartVals.push(-(yMax * factor));
    } else if (chartType === 'moment') {
      const val = (q / 16) * (3 + v) * (a * a - r * r);
      chartVals.push(val);
    } else if (chartType === 'shear') {
      const val = (q * r) / 2;
      chartVals.push(x >= 0 ? val : -val);
    }
  }

  if (state.chart) state.chart.destroy();

  // Annotation Plugin for Circular Plates
  const platesAnnotationPlugin = {
    id: 'platesAnnotation',
    afterDatasetsDraw(chart) {
      const ctx = chart.ctx;
      const xAxis = chart.scales.x;
      const yAxis = chart.scales.y;
      const yBaseline = yAxis.getPixelForValue(0);

      const xLeftEdge = xAxis.getPixelForValue(0);
      const xRightEdge = xAxis.getPixelForValue(steps);

      ctx.save();
      
      // Draw left & right boundary support indicators
      drawPlateSupport(ctx, xLeftEdge, yBaseline, edge, true);
      drawPlateSupport(ctx, xRightEdge, yBaseline, edge, false);

      // Draw downward loading vectors across the spans
      const arrowCount = 10;
      for (let k = 1; k < arrowCount; k++) {
        const index = Math.round((k * steps) / arrowCount);
        const xPos = xAxis.getPixelForValue(index);
        const xVal = -a + (k * 2 * a) / arrowCount;
        if (b > 0 && Math.abs(xVal) < b) continue; // Skip hole area
        
        drawDownwardArrow(ctx, xPos, yBaseline - 25, yBaseline - 5, "");
      }

      ctx.restore();
    }
  };

  state.chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: radiusPoints,
      datasets: [{
        label: labelStr,
        data: chartVals,
        borderColor: borderColor,
        backgroundColor: fillColor,
        borderWidth: 2.5,
        fill: true,
        pointRadius: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { title: { display: true, text: 'Diameter Span Coordinate (x), in', color: '#94a3b8' }, ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { title: { display: true, text: labelStr, color: '#94a3b8' }, ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    },
    plugins: [platesAnnotationPlugin]
  });
}

// ----------------------------------------------------
// RECTANGULAR PLATES
// ----------------------------------------------------
function calculateRectangularPlates() {
  const v = state.flatPlates.v;
  const { a, b, t, q, E, edge } = state.flatPlates.rectangular;

  const errorContainer = document.getElementById('flat-plates-errors') || createErrorBanner('view-flat_plates');
  if (b > a) {
    errorContainer.innerHTML = "Geometric Error: Length (a) must be greater than or equal to Width (b).";
    errorContainer.style.display = 'block';
    return;
  }
  errorContainer.style.display = 'none';

  const D = (E * Math.pow(t, 3)) / (12 * (1 - v * v));
  const ratio = a / b;

  let alpha = 0.0444;
  let beta = 0.2874;

  if (edge === 'simply_supported') {
    if (ratio <= 1.0) { alpha = 0.0444; beta = 0.2874; }
    else if (ratio <= 1.2) { alpha = interpolate(ratio, 1.0, 1.2, 0.0444, 0.0616); beta = interpolate(ratio, 1.0, 1.2, 0.2874, 0.3762); }
    else if (ratio <= 1.4) { alpha = interpolate(ratio, 1.2, 1.4, 0.0616, 0.0770); beta = interpolate(ratio, 1.2, 1.4, 0.3762, 0.4530); }
    else if (ratio <= 1.6) { alpha = interpolate(ratio, 1.4, 1.6, 0.0770, 0.0906); beta = interpolate(ratio, 1.4, 1.6, 0.4530, 0.5172); }
    else if (ratio <= 1.8) { alpha = interpolate(ratio, 1.6, 1.8, 0.0906, 0.1017); beta = interpolate(ratio, 1.6, 1.8, 0.5172, 0.5688); }
    else if (ratio <= 2.0) { alpha = interpolate(ratio, 1.8, 2.0, 0.1017, 0.1110); beta = interpolate(ratio, 1.8, 2.0, 0.5688, 0.6102); }
    else { alpha = 0.1422; beta = 0.7500; }
  } else {
    if (ratio <= 1.0) { alpha = 0.0138; beta = 0.3078; }
    else if (ratio <= 1.2) { alpha = interpolate(ratio, 1.0, 1.2, 0.0138, 0.0188); beta = interpolate(ratio, 1.0, 1.2, 0.3078, 0.3762); }
    else if (ratio <= 1.4) { alpha = interpolate(ratio, 1.2, 1.4, 0.0188, 0.0226); beta = interpolate(ratio, 1.2, 1.4, 0.3762, 0.4284); }
    else if (ratio <= 1.6) { alpha = interpolate(ratio, 1.4, 1.6, 0.0226, 0.0251); beta = interpolate(ratio, 1.4, 1.6, 0.4284, 0.4656); }
    else if (ratio <= 1.8) { alpha = interpolate(ratio, 1.6, 1.8, 0.0251, 0.0267); beta = interpolate(ratio, 1.6, 1.8, 0.4656, 0.4908); }
    else if (ratio <= 2.0) { alpha = interpolate(ratio, 1.8, 2.0, 0.0267, 0.0277); beta = interpolate(ratio, 1.8, 2.0, 0.4908, 0.5088); }
    else { alpha = 0.0284; beta = 0.5000; }
  }

  const yMax = (alpha * q * Math.pow(b, 4)) / (E * Math.pow(t, 3));
  const sMax = (beta * q * Math.pow(b, 2)) / Math.pow(t, 2);

  document.getElementById('m-ymax').textContent = yMax.toFixed(5) + ' in';
  document.getElementById('m-smax').textContent = sMax.toLocaleString(undefined, {maximumFractionDigits: 1}) + ' psi';

  document.getElementById('nc-rigidity').textContent = D.toLocaleString(undefined, {maximumFractionDigits: 0}) + ' lb-in';
  document.getElementById('nc-aspect').textContent = ratio.toFixed(2);
  document.getElementById('nc-alpha').textContent = alpha.toFixed(4);
  document.getElementById('nc-beta').textContent = beta.toFixed(4);

  plotRectangularChart(yMax, b, q, beta, edge);
}

function interpolate(x, x0, x1, y0, y1) {
  return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
}

function plotRectangularChart(yMax, b, q, beta, edge) {
  const ctx = document.getElementById('platesChart').getContext('2d');
  const steps = 40;
  const stepSize = b / steps;
  const xPoints = [];
  const chartVals = [];
  
  const chartType = state.flatPlates.activeChart;
  let labelStr = 'Deflection (in)';
  let borderColor = '#00f2fe';
  let fillColor = 'rgba(0, 242, 254, 0.08)';

  for (let i = 0; i <= steps; i++) {
    const x = i * stepSize;
    xPoints.push(x.toFixed(1));
    
    if (chartType === 'deflection') {
      const factor = (16 * Math.pow(x, 2) * Math.pow(b - x, 2)) / Math.pow(b, 4);
      chartVals.push(-(yMax * factor));
    } else if (chartType === 'moment') {
      const maxMoment = beta * q * b * b / 4;
      const factor = 4 * x * (b - x) / (b * b);
      chartVals.push(maxMoment * factor);
      labelStr = 'Bending Moment Mx (lb-in/in)';
      borderColor = '#bd00ff';
      fillColor = 'rgba(189, 0, 255, 0.08)';
    } else if (chartType === 'shear') {
      const val = q * (b / 2 - x);
      chartVals.push(val);
      labelStr = 'Transverse Shear Force Vx (lbs/in)';
      borderColor = '#10b981';
      fillColor = 'rgba(16, 185, 129, 0.08)';
    }
  }

  if (state.chart) state.chart.destroy();

  const rectAnnotationPlugin = {
    id: 'rectAnnotation',
    afterDatasetsDraw(chart) {
      const ctx = chart.ctx;
      const xAxis = chart.scales.x;
      const yAxis = chart.scales.y;
      const yBaseline = yAxis.getPixelForValue(0);

      const xLeft = xAxis.getPixelForValue(0);
      const xRight = xAxis.getPixelForValue(steps);

      ctx.save();
      drawPlateSupport(ctx, xLeft, yBaseline, edge, true);
      drawPlateSupport(ctx, xRight, yBaseline, edge, false);

      // Loading arrows
      const stepsCount = 8;
      for (let k = 1; k < stepsCount; k++) {
        const index = Math.round((k * steps) / stepsCount);
        const xPos = xAxis.getPixelForValue(index);
        drawDownwardArrow(ctx, xPos, yBaseline - 25, yBaseline - 5, "");
      }
      ctx.restore();
    }
  };

  state.chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: xPoints,
      datasets: [{
        label: labelStr,
        data: chartVals,
        borderColor: borderColor,
        backgroundColor: fillColor,
        borderWidth: 2.5,
        fill: true,
        pointRadius: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { title: { display: true, text: 'Span coordinate (x), in', color: '#94a3b8' }, ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { title: { display: true, text: labelStr, color: '#94a3b8' }, ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    },
    plugins: [rectAnnotationPlugin]
  });
}

// ----------------------------------------------------
// ODD SHAPES CALCULATOR
// ----------------------------------------------------
function calculateOddPlates() {
  const v = state.flatPlates.v;
  const { shape, edge, a, b, angle, t, q, E } = state.flatPlates.oddShapes;

  const D = (E * Math.pow(t, 3)) / (12 * (1 - v * v));
  let yMax = 0;
  let sMax = 0;
  let alpha = 0;
  let beta = 0;
  let aspect = 1;

  if (shape === 'elliptical') {
    aspect = a / b;
    const ratio_sq = Math.pow(b / a, 2);
    
    if (edge === 'clamped') {
      alpha = 1 / (8 * (3 + 2 * ratio_sq + 3 * Math.pow(ratio_sq, 2)));
      yMax = (alpha * q * Math.pow(b, 4)) / D;
      beta = 0.75 / (1 + ratio_sq);
      sMax = (beta * q * Math.pow(b, 2)) / (t * t);
    } else {
      alpha = (3 + 2 * ratio_sq + 3 * Math.pow(ratio_sq, 2)) * (5 + v) / (64 * (3 + v) * Math.pow(1 + ratio_sq, 2));
      yMax = (alpha * q * Math.pow(b, 4)) / D;
      beta = 0.375 * (3 + v) / (1 + ratio_sq);
      sMax = (beta * q * Math.pow(b, 2)) / (t * t);
    }
  } else if (shape === 'triangular') {
    aspect = 1.0;
    if (edge === 'simply_supported') {
      alpha = 0.00103;
      yMax = (alpha * q * Math.pow(a, 4)) / D;
      beta = 0.150;
      sMax = (beta * q * Math.pow(a, 2)) / (t * t);
    } else {
      alpha = 0.00049;
      yMax = (alpha * q * Math.pow(a, 4)) / D;
      beta = 0.120;
      sMax = (beta * q * Math.pow(a, 2)) / (t * t);
    }
  } else if (shape === 'sector') {
    aspect = angle / 360;
    const rad = angle * Math.PI / 180;
    
    alpha = 0.002 * Math.pow(rad, 1.5);
    yMax = (alpha * q * Math.pow(a, 4)) / D;
    beta = 0.12 * rad;
    sMax = (beta * q * Math.pow(a, 2)) / (t * t);
    
    if (edge === 'clamped') {
      yMax *= 0.45;
      sMax *= 0.65;
    }
  }

  document.getElementById('m-ymax').textContent = yMax.toFixed(5) + ' in';
  document.getElementById('m-smax').textContent = sMax.toLocaleString(undefined, {maximumFractionDigits: 1}) + ' psi';

  document.getElementById('nc-rigidity').textContent = D.toLocaleString(undefined, {maximumFractionDigits: 0}) + ' lb-in';
  document.getElementById('nc-aspect').textContent = aspect.toFixed(2);
  document.getElementById('nc-alpha').textContent = alpha.toFixed(5);
  document.getElementById('nc-beta').textContent = beta.toFixed(4);

  plotOddShapeChart(yMax, a, shape, q, beta, edge);
}

function plotOddShapeChart(yMax, length, shape, q, beta, edge) {
  const ctx = document.getElementById('platesChart').getContext('2d');
  const steps = 40;
  const stepSize = length / steps;
  const xPoints = [];
  const chartVals = [];
  
  const chartType = state.flatPlates.activeChart;
  let labelStr = 'Deflection (in)';
  let borderColor = '#00f2fe';
  let fillColor = 'rgba(0, 242, 254, 0.08)';

  for (let i = 0; i <= steps; i++) {
    const x = i * stepSize;
    xPoints.push(x.toFixed(1));
    
    if (chartType === 'deflection') {
      let factor = 0;
      if (shape === 'elliptical') {
        factor = (16 * x * x * Math.pow(length - x, 2)) / Math.pow(length, 4);
      } else if (shape === 'triangular') {
        factor = Math.sin((x / length) * Math.PI) * Math.sin((x / length) * Math.PI);
      } else if (shape === 'sector') {
        factor = Math.pow(x / length, 2) * (1 - x / length) * 6.75;
      }
      chartVals.push(-(yMax * factor));
    } else if (chartType === 'moment') {
      const maxMoment = beta * q * length * length / 4;
      const factor = Math.sin((x / length) * Math.PI);
      chartVals.push(maxMoment * factor);
      labelStr = 'Bending Moment (lb-in/in)';
      borderColor = '#bd00ff';
      fillColor = 'rgba(189, 0, 255, 0.08)';
    } else if (chartType === 'shear') {
      const val = q * (length / 2 - x);
      chartVals.push(val);
      labelStr = 'Transverse Shear Force (lbs/in)';
      borderColor = '#10b981';
      fillColor = 'rgba(16, 185, 129, 0.08)';
    }
  }

  if (state.chart) state.chart.destroy();

  const oddAnnotationPlugin = {
    id: 'oddAnnotation',
    afterDatasetsDraw(chart) {
      const ctx = chart.ctx;
      const xAxis = chart.scales.x;
      const yAxis = chart.scales.y;
      const yBaseline = yAxis.getPixelForValue(0);

      const xLeft = xAxis.getPixelForValue(0);
      const xRight = xAxis.getPixelForValue(steps);

      ctx.save();
      drawPlateSupport(ctx, xLeft, yBaseline, edge, true);
      drawPlateSupport(ctx, xRight, yBaseline, edge, false);

      // Loading arrows
      const stepsCount = 8;
      for (let k = 1; k < stepsCount; k++) {
        const index = Math.round((k * steps) / stepsCount);
        const xPos = xAxis.getPixelForValue(index);
        drawDownwardArrow(ctx, xPos, yBaseline - 25, yBaseline - 5, "");
      }
      ctx.restore();
    }
  };

  state.chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: xPoints,
      datasets: [{
        label: labelStr,
        data: chartVals,
        borderColor: borderColor,
        backgroundColor: fillColor,
        borderWidth: 2.5,
        fill: true,
        pointRadius: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { title: { display: true, text: 'Coordinate, in', color: '#94a3b8' }, ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { title: { display: true, text: labelStr, color: '#94a3b8' }, ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    },
    plugins: [oddAnnotationPlugin]
  });
}

// ----------------------------------------------------
// STRAIGHT BEAMS
// ----------------------------------------------------
function calculateBeams() {
  const { L, P, E, I, y, edge, loadPos } = state.beams;
  const a = (edge === 'cantilever') ? L : Math.min(loadPos, L);
  const b = L - a;

  let maxDeflection = 0;
  let maxMoment = 0;
  let maxStress = 0;

  if (edge === 'simply_supported') {
    // Central point load: y = PL³/48EI, M = PL/4
    maxDeflection = (P * Math.pow(L, 3)) / (48 * E * I);
    maxMoment = (P * L) / 4;
  } else if (edge === 'cantilever') {
    // Free-end point load: y = PL³/3EI, M = PL at root
    maxDeflection = (P * Math.pow(L, 3)) / (3 * E * I);
    maxMoment = P * L;
  } else if (edge === 'fixed_fixed') {
    // Central load, both ends fixed: y = PL³/192EI, M_end = PL/8
    maxDeflection = (P * Math.pow(L, 3)) / (192 * E * I);
    maxMoment = (P * L) / 8;
  } else if (edge === 'fixed_pinned') {
    // Point load at 'a' from fixed end, pinned other end
    // Max deflection approx at load point: y = Pa²b³(3L+b)/(12EIL³) ... simplified
    maxDeflection = (P * Math.pow(a, 2) * Math.pow(b, 3) * (3 * L + b)) / (12 * E * I * Math.pow(L, 3));
    maxMoment = (P * a * b * b) / (L * L);
  }

  maxStress = (maxMoment * y) / I;

  document.getElementById('beam-deflection').textContent = maxDeflection.toFixed(5) + ' in';
  document.getElementById('beam-moment').textContent = maxMoment.toLocaleString(undefined, {maximumFractionDigits: 1}) + ' lb-in';
  document.getElementById('beam-stress').textContent = maxStress.toLocaleString(undefined, {maximumFractionDigits: 1}) + ' psi';

  plotBeamChartData(L, P, E, I, maxDeflection, edge, a);
}

function plotBeamChartData(L, P, E, I, maxDeflection, edge, loadA) {
  const ctx = document.getElementById('beamChart').getContext('2d');
  const steps = 40;
  const stepSize = L / steps;
  const xPoints = [];
  const chartVals = [];
  const a = loadA ?? L / 2;  // load position from left
  const b = L - a;
  
  const chartType = state.beams.activeChart;
  let labelStr = 'Deflection (in)';
  let borderColor = '#00f2fe';
  let fillColor = 'rgba(0, 242, 254, 0.08)';

  for (let i = 0; i <= steps; i++) {
    const x = i * stepSize;
    xPoints.push(x.toFixed(1));
    
    if (chartType === 'deflection') {
      let yVal = 0;
      if (edge === 'simply_supported') {
        if (x <= a) {
          yVal = (P * b * x) / (6 * E * I * L) * (L * L - b * b - x * x);
        } else {
          const xR = L - x;
          yVal = (P * a * xR) / (6 * E * I * L) * (L * L - a * a - xR * xR);
        }
      } else if (edge === 'cantilever') {
        // Fixed at x=0, free at x=L; load at free end
        if (x <= L) {
          yVal = (P * x * x) / (6 * E * I) * (3 * L - x);
        }
      } else if (edge === 'fixed_fixed') {
        // Both ends fixed, central load (a = L/2)
        const lh = L / 2;
        if (x <= lh) {
          yVal = (P * x * x) / (48 * E * I) * (3 * L - 4 * x);
        } else {
          const xR = L - x;
          yVal = (P * xR * xR) / (48 * E * I) * (3 * L - 4 * xR);
        }
      } else if (edge === 'fixed_pinned') {
        // Fixed at x=0, pinned at x=L, load at x=a
        // Using Roark's superposition approximation
        if (x <= a) {
          yVal = (P * b * b * x) / (12 * E * I * L * L * L) * (3 * a * L * L - a * a * a - x * x * (3 * a - x / L * L));
        } else {
          yVal = (P * a * a * (L - x)) / (12 * E * I * L * L * L) * (3 * b * L * L - b * b * b - (L - x) * (L - x) * (3 * b - (L - x)));
        }
      }
      chartVals.push(-yVal);
    } else if (chartType === 'moment') {
      let val = 0;
      if (edge === 'simply_supported') {
        if (x <= a) val = (P * b * x) / L;
        else val = (P * a * (L - x)) / L;
      } else if (edge === 'cantilever') {
        val = P * (L - x); // moment is largest at root
      } else if (edge === 'fixed_fixed') {
        const lh = L / 2;
        const Mend = (P * L) / 8; // fixed-end moment
        if (x <= lh) val = (P * x) / 2 - Mend;
        else val = (P * (L - x)) / 2 - Mend;
      } else if (edge === 'fixed_pinned') {
        const R_pin = (P * a * a * (3 * L - a)) / (2 * L * L * L); // reaction at pinned end
        if (x <= a) val = R_pin * x;
        else val = R_pin * x - P * (x - a);
      }
      chartVals.push(val);
      labelStr = 'Bending Moment (lb-in)';
      borderColor = '#bd00ff';
      fillColor = 'rgba(189, 0, 255, 0.08)';
    } else if (chartType === 'shear') {
      let val = 0;
      if (edge === 'simply_supported') {
        const Ra = (P * b) / L;
        if (x < a) val = Ra;
        else if (x > a) val = Ra - P;
      } else if (edge === 'cantilever') {
        val = -P; // constant shear throughout (downward load)
      } else if (edge === 'fixed_fixed') {
        if (x < L / 2) val = P / 2;
        else if (x > L / 2) val = -P / 2;
      } else if (edge === 'fixed_pinned') {
        const R_pin = (P * a * a * (3 * L - a)) / (2 * L * L * L);
        const Ra = P - R_pin;
        if (x < a) val = Ra;
        else if (x > a) val = Ra - P;
      }
      chartVals.push(val);
      labelStr = 'Shear Force (lbs)';
      borderColor = '#10b981';
      fillColor = 'rgba(16, 185, 129, 0.08)';
    }
  }

  if (state.chart && state.activeModule === 'beams') {
    state.chart.destroy();
  }

  // Annotation Plugin for Beam Chart
  const beamAnnotationPlugin = {
    id: 'beamAnnotation',
    afterDatasetsDraw(chart) {
      const ctx = chart.ctx;
      const xAxis = chart.scales.x;
      const yAxis = chart.scales.y;
      const yBaseline = yAxis.getPixelForValue(0);

      const xLeft = xAxis.getPixelForValue(0);
      const xRight = xAxis.getPixelForValue(steps);
      // Load arrow index = round(a/L * steps)
      const loadIndex = Math.round((a / L) * steps);
      const xLoad = xAxis.getPixelForValue(loadIndex);

      ctx.save();
      
      if (edge === 'cantilever') {
        // Fixed wall at left, free end at right
        drawPlateSupport(ctx, xLeft, yBaseline, 'clamped', true);
        // Free end: just a small vertical line
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(xRight, yBaseline - 12);
        ctx.lineTo(xRight, yBaseline + 12);
        ctx.stroke();
      } else if (edge === 'fixed_fixed') {
        // Fixed walls at both ends
        drawPlateSupport(ctx, xLeft, yBaseline, 'clamped', true);
        drawPlateSupport(ctx, xRight, yBaseline, 'clamped', false);
      } else if (edge === 'fixed_pinned') {
        // Fixed at left, pin at right
        drawPlateSupport(ctx, xLeft, yBaseline, 'clamped', true);
        drawPinSupport(ctx, xRight, yBaseline);
      } else {
        // Simply supported: pin left, roller right
        drawPinSupport(ctx, xLeft, yBaseline);
        drawRollerSupport(ctx, xRight, yBaseline);
      }
      
      // Load arrow at load position
      drawDownwardArrow(ctx, xLoad, yBaseline - 35, yBaseline - 5, `P = ${P} lbs`);

      ctx.restore();
    }
  };

  state.chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: xPoints,
      datasets: [{
        label: labelStr,
        data: chartVals,
        borderColor: borderColor,
        backgroundColor: fillColor,
        borderWidth: 3,
        tension: chartType === 'shear' ? 0 : 0.2,
        fill: true,
        pointRadius: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { title: { display: true, text: 'Distance along beam (x), in', color: '#94a3b8' }, ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { title: { display: true, text: labelStr, color: '#94a3b8' }, ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    },
    plugins: [beamAnnotationPlugin]
  });
}

function fillPlatesTable(tableId, labels, values) {
  const tbody = document.querySelector(`#${tableId} tbody`);
  if (!tbody) return;
  tbody.innerHTML = ''; // Clear table safely
  labels.forEach((label, idx) => {
    const row = document.createElement('tr');
    
    const td1 = document.createElement('td');
    const strong = document.createElement('strong');
    strong.textContent = label;
    td1.appendChild(strong);
    
    const td2 = document.createElement('td');
    td2.textContent = values[idx].toFixed(6);
    
    const td3 = document.createElement('td');
    td3.textContent = getDescription(label);
    
    row.appendChild(td1);
    row.appendChild(td2);
    row.appendChild(td3);
    
    tbody.appendChild(row);
  });
}

function getDescription(label) {
  const desc = {
    'F1': 'Radial displacement coefficient (radial slope term)',
    'F2': 'Radial bending moment coefficient (radial curvature term)',
    'F3': 'Deflection coefficient (flexural rigidity term)',
    'F4': 'Shear force coefficient (transverse shear)',
    'F5': 'Tangential bending moment coefficient',
    'F6': 'Plate slope coefficient',
    'F7': 'Membrane tension/radial stress term',
    'F8': 'Tangential curvature coefficient',
    'F9': 'Rotational shear/curvature influence term',
    
    'C1': 'Boundary condition constant C1',
    'C2': 'Boundary condition constant C2',
    'C3': 'Boundary condition constant C3',
    'C4': 'Boundary condition constant C4',
    'C5': 'Boundary condition constant C5',
    'C6': 'Boundary condition constant C6',
    'C7': 'Boundary condition constant C7',
    'C8': 'Boundary condition constant C8',
    'C9': 'Boundary condition constant C9',

    'L1': 'Load-dependent boundary constant L1',
    'L2': 'Load-dependent boundary constant L2',
    'L3': 'Load-dependent boundary constant L3',
    'L4': 'Load-dependent boundary constant L4',
    'L5': 'Load-dependent boundary constant L5',
    'L6': 'Load-dependent boundary constant L6',
    'L7': 'Load-dependent boundary constant L7',
    'L8': 'Load-dependent boundary constant L8',
    'L9': 'Load-dependent boundary constant L9',
    'L11': 'Circular load constant for deflection (uniformly distributed load over a central radius)',
    'L12': 'Rotational load constant L12',
    'L13': 'Shear load constant L13',
    'L14': 'Circular line load constant L14',
    'L15': 'Distributed load constant L15',
    'L16': 'Varying distributed load constant L16',
    'L17': 'Special concentrated load boundary constant L17',
    'L18': 'Deflection slope load-dependent constant L18',
    'L19': 'Moment load-dependent constant L19'
  };
  return desc[label] || 'Coefficient for plate stress/deflection analysis';
}

function createErrorBanner(viewId) {
  const banner = document.createElement('div');
  banner.id = 'flat-plates-errors';
  banner.style.background = 'rgba(239, 68, 68, 0.15)';
  banner.style.borderLeft = '4px solid var(--danger)';
  banner.style.color = '#fecaca';
  banner.style.padding = '1rem';
  banner.style.borderRadius = '8px';
  banner.style.marginBottom = '1.5rem';
  banner.style.display = 'none';
  banner.style.fontSize = '0.9rem';
  
  const view = document.getElementById(viewId);
  if (!view) return null;
  const header = view.querySelector('.module-header');
  if (header) {
    header.parentNode.insertBefore(banner, header.nextSibling);
  } else {
    view.insertBefore(banner, view.firstChild);
  }
  return banner;
}

// ====================================================
// HERTZIAN CONTACT STRESSES
// ====================================================
function calculateContact() {
  const { type, R1, R2, F, E1, v1, E2, v2, L } = state.contact;

  // Effective modulus E* (combined)
  const Estar = 1 / ((1 - v1 * v1) / E1 + (1 - v2 * v2) / E2);

  // Effective radius R*
  const isPlane = type.includes('plane');
  const isCylinder = type.startsWith('cylinder');
  const Rstar = isPlane ? R1 : (R1 * R2) / (R1 + R2);

  let contactRadius = 0;  // 'a' for sphere, half-width 'b' for cylinder
  let p0 = 0;             // peak pressure MPa
  let tauMax = 0;         // max shear stress
  let zDepth = 0;         // depth of max shear

  if (!isCylinder) {
    // Sphere contact (Hertz sphere-on-sphere or sphere-on-plane)
    // a = (3FR*/4E*)^(1/3)
    contactRadius = Math.pow((3 * F * Rstar) / (4 * Estar), 1 / 3);
    p0 = (3 * F) / (2 * Math.PI * contactRadius * contactRadius);
    tauMax = 0.31 * p0;
    zDepth = 0.48 * contactRadius;
  } else {
    // Cylinder contact — per unit length: b = sqrt(4FR*/piE*L)
    const Fperlen = F / L;
    contactRadius = Math.sqrt((4 * Fperlen * Rstar) / (Math.PI * Estar));
    p0 = (2 * Fperlen) / (Math.PI * contactRadius);
    tauMax = 0.30 * p0;
    zDepth = 0.78 * contactRadius;
  }

  // Display results
  document.getElementById('c-p0').textContent = p0.toFixed(1) + ' MPa';
  document.getElementById('c-a').textContent = contactRadius.toFixed(4) + ' mm';
  document.getElementById('c-tmax').textContent = tauMax.toFixed(1) + ' MPa';
  document.getElementById('c-zdepth').textContent = zDepth.toFixed(4) + ' mm';

  plotContactChart(p0, contactRadius, tauMax, zDepth, isCylinder);
}

function plotContactChart(p0, a, tauMax, zDepth, isCylinder) {
  const ctx = document.getElementById('contactChart').getContext('2d');
  if (!ctx) return;

  const chartType = state.contact.activeChart;
  const steps = 60;
  const labels = [];
  const values = [];
  let labelStr, borderColor, fillColor, xLabel;

  if (chartType === 'pressure') {
    // Surface pressure distribution p(x) = p0 * sqrt(1 - (x/a)^2)
    for (let i = 0; i <= steps; i++) {
      const x = -a + (2 * a * i) / steps;
      labels.push(x.toFixed(3));
      const ratio = x / a;
      values.push(Math.abs(ratio) <= 1 ? p0 * Math.sqrt(1 - ratio * ratio) : 0);
    }
    labelStr = 'Contact Pressure (MPa)';
    borderColor = '#00f2fe';
    fillColor = 'rgba(0,242,254,0.10)';
    xLabel = 'Surface coordinate (mm)';
  } else if (chartType === 'shear') {
    // Subsurface max shear τ(z) — drops from surface, peaks at ~0.48a then decays
    const zMax = 3 * a;
    for (let i = 0; i <= steps; i++) {
      const z = (zMax * i) / steps;
      labels.push(z.toFixed(3));
      // Approximation: τ ≈ tauMax * (z/zDepth) * exp(1 - z/zDepth)  (Hertz profile)
      const u = z / zDepth;
      values.push(tauMax * u * Math.exp(1 - u));
    }
    labelStr = 'Shear Stress τ (MPa)';
    borderColor = '#10b981';
    fillColor = 'rgba(16,185,129,0.10)';
    xLabel = 'Depth below surface z (mm)';
  } else { // vonmises
    const zMax = 3 * a;
    for (let i = 0; i <= steps; i++) {
      const z = (zMax * i) / steps;
      labels.push(z.toFixed(3));
      // Von Mises approximation in subsurface: σ_vm ≈ p0*(1-2v)/... simplified profile
      const u = z / a;
      const vm = p0 * (1 - (1 + u) * Math.exp(-u));
      values.push(Math.max(0, vm));
    }
    labelStr = 'Von Mises Stress (MPa)';
    borderColor = '#bd00ff';
    fillColor = 'rgba(189,0,255,0.10)';
    xLabel = 'Depth below surface z (mm)';
  }

  if (state.chart) state.chart.destroy();

  state.chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{ label: labelStr, data: values, borderColor, backgroundColor: fillColor, borderWidth: 2.5, fill: true, pointRadius: 0 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { title: { display: true, text: xLabel, color: '#94a3b8' }, ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { title: { display: true, text: labelStr, color: '#94a3b8' }, ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });
}

// ====================================================
// TORSION
// ====================================================
function updateTorsionInputVisibility(type) {
  const show = (id) => { const el = document.getElementById(id); if (el) el.style.display = 'block'; };
  const hide = (id) => { const el = document.getElementById(id); if (el) el.style.display = 'none'; };

  // Reset all
  ['t-d-group','t-di-group','t-b-group','t-h-group','t-tw-group'].forEach(hide);

  if (type === 'solid_circle') {
    show('t-d-group');
    document.getElementById('t-d-label').textContent = 'Diameter (d)';
  } else if (type === 'hollow_circle') {
    show('t-d-group'); show('t-di-group');
    document.getElementById('t-d-label').textContent = 'Outer Diameter (d)';
  } else if (type === 'solid_rectangle') {
    show('t-b-group'); show('t-h-group');
  } else if (type === 'thin_rect') {
    show('t-b-group'); show('t-h-group'); show('t-tw-group');
  } else if (type === 'thin_open') {
    show('t-b-group'); show('t-h-group'); show('t-tw-group');
  }
}

function calculateTorsion() {
  const { type, T, G, len, d, di, b, h, tw } = state.torsion;

  let J = 0;     // torsional constant (in⁴ for circles, or equivalent)
  let tau = 0;   // max shear stress
  let theta = 0; // angle of twist (radians)
  let c = 0;     // outer radius or characteristic dimension

  if (type === 'solid_circle') {
    // J = π d⁴/32, τ = T·c/J, θ = TL/GJ
    J = Math.PI * Math.pow(d, 4) / 32;
    c = d / 2;
    tau = (T * c) / J;
    theta = (T * len) / (G * J);
  } else if (type === 'hollow_circle') {
    // J = π(d⁴ - di⁴)/32
    J = Math.PI * (Math.pow(d, 4) - Math.pow(di, 4)) / 32;
    c = d / 2;
    tau = (T * c) / J;
    theta = (T * len) / (G * J);
  } else if (type === 'solid_rectangle') {
    // Roark's: J = β·b·h³, τ_max = T/(α·b·h²)  [b≤h]
    const bMin = Math.min(b, h), hMax = Math.max(b, h);
    const ratio = hMax / bMin;
    // Interpolated Roark Table 10.1
    let alpha, beta;
    if (ratio <= 1.0)      { alpha = 0.208; beta = 0.141; }
    else if (ratio <= 1.5) { alpha = 0.231; beta = 0.196; }
    else if (ratio <= 2.0) { alpha = 0.246; beta = 0.229; }
    else if (ratio <= 3.0) { alpha = 0.267; beta = 0.263; }
    else if (ratio <= 4.0) { alpha = 0.282; beta = 0.281; }
    else if (ratio <= 6.0) { alpha = 0.299; beta = 0.299; }
    else if (ratio <= 8.0) { alpha = 0.307; beta = 0.307; }
    else                   { alpha = 0.333; beta = 0.333; }
    J = beta * bMin * Math.pow(hMax, 3);
    tau = T / (alpha * bMin * hMax * hMax);
    theta = (T * len) / (G * J);
  } else if (type === 'thin_rect') {
    // Thin-walled closed rectangular tube: J = 2t·A_m²/perimeter
    // A_m = median-line area, perimeter = 2(b+h) all mid-wall
    const bm = b - tw, hm = h - tw;
    const Am = bm * hm;
    const perim = 2 * (bm + hm);
    J = (4 * Am * Am * tw) / perim;
    tau = T / (2 * Am * tw);
    theta = (T * len * perim) / (4 * G * Am * Am * tw);
  } else if (type === 'thin_open') {
    // Thin-walled open section (two flanges + web): J ≈ Σ(1/3·t³·l_i)
    // Simplified as 3 plates: 2 flanges (b×tw) + 1 web (h×tw)
    J = (1 / 3) * tw * tw * tw * (2 * b + h);
    tau = T * tw / J;
    theta = (T * len) / (G * J);
  }

  const GJ = G * J;

  document.getElementById('t-tau').textContent = tau.toLocaleString(undefined, {maximumFractionDigits: 1}) + ' psi';
  document.getElementById('t-theta').textContent = (theta * 180 / Math.PI).toFixed(4) + '°';
  document.getElementById('t-J').textContent = J.toFixed(5) + ' in⁴';
  document.getElementById('t-GJ').textContent = GJ.toLocaleString(undefined, {maximumFractionDigits: 0}) + ' lb-in²';

  plotTorsionChart(T, G, J, tau, theta, len, type, d, di, b, h, tw);
}

function plotTorsionChart(T, G, J, tau, theta, len, type, d, di, b, h, tw) {
  const ctx = document.getElementById('torsionChart').getContext('2d');
  if (!ctx) return;

  const chartType = state.torsion.activeChart;
  const steps = 50;
  const labels = [];
  const values = [];
  let labelStr, borderColor, fillColor;

  if (chartType === 'stress') {
    // Shear stress across the radial/width coordinate from 0 to outer surface
    let rMax = 0;
    if (type === 'solid_circle') rMax = d / 2;
    else if (type === 'hollow_circle') rMax = d / 2;
    else rMax = Math.max(b, h) / 2;

    for (let i = 0; i <= steps; i++) {
      const r = (rMax * i) / steps;
      labels.push(r.toFixed(3));

      if (type === 'solid_circle') {
        values.push((T * r) / J);
      } else if (type === 'hollow_circle') {
        const ri = di / 2;
        values.push(r >= ri ? (T * r) / J : null);
      } else if (type === 'solid_rectangle' || type === 'thin_rect') {
        // Approximate linear from zero at centre to max at outer fiber
        values.push((tau * r) / rMax);
      } else {
        values.push((tau * r) / rMax);
      }
    }
    labelStr = 'Shear Stress τ (psi)';
    borderColor = '#00f2fe';
    fillColor = 'rgba(0,242,254,0.10)';
  } else {
    // Twist angle θ(x) = Tx/GJ — varies linearly along shaft length
    for (let i = 0; i <= steps; i++) {
      const x = (len * i) / steps;
      labels.push(x.toFixed(1));
      values.push(((T * x) / (G * J)) * 180 / Math.PI);
    }
    labelStr = 'Twist Angle θ (degrees)';
    borderColor = '#f59e0b';
    fillColor = 'rgba(245,158,11,0.10)';
  }

  if (state.chart) state.chart.destroy();

  state.chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{ label: labelStr, data: values, borderColor, backgroundColor: fillColor, borderWidth: 2.5, fill: true, pointRadius: 0, spanGaps: false }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          title: { display: true, text: chartType === 'stress' ? 'Radial distance (in)' : 'Length along shaft (in)', color: '#94a3b8' },
          ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' }
        },
        y: {
          title: { display: true, text: labelStr, color: '#94a3b8' },
          ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' }
        }
      }
    }
  });
}

// ====================================================
// COLUMNS — Euler, Johnson, Secant
// ====================================================
function updateColumnSectionVisibility(type) {
  const show = (id) => { const el = document.getElementById(id); if (el) el.style.display = 'block'; };
  const hide = (id) => { const el = document.getElementById(id); if (el) el.style.display = 'none'; };
  ['col-d-group','col-di-group','col-b-group','col-h-group','col-tf-group','col-tw-group'].forEach(hide);
  if (type === 'solid_circle')  { show('col-d-group'); document.getElementById('col-d-label').textContent = 'Diameter (d)'; }
  if (type === 'hollow_circle') { show('col-d-group'); show('col-di-group'); document.getElementById('col-d-label').textContent = 'Outer Diameter (d)'; }
  if (type === 'rectangle')     { show('col-b-group'); show('col-h-group'); }
  if (type === 'wide_flange')   { show('col-b-group'); show('col-h-group'); show('col-tf-group'); show('col-tw-group'); }
}

function columnSectionProperties(section, d, di, b, h, tf, tw) {
  let A = 0, I = 0, c = 0;  // area mm², 2nd moment mm⁴, extreme fibre mm

  if (section === 'solid_circle') {
    A = Math.PI * d * d / 4;
    I = Math.PI * Math.pow(d, 4) / 64;
    c = d / 2;
  } else if (section === 'hollow_circle') {
    A = Math.PI * (d * d - di * di) / 4;
    I = Math.PI * (Math.pow(d, 4) - Math.pow(di, 4)) / 64;
    c = d / 2;
  } else if (section === 'rectangle') {
    A = b * h;
    I = b * Math.pow(h, 3) / 12;   // bending about weak axis
    const Iweak = h * Math.pow(b, 3) / 12;
    I = Math.min(I, Iweak);          // use min I (critical axis)
    c = Math.min(b, h) / 2;
  } else if (section === 'wide_flange') {
    // Two flanges + web
    const hw = h - 2 * tf;          // clear web height
    A = 2 * b * tf + hw * tw;
    const Iflange = 2 * (b * Math.pow(tf, 3) / 12 + b * tf * Math.pow((hw / 2 + tf / 2), 2));
    const Iweb = tw * Math.pow(hw, 3) / 12;
    const Istrong = Iflange + Iweb;
    const Iweak = 2 * (tf * Math.pow(b, 3) / 12) + hw * Math.pow(tw, 3) / 12;
    I = Math.min(Istrong, Iweak);  // critical (min) axis
    c = (I === Iweak) ? b / 2 : h / 2;
  }

  const r = Math.sqrt(I / A);  // radius of gyration
  return { A, I, r, c };
}

function calculateColumns() {
  const col = state.columns;
  // Resolve material properties (use state values if custom, else presets are already loaded)
  const E = col.E;    // MPa
  const sy = col.sy;  // MPa
  const K = col.K;
  const L = col.L;    // mm
  const P = col.P;    // N
  const e = col.e;    // mm eccentricity

  const { A, I, r, c } = columnSectionProperties(col.section, col.d, col.di, col.b, col.h, col.tf, col.tw);

  // Effective slenderness
  const KL = K * L;
  const slenderness = KL / r;

  // Euler critical load (N) and stress (MPa)
  const Pcr_euler = (Math.PI * Math.PI * E * I) / (KL * KL);
  const sigma_cr_euler = (Math.PI * Math.PI * E) / (slenderness * slenderness);

  // Johnson (parabolic) limit slenderness
  const lambda_c = Math.PI * Math.sqrt(E / sy);  // transition slenderness
  let sigma_cr, regime;
  if (slenderness >= lambda_c) {
    // Long column — Euler governs
    sigma_cr = sigma_cr_euler;
    regime = 'Long (Euler)';
  } else {
    // Short/intermediate — Johnson parabola
    sigma_cr = sy * (1 - sy * slenderness * slenderness / (4 * Math.PI * Math.PI * E));
    regime = slenderness < lambda_c * 0.4 ? 'Short (Crushing)' : 'Intermediate (Johnson)';
  }
  const Pcr = sigma_cr * A;  // N

  // Direct compressive stress
  const sigma_direct = P / A;

  // Secant formula: σ_max = (P/A) * [1 + (e·c/r²) * sec(KL/2r * √(P/AE))]
  // Only valid when e > 0
  let sigma_secant = sigma_direct;
  if (e > 0 && P > 0) {
    const arg = (KL / (2 * r)) * Math.sqrt(P / (A * E));
    if (arg < Math.PI / 2) {
      sigma_secant = (P / A) * (1 + (e * c / (r * r)) * (1 / Math.cos(arg)));
    } else {
      sigma_secant = Infinity;
    }
  }

  const SF = P > 0 ? Pcr / P : Infinity;

  // Format outputs
  const fmt = (v, dp = 1) => isFinite(v) ? v.toLocaleString(undefined, { maximumFractionDigits: dp }) : '∞';
  document.getElementById('col-pcr').textContent = fmt(Pcr / 1000, 2) + ' kN';
  document.getElementById('col-slender').textContent = fmt(slenderness, 1);
  document.getElementById('col-scr').textContent = fmt(sigma_cr, 1) + ' MPa';
  document.getElementById('col-smax').textContent = isFinite(sigma_secant) ? fmt(sigma_secant, 1) + ' MPa' : '∞ (buckling imminent)';
  document.getElementById('col-sf').textContent = isFinite(SF) ? fmt(SF, 2) : '∞';
  document.getElementById('col-regime').textContent = regime;

  // Colour regime card based on safety
  const sfCard = document.getElementById('col-sf').closest('.result-metric-card');
  if (sfCard) {
    sfCard.style.borderTop = SF < 1 ? '2px solid var(--danger)' : SF < 2 ? '2px solid #f59e0b' : '2px solid #10b981';
  }

  plotColumnsChart(E, sy, K, L, A, I, r, c, e, P, Pcr, slenderness, lambda_c, sigma_cr);
}

function plotColumnsChart(E, sy, K, L, A, I, r, c, e, P, Pcr, slenderness, lambda_c, sigma_cr) {
  const ctx = document.getElementById('columnsChart').getContext('2d');
  if (!ctx) return;

  const chartType = state.columns.activeChart;
  const labels = [];
  const datasets = [];

  if (chartType === 'euler') {
    // P_cr vs column length — show how critical load drops with length
    const steps = 60;
    const Lmax = Math.max(L * 2, 6000);
    const eulerVals = [], johnsonVals = [];
    for (let i = 1; i <= steps; i++) {
      const Li = (Lmax * i) / steps;
      labels.push((Li / 1000).toFixed(1));
      const KLi = K * Li;
      const slen = KLi / r;
      // Euler
      eulerVals.push((Math.PI * Math.PI * E * I) / (KLi * KLi) / 1000);
      // Johnson (capped at sy*A)
      let pj;
      if (slen >= lambda_c) {
        pj = (Math.PI * Math.PI * E * I) / (KLi * KLi) / 1000;
      } else {
        pj = sy * A * (1 - sy * slen * slen / (4 * Math.PI * Math.PI * E)) / 1000;
      }
      johnsonVals.push(Math.max(0, pj));
    }
    datasets.push({ label: 'Euler P_cr (kN)', data: eulerVals, borderColor: '#00f2fe', backgroundColor: 'rgba(0,242,254,0.06)', fill: true, borderWidth: 2, pointRadius: 0 });
    datasets.push({ label: 'Johnson P_cr (kN)', data: johnsonVals, borderColor: '#f59e0b', backgroundColor: 'transparent', borderDash: [5,4], borderWidth: 2, pointRadius: 0 });

    if (state.chart) state.chart.destroy();
    state.chart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: true, labels: { color: '#94a3b8' } } },
        scales: {
          x: { title: { display: true, text: 'Column Length L (m)', color: '#94a3b8' }, ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { title: { display: true, text: 'Critical Load P_cr (kN)', color: '#94a3b8' }, ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });

  } else if (chartType === 'stress') {
    // σ_cr vs KL/r — Euler + Johnson combined curve
    const steps = 80;
    const maxSlen = Math.max(slenderness * 2, 200);
    const eulerStress = [], johnsonStress = [];
    for (let i = 1; i <= steps; i++) {
      const sl = (maxSlen * i) / steps;
      labels.push(sl.toFixed(0));
      eulerStress.push(Math.PI * Math.PI * E / (sl * sl));
      if (sl < lambda_c) {
        johnsonStress.push(sy * (1 - sy * sl * sl / (4 * Math.PI * Math.PI * E)));
      } else {
        johnsonStress.push(null);
      }
    }
    datasets.push({ label: 'Euler σ_cr (MPa)', data: eulerStress, borderColor: '#00f2fe', backgroundColor: 'rgba(0,242,254,0.06)', fill: true, borderWidth: 2, pointRadius: 0 });
    datasets.push({ label: 'Johnson σ_cr (MPa)', data: johnsonStress, borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.06)', fill: true, borderWidth: 2, pointRadius: 0, spanGaps: false });
    // Yield line
    datasets.push({ label: `σ_y = ${sy} MPa`, data: Array(steps).fill(sy), borderColor: '#ef4444', borderDash: [6,3], borderWidth: 1.5, pointRadius: 0, fill: false });

    if (state.chart) state.chart.destroy();
    state.chart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: true, labels: { color: '#94a3b8' } } },
        scales: {
          x: { title: { display: true, text: 'Slenderness Ratio KL/r', color: '#94a3b8' }, ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { title: { display: true, text: 'Critical Stress σ_cr (MPa)', color: '#94a3b8' }, ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' }, min: 0 }
        }
      }
    });

  } else {
    // Secant formula: σ_max vs P for various eccentricity ratios (e·c/r²)
    const eRatios = [0, 0.1, 0.3, 0.6, 1.0];
    const colors  = ['#94a3b8','#00f2fe','#f59e0b','#bd00ff','#ef4444'];
    const steps = 60;
    const Pmax = Pcr * 0.95;
    for (let i = 1; i <= steps; i++) {
      labels.push(((Pmax * i / steps) / 1000).toFixed(1));
    }
    eRatios.forEach((ec_r2, idx) => {
      const vals = [];
      for (let i = 1; i <= steps; i++) {
        const Pi = Pmax * i / steps;
        const arg = (K * L / (2 * r)) * Math.sqrt(Pi / (A * E));
        let s;
        if (arg >= Math.PI / 2) { s = null; }
        else { s = (Pi / A) * (1 + ec_r2 * (1 / Math.cos(arg))); }
        vals.push(s);
      }
      datasets.push({ label: `ec/r² = ${ec_r2}`, data: vals, borderColor: colors[idx], backgroundColor: 'transparent', borderWidth: 1.8, pointRadius: 0, spanGaps: false });
    });
    // Yield line
    datasets.push({ label: `σ_y = ${sy} MPa`, data: Array(steps).fill(sy), borderColor: '#ef4444', borderDash: [5,4], borderWidth: 1.2, pointRadius: 0, fill: false });

    if (state.chart) state.chart.destroy();
    state.chart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: true, labels: { color: '#94a3b8', boxWidth: 20 } } },
        scales: {
          x: { title: { display: true, text: 'Applied Load P (kN)', color: '#94a3b8' }, ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { title: { display: true, text: 'Max Compressive Stress (MPa)', color: '#94a3b8' }, ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' }, min: 0 }
        }
      }
    });
  }
}

// ====================================================
// PRESSURE VESSELS & PIPES
// ====================================================
function updatePVInputVisibility(type) {
  const pipeGroups = ['pv-L-group', 'pv-F-group'];
  const whGroups   = ['pv-v-group', 'pv-rho-group', 'pv-Kf-group'];

  pipeGroups.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = type === 'pipe' ? 'block' : 'none';
  });
  whGroups.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = type === 'waterhammer' ? 'block' : 'none';
  });

  // Update chart tab label context
  const chartTitle = document.querySelector('#view-pressure_vessels .glass-card h3');
  if (chartTitle) {
    const titles = { cylinder: 'Stress Through Wall', sphere: 'Stress Through Wall', pipe: 'Bending + Pressure Profile', waterhammer: 'Surge Pressure vs Velocity' };
    chartTitle.textContent = titles[type] || 'Stress Through Wall';
  }
}

function calculatePressureVessels() {
  const pv = state.pressure_vessels;
  const { type, E, nu, sy, ri, t, pi: Pi, po: Po, L, F, v, rho, Kf } = pv;

  const ro = ri + t;   // outer radius
  const tRatio = t / ri;

  let sigma_hoop = 0, sigma_long = 0, sigma_radial_i = 0, sigma_vm = 0;
  let regime = '', extraInfo = '';

  if (type === 'cylinder' || type === 'pipe') {
    // Lamé equations for thick-wall cylinder
    // σ_θ(r) = (pi*ri² - po*ro²)/(ro²-ri²) + (pi-po)*ri²*ro²/((ro²-ri²)*r²)
    // At r = ri (inner wall — max hoop):
    const denom = ro * ro - ri * ri;
    sigma_hoop   = (Pi * ri * ri - Po * ro * ro) / denom + (Pi - Po) * ri * ri * ro * ro / (denom * ri * ri);
    sigma_long   = (Pi * ri * ri - Po * ro * ro) / denom;
    sigma_radial_i = -Pi; // at inner wall, σ_r = -pi (compressive)

    // Thin-wall check: t/ri < 0.1
    if (tRatio < 0.1) {
      // Thin-wall formulas (Barlow)
      sigma_hoop = Pi * ri / t;
      sigma_long = Pi * ri / (2 * t);
      sigma_radial_i = -Pi / 2; // approx
      regime = 'Thin-Wall (t/r < 0.1)';
    } else {
      regime = 'Thick-Wall (Lamé)';
    }

    if (type === 'pipe') {
      // Add bending stress: σ_b = M*c/I where M = F*L/4 (central load), c = ro, I = π(ro⁴-ri⁴)/64
      const M = F * L / 4;   // N·mm (simply supported, central load)
      const I_pipe = Math.PI * (Math.pow(ro, 4) - Math.pow(ri, 4)) / 64;
      const sigma_bend = (M * ro) / I_pipe;
      extraInfo = `Bending stress: ±${sigma_bend.toFixed(1)} MPa (combined with hoop)`;
      // Max combined stress (tension side)
      sigma_hoop += sigma_bend;
    }
  } else if (type === 'sphere') {
    // Thin-wall sphere: σ_hoop = σ_long = p*r/(2t)
    // Thick-wall sphere (Lamé): σ_θ at ri = pi*(ri³+2ro³)/(2*(ro³-ri³)) - po*3*ro³/(2*(ro³-ri³))
    const denom3 = ro * ro * ro - ri * ri * ri;
    if (tRatio < 0.1) {
      sigma_hoop = Pi * ri / (2 * t);
      sigma_long = sigma_hoop;
      sigma_radial_i = -Pi / 2;
      regime = 'Thin-Wall Sphere';
    } else {
      sigma_hoop   = Pi * (ri * ri * ri + 2 * ro * ro * ro) / (2 * denom3) - Po * 3 * ro * ro * ro / (2 * denom3);
      sigma_long   = sigma_hoop;
      sigma_radial_i = -Pi;
      regime = 'Thick-Wall Sphere (Lamé)';
    }
  } else if (type === 'waterhammer') {
    // Wave speed: c_wave = sqrt(Kf/rho) / sqrt(1 + (Kf/E)*(d/t))
    // where d = 2*ri (mean diameter approximation), Kf in Pa, E in Pa
    const Kf_Pa  = Kf * 1e6;
    const E_Pa   = E  * 1e6;
    const c_wave = Math.sqrt(Kf_Pa / rho) / Math.sqrt(1 + (Kf_Pa / E_Pa) * (2 * ri / t));
    // Joukowsky surge: Δp = ρ * c_wave * Δv
    const delta_p = rho * c_wave * v / 1e6;  // MPa
    sigma_hoop   = delta_p * ri / t;          // hoop from surge pressure
    sigma_long   = delta_p * ri / (2 * t);
    sigma_radial_i = -delta_p;
    regime = `Wave speed: ${c_wave.toFixed(0)} m/s`;
    extraInfo = `Surge ΔP = ${delta_p.toFixed(2)} MPa`;
  }

  // Von Mises equivalent stress (plane stress approximation)
  sigma_vm = Math.sqrt(
    sigma_hoop * sigma_hoop
    - sigma_hoop * sigma_long
    + sigma_long * sigma_long
    + 3 * (sigma_radial_i * sigma_radial_i) * 0  // σ_r contribution minor
  );

  const tauMax = (sigma_hoop - sigma_radial_i) / 2;
  const SF = sigma_hoop > 0 ? sy / sigma_hoop : Infinity;

  const fmt = (v, dp = 1) => isFinite(v) ? v.toLocaleString(undefined, { maximumFractionDigits: dp }) : '∞';
  document.getElementById('pv-hoop').textContent   = fmt(sigma_hoop, 1)    + ' MPa';
  document.getElementById('pv-long').textContent   = fmt(sigma_long, 1)    + ' MPa';
  document.getElementById('pv-radial').textContent = fmt(sigma_radial_i, 1)+ ' MPa';
  document.getElementById('pv-shear').textContent  = fmt(tauMax, 1)        + ' MPa';
  document.getElementById('pv-sf').textContent     = isFinite(SF) ? fmt(SF, 2) : '∞';
  document.getElementById('pv-regime').textContent = regime + (extraInfo ? ` | ${extraInfo}` : '');

  // Colour safety factor card
  const sfCard = document.getElementById('pv-sf').closest('.result-metric-card');
  if (sfCard) {
    sfCard.style.borderTop = SF < 1 ? '2px solid var(--danger)' : SF < 2.5 ? '2px solid #f59e0b' : '2px solid #10b981';
  }

  plotPVChart(pv, ri, ro, t, Pi, Po, sigma_hoop, sigma_long, sigma_radial_i, sigma_vm, sy, type, v, rho, Kf);
}

function plotPVChart(pv, ri, ro, t, Pi, Po, sigma_hoop, sigma_long, sigma_radial_i, sigma_vm, sy, type, v, rho, Kf) {
  const ctx = document.getElementById('pvChart').getContext('2d');
  if (!ctx) return;

  const chartType = state.pressure_vessels.activeChart;
  const steps = 60;
  const labels = [], datasets = [];

  if (chartType === 'wall' || type === 'waterhammer') {
    // Stress through wall thickness r: ri → ro
    const hoopVals = [], radVals = [], longVals = [];

    if (type === 'waterhammer') {
      // Show surge pressure vs flow velocity
      const Kf_Pa = Kf * 1e6, E_Pa = pv.E * 1e6;
      const vMax = Math.max(v * 2, 10);
      for (let i = 0; i <= steps; i++) {
        const vi = (vMax * i) / steps;
        labels.push(vi.toFixed(1));
        const c_wave = Math.sqrt(Kf_Pa / rho) / Math.sqrt(1 + (Kf_Pa / E_Pa) * (2 * ri / t));
        hoopVals.push(rho * c_wave * vi / 1e6);
      }
      datasets.push({ label: 'Surge ΔP (MPa)', data: hoopVals, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)', fill: true, borderWidth: 2, pointRadius: 0 });
      datasets.push({ label: `σ_y = ${sy} MPa`, data: Array(steps + 1).fill(sy * t / ri), borderColor: '#10b981', borderDash: [5,4], borderWidth: 1.5, pointRadius: 0, fill: false });
    } else {
      const denom = ro * ro - ri * ri;
      const isSphere = type === 'sphere';
      for (let i = 0; i <= steps; i++) {
        const r = ri + (t * i) / steps;
        labels.push(r.toFixed(1));
        if (isSphere) {
          const denom3 = Math.pow(ro, 3) - Math.pow(ri, 3);
          const sig_t = Pi * Math.pow(ri, 3) * (Math.pow(ro, 3) + 2 * Math.pow(r, 3)) / (2 * denom3 * Math.pow(r, 3));
          const sig_r = Pi * Math.pow(ri, 3) * (Math.pow(ro, 3) - Math.pow(r, 3)) / (denom3 * Math.pow(r, 3)) * -1;
          hoopVals.push(sig_t - Po * Math.pow(ro, 3) * (Math.pow(ri, 3) + 2 * Math.pow(r, 3)) / (2 * denom3 * Math.pow(r, 3)));
          radVals.push(sig_r);
          longVals.push((hoopVals[i] + radVals[i]) / 2);
        } else {
          // Cylinder Lamé
          const A = (Pi * ri * ri - Po * ro * ro) / denom;
          const B = (Pi - Po) * ri * ri * ro * ro / denom;
          hoopVals.push(A + B / (r * r));
          radVals.push(A - B / (r * r));
          longVals.push(A);
        }
      }
      datasets.push({ label: 'Hoop σ_θ (MPa)', data: hoopVals, borderColor: '#00f2fe', backgroundColor: 'rgba(0,242,254,0.08)', fill: true, borderWidth: 2.5, pointRadius: 0 });
      datasets.push({ label: 'Radial σ_r (MPa)', data: radVals, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.06)', fill: true, borderWidth: 2, pointRadius: 0 });
      datasets.push({ label: 'Long σ_L (MPa)', data: longVals, borderColor: '#f59e0b', backgroundColor: 'transparent', borderDash: [5,4], borderWidth: 1.8, pointRadius: 0 });
      datasets.push({ label: `σ_y = ${sy}`, data: Array(steps + 1).fill(sy), borderColor: '#10b981', borderDash: [3,3], borderWidth: 1.2, pointRadius: 0, fill: false });
    }

    if (state.chart) state.chart.destroy();
    state.chart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: true, labels: { color: '#94a3b8', boxWidth: 14 } } },
        scales: {
          x: { title: { display: true, text: type === 'waterhammer' ? 'Flow velocity (m/s)' : 'Radius r (mm)', color: '#94a3b8' }, ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { title: { display: true, text: type === 'waterhammer' ? 'Surge Pressure (MPa)' : 'Stress (MPa)', color: '#94a3b8' }, ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });

  } else if (chartType === 'rating') {
    // Allowable internal pressure vs wall thickness (safety factor = 2.5)
    const SF_target = 2.5;
    const tMax = ri * 0.6;
    for (let i = 1; i <= steps; i++) {
      const ti = (tMax * i) / steps;
      const roi = ri + ti;
      labels.push(ti.toFixed(1));
      // Max allowable Pi for SF = 2.5 using thin/thick rule
      const p_allow = (sy / SF_target) * ti / ri;
      datasets.push && (datasets[0] = datasets[0] || { label: 'Max Allowable p (MPa)', data: [], borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)', fill: true, borderWidth: 2.5, pointRadius: 0 });
      datasets[0].data.push(p_allow);
    }
    datasets.push({ label: 'Operating Pressure', data: Array(steps).fill(Pi), borderColor: '#ef4444', borderDash: [5,4], borderWidth: 1.5, pointRadius: 0, fill: false });

    if (state.chart) state.chart.destroy();
    state.chart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: true, labels: { color: '#94a3b8' } } },
        scales: {
          x: { title: { display: true, text: 'Wall Thickness t (mm)', color: '#94a3b8' }, ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { title: { display: true, text: 'Pressure (MPa)', color: '#94a3b8' }, ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' }, min: 0 }
        }
      }
    });

  } else { // vonmises
    // Von Mises through the wall
    const vmVals = [], rdVals = [];
    const denom = ro * ro - ri * ri;
    for (let i = 0; i <= steps; i++) {
      const r = ri + (t * i) / steps;
      labels.push(r.toFixed(1));
      const A = (Pi * ri * ri - Po * ro * ro) / denom;
      const B = (Pi - Po) * ri * ri * ro * ro / denom;
      const sh = A + B / (r * r);
      const sr = A - B / (r * r);
      const sl = A;
      const vm = Math.sqrt(0.5 * ((sh - sr) ** 2 + (sr - sl) ** 2 + (sl - sh) ** 2));
      vmVals.push(vm);
    }
    datasets.push({ label: 'Von Mises σ_VM (MPa)', data: vmVals, borderColor: '#bd00ff', backgroundColor: 'rgba(189,0,255,0.08)', fill: true, borderWidth: 2.5, pointRadius: 0 });
    datasets.push({ label: `σ_y = ${sy} MPa`, data: Array(steps + 1).fill(sy), borderColor: '#ef4444', borderDash: [5,4], borderWidth: 1.5, pointRadius: 0, fill: false });

    if (state.chart) state.chart.destroy();
    state.chart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: true, labels: { color: '#94a3b8' } } },
        scales: {
          x: { title: { display: true, text: 'Radius r (mm)', color: '#94a3b8' }, ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { title: { display: true, text: 'Von Mises Stress (MPa)', color: '#94a3b8' }, ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' }, min: 0 }
        }
      }
    });
  }
}

// Dynamic Initialization
function initDynamic() {
  const tabs = document.querySelectorAll('#dynamic-tabs .tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.dynamic.activeTab = tab.dataset.dyntype;
      
      document.getElementById('inputs-dynamic-impact').style.display = state.dynamic.activeTab === 'impact' ? 'block' : 'none';
      document.getElementById('inputs-dynamic-frequency').style.display = state.dynamic.activeTab === 'frequency' ? 'block' : 'none';
      runCalculations();
    });
  });

  const freqType = document.getElementById('dyn-freq-type');
  if (freqType) {
    freqType.addEventListener('change', (e) => {
      state.dynamic.frequency.type = e.target.value;
      const isSpring = e.target.value === 'spring';
      document.querySelectorAll('.dyn-beam-input').forEach(el => el.style.display = isSpring ? 'none' : 'block');
      document.querySelectorAll('.dyn-spring-input').forEach(el => el.style.display = isSpring ? 'block' : 'none');
      runCalculations();
    });
  }
}

// Shells Initialization
function initShells() {
  const tabs = document.querySelectorAll('#shell-tabs .tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.shells.activeType = tab.dataset.shelltype;
      
      document.getElementById('shell-cone-angle').style.display = state.shells.activeType === 'conical' ? 'block' : 'none';
      runCalculations();
    });
  });
}

// Curved Beams Initialization
function initCurvedBeams() {
  const sectionSelect = document.getElementById('curved-section');
  if (sectionSelect) {
    sectionSelect.addEventListener('change', (e) => {
      state.curved_beams.section = e.target.value;
      document.getElementById('curved-rect-inputs').style.display = state.curved_beams.section === 'rectangular' ? 'block' : 'none';
      document.getElementById('curved-circ-inputs').style.display = state.curved_beams.section === 'circular' ? 'block' : 'none';
      runCalculations();
    });
  }
}

// ----------------------------------------------------
// UI VALUE UPDATERS
// ----------------------------------------------------
function initUnits() {
  const btnSettings = document.getElementById('btn-open-settings');
  const modal = document.getElementById('settings-modal');
  if(btnSettings && modal) {
    btnSettings.addEventListener('click', () => {
      modal.style.display = 'flex';
    });
  }

  const btnImp = document.getElementById('btn-unit-imperial');
  const btnMet = document.getElementById('btn-unit-metric');
  if(!btnImp) return;
  
  btnImp.addEventListener('click', () => {
    state.unitSystem = 'imperial';
    btnImp.classList.add('active');
    btnMet.classList.remove('active');
    updateUnitLabels();
  });
  
  btnMet.addEventListener('click', () => {
    state.unitSystem = 'metric';
    btnMet.classList.add('active');
    btnImp.classList.remove('active');
    updateUnitLabels();
  });
}

function updateUnitLabels() {
  const isMetric = state.unitSystem === 'metric';
  document.querySelectorAll('.form-input-unit').forEach(el => {
    let t = el.textContent.trim();
    if(isMetric) {
      if(t==='in') el.textContent='mm';
      else if(t==='lbs') el.textContent='N';
      else if(t==='psi') el.textContent='MPa';
      else if(t==='lb-in') el.textContent='N-m';
      else if(t==='in⁴') el.textContent='mm⁴';
    } else {
      if(t==='mm') el.textContent='in';
      else if(t==='N') el.textContent='lbs';
      else if(t==='MPa') el.textContent='psi';
      else if(t==='N-m') el.textContent='lb-in';
      else if(t==='mm⁴') el.textContent='in⁴';
    }
  });
}

// ----------------------------------------------------
// STRESS CONCENTRATION MODULE
// ----------------------------------------------------
function initConcentration() {
  const geomTabs = document.querySelectorAll('#concentration-geometry-tabs .tab-btn');
  geomTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      geomTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.concentration.activeGeometry = tab.dataset.geometry;
      buildConcentrationInputs();
      runCalculations();
    });
  });

  const loadingSelect = document.getElementById('concentration-loading');
  if(loadingSelect) {
    loadingSelect.addEventListener('change', (e) => {
      state.concentration.loading = e.target.value;
      runCalculations();
    });
  }

  // Input listeners
  document.getElementById('concentration-q')?.addEventListener('input', (e) => {
    state.concentration.q = parseFloat(e.target.value) || 0;
    runCalculations();
  });

  buildConcentrationInputs();
}

function createInputGroup(labelText, inputId, inputValue, unitText) {
  const group = document.createElement('div');
  group.className = 'form-group';
  
  const label = document.createElement('label');
  label.className = 'form-label';
  label.textContent = labelText;
  group.appendChild(label);
  
  const container = document.createElement('div');
  container.className = 'input-with-unit';
  
  const input = document.createElement('input');
  input.type = 'number';
  input.id = inputId;
  input.value = inputValue;
  input.className = 'form-input';
  container.appendChild(input);
  
  const unit = document.createElement('span');
  unit.className = 'form-input-unit';
  unit.textContent = unitText;
  container.appendChild(unit);
  
  group.appendChild(container);
  return group;
}

function buildConcentrationInputs() {
  const container = document.getElementById('concentration-inputs-container');
  const loading = document.getElementById('concentration-loading');
  const geom = state.concentration.activeGeometry;
  
  if(!container) return;

  const optTorsion = document.getElementById('conc-opt-torsion');
  if(optTorsion) {
    if(geom === 'hole') {
      optTorsion.style.display = 'none';
      if(loading.value === 'torsion') {
        loading.value = 'axial';
        state.concentration.loading = 'axial';
      }
    } else {
      optTorsion.style.display = 'block';
    }
  }

  container.innerHTML = ''; // clear safely
  const isMetric = state.unitSystem === 'metric';
  const lenUnit = isMetric ? 'mm' : 'in';

  if (geom === 'hole') {
    container.appendChild(createInputGroup('Plate Width (D)', 'conc-D', state.concentration.D, lenUnit));
    container.appendChild(createInputGroup('Hole Diameter (d)', 'conc-d', state.concentration.d, lenUnit));
    container.appendChild(createInputGroup('Thickness (t)', 'conc-t', state.concentration.t, lenUnit));
  } else {
    container.appendChild(createInputGroup('Large Diameter (D)', 'conc-D', state.concentration.D, lenUnit));
    container.appendChild(createInputGroup('Small Diameter (d)', 'conc-d', state.concentration.d, lenUnit));
    container.appendChild(createInputGroup(geom === 'fillet' ? 'Fillet Radius (r)' : 'Notch Radius (r)', 'conc-r', state.concentration.r, lenUnit));
  }

  if (state.concentration.loading === 'axial') {
    container.appendChild(createInputGroup('Axial Load (P)', 'conc-P', state.concentration.P, isMetric ? 'N' : 'lbs'));
  } else if (state.concentration.loading === 'bending') {
    container.appendChild(createInputGroup('Bending Moment (M)', 'conc-M', state.concentration.M, isMetric ? 'N-m' : 'lb-in'));
  } else if (state.concentration.loading === 'torsion') {
    container.appendChild(createInputGroup('Torsional Moment (T)', 'conc-T', state.concentration.T, isMetric ? 'N-m' : 'lb-in'));
  }

  // Add listeners
  ['D', 'd', 't', 'r', 'P', 'M', 'T'].forEach(param => {
    const el = document.getElementById('conc-' + param);
    if(el) {
      el.addEventListener('input', (e) => {
        state.concentration[param] = parseFloat(e.target.value) || 0;
        runCalculations();
      });
    }
  });
}

function calculateConcentration() {
  const st = state.concentration;
  const isMetric = state.unitSystem === 'metric';
  let Kt = 1.0;
  let sigma_nom = 0;
  
  const D = st.D;
  const d = st.d;
  const r = st.r || 0.001; // prevent div by zero
  
  if (st.activeGeometry === 'hole') {
    const w = D;
    const a = d/2;
    // Approximated Howland's equation for plate with central hole
    if (st.loading === 'axial') {
      const dw = d/w;
      Kt = 3.0 - 3.13*dw + 3.66*Math.pow(dw, 2) - 1.53*Math.pow(dw, 3);
      const A_net = (w - d) * st.t;
      sigma_nom = st.P / A_net;
    } else if (st.loading === 'bending') {
      const dw = d/w;
      Kt = 2.0 + Math.pow(1-dw, 3);
      const I_net = (st.t * Math.pow(w, 3) / 12) - (st.t * Math.pow(d, 3) / 12);
      const c = w/2;
      // unit correction
      const M_corr = isMetric ? st.M * 1000 : st.M; // N-m to N-mm
      sigma_nom = (M_corr * c) / I_net;
    }
  } else if (st.activeGeometry === 'fillet') {
    const Dd = D/d;
    const rd = r/d;
    if (st.loading === 'axial') {
      Kt = Math.max(1, 1 + 1.5 * Math.pow(rd, -0.4) * (1 - Math.exp(-0.5*(Dd-1))));
      const A_net = Math.PI * Math.pow(d, 2) / 4;
      sigma_nom = st.P / A_net;
    } else if (st.loading === 'bending') {
      Kt = Math.max(1, 1 + 1.2 * Math.pow(rd, -0.4) * (1 - Math.exp(-0.5*(Dd-1))));
      const I_net = Math.PI * Math.pow(d, 4) / 64;
      const c = d/2;
      const M_corr = isMetric ? st.M * 1000 : st.M;
      sigma_nom = (M_corr * c) / I_net;
    } else if (st.loading === 'torsion') {
      Kt = Math.max(1, 1 + 0.8 * Math.pow(rd, -0.4) * (1 - Math.exp(-0.5*(Dd-1))));
      const J_net = Math.PI * Math.pow(d, 4) / 32;
      const c = d/2;
      const T_corr = isMetric ? st.T * 1000 : st.T;
      sigma_nom = (T_corr * c) / J_net;
    }
  } else if (st.activeGeometry === 'notch') {
    const Dd = D/d;
    const rd = r/d;
    if (st.loading === 'axial') {
      Kt = Math.max(1, 1 + 2.0 * Math.pow(rd, -0.5) * (1 - Math.exp(-0.5*(Dd-1))));
      const A_net = Math.PI * Math.pow(d, 2) / 4;
      sigma_nom = st.P / A_net;
    } else if (st.loading === 'bending') {
      Kt = Math.max(1, 1 + 2.0 * Math.pow(rd, -0.5) * (1 - Math.exp(-0.5*(Dd-1))));
      const I_net = Math.PI * Math.pow(d, 4) / 64;
      const c = d/2;
      const M_corr = isMetric ? st.M * 1000 : st.M;
      sigma_nom = (M_corr * c) / I_net;
    } else if (st.loading === 'torsion') {
      Kt = Math.max(1, 1 + 1.2 * Math.pow(rd, -0.5) * (1 - Math.exp(-0.5*(Dd-1))));
      const J_net = Math.PI * Math.pow(d, 4) / 32;
      const c = d/2;
      const T_corr = isMetric ? st.T * 1000 : st.T;
      sigma_nom = (T_corr * c) / J_net;
    }
  }

  // Fatigue Factor Kf = 1 + q(Kt - 1)
  const Kf = 1 + st.q * (Kt - 1);
  const sigma_max = Kt * sigma_nom;

  // Update UI
  document.getElementById('res-concentration-kt').textContent = Kt.toFixed(2);
  document.getElementById('res-concentration-kf').textContent = Kf.toFixed(2);
  
  const unit = (st.loading === 'torsion') ? (isMetric ? 'MPa' : 'psi') : (isMetric ? 'MPa' : 'psi');
  document.getElementById('res-concentration-stress').textContent = sigma_max.toFixed(1) + ' ' + unit;

  drawConcentrationChart(Kt, st.activeGeometry, st.loading);
}

function drawConcentrationChart(currentKt, geom, loading) {
  if (state.chart) {
    state.chart.destroy();
  }

  const ctx = document.getElementById('concentrationChart').getContext('2d');
  
  const xVals = [];
  const yVals = [];
  
  let currentX = 0.1;
  const st = state.concentration;

  if (geom === 'hole') {
    const w = st.D;
    currentX = st.d / w;
    for(let i = 0.05; i <= 0.8; i+=0.05) {
      xVals.push(i.toFixed(2));
      let y = 1;
      if (loading === 'axial') {
        y = 3.0 - 3.13*i + 3.66*Math.pow(i, 2) - 1.53*Math.pow(i, 3);
      } else {
        y = 2.0 + Math.pow(1-i, 3);
      }
      yVals.push(y);
    }
  } else {
    const Dd = st.D / st.d;
    currentX = st.r / st.d;
    for(let i = 0.01; i <= 0.3; i+=0.01) {
      xVals.push(i.toFixed(2));
      let y = 1;
      let rd = i;
      if (geom === 'fillet') {
        if (loading === 'axial') y = Math.max(1, 1 + 1.5 * Math.pow(rd, -0.4) * (1 - Math.exp(-0.5*(Dd-1))));
        else if (loading === 'bending') y = Math.max(1, 1 + 1.2 * Math.pow(rd, -0.4) * (1 - Math.exp(-0.5*(Dd-1))));
        else y = Math.max(1, 1 + 0.8 * Math.pow(rd, -0.4) * (1 - Math.exp(-0.5*(Dd-1))));
      } else {
        if (loading === 'axial') y = Math.max(1, 1 + 2.0 * Math.pow(rd, -0.5) * (1 - Math.exp(-0.5*(Dd-1))));
        else if (loading === 'bending') y = Math.max(1, 1 + 2.0 * Math.pow(rd, -0.5) * (1 - Math.exp(-0.5*(Dd-1))));
        else y = Math.max(1, 1 + 1.2 * Math.pow(rd, -0.5) * (1 - Math.exp(-0.5*(Dd-1))));
      }
      yVals.push(y);
    }
  }

  state.chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: xVals,
      datasets: [
        {
          label: 'Theoretical Kt',
          data: yVals,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0
        },
        {
          label: 'Current Geometry',
          data: xVals.map(x => Math.abs(parseFloat(x) - currentX) < 0.015 ? currentKt : null),
          borderColor: '#ef4444',
          backgroundColor: '#ef4444',
          pointRadius: 5,
          pointStyle: 'circle',
          showLine: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#e2e8f0' } }
      },
      scales: {
        x: { title: { display: true, text: geom==='hole'?'Hole Ratio (d/D)':'Fillet/Notch Ratio (r/d)', color: '#94a3b8' }, ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { title: { display: true, text: 'Kt Factor', color: '#94a3b8' }, ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });
}

// ----------------------------------------------------
// BUCKLING MODULE
// ----------------------------------------------------
function initBuckling() {
  const geomTabs = document.querySelectorAll('#buckling-geometry-tabs .tab-btn');
  geomTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      geomTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.buckling.activeGeometry = tab.dataset.geometry;
      buildBucklingInputs();
      runCalculations();
    });
  });

  // Global material inputs
  ['E', 'v'].forEach(param => {
    const el = document.getElementById('buckling-' + param);
    if(el) {
      el.addEventListener('input', (e) => {
        state.buckling[param] = parseFloat(e.target.value) || 0;
        runCalculations();
      });
    }
  });

  buildBucklingInputs();
}

function createSelectGroup(labelText, selectId, options) {
  const group = document.createElement('div');
  group.className = 'form-group';
  
  const label = document.createElement('label');
  label.className = 'form-label';
  label.textContent = labelText;
  group.appendChild(label);
  
  const select = document.createElement('select');
  select.id = selectId;
  select.className = 'form-input';
  
  options.forEach(opt => {
    const o = document.createElement('option');
    o.value = opt.value;
    o.textContent = opt.text;
    if (opt.selected) o.selected = true;
    select.appendChild(o);
  });
  
  group.appendChild(select);
  return group;
}

function buildBucklingInputs() {
  const container = document.getElementById('buckling-inputs-container');
  const geom = state.buckling.activeGeometry;
  if (!container) return;

  container.innerHTML = ''; // safely clear

  const isMetric = state.unitSystem === 'metric';
  const lenUnit = isMetric ? 'mm' : 'in';

  if (geom === 'rect_plate') {
    container.appendChild(createSelectGroup('Edge Support Condition', 'buckling-edge', [
      {value: 'ss', text: 'All Edges Simply Supported', selected: state.buckling.edgeCondition === 'ss'},
      {value: 'clamped', text: 'All Edges Clamped', selected: state.buckling.edgeCondition === 'clamped'}
    ]));
    container.appendChild(createInputGroup('Loaded Length (a)', 'buckling-a', state.buckling.a, lenUnit));
    container.appendChild(createInputGroup('Width (b)', 'buckling-b', state.buckling.b, lenUnit));
    container.appendChild(createInputGroup('Thickness (t)', 'buckling-t', state.buckling.t, lenUnit));
  } else if (geom === 'circ_plate') {
    container.appendChild(createSelectGroup('Edge Support Condition', 'buckling-edge', [
      {value: 'ss', text: 'Simply Supported Edge', selected: state.buckling.edgeCondition === 'ss'},
      {value: 'clamped', text: 'Clamped Edge', selected: state.buckling.edgeCondition === 'clamped'}
    ]));
    container.appendChild(createInputGroup('Radius (R)', 'buckling-R', state.buckling.R, lenUnit));
    container.appendChild(createInputGroup('Thickness (t)', 'buckling-t', state.buckling.t, lenUnit));
  } else if (geom === 'thin_shell') {
    container.appendChild(createSelectGroup('Shell Type & Loading', 'buckling-shellType', [
      {value: 'cylinder_axial', text: 'Cylinder (Axial Compression)', selected: state.buckling.shellType === 'cylinder_axial'},
      {value: 'cylinder_radial', text: 'Cylinder (External Pressure)', selected: state.buckling.shellType === 'cylinder_radial'},
      {value: 'sphere', text: 'Sphere (External Pressure)', selected: state.buckling.shellType === 'sphere'}
    ]));
    container.appendChild(createInputGroup('Radius (R)', 'buckling-R', state.buckling.R, lenUnit));
    container.appendChild(createInputGroup('Thickness (t)', 'buckling-t', state.buckling.t, lenUnit));
  }

  ['a', 'b', 't', 'R'].forEach(param => {
    const el = document.getElementById('buckling-' + param);
    if(el) {
      el.addEventListener('input', (e) => {
        state.buckling[param] = parseFloat(e.target.value) || 0;
        runCalculations();
      });
    }
  });

  const edgeSelect = document.getElementById('buckling-edge');
  if(edgeSelect) {
    edgeSelect.addEventListener('change', (e) => {
      state.buckling.edgeCondition = e.target.value;
      runCalculations();
    });
  }

  const shellSelect = document.getElementById('buckling-shellType');
  if(shellSelect) {
    shellSelect.addEventListener('change', (e) => {
      state.buckling.shellType = e.target.value;
      runCalculations();
    });
  }
}

function calculateBuckling() {
  const st = state.buckling;
  const isMetric = state.unitSystem === 'metric';
  let sigma_cr = 0;
  let load_cr = 0; 
  
  const E = st.E;
  const v = st.v;
  const geom = st.activeGeometry;

  if (geom === 'rect_plate') {
    const a = st.a || 0.001;
    const b = st.b || 0.001;
    const t = st.t;
    const ratio = a/b;
    
    let K = 0;
    if (st.edgeCondition === 'ss') {
      let minK = Infinity;
      for (let m = 1; m <= 10; m++) {
        let k_val = (Math.PI*Math.PI / 12) * Math.pow((m/ratio + ratio/m), 2);
        if (k_val < minK) minK = k_val;
      }
      K = minK;
    } else {
      K = (Math.PI*Math.PI / 12) * Math.pow((1.5/ratio + ratio/1.5), 2); 
      if (ratio > 2) K = 7.0; 
    }

    sigma_cr = K * E / (1 - v*v) * Math.pow(t/b, 2);
    load_cr = sigma_cr * (b * t); 
    
  } else if (geom === 'circ_plate') {
    const R = st.R || 0.001;
    const t = st.t;
    
    let K = 0;
    if (st.edgeCondition === 'ss') {
      K = 4.2 * (Math.PI*Math.PI / 12); 
    } else {
      K = 14.68 * (Math.PI*Math.PI / 12);
    }
    
    sigma_cr = K * E / (1 - v*v) * Math.pow(t/R, 2);
    load_cr = sigma_cr * t; 
    
  } else if (geom === 'thin_shell') {
    const R = st.R || 0.001;
    const t = st.t;

    if (st.shellType === 'cylinder_axial') {
      sigma_cr = (E / Math.sqrt(3 * (1 - v*v))) * (t/R);
      load_cr = sigma_cr * (2 * Math.PI * R * t);
    } else if (st.shellType === 'cylinder_radial') {
      const p_cr = (E / (4 * (1 - v*v))) * Math.pow(t/R, 3);
      load_cr = p_cr;
      sigma_cr = p_cr * R / t;
    } else if (st.shellType === 'sphere') {
      const p_cr = (2 * E / Math.sqrt(3 * (1 - v*v))) * Math.pow(t/R, 2);
      load_cr = p_cr;
      sigma_cr = p_cr * R / (2 * t);
    }
  }

  const stressUnit = isMetric ? 'MPa' : 'psi';
  let loadUnit = isMetric ? 'N' : 'lbs';
  if (geom === 'circ_plate') loadUnit = isMetric ? 'N/mm' : 'lbs/in';
  if (geom === 'thin_shell' && st.shellType !== 'cylinder_axial') loadUnit = stressUnit; 

  document.getElementById('res-buckling-stress').textContent = formatNumber(sigma_cr) + ' ' + stressUnit;
  document.getElementById('res-buckling-load').textContent = formatNumber(load_cr) + ' ' + loadUnit;

  drawBucklingChart(geom, E, v, st);
}

function drawBucklingChart(geom, E, v, st) {
  if (state.chart) state.chart.destroy();

  const ctx = document.getElementById('bucklingChart').getContext('2d');
  const xVals = [];
  const yVals = [];

  let xLabel = 'Thickness Ratio (t/b or t/R)';
  const currentRatio = geom === 'rect_plate' ? (st.t / st.b) : (st.t / st.R);

  for (let i = 0.005; i <= 0.05; i += 0.005) {
    xVals.push(i.toFixed(3));
    let y = 0;
    
    if (geom === 'rect_plate') {
      const ratio = st.a / st.b;
      let K = 0;
      if (st.edgeCondition === 'ss') {
        let minK = Infinity;
        for (let m = 1; m <= 10; m++) {
          let k_val = (Math.PI*Math.PI / 12) * Math.pow((m/ratio + ratio/m), 2);
          if (k_val < minK) minK = k_val;
        }
        K = minK;
      } else {
        K = (Math.PI*Math.PI / 12) * Math.pow((1.5/ratio + ratio/1.5), 2);
        if (ratio > 2) K = 7.0;
      }
      y = K * E / (1 - v*v) * Math.pow(i, 2);
    } else if (geom === 'circ_plate') {
      let K = st.edgeCondition === 'ss' ? 4.2 * (Math.PI*Math.PI / 12) : 14.68 * (Math.PI*Math.PI / 12);
      y = K * E / (1 - v*v) * Math.pow(i, 2);
    } else if (geom === 'thin_shell') {
      if (st.shellType === 'cylinder_axial') {
        y = (E / Math.sqrt(3 * (1 - v*v))) * i;
      } else if (st.shellType === 'cylinder_radial') {
        let p_cr = (E / (4 * (1 - v*v))) * Math.pow(i, 3);
        y = p_cr * st.R / (st.R * i); 
      } else {
        let p_cr = (2 * E / Math.sqrt(3 * (1 - v*v))) * Math.pow(i, 2);
        y = p_cr * st.R / (2 * st.R * i);
      }
    }
    yVals.push(y);
  }

  const actualY = parseFloat(document.getElementById('res-buckling-stress').textContent);

  state.chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: xVals,
      datasets: [
        {
          label: 'Critical Stress Curve',
          data: yVals,
          borderColor: '#007aff',
          backgroundColor: 'rgba(0, 122, 255, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0
        },
        {
          label: 'Current Setup',
          data: xVals.map(x => Math.abs(parseFloat(x) - currentRatio) < 0.003 ? actualY : null),
          borderColor: '#ef4444',
          backgroundColor: '#ef4444',
          pointRadius: 6,
          pointStyle: 'circle',
          showLine: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#a1a1aa' } }
      },
      scales: {
        x: { title: { display: true, text: xLabel, color: '#a1a1aa' }, ticks: { color: '#71717a' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { title: { display: true, text: 'Critical Stress', color: '#a1a1aa' }, ticks: { color: '#71717a' }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });
}

// ----------------------------------------------------
// DYNAMIC LOADS ENGINE
// ----------------------------------------------------
function calculateDynamic() {
  const isMetric = state.unitSystem === 'metric';
  const g = isMetric ? 9806.65 : 386.088; // gravity in mm/s^2 or in/s^2

  if (state.dynamic.activeTab === 'impact') {
    const W = parseFloat(document.getElementById('dyn-w').value);
    const h = parseFloat(document.getElementById('dyn-h').value);
    const k = parseFloat(document.getElementById('dyn-k').value);

    let y_st = W / k;
    let n = 1;
    if (y_st > 0) {
      n = 1 + Math.sqrt(1 + (2 * h) / y_st);
    }

    const y_dyn = y_st * n;
    const F_dyn = W * n;

    document.getElementById('dyn-res-1-val').textContent = n.toFixed(2);
    document.getElementById('dyn-res-2-val').textContent = formatVal(y_dyn);
    document.getElementById('dyn-res-3-val').textContent = formatVal(F_dyn);

    document.getElementById('dyn-res-1-label').textContent = 'Impact Factor (n)';
    document.getElementById('dyn-res-2-label').textContent = 'Dynamic Deflection';
    document.getElementById('dyn-res-3-label').textContent = 'Dynamic Load (F)';
  } else {
    const type = state.dynamic.frequency.type;
    const W = parseFloat(document.getElementById('dyn-freq-w').value);
    let k_eff = 0;

    if (type === 'spring') {
      k_eff = parseFloat(document.getElementById('dyn-freq-k').value);
    } else {
      const L = parseFloat(document.getElementById('dyn-freq-l').value);
      const E = parseFloat(document.getElementById('dyn-freq-e').value);
      const I = parseFloat(document.getElementById('dyn-freq-i').value);
      if (type === 'cantilever') k_eff = (3 * E * I) / Math.pow(L, 3);
      if (type === 'simply_supported') k_eff = (48 * E * I) / Math.pow(L, 3);
    }

    const mass = W / g;
    let fn = 0;
    if (mass > 0 && k_eff > 0) {
      fn = (1 / (2 * Math.PI)) * Math.sqrt(k_eff / mass);
    }

    document.getElementById('dyn-res-1-val').textContent = formatVal(k_eff);
    document.getElementById('dyn-res-2-val').textContent = formatVal(mass);
    document.getElementById('dyn-res-3-val').textContent = fn.toFixed(2) + ' Hz';

    document.getElementById('dyn-res-1-label').textContent = 'Effective Stiffness (k)';
    document.getElementById('dyn-res-2-label').textContent = 'System Mass';
    document.getElementById('dyn-res-3-label').textContent = 'Natural Frequency (fn)';
  }
}

// ----------------------------------------------------
// SHELLS OF REVOLUTION ENGINE
// ----------------------------------------------------
function calculateShells() {
  const type = state.shells.activeType;
  const p = parseFloat(document.getElementById('shell-p').value);
  const r = parseFloat(document.getElementById('shell-r').value);
  const t = parseFloat(document.getElementById('shell-t').value);

  let s1 = 0; // meridional/longitudinal
  let s2 = 0; // hoop

  if (type === 'spherical') {
    s1 = (p * r) / (2 * t);
    s2 = s1;
  } else if (type === 'cylindrical') {
    s1 = (p * r) / (2 * t);
    s2 = (p * r) / t;
  } else if (type === 'conical') {
    const alpha = parseFloat(document.getElementById('shell-alpha').value) * Math.PI / 180;
    const cosA = Math.cos(alpha);
    s1 = (p * r) / (2 * t * cosA);
    s2 = (p * r) / (t * cosA);
  }

  document.getElementById('shell-res-1-val').textContent = formatVal(s1);
  document.getElementById('shell-res-2-val').textContent = formatVal(s2);
}

// ----------------------------------------------------
// CURVED BEAMS ENGINE
// ----------------------------------------------------
function calculateCurvedBeams() {
  const section = state.curved_beams.section;
  const rbar = parseFloat(document.getElementById('curved-rbar').value);
  const M = parseFloat(document.getElementById('curved-m').value);
  const P = parseFloat(document.getElementById('curved-p').value);

  let A = 0;
  let R = 0;
  let ci = 0; // distance to inner fiber
  let co = 0; // distance to outer fiber

  if (section === 'rectangular') {
    const b = parseFloat(document.getElementById('curved-b').value);
    const h = parseFloat(document.getElementById('curved-h').value);
    A = b * h;
    ci = h / 2;
    co = h / 2;
    // Roark: R = h / ln((rbar + h/2)/(rbar - h/2))
    R = h / Math.log((rbar + ci) / (rbar - ci));
  } else if (section === 'circular') {
    const d = parseFloat(document.getElementById('curved-d').value);
    const c = d / 2;
    A = Math.PI * Math.pow(c, 2);
    ci = c;
    co = c;
    // Roark: R = (rbar + sqrt(rbar^2 - c^2)) / 2
    R = (rbar + Math.sqrt(Math.pow(rbar, 2) - Math.pow(c, 2))) / 2;
  }

  const e = rbar - R;
  
  // Stresses: sigma = P/A + (M / (A * e)) * (y / (R + y))
  // Inner fiber: y = -ci
  const stressInner = (P / A) + (M / (A * e)) * (-ci / (R - ci));
  // Outer fiber: y = +co
  const stressOuter = (P / A) + (M / (A * e)) * (co / (R + co));

  document.getElementById('curved-res-a').textContent = formatVal(A);
  document.getElementById('curved-res-R').textContent = formatVal(R);
  document.getElementById('curved-res-e').textContent = formatVal(e);
  document.getElementById('curved-res-inner').textContent = formatVal(stressInner);
  document.getElementById('curved-res-outer').textContent = formatVal(stressOuter);
}
