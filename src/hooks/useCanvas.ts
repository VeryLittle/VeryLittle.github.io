import { useMemo, useRef } from 'react';
import patternUrl from '../../public/pattern.png';

type Point = {
  x: number;
  y: number;
};

type Triangle = {
  a: Point;
  b: Point;
  c: Point;
};

export const useCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const patternImg = useMemo(() => {
    const img = document.createElement('img');
    img.src = patternUrl;
    return img;
  }, []);

  return useMemo(() => {
    return {
      ref: canvasRef,
      setSize: (width: number, height: number) => {
        if (!canvasRef.current) return;
        canvasRef.current.width = width;
        canvasRef.current.height = height;
      },
      setColor: (color: string) => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        if (!(canvas && context)) return;
        context.strokeStyle = color;
      },
      clear: () => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        if (!(canvas && context)) return;
        context.clearRect(0, 0, canvas.width, canvas.height);
      },
      drawLine: (a: Point, b: Point) => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        if (!(canvas && context)) return;

        context.beginPath();
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.stroke();
      },
      drawTriangle: (triangle: Triangle) => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        if (!(canvas && context)) return;

        context.beginPath();
        context.moveTo(triangle.a.x, triangle.a.y);
        context.lineTo(triangle.b.x, triangle.b.y);
        context.lineTo(triangle.c.x, triangle.c.y);
        context.closePath();
        context.stroke();
      },
      drawPath: (path: SVGPathElement) => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        if (!(canvas && context)) return;

        const xml = `<svg fill="none" xmlns="http://www.w3.org/2000/svg">${new XMLSerializer().serializeToString(path)}</svg>`;
        const image64 = `data:image/svg+xml;base64,${btoa(xml)}`;
        const img = document.createElement('img');
        img.onload = () => {
          context.drawImage(img, 0, 0);
        };
        img.src = image64;
      },
      drawPattern: (triangles: Triangle[]) => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        if (!(canvas && context)) return;

        context.beginPath();
        triangles.forEach((triangle) => {
          context.moveTo(triangle.a.x, triangle.a.y);
          context.lineTo(triangle.b.x, triangle.b.y);
          context.lineTo(triangle.c.x, triangle.c.y);
          context.lineTo(triangle.a.x, triangle.a.y);
        });
        context.closePath();
        context.save();
        context.clip();

        const pattern = context.createPattern(patternImg, 'repeat');
        context.fillStyle = pattern || 'green';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.restore();
      },
    };
  }, [patternImg]);
};
