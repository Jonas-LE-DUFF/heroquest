/**
 * @brief Anime des dés à 6 faces en 3D avec physique réaliste
 * @dependencies cannon-es, three
 */

import * as THREE from "three";
import * as CANNON from "cannon-es";

// ── Types ──────────────────────────────────────────────────────────────────

export interface RollResult {
  /** Valeurs obtenues sur chaque dé (1–6) */
  values: number[];
  /** Somme de tous les dés */
  total: number;
}

export interface DiceBoxConfig {
  /** Pas de simulation physique en secondes. Défaut : 1/60 */
  frameRate: number;
  /** Taille des dés, recalculée automatiquement au resize */
  scale: number;
  diceScaleFactor: number;
  labelColor: string;
  diceColor: string;
  diceLabels: string[];
  ambientLightColor: number;
  spotLightColor: number;
  deskColor: string;
  deskOpacity: number;
  useShadows: boolean;
  useAdaptiveTimestep: boolean;
  /** Chemin vers le fichier audio de lancer */
  soundPath: string;

  boxScale: number;
}

// Étend THREE.Mesh pour porter le corps physique cannon-es
interface DiceMesh extends THREE.Mesh {
  body: CANNON.Body;
  diceStopped: boolean | number | undefined;
}

interface DiceGeometry extends THREE.BufferGeometry {
  cannonShape: CANNON.ConvexPolyhedron;
}

interface DiceVector {
  pos: CANNON.Vec3;
  velocity: CANNON.Vec3;
  angle: { x: number; y: number; z: number };
  axis: { x: number; y: number; z: number; a: number };
}

// ── Constantes d6 ──────────────────────────────────────────────────────────

const D6_MASS = 300;
const D6_INERTIA = 13;

// Labels des 6 faces + index 0 réservé (pas de label)
const D6_LABELS = [" ", "1", "2", "3", "4", "5", "6"];

const DEFAULT_CONFIG: DiceBoxConfig = {
  frameRate: 1 / 60,
  scale: 100,
  diceScaleFactor: 1,
  boxScale: 1,
  labelColor: "#ffffff",
  diceColor: "#ff0000",
  ambientLightColor: 0xffffff,
  spotLightColor: 0xffffff,
  deskColor: "#8d1b1b",
  deskOpacity: 0.1,
  useShadows: true,
  useAdaptiveTimestep: true,
  soundPath: "assets/nc93322.mp3",
  diceLabels: D6_LABELS,
};

// ── DiceBox ────────────────────────────────────────────────────────────────

export class DiceBox {
  private dices: DiceMesh[] = [];
  private readonly scene: THREE.Scene;
  private readonly world: CANNON.World;
  private readonly container: HTMLElement;
  private readonly renderer: THREE.WebGLRenderer;
  private camera!: THREE.PerspectiveCamera;
  private light!: THREE.SpotLight;
  private desk!: THREE.Mesh;

  private readonly diceBodyMaterial: CANNON.Material;
  private config: DiceBoxConfig;

  private rolling: boolean = false;
  private lastTime: number = 0;
  private running: number | false = false;
  private iteration: number = 0;
  private callback: ((results: number[]) => void) | null = null;

  // Dimensions canvas (demi-tailles)
  private w: number = 0;
  private h: number = 0;
  private aspect: number = 1;

  // Géométrie et matériaux mis en cache — créés une seule fois
  private d6Geometry: DiceGeometry | undefined;
  private d6Materials: THREE.MeshPhongMaterial[] | undefined;

