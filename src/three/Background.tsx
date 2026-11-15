import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { onFx } from './fx';

interface BackgroundProps {
  mode: 'menu' | 'game';
  enabled: boolean;
}

const YELLOW = 0xfacc15;
const BLUE = 0x2563eb;
const SKY = 0x38bdf8;
const COLORS = [YELLOW, BLUE, SKY];

const gradient = 'linear-gradient(160deg, #facc15 0%, #38bdf8 45%, #1d4ed8 100%)';

function roundedCardShape(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return s;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const cb = () => setReduced(mq.matches);
    mq.addEventListener('change', cb);
    return () => mq.removeEventListener('change', cb);
  }, []);
  return reduced;
}

export default function Background({ mode, enabled }: BackgroundProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef(mode);
  const reduced = usePrefersReducedMotion();
  const [failed, setFailed] = useState(false);
  modeRef.current = mode;

  const active = enabled && !reduced && !failed;

  useEffect(() => {
    if (!active || !hostRef.current) return;
    const host = hostRef.current;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 12;

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(3, 5, 8);
    scene.add(dir);

    const disposables: { dispose: () => void }[] = [];
    const track = <T extends { dispose: () => void }>(x: T) => (disposables.push(x), x);

    // ── Floating cards ──────────────────────────────────────────────────────
    const cardGeo = track(
      new THREE.ExtrudeGeometry(roundedCardShape(1.4, 2, 0.18), { depth: 0.06, bevelEnabled: false })
    );
    const faceGeo = track(new THREE.ShapeGeometry(roundedCardShape(1.15, 1.75, 0.12)));
    const faceMat = track(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }));
    const cardMats = COLORS.map((c) => track(new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 })));

    const cards = Array.from({ length: 14 }, (_, i) => {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(cardGeo, cardMats[i % COLORS.length]));
      const face = new THREE.Mesh(faceGeo, faceMat);
      face.position.z = 0.07;
      g.add(face);
      const home = new THREE.Vector3((Math.random() - 0.5) * 18, (Math.random() - 0.5) * 14, -Math.random() * 8);
      g.position.copy(home);
      g.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      scene.add(g);
      return { g, home, spin: 0.2 + Math.random() * 0.5, phase: Math.random() * 10 };
    });

    // ── Hourglass ───────────────────────────────────────────────────────────
    const hourglass = new THREE.Group();
    const glassMat = track(
      new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, roughness: 0.1 })
    );
    const sandMat = track(new THREE.MeshStandardMaterial({ color: YELLOW, roughness: 0.8 }));
    const frameMat = track(new THREE.MeshStandardMaterial({ color: BLUE, roughness: 0.4 }));
    const coneGeo = track(new THREE.ConeGeometry(1, 1.4, 32, 1, true));
    const sandGeo = track(new THREE.ConeGeometry(0.7, 0.8, 32));
    const plateGeo = track(new THREE.CylinderGeometry(1.25, 1.25, 0.18, 32));
    const top = new THREE.Mesh(coneGeo, glassMat);
    top.rotation.x = Math.PI;
    top.position.y = 0.7;
    const bottom = new THREE.Mesh(coneGeo, glassMat);
    bottom.position.y = -0.7;
    const sand = new THREE.Mesh(sandGeo, sandMat);
    sand.position.y = -1.0;
    const plateTop = new THREE.Mesh(plateGeo, frameMat);
    plateTop.position.y = 1.5;
    const plateBottom = new THREE.Mesh(plateGeo, frameMat);
    plateBottom.position.y = -1.5;
    hourglass.add(top, bottom, sand, plateTop, plateBottom);
    hourglass.position.set(0, 3.2, -3);
    scene.add(hourglass);

    // ── Ambient particles ───────────────────────────────────────────────────
    const P = 300;
    const pGeo = track(new THREE.BufferGeometry());
    const pPos = new Float32Array(P * 3);
    for (let i = 0; i < P * 3; i++) pPos[i] = (Math.random() - 0.5) * 24;
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = track(new THREE.PointsMaterial({ color: 0xffffff, size: 0.06, transparent: true, opacity: 0.7 }));
    scene.add(new THREE.Points(pGeo, pMat));

    // ── Confetti burst (one reusable Points cloud) ──────────────────────────
    const C = 150;
    const cGeo = track(new THREE.BufferGeometry());
    const cPos = new Float32Array(C * 3);
    const cCol = new Float32Array(C * 3);
    const cVel = new Float32Array(C * 3);
    const tmp = new THREE.Color();
    for (let i = 0; i < C; i++) {
      tmp.setHex(COLORS[i % COLORS.length]);
      cCol.set([tmp.r, tmp.g, tmp.b], i * 3);
    }
    cGeo.setAttribute('position', new THREE.BufferAttribute(cPos, 3));
    cGeo.setAttribute('color', new THREE.BufferAttribute(cCol, 3));
    const cMat = track(
      new THREE.PointsMaterial({ size: 0.22, vertexColors: true, transparent: true, opacity: 0 })
    );
    const confetti = new THREE.Points(cGeo, cMat);
    scene.add(confetti);
    let confettiAge = Infinity;

    const burst = () => {
      for (let i = 0; i < C; i++) {
        cPos.set([0, 0, 2], i * 3);
        const a = Math.random() * Math.PI * 2;
        const sp = 4 + Math.random() * 6;
        cVel.set([Math.cos(a) * sp, Math.sin(a) * sp + 4, (Math.random() - 0.5) * 4], i * 3);
      }
      confettiAge = 0;
    };

    // ── Time-up flash + shake ───────────────────────────────────────────────
    let shake = 0;
    const flashColor = new THREE.Color(0xef4444);

    const offFx = onFx((fx) => {
      if (fx === 'confetti') burst();
      if (fx === 'timeup') shake = 0.3;
    });

    // ── Loop ────────────────────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let speed = modeRef.current === 'game' ? 0.3 : 1;
    let raf = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05);
      if (document.hidden) return;
      const t = clock.elapsedTime;
      const target = modeRef.current === 'game' ? 0.3 : 1;
      speed += (target - speed) * 0.05;
      // in game, push cards away from the centre so the word stays readable
      const spread = modeRef.current === 'game' ? 1.5 : 1;

      for (const c of cards) {
        c.g.rotation.x += dt * c.spin * speed;
        c.g.rotation.y += dt * c.spin * 0.7 * speed;
        c.g.position.x += (c.home.x * spread - c.g.position.x) * 0.02;
        c.g.position.y = c.home.y * spread + Math.sin(t * 0.6 * speed + c.phase) * 0.6;
      }
      hourglass.rotation.z = Math.sin(t * 0.5) * 0.25;
      hourglass.rotation.y += dt * 0.4 * speed;
      hourglass.visible = modeRef.current === 'menu';

      if (confettiAge < 1.2) {
        confettiAge += dt;
        for (let i = 0; i < C; i++) {
          cVel[i * 3 + 1] -= 12 * dt;
          cPos[i * 3] += cVel[i * 3] * dt;
          cPos[i * 3 + 1] += cVel[i * 3 + 1] * dt;
          cPos[i * 3 + 2] += cVel[i * 3 + 2] * dt;
        }
        cGeo.attributes.position.needsUpdate = true;
        cMat.opacity = Math.max(0, 1 - confettiAge / 1.2);
      } else {
        cMat.opacity = 0;
      }

      if (shake > 0) {
        shake = Math.max(0, shake - dt);
        camera.position.x = (Math.random() - 0.5) * shake;
        camera.position.y = (Math.random() - 0.5) * shake;
        renderer.setClearColor(flashColor, shake);
      } else {
        camera.position.x = camera.position.y = 0;
        renderer.setClearColor(0x000000, 0);
      }

      renderer.render(scene, camera);
    };
    tick();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      offFx();
      window.removeEventListener('resize', onResize);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, [active]);

  return (
    <div aria-hidden="true" className="fixed inset-0 z-0 pointer-events-none" style={{ background: gradient }}>
      {active && <div ref={hostRef} className="absolute inset-0" />}
    </div>
  );
}
