// Departamentos: cada servicio tiene su objeto 3D, con transición al cambiar.
import * as THREE from 'three';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

const wrap = document.getElementById('depts');
const canvas = document.getElementById('dept-canvas');
const items = [...document.querySelectorAll('.dept')];
const bigNum = document.getElementById('dept-num');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(renderer), .04).texture;
const camera = new THREE.PerspectiveCamera(35, 1, .1, 50);
camera.position.set(0, 0, 9);

const RED = 0xdd3222;
const chrome = new THREE.MeshStandardMaterial({ color: 0xd0d0d8, metalness: 1, roughness: .18 });
const alu = new THREE.MeshStandardMaterial({ color: 0x9a9ca4, metalness: 1, roughness: .35 });
const dark = new THREE.MeshStandardMaterial({ color: 0x141418, metalness: .6, roughness: .45 });
const black = new THREE.MeshStandardMaterial({ color: 0x0a0a0b, roughness: .9 });
const red = new THREE.MeshStandardMaterial({ color: RED, metalness: .35, roughness: .3, emissive: RED, emissiveIntensity: .15 });
const glow = new THREE.MeshStandardMaterial({ color: RED, emissive: RED, emissiveIntensity: 2.5 });

scene.add(new THREE.AmbientLight(0xffffff, .25));
const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(4, 6, 6); scene.add(key);
const rim = new THREE.PointLight(RED, 70, 25); rim.position.set(-5, 2, 3); scene.add(rim);
const back = new THREE.PointLight(0xff7a5a, 40, 25); back.position.set(4, -3, -3); scene.add(back);

const mk = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); return m; };

/* 1 · ECU */
function ecu() {
  const g = new THREE.Group();
  g.add(mk(new THREE.BoxGeometry(3, .5, 2.1), alu));
  for (let i = 0; i < 11; i++) g.add(mk(new THREE.BoxGeometry(2.6, .22, .06), alu, 0, .35, -.9 + i * .18));
  const con = mk(new THREE.BoxGeometry(.5, .36, 1.4), dark, 1.72, 0, 0); g.add(con);
  for (let i = 0; i < 8; i++) g.add(mk(new THREE.BoxGeometry(.12, .05, .05), chrome, 2.0, .06, -.55 + i * .16));
  g.add(mk(new THREE.BoxGeometry(.04, .06, 1.6), glow, -1.52, .05, 0));
  // circuit lines pulsing
  const lines = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const l = mk(new THREE.BoxGeometry(1.6 + Math.random(), .02, .03), glow, -2.6 - Math.random() * .5, -.1 + (i % 3) * .1, -.8 + i * .32);
    lines.add(l);
  }
  g.add(lines);
  g.rotation.set(.55, -.5, 0);
  g.userData.tick = (t) => { glow.emissiveIntensity = 1.8 + Math.sin(t * 4) * 1.2; };
  return g;
}

