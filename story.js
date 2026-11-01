// Escena 3D "llega el coche al taller" controlada por el scroll.
import * as THREE from 'three';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';
import { GLTFLoader } from './vendor/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from './vendor/jsm/libs/meshopt_decoder.module.js';

const section = document.getElementById('story');
const canvas = document.getElementById('story-canvas');
const captions = [...document.querySelectorAll('.story-cap')];
const bar = document.querySelector('.story-progress i');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.5 : 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.setClearColor(0x05060a);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x05060a, 18, 55);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(renderer), .04).texture;
scene.environmentIntensity = .55;

const camera = new THREE.PerspectiveCamera(42, 1, .1, 120);

const RED = 0xdd3222;
const M = {
  wall: new THREE.MeshStandardMaterial({ color: 0x1d1d22, roughness: .85, side: THREE.DoubleSide }),
  wallIn: new THREE.MeshStandardMaterial({ color: 0x26262c, roughness: .8, side: THREE.DoubleSide }),
  asphalt: new THREE.MeshStandardMaterial({ color: 0x0e0f12, roughness: .7, metalness: .1 }),
  epoxy: new THREE.MeshStandardMaterial({ color: 0x9a9aa2, roughness: .22, metalness: .05 }),
  plate: new THREE.MeshStandardMaterial({ color: 0x111114, roughness: .5 }),
  steel: new THREE.MeshStandardMaterial({ color: 0xb8b8c0, roughness: .3, metalness: 1 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x18181c, roughness: .5, metalness: .6 }),
  red: new THREE.MeshStandardMaterial({ color: RED, roughness: .35, metalness: .3, emissive: RED, emissiveIntensity: .25 }),
  shutter: new THREE.MeshStandardMaterial({ color: 0x3a3b40, roughness: .45, metalness: .8 }),
  lightBar: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0 }),
};

/* ---------- ground & building ---------- */
const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), M.asphalt);
ground.rotation.x = -Math.PI / 2; scene.add(ground);
// road markings
for (let i = -10; i < 10; i++) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, .12), new THREE.MeshBasicMaterial({ color: 0x55555c }));
  m.rotation.x = -Math.PI / 2; m.position.set(i * 4, .01, 9.5); scene.add(m);
}

const box = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); scene.add(m); return m; };
const DOOR_W = 5, DOOR_H = 3.6, FRONT = 1, BACK = -15, HALF = 7, ROOF = 6;
box(HALF - DOOR_W / 2, ROOF, .3, M.wall, -(DOOR_W / 2 + (HALF - DOOR_W / 2) / 2), ROOF / 2, FRONT);
box(HALF - DOOR_W / 2, ROOF, .3, M.wall, (DOOR_W / 2 + (HALF - DOOR_W / 2) / 2), ROOF / 2, FRONT);
box(DOOR_W, ROOF - DOOR_H, .3, M.wall, 0, DOOR_H + (ROOF - DOOR_H) / 2, FRONT);
box(.3, ROOF, FRONT - BACK, M.wallIn, -HALF, ROOF / 2, (FRONT + BACK) / 2);
box(.3, ROOF, FRONT - BACK, M.wallIn, HALF, ROOF / 2, (FRONT + BACK) / 2);
box(HALF * 2, ROOF, .3, M.wallIn, 0, ROOF / 2, BACK);
box(HALF * 2 + .3, .3, FRONT - BACK, M.wall, 0, ROOF, (FRONT + BACK) / 2);
// facade trims
box(HALF * 2 + .4, .12, .4, M.red, 0, ROOF - .3, FRONT + .1);
box(DOOR_W + .3, .1, .2, M.red, 0, DOOR_H + .05, FRONT + .2);

// interior floor + dyno plate
const floor = new THREE.Mesh(new THREE.PlaneGeometry(HALF * 2, FRONT - BACK), M.epoxy);
floor.rotation.x = -Math.PI / 2; floor.position.set(0, .012, (FRONT + BACK) / 2); scene.add(floor);
const plateM = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 7), M.plate);
plateM.rotation.x = -Math.PI / 2; plateM.position.set(0, .02, -4); scene.add(plateM);

