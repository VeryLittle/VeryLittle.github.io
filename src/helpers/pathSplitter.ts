// @ts-ignore
import Snap from 'snapsvg-cjs';

type Command = [string, number, number];
type Point = [number, number];

export const splitPath = (pathData: string) => {
  function pathToAbsoluteSubPaths(pathString: string) {
    // @ts-ignore
    const pathCommands: Command[] = Snap.parsePathString(pathString);
    let endPoint: Point = [0, 0];
    const subPaths = [];
    let command = [] as unknown as Command;
    let i = 0;

    while (i < pathCommands.length) {
      command = pathCommands[i];
      endPoint = getNextEndPoint(endPoint, command);
      if (command[0] === 'm') {
        command = ['M', endPoint[0], endPoint[1]];
      }
      const subPath = [command.join(' ')];

      i++;

      while (!endSubPath(pathCommands, i)) {
        command = pathCommands[i];
        subPath.push(command.join(' '));
        endPoint = getNextEndPoint(endPoint, command);
        i++;
      }

      subPaths.push(subPath.join(' '));
    }

    return subPaths;
  }

  function getNextEndPoint(endPoint: Point, command: Command): Point {
    let x = endPoint[0];
    let y = endPoint[1];
    if (isRelative(command)) {
      switch (command[0]) {
        case 'h':
          x += command[1];
          break;
        case 'v':
          y += command[1];
          break;
        case 'z': {
          x = 0;
          y = 0;
          break;
        }
        default: {
          // @ts-ignore
          x += command[command.length - 2];
          // @ts-ignore
          y += command[command.length - 1];
        }
      }
    } else {
      switch (command[0]) {
        case 'H':
          x = command[1];
          break;
        case 'V':
          y = command[1];
          break;
        case 'Z': {
          x = 0;
          y = 0;
          break;
        }
        default: {
          // @ts-ignore
          x = command[command.length - 2];
          // @ts-ignore
          y = command[command.length - 1];
        }
      }
    }
    return [x, y];
  }

  function isRelative(command: Command) {
    return command[0] === command[0].toLowerCase();
  }

  function endSubPath(commands: Command[], index: number) {
    if (index >= commands.length) {
      return true;
    }
    return commands[index][0].toLowerCase() === 'm';
  }

  return pathToAbsoluteSubPaths(pathData);
};
