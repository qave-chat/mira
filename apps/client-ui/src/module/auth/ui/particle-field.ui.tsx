import { type MutableRefObject, useEffect, useRef, useSyncExternalStore } from "react";

type Particle = {
  ox: number;
  oy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  phase: number;
  springJitter: number;
  appear: number;
  fading: boolean;
};

type ParticleTarget = {
  ox: number;
  oy: number;
  size: number;
  alpha: number;
};

export type ParticleFieldProps = {
  src: string;
  sampleStep?: number;
  threshold?: number;
  renderScale?: number;
  dotSize?: number;
  mouseForce?: number;
  mouseRadius?: number;
  spring?: number;
  damping?: number;
  className?: string;
  align?: "center" | "bottom";
  fit?: "cover" | "contain";
  color?: string;
  invert?: boolean;
  adaptToTheme?: boolean;
  typingImpulseRef?: MutableRefObject<number>;
  denseParticles?: boolean;
};

const TYPING_IMPULSE_ADD = 0.14;
const TYPING_IMPULSE_CAP = 1.35;
const SUBMIT_IMPULSE_PRIMARY = 0.52;
const SUBMIT_IMPULSE_SECOND_MS = 120;
const SUBMIT_IMPULSE_SECONDARY = 0.2;

function subscribeDocumentDark(callback: () => void) {
  const el = document.documentElement;
  const mutationObserver = new MutationObserver(callback);
  mutationObserver.observe(el, { attributes: true, attributeFilter: ["class"] });
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", callback);

  return () => {
    mutationObserver.disconnect();
    mediaQuery.removeEventListener("change", callback);
  };
}

function getDocumentDarkSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function getServerDarkSnapshot() {
  return true;
}

function useDocumentDark() {
  return useSyncExternalStore(
    subscribeDocumentDark,
    getDocumentDarkSnapshot,
    getServerDarkSnapshot,
  );
}

export function pulseParticleTypingImpulse(
  impulseRef: MutableRefObject<number>,
  amount = TYPING_IMPULSE_ADD,
) {
  impulseRef.current = Math.min(impulseRef.current + amount, TYPING_IMPULSE_CAP);
}

export function pulseParticleSubmitImpulse(impulseRef: MutableRefObject<number>) {
  pulseParticleTypingImpulse(impulseRef, SUBMIT_IMPULSE_PRIMARY);
  window.setTimeout(() => {
    pulseParticleTypingImpulse(impulseRef, SUBMIT_IMPULSE_SECONDARY);
  }, SUBMIT_IMPULSE_SECOND_MS);
}

export function bumpParticleTypingImpulse(
  impulseRef: MutableRefObject<number>,
  e: Pick<KeyboardEvent, "repeat" | "metaKey" | "ctrlKey" | "altKey" | "key">,
) {
  if (e.repeat) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === "Tab" || e.key === "Escape") return;
  pulseParticleTypingImpulse(impulseRef, TYPING_IMPULSE_ADD);
}