// logo textures
const loader = new THREE.TextureLoader();
const logoTex = loader.load('logo-t.png'); logoTex.colorSpace = THREE.SRGBColorSpace;
const signMat = new THREE.MeshBasicMaterial({ map: logoTex, transparent: true, color: 0xffffff });
const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.2, .8), signMat);
sign.position.set(0, 4.7, FRONT + .2); scene.add(sign);
const signGlow = new THREE.PointLight(RED, 18, 9); signGlow.position.set(0, 4.7, FRONT + 1.5); scene.add(signGlow);
const backSign = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.33), new THREE.MeshBasicMaterial({ map: logoTex, transparent: true }));
backSign.position.set(1.5, 3.6, BACK + .2); scene.add(backSign);

// ceiling light bars
const ceilLights = [];
for (const z of [-2, -6, -10]) for (const x of [-3, 3]) {
  const l = box(.25, .06, 3, M.lightBar, x, ROOF - .2, z);
  ceilLights.push(l);
}
const inLights = [[-2, -3], [2, -6], [0, -11]].map(([x, z]) => { const p = new THREE.PointLight(0xfff2e8, 0, 22); p.position.set(x, ROOF - .5, z); scene.add(p); return p; });
const doorSpill = new THREE.SpotLight(0xffe9d8, 0, 26, .7, .7); doorSpill.position.set(0, 5, -6); doorSpill.target.position.set(0, 0, 8); scene.add(doorSpill, doorSpill.target);

// outside lights
scene.add(new THREE.HemisphereLight(0x6070a0, 0x050505, .35));
const moon = new THREE.DirectionalLight(0x8fa4ff, .7); moon.position.set(-10, 14, 12); scene.add(moon);
const street = new THREE.PointLight(0xffb070, 25, 18); street.position.set(-9, 5, 8); scene.add(street);
box(.12, 5, .12, M.dark, -9, 2.5, 8.6);

/* ---------- shutter (persiana) ---------- */
const slats = [];
const SLAT = .2;
for (let i = 0; i < DOOR_H / SLAT; i++) {
  const s = box(DOOR_W, SLAT * .92, .06, M.shutter, 0, SLAT / 2 + i * SLAT, FRONT + .18);
  s.userData.y = SLAT / 2 + i * SLAT; slats.push(s);
}
const drum = box(DOOR_W + .3, .5, .5, M.dark, 0, DOOR_H + .35, FRONT + .35);
function setShutter(o) {
  const lift = o * DOOR_H;
  for (const s of slats) { const y = s.userData.y + lift; s.position.y = y; s.visible = y < DOOR_H; }
}

/* ---------- dyno ---------- */
const rollers = [];
for (const z of [-4.9, -2.1]) for (const dz of [-.26, .26]) {
  const r = new THREE.Mesh(new THREE.CylinderGeometry(.19, .19, 2.6, 28), M.steel);
  r.rotation.z = Math.PI / 2; r.position.set(0, .06, z + dz); scene.add(r); rollers.push(r);
}
for (const z of [-4.9, -2.1]) box(3, .03, 1.1, M.dark, 0, .025, z);
// fan + screen stand like the real shop
const fan = box(1.4, 1.2, 1.1, M.steel, 0, .6, -8.2);
const fanFace = new THREE.Mesh(new THREE.CircleGeometry(.45, 32), M.dark); fanFace.position.set(0, .62, -7.64); scene.add(fanFace);

