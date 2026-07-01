// src/types/cannon-es.d.ts

declare module "cannon-es" {
  export class Vec3 {
    constructor(x?: number, y?: number, z?: number);
    x: number;
    y: number;
    z: number;
    set(x: number, y: number, z: number): void;
    copy(v: Vec3): Vec3;
    clone(): Vec3;
    add(v: Vec3, target?: Vec3): Vec3;
    sub(v: Vec3, target?: Vec3): Vec3;
    multiply(scalar: number, target?: Vec3): Vec3;
    scale(scalar: number, target?: Vec3): Vec3;
    cross(v: Vec3, target?: Vec3): Vec3;
    normalize(target?: Vec3): Vec3;
    length(): number;
    unit(target?: Vec3): Vec3;
    dot(v: Vec3): number;
    toString(): string;
    toArray(): number[];
  }

  export class Quaternion {
    constructor(x?: number, y?: number, z?: number, w?: number);
    x: number;
    y: number;
    z: number;
    w: number;
    setFromAxisAngle(axis: Vec3, angle: number): void;
    multiply(q: Quaternion, target?: Quaternion): Quaternion;
    copy(q: Quaternion): Quaternion;
    clone(): Quaternion;
    toEuler(target?: Vec3, order?: string): Vec3;
  }

  export class Shape {
    type: number;
  }

  export class Box extends Shape {
    constructor(halfExtents: Vec3);
    halfExtents: Vec3;
  }

  export class Sphere extends Shape {
    constructor(radius: number);
    radius: number;
  }

  export class Plane extends Shape {
    constructor();
    worldNormal: Vec3;
  }

  export class ConvexPolyhedron extends Shape {
    constructor(options: {
      vertices: Vec3[];
      faces: number[][];
      normals?: Vec3[];
    });
    vertices: Vec3[];
    faces: number[][];
    normals: Vec3[];
  }

  export class Material {
    constructor(name?: string);
    name: string;
    friction: number;
    restitution: number;
  }

  export class ContactMaterial {
    constructor(
      m1: Material,
      m2: Material,
      options?: { friction?: number; restitution?: number },
    );
    friction: number;
    restitution: number;
  }

  export class Body {
    constructor(options?: {
      mass?: number;
      shape?: Shape;
      material?: Material;
      position?: Vec3;
      quaternion?: Quaternion;
      velocity?: Vec3;
      angularVelocity?: Vec3;
    });
    position: Vec3;
    quaternion: Quaternion;
    velocity: Vec3;
    angularVelocity: Vec3;
    mass: number;
    material: Material;
    shapes: Shape[];
    linearDamping: number;
    angularDamping: number;
    addShape(shape: Shape, offset?: Vec3, orientation?: Quaternion): void;
    setFromAxisAngle(axis: Vec3, angle: number): void;
  }

  export interface WorldOptions {
    gravity?: Vec3;
    broadphase?: BroadPhase;
    solver?: Solver;
    iterations?: number;
  }

  export class BroadPhase {
    // Type minimal pour éviter les erreurs
  }

  export class Solver {
    // Type minimal pour éviter les erreurs
  }

  export class World {
    constructor(options?: WorldOptions);
    gravity: Vec3;
    broadphase: BroadPhase;
    solver: Solver;
    bodies: Body[];
    addBody(body: Body): void;
    removeBody(body: Body): void;
    addContactMaterial(cm: ContactMaterial): void;
    step(timeStep: number, delta?: number): void;
  }

  export class NaiveBroadphase extends BroadPhase {
    constructor();
  }

  export class SplitImpulseSolver extends Solver {
    constructor();
  }
}