  constructor(container: HTMLElement, config: Partial<DiceBoxConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.container = container;
    this.scene = new THREE.Scene();

    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, 0, -9.8 * 800),
    });
    this.world.broadphase = new CANNON.NaiveBroadphase();
    (this.world.solver as unknown as { iterations: number }).iterations = 16;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    container.appendChild(this.renderer.domElement);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.setClearColor(0xffffff, 0);

    this.reinit(container);
    window.addEventListener("resize", () => this.reinit(container));

    this.scene.add(new THREE.AmbientLight(this.config.ambientLightColor));

    this.diceBodyMaterial = new CANNON.Material("dice");
    const deskMaterial = new CANNON.Material("desk");
    const barrierMaterial = new CANNON.Material("barrier");

    this.world.addContactMaterial(
      new CANNON.ContactMaterial(deskMaterial, this.diceBodyMaterial, {
        friction: 0.01,
        restitution: 0.5,
      }),
    );
    this.world.addContactMaterial(
      new CANNON.ContactMaterial(barrierMaterial, this.diceBodyMaterial, {
        friction: 0,
        restitution: 1.0,
      }),
    );
    this.world.addContactMaterial(
      new CANNON.ContactMaterial(this.diceBodyMaterial, this.diceBodyMaterial, {
        friction: 0,
        restitution: 0.5,
      }),
    );

    this.world.addBody(
      new CANNON.Body({
        mass: 0,
        shape: new CANNON.Plane(),
        material: deskMaterial,
      }),
    );
    this.addBarriers(barrierMaterial);

    if (config.diceLabels) {
      this.loadDiceMaterials();
    }

    this.renderer.render(this.scene, this.camera);
  }

  private loadDiceMaterials(): void {
    this.d6Materials = buildD6MaterialsAsync(
      this.config.diceLabels,
      this.config.scale / 2,
      0.9,
      this.config,
    );
  }

  // ── API publique ───────────────────────────────────────────────────────

  /**
   * Lance `count` dés à 6 faces et appelle `onResult` avec les résultats.
   * Si `forcedValues` est fourni, les dés s'arrêteront sur ces valeurs.
   */
  public roll(
    count: number,
    onResult: (result: RollResult) => void,
    forcedValues?: number[],
  ): void {
    if (this.rolling) return;

    this.rolling = true;

    const vector = {
      x: (rnd() * 2 - 1) * this.w,
      y: -(rnd() * 2 - 1) * this.h,
    };
    const dist = Math.sqrt(vector.x ** 2 + vector.y ** 2);
    const boost = (rnd() + 3) * dist;
    vector.x /= dist;
    vector.y /= dist;

    const vectors = this.generateVectors(count, vector, boost);

    const numSounds = Math.min(count, 10);
    for (let i = 0; i < numSounds; i++) {
      playSound(this.container, Math.max(0.1, i / 10), this.config.soundPath);
    }
    this.doRoll(vectors, forcedValues ?? [], onResult);
  }

  /** Re-initialise caméra, lumière et sol après un resize */
  public reinit(container: HTMLElement): void {
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    this.w = cw;
    this.h = ch;
    this.aspect = Math.min(cw / this.w, ch / this.h);
    this.config.scale =
      (Math.sqrt(this.w ** 2 + this.h ** 2) / 8) * this.config.diceScaleFactor;

    this.renderer.setSize(cw, ch);

    const wh = ch / this.aspect / Math.tan((10 * Math.PI) / 180);
    if (this.camera) this.scene.remove(this.camera);
    this.camera = new THREE.PerspectiveCamera(20, cw / ch, 1, wh * 1.3);
    this.camera.position.z = wh;

    const mw = Math.max(this.w, this.h);
    if (this.light) this.scene.remove(this.light);
    this.light = new THREE.SpotLight(this.config.spotLightColor, 2.0);
    this.light.position.set(-mw / 2, mw / 2, mw * 2);
    this.light.target.position.set(0, 0, 0);
    this.light.distance = mw * 5;
    this.light.castShadow = true;
    this.light.shadow.camera.near = mw / 10;
    this.light.shadow.camera.far = mw * 5;
    this.light.shadow.camera.fov = 50;
    this.light.shadow.bias = 0.001;
    this.light.shadow.mapSize.width = 1024;
    this.light.shadow.mapSize.height = 1024;
    this.scene.add(this.light);

    if (this.desk) this.scene.remove(this.desk);
    this.desk = new THREE.Mesh(
      new THREE.PlaneGeometry(
        this.w * 2 * this.config.boxScale,
        this.h * 2 * this.config.boxScale,
        1,
        1,
      ),
      new THREE.MeshPhongMaterial({
        color: this.config.deskColor,
        opacity: this.config.deskOpacity,
        transparent: true,
      }),
    );
    this.desk.receiveShadow = this.config.useShadows;
    this.scene.add(this.desk);

    this.renderer.render(this.scene, this.camera);
  }

  // ── Orchestration du lancer ────────────────────────────────────────────

  private doRoll(
    vectors: DiceVector[],
    forcedValues: number[],
    onResult: (result: RollResult) => void,
  ): void {
    const savedAdaptive = this.config.useAdaptiveTimestep;
    this.clear();

    // Si des valeurs sont imposées, on simule d'abord pour connaître
    // l'orientation naturelle, puis on recale les faces
    if (forcedValues.length) {
      this.config.useAdaptiveTimestep = false;
      this.spawnAll(vectors);
      const naturalResults = this.emulateThrow();
      this.clear();
      this.spawnAll(vectors);
      this.dices.forEach((dice, i) =>
        shiftDiceFaces(dice, forcedValues[i], naturalResults[i]),
      );
    } else {
      this.spawnAll(vectors);
    }

    this.callback = (rawValues) => {
      const values = rawValues.map((v) => Math.max(1, Math.min(6, v)));
      onResult({ values, total: values.reduce((s, a) => s + a, 0) });
      this.rolling = false;
      this.config.useAdaptiveTimestep = savedAdaptive;
    };
    this.running = Date.now();
    this.lastTime = 0;
    this.animate(this.running);
  }

  // ── Physique & rendu ───────────────────────────────────────────────────

  private generateVectors(
    count: number,
    vector: { x: number; y: number },
    boost: number,
  ): DiceVector[] {
    return Array.from({ length: count }, () => {
      const vec = makeRandomVector(vector);
      let px = this.w * (vec.x > 0 ? -1 : 1) * 0.9;
      let py = this.h * (vec.y > 0 ? -1 : 1) * 0.9;
      const projector = Math.abs(vec.x / vec.y);
      if (projector > 1.0) py /= projector;
      else px *= projector;

      const velvec = makeRandomVector(vector);
      return {
        pos: new CANNON.Vec3(px, py, rnd() * 200 + 200),
        velocity: new CANNON.Vec3(velvec.x * boost, velvec.y * boost, -10),
        angle: {
          x: -(rnd() * vec.y * 5 + D6_INERTIA * vec.y),
          y: rnd() * vec.x * 5 + D6_INERTIA * vec.x,
          z: 0,
        },
        axis: { x: rnd(), y: rnd(), z: rnd(), a: rnd() },
      };
    });
  }

  private spawnAll(vectors: DiceVector[]): void {
    this.iteration = 0;
    for (const v of vectors) this.spawnDice(v);
  }

  private spawnDice(dv: DiceVector): void {
    if (!this.d6Geometry) {
      this.d6Geometry = createD6Geometry(this.config.scale * 1.1);
    }

    const mesh = new THREE.Mesh(
      this.d6Geometry,
      this.d6Materials,
    ) as unknown as DiceMesh;
    mesh.castShadow = true;

    const body = new CANNON.Body({
      mass: D6_MASS,
      shape: this.d6Geometry.cannonShape,
      material: this.diceBodyMaterial,
    });
    body.position.copy(dv.pos);
    body.quaternion.setFromAxisAngle(
      new CANNON.Vec3(dv.axis.x, dv.axis.y, dv.axis.z),
      dv.axis.a * Math.PI * 2,
    );
    body.angularVelocity.set(dv.angle.x, dv.angle.y, dv.angle.z);
    body.velocity.copy(dv.velocity);
    body.linearDamping = 0.1;
    body.angularDamping = 0.1;

    mesh.body = body;
    mesh.diceStopped = undefined;
    this.scene.add(mesh);
    this.dices.push(mesh);
    this.world.addBody(body);
  }

  private checkIfThrowFinished(): boolean {
    const threshold = 6;
    if (this.iteration >= 10 / this.config.frameRate) return true;

    return this.dices.every((dice) => {
      if (dice.diceStopped === true) return true;
      const { angularVelocity: a, velocity: v } = dice.body;
      const settled =
        Math.abs(a.x) < threshold &&
        Math.abs(a.y) < threshold &&
        Math.abs(a.z) < threshold &&
        Math.abs(v.x) < threshold &&
        Math.abs(v.y) < threshold &&
        Math.abs(v.z) < threshold;

      if (settled) {
        if (typeof dice.diceStopped === "number") {
          if (this.iteration - dice.diceStopped > 3) {
            dice.diceStopped = true;
            return true;
          }
        } else {
          dice.diceStopped = this.iteration;
        }
        return false;
      }
      dice.diceStopped = undefined;
      return false;
    });
  }

  private emulateThrow(): number[] {
    while (!this.checkIfThrowFinished()) {
      this.iteration++;
      this.world.step(this.config.frameRate);
    }
    return this.dices.map(getDiceValue);
  }

  private animate(threadId: number): void {
    const time = Date.now();
    let timeDiff = (time - this.lastTime) / 1000;
    if (timeDiff > 3) timeDiff = this.config.frameRate;
    this.iteration++;

    if (this.config.useAdaptiveTimestep) {
      while (timeDiff > this.config.frameRate * 1.1) {
        this.world.step(this.config.frameRate);
        timeDiff -= this.config.frameRate;
      }
      this.world.step(timeDiff);
    } else {
      this.world.step(this.config.frameRate);
    }

    // Synchronise les meshes THREE avec les corps physiques
    for (const child of this.scene.children) {
      const mesh = child as DiceMesh;
      if (mesh.body) {
        mesh.position.set(
          mesh.body.position.x,
          mesh.body.position.y,
          mesh.body.position.z,
        );
        mesh.quaternion.set(
          mesh.body.quaternion.x,
          mesh.body.quaternion.y,
          mesh.body.quaternion.z,
          mesh.body.quaternion.w,
        );
      }
    }

    this.renderer.render(this.scene, this.camera);
    this.lastTime = this.lastTime ? time : Date.now();

    if (this.running === threadId && this.checkIfThrowFinished()) {
      this.running = false;
      this.callback?.(this.dices.map(getDiceValue));
    }

    if (this.running === threadId) {
      if (
        !this.config.useAdaptiveTimestep &&
        timeDiff < this.config.frameRate
      ) {
        window.setTimeout(
          () => window.requestAnimationFrame(() => this.animate(threadId)),
          (this.config.frameRate - timeDiff) * 1000,
        );
      } else {
        window.requestAnimationFrame(() => this.animate(threadId));
      }
    }
  }

  private clear(): void {
    this.running = false;
    let dice: DiceMesh | undefined;
    while ((dice = this.dices.pop())) {
      this.scene.remove(dice);
      if (dice.body) this.world.removeBody(dice.body);
    }
    this.renderer.render(this.scene, this.camera);
    window.setTimeout(() => this.renderer.render(this.scene, this.camera), 100);
  }

  // ── Setup monde physique ─────────────────────────────────────────────

  private addBarriers(material: CANNON.Material): void {
    const barriers: Array<{
      axis: CANNON.Vec3;
      angle: number;
      pos: CANNON.Vec3;
    }> = [
      {
        axis: new CANNON.Vec3(1, 0, 0),
        angle: Math.PI / 2,
        pos: new CANNON.Vec3(0, this.h * this.config.boxScale, 0),
      },
      {
        axis: new CANNON.Vec3(1, 0, 0),
        angle: -Math.PI / 2,
        pos: new CANNON.Vec3(0, -this.h * this.config.boxScale, 0),
      },
      {
        axis: new CANNON.Vec3(0, 1, 0),
        angle: -Math.PI / 2,
        pos: new CANNON.Vec3(this.w * this.config.boxScale, 0, 0),
      },
      {
        axis: new CANNON.Vec3(0, 1, 0),
        angle: Math.PI / 2,
        pos: new CANNON.Vec3(-this.w * this.config.boxScale, 0, 0),
      },
    ];
    for (const { axis, angle, pos } of barriers) {
      const body = new CANNON.Body({
        mass: 0,
        shape: new CANNON.Plane(),
        material,
      });
      body.quaternion.setFromAxisAngle(axis, angle);
      body.position.copy(pos);
      this.world.addBody(body);
    }
  }
}

