import { useStore } from '@/components/store/store';
import { Logo } from './components/logo';
import { Slider } from '../ui/slider';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scrollArea';
import { LucideCopy, LucideEye, LucideEyeClosed, LucideEyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { toast } from 'sonner';

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
              max={1000}
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
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                updateConfig(path, { ...configs[path], selected: !configs[path].selected });
                              }}
                            >
                              {configs[path].selected ? <LucideEye size={20} /> : <LucideEyeOff size={20} />}
                            </Button>

                            <div
                              className="rounded-full border w-4 h-4"
                              style={{ background: configs[path].color }}
                            />
                            <div className="text-sm">
                              Path: {index + 1} ({triangles[path].length})
                            </div>
                          </div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    toast(`Path ${index + 1} was copied to clipboard`, {
                                      icon: <LucideCopy size={14} />,
                                    });
                                    navigator.clipboard.writeText(
                                      JSON.stringify(
                                        triangles[path].map((t) => [
                                          [t.a.x, t.a.y],
                                          [t.b.x, t.b.y],
                                          [t.c.x, t.c.y],
                                        ]),
                                      ),
                                    );
                                  }}
                                >
                                  <LucideCopy size={16} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copy triangles to clipboard</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
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
          <div className="text-muted-foreground text-sm mt-4">
            Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been
            the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of
            type and scrambled it to make a type specimen book. It has survived not only five centuries, but
            also the leap into electronic typesetting, remaining essentially unchanged.
          </div>
        </>
      )}
    </div>
  );
};
