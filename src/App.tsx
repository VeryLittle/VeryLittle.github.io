import { useState, useEffect, useCallback } from 'react';
import { SvgUploader } from './components/SvgUploader';
import { Button, Checkbox, ColorPicker, Dropdown, Form, Switch, Tooltip } from 'antd';
import { CheckOutlined, CopyOutlined, SwitcherOutlined } from '@ant-design/icons';
import { Header } from './components/Header';
import lodash from 'lodash';
import { filterRow, generatePointsFromPath, generateTriangleMesh, type Point, type Triangle } from './utils';
import { IntegerStep } from './components/IntegerStep';
import { DecimalStep } from './components/DecimalStep';
import { useCanvas } from './hooks/useCanvas';
import { type PathConfig, usePaths } from './hooks/usePaths';
import { getElementSize } from './helpers/common';

// function inside(point: [number, number], vs: [number, number][]) {
//   const x = point[0];
//   const y = point[1];

//   let inside = false;
//   for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
//     const xi = vs[i][0];
//     const yi = vs[i][1];
//     const xj = vs[j][0];
//     const yj = vs[j][1];

//     const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
//     if (intersect) inside = !inside;
//   }

//   return inside;
// }

const hit = (x: number, y: number, points: number[][]) => {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) {
      inside = !inside;
    }
  }
  return inside;
};

function App() {
  const pathCanvas = useCanvas();
  const meshCanvas = useCanvas();

  const [svgElement, setSvgElement] = useState<SVGElement>(
    document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
  );
  const { paths, configs, updateConfig } = usePaths({ svgElement });

  const [maxPoints, setMaxPoints] = useState(100);
  const [smoothing, setSmoothing] = useState(0.5);
  const [onlyBorders, setOnlyBorders] = useState(false);

  const [points, setPoints] = useState<Point[][]>([]);
  const [triangles, setTriangles] = useState<Triangle[][]>([]);

  const handleNewSvg = (svgElement: SVGElement | null) => {
    svgElement && setSvgElement(svgElement);
    let rect = { width: 100, height: 100 };

    if (svgElement) {
      rect = getElementSize(svgElement);
    }

    pathCanvas.setSize(rect.width, rect.height);
    meshCanvas.setSize(rect.width, rect.height);
  };

  const drawPath = useCallback(
    lodash.throttle((configs: PathConfig[]) => {
      pathCanvas.clear();
      configs.map((path) => {
        if (path.selected) {
          [...path.excluded, path.element].forEach((el) => pathCanvas.drawPath(el));
        }
      });
    }, 300),
    [],
  );

  useEffect(() => {
    drawPath(configs);
  }, [configs, drawPath]);

  useEffect(() => {
    meshCanvas.clear();
    configs.forEach((path, pathIndex) => {
      if (!path.selected) return;

      meshCanvas.setColor(path.color);

      points[pathIndex]?.forEach((_, pointIndex, array) => {
        meshCanvas.drawLine(array[pointIndex], array[pointIndex + 1] || array[0]);
      });

      if (onlyBorders) {
        meshCanvas.drawPattern(triangles[pathIndex] || []);
      } else {
        triangles[pathIndex]?.forEach((triangle) => meshCanvas.drawTriangle(triangle));
      }
    });
  }, [triangles, points, onlyBorders, meshCanvas, configs]);

  useEffect(() => {
    try {
      const newPoints = new Map(
        configs.map((path) => [
          path.element,
          filterRow(generatePointsFromPath(path.bezier, maxPoints), smoothing),
        ]),
      );
      setPoints([...newPoints.values()]);
      setTriangles(
        configs.map((path) =>
          generateTriangleMesh(
            newPoints.get(path.element) || [],
            // @ts-ignore
            path.excluded
              .map((ex) => newPoints.get(ex))
              .filter(Boolean),
          ),
        ),
      );
    } catch {}
  }, [maxPoints, smoothing, configs]);

  return (
    <>
      <div className="h-full flex flex-col">
        <Header />
        <div className="flex grow gap-4">
          <div className="grow">
            <div className="overflow-scroll h-full relative">
              <canvas
                ref={pathCanvas.ref}
                width="100"
                height="100"
                className="absolute"
                style={{ opacity: 1 }}
              />
              <canvas
                ref={meshCanvas.ref}
                width="100"
                height="100"
                className="absolute"
                onMouseLeave={() => {
                  document.body.classList.remove('cursor-pointer');
                }}
                onMouseMove={lodash.throttle((e) => {
                  const rect = e.target.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;

                  // const hovered = points.findIndex((p) =>
                  //   inside(
                  //     [x, y],
                  //     p.map((p) => [p.x, p.y]),
                  //   ),
                  // );

                  const hovered = triangles.find((trianglesByPath, index) => {
                    if (!configs[index].selected) return false;
                    return trianglesByPath.find((triangle) =>
                      hit(x, y, [
                        [triangle.a.x, triangle.a.y],
                        [triangle.b.x, triangle.b.y],
                        [triangle.c.x, triangle.c.y],
                      ]),
                    );
                  });

                  if (hovered) {
                    document.body.classList.add('cursor-pointer');
                  } else {
                    document.body.classList.remove('cursor-pointer');
                  }
                }, 30)}
              />
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

            <Checkbox.Group className="flex flex-col gap-2 mt-6">
              {configs.map((pathConfig, index) => (
                <div key={pathConfig.id} className="flex items-center gap-2 justify-between">
                  <Checkbox
                    skipGroup
                    checked={pathConfig.selected}
                    onChange={() => updateConfig({ ...pathConfig, selected: !pathConfig.selected })}
                  >
                    <div className="flex items-center">
                      <span>
                        Path: {index + 1} ({points[index]?.length || '-'}, {triangles[index]?.length || '-'})
                      </span>
                    </div>
                  </Checkbox>
                  <div className="flex items-center gap-2">
                    <Tooltip title="Copy triangles to clipboard">
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => {
                          navigator.clipboard.writeText(
                            JSON.stringify(
                              triangles[index].map((t) => [
                                [t.a.x, t.a.y],
                                [t.b.x, t.b.y],
                                [t.c.x, t.c.y],
                              ]),
                            ),
                            // JSON.stringify(points[index].flatMap((t) => [+t.x.toFixed(), +t.y.toFixed()])),
                          );
                        }}
                      />
                    </Tooltip>
                    <ColorPicker
                      size="small"
                      value={pathConfig.color}
                      onChange={(newColor) => updateConfig({ ...pathConfig, color: newColor.toHexString() })}
                    />
                    <Dropdown
                      menu={{
                        items: configs.map((menuPathConfig, menuKey) => {
                          return {
                            key: menuKey,
                            label: (
                              <div className="flex justify-between w-28">
                                <span>Path: {menuKey + 1}</span>
                                {pathConfig.excluded.includes(menuPathConfig.element) ? (
                                  <CheckOutlined />
                                ) : (
                                  <div />
                                )}
                              </div>
                            ),
                            type: 'item',
                            disabled: menuPathConfig.id === pathConfig.id,
                            onClick: () => {
                              if (pathConfig.excluded.includes(menuPathConfig.element)) {
                                updateConfig({
                                  ...pathConfig,
                                  excluded: pathConfig.excluded.filter((p) => p !== menuPathConfig.element),
                                });
                              } else {
                                updateConfig({
                                  ...pathConfig,
                                  excluded: [...pathConfig.excluded, menuPathConfig.element],
                                });
                              }
                            },
                          };
                        }),
                      }}
                    >
                      <Button size="small" icon={<SwitcherOutlined />} />
                    </Dropdown>
                  </div>
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
