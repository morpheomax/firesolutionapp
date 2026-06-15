import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { firePumpComponents as COMPONENTS, defaultSelectedComponentId } from "../data/firePumpSystem";

// ─────────────────────────────────────────────────────────────────────────────
// REAL DIMENSIONS — Based on:
//   • NFPA 20 generic learning baseline aligned to a 1,500 GPM packaged system
//   • Horizontal Split-Case pump datasheet (PDN 200-300M equivalent):
//     Casing ~795mm L x 760mm W, 10" suction / 8" discharge flanges (scaled)
//     Used as Patterson/Aurora equivalent 1000 GPM HSC pump
//   • NFPA 20 §4.12: 0.9m (3 ft) clearance around pumps and controllers
//   • NFPA 20 §4.14: Suction pipe rules (10D straight run, eccentric reducer)
//   • Pump room: 7.0m W x 12.0m L x 3.5m H (real caseta exterior)
//   • Cisterna NFPA 22: ~3.6m L x 2.4m W x 2.0m H (20,000 L capacity)
//
// SCALE: 1 Three.js unit = 1 meter
// ─────────────────────────────────────────────────────────────────────────────

// Educational baseline pipe diameters for a believable 1,500 GPM package
const PIPE_D = {
  suction: 0.254,      // 10" = 254mm
  discharge: 0.203,    // 8" = 203mm
  relief: 0.102,       // 4"
  jockey: 0.038,       // 1.5"
  sensing: 0.013,      // 1/2"
  meter: 0.203,        // 8"
};

// Real pump dimensions (HSC baseline adapted toward 1,500 GPM package)
const PUMP = {
  casingL: 1.22,
  casingW: 0.82,
  casingH: 0.64,
  motorL: 1.55,
  motorD: 0.48,
  baseW: 0.36,     // base rail width
  baseH: 0.12,     // base rail height
  shaftH: 0.64,
  totalL: 3.05,
};

// Caseta dimensions (real)
const ROOM = {
  L: 12.0,   // length (m)
  W: 7.0,    // width (m)
  H: 3.5,    // interior height (m)
  wallT: 0.2,// wall thickness (m)
};

// Cylindrical fire tank sized to read as a Supertank-style outdoor reserve
const TANK = {
  R: 2.45,
  H: 4.1,
  wallT: 0.12,
};

const WAREHOUSE = {
  L: 24,
  W: 14,
  H: 8,
};

// Layout positions (all in meters, room centered at origin)
// Room goes from x=-6 to x=+6, z=-3.5 to z=+3.5
const POS = {
  tank:         { x: -10.6, y: 0,    z: 0 },      // cisterna exterior, lado oeste
  mainPump:     { x: -2.0, y: 0,    z: 0.5 },    // bomba principal - eje E-O
  dieselPump:   { x: -2.0, y: 0,    z: -2.5 },   // bomba diesel - eje paralelo
  jockeyPump:   { x: -2.0, y: 0,    z: 2.8 },    // bomba jockey
  manifold:     { x:  2.5, y: PUMP.shaftH, z: 0 },  // manifold descarga
  controllers:  { x:  4.8, y: 0,    z: 0 },      // panel controladores (pared este)
  testHeader:   { x:  0,   y: 0,    z: -3.2 },   // test header (pared sur)
  flowMeter:    { x:  3.5, y: PUMP.shaftH, z: 0 },  // medidor de flujo
  dieselFuelTank: { x: 3.4, y: 0, z: -2.65 },
  sprinklerRiser: { x: 11.4, y: 0, z: 2.2 },
  warehouse: { x: 19.5, y: 0, z: 0 },
  fdc: { x: 9.6, y: 0, z: -4.4 },
  alarmValve: { x: 10.4, y: 0.95, z: 2.2 },
  loadingYard: { x: 18.5, y: 0, z: -9.1 },
};

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Utility: create material
// ─────────────────────────────────────────────────────────────────────────────
const mat = (color, roughness = 0.45, metalness = 0.55) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

const controlButtonStyle = {
  width: 40,
  height: 40,
  border: '1px solid rgba(148,163,184,0.35)',
  borderRadius: 12,
  background: '#ffffff',
  color: '#0f172a',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
};

// Cylinder helper
function makePipe(r, length, color, rot = 'x') {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, length, 16), mat(color, 0.5, 0.65));
  if (rot === 'x') m.rotation.z = Math.PI / 2;
  if (rot === 'z') m.rotation.x = Math.PI / 2;
  return m;
}

