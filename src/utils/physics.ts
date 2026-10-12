/**
 * Power Electronics Simulation Engine
 * Rigorous numerical solver and analytical formulas matching Prof. Arpan Hota's Courseware (IIT Kharagpur)
 * and Standard IEEE / Textbook Literature (Ned Mohan, Rashid, P.S. Bimbhra)
 */

import {
  CircuitParameters,
  CalculatedResults,
  WaveformDataPoint,
  InstantaneousValues,
  HarmonicPoint,
  RectifierTopology
} from '../types/rectifier';

export function simulateRectifier(
  topology: RectifierTopology,
  params: CircuitParameters
): {
  waveforms: WaveformDataPoint[];
  results: CalculatedResults;
  harmonics: HarmonicPoint[];
  isHarmonics: HarmonicPoint[];
} {
  const {
    vRms,
    frequency,
    sourceInductance = 0, // in mH
    loadType,
    resistance,
    inductance, // in mH
    backEmf,
    filterCapacitor, // in uF
    freewheelingDiode,
    firingAngle, // in deg (0 to 180)
    forwardVoltage
  } = params;

  const R = Math.max(0.1, resistance);
  const L = loadType === 'R' ? 0 : Math.max(0, inductance * 1e-3); // Henries
  const Ls = Math.max(0, sourceInductance * 1e-3); // Henries
  const C = Math.max(0, filterCapacitor * 1e-6); // Farads
  const E = loadType === 'RLE' ? Math.max(0, backEmf) : 0;
  const Vf = Math.max(0, forwardVoltage);
  const omega = 2 * Math.PI * frequency;
  const period = 1 / frequency;
  const vPeak = vRms * Math.SQRT2;
  const isThreePhase = topology.includes('three-phase');

  // 3-Phase voltages:
  // V_LL,rms = vRms
  // V_LL,peak = sqrt(2) * vRms
  // V_ph,peak = V_LL,peak / sqrt(3)
  const vLLPeak = vPeak;
  const vPhPeak = vLLPeak / Math.sqrt(3);

  // High-precision simulation: 2000 steps per cycle
  const warmupPeriods = 10;
  const totalPeriods = warmupPeriods + 2;
  const stepsPerPeriod = 2000;
  const dt = period / stepsPerPeriod;
  const totalSteps = totalPeriods * stepsPerPeriod;

  // State variables
  let io = 0; // Load current (A)
  let vo = E; // Load voltage (V)

  // Single-phase state
  let activePair: 0 | 1 | 2 = 0; // 0 = none, 1 = (T1,T2), 2 = (T3,T4)
  let isFreewheeling = false;

  // Commutation overlap state
  let inCommutation = false;
  let commutationCurrent = 0; // Current transferred so far (0 to io)

  // 3-Phase state: activeSector 0..5
  // Sector 0: (T6, T1) -> vab
  // Sector 1: (T1, T2) -> vac
  // Sector 2: (T2, T3) -> vbc
  // Sector 3: (T3, T4) -> vba
  // Sector 4: (T4, T5) -> vca
  // Sector 5: (T5, T6) -> vcb
  let currentSector3Ph = 0;
  let conducting3Ph = false;

  const recordedPoints: WaveformDataPoint[] = [];

  for (let step = 0; step < totalSteps; step++) {
    const t = step * dt;
    const phaseRad = (omega * t) % (2 * Math.PI);
    const phaseDeg = (phaseRad * 180) / Math.PI;
    const vs = vPeak * Math.sin(omega * t);

    // Three-phase neutral-to-phase voltages:
    const van = vPhPeak * Math.sin(omega * t);
    const vbn = vPhPeak * Math.sin(omega * t - (2 * Math.PI) / 3);
    const vcn = vPhPeak * Math.sin(omega * t + (2 * Math.PI) / 3);

    // Line-to-line voltages:
    const vab = van - vbn;
    const vbc = vbn - vcn;
    const vca = vcn - van;
    const vac = -vca;
    const vba = -vab;
    const vcb = -vbc;

    // Gate pulse generator with 5-degree firing window
    const gatePulses: Record<string, number> = {};
    const checkPulse = (trigAngleDeg: number) => {
      const diff = (phaseDeg - trigAngleDeg + 720) % 360;
      return diff >= 0 && diff <= 5.0 ? 1 : 0;
    };

    let vApplied = E;
    let iD1 = 0;
    let iD2 = 0;
    let iD3 = 0;
    let iD4 = 0;
    let iD5 = 0;
    let iD6 = 0;
    let iFwd = 0;
    let is = 0;

    const isThreePhase = topology.includes('three-phase');

    if (isThreePhase) {
      /* ==========================================================
       * THREE-PHASE RECTIFIERS (Slides 18-21 & 30-33)
       * Firing Sequence: T1 -> T2 -> T3 -> T4 -> T5 -> T6
       * Firing Angles (referenced to phase crossing at 30 deg):
       * T1: 30° + alpha
       * T2: 90° + alpha
       * T3: 150° + alpha
       * T4: 210° + alpha
       * T5: 270° + alpha
       * T6: 330° + alpha
       * ========================================================== */
      const effectiveAlpha = topology === 'three-phase-diode' ? 0 : firingAngle;

      gatePulses['T1'] = checkPulse(30 + effectiveAlpha);
      gatePulses['T2'] = checkPulse(90 + effectiveAlpha);
      gatePulses['T3'] = checkPulse(150 + effectiveAlpha);
      gatePulses['T4'] = checkPulse(210 + effectiveAlpha);
      gatePulses['T5'] = checkPulse(270 + effectiveAlpha);
      gatePulses['T6'] = checkPulse(330 + effectiveAlpha);

      // Determine sector based on angle
      const thetaEff = (phaseDeg - 30 - effectiveAlpha + 720) % 360;
      const targetSector = Math.floor(thetaEff / 60);

      // Triggering event at boundary
      const isFireInstant =
        (gatePulses['T1'] && targetSector === 0) ||
        (gatePulses['T2'] && targetSector === 1) ||
        (gatePulses['T3'] && targetSector === 2) ||
        (gatePulses['T4'] && targetSector === 3) ||
        (gatePulses['T5'] && targetSector === 4) ||
        (gatePulses['T6'] && targetSector === 5);

      if (topology === 'three-phase-diode') {
        currentSector3Ph = targetSector;
        conducting3Ph = true;
      } else {
        // Controlled bridge (SCR)
        if (isFireInstant) {
          currentSector3Ph = targetSector;
          conducting3Ph = true;
          isFreewheeling = false;
        } else if (targetSector !== currentSector3Ph && !conducting3Ph) {
          // Waiting for gate pulse in discontinuous conduction
          conducting3Ph = false;
        } else {
          currentSector3Ph = targetSector;
        }
      }

      // Line voltage for current sector
      let activeVline = 0;
      switch (currentSector3Ph) {
        case 0: activeVline = vab; break;
        case 1: activeVline = vac; break;
        case 2: activeVline = vbc; break;
        case 3: activeVline = vba; break;
        case 4: activeVline = vca; break;
        case 5: activeVline = vcb; break;
      }

      // Overlap calculation if Ls > 0
      let vCommutationDrop = 0;
      if (Ls > 0 && io > 0.05) {
        vCommutationDrop = (3 * omega * Ls * io) / Math.PI;
      }

      // Check conduction condition & Freewheeling Diode (FWD) action:
      if (freewheelingDiode) {
        if (conducting3Ph && activeVline <= 2 * Vf) {
          conducting3Ph = false;
          isFreewheeling = io > 0.001;
        } else if (!conducting3Ph && isFreewheeling && io <= 0.001) {
          isFreewheeling = false;
        }
      } else {
        if (loadType === 'R' && activeVline < E + 2 * Vf) {
          conducting3Ph = false;
        } else if (loadType !== 'R' && io <= 0.001 && !isFireInstant) {
          conducting3Ph = false;
        }
      }

      if (conducting3Ph) {
        vApplied = activeVline - 2 * Vf - vCommutationDrop;

        switch (currentSector3Ph) {
          case 0: // (T6, T1) -> vab (Ph A -> Load -> Ph B)
            iD1 = io; iD6 = io; is = +io;
            break;
          case 1: // (T1, T2) -> vac (Ph A -> Load -> Ph C)
            iD1 = io; iD2 = io; is = +io;
            break;
          case 2: // (T2, T3) -> vbc (Ph B -> Load -> Ph C)
            iD3 = io; iD2 = io; is = 0;
            break;
          case 3: // (T3, T4) -> vba (Ph B -> Load -> Ph A)
            iD3 = io; iD4 = io; is = -io;
            break;
          case 4: // (T4, T5) -> vca (Ph C -> Load -> Ph A)
            iD5 = io; iD4 = io; is = -io;
            break;
          case 5: // (T5, T6) -> vcb (Ph C -> Load -> Ph B)
            iD5 = io; iD6 = io; is = 0;
            break;
        }
      } else if (isFreewheeling) {
        vApplied = -Vf;
        iFwd = io;
        is = 0;
      } else {
        vApplied = E;
        is = 0;
      }
    } else {
      /* ==========================================================
       * SINGLE-PHASE RECTIFIERS
       * ========================================================== */
      if (topology === 'half-wave-scr') {
        gatePulses['T1'] = checkPulse(firingAngle);
      } else if (topology === 'semi-converter') {
        gatePulses['T1'] = checkPulse(firingAngle);
        gatePulses['T3'] = checkPulse(180 + firingAngle);
      } else if (topology === 'full-bridge-scr') {
        gatePulses['T1'] = checkPulse(firingAngle);
        gatePulses['T2'] = checkPulse(firingAngle);
        gatePulses['T3'] = checkPulse(180 + firingAngle);
        gatePulses['T4'] = checkPulse(180 + firingAngle);
      }

      let vOverlapDrop = 0;
      if (Ls > 0 && io > 0.05) {
        vOverlapDrop = (2 * omega * Ls * io) / Math.PI;
      }

      switch (topology) {
        case 'half-wave-diode': {
          if (vs > E + Vf) {
            activePair = 1;
            isFreewheeling = false;
          }

          if (freewheelingDiode) {
            if (activePair === 1 && vs <= Vf) {
              activePair = 0;
              isFreewheeling = io > 0.001;
            } else if (activePair === 0 && isFreewheeling && io <= 0.001) {
              isFreewheeling = false;
            }
          } else {
            if (loadType === 'R') {
              if (activePair === 1 && vs < E + Vf) activePair = 0;
            } else {
              if (io <= 0.001 && vs <= E + Vf) activePair = 0;
            }
          }

          if (activePair === 1) {
            vApplied = vs - Vf;
          } else if (isFreewheeling) {
            vApplied = -Vf;
          } else {
            vApplied = E;
          }
          break;
        }

        case 'half-wave-scr': {
          if (gatePulses['T1'] && vs > E + Vf) {
            activePair = 1;
            isFreewheeling = false;
          }

          if (freewheelingDiode) {
            if (activePair === 1 && vs <= Vf) {
              activePair = 0;
              isFreewheeling = io > 0.001;
            } else if (activePair === 0 && isFreewheeling && io <= 0.001) {
              isFreewheeling = false;
            }
          } else {
            if (loadType === 'R') {
              if (activePair === 1 && vs < E + Vf) activePair = 0;
            } else {
              if (io <= 0.001 && !gatePulses['T1']) activePair = 0;
            }
          }

          if (activePair === 1) {
            vApplied = vs - Vf;
          } else if (isFreewheeling) {
            vApplied = -Vf;
          } else {
            vApplied = E;
          }
          break;
        }

        case 'full-bridge-diode': {
          const absVs = Math.abs(vs);
          const canConduct = absVs > E + 2 * Vf;

          if (vs >= 0) {
            if (canConduct || (L > 0 && activePair === 1 && io > 0.001 && !freewheelingDiode)) {
              activePair = 1;
              isFreewheeling = false;
              vApplied = vs - 2 * Vf - vOverlapDrop;
            } else {
              activePair = 0;
              vApplied = E;
            }
          } else {
            if (canConduct || (L > 0 && activePair === 2 && io > 0.001 && !freewheelingDiode)) {
              activePair = 2;
              isFreewheeling = false;
              vApplied = -vs - 2 * Vf - vOverlapDrop;
            } else {
              activePair = 0;
              vApplied = E;
            }
          }

          if (freewheelingDiode && io > 0.001 && absVs <= 2 * Vf) {
            activePair = 0;
            isFreewheeling = true;
            vApplied = -Vf;
          } else if (isFreewheeling && io <= 0.001) {
            isFreewheeling = false;
          }
          break;
        }

        case 'full-bridge-scr': {
          // Trigger Pair 1 (T1, T2) at alpha
          if (gatePulses['T1'] && vs > E + 2 * Vf) {
            activePair = 1;
            isFreewheeling = false;
          }
          // Trigger Pair 2 (T3, T4) at 180 + alpha
          else if (gatePulses['T3'] && -vs > E + 2 * Vf) {
            activePair = 2;
            isFreewheeling = false;
          }

          // Freewheeling Diode (FWD across load)
          if (freewheelingDiode) {
            if (activePair === 1 && vs <= 2 * Vf) {
              activePair = 0;
              isFreewheeling = io > 0.001;
            } else if (activePair === 2 && -vs <= 2 * Vf) {
              activePair = 0;
              isFreewheeling = io > 0.001;
            } else if (activePair === 0 && isFreewheeling && io <= 0.001) {
              isFreewheeling = false;
            }
          } else {
            // Without FWD:
            if (loadType === 'R') {
              if (activePair === 1 && vs < E + 2 * Vf) activePair = 0;
              if (activePair === 2 && -vs < E + 2 * Vf) activePair = 0;
            } else {
              // RL / RLE: devices stay on unless current drops to 0
              if (io <= 0.001 && !gatePulses['T1'] && !gatePulses['T3']) {
                activePair = 0;
              }
            }
          }

          if (activePair === 1) {
            vApplied = vs - 2 * Vf - vOverlapDrop;
          } else if (activePair === 2) {
            vApplied = -vs - 2 * Vf - vOverlapDrop;
          } else if (isFreewheeling) {
            vApplied = -Vf;
          } else {
            vApplied = E;
          }
          break;
        }

        case 'semi-converter': {
          // Trigger T1 at alpha
          if (gatePulses['T1'] && vs > 2 * Vf) {
            activePair = 1;
            isFreewheeling = false;
          }
          // Trigger T3 at 180 + alpha
          else if (gatePulses['T3'] && -vs > 2 * Vf) {
            activePair = 2;
            isFreewheeling = false;
          }

          // Freewheeling transition:
          if (activePair === 1 && vs <= 0) {
            activePair = 0;
            isFreewheeling = io > 0.001;
          } else if (activePair === 2 && vs >= 0) {
            activePair = 0;
            isFreewheeling = io > 0.001;
          } else if (activePair === 0 && isFreewheeling && io <= 0.001) {
            isFreewheeling = false;
          }

          if (activePair === 1) {
            vApplied = vs - 2 * Vf;
          } else if (activePair === 2) {
            vApplied = -vs - 2 * Vf;
          } else if (isFreewheeling) {
            // With external FWD, forward drop is 1 diode drop (-Vf), with bridge freewheeling it is -2*Vf
            vApplied = freewheelingDiode ? -Vf : -2 * Vf;
          } else {
            vApplied = E;
          }
          break;
        }
      }

      // Assign device currents
      if (topology === 'half-wave-diode' || topology === 'half-wave-scr') {
        iD1 = activePair === 1 ? io : 0;
        iFwd = isFreewheeling ? io : 0;
        is = activePair === 1 ? io : 0;
      } else if (topology === 'semi-converter') {
        if (activePair === 1) {
          // Positive half conduction: T1 and D2
          iD1 = io;
          iD2 = io;
          is = +io;
        } else if (activePair === 2) {
          // Negative half conduction: T3 and D4
          iD3 = io;
          iD4 = io;
          is = -io;
        } else if (isFreewheeling) {
          if (freewheelingDiode) {
            // External FWD conducts!
            iFwd = io;
            is = 0;
          } else {
            // Internal freewheeling through bridge legs
            if (vs <= 0) {
              iD1 = io;
              iD4 = io;
              is = 0;
            } else {
              iD3 = io;
              iD2 = io;
              is = 0;
            }
          }
        } else {
          is = 0;
        }
      } else {
        if (activePair === 1) {
          iD1 = io;
          iD2 = io;
          is = +io;
        } else if (activePair === 2) {
          iD3 = io;
          iD4 = io;
          is = -io;
        } else {
          is = 0;
        }
        iFwd = isFreewheeling ? io : 0;
      }
    }

    /* ==========================================================
     * HIGH-PRECISION NUMERICAL SOLVER
     * Unconditionally stable exact discrete-time exponential integration
     * for L-R differential equation: L*(dio/dt) + R*io = vApplied - E
     * ========================================================== */
    if (C > 0) {
      // Capacitor filter
      const iRes = Math.max(0, (vo - E) / R);
      if (vApplied > vo) {
        vo = vApplied;
        io = iRes;
      } else {
        const dVo = (-iRes / C) * dt;
        vo = Math.max(E, vo + dVo);
        io = iRes;
      }
    } else if (L > 0) {
      // RL / RLE Load: Exact exponential integration step
      const tau = L / R;
      const decay = Math.exp(-dt / tau);
      const iSteady = (vApplied - E) / R;
      const ioNext = io * decay + iSteady * (1 - decay);

      if (ioNext <= 0.0001) {
        // Current hit zero -> Extinction (DCM)
        io = 0;
        activePair = 0;
        conducting3Ph = false;
        isFreewheeling = false;
        vApplied = E;
        vo = E;
      } else {
        io = ioNext;
        vo = vApplied;
      }
    } else {
      // Pure Resistive Load (L = 0)
      if (vApplied > E) {
        io = (vApplied - E) / R;
        vo = vApplied;
      } else {
        io = 0;
        vo = E;
        activePair = 0;
        conducting3Ph = false;
        isFreewheeling = false;
      }
    }

    const compositeGate = Object.values(gatePulses).some((p) => p === 1) ? 1 : 0;

    // Record last 2 periods for steady-state analysis
    if (step >= warmupPeriods * stepsPerPeriod) {
      const recTimeSec = (step - warmupPeriods * stepsPerPeriod) * dt;
      const recTimeMs = recTimeSec * 1000;

      recordedPoints.push({
        timeMs: recTimeMs,
        timeSec: recTimeSec,
        phaseDeg,
        vs,
        is,
        vo,
        io,
        van,
        vbn,
        vcn,
        vab,
        vbc,
        vca,
        iDevice1: iD1,
        iDevice2: iD2,
        iDevice3: iD3,
        iDevice4: iD4,
        iDevice5: iD5,
        iDevice6: iD6,
        iFwd,
        vDevice1: activePair === 1 ? Vf : vs - vo,
        gatePulse: compositeGate,
        gatePulses
      });
    }
  }

  // ==========================================================
  // RESULTS INTEGRATION & POWER ELECTRONICS PERFORMANCE METRICS
  // ==========================================================
  const N = recordedPoints.length;
  let sumVo = 0;
  let sumVoSq = 0;
  let sumIo = 0;
  let sumIoSq = 0;
  let sumIsSq = 0;
  let sumInstantLoadPower = 0;
  let sumInstantSourcePower = 0;

  for (let i = 0; i < N; i++) {
    const pt = recordedPoints[i];
    sumVo += pt.vo;
    sumVoSq += pt.vo * pt.vo;
    sumIo += pt.io;
    sumIoSq += pt.io * pt.io;
    sumIsSq += pt.is * pt.is;

    // Load instantaneous power: p_load(t) = v_o(t) * i_o(t)
    sumInstantLoadPower += pt.vo * pt.io;

    // Source instantaneous input power: p_in(t) = sum_k v_{s,k}(t) * i_{s,k}(t)
    if (isThreePhase) {
      const iA = pt.iDevice1 - pt.iDevice4;
      const iB = pt.iDevice3 - pt.iDevice6;
      const iC = pt.iDevice5 - pt.iDevice2;
      sumInstantSourcePower += pt.van * iA + pt.vbn * iB + pt.vcn * iC;
    } else {
      sumInstantSourcePower += pt.vs * pt.is;
    }
  }

  const vAvg = sumVo / N;
  const calcVRms = Math.sqrt(sumVoSq / N);
  const iAvg = sumIo / N;
  const iRms = Math.sqrt(sumIoSq / N);
  const isRms = Math.sqrt(sumIsSq / N);

  // DC component output power: P_DC = V_avg * I_avg
  const pDc = vAvg * iAvg;

  // Actual average load power: P_load = (1/T) integral v_o(t)*i_o(t) dt
  const pLoad = sumInstantLoadPower / N;
  const pAc = pLoad; // Preserved for backwards compatibility

  // Actual average source input power: P_in = (1/T) integral v_s(t)*i_s(t) dt
  const pIn = sumInstantSourcePower / N;

  // Conversion efficiency: eta = (P_load / P_in) * 100%
  // Strictly derived from conservation of energy; no arbitrary clamping to 100%
  const efficiency = pIn > 0.001 ? Math.max(0, (pLoad / pIn) * 100) : 0;

  const formFactor = vAvg > 0 ? calcVRms / vAvg : 1;
  const rippleFactor = formFactor >= 1 ? Math.sqrt(Math.max(0, formFactor * formFactor - 1)) : 0;

  // Exact Fourier Analysis for AC Input Current is(t)
  const onePeriodPoints = recordedPoints.slice(0, stepsPerPeriod);
  const M = onePeriodPoints.length;

  let isA1 = 0;
  let isB1 = 0;
  for (let k = 0; k < M; k++) {
    const angle = (2 * Math.PI * k) / M;
    isA1 += onePeriodPoints[k].is * Math.cos(angle);
    isB1 += onePeriodPoints[k].is * Math.sin(angle);
  }
  isA1 = (2 / M) * isA1;
  isB1 = (2 / M) * isB1;

  const isFundPeak = Math.sqrt(isA1 * isA1 + isB1 * isB1);
  const isFundRms = isFundPeak / Math.SQRT2;

  // Fundamental phase shift phi_1:
  const phi1 = Math.atan2(isA1, isB1);
  const displacementFactor = isFundRms > 0 ? Math.abs(Math.cos(phi1)) : 1;
  const distortionFactor = isRms > 0 ? Math.min(1, isFundRms / isRms) : 1;
  const powerFactor = displacementFactor * distortionFactor;
  const thdCurrentPercent = isFundRms > 0 ? Math.sqrt(Math.max(0, (isRms / isFundRms) ** 2 - 1)) * 100 : 0;

  // Commutation overlap angle mu (deg) due to source inductance Ls
  let overlapAngleDeg = 0;
  if (Ls > 0 && iAvg > 0.05) {
    if (isThreePhase) {
      const cosVal = Math.cos((firingAngle * Math.PI) / 180) - (2 * omega * Ls * iAvg) / vLLPeak;
      if (cosVal >= -1 && cosVal <= 1) {
        overlapAngleDeg = Math.max(0, (Math.acos(cosVal) * 180) / Math.PI - firingAngle);
      }
    } else {
      const cosVal = Math.cos((firingAngle * Math.PI) / 180) - (2 * omega * Ls * iAvg) / vPeak;
      if (cosVal >= -1 && cosVal <= 1) {
        overlapAngleDeg = Math.max(0, (Math.acos(cosVal) * 180) / Math.PI - firingAngle);
      }
    }
  }

  // Detect Conduction Mode (CCM vs DCM) early for benchmark selection
  let zeroCount = 0;
  for (let i = 0; i < N; i++) {
    if (recordedPoints[i].io < 0.02) zeroCount++;
  }
  const conductionMode = zeroCount > N * 0.04 ? 'Discontinuous (DCM)' : 'Continuous (CCM)';

  // Exact Analytical Benchmark Calculations
  // Grounded in rigorous closed-form derivations from textbook literature (Rashid, Ned Mohan, Bimbhra)
  let vAvgTheory = vAvg;
  let vRmsTheory = calcVRms;
  const alphaRad = (firingAngle * Math.PI) / 180;

  switch (topology) {
    case 'half-wave-diode':
      if (loadType === 'R' || freewheelingDiode) {
        if (Vf > 0 && Vf < vPeak) {
          const th1 = Math.asin(Vf / vPeak);
          const th2 = Math.PI - th1;
          const intSin = 2 * Math.cos(th1);
          vAvgTheory = (1 / (2 * Math.PI)) * (vPeak * intSin - Vf * (th2 - th1));
          const intSinSq = 0.5 * (th2 - th1) - 0.25 * (Math.sin(2 * th2) - Math.sin(2 * th1));
          const intVfSq = Vf * Vf * (th2 - th1);
          const intCross = -2 * Vf * vPeak * intSin;
          vRmsTheory = Math.sqrt((1 / (2 * Math.PI)) * Math.max(0, vPeak * vPeak * intSinSq + intCross + intVfSq));
        } else {
          vAvgTheory = vPeak / Math.PI;
          vRmsTheory = vPeak / 2;
        }
      }
      break;

    case 'half-wave-scr':
      if (loadType === 'R' || freewheelingDiode) {
        if (Vf === 0) {
          vAvgTheory = (vPeak / (2 * Math.PI)) * (1 + Math.cos(alphaRad));
          vRmsTheory = (vPeak / 2) * Math.sqrt((Math.PI - alphaRad + 0.5 * Math.sin(2 * alphaRad)) / Math.PI);
        } else {
          // If forward drop present, use exact simulation value or analytical piecewise if alpha >= th1
          const th1 = Math.asin(Math.min(1, Vf / vPeak));
          const actualStart = Math.max(th1, alphaRad);
          const th2 = Math.PI - th1;
          if (actualStart < th2) {
            const intSin = Math.cos(actualStart) - Math.cos(th2);
            vAvgTheory = (1 / (2 * Math.PI)) * (vPeak * intSin - Vf * (th2 - actualStart));
            const intSinSq = 0.5 * (th2 - actualStart) - 0.25 * (Math.sin(2 * th2) - Math.sin(2 * actualStart));
            const intVfSq = Vf * Vf * (th2 - actualStart);
            const intCross = -2 * Vf * vPeak * intSin;
            vRmsTheory = Math.sqrt((1 / (2 * Math.PI)) * Math.max(0, vPeak * vPeak * intSinSq + intCross + intVfSq));
          } else {
            vAvgTheory = 0;
            vRmsTheory = 0;
          }
        }
      }
      break;

    case 'full-bridge-diode':
      if (loadType === 'R' && Ls === 0) {
        if (Vf > 0 && 2 * Vf < vPeak) {
          const Vdrop = 2 * Vf;
          const th1 = Math.asin(Vdrop / vPeak);
          const th2 = Math.PI - th1;
          const intSin = 2 * Math.cos(th1);
          vAvgTheory = (1 / Math.PI) * (vPeak * intSin - Vdrop * (th2 - th1));
          const intSinSq = 0.5 * (th2 - th1) - 0.25 * (Math.sin(2 * th2) - Math.sin(2 * th1));
          const intVdropSq = Vdrop * Vdrop * (th2 - th1);
          const intCross = -2 * Vdrop * vPeak * intSin;
          vRmsTheory = Math.sqrt((1 / Math.PI) * Math.max(0, vPeak * vPeak * intSinSq + intCross + intVdropSq));
        } else {
          vAvgTheory = (2 * vPeak) / Math.PI;
          vRmsTheory = vPeak / Math.SQRT2;
        }
      } else if (Ls > 0) {
        vAvgTheory = (2 * vPeak) / Math.PI - 2 * Vf - (2 * omega * Ls * iAvg) / Math.PI;
        vRmsTheory = calcVRms;
      }
      break;

    case 'full-bridge-scr':
      if (freewheelingDiode) {
        if (Vf === 0) {
          vAvgTheory = (vPeak / Math.PI) * (1 + Math.cos(alphaRad));
          vRmsTheory = (vPeak / 2) * Math.sqrt((2 * (Math.PI - alphaRad) + Math.sin(2 * alphaRad)) / Math.PI);
        } else {
          vAvgTheory = (vPeak / Math.PI) * (1 + Math.cos(alphaRad)) - 2 * Vf;
          vRmsTheory = calcVRms;
        }
      } else if (loadType === 'R') {
        if (Vf === 0) {
          vAvgTheory = (vPeak / Math.PI) * (1 + Math.cos(alphaRad));
          vRmsTheory = vPeak * Math.sqrt(0.5 - alphaRad / (2 * Math.PI) + Math.sin(2 * alphaRad) / (4 * Math.PI));
        } else {
          vAvgTheory = (vPeak / Math.PI) * (1 + Math.cos(alphaRad)) - 2 * Vf;
          vRmsTheory = calcVRms;
        }
      } else if (conductionMode === 'Continuous (CCM)') {
        // Continuous Conduction Mode with inductive load
        vAvgTheory = ((2 * vPeak) / Math.PI) * Math.cos(alphaRad) - 2 * Vf - (2 * omega * Ls * iAvg) / Math.PI;
        vRmsTheory = Vf === 0 && Ls === 0 ? vPeak / Math.SQRT2 : calcVRms;
      } else {
        // Discontinuous Conduction Mode (DCM) without FWD:
        // No simple universal closed-form formula exists as extinction angle beta depends transcendentally on tau = L/R.
        // Set analytical benchmark to simulated value to avoid presenting inapplicable continuous formulas.
        vAvgTheory = vAvg;
        vRmsTheory = calcVRms;
      }
      break;

    case 'semi-converter':
      if (Vf === 0) {
        vAvgTheory = (vPeak / Math.PI) * (1 + Math.cos(alphaRad));
        vRmsTheory = (vPeak / 2) * Math.sqrt((2 * (Math.PI - alphaRad) + Math.sin(2 * alphaRad)) / Math.PI);
      } else {
        vAvgTheory = (vPeak / Math.PI) * (1 + Math.cos(alphaRad)) - 2 * Vf;
        vRmsTheory = calcVRms;
      }
      break;

    case 'three-phase-diode':
      if (Vf === 0 && Ls === 0) {
        vAvgTheory = (3 * vLLPeak) / Math.PI;
        vRmsTheory = vLLPeak * Math.sqrt(0.5 + (3 * Math.sqrt(3)) / (4 * Math.PI));
      } else {
        vAvgTheory = (3 * vLLPeak) / Math.PI - 2 * Vf - (3 * omega * Ls * iAvg) / Math.PI;
        vRmsTheory = calcVRms;
      }
      break;

    case 'three-phase-scr':
      if (Vf === 0 && Ls === 0) {
        if (loadType === 'R') {
          if (firingAngle <= 60) {
            vAvgTheory = ((3 * vLLPeak) / Math.PI) * Math.cos(alphaRad);
            vRmsTheory = vLLPeak * Math.sqrt(0.5 + (3 * Math.sqrt(3) / (4 * Math.PI)) * Math.cos(2 * alphaRad));
          } else if (firingAngle < 120) {
            const alphaPlus60Rad = ((firingAngle + 60) * Math.PI) / 180;
            vAvgTheory = ((3 * vLLPeak) / Math.PI) * (1 + Math.cos(alphaPlus60Rad));
            const term = 0.5 * ((2 * Math.PI) / 3 - alphaRad) + 0.25 * Math.sin((2 * Math.PI) / 3 + 2 * alphaRad);
            vRmsTheory = vLLPeak * Math.sqrt((3 / Math.PI) * Math.max(0, term));
          } else {
            vAvgTheory = 0;
            vRmsTheory = 0;
          }
        } else if (conductionMode === 'Continuous (CCM)') {
          vAvgTheory = ((3 * vLLPeak) / Math.PI) * Math.cos(alphaRad);
          vRmsTheory = vLLPeak * Math.sqrt(0.5 + (3 * Math.sqrt(3) / (4 * Math.PI)) * Math.cos(2 * alphaRad));
        } else {
          vAvgTheory = vAvg;
          vRmsTheory = calcVRms;
        }
      } else {
        if (conductionMode === 'Continuous (CCM)') {
          vAvgTheory = ((3 * vLLPeak) / Math.PI) * Math.cos(alphaRad) - 2 * Vf - (3 * omega * Ls * iAvg) / Math.PI;
        } else {
          vAvgTheory = vAvg;
        }
        vRmsTheory = calcVRms;
      }
      break;
  }

  // Extinction angle beta
  let extinctionAngleDeg = 180;
  let conductionAngleDeg = 180;
  if (topology === 'half-wave-diode' || topology === 'half-wave-scr') {
    for (let i = Math.floor(N / 4); i < Math.floor((N * 3) / 4); i++) {
      if (recordedPoints[i].io <= 0.01 && recordedPoints[i - 1]?.io > 0.01) {
        extinctionAngleDeg = recordedPoints[i].phaseDeg;
        break;
      }
    }
    conductionAngleDeg = Math.max(0, extinctionAngleDeg - (topology === 'half-wave-scr' ? firingAngle : 0));
  }

  // Harmonics of Output Voltage vo(t)
  const harmonics: HarmonicPoint[] = [];
  for (let h = 1; h <= 12; h++) {
    let re = 0;
    let im = 0;
    for (let k = 0; k < M; k++) {
      const angle = (2 * Math.PI * h * k) / M;
      re += onePeriodPoints[k].vo * Math.cos(angle);
      im -= onePeriodPoints[k].vo * Math.sin(angle);
    }
    const amplitude = (2 / M) * Math.sqrt(re * re + im * im);
    harmonics.push({
      harmonicNumber: h,
      frequencyHz: h * frequency,
      amplitude,
      percentageOfFund: 0
    });
  }

  const fundAmp = harmonics[0]?.amplitude || 1;
  let sumHarmonicSq = 0;
  harmonics.forEach((h, idx) => {
    h.percentageOfFund = fundAmp > 0 ? (h.amplitude / fundAmp) * 100 : 0;
    if (idx > 0) sumHarmonicSq += h.amplitude * h.amplitude;
  });
  const thdPercent = fundAmp > 0 ? (Math.sqrt(sumHarmonicSq) / fundAmp) * 100 : 0;

  // Harmonics of AC Source Current is(t)
  const isHarmonics: HarmonicPoint[] = [];
  for (let h = 1; h <= 13; h++) {
    let re = 0;
    let im = 0;
    for (let k = 0; k < M; k++) {
      const angle = (2 * Math.PI * h * k) / M;
      re += onePeriodPoints[k].is * Math.cos(angle);
      im -= onePeriodPoints[k].is * Math.sin(angle);
    }
    const amplitude = (2 / M) * Math.sqrt(re * re + im * im);
    isHarmonics.push({
      harmonicNumber: h,
      frequencyHz: h * frequency,
      amplitude,
      percentageOfFund: isFundPeak > 0 ? (amplitude / isFundPeak) * 100 : 0
    });
  }

  const results: CalculatedResults = {
    vPeak,
    vAvg,
    vAvgTheory: Math.max(0, vAvgTheory),
    vRms: calcVRms,
    vRmsTheory: Math.max(0, vRmsTheory),
    iAvg,
    iRms,
    isRms,
    isFundRms,
    rippleFactor,
    formFactor,
    pDc,
    pAc,
    pLoad,
    pIn,
    efficiency,
    powerFactor,
    displacementFactor,
    distortionFactor,
    thdPercent,
    thdCurrentPercent,
    overlapAngleDeg,
    conductionMode,
    extinctionAngleDeg,
    conductionAngleDeg
  };

  return { waveforms: recordedPoints, results, harmonics, isHarmonics };
}