/* ---------- monitor (canvas texture) ---------- */
const mon = document.createElement('canvas'); mon.width = 640; mon.height = 400;
const mctx = mon.getContext('2d');
const monTex = new THREE.CanvasTexture(mon); monTex.colorSpace = THREE.SRGBColorSpace;
const monMat = new THREE.MeshBasicMaterial({ map: monTex, toneMapped: false });
function drawMonitor(level, t) {
  const c = mctx, W = mon.width, H = mon.height;
  c.fillStyle = '#07080b'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#dd3222'; c.fillRect(0, 0, W, 34);
  c.fillStyle = '#fff'; c.font = 'bold 18px Inter, Arial'; c.fillText('BND · BANCO DE POTENCIA', 14, 23);
  c.textAlign = 'right'; c.fillText(level > .02 ? (level < .5 ? 'MIDIENDO · SERIE' : 'MAPA BND') : 'EN ESPERA', W - 14, 23); c.textAlign = 'left';
  // grid
  c.strokeStyle = 'rgba(255,255,255,.08)'; c.lineWidth = 1;
  for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(20, 60 + i * 40); c.lineTo(400, 60 + i * 40); c.stroke(); }
  // curves
  const curve = (amp, k) => (x) => 260 - amp * (1 - Math.exp(-x * k)) * (1 - .25 * Math.max(0, x - .65) ** 2 * 4) ;
  const drawC = (f, col, prog, w) => {
    c.strokeStyle = col; c.lineWidth = w; c.beginPath();
    for (let i = 0; i <= 100 * prog; i++) { const x = i / 100; const px = 20 + x * 380, py = f(x); i ? c.lineTo(px, py) : c.moveTo(px, py); }
    c.stroke();
  };
  const serie = curve(150, 3.2), bnd = curve(200, 3.6);
  drawC(serie, '#6b6b72', Math.min(level * 2, 1), 3);
  if (level > .5) { c.shadowColor = '#dd3222'; c.shadowBlur = 14; drawC(bnd, '#ff4a36', (level - .5) * 2, 4); c.shadowBlur = 0; }
  // bars
  const labels = ['POT', 'PAR', 'RPM', 'TEMP'];
  const targets = level < .5 ? [.62, .58, .9, .45] : [.92, .88, .95, .5];
  const run = Math.min(level * 2 % 1.0001 + (level >= .5 ? 0 : 0), 1);
  labels.forEach((l, i) => {
    const x = 430 + i * 50, top = 60, h = 220;
    const v = level > .02 ? targets[i] * (level < .5 ? Math.min(level * 2, 1) : .7 + .3 * Math.min((level - .5) * 2, 1)) * (1 + Math.sin(t * 9 + i) * .02) : 0;
    c.fillStyle = 'rgba(255,255,255,.07)'; c.fillRect(x, top, 30, h);
    const g = c.createLinearGradient(0, top + h, 0, top); g.addColorStop(0, '#7a160d'); g.addColorStop(1, '#ff4a36');
    c.fillStyle = g; c.fillRect(x, top + h * (1 - v), 30, h * v);
    c.fillStyle = '#9a9aa2'; c.font = '12px Inter, Arial'; c.fillText(l, x + 1, top + h + 18);
  });
  // rpm readout
  const rpm = Math.round(level > .02 ? 900 + 6100 * Math.min(1, (level % .5) * 2 + (level >= 1 ? 1 : 0)) : 850);
  c.fillStyle = '#fff'; c.font = 'bold 42px Inter, Arial'; c.fillText(rpm.toString().padStart(4, ' '), 20, 345);
  c.fillStyle = '#9a9aa2'; c.font = '14px Inter, Arial'; c.fillText('RPM', 20, 370);
  c.fillStyle = '#6b6b72'; c.fillText('— Serie', 200, 345); c.fillStyle = '#ff4a36'; c.fillText('— Mapa BND', 290, 345);
  c.fillStyle = '#4a4a50'; c.font = '11px Inter, Arial'; c.fillText('SIMULACIÓN', 540, 385);
  monTex.needsUpdate = true;
}
// desk
box(1.8, .08, .9, M.dark, 3.8, 1.0, -5);
box(.08, 1, .08, M.dark, 3.0, .5, -5.35); box(.08, 1, .08, M.dark, 4.6, .5, -5.35);
box(.08, 1, .08, M.dark, 3.0, .5, -4.65); box(.08, 1, .08, M.dark, 4.6, .5, -4.65);
const monitor = new THREE.Mesh(new THREE.PlaneGeometry(1.3, .81), monMat); monitor.position.set(3.8, 1.55, -5.25); scene.add(monitor);
box(1.38, .89, .05, M.dark, 3.8, 1.55, -5.29);
box(.06, .4, .06, M.dark, 3.8, 1.15, -5.3);
box(.6, .02, .2, M.dark, 3.8, 1.05, -4.85); // keyboard
// wall TV like the real shop
const tv = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5), monMat); tv.position.set(-HALF + .2, 3.4, -6); tv.rotation.y = Math.PI / 2; scene.add(tv);
box(.06, 1.6, 2.5, M.dark, -HALF + .16, 3.4, -6);

