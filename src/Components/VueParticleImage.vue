<template>
  <canvas ref="canvasRef" :width="width" :height="height"></canvas>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  ref,
  watch,
  onUnmounted,
  nextTick,
} from "vue";

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
  draw: (ctx: CanvasRenderingContext2D) => void;
  update: (
    mouse: MousePosition,
    maxDistanceSquared: number,
    mouseRadius: number
  ) => void;
}

interface MousePosition {
  x: number | null;
  y: number | null;
  radius: number;
}

class GridCell {
  particles: Set<Particle> = new Set();

  addParticle(particle: Particle) {
    this.particles.add(particle);
  }

  removeParticle(particle: Particle) {
    this.particles.delete(particle);
  }
}

export default defineComponent({
  props: {
    path: String,
    width: { type: Number, default: 200 },
    height: { type: Number, default: 200 },
    particleSize: { type: Number, default: 2 },
    numParticles: Number,
  },
  setup(props) {
    const canvasRef = ref<HTMLCanvasElement | null>(null);

    const createParticle = (
      x: number,
      y: number,
      color: string,
      size: number
    ): Particle => {
      return {
        x,
        y,
        color,
        size,
        baseX: x,
        baseY: y,
        density: Math.random() * 30 + 1,
        positionGridRow: Math.floor(y / (props.width + props.height) / 12),
        positionGridCol: Math.floor(x / (props.width + props.height) / 12),
        draw(ctx: CanvasRenderingContext2D) {
          ctx.fillStyle = this.color;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.closePath();
          ctx.fill();
        },
        update(
          mouse: MousePosition,
          maxDistanceSquared: number,
          mouseRadius: number
        ) {
          if (mouse.x && mouse.y) {
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
        },
      };
    };

    const initCanvas = async () => {
      const canvas = canvasRef.value;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const mouseRadius = (props.width + props.height) / 12;
      const maxDistanceSquared = mouseRadius * mouseRadius;

      const mouse: MousePosition = {
        x: null,
        y: null,
        radius: mouseRadius,
      };

      window.addEventListener("mousemove", (event) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = event.clientX - rect.left;
        mouse.y = event.clientY - rect.top;
      });

      const image = await loadImage(props.path);
      ctx.drawImage(image, 0, 0, props.width, props.height);
      const imageData = ctx.getImageData(0, 0, props.width, props.height);

      const particles: Particle[] = [];

      for (let y = 0; y < props.height; y += props.particleSize) {
        for (let x = 0; x < props.width; x += props.particleSize) {
          const i = y * 4 * props.width + x * 4;
          if (imageData.data[i + 3] > 128) {
            const color = `rgba(${imageData.data[i]}, ${
              imageData.data[i + 1]
            }, ${imageData.data[i + 2]}, ${imageData.data[i + 3] / 255})`;
            const particle = createParticle(x, y, color, props.particleSize);
            particles.push(particle);
          }
        }
      }

      const animate = () => {
        ctx.clearRect(0, 0, props.width, props.height);
        particles.forEach((particle) => {
          particle.draw(ctx);
          particle.update(mouse, maxDistanceSquared, mouseRadius);
        });
        requestAnimationFrame(animate);
      };

      animate();
    };

    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };

    onMounted(() => {
      nextTick(() => {
        initCanvas();
      });
    });

    onUnmounted(() => {
      window.removeEventListener("mousemove", updateMousePosition);
    });

    return {
      canvasRef,
    };
  },
});
</script>
