import React, { useRef, useEffect } from "react";

interface ParticleImageProps {
  path: string;
  width?: number;
  height?: number;
  particleSize?: number;
  numParticles?: number | null;
}

interface Particle {
  x: number;
  y: number;
  color: string;
  size: number;
  baseX: number;
  baseY: number;
  density: number;
  positionGridRow: number;
  positionGridCol: number;
  calculateGridPosition: () => void;
  draw: () => void;
  update: () => void;
}

class GridCell {
  particles: Set<Particle>;

  constructor() {
    this.particles = new Set<Particle>();
  }

  addParticle(particle: Particle) {
    this.particles.add(particle);
  }

  removeParticle(particle: Particle) {
    this.particles.delete(particle);
  }
}

const ParticleImage: React.FC<ParticleImageProps> = ({
  path,
  width = 200,
  height = 200,
  particleSize = 2,
  numParticles = null,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    const mouseRadius = (width + height) / 12;
    const maxDistanceSquared = mouseRadius * mouseRadius;
    const positionGridRows = Math.ceil(height / mouseRadius);
    const positionGridCols = Math.ceil(width / mouseRadius);
    const positionGrid: GridCell[][] = Array.from(
      { length: positionGridRows },
      () => Array.from({ length: positionGridCols }, () => new GridCell())
    );

    let mouseMoved = false;
    let mouse = {
      x: null as number | null,
      y: null as number | null,
      radius: mouseRadius,
    };

    window.addEventListener("mousemove", (event) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = event.clientX - rect.left;
      mouse.y = event.clientY - rect.top;
      mouseMoved = true;
    });

    class Particle {
      x: number;
      y: number;
      color: string;
      size: number;
      baseX: number;
      baseY: number;
      density: number;
      positionGridRow: number;
      positionGridCol: number;

      constructor(x: number, y: number, color: string, size: number) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.baseX = x;
        this.baseY = y;
        this.density = Math.random() * 30 + 1;
        this.positionGridRow = Math.floor(y / mouseRadius);
        this.positionGridCol = Math.floor(x / mouseRadius);
        positionGrid[this.positionGridRow][this.positionGridCol].addParticle(
          this
        );
      }

      draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      }

      calculateGridPosition() {
        const newRow = Math.floor(this.y / mouseRadius);
        const newCol = Math.floor(this.x / mouseRadius);
        if (
          newRow !== this.positionGridRow ||
          newCol !== this.positionGridCol
        ) {
          positionGrid[this.positionGridRow][
            this.positionGridCol
          ].removeParticle(this);
          if (
            newRow >= 0 &&
            newRow < positionGridRows &&
            newCol >= 0 &&
            newCol < positionGridCols
          ) {
            positionGrid[newRow][newCol].addParticle(this);
            this.positionGridRow = newRow;
            this.positionGridCol = newCol;
          }
        }
      }

      update() {
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distanceSquared = dx * dx + dy * dy;
          if (distanceSquared < maxDistanceSquared) {
            const forceDirectionX = dx / mouseRadius;
            const forceDirectionY = dy / mouseRadius;
            const force =
              (maxDistanceSquared - distanceSquared) / maxDistanceSquared;
            const directionX = forceDirectionX * force * this.density;
            const directionY = forceDirectionY * force * this.density;

            this.x -= directionX;
            this.y -= directionY;
          }
        }
        this.calculateGridPosition();
      }
    }

    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };

    const drawImage = (image: HTMLImageElement) => {
      ctx.drawImage(image, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      createParticles(imageData);
    };

    const createParticles = (imageData: ImageData) => {
      const { width, height, data } = imageData;
      const particles: Particle[] = [];

      for (let y = 0; y < height; y += particleSize) {
        for (let x = 0; x < width; x += particleSize) {
          const i = (y * width + x) * 4;
          if (data[i + 3] > 128) {
            // Alpha value is significant
            const color = `rgba(${data[i]}, ${data[i + 1]}, ${data[i + 2]}, ${
              data[i + 3] / 255
            })`;
            particles.push(new Particle(x, y, color, particleSize));
          }
        }
      }
    };

    loadImage(path).then(drawImage);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [path, width, height, numParticles, particleSize]);

  return <canvas ref={canvasRef}></canvas>;
};

export default ParticleImage;