/* 2 · Aceite y filtros */
function oil() {
  const g = new THREE.Group();
  // filter: ribbed lathe
  const pts = [];
  for (let i = 0; i <= 40; i++) { const y = -1 + i * .05; pts.push(new THREE.Vector2(.72 + (i % 2 ? .05 : 0), y)); }
  pts.unshift(new THREE.Vector2(0, -1)); pts.push(new THREE.Vector2(.6, 1.05), new THREE.Vector2(0, 1.05));
  const filter = mk(new THREE.LatheGeometry(pts, 64), red, -1.1, 0, 0);
  filter.add(mk(new THREE.CylinderGeometry(.3, .3, .12, 6), chrome, 0, 1.1, 0));
  const band = mk(new THREE.CylinderGeometry(.79, .79, .35, 64), dark, 0, 0, 0); filter.add(band);
  g.add(filter);
  // oil bottle
  const b = [new THREE.Vector2(0, -1.3), new THREE.Vector2(.62, -1.3), new THREE.Vector2(.66, -1.2), new THREE.Vector2(.66, .55),
    new THREE.Vector2(.5, .9), new THREE.Vector2(.22, 1.05), new THREE.Vector2(.22, 1.25), new THREE.Vector2(0, 1.25)];
  const bottle = mk(new THREE.LatheGeometry(b, 64), new THREE.MeshPhysicalMaterial({ color: 0x111114, roughness: .25, clearcoat: 1 }), 1.1, 0, 0);
  bottle.scale.set(1, 1, .62);
  bottle.add(mk(new THREE.CylinderGeometry(.25, .25, .3, 32), red, 0, 1.38, 0));
  const label = mk(new THREE.CylinderGeometry(.665, .665, .8, 64, 1, true, -.9, 1.8), new THREE.MeshStandardMaterial({ color: RED, emissive: RED, emissiveIntensity: .2, side: THREE.DoubleSide }), 0, -.2, 0);
  bottle.add(label);
  g.add(bottle);
  // golden oil drop
  const drop = new THREE.Mesh(new THREE.SphereGeometry(.22, 32, 24), new THREE.MeshPhysicalMaterial({ color: 0xe7a12b, roughness: .05, transmission: .4, thickness: .5, clearcoat: 1, emissive: 0x6a3c00, emissiveIntensity: .4 }));
  drop.scale.set(1, 1.35, 1); g.add(drop);
  g.rotation.set(.15, -.3, 0);
  g.userData.tick = (t) => { const k = (t * .6) % 1; drop.position.set(0, 1.6 - k * 3.2, .6); drop.scale.setScalar(k > .92 ? 0 : 1); drop.scale.y = 1.35; };
  return g;
}

/* 3 · Frenos */
function brakes() {
  const g = new THREE.Group();
  const disc = new THREE.Group();
  disc.add(mk(new THREE.CylinderGeometry(1.8, 1.8, .16, 96), new THREE.MeshStandardMaterial({ color: 0x8d8d95, metalness: 1, roughness: .28 })));
  disc.add(mk(new THREE.CylinderGeometry(.8, .8, .3, 48), dark));
  const holeM = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
  for (let ring = 0; ring < 3; ring++) for (let i = 0; i < 24; i++) {
    const a = i / 24 * Math.PI * 2 + ring * .13, r = 1.05 + ring * .22;
    const h = mk(new THREE.CylinderGeometry(.045, .045, .17, 10), holeM, Math.cos(a) * r, .002, Math.sin(a) * r); disc.add(h);
  }
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; disc.add(mk(new THREE.CylinderGeometry(.08, .08, .34, 12), chrome, Math.cos(a) * .5, 0, Math.sin(a) * .5)); }
  disc.rotation.x = Math.PI / 2; g.add(disc);
  const cal = mk(new THREE.TorusGeometry(1.55, .32, 20, 40, Math.PI / 2.4), red, 0, 0, .05);
  cal.rotation.z = Math.PI / 8; cal.scale.z = 1.4; g.add(cal);
  const logoBar = mk(new THREE.BoxGeometry(.6, .1, .05), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: .6 }), 0, 0, .5);
  logoBar.position.set(Math.cos(Math.PI / 8 + .65) * 1.55, Math.sin(Math.PI / 8 + .65) * 1.55, .5); logoBar.rotation.z = Math.PI / 8 + .65 + Math.PI / 2; g.add(logoBar);
  g.rotation.set(.1, -.5, 0);
  g.userData.tick = (t) => { disc.rotation.y = t * 2.5; };
  return g;
}