/* ---------- car ---------- */
function buildCar() {
  const car = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({ color: 0xa7a9b0, metalness: .7, roughness: .28, clearcoat: 1, clearcoatRoughness: .08 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x07080b, metalness: .9, roughness: .05, clearcoat: 1 });
  const s = new THREE.Shape();
  s.moveTo(2.15, .3);
  s.lineTo(1.9, .3); s.absarc(1.4, .36, .5, 0, Math.PI, false);
  s.lineTo(-.9, .3); s.absarc(-1.4, .36, .5, 0, Math.PI, false);
  s.lineTo(-2.2, .32); s.lineTo(-2.28, .7); s.lineTo(-2.1, .98);
  s.lineTo(-1.4, 1.02); s.quadraticCurveTo(-.9, 1.32, -.5, 1.36);
  s.lineTo(.25, 1.37); s.quadraticCurveTo(.6, 1.3, 1.05, 1.0);
  s.lineTo(2.05, .82); s.quadraticCurveTo(2.3, .75, 2.28, .5); s.lineTo(2.15, .3);
  const bodyG = new THREE.ExtrudeGeometry(s, { depth: 1.7, bevelEnabled: true, bevelThickness: .14, bevelSize: .1, bevelSegments: 4, curveSegments: 24 });
  bodyG.translate(0, 0, -.85);
  car.add(new THREE.Mesh(bodyG, paint));
  const g = new THREE.Shape();
  g.moveTo(-1.32, 1.04); g.quadraticCurveTo(-.88, 1.28, -.5, 1.31); g.lineTo(.22, 1.32); g.quadraticCurveTo(.55, 1.26, .98, 1.02); g.lineTo(-1.32, 1.04);
  const glassG = new THREE.ExtrudeGeometry(g, { depth: 1.98, bevelEnabled: false }); glassG.translate(0, 0, -.99);
  car.add(new THREE.Mesh(glassG, glass));
  // windshield
  const ws = new THREE.Mesh(new THREE.PlaneGeometry(1.75, .62), glass);
  ws.position.set(.66, 1.17, 0); ws.rotation.set(0, Math.PI / 2, 0); ws.rotateX(-.95); car.add(ws);
  // splitter + skirts + spoiler (red accents)
  const acc = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M.red); m.position.set(x, y, z); car.add(m); };
  acc(.3, .04, 1.9, 2.18, .3, 0); acc(1.6, .04, .04, 0, .3, 1.0); acc(1.6, .04, .04, 0, .3, -1.0); acc(.3, .04, 1.7, -2.05, 1.06, 0);
  // lights
  const head = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xdfe8ff, emissiveIntensity: 3 });
  const tail = new THREE.MeshStandardMaterial({ color: RED, emissive: RED, emissiveIntensity: 3 });
  for (const z of [-.62, .62]) { const h = new THREE.Mesh(new THREE.BoxGeometry(.06, .08, .42), head); h.position.set(2.27, .66, z); car.add(h); }
  const tl = new THREE.Mesh(new THREE.BoxGeometry(.05, .06, 1.7), tail); tl.position.set(-2.3, .82, 0); car.add(tl);
  const beam = new THREE.SpotLight(0xdfe8ff, 40, 22, .45, .6); beam.position.set(2.3, .7, 0); beam.target.position.set(8, 0, 0); car.add(beam, beam.target);
  // wheels
  const wheels = [];
  const tyreM = new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: .9 });
  for (const [x, z] of [[1.4, .92], [1.4, -.92], [-1.4, .92], [-1.4, -.92]]) {
    const w = new THREE.Group(); w.position.set(x, .4, z);
    const tyre = new THREE.Mesh(new THREE.TorusGeometry(.3, .11, 14, 36), tyreM); w.add(tyre);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(.27, .27, .18, 28), M.steel); rim.rotation.x = Math.PI / 2; w.add(rim);
    for (let i = 0; i < 5; i++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(.5, .06, .05), M.dark); sp.rotation.z = i / 5 * Math.PI; sp.position.z = z > 0 ? .1 : -.1; w.add(sp); }
    const cal = new THREE.Mesh(new THREE.BoxGeometry(.16, .2, .1), M.red); cal.position.set(.12, .12, z > 0 ? -.02 : .02);
    const holder = new THREE.Group(); holder.position.copy(w.position); holder.add(cal); car.add(holder);
    car.add(w); wheels.push(w);
  }
  // soft shadow
  const sh = document.createElement('canvas'); sh.width = sh.height = 128;
  const sc = sh.getContext('2d'); const gr = sc.createRadialGradient(64, 64, 10, 64, 64, 64);
  gr.addColorStop(0, 'rgba(0,0,0,.85)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); sc.fillStyle = gr; sc.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 2.6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sh), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = .03; car.add(shadow);
  car.userData.wheels = wheels;
  car.userData.keep = [beam, beam.target, shadow];
  return car;
}
const car = buildCar(); scene.add(car);
let mixer = null, actions = {}, currentAction = null;