/**
 * Get instantaneous values at given timeMs
 */
export function getInstantaneousState(
  waveforms: WaveformDataPoint[],
  timeMs: number,
  topology: RectifierTopology
): InstantaneousValues {
  if (!waveforms || waveforms.length === 0) {
    return {
      timeMs: 0,
      phaseDeg: 0,
      vs: 0,
      is: 0,
      vo: 0,
      io: 0,
      van: 0,
      vbn: 0,
      vcn: 0,
      gateTriggered: false,
      activePathText: 'No simulation data',
      conductionCycle: 'blocking',
      conductingDevices: [],
      deviceCurrents: {},
      deviceVoltages: {},
      fwdCurrent: 0
    };
  }

  const maxTime = waveforms[waveforms.length - 1].timeMs;
  const wrappedTime = maxTime > 0 ? timeMs % maxTime : 0;

  let closest = waveforms[0];
  let minDiff = Infinity;
  for (let i = 0; i < waveforms.length; i++) {
    const diff = Math.abs(waveforms[i].timeMs - wrappedTime);
    if (diff < minDiff) {
      minDiff = diff;
      closest = waveforms[i];
    }
  }

  const conductingDevices: string[] = [];
  const deviceCurrents: Record<string, number> = {};
  const deviceVoltages: Record<string, number> = {};

  const isD1On = closest.iDevice1 > 0.05;
  const isD2On = closest.iDevice2 > 0.05;
  const isD3On = closest.iDevice3 > 0.05;
  const isD4On = closest.iDevice4 > 0.05;
  const isD5On = closest.iDevice5 > 0.05;
  const isD6On = closest.iDevice6 > 0.05;
  const isFwdOn = closest.iFwd > 0.05;

  let activePathText = 'Idle / Blocking state';
  let conductionCycle: 'positive' | 'negative' | 'freewheeling' | 'blocking' = 'blocking';

  const isScr = topology.includes('scr');
  const prefix = isScr ? 'T' : 'D';

  if (topology.includes('three-phase')) {
    if (isFwdOn) {
      conductingDevices.push('FWD');
      conductionCycle = 'freewheeling';
      activePathText = 'Freewheeling Mode: Inductive load current recirculates through 3-Phase D_FW (clamping Vo to 0V).';
    } else if (isD1On && isD6On) {
      conductingDevices.push(`${prefix}6`, `${prefix}1`);
      activePathText = `Firing Mode: (${prefix}6, ${prefix}1) conducting | vo = vab (Ph A → Load → Ph B)`;
    } else if (isD1On && isD2On) {
      conductingDevices.push(`${prefix}1`, `${prefix}2`);
      activePathText = `Firing Mode: (${prefix}1, ${prefix}2) conducting | vo = vac (Ph A → Load → Ph C)`;
    } else if (isD2On && isD3On) {
      conductingDevices.push(`${prefix}2`, `${prefix}3`);
      activePathText = `Firing Mode: (${prefix}2, ${prefix}3) conducting | vo = vbc (Ph B → Load → Ph C)`;
    } else if (isD3On && isD4On) {
      conductingDevices.push(`${prefix}3`, `${prefix}4`);
      activePathText = `Firing Mode: (${prefix}3, ${prefix}4) conducting | vo = vba (Ph B → Load → Ph A)`;
    } else if (isD4On && isD5On) {
      conductingDevices.push(`${prefix}4`, `${prefix}5`);
      activePathText = `Firing Mode: (${prefix}4, ${prefix}5) conducting | vo = vca (Ph C → Load → Ph A)`;
    } else if (isD5On && isD6On) {
      conductingDevices.push(`${prefix}5`, `${prefix}6`);
      activePathText = `Firing Mode: (${prefix}5, ${prefix}6) conducting | vo = vcb (Ph C → Load → Ph B)`;
    } else {
      activePathText = 'Discontinuous / Commutation Blocking';
    }

    if (!isFwdOn) {
      conductionCycle = 'positive';
    }
    deviceCurrents[`${prefix}1`] = closest.iDevice1;
    deviceCurrents[`${prefix}2`] = closest.iDevice2;
    deviceCurrents[`${prefix}3`] = closest.iDevice3;
    deviceCurrents[`${prefix}4`] = closest.iDevice4;
    deviceCurrents[`${prefix}5`] = closest.iDevice5;
    deviceCurrents[`${prefix}6`] = closest.iDevice6;
  } else if (topology === 'half-wave-diode' || topology === 'half-wave-scr') {
    if (isD1On) {
      conductingDevices.push(`${prefix}1`);
      conductionCycle = 'positive';
      activePathText = `Positive Half Cycle: ${prefix}1 is conducting through load.`;
    } else if (isFwdOn) {
      conductingDevices.push('FWD');
      conductionCycle = 'freewheeling';
      activePathText = 'Freewheeling Action: Load inductor current freewheels through D_FW.';
    } else {
      conductionCycle = 'blocking';
      activePathText = `${prefix}1 is blocking (reverse bias / waiting for trigger).`;
    }
    deviceCurrents[`${prefix}1`] = closest.iDevice1;
    deviceVoltages[`${prefix}1`] = closest.vDevice1;
  } else if (topology === 'semi-converter') {
    const isT1On = closest.iDevice1 > 0.05;
    const isD2On = closest.iDevice2 > 0.05;
    const isT3On = closest.iDevice3 > 0.05;
    const isD4On = closest.iDevice4 > 0.05;

    if (isT1On && isD2On) {
      conductingDevices.push('T1', 'D2');
      conductionCycle = 'positive';
      activePathText = 'Positive Conduction: T1 (SCR) and D2 (Diode) conducting (Phase A → Load → Neutral).';
    } else if (isT3On && isD4On) {
      conductingDevices.push('T3', 'D4');
      conductionCycle = 'negative';
      activePathText = 'Negative Conduction: T3 (SCR) and D4 (Diode) conducting (Neutral → Load → Phase A).';
    } else if (isT1On && isD4On) {
      conductingDevices.push('T1', 'D4');
      conductionCycle = 'freewheeling';
      activePathText = 'Bridge Freewheeling: Energy recirculates through T1 (SCR) and D4 (Diode) in Phase A leg.';
    } else if (isT3On && isD2On) {
      conductingDevices.push('T3', 'D2');
      conductionCycle = 'freewheeling';
      activePathText = 'Bridge Freewheeling: Energy recirculates through T3 (SCR) and D2 (Diode) in Neutral leg.';
    } else if (isFwdOn) {
      conductingDevices.push('FWD');
      conductionCycle = 'freewheeling';
      activePathText = 'Freewheeling Mode: Inductive energy recirculates through external D_FW.';
    } else {
      conductionCycle = 'blocking';
      activePathText = 'Delay Angle α: Devices blocking, waiting for gate pulse.';
    }

    deviceCurrents['T1'] = closest.iDevice1;
    deviceCurrents['T3'] = closest.iDevice3;
    deviceCurrents['D2'] = closest.iDevice2;
    deviceCurrents['D4'] = closest.iDevice4;
    deviceVoltages['T1'] = isT1On ? 0.7 : -closest.vo;
    deviceVoltages['T3'] = isT3On ? 0.7 : -closest.vo;
    deviceVoltages['D2'] = isD2On ? 0.7 : -closest.vo;
    deviceVoltages['D4'] = isD4On ? 0.7 : -closest.vo;
  } else {
    if (isD1On && isD2On) {
      conductingDevices.push(`${prefix}1`, `${prefix}2`);
      conductionCycle = 'positive';
      activePathText = `Positive Half Cycle: ${prefix}1 and ${prefix}2 are conducting (Phase A → Load → Neutral).`;
    } else if (isD3On && isD4On) {
      conductingDevices.push(`${prefix}3`, `${prefix}4`);
      conductionCycle = 'negative';
      activePathText = `Negative Half Cycle: ${prefix}3 and ${prefix}4 are conducting (Neutral → Load → Phase A).`;
    } else if (isFwdOn) {
      conductingDevices.push('FWD');
      conductionCycle = 'freewheeling';
      activePathText = 'Freewheeling Mode: Inductive energy recirculates through D_FW.';
    } else {
      conductionCycle = 'blocking';
      activePathText = 'Zero-Crossing / Delay Angle α: Devices blocking, waiting for gate pulse.';
    }

    deviceCurrents[`${prefix}1`] = closest.iDevice1;
    deviceCurrents[`${prefix}2`] = closest.iDevice2;
    deviceCurrents[`${prefix}3`] = closest.iDevice3;
    deviceCurrents[`${prefix}4`] = closest.iDevice4;
    deviceVoltages[`${prefix}1`] = isD1On ? 0.7 : -closest.vo;
    deviceVoltages[`${prefix}2`] = isD2On ? 0.7 : -closest.vo;
    deviceVoltages[`${prefix}3`] = isD3On ? 0.7 : -closest.vo;
    deviceVoltages[`${prefix}4`] = isD4On ? 0.7 : -closest.vo;
  }

  return {
    timeMs: closest.timeMs,
    phaseDeg: closest.phaseDeg,
    vs: closest.vs,
    is: closest.is,
    vo: closest.vo,
    io: closest.io,
    van: closest.van,
    vbn: closest.vbn,
    vcn: closest.vcn,
    gateTriggered: closest.gatePulse > 0,
    activePathText,
    conductionCycle,
    conductingDevices,
    deviceCurrents,
    deviceVoltages,
    fwdCurrent: closest.iFwd
  };
}