/* 4 · Neumáticos */
function tyres() {
  const g = new THREE.Group();
  const w = new THREE.Group();
  const prof = [];
  for (let i = 0; i <= 24; i++) { const t = i / 24 * Math.PI; prof.push(new THREE.Vector2(1.3 + .6 * Math.sin(t), -.6 + 1.2 * (i / 24))); }
  const tyre = mk(new THREE.LatheGeometry(prof, 96), black); tyre.rotation.x = Math.PI / 2; w.add(tyre);
  for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; const b = mk(new THREE.BoxGeometry(.12, .2, 1.1), black, Math.cos(a) * 1.9, Math.sin(a) * 1.9, 0); b.rotation.z = a; w.add(b); }
  const rimM = mk(new THREE.CylinderGeometry(1.28, 1.28, .9, 64, 1, true), dark); rimM.rotation.x = Math.PI / 2; w.add(rimM);
  for (let i = 0; i < 10; i++) { const s = mk(new THREE.BoxGeometry(1.1, .12, .1), chrome); s.geometry.translate(.55 + .25, 0, 0); s.rotation.z = i / 10 * Math.PI * 2; s.position.z = .4; w.add(s); }
  w.add(mk(new THREE.CylinderGeometry(.3, .3, .2, 32), red, 0, 0, .45).rotateX(Math.PI / 2));
  const stripe = mk(new THREE.TorusGeometry(1.75, .015, 8, 120), red, 0, 0, .55); w.add(stripe);
  g.add(w);
  g.rotation.set(.15, -.7, 0);
  g.userData.tick = (t) => { w.rotation.z = -t * 1.6; };
  return g;
}

/* 5 · Diagnosis (cuentarrevoluciones) */
function gauge() {
  const g = new THREE.Group();
  const cv = document.createElement('canvas'); cv.width = cv.height = 512;
  const c = cv.getContext('2d');
  c.fillStyle = '#08080a'; c.beginPath(); c.arc(256, 256, 256, 0, Math.PI * 2); c.fill();
  c.translate(256, 256);
  for (let i = 0; i <= 80; i++) {
    const a = (-225 + i * 270 / 80) * Math.PI / 180, big = i % 10 === 0;
    c.strokeStyle = i > 60 ? '#ff3b2a' : '#e5e5ea'; c.lineWidth = big ? 6 : 2;
    c.beginPath(); c.moveTo(Math.cos(a) * (big ? 190 : 205), Math.sin(a) * (big ? 190 : 205)); c.lineTo(Math.cos(a) * 225, Math.sin(a) * 225); c.stroke();
    if (big) { c.fillStyle = i > 60 ? '#ff3b2a' : '#fff'; c.font = 'bold 34px Inter, Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(i / 10, Math.cos(a) * 155, Math.sin(a) * 155); }
  }
  c.fillStyle = '#8e8e96'; c.font = '22px Inter, Arial'; c.fillText('x1000 RPM', 0, 90);
  c.fillStyle = '#dd3222'; c.font = 'italic 900 40px Inter, Arial'; c.fillText('BND', 0, 140);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const face = mk(new THREE.CircleGeometry(1.9, 96), new THREE.MeshBasicMaterial({ map: tex })); g.add(face);
  const bezel = mk(new THREE.TorusGeometry(1.95, .14, 24, 120), chrome); g.add(bezel);
  const needle = new THREE.Group(); const n = mk(new THREE.BoxGeometry(1.6, .06, .03), glow); n.geometry.translate(.7, 0, 0); needle.add(n); needle.position.z = .06; g.add(needle);
  g.add(mk(new THREE.CylinderGeometry(.16, .16, .1, 32), dark, 0, 0, .1).rotateX(Math.PI / 2));
  const back = mk(new THREE.CylinderGeometry(2, 2, .4, 96), dark, 0, 0, -.22); back.rotation.x = Math.PI / 2; g.add(back);
  g.rotation.set(-.1, -.4, 0);
  g.userData.tick = (t) => {
    const v = (Math.sin(t * 1.3) * .5 + .5) ** 1.5 + Math.sin(t * 9) * .02;
    needle.rotation.z = -((-225 + v * 240) * Math.PI / 180);
  };
  return g;
}

/* 6 · Competición (bandera a cuadros) */
function race() {
  const g = new THREE.Group();
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 340;
  const c = cv.getContext('2d'); const sq = 512 / 8;
  for (let y = 0; y < 6; y++) for (let x = 0; x < 8; x++) { c.fillStyle = (x + y) % 2 ? '#0b0b0c' : '#f2f2f2'; c.fillRect(x * sq, y * sq * 340 / 384 * 1.13, sq, sq); }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const geo = new THREE.PlaneGeometry(3.2, 2.1, 40, 24);
  const base = geo.attributes.position.array.slice();
  const flag = mk(geo, new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: .7 }), 1.6, .9, 0);
  g.add(flag);
  g.add(mk(new THREE.CylinderGeometry(.06, .06, 4.6, 16), chrome, 0, -.4, 0));
  g.add(mk(new THREE.SphereGeometry(.12, 16, 12), red, 0, 1.95, 0));
  g.position.x = -.8;
  g.rotation.set(0, -.35, 0);
  g.userData.tick = (t) => {
    const p = geo.attributes.position.array;
    for (let i = 0; i < p.length; i += 3) {
      const x = base[i] + 1.6; // 0 at pole
      p[i + 2] = Math.sin(x * 2.2 - t * 5) * .22 * (x / 3.2) + Math.sin(base[i + 1] * 2 + t * 3) * .05 * (x / 3.2);
    }
    geo.attributes.position.needsUpdate = true; geo.computeVertexNormals();
  };
  return g;
}