// ── Helpers purs ───────────────────────────────────────────────────────────

function rnd(): number {
  return Math.random();
}

function makeRandomVector(vector: { x: number; y: number }): {
  x: number;
  y: number;
} {
  const angle = (rnd() * Math.PI) / 5 - Math.PI / 10;
  const x = vector.x * Math.cos(angle) - vector.y * Math.sin(angle);
  const y = vector.x * Math.sin(angle) + vector.y * Math.cos(angle);
  return { x: x === 0 ? 0.01 : x, y: y === 0 ? 0.01 : y };
}

function playSound(
  container: HTMLElement,
  volume: number,
  soundPath: string,
): void {
  if (volume === 0) return;
  const audio = document.createElement("audio");
  container.appendChild(audio);
  audio.src = soundPath;
  audio.volume = volume;
  audio.play().catch((err) => console.error("Error playing dice sound:", err));
  audio.onended = () => audio.remove();
}

// ── Lecture de la face vers le haut ───────────────────────────────────────

function getDiceValue(dice: DiceMesh): number {
  const upVector = new THREE.Vector3(0, 0, 1);
  const geo = dice.geometry as DiceGeometry;
  const normalAttr = geo.getAttribute("normal") as THREE.BufferAttribute;

  let bestMaterialIndex = 0;
  let bestAngle = Math.PI * 2;

  for (const group of geo.groups) {
    const faceNormal = new THREE.Vector3();
    for (let i = group.start; i < group.start + group.count; i++) {
      faceNormal.x += normalAttr.getX(i);
      faceNormal.y += normalAttr.getY(i);
      faceNormal.z += normalAttr.getZ(i);
    }
    faceNormal
      .divideScalar(group.count)
      .normalize()
      .applyQuaternion(dice.body.quaternion);

    const angle = faceNormal.angleTo(upVector);
    if (angle < bestAngle) {
      bestAngle = angle;
      bestMaterialIndex = group.materialIndex ?? 0;
    }
  }

  // materialIndex 1–6 correspond aux faces 1–6
  return bestMaterialIndex;
}