/* ---------- modelos 3D reales (coche + mecánico) ---------- */
const gltf = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
gltf.load('models/car.glb', (g) => {
  const model = g.scene;
  // fuera logos de terceros (matrícula y emblema del volante)
  ['License Plate', 'InteriorSteeringEmblem'].forEach((n) => { const o = model.getObjectByName(n); if (o) o.visible = false; });
  // ruedas delanteras rectas y eje de giro de cada rueda
  const rear = model.getObjectByName('WheelRearL');
  const spinners = [];
  model.updateMatrixWorld(true);
  for (const n of ['WheelFrontL', 'WheelFrontR', 'WheelRearL', 'WheelRearR']) {
    const w = model.getObjectByName(n); if (!w) continue;
    if (n.startsWith('WheelFront') && rear) w.quaternion.copy(rear.quaternion);
    w.updateMatrixWorld(true);
    const q = new THREE.Quaternion(); w.getWorldQuaternion(q);
    const axis = new THREE.Vector3(1, 0, 0).applyQuaternion(q.invert()).normalize();
    // las pinzas no giran: se sacan de la rueda
    [...w.children].forEach((c) => { if (/BrakePad/.test(c.name)) w.parent.attach(c); });
    spinners.push({ w, base: w.quaternion.clone(), axis });
  }
  model.traverse((o) => { if (o.isMesh && o.material) { o.material.envMapIntensity = 1.4; } });
  // frente del modelo = +z → nuestro coche mira a +x
  const inner = new THREE.Group();
  model.position.z = -.086;
  inner.add(model); inner.rotation.y = Math.PI / 2;
  // quitar coche provisional, conservar luces y sombra
  const keep = car.userData.keep;
  car.clear(); keep.forEach((k) => car.add(k));
  car.add(inner);
  const tmpQ = new THREE.Quaternion();
  car.userData.wheels = spinners.map((s) => ({
    set rotationZ(a) { tmpQ.setFromAxisAngle(s.axis, -a); s.w.quaternion.copy(s.base).multiply(tmpQ); },
  }));
  car.userData.real = true;
});
gltf.load('models/mechanic.glb', (g) => {
  const bot = g.scene;
  bot.traverse((o) => {
    if (!o.isMesh) return;
    o.frustumCulled = false;
    o.material = o.material.name === 'Beta_Joints_MAT'
      ? new THREE.MeshStandardMaterial({ color: RED, metalness: .4, roughness: .35, emissive: RED, emissiveIntensity: .2 })
      : new THREE.MeshStandardMaterial({ color: 0x1b1b20, metalness: .3, roughness: .55 });
    o.material.skinning = true;
  });
  mech.clear(); mech.add(bot); mech.userData.real = true;
  mixer = new THREE.AnimationMixer(bot);
  g.animations.forEach((a) => { actions[a.name] = mixer.clipAction(a); });
});
function playAction(name) {
  if (!mixer || !actions[name] || currentAction === name) return;
  const next = actions[name]; next.reset().setEffectiveWeight(1).fadeIn(.35).play();
  if (currentAction && actions[currentAction]) actions[currentAction].fadeOut(.35);
  currentAction = name;
}

