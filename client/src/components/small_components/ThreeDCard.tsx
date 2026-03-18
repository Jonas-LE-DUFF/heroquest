"use client";
import React, {
  useState,
  useRef,
  useCallback,
  ReactNode,
  CSSProperties,
} from "react";

interface ThreeDCardProps {
  children?: ReactNode;
  frontContent?: ReactNode;
  backContent?: ReactNode;
  className?: string;
  maxRotation?: number;
  glowOpacity?: number;
  shadowBlur?: number;
  parallaxOffset?: number;
  transitionDuration?: string;
  backgroundImage?: string | null;
  enableGlow?: boolean;
  enableShadow?: boolean;
  enableParallax?: boolean;
}

function ThreeDCard({
  children,
  frontContent,
  backContent,
  className = "",
  maxRotation = 180,
  transitionDuration = "0.45s",
  shadowBlur = 30,
  backgroundImage = null,
  enableShadow = true,
}: ThreeDCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const dragOriginRef = useRef({ x: 0, y: 0 });
  const pointerIdRef = useRef<number | null>(null);

  const [rotation, setRotation] = useState({ x: 0, y: 0, isDragging: false });

  const clampRotation = useCallback(
    (value: number) => {
      return Math.max(-maxRotation, Math.min(maxRotation, value));
    },
    [maxRotation],
  );

  const finishDrag = useCallback(() => {
    if (!rotation.isDragging) return;
    setRotation({ x: 0, y: 0, isDragging: false });
  }, [rotation.isDragging]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    e.preventDefault();

    pointerIdRef.current = e.pointerId;
    cardRef.current.setPointerCapture(e.pointerId);
    dragOriginRef.current = { x: e.clientX, y: e.clientY };
    setRotation((prev) => ({ ...prev, isDragging: true }));
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!rotation.isDragging || pointerIdRef.current !== e.pointerId) return;

    const deltaX = e.clientX - dragOriginRef.current.x;
    const deltaY = e.clientY - dragOriginRef.current.y;

    setRotation({
      x: clampRotation(-deltaY),
      y: clampRotation(deltaX),
      isDragging: true,
    });
  }, [clampRotation, rotation.isDragging]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;

    pointerIdRef.current = null;
    finishDrag();
  }, [finishDrag]);

  const handlePointerCancel = useCallback(() => {
    pointerIdRef.current = null;
    finishDrag();
  }, [finishDrag]);

  const frontFace = frontContent ?? children;
  const backFace = backContent ?? <div style={{ padding: "1rem" }}>Card Back</div>;

  const cardStyle: CSSProperties = {
    transform: `perspective(1000px) rotateY(${rotation.y}deg)`,
    boxShadow: enableShadow
      ? `${rotation.y * 0.2}px ${18 - rotation.x * 0.15}px ${shadowBlur}px rgba(0, 0, 0, 0.35)`
      : "none",
    transition: rotation.isDragging
      ? "none"
      : `transform ${transitionDuration} cubic-bezier(0.22, 1, 0.36, 1), box-shadow ${transitionDuration} cubic-bezier(0.22, 1, 0.36, 1)`,
    transformStyle: "preserve-3d",
    touchAction: "none",
    cursor: rotation.isDragging ? "grabbing" : "grab",
    userSelect: "none",
    height: "100%",
    borderRadius: "1rem",
  };

  const faceWithImageStyle: CSSProperties = backgroundImage
    ? {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        width: "100%",
        height: "100%",
      }
    : {};

  const flipContainerStyle: CSSProperties = {
    position: "relative",
    width: "100%",
    height: "100%",
    transformStyle: "preserve-3d",
  };

  const cardFaceStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    backfaceVisibility: "hidden",
    borderRadius: "1rem",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
  };

  return (
    <div style={{ perspective: "1000px" }} className={className}>
      <div
        ref={cardRef}
        onDragStartCapture={(e) => e.preventDefault()}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={cardStyle}
        className="relative rounded-2xl overflow-hidden"
        role="button"
        tabIndex={0}
      >
        <div style={flipContainerStyle}>
          <div
            style={{
              ...cardFaceStyle,
              background: "linear-gradient(160deg, #1f2937, #0f172a)",
              ...faceWithImageStyle,
            }}
          >
            {frontFace}
          </div>
          <div
            style={{
              ...cardFaceStyle,
              transform: "rotateY(180deg)",
              background:
                "radial-gradient(circle at center, rgba(60, 60, 60, 0.95), rgba(20, 20, 20, 0.95))",
            }}
          >
            {backFace}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ThreeDCard;