export function ParticleField({
  src,
  sampleStep = 3,
  threshold = 50,
  renderScale = 1,
  dotSize = 1.15,
  mouseForce = 90,
  mouseRadius = 110,
  spring = 0.035,
  damping = 0.86,
  className,
  align = "center",
  fit = "cover",
  color = "rgba(255, 255, 255, 0.92)",
  invert = false,
  adaptToTheme = true,
  typingImpulseRef,
  denseParticles = false,
}: ParticleFieldProps) {
  const isDark = useDocumentDark();
  const fillColorRef = useRef(color);
  fillColorRef.current = adaptToTheme
    ? isDark
      ? "rgba(255, 255, 255, 0.92)"
      : "rgba(10, 12, 16, 1)"
    : color;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef({ x: -9999, y: -9999, active: false });
  const srcRef = useRef(src);
  srcRef.current = src;
  const applySrcRef = useRef<((nextSrc: string) => void) | null>(null);

  const sampleStepRef = useRef(sampleStep);
  sampleStepRef.current = sampleStep;
  const thresholdRef = useRef(threshold);
  thresholdRef.current = threshold;
  const renderScaleRef = useRef(renderScale);
  renderScaleRef.current = renderScale;
  const dotSizeRef = useRef(dotSize);
  dotSizeRef.current = dotSize;
  const mouseForceRef = useRef(mouseForce);
  mouseForceRef.current = mouseForce;
  const mouseRadiusRef = useRef(mouseRadius);
  mouseRadiusRef.current = mouseRadius;
  const springRef = useRef(spring);
  springRef.current = spring;
  const dampingRef = useRef(damping);
  dampingRef.current = damping;
  const alignRef = useRef(align);
  alignRef.current = align;
  const fitRef = useRef(fit);
  fitRef.current = fit;
  const invertRef = useRef(invert);
  invertRef.current = invert;
  const denseParticlesRef = useRef(denseParticles);
  denseParticlesRef.current = denseParticles;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let particles: Particle[] = [];
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let clusterW = 0;
    let clusterH = 0;
    let offsetX = 0;
    let offsetY = 0;
    let rafId = 0;
    let time = 0;
    let destroyed = false;
    let resizeRaf = 0;
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    let currentImage: HTMLImageElement | null = null;
    let loadToken = 0;

    const ensureCanvasSize = () => {
      const rect = wrapper.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    const sampleTargets = (image: HTMLImageElement): ParticleTarget[] => {
      if (!image.width || !image.height) return [];

      const srcRatio = image.width / image.height;
      const dstRatio = width / height;

      let drawW = width;
      let drawH = height;
      const shouldCover = fitRef.current === "cover";
      if (srcRatio > dstRatio === shouldCover) {
        drawH = height;
        drawW = height * srcRatio;
      } else {
        drawW = width;
        drawH = width / srcRatio;
      }

      drawW *= renderScaleRef.current;
      drawH *= renderScaleRef.current;

      const sampleW = Math.max(80, Math.floor(drawW / sampleStepRef.current));
      const sampleH = Math.max(80, Math.floor(drawH / sampleStepRef.current));

      const offscreen = document.createElement("canvas");
      offscreen.width = sampleW;
      offscreen.height = sampleH;
      const offscreenCtx = offscreen.getContext("2d", { willReadFrequently: true });
      if (!offscreenCtx) return [];
      offscreenCtx.drawImage(image, 0, 0, sampleW, sampleH);

      let data: Uint8ClampedArray;
      try {
        data = offscreenCtx.getImageData(0, 0, sampleW, sampleH).data;
      } catch {
        return [];
      }

      const cellW = drawW / sampleW;
      const cellH = drawH / sampleH;

      clusterW = drawW;
      clusterH = drawH;
      offsetX = (width - clusterW) / 2;
      offsetY =
        alignRef.current === "bottom"
          ? height - clusterH - Math.min(40, height * 0.04)
          : (height - clusterH) / 2;

      const targets: ParticleTarget[] = [];
      for (let y = 0; y < sampleH; y++) {
        for (let x = 0; x < sampleW; x++) {
          const idx = (y * sampleW + x) * 4;
          const r = data[idx] ?? 0;
          const g = data[idx + 1] ?? 0;
          const b = data[idx + 2] ?? 0;
          const a = data[idx + 3] ?? 0;
          const rawBrightness = (r + g + b) / 3;
          const brightness = invertRef.current ? 255 - rawBrightness : rawBrightness;
          if (a < 200 || brightness < thresholdRef.current) continue;

          const lum = brightness / 255;
          if (!denseParticlesRef.current) {
            const keep =
              lum > 0.8
                ? true
                : lum > 0.5
                  ? Math.random() < 0.85
                  : lum > 0.25
                    ? Math.random() < 0.55
                    : Math.random() < 0.28;
            if (!keep) continue;
          }

          targets.push({
            ox: (offsetX + x * cellW + cellW / 2) * dpr,
            oy: (offsetY + y * cellH + cellH / 2) * dpr,
            size: (dotSizeRef.current + lum * 0.9) * dpr,
            alpha: 0.35 + lum * 0.6,
          });
        }
      }
      return targets;
    };

    const randomSpringJitter = () => 0.9 + Math.random() * 0.2;

    const buildFresh = (image: HTMLImageElement) => {
      if (!image.width || !image.height) return;
      ensureCanvasSize();
      const targets = sampleTargets(image);
      particles = targets.map((target) => ({
        ox: target.ox,
        oy: target.oy,
        x: target.ox + (Math.random() - 0.5) * 40,
        y: target.oy + (Math.random() - 0.5) * 40,
        vx: 0,
        vy: 0,
        size: target.size,
        alpha: target.alpha,
        phase: Math.random() * Math.PI * 2,
        springJitter: randomSpringJitter(),
        appear: 1,
        fading: false,
      }));
    };

    const shuffleIndices = (n: number): number[] => {
      const arr = Array.from({ length: n }, (_, i) => i);
      for (let i = n - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        const tmp = arr[i];
        arr[i] = arr[j]!;
        arr[j] = tmp!;
      }
      return arr;
    };

    const morphTo = (image: HTMLImageElement) => {
      if (!image.width || !image.height) return;
      if (particles.length === 0) {
        buildFresh(image);
        return;
      }
      ensureCanvasSize();
      const targets = sampleTargets(image);

      const particleOrder = shuffleIndices(particles.length);
      const targetOrder = shuffleIndices(targets.length);
      const matched = Math.min(particles.length, targets.length);

      for (let k = 0; k < matched; k++) {
        const particle = particles[particleOrder[k]!]!;
        const target = targets[targetOrder[k]!]!;
        particle.ox = target.ox;
        particle.oy = target.oy;
        particle.size = target.size;
        particle.alpha = target.alpha;
        particle.fading = false;
        particle.springJitter = randomSpringJitter();
      }

      for (let k = matched; k < particles.length; k++) {
        particles[particleOrder[k]!]!.fading = true;
      }

      for (let k = matched; k < targets.length; k++) {
        const target = targets[targetOrder[k]!]!;
        const angle = Math.random() * Math.PI * 2;
        const dist = (20 + Math.random() * 40) * dpr;
        particles.push({
          ox: target.ox,
          oy: target.oy,
          x: target.ox + Math.cos(angle) * dist,
          y: target.oy + Math.sin(angle) * dist,
          vx: 0,
          vy: 0,
          size: target.size,
          alpha: target.alpha,
          phase: Math.random() * Math.PI * 2,
          springJitter: randomSpringJitter(),
          appear: 0,
          fading: false,
        });
      }
    };

    const render = () => {
      if (destroyed) return;
      time += 0.016;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = fillColorRef.current;

      const px = pointerRef.current.x * dpr;
      const py = pointerRef.current.y * dpr;
      const mouseRadiusDpr = mouseRadiusRef.current * dpr;
      const mouseRadiusSquared = mouseRadiusDpr * mouseRadiusDpr;
      let typing = typingImpulseRef?.current ?? 0;
      if (typingImpulseRef && typing > 1e-4) typingImpulseRef.current *= 0.93;

      const typingBoost = 1 + typing * 10;
      const rippleCx = (offsetX + clusterW * 0.5) * dpr;
      const rippleCy = (offsetY + clusterH * 0.48) * dpr;
      let writeIdx = 0;

      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i]!;
        particle.vx += (particle.ox - particle.x) * springRef.current * particle.springJitter;
        particle.vy += (particle.oy - particle.y) * springRef.current * particle.springJitter;

        if (pointerRef.current.active) {
          const dx = particle.x - px;
          const dy = particle.y - py;
          const distanceSquared = dx * dx + dy * dy;
          if (distanceSquared < mouseRadiusSquared && distanceSquared > 0.0001) {
            const distance = Math.sqrt(distanceSquared);
            const force = (1 - distance / mouseRadiusDpr) * mouseForceRef.current;
            particle.vx += (dx / distance) * force * 0.04;
            particle.vy += (dy / distance) * force * 0.04;
          }
        }

        particle.vx += Math.sin(time * 0.8 + particle.phase) * 0.004 * typingBoost;
        particle.vy += Math.cos(time * 0.9 + particle.phase) * 0.002 * typingBoost;

        if (typing > 1e-4) {
          particle.vx += (Math.random() - 0.5) * typing * 2.8;
          particle.vy += (Math.random() - 0.5) * typing * 2.8;
          const rdx = particle.x - rippleCx;
          const rdy = particle.y - rippleCy;
          const rd = Math.sqrt(rdx * rdx + rdy * rdy) + 0.5;
          const ripple = (typing * 22 * dpr) / rd;
          particle.vx += (rdx / rd) * ripple * 0.018;
          particle.vy += (rdy / rd) * ripple * 0.018;
        }

        particle.vx *= dampingRef.current;
        particle.vy *= dampingRef.current;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.appear += ((particle.fading ? 0 : 1) - particle.appear) * 0.08;

        if (particle.fading && particle.appear < 0.02) continue;

        const twinkle =
          0.85 + Math.sin(time * (1.4 + typing * 2.2) + particle.phase) * (0.15 + typing * 0.35);
        ctx.globalAlpha = particle.alpha * particle.appear * twinkle;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        if (writeIdx !== i) particles[writeIdx] = particle;
        writeIdx++;
      }
      if (writeIdx !== particles.length) particles.length = writeIdx;
      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(render);
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = wrapper.getBoundingClientRect();
      pointerRef.current.x = e.clientX - rect.left;
      pointerRef.current.y = e.clientY - rect.top;
      pointerRef.current.active = true;
    };

    const onPointerLeave = () => {
      pointerRef.current.active = false;
      pointerRef.current.x = -9999;
      pointerRef.current.y = -9999;
    };

    const resizeObserver = new ResizeObserver(() => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          if (currentImage) buildFresh(currentImage);
        }, 120);
      });
    });

    const loadAndApply = (nextSrc: string, asMorph: boolean) => {
      const token = ++loadToken;
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.decoding = "async";
      image.onload = () => {
        if (destroyed || token !== loadToken) return;
        currentImage = image;
        if (asMorph) morphTo(image);
        else buildFresh(image);
      };
      image.src = nextSrc;
    };

    applySrcRef.current = (nextSrc: string) => loadAndApply(nextSrc, true);
    resizeObserver.observe(wrapper);
    rafId = requestAnimationFrame(render);
    loadAndApply(srcRef.current, false);
    wrapper.addEventListener("pointermove", onPointerMove);
    wrapper.addEventListener("pointerleave", onPointerLeave);

    return () => {
      destroyed = true;
      cancelAnimationFrame(rafId);
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeObserver.disconnect();
      wrapper.removeEventListener("pointermove", onPointerMove);
      wrapper.removeEventListener("pointerleave", onPointerLeave);
      applySrcRef.current = null;
    };
  }, []);

  const lastAppliedSrcRef = useRef(src);
  useEffect(() => {
    if (lastAppliedSrcRef.current === src) return;
    lastAppliedSrcRef.current = src;
    applySrcRef.current?.(src);
  }, [src]);

  return (
    <div
      data-slot="particle-field"
      ref={wrapperRef}
      className={className}
      style={{ width: "100%", height: "100%" }}
    >
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
}
