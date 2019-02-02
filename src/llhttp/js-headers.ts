import * as constants from './constants';
import { enumToMap, IEnumMap } from './utils';

type Encoding = 'none' | 'hex';

export class JSHeaders {
  public build(): string {
    let res = '';

    res += 'module.exports = (binding) => {\n';

    res += this.buildEnum('ERROR', enumToMap(constants.ERROR));
    res += this.buildEnum('METHODS', enumToMap(constants.METHODS));
    res += this.buildEnum('FLAGS', enumToMap(constants.FLAGS), 'hex');
    res += this.buildEnum('TYPE', enumToMap(constants.TYPE));
    res += this.buildEnum('FINISH', enumToMap(constants.FINISH));

    res += '};\n';

    return res;
  }

  private buildEnum(name: string, map: IEnumMap,
                    encoding: Encoding = 'none'): string {
    let res = '';

    res += `  binding.${name} = {\n`;
    const keys = Object.keys(map);
    for (const [ i, key ] of keys.entries()) {
      const isLast = i === keys.length - 1;

      let value: number | string = map[key];

      if (encoding === 'hex') {
        value = `0x${value.toString(16)}`;
      }

      res += `    ${key.replace(/-/g, '')}: ${value}`;
      if (!isLast) {
        res += ',\n';
      }
    }
    res += '\n  };\n';

    return res;
  }
}
