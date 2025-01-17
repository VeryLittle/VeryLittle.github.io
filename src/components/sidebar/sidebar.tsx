import { useStore } from '@/components/store/store';
import { Logo } from './components/logo';
import { Slider } from '../ui/slider';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scrollArea';
import { ArrowDownToLine, Blend, LucideEye, LucideEyeOff } from 'lucide-react';
import { Button } from '../ui/button';

import { Multiselect } from '../ui/multiselect';
import { formatCode } from '@/lib/prettier';
import { saveFile } from '@/lib/utils';
import { path as snapPath } from 'snapsvg-cjs';

export const Sidebar = () => {
  const { file, smoothing, setSmoothing, maxPoints, setMaxPoints, paths, configs, triangles, updateConfig } =
    useStore();

  return (
    <div className="w-52">
      {file ? (
        <div className="h-full flex flex-col gap-6">
          <div className="flex gap-1 items-center font-semibold text-lg">
            <Logo />
            <div>Mesh generator</div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-4">
              <Label>Smoothing</Label>
              <div className="text-sm text-muted-foreground">{smoothing}</div>
            </div>
            <Slider
              value={[smoothing]}
              onValueChange={(value) => setSmoothing(value[0])}
              min={0}
              max={3}
              step={0.05}
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-4">
              <Label>Points per 1k pixels</Label>
              <div className="text-sm text-muted-foreground">{maxPoints}</div>
            </div>
            <Slider
              value={[maxPoints]}
              onValueChange={(value) => setMaxPoints(value[0])}
              min={10}
              max={2000}
              step={10}
            />
          </div>
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <Label>Svg paths</Label>
              <div className="text-sm text-muted-foreground">{paths.length}</div>
            </div>
            <div className="relative flex-1 -mr-4">
              <div className="absolute h-full w-full">
                <ScrollArea className="absolute h-full">
                  <div className="flex flex-col gap-2 mr-4">
                    {paths.map((path, index) => {
                      return (
                        <div key={path} className="text-muted-foreground flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              title={configs[path].selected ? 'Hide' : 'Show'}
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                updateConfig(path, {
                                  ...configs[path],
                                  selected: !configs[path].selected,
                                });
                              }}
                            >
                              {configs[path].selected ? <LucideEye size={20} /> : <LucideEyeOff size={20} />}
                            </Button>
                            <div
                              className="rounded-full border w-4 h-4"
                              style={{ background: configs[path].color }}
                            />
                            <div className="text-sm flex">
                              Path: {index + 1} ({triangles[path].length})
                            </div>
                          </div>
                          <div className="flex gap-2 items-center">
                            <Multiselect
                              options={paths
                                .map((path, index) => ({
                                  value: path,
                                  label: `Path: ${index + 1}`,
                                }))
                                .filter(({ value }) => value !== path)}
                              value={configs[path].excluded.map((path) => ({
                                value: path,
                                label: `Path: ${paths.findIndex((p) => p === path) + 1}`,
                              }))}
                              getLabel={({ label }) => label}
                              getValue={({ value }) => value}
                              onChange={(value) =>
                                updateConfig(path, {
                                  ...configs[path],
                                  excluded: value.map((option) => option.value),
                                })
                              }
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="flex"
                                title="Exclude paths from the current path"
                              >
                                <Blend size={16} />
                              </Button>
                            </Multiselect>

                            <Button
                              title="Download config file"
                              variant="ghost"
                              size="icon"
                              onClick={async () => {
                                const { x, y, width, height } = snapPath.getBBox(path);
                                const code = await formatCode(`
                                  export default {
                                    low: ${JSON.stringify([
                                      [
                                        [x, y],
                                        [x + width, y],
                                        [x + width, y + height],
                                      ],
                                      [
                                        [x, y],
                                        [x, y + height],
                                        [x + width, y + height],
                                      ],
                                    ])},
                                    high: ${JSON.stringify(
                                      triangles[path].map((t) => [
                                        [t.a.x, t.a.y],
                                        [t.b.x, t.b.y],
                                        [t.c.x, t.c.y],
                                      ]),
                                    )}
                                  }
                                `);
                                saveFile(code, `Path ${index + 1}`);
                              }}
                            >
                              <ArrowDownToLine size={16} />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-1 items-center font-semibold text-lg">
            <Logo />
            <div>Mesh generator</div>
          </div>
          <div className="text-muted-foreground text-sm mt-4 flex flex-col gap-2">
            <p>An application for creating polygonal meshes from SVG files.</p>
            <p>It supports mesh density adjustment, geometry optimization, and export.</p>
            <p>The interface includes preview, zoom, and pan functionality.</p>
          </div>
        </>
      )}
    </div>
  );
};