// ── Décalage de faces pour forcer un résultat ──────────────────────────────

function shiftDiceFaces(
  dice: DiceMesh,
  value: number,
  naturalResult: number,
): void {
  if (value < 1 || value > 6) return;
  const geo = (dice.geometry as DiceGeometry).clone();
  geo.cannonShape = (dice.geometry as DiceGeometry).cannonShape;
  const shift = value - naturalResult;
  for (const group of geo.groups) {
    if (group.materialIndex === 0) continue;
    let idx = (group.materialIndex ?? 0) + shift;
    while (idx > 6) idx -= 6;
    while (idx < 1) idx += 6;
    group.materialIndex = idx;
  }
  dice.geometry = geo;
}

// ── Matériaux d6 ───────────────────────────────────────────────────────────

function calcTextureSize(approx: number): number {
  return Math.pow(2, Math.floor(Math.log(approx) / Math.log(2)));
}

function createFaceTexture(
  textOrUrl: string,
  labelColor: string,
  diceColor: string,
  size: number,
  margin: number,
): THREE.Texture {
  if (
    textOrUrl.startsWith("http") ||
    textOrUrl.endsWith(".png") ||
    textOrUrl.endsWith(".jpg") ||
    textOrUrl.endsWith(".jpeg") ||
    textOrUrl.endsWith(".webp")
  ) {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(
      textOrUrl,
      undefined, // onLoad
      undefined, // onProgress
      (err) => {
        console.error("Erreur de chargement de l'image:", err);
        return createFallbackTexture(0xffffff);
      },
    );

    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipMapLinearFilter;
    return texture;
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  // Taille minimale de 64x64 pour éviter les textures trop petites
  const ts = Math.max(64, calcTextureSize(size + size * 2 * margin) * 2);
  canvas.width = canvas.height = ts;
  ctx.font = `${ts / 2}px Arial`; // Police plus lisible
  ctx.fillStyle = diceColor;
  ctx.fillRect(0, 0, ts, ts);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = labelColor;
  ctx.fillText(textOrUrl, ts / 2, ts / 2);
  if (textOrUrl === "6" || textOrUrl === "9")
    ctx.fillText("_", ts / 2, ts / 2 + ts / 10); // Point pour le 6
  return new THREE.CanvasTexture(canvas);
}

function createFallbackTexture(color: number): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

function buildD6MaterialsAsync(
  labels: string[],
  size: number,
  margin: number,
  config: DiceBoxConfig,
): THREE.MeshPhongMaterial[] {
  return labels.map((label, index) => {
    if (index === 0) {
      return new THREE.MeshPhongMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
      });
    }
    return new THREE.MeshPhongMaterial({
      color: 0xefefef,
      emissive: 0xcfcfcf, // ← la texture s'affiche à sa luminosité native
      shininess: 10,
      emissiveMap: createFaceTexture(
        label,
        config.labelColor,
        config.diceColor,
        size,
        margin,
      ), // ← sur le canal emissive plutôt que diffuse
      map: createFaceTexture(
        label,
        config.labelColor,
        config.diceColor,
        size,
        margin,
      ),
      flatShading: false,
      transparent: true,
    });
  });
}

