type Point = {
  x: number;
  y: number;
};

type Triangle = {
  a: Point;
  b: Point;
  c: Point;
};

export default (canvas: HTMLCanvasElement | null) => {
  return {
    setScale(value: number) {
      const context = canvas?.getContext('2d');
      if (!(canvas && context)) return;
      context.scale(value / 100, value / 100);
    },
    setSize(width: number, height: number) {
      if (!canvas) return;
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    },
    fitSize() {
      if (!canvas) return;
      const { width, height } = canvas.parentElement?.getBoundingClientRect() || { width: 0, height: 0 };
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    },
    setColor(color: string) {
      const context = canvas?.getContext('2d');
      if (!(canvas && context)) return;
      context.strokeStyle = color;
    },
    drawTriangle(triangle: Triangle) {
      const context = canvas?.getContext('2d');
      if (!(canvas && context)) return;

      context.beginPath();
      context.moveTo(triangle.a.x, triangle.a.y);
      context.lineTo(triangle.b.x, triangle.b.y);
      context.lineTo(triangle.c.x, triangle.c.y);
      context.closePath();
      context.stroke();
    },
    drawPaths(paths: string[]) {
      const context = canvas?.getContext('2d');
      if (!(canvas && context)) return;

      paths.forEach((path) => {
        context.stroke(new Path2D(path));
      });
    },
    clear() {
      const context = canvas?.getContext('2d');
      if (!(canvas && context)) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
};