/* ---------- mechanic ---------- */
function buildMechanic() {
  const m = new THREE.Group();
  const suit = new THREE.MeshStandardMaterial({ color: 0x141418, roughness: .8 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xc89478, roughness: .7 });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.22, .5, 6, 14), suit); torso.position.y = 1.18; m.add(torso);
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(.225, .225, .06, 20), M.red); stripe.position.y = 1.2; m.add(stripe);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.14, 20, 16), skin); head.position.y = 1.68; m.add(head);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(.145, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.red); cap.position.y = 1.7; m.add(cap);
  const limb = (r, l, x, y, mat = suit) => { const g = new THREE.Group(); g.position.set(x, y, 0); const c = new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 4, 10), mat); c.position.y = -l / 2 - r; g.add(c); m.add(g); return g; };
  const legL = limb(.085, .62, -.1, .86), legR = limb(.085, .62, .1, .86);
  const armL = limb(.06, .48, -.3, 1.45), armR = limb(.06, .48, .3, 1.45);
  m.userData = { legL, legR, armL, armR };
  return m;
}
const mech = buildMechanic(); scene.add(mech);

/* ---------- exhaust ---------- */
const EX = 120, exPos = new Float32Array(EX * 3), exLife = new Float32Array(EX);
for (let i = 0; i < EX; i++) exLife[i] = Math.random();
const exGeo = new THREE.BufferGeometry(); exGeo.setAttribute('position', new THREE.BufferAttribute(exPos, 3));
const exhaust = new THREE.Points(exGeo, new THREE.PointsMaterial({ color: 0x9a9aa8, size: .18, transparent: true, opacity: .35, depthWrite: false }));
scene.add(exhaust);

/* ---------- path ---------- */
const PARK_Z = -3.5, DOOR_STOP = 6.2;
const road = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-17, 0, 9.5), new THREE.Vector3(-10, 0, 9.5), new THREE.Vector3(-4, 0, 9.3),
  new THREE.Vector3(-.6, 0, 8), new THREE.Vector3(0, 0, DOOR_STOP),
]);
const roadLen = road.getLength();
const tmp = new THREE.Vector3();

/* ---------- camera keys ---------- */
const keys = [
  [0.00, [-12, 1.6, 16], [-15, .8, 9.5]],
  [0.07, [-7, 1.5, 15], [-6, .8, 9.5]],
  [0.15, [3, 1.9, 15.5], [0, 1.5, 4]],
  [0.27, [0, 2.2, 13], [0, 2.4, 0]],
  [0.42, [.6, 1.9, 4.5], [0, 1.1, -4]],
  [0.55, [-5.4, 1.7, -.6], [0, .8, -3.6]],
  [0.70, [-5.6, .9, -9.2], [0, .5, -3.4]],
  [0.86, [2.9, 1.7, -2.5], [3.8, 1.45, -5.25]],
  [1.00, [-4.6, 3.8, .2], [.8, .8, -5]],
];
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t * t * (3 - 2 * t);
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const range = (p, a, b) => clamp01((p - a) / (b - a));
const camPos = new THREE.Vector3(), camTgt = new THREE.Vector3();
function cameraAt(p) {
  let i = 0; while (i < keys.length - 2 && p > keys[i + 1][0]) i++;
  const [p0, a0, t0] = keys[i], [p1, a1, t1] = keys[i + 1];
  const k = ease(range(p, p0, p1));
  camPos.set(lerp(a0[0], a1[0], k), lerp(a0[1], a1[1], k), lerp(a0[2], a1[2], k));
  camTgt.set(lerp(t0[0], t1[0], k), lerp(t0[1], t1[1], k), lerp(t0[2], t1[2], k));
}

/* ---------- state ---------- */
let target = 0, prog = 0, active = false, lastDist = 0, spinExtra = 0;
const mouse = { x: 0, y: 0 };
addEventListener('pointermove', (e) => { mouse.x = e.clientX / innerWidth - .5; mouse.y = e.clientY / innerHeight - .5; });

function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h;
  camera.fov = w < 700 ? 58 : 42; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

new IntersectionObserver(([e]) => { active = e.isIntersecting; }, { rootMargin: '200px' }).observe(section);