// ── Géométrie d6 ───────────────────────────────────────────────────────────

type Vertex = [number, number, number];
type Face = number[];

function createCannonShape(
  vertices: Vertex[],
  faces: Face[],
  radius: number,
): CANNON.ConvexPolyhedron {
  const cv = vertices.map(
    ([x, y, z]) => new CANNON.Vec3(x * radius, y * radius, z * radius),
  );
  return new CANNON.ConvexPolyhedron({
    vertices: cv,
    faces: faces.map((f) => f.slice(0, f.length - 1)),
  });
}

function makeGeom(
  vectors: THREE.Vector3[],
  faces: Face[],
  radius: number,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const normals: number[] = [];
  const groups: Array<{ start: number; count: number; materialIndex: number }> =
    [];

  const scaledVerts = vectors.map((v) => v.clone().multiplyScalar(radius));

  const squareUVs: [number, number][] = [
    [0, 0], // sommet ii[0]
    [1, 0], // sommet ii[1]
    [1, 1], // sommet ii[2]
    [0, 1], // sommet ii[3]
  ];

  for (const ii of faces) {
    const fl = ii.length - 1;
    const materialIndex = ii[fl]; // dernier élément = numéro de face
    const groupStart = positions.length / 3;
    let groupCount = 0;

    for (let j = 0; j < fl - 2; j++) {
      const v0 = scaledVerts[ii[0]];
      const v1 = scaledVerts[ii[j + 1]];
      const v2 = scaledVerts[ii[j + 2]];
      positions.push(v0.x, v0.y, v0.z, v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);

      const n = v1.clone().sub(v0).cross(v2.clone().sub(v0)).normalize();
      for (let k = 0; k < 3; k++) normals.push(n.x, n.y, n.z);

      const [u0, v0uv] = squareUVs[0];
      const [u1, v1uv] = squareUVs[j + 1];
      const [u2, v2uv] = squareUVs[j + 2];
      uvs.push(u0, v0uv, u1, v1uv, u2, v2uv);

      groupCount += 3;
    }

    groups.push({ start: groupStart, count: groupCount, materialIndex });
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  for (const g of groups) geo.addGroup(g.start, g.count, g.materialIndex);
  return geo;
}

function chamferGeom(
  vectors: THREE.Vector3[],
  faces: Face[],
  chamfer: number,
): { vectors: THREE.Vector3[]; faces: Face[] } {
  const chamferVectors: THREE.Vector3[] = [];
  const chamferFaces: Face[] = [];
  const cornerFaces: number[][] = vectors.map(() => []);

  for (const ii of faces) {
    const fl = ii.length - 1;
    const center = new THREE.Vector3();
    const face: number[] = [];
    for (let j = 0; j < fl; j++) {
      const vv = vectors[ii[j]].clone();
      center.add(vv);
      cornerFaces[ii[j]].push((face[j] = chamferVectors.push(vv) - 1));
    }
    center.divideScalar(fl);
    for (let j = 0; j < fl; j++) {
      chamferVectors[face[j]].sub(center).multiplyScalar(chamfer).add(center);
    }
    face.push(ii[fl]);
    chamferFaces.push(face);
  }

  for (let i = 0; i < faces.length - 1; i++) {
    for (let j = i + 1; j < faces.length; j++) {
      const pairs: [number, number][] = [];
      let lastm = -1;
      for (let m = 0; m < faces[i].length - 1; m++) {
        const n = faces[j].indexOf(faces[i][m]);
        if (n >= 0 && n < faces[j].length - 1) {
          if (lastm >= 0 && m !== lastm + 1) pairs.unshift([i, m], [j, n]);
          else pairs.push([i, m], [j, n]);
          lastm = m;
        }
      }
      if (pairs.length !== 4) continue;
      chamferFaces.push([
        chamferFaces[pairs[0][0]][pairs[0][1]],
        chamferFaces[pairs[1][0]][pairs[1][1]],
        chamferFaces[pairs[3][0]][pairs[3][1]],
        chamferFaces[pairs[2][0]][pairs[2][1]],
        -1,
      ]);
    }
  }

  for (const cf of cornerFaces) {
    const face = [cf[0]];
    let count = cf.length - 1;
    while (count--) {
      for (let m = faces.length; m < chamferFaces.length; m++) {
        const idx = chamferFaces[m].indexOf(face[face.length - 1]);
        if (idx >= 0 && idx < 4) {
          const prev = idx === 0 ? 3 : idx - 1;
          const next = chamferFaces[m][prev];
          if (cf.includes(next)) {
            face.push(next);
            break;
          }
        }
      }
    }
    face.push(-1);
    chamferFaces.push(face);
  }
  return { vectors: chamferVectors, faces: chamferFaces };
}

function createD6Geometry(radius: number): DiceGeometry {
  const rawVertices: Vertex[] = [
    [-1, -1, -1],
    [1, -1, -1],
    [1, 1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
    [1, -1, 1],
    [1, 1, 1],
    [-1, 1, 1],
  ];
  const faces: Face[] = [
    [0, 3, 2, 1, 1],
    [1, 2, 6, 5, 2],
    [0, 1, 5, 4, 3],
    [3, 7, 6, 2, 4],
    [0, 4, 7, 3, 5],
    [4, 5, 6, 7, 6],
  ];

  const vectors = rawVertices.map((v) => new THREE.Vector3(...v).normalize());
  const cg = chamferGeom(vectors, faces, 0.96);
  const geo = makeGeom(cg.vectors, cg.faces, radius) as DiceGeometry;
  geo.cannonShape = createCannonShape(rawVertices, faces, radius);
  return geo;
}