const objects = [ecu(), oil(), brakes(), tyres(), gauge(), race()];
const holder = new THREE.Group(); holder.scale.setScalar(.72); scene.add(holder);
objects.forEach((o) => { const w = new THREE.Group(); w.add(o); w.scale.setScalar(0); w.visible = false; holder.add(w); o.userData.wrap = w; });

let current = -1;
function show(i) {
  if (i === current) return;
  const prev = current; current = i;
  items.forEach((el, k) => el.classList.toggle('on', k === i));
  if (bigNum) { bigNum.textContent = String(i + 1).padStart(2, '0'); }
  const gs = window.gsap;
  if (prev >= 0) {
    const w = objects[prev].userData.wrap;
    if (gs) gs.to(w.scale, { x: 0, y: 0, z: 0, duration: .5, ease: 'power3.in', onComplete: () => { if (current !== prev) w.visible = false; } }), gs.to(w.rotation, { y: '+=' + Math.PI, duration: .5, ease: 'power3.in' }), gs.to(w.position, { y: 2, duration: .5, ease: 'power3.in' });
    else { w.visible = false; }
  }
  const w = objects[i].userData.wrap;
  w.visible = true;
  if (gs) {
    gs.killTweensOf([w.scale, w.rotation, w.position]);
    w.position.set(0, -2.2, 0); w.rotation.set(0, -Math.PI, 0);
    gs.to(w.scale, { x: 1, y: 1, z: 1, duration: 1.1, ease: 'back.out(1.6)', delay: prev >= 0 ? .3 : 0 });
    gs.to(w.rotation, { y: 0, duration: 1.3, ease: 'expo.out', delay: prev >= 0 ? .3 : 0 });
    gs.to(w.position, { y: 0, duration: 1.1, ease: 'expo.out', delay: prev >= 0 ? .3 : 0 });
  } else { w.scale.setScalar(1); }
}

let active = false;
new IntersectionObserver(([e]) => { active = e.isIntersecting; }, { rootMargin: '100px' }).observe(wrap);

function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h;
  camera.position.z = w < 500 ? 11 : 9; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();
new ResizeObserver(resize).observe(canvas);

const mouse = { x: 0, y: 0 };
addEventListener('pointermove', (e) => { mouse.x = e.clientX / innerWidth - .5; mouse.y = e.clientY / innerHeight - .5; });

const clock = new THREE.Clock();
function loop() {
  const t = clock.getElapsedTime();
  if (active) {
    const mob = innerWidth < 900;
    const line = innerHeight * (mob ? .66 : .5);
    let best = 0, bestD = Infinity;
    items.forEach((el, k) => { const r = el.getBoundingClientRect(); const d = Math.abs(r.top + r.height / 2 - line); if (d < bestD) { bestD = d; best = k; } });
    show(best);
    const o = objects[current];
    o.userData.tick && o.userData.tick(t);
    holder.rotation.y += ((mouse.x * .6) - holder.rotation.y) * .05;
    holder.rotation.x += ((mouse.y * .35) - holder.rotation.x) * .05;
    holder.position.y = Math.sin(t * 1.2) * .08;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(loop);
}
loop();