function update(p, t, dt) {
  // car
  const d1 = ease(range(p, 0, .15));
  const d2 = ease(range(p, .31, .46));
  let dist;
  if (d2 <= 0) {
    road.getPointAt(Math.min(d1, .9999), tmp); car.position.copy(tmp);
    const tg = road.getTangentAt(Math.min(d1, .9999));
    car.rotation.y = Math.atan2(-tg.z, tg.x);
    dist = d1 * roadLen;
  } else {
    car.position.set(0, 0, lerp(DOOR_STOP, PARK_Z, d2)); car.rotation.y = Math.PI / 2;
    dist = roadLen + d2 * (DOOR_STOP - PARK_Z);
  }
  // dyno run
  const run = range(p, .6, .96);
  const running = run > 0 && run < 1 ? 1 : (run >= 1 ? .4 : 0);
  spinExtra += dt * running * 28;
  const wa = -(dist / .384) - spinExtra;
  for (const w of car.userData.wheels) { if (car.userData.real) w.rotationZ = wa; else w.rotation.z = wa; }
  for (const r of rollers) r.rotation.x = spinExtra * 2.2;
  car.position.y = running ? Math.sin(t * 40) * .004 : 0;

  // shutter + lights
  setShutter(ease(range(p, .15, .3)));
  const on = ease(range(p, .17, .3));
  inLights.forEach((l) => (l.intensity = on * 55));
  doorSpill.intensity = on * 160;
  M.lightBar.emissiveIntensity = on * 3;
  backSign.material.opacity = .25 + on * .75;

  // mechanic
  const wk = range(p, .47, .63);
  const from = new THREE.Vector3(5.6, 0, -12), to = new THREE.Vector3(3.8, 0, -4.15);
  mech.position.lerpVectors(from, to, ease(wk));
  const walking = wk > 0 && wk < 1;
  mech.rotation.y = wk < 1 ? Math.atan2(to.x - from.x, to.z - from.z) : Math.PI;
  if (mech.userData.real) {
    playAction(walking ? 'walk' : (run > .82 ? 'agree' : 'idle'));
    if (mixer) mixer.update(dt);
  } else {
    const { legL, legR, armL, armR } = mech.userData;
    const sw = walking ? Math.sin(t * 9) * .55 : 0;
    legL.rotation.x = sw; legR.rotation.x = -sw;
    if (wk >= 1) { armL.rotation.x = -1.0 + Math.sin(t * 14) * .08; armR.rotation.x = -1.0 + Math.cos(t * 13) * .08; }
    else { armL.rotation.x = -sw * .8; armR.rotation.x = sw * .8; }
  }

  // exhaust
  const arr = exGeo.attributes.position.array;
  for (let i = 0; i < EX; i++) {
    exLife[i] += dt * (running ? 1.4 : .3);
    if (exLife[i] > 1) exLife[i] = 0;
    const L = exLife[i];
    arr[i * 3] = -.45 + Math.sin(i * 7.1) * .2 * L;
    arr[i * 3 + 1] = .35 + L * 1.4;
    arr[i * 3 + 2] = car.position.z + 2.35 + L * 2.2;
  }
  exGeo.attributes.position.needsUpdate = true;
  exhaust.visible = d2 >= 1 && running > 0;

  drawMonitor(run, t);

  // camera
  cameraAt(p);
  camera.position.copy(camPos);
  camera.position.x += mouse.x * .5; camera.position.y -= mouse.y * .3;
  camera.lookAt(camTgt);

  // captions
  captions.forEach((c) => {
    const a = +c.dataset.from, b = +c.dataset.to;
    const v = p >= a && p < b ? 1 : 0;
    c.classList.toggle('on', !!v);
  });
  if (bar) bar.style.transform = `scaleX(${p})`;
}

const clock = new THREE.Clock();
function loop() {
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
  if (active) {
    const r = section.getBoundingClientRect();
    target = clamp01(-r.top / (r.height - innerHeight));
    prog += (target - prog) * Math.min(1, dt * 6);
    update(prog, t, dt);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(loop);
}
update(0, 0, 0); renderer.render(scene, camera);
loop();
