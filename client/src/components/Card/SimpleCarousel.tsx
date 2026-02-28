import React, {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";

interface SimpleCarouselProps {
  children: React.ReactNode[] | React.ReactNode;
  className?: string;
  // called when the centered index (original index in the items array) changes
  onIndexChange?: (index: number) => void;
}

export type SimpleCarouselHandle = {
  getIndex: () => number;
  setIndex: (i: number) => void;
};

const SimpleCarousel = forwardRef<SimpleCarouselHandle, SimpleCarouselProps>(
  ({ children, className, onIndexChange }: SimpleCarouselProps, ref) => {
    const items = Array.isArray(children) ? children : [children];
    const [index, setIndex] = useState(0);

    const n = items.length;

    const outerRef = useRef<HTMLDivElement | null>(null);

    // measure outer width to compute pixel-perfect translate and child widths

    const prev = () => setIndex((i) => (i - 1 + n) % n);
    const next = () => setIndex((i) => (i + 1) % n);

    // notify parent when centered index changes
    React.useEffect(() => {
      if (onIndexChange) onIndexChange(index);
    }, [index, onIndexChange]);

    const leftIndex = (index - 1 + n) % n;
    const rightIndex = (index + 1) % n;

    // expose imperative handle
    useImperativeHandle(ref, () => ({
      getIndex: () => index,
      setIndex: (i: number) => setIndex(i),
    }));

    const orderedIndices: number[] = [];
    for (let i = 0; i < n; i++) {
      orderedIndices.push((leftIndex + i) % n);
    }

    return (
      <div
        ref={outerRef}
        style={{
          width: "fit-content",
          position: "relative",
          overflow: "hidden",
          maxWidth: 720,
          margin: "0 auto",
        }}
        className={className}
      >
        <div
          style={{
            display: "flex",
            width: "fit-content",
            transition: "transform 300ms ease",
            alignItems: "center",
          }}
        >
          {orderedIndices.map((origIndex, i) => {
            const child = items[origIndex];
            const isCenter = origIndex === index;
            const isSide = origIndex === leftIndex || origIndex === rightIndex;

            const style: React.CSSProperties = {
              // each child's pixel width equals the slot width so visible slots fill the outer container
              width: "fit-content",
              height: "auto",
              display: isCenter || isSide ? "flex" : "none",
              justifyContent: "center",
              alignItems: "center",
              transform: isCenter
                ? "scale(1)"
                : isSide
                  ? "scale(0.92)"
                  : "scale(0.85)",
              filter: isCenter
                ? "none"
                : isSide
                  ? "grayscale(60%) brightness(80%)"
                  : "grayscale(100%) brightness(60%)",
              opacity: isCenter ? 1 : isSide ? 0.9 : 0.0,
              zIndex: isCenter ? 3 : isSide ? 2 : 1,
              // allow pointer events on center and side so side cards can be clicked
              pointerEvents: isCenter || isSide ? "auto" : "none",
              cursor: isCenter || isSide ? "pointer" : "default",
              padding: 8,
              boxSizing: "border-box",
            };

            const onActivate = () => {
              // activate the clicked original index
              if (origIndex !== index) setIndex(origIndex);
            };

            return (
              <div
                key={origIndex}
                style={style}
                onClick={onActivate}
                role={isCenter || isSide ? "button" : undefined}
                aria-pressed={isCenter}
              >
                {child}
              </div>
            );
          })}
        </div>

        <button
          aria-label="previous"
          onClick={prev}
          style={{
            position: "absolute",
            left: 8,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 10,
          }}
        >
          ‹
        </button>

        <button
          aria-label="next"
          onClick={next}
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 10,
          }}
        >
          ›
        </button>
      </div>
    );
  },
);

export { SimpleCarousel };
