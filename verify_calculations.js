// Verification script for Roark's Stress & Strain expanded plate and beam formulas

function testCircularPlates() {
  const v = 0.3;
  const a = 10.0;
  const b = 5.0;
  const r = 6.0;
  const ro = 7.0;
  const t = 0.25;
  const q = 5.0;
  const E = 29000000;

  const F1 = ((1 + v) / 2) * (b / r) * Math.log(r / b) + ((1 - v) / 4) * (r / b - b / r);
  const C1 = ((1 + v) / 2) * (b / a) * Math.log(a / b) + ((1 - v) / 4) * (a / b - b / a);
  const L1 = ((1 + v) / 2) * (ro / a);
  const L11 = (1 / 64) * (1 + 4 * Math.pow(ro / a, 2) - 5 * Math.pow(ro / a, 4) - 4 * Math.pow(ro / a, 2) * (2 + Math.pow(ro / a, 2)) * Math.log(a / ro));

  const D = (E * Math.pow(t, 3)) / (12 * (1 - v * v));
  
  let yMax_clamped = (q * Math.pow(a, 4)) / (64 * D);
  let sMax_clamped = (3 * q * Math.pow(a, 2)) / (4 * t * t);

  const ratio = b / a;
  yMax_clamped *= Math.pow(1 - ratio, 3);
  sMax_clamped *= (1 - ratio);

  console.log("--- Circular & Annular Plates test ---");
  console.log("F1 (expected 0.162924):", F1.toFixed(6));
  console.log("C1 (expected 0.487773):", C1.toFixed(6));
  console.log("D rigidity (expected 41495.0):", D.toFixed(1));
  console.log("Annular Clamped yMax (expected 0.002353):", yMax_clamped.toFixed(6));
}

function testRectangularPlates() {
  const v = 0.3;
  const a = 15.0;
  const b = 10.0;
  const t = 0.25;
  const q = 5.0;
  const E = 29000000;
  const ratio = a / b;

  const alpha_ss = 0.0770 + ((1.5 - 1.4) / (1.6 - 1.4)) * (0.0906 - 0.0770);
  const beta_ss = 0.4530 + ((1.5 - 1.4) / (1.6 - 1.4)) * (0.5172 - 0.4530);

  const yMax_ss = (alpha_ss * q * Math.pow(b, 4)) / (E * Math.pow(t, 3));
  const sMax_ss = (beta_ss * q * Math.pow(b, 2)) / (t * t);

  console.log("\n--- Rectangular Plates (Simply Supported) test ---");
  console.log(`yMax (expected 0.009247): ${yMax_ss.toFixed(6)}`);
  console.log(`sMax (expected 3880.8): ${sMax_ss.toFixed(1)}`);
}

function testBeams() {
  const L = 120;
  const P = 1000;
  const E = 29000000;
  const I = 15.5;

  const maxDeflection = (P * Math.pow(L, 3)) / (48 * E * I);
  const maxMoment = (P * L) / 4;

  // Shear Force at x = 30 (x < L/2)
  const shear_left = P / 2;
  // Shear Force at x = 90 (x > L/2)
  const shear_right = -P / 2;

  console.log("\n--- Straight Beams test ---");
  console.log(`Max Deflection (expected 0.079737): ${maxDeflection.toFixed(6)}`);
  console.log(`Max Bending Moment (expected 30000): ${maxMoment}`);
  console.log(`Shear force at x < L/2 (expected 500): ${shear_left}`);
  console.log(`Shear force at x > L/2 (expected -500): ${shear_right}`);
}

testCircularPlates();
testRectangularPlates();
testBeams();
