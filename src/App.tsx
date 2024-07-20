import { useState, useEffect, useRef, useCallback } from 'react';
import { SvgUploader } from './components/SvgUploader';
import { Button, Checkbox, ColorPicker, Form, Switch, Tooltip } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { Header } from './components/Header';
import lodash from 'lodash';
import {
  filterRow,
  generatePointsFromPath,
  generateTriangleMesh,
  getPaths,
  type Point,
  type Triangle,
} from './utils';
import { IntegerStep } from './components/IntegerStep';
import { DecimalStep } from './components/DecimalStep';

const renderPath = (context: CanvasRenderingContext2D, path: SVGPathElement) => {
  const xml = `<svg fill="none" xmlns="http://www.w3.org/2000/svg">${new XMLSerializer().serializeToString(path)}</svg>`;
  const image64 = `data:image/svg+xml;base64,${btoa(xml)}`;
  const img = document.createElement('img');
  img.onload = () => {
    context.drawImage(img, 0, 0);
  };
  img.src = image64;
};

export const drawTriangle = (ctx: CanvasRenderingContext2D, triangle: Triangle, color: string) => {
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(triangle.x1, triangle.y1);
  ctx.lineTo(triangle.x2, triangle.y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(triangle.x2, triangle.y2);
  ctx.lineTo(triangle.x3, triangle.y3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(triangle.x3, triangle.y3);
  ctx.lineTo(triangle.x1, triangle.y1);
  ctx.stroke();
};

export const drawLine = (ctx: CanvasRenderingContext2D, p1: Point, p2: Point, color: string) => {
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
};

function App() {
  const pathCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const meshCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [paths, setPaths] = useState<SVGPathElement[]>([]);
  const [selectedPathIndexes, setSelectedPathIndexes] = useState<number[]>([]);
  const [colors, setColors] = useState<string[]>([]);

  const [maxPoints, setMaxPoints] = useState(100);
  const [smoothing, setSmoothing] = useState(0.5);
  const [onlyBorders, setOnlyBorders] = useState(false);

  const [points, setPoints] = useState<Point[][]>([]);
  const [triangles, setTriangles] = useState<Triangle[][]>([]);

  const handleNewSvg = (svgElement: SVGElement | null) => {
    const pathCanvas = pathCanvasRef.current;
    const meshCanvas = meshCanvasRef.current;

    const context = pathCanvas?.getContext('2d');
    if (!(meshCanvas && pathCanvas && context)) return;

    let rect = { width: 100, height: 100 };

    if (svgElement) {
      svgElement.style.left = '-9999';
      svgElement.style.position = 'absolute';
      document.body.append(svgElement);
      rect = svgElement.getBoundingClientRect();
      document.body.removeChild(svgElement);
    }

    pathCanvas.width = meshCanvas.width = rect.width;
    pathCanvas.height = meshCanvas.height = rect.height;
    context.clearRect(0, 0, pathCanvas.width, pathCanvas.height);

    const paths = svgElement ? getPaths(svgElement) : [];
    setPaths(paths);
    setSelectedPathIndexes(paths.map((_, index) => index));
    setColors(paths.map(() => `#${Math.floor(Math.random() * 16777215).toString(16)}`));
  };

  useEffect(() => {
    const canvas = pathCanvasRef.current;
    const context = canvas?.getContext('2d');
    if (!(canvas && context)) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    selectedPathIndexes.forEach((index) => renderPath(context, paths[index]));
  }, [selectedPathIndexes, paths]);

  useEffect(() => {
    const canvas = meshCanvasRef.current;
    const context = canvas?.getContext('2d');
    if (!(canvas && context)) return;
    context.clearRect(0, 0, canvas.width, canvas.height);

    if (onlyBorders) {
      selectedPathIndexes.forEach((pathIndex) => {
        points[pathIndex]?.forEach((_, pointIndex, array) => {
          drawLine(context, array[pointIndex], array[pointIndex + 1] || array[0], colors[pathIndex]);
        });
      });
    } else {
      selectedPathIndexes.forEach((index) => {
        triangles[index]?.forEach((triangle) => drawTriangle(context, triangle, colors[index]));
      });
    }
  }, [triangles, points, onlyBorders, selectedPathIndexes, colors]);

  const recalculate = useCallback(
    lodash.debounce((maxPoints: number, smoothing: number, paths: SVGPathElement[]) => {
      const newPoints = paths.map((path) => filterRow(generatePointsFromPath(path, maxPoints), smoothing));
      setPoints(newPoints);
      setTriangles(newPoints.map((points) => generateTriangleMesh(points)));
    }, 200),
    [],
  );

  useEffect(() => recalculate(maxPoints, smoothing, paths), [maxPoints, smoothing, paths, recalculate]);

  return (
    <>
      <div className="h-full flex flex-col">
        <Header />
        <div className="flex grow gap-4">
          <div className="grow">
            <div className="overflow-scroll h-full relative">
              <canvas ref={pathCanvasRef} width="100" height="100" className="absolute" />
              <canvas ref={meshCanvasRef} width="100" height="100" className="absolute" />
            </div>
          </div>
          <div className="w-64 pr-4">
            <div className="h-16 mb-4">
              <SvgUploader onChange={handleNewSvg} />
            </div>

            <Form layout="vertical">
              <Form.Item label="Points per 1k pixels">
                <IntegerStep min={4} max={1000} value={maxPoints} onChange={setMaxPoints} />
              </Form.Item>
              <Form.Item label="Smoothing">
                <DecimalStep min={0} max={3} step={0.05} value={smoothing} onChange={setSmoothing} />
              </Form.Item>
              <Form.Item label="Render type">
                <Switch
                  checkedChildren="L"
                  unCheckedChildren="T"
                  value={onlyBorders}
                  onChange={setOnlyBorders}
                />
              </Form.Item>
            </Form>

            <Checkbox.Group
              onChange={setSelectedPathIndexes}
              value={selectedPathIndexes}
              className="flex flex-col gap-2 mt-6"
            >
              {paths.map((_, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                <div key={index} className="flex items-center gap-2">
                  <Checkbox value={index}>
                    <div className="flex items-center gap-2">
                      <span>
                        Path: {index + 1} ({triangles[index]?.length || '-'})
                      </span>
                      <Tooltip title="Copy triangles to clipboard">
                        <Button
                          size="small"
                          icon={<CopyOutlined />}
                          onClick={() => {
                            navigator.clipboard.writeText(
                              JSON.stringify(
                                triangles[index].map((t) => [
                                  [t.x1, t.y1],
                                  [t.x2, t.y2],
                                  [t.x3, t.y3],
                                ]),
                              ),
                            );
                          }}
                        />
                      </Tooltip>
                    </div>
                  </Checkbox>
                  <ColorPicker
                    size="small"
                    value={colors[index]}
                    onChange={(newColor) =>
                      setColors([
                        ...colors.slice(0, index),
                        newColor.toHexString(),
                        ...colors.slice(index + 1),
                      ])
                    }
                  />
                </div>
              ))}
            </Checkbox.Group>
            {/* 
            <div>Scale</div>
            <br />
            <div>Какой-то плейсходер</div> */}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
