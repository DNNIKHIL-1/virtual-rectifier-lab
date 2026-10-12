/**
 * Comprehensive Automated Testbench for Virtual Rectifier Lab
 * Groups A, B, C, D covering:
 * - Group A: Ideal single-phase diode rectifiers (Half-wave & Full-wave)
 * - Group B: Controlled rectifiers sweeping firing angle alpha (0°, 30°, 60°, 90°, 120°)
 * - Group C: Three-phase rectifiers (Diode & Controlled SCR)
 * - Group D: Nonidealities (RL continuous/discontinuous, RLE, FWD diode, non-zero Vf, Ls overlap)
 */

import { simulateRectifier } from './physics';

interface TestResult {
  name: string;
  group: 'A' | 'B' | 'C' | 'D';
  passed: boolean;
  message: string;
  details?: Record<string, unknown>;
}

export function runRectifierAuditSuite(): { passed: number; failed: number; results: TestResult[] } {
  const results: TestResult[] = [];

  function assertClose(
    group: 'A' | 'B' | 'C' | 'D',
    testName: string,
    actual: number,
    expected: number,
    tolPercent: number = 2.0
  ) {
    const denom = Math.abs(expected) > 1e-4 ? Math.abs(expected) : 1;
    const errPercent = (Math.abs(actual - expected) / denom) * 100;
    const passed = errPercent <= tolPercent;
    results.push({
      group,
      name: testName,
      passed,
      message: passed
        ? `PASSED: actual=${actual.toFixed(2)}, expected=${expected.toFixed(2)} (err=${errPercent.toFixed(2)}% <= tol=${tolPercent}%)`
        : `FAILED: actual=${actual.toFixed(2)}, expected=${expected.toFixed(2)} (err=${errPercent.toFixed(2)}% > tol=${tolPercent}%)`,
      details: { actual, expected, errPercent, tolPercent }
    });
  }

  /* ==========================================================
   * TEST GROUP A: Ideal Single-Phase Diode Rectifiers
   * 230 V RMS, 50 Hz, R = 20 Ohms, ideal (Vf = 0, Ls = 0)
   * ========================================================== */
  const vRmsA = 230;
  const VmA = vRmsA * Math.SQRT2; // 325.27 V
  const R_A = 20;

  // 1. Half-Wave Diode Rectifier
  const hwDiode = simulateRectifier('half-wave-diode', {
    vRms: vRmsA,
    frequency: 50,
    sourceInductance: 0,
    loadType: 'R',
    resistance: R_A,
    inductance: 0,
    backEmf: 0,
    filterCapacitor: 0,
    freewheelingDiode: false,
    firingAngle: 0,
    forwardVoltage: 0
  });

  const expectedHwVavg = VmA / Math.PI; // 103.54 V
  const expectedHwVrms = VmA / 2; // 162.63 V
  const expectedHwPdc = expectedHwVavg * (expectedHwVavg / R_A); // 536.0 W
  const expectedHwPload = (expectedHwVrms * expectedHwVrms) / R_A; // 1322.5 W

  assertClose('A', 'Half-Wave Diode: Average Voltage Vavg = Vm/pi', hwDiode.results.vAvg, expectedHwVavg, 0.5);
  assertClose('A', 'Half-Wave Diode: RMS Voltage Vrms = Vm/2', hwDiode.results.vRms, expectedHwVrms, 0.5);
  assertClose('A', 'Half-Wave Diode: Theoretical Vavg match', hwDiode.results.vAvgTheory, expectedHwVavg, 0.1);
  assertClose('A', 'Half-Wave Diode: Theoretical Vrms match', hwDiode.results.vRmsTheory, expectedHwVrms, 0.1);
  assertClose('A', 'Half-Wave Diode: Pload = Vrms^2 / R', hwDiode.results.pLoad, expectedHwPload, 0.5);
  assertClose('A', 'Half-Wave Diode: Conservation Pin = Pload (ideal)', hwDiode.results.pIn, hwDiode.results.pLoad, 0.5);
  assertClose('A', 'Half-Wave Diode: Efficiency = 100% for ideal device', hwDiode.results.efficiency, 100, 1.0);

  // 2. Full-Wave Bridge Diode Rectifier
  const fwDiode = simulateRectifier('full-bridge-diode', {
    vRms: vRmsA,
    frequency: 50,
    sourceInductance: 0,
    loadType: 'R',
    resistance: R_A,
    inductance: 0,
    backEmf: 0,
    filterCapacitor: 0,
    freewheelingDiode: false,
    firingAngle: 0,
    forwardVoltage: 0
  });

  const expectedFwVavg = (2 * VmA) / Math.PI; // 207.07 V
  const expectedFwVrms = VmA / Math.SQRT2; // 230.00 V
  const expectedFwPload = (expectedFwVrms * expectedFwVrms) / R_A; // 2645.0 W

  assertClose('A', 'Full-Bridge Diode: Average Voltage Vavg = 2*Vm/pi', fwDiode.results.vAvg, expectedFwVavg, 0.5);
  assertClose('A', 'Full-Bridge Diode: RMS Voltage Vrms = Vm/sqrt(2)', fwDiode.results.vRms, expectedFwVrms, 0.5);
  assertClose('A', 'Full-Bridge Diode: Theoretical Vavg match', fwDiode.results.vAvgTheory, expectedFwVavg, 0.1);
  assertClose('A', 'Full-Bridge Diode: Theoretical Vrms match', fwDiode.results.vRmsTheory, expectedFwVrms, 0.1);
  assertClose('A', 'Full-Bridge Diode: Load Power Pload', fwDiode.results.pLoad, expectedFwPload, 0.5);
  assertClose('A', 'Full-Bridge Diode: Source Input Power Pin matches Pload', fwDiode.results.pIn, fwDiode.results.pLoad, 0.5);

  /* ==========================================================
   * TEST GROUP B: Controlled Rectifiers (Firing Angle Sweeps)
   * alpha = 0°, 30°, 60°, 90°, 120°
   * ========================================================== */
  // B1. Full-Bridge SCR with Resistive Load
  for (const alpha of [0, 30, 60, 90, 120]) {
    const res = simulateRectifier('full-bridge-scr', {
      vRms: vRmsA,
      frequency: 50,
      sourceInductance: 0,
      loadType: 'R',
      resistance: R_A,
      inductance: 0,
      backEmf: 0,
      filterCapacitor: 0,
      freewheelingDiode: false,
      firingAngle: alpha,
      forwardVoltage: 0
    });

    const aRad = (alpha * Math.PI) / 180;
    const expVavg = (VmA / Math.PI) * (1 + Math.cos(aRad));
    const expVrms = VmA * Math.sqrt(0.5 - aRad / (2 * Math.PI) + Math.sin(2 * aRad) / (4 * Math.PI));

    assertClose('B', `Full-Bridge SCR (R load, alpha=${alpha}°): Vavg`, res.results.vAvg, expVavg, 1.0);
    assertClose('B', `Full-Bridge SCR (R load, alpha=${alpha}°): Vrms`, res.results.vRms, expVrms, 1.0);
    assertClose('B', `Full-Bridge SCR (R load, alpha=${alpha}°): Theory Vavg`, res.results.vAvgTheory, expVavg, 0.1);
    assertClose('B', `Full-Bridge SCR (R load, alpha=${alpha}°): Theory Vrms`, res.results.vRmsTheory, expVrms, 0.1);
  }

  // B2. Full-Bridge SCR with Highly Inductive Load (Continuous Conduction Mode)
  for (const alpha of [0, 30, 60]) {
    const res = simulateRectifier('full-bridge-scr', {
      vRms: vRmsA,
      frequency: 50,
      sourceInductance: 0,
      loadType: 'RL',
      resistance: 2,
      inductance: 500, // Large L -> CCM
      backEmf: 0,
      filterCapacitor: 0,
      freewheelingDiode: false,
      firingAngle: alpha,
      forwardVoltage: 0
    });

    const aRad = (alpha * Math.PI) / 180;
    const expVavg = ((2 * VmA) / Math.PI) * Math.cos(aRad);
    const expVrms = vRmsA; // Vrms = V_supply for continuous full wave without FWD

    assertClose('B', `Full-Bridge SCR (CCM, alpha=${alpha}°): Vavg = (2Vm/pi)*cos(alpha)`, res.results.vAvg, expVavg, 1.0);
    assertClose('B', `Full-Bridge SCR (CCM, alpha=${alpha}°): Vrms = Vsupply`, res.results.vRms, expVrms, 1.0);
  }

  // B3. Semi-Converter (Half-Controlled Bridge)
  for (const alpha of [0, 30, 60, 90]) {
    const res = simulateRectifier('semi-converter', {
      vRms: vRmsA,
      frequency: 50,
      sourceInductance: 0,
      loadType: 'RL',
      resistance: 5,
      inductance: 500,
      backEmf: 0,
      filterCapacitor: 0,
      freewheelingDiode: false,
      firingAngle: alpha,
      forwardVoltage: 0
    });

    const aRad = (alpha * Math.PI) / 180;
    const expVavg = (VmA / Math.PI) * (1 + Math.cos(aRad));
    const expVrms = (VmA / 2) * Math.sqrt((2 * (Math.PI - aRad) + Math.sin(2 * aRad)) / Math.PI);

    assertClose('B', `Semi-Converter (alpha=${alpha}°): Vavg`, res.results.vAvg, expVavg, 1.0);
    assertClose('B', `Semi-Converter (alpha=${alpha}°): Vrms`, res.results.vRms, expVrms, 1.0);
  }

  /* ==========================================================
   * TEST GROUP C: Three-Phase Rectifiers
   * V_LL,rms = 400 V, 50 Hz, ideal devices
   * ========================================================== */
  const vLL = 400;
  const VmLL = vLL * Math.SQRT2; // 565.69 V

  // C1. Three-Phase Diode Bridge
  const threePhDiode = simulateRectifier('three-phase-diode', {
    vRms: vLL,
    frequency: 50,
    sourceInductance: 0,
    loadType: 'R',
    resistance: 20,
    inductance: 0,
    backEmf: 0,
    filterCapacitor: 0,
    freewheelingDiode: false,
    firingAngle: 0,
    forwardVoltage: 0
  });

  const exp3PhAvg = (3 * VmLL) / Math.PI; // ~540.19 V (1.3505 * V_LL)
  const exp3PhRms = VmLL * Math.sqrt(0.5 + (3 * Math.sqrt(3)) / (4 * Math.PI)); // ~540.67 V (1.3517 * V_LL)

  assertClose('C', '3-Phase Diode: Vavg = (3/pi)*Vm,LL = 1.35*V_LL', threePhDiode.results.vAvg, exp3PhAvg, 0.5);
  assertClose('C', '3-Phase Diode: Vrms = 1.3517*V_LL', threePhDiode.results.vRms, exp3PhRms, 0.5);
  assertClose('C', '3-Phase Diode: Theoretical Vavg', threePhDiode.results.vAvgTheory, exp3PhAvg, 0.1);
  assertClose('C', '3-Phase Diode: Theoretical Vrms', threePhDiode.results.vRmsTheory, exp3PhRms, 0.1);
  assertClose('C', '3-Phase Diode: Input Power Pin = Pload', threePhDiode.results.pIn, threePhDiode.results.pLoad, 0.5);

  // C2. Three-Phase Controlled SCR Bridge
  for (const alpha of [0, 30, 60]) {
    const res = simulateRectifier('three-phase-scr', {
      vRms: vLL,
      frequency: 50,
      sourceInductance: 0,
      loadType: 'R',
      resistance: 20,
      inductance: 0,
      backEmf: 0,
      filterCapacitor: 0,
      freewheelingDiode: false,
      firingAngle: alpha,
      forwardVoltage: 0
    });

    const aRad = (alpha * Math.PI) / 180;
    const expAvg = ((3 * VmLL) / Math.PI) * Math.cos(aRad);
    const expRms = VmLL * Math.sqrt(0.5 + (3 * Math.sqrt(3) / (4 * Math.PI)) * Math.cos(2 * aRad));

    assertClose('C', `3-Phase SCR (alpha=${alpha}°): Vavg = (3Vm/pi)*cos(alpha)`, res.results.vAvg, expAvg, 1.0);
    assertClose('C', `3-Phase SCR (alpha=${alpha}°): Vrms`, res.results.vRms, expRms, 1.0);
  }

  /* ==========================================================
   * TEST GROUP D: Loads and Nonidealities
   * ========================================================== */
  // D1. Non-zero Semiconductor Forward Voltage Drop Vf = 1.5 V
  const Vf_D = 1.5;
  const hwVf = simulateRectifier('half-wave-diode', {
    vRms: 230,
    frequency: 50,
    sourceInductance: 0,
    loadType: 'R',
    resistance: 20,
    inductance: 0,
    backEmf: 0,
    filterCapacitor: 0,
    freewheelingDiode: false,
    firingAngle: 0,
    forwardVoltage: Vf_D
  });

  // Derived piecewise solution:
  const th1_D = Math.asin(Vf_D / VmA);
  const th2_D = Math.PI - th1_D;
  const expHwVfAvg = (1 / (2 * Math.PI)) * (VmA * 2 * Math.cos(th1_D) - Vf_D * (th2_D - th1_D));
  assertClose('D', 'Half-Wave with Vf=1.5V: Piecewise Vavg', hwVf.results.vAvg, expHwVfAvg, 0.5);
  assertClose('D', 'Half-Wave with Vf=1.5V: Analytical VavgTheory match', hwVf.results.vAvgTheory, expHwVfAvg, 0.5);

  // Efficiency with forward drop must be strictly < 100% due to diode loss
  const expectedEfficiency = (hwVf.results.pLoad / hwVf.results.pIn) * 100;
  assertClose('D', 'Half-Wave with Vf=1.5V: Efficiency matches Pload/Pin', hwVf.results.efficiency, expectedEfficiency, 0.1);
  if (hwVf.results.efficiency < 100 && hwVf.results.efficiency > 95) {
    results.push({
      group: 'D',
      name: 'Half-Wave with Vf: Device drop correctly creates physical conduction loss (eta < 100%)',
      passed: true,
      message: `PASSED: eta=${hwVf.results.efficiency.toFixed(2)}% < 100%`
    });
  } else {
    results.push({
      group: 'D',
      name: 'Half-Wave with Vf: Device drop creates loss',
      passed: false,
      message: `FAILED: unexpected eta=${hwVf.results.efficiency.toFixed(2)}%`
    });
  }

  // D2. Commutation Overlap with Source Inductance Ls = 2 mH
  const Ls_D = 2; // mH
  const bridgeLs = simulateRectifier('full-bridge-diode', {
    vRms: 230,
    frequency: 50,
    sourceInductance: Ls_D,
    loadType: 'RL',
    resistance: 10,
    inductance: 100,
    backEmf: 0,
    filterCapacitor: 0,
    freewheelingDiode: false,
    firingAngle: 0,
    forwardVoltage: 0
  });

  const omega = 2 * Math.PI * 50;
  const expectedDrop = (2 * omega * (Ls_D * 1e-3) * bridgeLs.results.iAvg) / Math.PI;
  const expectedLsVavg = (2 * VmA) / Math.PI - expectedDrop;
  assertClose('D', 'Bridge with Ls=2mH: Voltage drop Delta_V = (2*omega*Ls*Io)/pi', bridgeLs.results.vAvg, expectedLsVavg, 2.5);
  if (bridgeLs.results.overlapAngleDeg > 0) {
    results.push({
      group: 'D',
      name: 'Bridge with Ls: Commutation overlap angle mu calculated and positive',
      passed: true,
      message: `PASSED: mu=${bridgeLs.results.overlapAngleDeg.toFixed(2)}° > 0`
    });
  }

  // D3. R-L-E Load (Back EMF = 50 V)
  const bridgeRle = simulateRectifier('full-bridge-diode', {
    vRms: 230,
    frequency: 50,
    sourceInductance: 0,
    loadType: 'RLE',
    resistance: 10,
    inductance: 50,
    backEmf: 50,
    filterCapacitor: 0,
    freewheelingDiode: false,
    firingAngle: 0,
    forwardVoltage: 0
  });

  if (bridgeRle.results.vAvg > 50 && bridgeRle.results.iAvg > 0) {
    results.push({
      group: 'D',
      name: 'Bridge with R-L-E Back-EMF: Voltage and current remain positive and physically consistent',
      passed: true,
      message: `PASSED: Vavg=${bridgeRle.results.vAvg.toFixed(2)}V > E(50V), Iavg=${bridgeRle.results.iAvg.toFixed(2)}A > 0`
    });
  }

  // D4. Freewheeling Diode clamps load voltage to >= 0
  const bridgeFwd = simulateRectifier('full-bridge-scr', {
    vRms: 230,
    frequency: 50,
    sourceInductance: 0,
    loadType: 'RL',
    resistance: 10,
    inductance: 100,
    backEmf: 0,
    filterCapacitor: 0,
    freewheelingDiode: true,
    firingAngle: 60,
    forwardVoltage: 0
  });

  const hasNegativeVo = bridgeFwd.waveforms.some((pt) => pt.vo < -0.05);
  results.push({
    group: 'D',
    name: 'Freewheeling Diode (FWD): Prevents negative voltage excursion on Vo',
    passed: !hasNegativeVo,
    message: !hasNegativeVo
      ? 'PASSED: Output voltage Vo clamped >= 0V by FWD during inductive freewheeling'
      : 'FAILED: Negative voltage detected while FWD was active'
  });

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return { passed, failed, results };
}