// ─────────────────────────────────────────────────────────────────────────────
// Build 3D Scene
// ─────────────────────────────────────────────────────────────────────────────
function buildScene(scene, meshMap) {
  function addGroup(id, buildFn) {
    const g = new THREE.Group();
    buildFn(g);
    g.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
    scene.add(g);
    meshMap[id] = { mesh: g };
  }

  // ── FLOOR ─────────────────────────────────────────────────────────────────
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(54, 28),
    new THREE.MeshStandardMaterial({ color: 0x17202a, roughness: 0.9 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Floor grid (metric — 1m squares)
  const grid = new THREE.GridHelper(54, 54, 0x1c2833, 0x1c2833);
  grid.position.y = 0.005;
  scene.add(grid);

  const sitePad = new THREE.Mesh(
    new THREE.PlaneGeometry(52, 26),
    new THREE.MeshStandardMaterial({ color: 0xe5e7eb, roughness: 0.96, metalness: 0.02 })
  );
  sitePad.rotation.x = -Math.PI / 2;
  sitePad.position.y = 0.001;
  sitePad.receiveShadow = true;
  scene.add(sitePad);

  const roadStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(52, 4),
    new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.95, metalness: 0.02 })
  );
  roadStrip.rotation.x = -Math.PI / 2;
  roadStrip.position.set(10, 0.002, -8.6);
  roadStrip.receiveShadow = true;
  scene.add(roadStrip);

  // ── CISTERNA ──────────────────────────────────────────────────────────────
  addGroup("cistern", g => {
    const p = POS.tank;
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(TANK.R, TANK.R, TANK.H, 40, 1, true), mat(0x93c5fd, 0.78, 0.1));
    shell.position.set(p.x, TANK.H / 2, p.z);
    g.add(shell);
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(TANK.R + 0.04, TANK.R + 0.04, 0.1, 40), mat(0xe2e8f0, 0.7, 0.05));
    roof.position.set(p.x, TANK.H + 0.05, p.z);
    roof.userData.isToggleRoof = true;
    g.add(roof);
    for (let i = 0; i < 8; i++) {
      const band = new THREE.Mesh(new THREE.TorusGeometry(TANK.R + 0.02, 0.028, 10, 48), mat(0x3b82f6, 0.7, 0.18));
      band.rotation.x = Math.PI / 2;
      band.position.set(p.x, 0.45 + i * 0.48, p.z);
      g.add(band);
    }
    const water = new THREE.Mesh(
      new THREE.CircleGeometry(TANK.R - 0.16, 36),
      new THREE.MeshStandardMaterial({ color: 0x1f6fa8, roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.75 })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(p.x, TANK.H - 0.05, p.z);
    g.add(water);
    const hatch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.38, 0.06, 20),
      mat(0x2e4057, 0.6, 0.5)
    );
    hatch.position.set(p.x + 0.6, TANK.H + 0.1, p.z + 0.2);
    g.add(hatch);
    const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8), mat(0x95a5a6));
    vent.position.set(p.x - 0.7, TANK.H + 0.28, p.z - 0.45);
    g.add(vent);
    const lvl = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, TANK.H, 8), mat(0xbdc3c7, 0.3, 0.7));
    lvl.position.set(p.x + TANK.R + 0.12, TANK.H / 2, p.z);
    g.add(lvl);
    const ladderRailL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, TANK.H + 0.6, 8), mat(0xc39d63, 0.4, 0.35));
    ladderRailL.position.set(p.x - TANK.R - 0.18, TANK.H / 2 + 0.3, p.z + 0.95);
    g.add(ladderRailL);
    const ladderRailR = ladderRailL.clone();
    ladderRailR.position.z = p.z + 0.62;
    g.add(ladderRailR);
    for (let i = 0; i < 7; i++) {
      const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.38, 8), mat(0xd4ac0d, 0.4, 0.4));
      rung.rotation.z = Math.PI / 2;
      rung.position.set(p.x - TANK.R - 0.18, 0.45 + i * 0.52, p.z + 0.79);
      g.add(rung);
    }
  });

  // ── SUCTION HEADER 8" ─────────────────────────────────────────────────────
  addGroup("suctionHeader", g => {
    const r = PIPE_D.suction / 2;   // 101.5mm
    // Main suction header (horizontal, E-W)
    // From cisterna x=-7.7 to pump header at x=-3.5
    const headerL = 4.5;
    const hdr = makePipe(r, headerL, 0x2471a3);
    hdr.position.set(-5.95, PUMP.shaftH, 0);
    g.add(hdr);

    // Branch drops to each pump (vertical, 8" reduced to pump flange)
    // Main pump branch
    const br1 = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.6, 16), mat(0x2471a3));
    br1.position.set(-3.7, PUMP.shaftH - 0.3, POS.mainPump.z);
    g.add(br1);
    // Diesel pump branch
    const br2 = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.6, 16), mat(0x2471a3));
    br2.position.set(-3.7, PUMP.shaftH - 0.3, POS.dieselPump.z);
    g.add(br2);

    // Eccentric reducer flat-top (8" → pump inlet) — represented as cone
    const ecc1 = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.7, r, 0.25, 12), mat(0x1f618d));
    ecc1.position.set(-3.4, PUMP.shaftH, POS.mainPump.z);
    ecc1.rotation.z = Math.PI / 2;
    g.add(ecc1);
    const ecc2 = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.7, r, 0.25, 12), mat(0x1f618d));
    ecc2.position.set(-3.4, PUMP.shaftH, POS.dieselPump.z);
    ecc2.rotation.z = Math.PI / 2;
    g.add(ecc2);
  });

  // ── FOOT VALVE ────────────────────────────────────────────────────────────
  addGroup("footValve", g => {
    const p = POS.tank;
    const r = PIPE_D.suction / 2;
    // Vertical suction drop inside tank
    const drop = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1.6, 16), mat(0x2471a3));
    drop.position.set(p.x + 1.8 - 0.1, 0.8, p.z);
    g.add(drop);
    // Foot valve body
    const body = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.5, r * 1.3, 0.35, 12), mat(0xe67e22, 0.35, 0.7));
    body.position.set(p.x + 1.8 - 0.1, 0.18, p.z);
    g.add(body);
    // Strainer basket
    const basket = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.45, r * 1.45, 0.22, 12, 1, true), new THREE.MeshStandardMaterial({ color: 0xca6f1e, wireframe: true }));
    basket.position.set(p.x + 1.8 - 0.1, 0.0, p.z);
    g.add(basket);
  });

  // ── MAIN PUMP (HSC Electric) ───────────────────────────────────────────────
  addGroup("mainPump", g => {
    const p = POS.mainPump;
    // Base frame (inertia block / rail)
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(PUMP.totalL + 0.2, PUMP.baseH, PUMP.baseW * 2.2),
      mat(0x424242, 0.8, 0.3)
    );
    base.position.set(p.x + PUMP.totalL / 2 - 0.5, PUMP.baseH / 2, p.z);
    g.add(base);
    // Pump casing (horizontal split case — 2 halves visible)
    const casingBot = new THREE.Mesh(
      new THREE.BoxGeometry(PUMP.casingL, PUMP.casingH * 0.5, PUMP.casingW),
      mat(0xb03a2e, 0.35, 0.65)
    );
    casingBot.position.set(p.x, PUMP.baseH + PUMP.casingH * 0.25, p.z);
    g.add(casingBot);
    const casingTop = new THREE.Mesh(
      new THREE.BoxGeometry(PUMP.casingL, PUMP.casingH * 0.55, PUMP.casingW - 0.06),
      mat(0xc0392b, 0.3, 0.7)
    );
    casingTop.position.set(p.x, PUMP.baseH + PUMP.casingH * 0.75, p.z);
    g.add(casingTop);
    // Horizontal split line
    const split = new THREE.Mesh(
      new THREE.BoxGeometry(PUMP.casingL + 0.02, 0.02, PUMP.casingW + 0.02),
      mat(0x7b7d7d, 0.5, 0.8)
    );
    split.position.set(p.x, PUMP.baseH + PUMP.casingH * 0.5, p.z);
    g.add(split);
    // Coupling guard
    const guard = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.32, 16),
      mat(0x5d6d7e, 0.7, 0.3)
    );
    guard.rotation.z = Math.PI / 2;
    guard.position.set(p.x + PUMP.casingL / 2 + 0.16, PUMP.shaftH, p.z);
    g.add(guard);
    // Motor
    const motor = new THREE.Mesh(
      new THREE.CylinderGeometry(PUMP.motorD / 2, PUMP.motorD / 2, PUMP.motorL, 20),
      mat(0x78281f, 0.3, 0.6)
    );
    motor.rotation.z = Math.PI / 2;
    motor.position.set(p.x + PUMP.casingL / 2 + 0.32 + PUMP.motorL / 2, PUMP.shaftH, p.z);
    g.add(motor);
    // Motor cooling fins
    for (let i = 0; i < 8; i++) {
      const fin = new THREE.Mesh(new THREE.CylinderGeometry(PUMP.motorD / 2 + 0.04, PUMP.motorD / 2 + 0.04, 0.05, 20), mat(0x641e16, 0.5, 0.5));
      fin.rotation.z = Math.PI / 2;
      fin.position.set(p.x + PUMP.casingL / 2 + 0.5 + i * 0.14, PUMP.shaftH, p.z);
      g.add(fin);
    }
    // Suction flange 8"
    const sFlange = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.06, 16), mat(0x922b21, 0.4, 0.7));
    sFlange.rotation.z = Math.PI / 2;
    sFlange.position.set(p.x - PUMP.casingL / 2 - 0.03, PUMP.shaftH, p.z);
    g.add(sFlange);
    // Discharge flange 6" (top)
    const dFlange = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.06, 16), mat(0x922b21, 0.4, 0.7));
    dFlange.position.set(p.x, PUMP.casingH + PUMP.baseH, p.z);
    g.add(dFlange);
  });

  // ── DIESEL PUMP ───────────────────────────────────────────────────────────
  addGroup("dieselPump", g => {
    const p = POS.dieselPump;
    // Base
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(PUMP.totalL + 0.5, PUMP.baseH, PUMP.baseW * 2.5),
      mat(0x3d3d3d, 0.8, 0.3)
    );
    base.position.set(p.x + PUMP.totalL / 2 - 0.3, PUMP.baseH / 2, p.z);
    g.add(base);
    // Pump casing
    const casingBot = new THREE.Mesh(new THREE.BoxGeometry(PUMP.casingL, PUMP.casingH * 0.5, PUMP.casingW), mat(0x515a5a, 0.45, 0.65));
    casingBot.position.set(p.x, PUMP.baseH + PUMP.casingH * 0.25, p.z);
    g.add(casingBot);
    const casingTop = new THREE.Mesh(new THREE.BoxGeometry(PUMP.casingL, PUMP.casingH * 0.55, PUMP.casingW - 0.06), mat(0x626567, 0.35, 0.7));
    casingTop.position.set(p.x, PUMP.baseH + PUMP.casingH * 0.75, p.z);
    g.add(casingTop);
    // Diesel engine block
    const engine = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.85, 0.82), mat(0x4a4a4a, 0.55, 0.45));
    engine.position.set(p.x + PUMP.casingL / 2 + 0.95, PUMP.baseH + 0.42, p.z);
    g.add(engine);
    // Valve cover
    const valveCover = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.18, 0.5), mat(0x626567, 0.5, 0.5));
    valveCover.position.set(p.x + PUMP.casingL / 2 + 0.95, PUMP.baseH + 0.93, p.z);
    g.add(valveCover);
    // Battery box
    const battery = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 0.2), mat(0x1a252f, 0.7, 0.2));
    battery.position.set(p.x + PUMP.casingL / 2 + 2.0, PUMP.baseH + 0.69, p.z);
    g.add(battery);
    const battery2 = battery.clone();
    battery2.position.z -= 0.28;
    g.add(battery2);
  });

  // ── JOCKEY PUMP ──────────────────────────────────────────────────────────
  addGroup("jockeyPump", g => {
    const p = POS.jockeyPump;
    // Small vertical close-coupled pump
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.1, 0.45), mat(0x212f3c, 0.8, 0.3));
    base.position.set(p.x, 0.05, p.z);
    g.add(base);
    const casing = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.38, 14), mat(0x1e8449, 0.35, 0.65));
    casing.position.set(p.x, 0.29, p.z);
    g.add(casing);
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.52, 14), mat(0x145a32, 0.35, 0.6));
    motor.position.set(p.x, 0.74, p.z);
    g.add(motor);
    // Fin cooling
    for (let i = 0; i < 5; i++) {
      const fin = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.04, 14), mat(0x0e6b38));
      fin.position.set(p.x, 0.52 + i * 0.09, p.z);
      g.add(fin);
    }
    // Pipes 1.5"
    const rj = PIPE_D.jockey / 2;
    const pipeIn = new THREE.Mesh(new THREE.CylinderGeometry(rj, rj, 0.8, 8), mat(0x2980b9));
    pipeIn.position.set(p.x, 0.4, p.z + 0.17);
    g.add(pipeIn);
    const pipeOut = new THREE.Mesh(new THREE.CylinderGeometry(rj, rj, 0.6, 8), mat(0x2980b9));
    pipeOut.position.set(p.x, 0.9, p.z - 0.17);
    g.add(pipeOut);
  });

  // ── DISCHARGE MANIFOLD 6" ─────────────────────────────────────────────────
  addGroup("dischargeManifold", g => {
    const r = PIPE_D.discharge / 2;  // 76mm
    const p = POS.manifold;
    // Main header pipe (vertical, runs N-S)
    const header = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 6.0, 16), mat(0x7d3c98, 0.4, 0.65));
    header.rotation.x = Math.PI / 2;
    header.position.set(p.x, p.y, 0);
    g.add(header);
    // Flanges along header
    [-2.5, -1.0, 0.5, 2.0].forEach(z => {
      const fl = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.6, r * 1.6, 0.06, 16), mat(0x6c3483, 0.5, 0.75));
      fl.rotation.x = Math.PI / 2;
      fl.position.set(p.x, p.y, z);
      g.add(fl);
    });
    // OS&Y valves on manifold branches
    [POS.mainPump.z, POS.dieselPump.z].forEach(z => {
      const vBody = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), mat(0xf39c12, 0.3, 0.7));
      vBody.position.set(p.x - 0.8, p.y, z);
      g.add(vBody);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8), mat(0xf0b513));
      stem.position.set(p.x - 0.8, p.y + 0.31, z);
      g.add(stem);
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 8, 16), mat(0xe67e22));
      wheel.position.set(p.x - 0.8, p.y + 0.51, z);
      g.add(wheel);
    });
  });

  // ── CHECK VALVES (on discharge of each pump) ──────────────────────────────
  addGroup("checkValve", g => {
    const r = PIPE_D.discharge / 2;
    [[POS.mainPump.x + 0.8, PUMP.shaftH, POS.mainPump.z],
     [POS.dieselPump.x + 0.8, PUMP.shaftH, POS.dieselPump.z]].forEach(([x, y, z]) => {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.55, r * 1.55, 0.28, 12), mat(0x16a085, 0.35, 0.7));
      body.rotation.z = Math.PI / 2;
      body.position.set(x, y, z);
      g.add(body);
      const flL = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.7, r * 1.7, 0.05, 12), mat(0x117a65, 0.4, 0.75));
      flL.rotation.z = Math.PI / 2;
      flL.position.set(x - 0.17, y, z);
      g.add(flL);
      const flR = flL.clone();
      flR.position.set(x + 0.17, y, z);
      g.add(flR);
    });
  });

  // ── OS&Y GATE VALVES (suction isolation) ─────────────────────────────────
  addGroup("gateValveOS", g => {
    // One per pump suction branch
    [[POS.mainPump.x - PUMP.casingL / 2 - 0.55, PUMP.shaftH, POS.mainPump.z],
     [POS.dieselPump.x - PUMP.casingL / 2 - 0.55, PUMP.shaftH, POS.dieselPump.z]].forEach(([x, y, z]) => {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), mat(0xf39c12, 0.3, 0.7));
      body.position.set(x, y, z);
      g.add(body);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 8), mat(0xf0b513));
      stem.position.set(x, y + 0.37, z);
      g.add(stem);
      const handwheel = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 8, 16), mat(0xe67e22));
      handwheel.position.set(x, y + 0.6, z);
      g.add(handwheel);
      // Supervisory switch (small box)
      const sw = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.04), mat(0x1a252f));
      sw.position.set(x, y + 0.2, z + 0.18);
      g.add(sw);
    });
  });

  // ── PRESSURE GAUGES ───────────────────────────────────────────────────────
  addGroup("pressureGauge", g => {
    const gaugePositions = [
      // Suction gauges (compound)
      [POS.mainPump.x - 0.5, PUMP.shaftH + 0.55, POS.mainPump.z + 0.38],
      [POS.dieselPump.x - 0.5, PUMP.shaftH + 0.55, POS.dieselPump.z + 0.38],
      // Discharge gauges
      [POS.mainPump.x, PUMP.shaftH + 0.75, POS.mainPump.z + 0.38],
      [POS.dieselPump.x, PUMP.shaftH + 0.75, POS.dieselPump.z + 0.38],
    ];
    gaugePositions.forEach(([x, y, z]) => {
      const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.055, 16), mat(0xbdc3c7, 0.2, 0.5));
      gauge.rotation.x = Math.PI / 2;
      gauge.position.set(x, y, z);
      g.add(gauge);
      const face = new THREE.Mesh(new THREE.CircleGeometry(0.08, 16), new THREE.MeshStandardMaterial({ color: 0xf0f3f4 }));
      face.rotation.x = -Math.PI / 2;
      face.position.set(x, y, z + 0.032);
      g.add(face);
      // Needle
      const needle = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.001, 0.055), mat(0xe74c3c, 0.3, 0.5));
      needle.position.set(x - 0.015, y, z + 0.038);
      needle.rotation.z = -0.7;
      g.add(needle);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.15, 8), mat(0x95a5a6));
      stem.position.set(x, y - 0.12, z);
      g.add(stem);
    });
  });

  // ── RELIEF VALVE 4" ───────────────────────────────────────────────────────
  addGroup("reliefValve", g => {
    const r = PIPE_D.relief / 2;  // 51mm
    const x = POS.manifold.x + 0.2, y = PUMP.shaftH + 0.65, z = -1.0;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.4, r * 1.2, 0.38, 12), mat(0xe74c3c, 0.35, 0.65));
    body.position.set(x, y, z);
    g.add(body);
    const spring = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r * 0.9, 0.2, 12), mat(0xaab7b8, 0.6, 0.7));
    spring.position.set(x, y + 0.29, z);
    g.add(spring);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.1, r * 1.1, 0.12, 12), mat(0xc0392b, 0.3, 0.7));
    cap.position.set(x, y + 0.45, z);
    g.add(cap);
    // Discharge pipe (to drain, horizontal)
    const drain = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.6, 12), mat(0xe74c3c));
    drain.rotation.x = Math.PI / 2;
    drain.position.set(x, y - 0.1, z + 0.35);
    g.add(drain);
    // Waste cone
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(r * 2, r, 0.22, 12), mat(0xaab7b8, 0.6, 0.4));
    cone.rotation.x = Math.PI / 2;
    cone.position.set(x, y - 0.1, z + 0.75);
    g.add(cone);
  });

  // ── FLOW METER 6" ─────────────────────────────────────────────────────────
  addGroup("flowMeter", g => {
    const r = PIPE_D.discharge / 2;
    const p = POS.flowMeter;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.65, r * 1.65, 0.35, 16), mat(0x117a65, 0.35, 0.65));
    body.rotation.x = Math.PI / 2;
    body.position.set(p.x, p.y, 0);
    g.add(body);
    const display = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.06), mat(0x1a252f, 0.7, 0.2));
    display.position.set(p.x, p.y + 0.28, 0.02);
    g.add(display);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.08), new THREE.MeshStandardMaterial({ color: 0x1abc9c, emissive: 0x1abc9c, emissiveIntensity: 0.4 }));
    screen.position.set(p.x, p.y + 0.28, 0.06);
    g.add(screen);
  });

  // ── PUMP CONTROLLERS ──────────────────────────────────────────────────────
  addGroup("pumpController", g => {
    const controllerDefs = [
      { label: "Eléctrica", z: POS.mainPump.z + 0.5, col: 0xc0392b },
      { label: "Diésel",    z: POS.dieselPump.z + 0.5, col: 0x626567 },
      { label: "Jockey",    z: POS.jockeyPump.z - 0.3, col: 0x1e8449 },
    ];
    const cx = POS.controllers.x;
    controllerDefs.forEach(({ z, col }) => {
      // Cabinet
      const cab = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 0.3), mat(0x1c2833, 0.65, 0.3));
      cab.position.set(cx, 0.6, z);
      g.add(cab);
      // Door panel
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.46, 1.16, 0.04), mat(0x212f3c, 0.7, 0.25));
      door.position.set(cx, 0.6, z + 0.17);
      g.add(door);
      // Top accent
      const accent = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.3), mat(col, 0.4, 0.5));
      accent.position.set(cx, 1.23, z);
      g.add(accent);
      // Indicator lights
      const lightCols = [0x27ae60, 0xe74c3c, 0xf39c12, 0x3498db];
      lightCols.forEach((lc, j) => {
        const light = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8),
          new THREE.MeshStandardMaterial({ color: lc, emissive: lc, emissiveIntensity: 0.9 }));
        light.position.set(cx - 0.14, 1.0 - j * 0.1, z + 0.185);
        g.add(light);
      });
      // Analog meter (pressure display)
      const meter = new THREE.Mesh(new THREE.CircleGeometry(0.06, 16),
        new THREE.MeshStandardMaterial({ color: 0xf5f5f5 }));
      meter.position.set(cx + 0.05, 0.85, z + 0.186);
      g.add(meter);
      // Start button (green)
      const btnStart = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.03, 12),
        new THREE.MeshStandardMaterial({ color: 0x27ae60, emissive: 0x1e8449, emissiveIntensity: 0.5 }));
      btnStart.rotation.x = Math.PI / 2;
      btnStart.position.set(cx - 0.06, 0.55, z + 0.186);
      g.add(btnStart);
      // Stop button (red)
      const btnStop = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.03, 12),
        new THREE.MeshStandardMaterial({ color: 0xe74c3c, emissive: 0xc0392b, emissiveIntensity: 0.5 }));
      btnStop.rotation.x = Math.PI / 2;
      btnStop.position.set(cx + 0.06, 0.55, z + 0.186);
      g.add(btnStop);
    });
  });

  // ── PUMP HOUSE LOUVERS ────────────────────────────────────────────────────
  addGroup("pumpHouseLouvers", g => {
    const makeLouver = (x, y, z, rotY = 0) => {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.95, 0.08), mat(0x94a3b8, 0.65, 0.22));
      frame.position.set(x, y, z);
      frame.rotation.y = rotY;
      g.add(frame);
      for (let i = 0; i < 5; i++) {
        const slat = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.05, 0.12), mat(0xe2e8f0, 0.45, 0.18));
        slat.position.set(x, y - 0.22 + i * 0.11, z + (rotY === 0 ? 0.02 : 0));
        slat.rotation.x = -0.35;
        slat.rotation.y = rotY;
        g.add(slat);
      }
    };
    makeLouver(ROOM.L / 2 - 0.04, 2.25, -1.7, Math.PI / 2);
    makeLouver(ROOM.L / 2 - 0.04, 2.25, -0.25, Math.PI / 2);
    makeLouver(-ROOM.L / 2 + 0.04, 2.25, 1.4, Math.PI / 2);
  });

  // ── DIESEL FUEL TANK ──────────────────────────────────────────────────────
  addGroup("dieselFuelTank", g => {
    const p = POS.dieselFuelTank;
    const bund = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, 1.4), mat(0x5b2c1a, 0.85, 0.2));
    bund.position.set(p.x, 0.15, p.z);
    g.add(bund);
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.55, 18), mat(0x7b241c, 0.45, 0.35));
    tank.rotation.z = Math.PI / 2;
    tank.position.set(p.x, 1.0, p.z);
    g.add(tank);
    const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.8, 0.12), mat(0x784212, 0.7, 0.25));
    leg1.position.set(p.x - 0.45, 0.45, p.z - 0.22);
    g.add(leg1);
    const leg2 = leg1.clone(); leg2.position.z = p.z + 0.22; g.add(leg2);
    const leg3 = leg1.clone(); leg3.position.x = p.x + 0.45; g.add(leg3);
    const leg4 = leg2.clone(); leg4.position.x = p.x + 0.45; g.add(leg4);
    const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.75, 8), mat(0xbdc3c7, 0.6, 0.5));
    vent.position.set(p.x + 0.35, 1.68, p.z + 0.12);
    g.add(vent);
    const fill = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.38, 8), mat(0xa93226, 0.5, 0.35));
    fill.position.set(p.x - 0.2, 1.48, p.z - 0.08);
    g.add(fill);
    const fuelLine = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.0, 8), mat(0x85929e, 0.7, 0.35));
    fuelLine.rotation.z = Math.PI / 2;
    fuelLine.position.set(1.2, 0.55, p.z);
    g.add(fuelLine);
  });

  // ── DIESEL EXHAUST SYSTEM ────────────────────────────────────────────────
  addGroup("exhaustSystem", g => {
    const baseX = POS.dieselPump.x + PUMP.casingL / 2 + 0.7;
    const baseY = PUMP.baseH + 1.35;
    const baseZ = POS.dieselPump.z + 0.35;
    const riser = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.0, 8), mat(0x7f8c8d, 0.7, 0.5));
    riser.position.set(baseX, baseY + 0.25, baseZ);
    g.add(riser);
    const muffler = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.65, 12), mat(0x626567, 0.6, 0.4));
    muffler.position.set(baseX, baseY + 1.0, baseZ);
    g.add(muffler);
    const roofPenetration = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1.9, 10), mat(0x95a5a6, 0.65, 0.45));
    roofPenetration.position.set(baseX, 2.55, baseZ);
    g.add(roofPenetration);
    const rainCap = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.08, 12), mat(0xbdc3c7, 0.6, 0.35));
    rainCap.position.set(baseX, 3.55, baseZ);
    g.add(rainCap);
    const support = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.08), mat(0x566573, 0.7, 0.3));
    support.position.set(baseX - 0.18, 2.1, baseZ);
    g.add(support);
  });

  // ── TEST HEADER 4×2½" ─────────────────────────────────────────────────────
  addGroup("testHeader", g => {
    const p = POS.testHeader;
    const r6 = PIPE_D.discharge / 2;
    // Supply pipe
    const supply = new THREE.Mesh(new THREE.CylinderGeometry(r6, r6, 1.2, 16), mat(0xca6f1e, 0.5, 0.6));
    supply.rotation.x = Math.PI / 2;
    supply.position.set(p.x, PUMP.shaftH, p.z);
    g.add(supply);
    // 5 hose valves 2½"
    const r2h = 0.032;
    [-0.46, -0.23, 0, 0.23, 0.46].forEach(ox => {
      const valve = new THREE.Mesh(new THREE.CylinderGeometry(r2h * 1.8, r2h * 1.6, 0.22, 10), mat(0xd35400, 0.4, 0.65));
      valve.rotation.x = Math.PI / 2;
      valve.position.set(p.x + ox * 1.5, PUMP.shaftH - 0.25, p.z + 0.55);
      g.add(valve);
      // Hose cap
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(r2h * 1.5, r2h * 1.5, 0.06, 10), mat(0xf0b513));
      cap.rotation.x = Math.PI / 2;
      cap.position.set(p.x + ox * 1.5, PUMP.shaftH - 0.25, p.z + 0.72);
      g.add(cap);
    });
  });

  // ── DISCHARGE PIPE to perimeter network ──────────────────────────────────
  addGroup("dischargePipe", g => {
    const r = PIPE_D.discharge / 2;
    // From flow meter to room wall (going east)
    const run1 = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 2.5, 16), mat(0x2980b9, 0.5, 0.65));
    run1.rotation.z = Math.PI / 2;
    run1.position.set(POS.flowMeter.x + 1.55, PUMP.shaftH, 0);
    g.add(run1);
    // OS&Y on discharge out
    const osyBody = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), mat(0xf39c12, 0.3, 0.7));
    osyBody.position.set(POS.flowMeter.x + 2.9, PUMP.shaftH, 0);
    g.add(osyBody);
    const osyStem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.42, 8), mat(0xf0b513));
    osyStem.position.set(POS.flowMeter.x + 2.9, PUMP.shaftH + 0.35, 0);
    g.add(osyStem);
    // Exit through wall (arrow indicator)
    const exit = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1.0, 16), mat(0x2980b9, 0.5, 0.65));
    exit.rotation.z = Math.PI / 2;
    exit.position.set(POS.flowMeter.x + 3.8, PUMP.shaftH, 0);
    g.add(exit);
    // Flow direction arrow
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.35, 8), mat(0x1abc9c, 0.3, 0.6));
    arrow.rotation.z = -Math.PI / 2;
    arrow.position.set(POS.flowMeter.x + 4.45, PUMP.shaftH, 0);
    g.add(arrow);
    // "Red pipe" identifier band
    const band = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.015, r + 0.015, 0.06, 16), mat(0xe74c3c, 0.4, 0.5));
    band.rotation.z = Math.PI / 2;
    band.position.set(POS.flowMeter.x + 1.1, PUMP.shaftH, 0);
    g.add(band);
  });

  // ── GROOVED COUPLINGS ────────────────────────────────────────────────────
  addGroup("groovedCouplings", g => {
    const defs = [
      [POS.mainPump.x - 0.95, PUMP.shaftH, POS.mainPump.z, 'x', PIPE_D.suction / 2],
      [POS.dieselPump.x - 0.95, PUMP.shaftH, POS.dieselPump.z, 'x', PIPE_D.suction / 2],
      [POS.mainPump.x + 0.45, PUMP.shaftH, POS.mainPump.z, 'x', PIPE_D.discharge / 2],
      [POS.dieselPump.x + 0.45, PUMP.shaftH, POS.dieselPump.z, 'x', PIPE_D.discharge / 2],
      [POS.flowMeter.x + 1.55, PUMP.shaftH, 0, 'x', PIPE_D.discharge / 2],
      [POS.sprinklerRiser.x, 1.25, POS.sprinklerRiser.z, 'y', PIPE_D.discharge / 2],
    ];
    defs.forEach(([x, y, z, axis, radius]) => {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(radius + 0.028, radius + 0.028, 0.11, 16), mat(0x566573, 0.55, 0.5));
      if (axis === 'x') body.rotation.z = Math.PI / 2;
      if (axis === 'z') body.rotation.x = Math.PI / 2;
      body.position.set(x, y, z);
      g.add(body);
      const gasket = new THREE.Mesh(new THREE.CylinderGeometry(radius + 0.015, radius + 0.015, 0.04, 16), mat(0x1c2833, 0.8, 0.2));
      if (axis === 'x') gasket.rotation.z = Math.PI / 2;
      if (axis === 'z') gasket.rotation.x = Math.PI / 2;
      gasket.position.set(x, y, z);
      g.add(gasket);
    });
  });

  // ── YARD LOOP ─────────────────────────────────────────────────────────────
  addGroup("yardLoop", g => {
    const r = PIPE_D.discharge / 2;
    const eastX = POS.flowMeter.x + 4.9;
    const loop = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 5.2, 16), mat(0x1f618d, 0.6, 0.45));
    loop.rotation.x = Math.PI / 2;
    loop.position.set(eastX, 0.22, 0.2);
    g.add(loop);
    const returnLeg = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 2.6, 16), mat(0x1f618d, 0.6, 0.45));
    returnLeg.position.set(eastX + 1.5, 0.22, 1.2);
    g.add(returnLeg);
    const marker = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.2, 0.18), mat(0xe74c3c, 0.4, 0.55));
    marker.position.set(eastX - 1.2, 0.6, -1.7);
    g.add(marker);
    const marker2 = marker.clone();
    marker2.position.z = 2.1;
    g.add(marker2);
  });

  // ── YARD HYDRANTS ─────────────────────────────────────────────────────────
  addGroup("yardHydrants", g => {
    const defs = [
      [14.2, 0, -5.1],
      [24.2, 0, 5.2],
    ];
    defs.forEach(([x, y, z]) => {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.9, 12), mat(0xe11d48, 0.45, 0.4));
      body.position.set(x, y + 0.45, z);
      g.add(body);
      const top = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), mat(0xbe123c, 0.4, 0.4));
      top.position.set(x, y + 0.95, z);
      g.add(top);
      const nozzleL = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.28, 10), mat(0xf8fafc, 0.3, 0.22));
      nozzleL.rotation.z = Math.PI / 2;
      nozzleL.position.set(x - 0.18, y + 0.62, z);
      g.add(nozzleL);
      const nozzleR = nozzleL.clone();
      nozzleR.position.x = x + 0.18;
      g.add(nozzleR);
    });
  });

  // ── FIRE DEPARTMENT CONNECTION ────────────────────────────────────────────
  addGroup("fireDepartmentConnection", g => {
    const p = POS.fdc;
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.3, 0.12), mat(0xf1f5f9, 0.5, 0.08));
    plate.position.set(p.x, 1.0, p.z);
    g.add(plate);
    const header = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.55, 12), mat(0xdc2626, 0.4, 0.4));
    header.rotation.z = Math.PI / 2;
    header.position.set(p.x, 0.95, p.z + 0.06);
    g.add(header);
    const in1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.18, 12), mat(0xdc2626, 0.4, 0.4));
    in1.rotation.x = Math.PI / 2;
    in1.position.set(p.x - 0.18, 0.95, p.z + 0.12);
    g.add(in1);
    const in2 = in1.clone();
    in2.position.x = p.x + 0.18;
    g.add(in2);
  });

  // ── SPRINKLER RISER ───────────────────────────────────────────────────────
  addGroup("sprinklerRiser", g => {
    const p = POS.sprinklerRiser;
    const r = PIPE_D.discharge / 2;
    const riser = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 2.3, 16), mat(0xc0392b, 0.45, 0.55));
    riser.position.set(p.x, 1.15, p.z);
    g.add(riser);
    const tee = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.2, r * 1.2, 0.45, 16), mat(0xa93226, 0.4, 0.55));
    tee.rotation.z = Math.PI / 2;
    tee.position.set(p.x, 2.15, p.z);
    g.add(tee);
    const header = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.75, r * 0.75, 3.0, 14), mat(0xc0392b, 0.45, 0.5));
    header.rotation.z = Math.PI / 2;
    header.position.set(p.x + 1.5, 2.15, p.z);
    g.add(header);
    const drop1 = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.8, 10), mat(0xc0392b, 0.5, 0.45));
    drop1.position.set(p.x + 0.7, 1.75, p.z - 0.4);
    g.add(drop1);
    const drop2 = drop1.clone();
    drop2.position.x = p.x + 2.2;
    drop2.position.z = p.z + 0.35;
    g.add(drop2);
  });

  // ── ALARM VALVE ASSEMBLY ──────────────────────────────────────────────────
  addGroup("alarmValveAssembly", g => {
    const p = POS.alarmValve;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.45, 16), mat(0xf97316, 0.45, 0.38));
    body.position.set(p.x, p.y, p.z);
    g.add(body);
    const trim = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.95, 8), mat(0x94a3b8, 0.55, 0.28));
    trim.position.set(p.x + 0.28, p.y + 0.18, p.z + 0.12);
    g.add(trim);
    const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 16), mat(0xe2e8f0, 0.2, 0.18));
    gauge.rotation.x = Math.PI / 2;
    gauge.position.set(p.x - 0.22, p.y + 0.12, p.z + 0.22);
    g.add(gauge);
    const testLine = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.75, 8), mat(0x64748b, 0.6, 0.2));
    testLine.rotation.z = Math.PI / 2;
    testLine.position.set(p.x + 0.42, p.y - 0.1, p.z - 0.25);
    g.add(testLine);
  });

  // ── WAREHOUSE ENVELOPE ────────────────────────────────────────────────────
  addGroup("warehouseEnvelope", g => {
    const p = POS.warehouse;
    const slab = new THREE.Mesh(new THREE.BoxGeometry(WAREHOUSE.L, 0.18, WAREHOUSE.W), mat(0xdbe4ee, 0.95, 0.02));
    slab.position.set(p.x, 0.09, p.z);
    g.add(slab);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.22, side: THREE.DoubleSide });
    const defs = [
      [WAREHOUSE.L, WAREHOUSE.H, 0.18, p.x, WAREHOUSE.H / 2, p.z - WAREHOUSE.W / 2],
      [WAREHOUSE.L, WAREHOUSE.H, 0.18, p.x, WAREHOUSE.H / 2, p.z + WAREHOUSE.W / 2],
      [0.18, WAREHOUSE.H, WAREHOUSE.W, p.x - WAREHOUSE.L / 2, WAREHOUSE.H / 2, p.z],
      [0.18, WAREHOUSE.H, WAREHOUSE.W, p.x + WAREHOUSE.L / 2, WAREHOUSE.H / 2, p.z],
    ];
    defs.forEach(([w, h, d, x, y, z]) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
      wall.position.set(x, y, z);
      g.add(wall);
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.65 }));
      edges.position.set(x, y, z);
      g.add(edges);
    });
    const roof = new THREE.Mesh(new THREE.BoxGeometry(WAREHOUSE.L, 0.12, WAREHOUSE.W), mat(0xf8fafc, 0.82, 0.02));
    roof.position.set(p.x, WAREHOUSE.H, p.z);
    roof.userData.isToggleRoof = true;
    g.add(roof);
    for (let i = -2; i <= 2; i++) {
      const column = new THREE.Mesh(new THREE.BoxGeometry(0.22, WAREHOUSE.H, 0.22), mat(0xcbd5e1, 0.9, 0.08));
      column.position.set(p.x - 8 + i * 4, WAREHOUSE.H / 2, p.z - 4.5);
      g.add(column);
      const column2 = column.clone();
      column2.position.z = p.z + 4.5;
      g.add(column2);
    }
    for (let i = 0; i < 5; i++) {
      const dockDoor = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.8, 0.12), mat(0xe5e7eb, 0.6, 0.04));
      dockDoor.position.set(p.x - 8.8 + i * 4.2, 1.55, p.z - WAREHOUSE.W / 2 + 0.08);
      g.add(dockDoor);
      const dockSeal = new THREE.Mesh(new THREE.BoxGeometry(2.7, 3.1, 0.2), mat(0x1f2937, 0.8, 0.08));
      dockSeal.position.set(p.x - 8.8 + i * 4.2, 1.6, p.z - WAREHOUSE.W / 2 - 0.04);
      g.add(dockSeal);
    }
  });

  // ── WAREHOUSE RACKS ───────────────────────────────────────────────────────
  addGroup("warehouseRacks", g => {
    const startX = POS.warehouse.x - 6.5;
    const rows = [
      { z: -3.2, bays: 4 },
      { z: 0, bays: 4 },
      { z: 3.2, bays: 4 },
    ];
    rows.forEach(({ z, bays }) => {
      for (let bay = 0; bay < bays; bay++) {
        const x = startX + bay * 4.2;
        [ -0.55, 0.55 ].forEach((offsetZ) => {
          const uprightL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 5.8, 0.08), mat(0xf59e0b, 0.55, 0.22));
          uprightL.position.set(x - 1.5, 2.9, z + offsetZ);
          g.add(uprightL);
          const uprightR = uprightL.clone();
          uprightR.position.x = x + 1.5;
          g.add(uprightR);
        });
        [1.2, 2.8, 4.4].forEach((levelY) => {
          const beam = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.12, 0.1), mat(0xfb923c, 0.5, 0.18));
          beam.position.set(x, levelY, z - 0.55);
          g.add(beam);
          const beam2 = beam.clone();
          beam2.position.z = z + 0.55;
          g.add(beam2);
          const pallet = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.45, 0.9), mat(0xcbd5e1, 0.9, 0.03));
          pallet.position.set(x - 0.75, levelY + 0.33, z);
          g.add(pallet);
          const pallet2 = pallet.clone();
          pallet2.position.x = x + 0.75;
          g.add(pallet2);
        });
      }
    });
  });

  // ── LOADING DOCKS AND VEHICLES ────────────────────────────────────────────
  addGroup("loadingDocks", g => {
    const apron = new THREE.Mesh(new THREE.BoxGeometry(24, 0.16, 5.4), mat(0xd1d5db, 0.96, 0.02));
    apron.position.set(POS.loadingYard.x, 0.08, POS.loadingYard.z);
    g.add(apron);
    for (let i = 0; i < 4; i++) {
      const trailer = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.9, 1.8), mat(0xf8fafc, 0.75, 0.02));
      trailer.position.set(POS.warehouse.x - 8 + i * 5.2, 1.45, POS.loadingYard.z - 0.5);
      g.add(trailer);
      const cab = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.5, 1.6), mat(0x0f172a, 0.7, 0.12));
      cab.position.set(POS.warehouse.x - 10.2 + i * 5.2, 0.95, POS.loadingYard.z - 0.45);
      g.add(cab);
      const wheelA = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.18, 14), mat(0x111827, 0.9, 0.1));
      wheelA.rotation.z = Math.PI / 2;
      wheelA.position.set(POS.warehouse.x - 9.5 + i * 5.2, 0.25, POS.loadingYard.z - 1.0);
      g.add(wheelA);
      const wheelB = wheelA.clone();
      wheelB.position.z = POS.loadingYard.z + 0.1;
      g.add(wheelB);
    }
  });

  // ── SPRINKLER NETWORK ─────────────────────────────────────────────────────
  addGroup("sprinklerNetwork", g => {
    const startX = POS.sprinklerRiser.x + 1.7;
    const y = 6.8;
    const z = POS.warehouse.z;
    const main = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 8.2, 14), mat(0xef4444, 0.45, 0.35));
    main.rotation.z = Math.PI / 2;
    main.position.set(startX + 4.1, y, z);
    g.add(main);
    [-4, -1.3, 1.3, 4].forEach((branchOffset) => {
      const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 10.2, 12), mat(0xf87171, 0.45, 0.32));
      branch.rotation.x = Math.PI / 2;
      branch.position.set(startX + branchOffset, y, z);
      g.add(branch);
      [-3.8, -1.4, 1.2, 3.5].forEach((dropZ) => {
        const drop = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.85, 8), mat(0xfca5a5, 0.4, 0.2));
        drop.position.set(startX + branchOffset, y - 0.42, z + dropZ);
        g.add(drop);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), mat(0xf8fafc, 0.22, 0.16));
        head.position.set(startX + branchOffset, y - 0.88, z + dropZ);
        g.add(head);
      });
    });
  });

  // ── PIPING CONNECTIONS (discharge lines from pumps) ───────────────────────
  // Main pump discharge → manifold (vertical then horizontal)
  function addPipeSegment(scene, x1, y1, z1, x2, y2, z2, r, color) {
    const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len < 0.01) return;
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), mat(color, 0.5, 0.65));
    pipe.position.set((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2);
    const dir = new THREE.Vector3(dx, dy, dz).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const axis = up.clone().cross(dir).normalize();
    const angle = Math.acos(up.dot(dir));
    if (axis.length() > 0.001) pipe.quaternion.setFromAxisAngle(axis, angle);
    pipe.castShadow = true;
    scene.add(pipe);
  }

  const r6 = PIPE_D.discharge / 2;
  const r10 = PIPE_D.suction / 2;

  // Tank outlet / foot valve → suction header
  addPipeSegment(scene, POS.tank.x + 1.7, 0.95, 0,
    -8.2, PUMP.shaftH, 0, r10, 0x2471a3);

  // Suction header reducers → pump suction flanges
  addPipeSegment(scene, -3.28, PUMP.shaftH, POS.mainPump.z,
    POS.mainPump.x - PUMP.casingL / 2 - 0.03, PUMP.shaftH, POS.mainPump.z, r10 * 0.78, 0x2471a3);
  addPipeSegment(scene, -3.28, PUMP.shaftH, POS.dieselPump.z,
    POS.dieselPump.x - PUMP.casingL / 2 - 0.03, PUMP.shaftH, POS.dieselPump.z, r10 * 0.78, 0x2471a3);

  // Main pump: discharge (top of casing) → check valve → manifold
  addPipeSegment(scene, POS.mainPump.x, PUMP.casingH + PUMP.baseH, POS.mainPump.z,
    POS.mainPump.x, PUMP.shaftH, POS.mainPump.z, r6, 0x8e44ad);
  addPipeSegment(scene, POS.mainPump.x + 0.55, PUMP.shaftH, POS.mainPump.z,
    POS.manifold.x - 0.9, PUMP.shaftH, POS.mainPump.z, r6, 0x8e44ad);
  addPipeSegment(scene, POS.manifold.x - 0.9, PUMP.shaftH, POS.mainPump.z,
    POS.manifold.x, PUMP.shaftH, POS.mainPump.z, r6, 0x8e44ad);

  // Diesel pump discharge → check → manifold
  addPipeSegment(scene, POS.dieselPump.x, PUMP.casingH + PUMP.baseH, POS.dieselPump.z,
    POS.dieselPump.x, PUMP.shaftH, POS.dieselPump.z, r6, 0x8e44ad);
  addPipeSegment(scene, POS.dieselPump.x + 0.55, PUMP.shaftH, POS.dieselPump.z,
    POS.manifold.x - 0.9, PUMP.shaftH, POS.dieselPump.z, r6, 0x8e44ad);
  addPipeSegment(scene, POS.manifold.x - 0.9, PUMP.shaftH, POS.dieselPump.z,
    POS.manifold.x, PUMP.shaftH, POS.dieselPump.z, r6, 0x8e44ad);

  // Manifold → flow meter
  addPipeSegment(scene, POS.manifold.x + 0.22, PUMP.shaftH, 0,
    POS.flowMeter.x - 0.22, PUMP.shaftH, 0, r6, 0x8e44ad);

  // Flow meter → test header branch
  addPipeSegment(scene, POS.flowMeter.x - 0.25, PUMP.shaftH, -0.25,
    POS.testHeader.x, PUMP.shaftH, POS.testHeader.z + 0.6, r6 * 0.85, 0xca6f1e);

  // Flow meter → discharge through wall
  addPipeSegment(scene, POS.flowMeter.x + 0.22, PUMP.shaftH, 0,
    POS.flowMeter.x + 4.3, PUMP.shaftH, 0, r6, 0x2980b9);

  // Exterior line → yard loop
  addPipeSegment(scene, POS.flowMeter.x + 4.3, PUMP.shaftH, 0,
    POS.flowMeter.x + 4.9, 0.22, 0.2, r6, 0x1f618d);

  // Exterior line → sprinkler riser
  addPipeSegment(scene, POS.flowMeter.x + 4.3, PUMP.shaftH, 0,
    POS.sprinklerRiser.x, PUMP.shaftH, POS.sprinklerRiser.z, r6, 0xc0392b);
  addPipeSegment(scene, POS.sprinklerRiser.x, PUMP.shaftH, POS.sprinklerRiser.z,
    POS.sprinklerRiser.x, 1.15, POS.sprinklerRiser.z, r6, 0xc0392b);
  addPipeSegment(scene, POS.sprinklerRiser.x, 2.15, POS.sprinklerRiser.z,
    POS.sprinklerRiser.x + 1.7, 2.15, POS.sprinklerRiser.z, r6, 0xc0392b);
  addPipeSegment(scene, POS.sprinklerRiser.x + 1.7, 2.15, POS.sprinklerRiser.z,
    POS.sprinklerRiser.x + 1.7, 6.8, POS.sprinklerRiser.z, r6 * 0.9, 0xef4444);

  // FDC tie-in to sprinkler riser
  addPipeSegment(scene, POS.fdc.x, 0.95, POS.fdc.z,
    POS.sprinklerRiser.x - 0.5, 0.95, POS.fdc.z, r6 * 0.45, 0xdc2626);
  addPipeSegment(scene, POS.sprinklerRiser.x - 0.5, 0.95, POS.fdc.z,
    POS.sprinklerRiser.x - 0.5, 1.4, POS.sprinklerRiser.z, r6 * 0.45, 0xdc2626);

  // ── CASETA WALLS (transparent wireframe) ─────────────────────────────────
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50, transparent: true, opacity: 0.08, side: THREE.DoubleSide });
  const wallEdgeMat = new THREE.LineBasicMaterial({ color: 0x34495e, transparent: true, opacity: 0.6 });

  // Walls
  const wallDefs = [
    [ROOM.L, ROOM.H, ROOM.wallT, 0, ROOM.H / 2, -ROOM.W / 2],
    [ROOM.L, ROOM.H, ROOM.wallT, 0, ROOM.H / 2,  ROOM.W / 2],
    [ROOM.wallT, ROOM.H, ROOM.W, -ROOM.L / 2, ROOM.H / 2, 0],
    [ROOM.wallT, ROOM.H, ROOM.W,  ROOM.L / 2, ROOM.H / 2, 0],
  ];
  wallDefs.forEach(([w, h, d, x, y, z]) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    wall.position.set(x, y, z);
    scene.add(wall);
    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d));
    const line = new THREE.LineSegments(edges, wallEdgeMat);
    line.position.set(x, y, z);
    scene.add(line);
  });

  // Roof edges only
  const pumpHouseRoof = new THREE.Mesh(new THREE.BoxGeometry(ROOM.L, 0.12, ROOM.W), new THREE.MeshStandardMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.42 }));
  pumpHouseRoof.position.set(0, ROOM.H, 0);
  pumpHouseRoof.userData.isToggleRoof = true;
  scene.add(pumpHouseRoof);
  const roofGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(ROOM.L, 0.05, ROOM.W));
  const roof = new THREE.LineSegments(roofGeo, new THREE.LineBasicMaterial({ color: 0x4a6080 }));
  roof.position.set(0, ROOM.H, 0);
  roof.userData.isToggleRoof = true;
  scene.add(roof);

  // Door (south wall, west side)
  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.22), new THREE.MeshStandardMaterial({ color: 0x1a252f, transparent: true, opacity: 0.6 }));
  doorFrame.position.set(-ROOM.L / 2 + 1.5, 1.1, -ROOM.W / 2);
  scene.add(doorFrame);

  // ── DIMENSION ANNOTATIONS (thin lines) ───────────────────────────────────
  // Clearance indicator around main pump (NFPA 20: 0.9m)
  const clearGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(PUMP.totalL + 1.8, 0.01, PUMP.baseW * 2 + 1.8));
  const clearLine = new THREE.LineSegments(clearGeo, new THREE.LineBasicMaterial({ color: 0xf39c12, transparent: true, opacity: 0.25 }));
  clearLine.position.set(POS.mainPump.x + PUMP.totalL / 2 - 0.5, 0.01, POS.mainPump.z);
  scene.add(clearLine);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main React Component
// ─────────────────────────────────────────────────────────────────────────────
export default function FirePumpSystem3D({
  className = "",
  showHud = true,
  showInfoPanel = true,
  defaultSelectedId = defaultSelectedComponentId,
  focusMode = false,
  flowMode = false,
  showViewportControls = true,
  onSelectionChange,
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const meshMapRef = useRef({});
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const selectedRef = useRef(null);
  const animRef = useRef(null);
  const flowParticlesRef = useRef([]);
  const flowPathRef = useRef([]);
  const flowModeRef = useRef(flowMode);
  const sprinklerDischargeRef = useRef([]);
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const camAngleRef = useRef({ theta: 0.6, phi: 1.0, radius: 22 });

  const [selected, setSelected] = useState(defaultSelectedId ?? null);
  const [hovered, setHovered] = useState(null);
  const [roofVisible, setRoofVisible] = useState(true);

  function commitSelection(nextSelectedId, { notify = true } = {}) {
    if (selectedRef.current === nextSelectedId) {
      applyFocusModeState(nextSelectedId);
      return;
    }

    if (selectedRef.current) {
      setHighlight(selectedRef.current, false);
    }

    selectedRef.current = nextSelectedId;
    setSelected(nextSelectedId);

    if (nextSelectedId) {
      setHighlight(nextSelectedId, true);
    }

    applyFocusModeState(nextSelectedId);

    if (notify && onSelectionChange) {
      onSelectionChange(nextSelectedId);
    }
  }

  function ensureMaterialState(material) {
    if (!material.userData.originalVisualState) {
      material.userData.originalVisualState = {
        transparent: material.transparent,
        opacity: material.opacity,
      };
    }
  }

  function setComponentDim(id, dimmed) {
    const entry = meshMapRef.current[id];
    if (!entry) return;
    entry.mesh.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        ensureMaterialState(material);
        const original = material.userData.originalVisualState;
        material.transparent = dimmed ? true : original.transparent;
        material.opacity = dimmed ? Math.max(0.08, original.opacity * 0.12) : original.opacity;
      });
    });
  }

  function applyFocusModeState(nextSelectedId = selectedRef.current) {
    Object.keys(meshMapRef.current).forEach((id) => {
      const dimmed = Boolean(focusMode && nextSelectedId && id !== nextSelectedId);
      setComponentDim(id, dimmed);
    });
  }

  function updateCamera(camera, a) {
    camera.position.x = a.radius * Math.sin(a.phi) * Math.cos(a.theta);
    camera.position.y = a.radius * Math.cos(a.phi);
    camera.position.z = a.radius * Math.sin(a.phi) * Math.sin(a.theta);
    camera.lookAt(0, 1.2, 0);
  }

  function setRoofVisibility(visible) {
    if (!sceneRef.current) return;
    sceneRef.current.traverse((child) => {
      if (child.userData?.isToggleRoof) {
        child.visible = visible;
      }
    });
  }

  function adjustCamera(deltaTheta = 0, deltaPhi = 0, deltaRadius = 0) {
    const camera = cameraRef.current;
    if (!camera) return;
    const next = camAngleRef.current;
    next.theta += deltaTheta;
    next.phi = Math.max(0.18, Math.min(Math.PI / 2.05, next.phi + deltaPhi));
    next.radius = Math.max(5, Math.min(35, next.radius + deltaRadius));
    updateCamera(camera, next);
  }

  function resetView() {
    camAngleRef.current = { theta: 0.6, phi: 1.0, radius: 22 };
    if (cameraRef.current) updateCamera(cameraRef.current, camAngleRef.current);
  }

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return undefined;
    const W = container.clientWidth, H = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf4f7fb);
    scene.fog = new THREE.FogExp2(0xf4f7fb, 0.012);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(52, W / H, 0.05, 120);
    updateCamera(camera, camAngleRef.current);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.62));
    const sun = new THREE.DirectionalLight(0xfff5e0, 1.4);
    sun.position.set(8, 18, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 60;
    sun.shadow.camera.left = -14;
    sun.shadow.camera.right = 14;
    sun.shadow.camera.top = 10;
    sun.shadow.camera.bottom = -6;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x9ec5fe, 0.42);
    fill.position.set(-8, 6, -8);
    scene.add(fill);
    const pt1 = new THREE.PointLight(0xff3300, 0.4, 12);
    pt1.position.set(POS.mainPump.x, 3, POS.mainPump.z);
    scene.add(pt1);
    const pt2 = new THREE.PointLight(0x22aa44, 0.25, 8);
    pt2.position.set(POS.jockeyPump.x, 3, POS.jockeyPump.z);
    scene.add(pt2);

    buildScene(scene, meshMapRef.current);
    setRoofVisibility(roofVisible);

    const flowPathPoints = [
      new THREE.Vector3(POS.tank.x + 1.8, PUMP.shaftH, 0),
      new THREE.Vector3(-5.95, PUMP.shaftH, 0),
      new THREE.Vector3(POS.mainPump.x - 0.2, PUMP.shaftH, POS.mainPump.z),
      new THREE.Vector3(POS.mainPump.x + 0.55, PUMP.shaftH, POS.mainPump.z),
      new THREE.Vector3(POS.manifold.x, PUMP.shaftH, 0),
      new THREE.Vector3(POS.flowMeter.x, PUMP.shaftH, 0),
      new THREE.Vector3(POS.flowMeter.x + 4.3, PUMP.shaftH, 0),
      new THREE.Vector3(POS.sprinklerRiser.x, PUMP.shaftH, POS.sprinklerRiser.z),
      new THREE.Vector3(POS.sprinklerRiser.x + 1.7, 6.8, POS.sprinklerRiser.z),
      new THREE.Vector3(POS.warehouse.x + 4, 6.8, POS.warehouse.z),
    ];
    flowPathRef.current = flowPathPoints;

    const flowParticles = Array.from({ length: 16 }, (_, index) => {
      const particle = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x60a5fa, emissiveIntensity: 0.85, transparent: true, opacity: 0.92 })
      );
      particle.visible = flowMode;
      particle.userData.offset = index / 16;
      scene.add(particle);
      return particle;
    });
    flowParticlesRef.current = flowParticles;

    const sprinklerDischarges = [
      [POS.warehouse.x - 2, 5.9, -2.8],
      [POS.warehouse.x + 1.8, 5.9, 0.4],
      [POS.warehouse.x + 5.2, 5.9, 2.6],
    ].map(([x, y, z]) => {
      const plume = new THREE.Mesh(
        new THREE.ConeGeometry(0.28, 1.6, 16, 1, true),
        new THREE.MeshStandardMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.22, emissive: 0x38bdf8, emissiveIntensity: 0.25, side: THREE.DoubleSide })
      );
      plume.position.set(x, y, z);
      plume.rotation.x = Math.PI;
      plume.visible = flowMode;
      scene.add(plume);
      return plume;
    });
    sprinklerDischargeRef.current = sprinklerDischarges;

    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      const elapsed = performance.now() * 0.00012;
      const path = flowPathRef.current;
      if (path.length > 1) {
        const segmentCount = path.length - 1;
        flowParticlesRef.current.forEach((particle) => {
          particle.visible = flowModeRef.current;
          if (!flowModeRef.current) return;
          const t = (elapsed + particle.userData.offset) % 1;
          const scaled = t * segmentCount;
          const segmentIndex = Math.min(segmentCount - 1, Math.floor(scaled));
          const localT = scaled - segmentIndex;
          particle.position.lerpVectors(path[segmentIndex], path[segmentIndex + 1], localT);
        });
      }
      sprinklerDischargeRef.current.forEach((plume, index) => {
        plume.visible = flowModeRef.current;
        if (!flowModeRef.current) return;
        plume.scale.setScalar(0.92 + Math.sin(elapsed * 18 + index) * 0.06 + 0.08);
      });
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const W2 = container.clientWidth, H2 = container.clientHeight;
      camera.aspect = W2 / H2;
      camera.updateProjectionMatrix();
      renderer.setSize(W2, H2);
    };
    const wheelHandler = (event) => {
      event.preventDefault();
      event.stopPropagation();
      const a = camAngleRef.current;
      a.radius = Math.max(5, Math.min(35, a.radius + event.deltaY * 0.02));
      updateCamera(cameraRef.current, a);
    };
    container.addEventListener("wheel", wheelHandler, { passive: false });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(animRef.current);
      container.removeEventListener("wheel", wheelHandler);
      window.removeEventListener("resize", onResize);
      scene.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((material) => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    setRoofVisibility(roofVisible);
  }, [roofVisible]);

  useEffect(() => {
    flowModeRef.current = flowMode;
    flowParticlesRef.current.forEach((particle) => {
      particle.visible = flowMode;
    });
    sprinklerDischargeRef.current.forEach((plume) => {
      plume.visible = flowMode;
    });
  }, [flowMode]);

  useEffect(() => {
    if (defaultSelectedId === null) {
      commitSelection(null, { notify: false });
      return;
    }

    if (!meshMapRef.current[defaultSelectedId]) return;
    commitSelection(defaultSelectedId, { notify: false });
  }, [defaultSelectedId]);

  useEffect(() => {
    applyFocusModeState(selectedRef.current);
  }, [focusMode, selected]);

  function getHit(clientX, clientY) {
    const rect = mountRef.current.getBoundingClientRect();
    mouseRef.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const allMeshes = [];
    Object.values(meshMapRef.current).forEach(({ mesh }) => {
      mesh.traverse(c => { if (c.isMesh) allMeshes.push(c); });
    });
    const hits = raycasterRef.current.intersectObjects(allMeshes, false);
    if (!hits.length) return null;
    const hitObj = hits[0].object;
    for (const [id, { mesh }] of Object.entries(meshMapRef.current)) {
      let node = hitObj;
      while (node) { if (node === mesh) return id; node = node.parent; }
    }
    return null;
  }

  function setHighlight(id, on) {
    if (!meshMapRef.current[id]) return;
    meshMapRef.current[id].mesh.traverse(c => {
      if (c.isMesh && c.material) {
        c.material.emissive = new THREE.Color(on ? 0xffffff : 0x000000);
        c.material.emissiveIntensity = on ? 0.22 : 0;
      }
    });
  }

  const onMouseDown = e => {
    e.preventDefault();
    isDraggingRef.current = false;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseMove = e => {
    e.preventDefault();
    const dx = e.clientX - prevMouseRef.current.x;
    const dy = e.clientY - prevMouseRef.current.y;
    if (e.buttons === 1 && (Math.abs(dx) > 1 || Math.abs(dy) > 1)) {
      isDraggingRef.current = true;
      const a = camAngleRef.current;
      a.theta -= dx * 0.008;
      a.phi = Math.max(0.18, Math.min(Math.PI / 2.1, a.phi + dy * 0.008));
      updateCamera(cameraRef.current, a);
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    }
    const id = getHit(e.clientX, e.clientY);
    if (id !== hovered) {
      if (hovered && hovered !== selected) setHighlight(hovered, false);
      if (id && id !== selected) setHighlight(id, true);
      setHovered(id);
      mountRef.current.style.cursor = id ? "pointer" : "grab";
    }
  };

  const onMouseUp = e => {
    e.preventDefault();
    if (!isDraggingRef.current) {
      const id = getHit(e.clientX, e.clientY);
      if (id) {
        commitSelection(id);
      } else {
        commitSelection(null);
      }
    }
    isDraggingRef.current = false;
  };

  const onWheel = e => {
    e.preventDefault();
    e.stopPropagation();
    const a = camAngleRef.current;
    a.radius = Math.max(5, Math.min(35, a.radius + e.deltaY * 0.025));
    updateCamera(cameraRef.current, a);
  };

  const onMouseLeave = () => {
    isDraggingRef.current = false;
    mountRef.current.style.cursor = "grab";
  };

  const closePanel = () => {
    commitSelection(null);
  };

  const comp = selected ? COMPONENTS[selected] : null;
  const hovComp = hovered ? COMPONENTS[hovered] : null;
  const selectedLabel = comp?.name?.es ?? comp?.label;
  const hoveredLabel = hovComp?.name?.es ?? hovComp?.label;
  const hoveredNfpa = hovComp?.nfpa?.join?.(' · ') ?? hovComp?.nfpa;

  return (
    <div className={className} style={{ width: "100%", height: "100%", background: "#e2e8f0", display: "flex", flexDirection: "column", fontFamily: "'Inter', 'Segoe UI', sans-serif", overflow: "hidden" }}>
      {showHud && (
      <div style={{ padding: "10px 20px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 5 }}>
          {["#e74c3c", "#f39c12", "#27ae60"].map((c, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: c, boxShadow: `0 0 6px ${c}` }} />
          ))}
        </div>
        <span style={{ color: "#d5dae3", fontSize: 12, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase" }}>
          Caseta de Bombeo Contra Incendio — 1,500 GPM / 120 PSI
        </span>
        <div style={{ display: "flex", gap: 10, marginLeft: 8 }}>
          {["NFPA 20", "NFPA 22", "NFPA 24", "NFPA 13", "NFPA 25"].map(n => (
            <span key={n} style={{ background: "rgba(231,76,60,0.15)", border: "1px solid rgba(231,76,60,0.25)", color: "#e74c3c", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 3, letterSpacing: "0.05em" }}>{n}</span>
          ))}
        </div>
        <div style={{ marginLeft: "auto", color: "#3d5166", fontSize: 10 }}>🖱 Drag · Scroll · Click</div>
      </div>
      )}

      {/* Viewport */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <div ref={mountRef} style={{ width: "100%", height: "100%", cursor: "grab", touchAction: "none" }}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseLeave} onWheel={onWheel} />

        {showViewportControls && (
          <div style={{ position: "absolute", right: 16, bottom: 16, display: "grid", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 40px)", gap: 8, justifyItems: "center", alignItems: "center", background: "rgba(255,255,255,0.82)", border: "1px solid rgba(148,163,184,0.28)", borderRadius: 18, padding: 10, backdropFilter: "blur(12px)", boxShadow: "0 10px 30px rgba(15,23,42,0.12)" }}>
              <button type="button" onClick={() => adjustCamera(0, -0.08, 0)} style={controlButtonStyle}>▲</button>
              <button type="button" onClick={resetView} style={controlButtonStyle}>•</button>
              <button type="button" onClick={() => adjustCamera(0, 0.08, 0)} style={controlButtonStyle}>▼</button>
              <button type="button" onClick={() => adjustCamera(-0.08, 0, 0)} style={controlButtonStyle}>◀</button>
              <button type="button" onClick={() => adjustCamera(0, 0, -1.2)} style={controlButtonStyle}>＋</button>
              <button type="button" onClick={() => adjustCamera(0.08, 0, 0)} style={controlButtonStyle}>▶</button>
              <button type="button" onClick={() => setRoofVisible((value) => !value)} style={{ ...controlButtonStyle, gridColumn: "span 2" }}>{roofVisible ? 'Hide roof' : 'Show roof'}</button>
              <button type="button" onClick={() => adjustCamera(0, 0, 1.2)} style={controlButtonStyle}>－</button>
            </div>
          </div>
        )}

        {/* Hover tooltip */}
        {hovComp && !comp && (
          <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "rgba(10,14,20,0.93)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "7px 14px", color: "#d5dae3", fontSize: 11, pointerEvents: "none", whiteSpace: "nowrap", backdropFilter: "blur(8px)" }}>
            <span style={{ color: "#e74c3c", marginRight: 7 }}>●</span>{hoveredLabel}
            <span style={{ color: "#3d5166", marginLeft: 8, fontSize: 10 }}>{hoveredNfpa}</span>
          </div>
        )}

        {/* Info Panel */}
        {showInfoPanel && comp && (
          <div style={{ position: "absolute", top: 12, right: 12, width: 340, background: "rgba(10,14,20,0.97)", border: "1px solid rgba(231,76,60,0.28)", borderRadius: 10, overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,0.7)", backdropFilter: "blur(16px)" }}>
            <div style={{ background: "rgba(231,76,60,0.12)", borderBottom: "1px solid rgba(231,76,60,0.18)", padding: "11px 15px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ color: "#e74c3c", fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 5 }}>{Array.isArray(comp.nfpa) ? comp.nfpa.join(' · ') : comp.nfpa}</div>
                <div style={{ color: "#e8eaf0", fontSize: 13, fontWeight: 700, lineHeight: 1.35 }}>{selectedLabel}</div>
              </div>
              <button onClick={closePanel} style={{ background: "none", border: "none", color: "#3d5166", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "0 0 0 10px" }}>×</button>
            </div>
            <div style={{ padding: "12px 15px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <p style={{ color: "#8fa3b8", fontSize: 11, lineHeight: 1.75, margin: 0 }}>{comp.description?.es ?? comp.description}</p>
            </div>
            <div style={{ padding: "11px 15px" }}>
              <div style={{ color: "#3d5166", fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 9 }}>Especificaciones Técnicas</div>
              {comp.specs.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 7, marginBottom: 5, alignItems: "flex-start" }}>
                  <span style={{ color: "#e74c3c", fontSize: 9, marginTop: 2, flexShrink: 0 }}>▸</span>
                  <span style={{ color: "#6d8194", fontSize: 10.5, lineHeight: 1.5 }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        {showHud && (
        <div style={{ position: "absolute", bottom: 12, left: 12, background: "rgba(10,14,20,0.88)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "9px 13px", backdropFilter: "blur(8px)" }}>
          <div style={{ color: "#3d5166", fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", marginBottom: 7, textTransform: "uppercase" }}>Leyenda</div>
          {[
            ["#c0392b", "Bomba Principal Electrica — 1,500 GPM"],
            ["#626567", "Bomba Diesel de Respaldo — 1,500 GPM"],
            ["#1e8449", "Bomba Jockey — Presurización"],
            ["#7d3c98", "Manifold Descarga / Tuberias 8\""],
            ["#2471a3", "Header Succion 10\""],
            ["#f39c12", "Válvulas OS&Y (Supervisadas)"],
            ["#16a085", "Válvulas Check 6\""],
            ["#1a252f", "Controladores UL 218 / FM"],
          ].map(([c, label], i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
              <div style={{ width: 9, height: 9, borderRadius: 2, background: c, flexShrink: 0 }} />
              <span style={{ color: "#4a6070", fontSize: 9.5 }}>{label}</span>
            </div>
          ))}
        </div>
        )}

        {/* Pipe sizes reference */}
        {showHud && (
        <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(10,14,20,0.88)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "9px 13px", backdropFilter: "blur(8px)" }}>
          <div style={{ color: "#3d5166", fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", marginBottom: 7, textTransform: "uppercase" }}>Baseline Learning View · 1,500 GPM</div>
          {[
            ["Succion principal", '10" (254mm)'],
            ["Descarga / Manifold", '8" (203mm)'],
            ["Válvula de alivio", '4" (102mm)'],
            ["Test header supply", '8" (203mm)'],
            ["Hose valves (×5)", '2½" (63mm)'],
            ["Jockey / Sensing", '1½" / ½"'],
          ].map(([k, v], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 18, marginBottom: 4 }}>
              <span style={{ color: "#4a6070", fontSize: 9.5 }}>{k}</span>
              <span style={{ color: "#5dade2", fontSize: 9.5, fontWeight: 700, fontFamily: "monospace" }}>{v}</span>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}
