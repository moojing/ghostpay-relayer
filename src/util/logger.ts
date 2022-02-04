import configDefaults from '../server/config/config-defaults';
import { DebugLevel } from '../models/debug-models';

const hasDebugLevel = (debugLevels: DebugLevel[]): boolean => {
  return debugLevels.includes(configDefaults.debugLevel);
};

/* eslint-disable no-console */
const loggerImpl = {
  log: (obj: any) => {
    console.log(JSON.stringify(obj));
  },
  warn: (obj: any) => {
    console.warn(JSON.stringify(obj));
  },
  error: (error: Error) => {
    console.error(error);
  },
};

export const logger = {
  log: (obj: any) => {
    if (hasDebugLevel([DebugLevel.None])) {
      return;
    }
    if (!hasDebugLevel([DebugLevel.VerboseLogs])) {
      return;
    }
    loggerImpl.log(obj);
  },
  warn: (obj: any) => {
    if (hasDebugLevel([DebugLevel.None])) {
      return;
    }
    if (!hasDebugLevel([DebugLevel.VerboseLogs, DebugLevel.WarningsErrors])) {
      return;
    }
    loggerImpl.warn(obj);
  },
  error: (error: Error) => {
    if (hasDebugLevel([DebugLevel.None])) {
      return;
    }
    loggerImpl.error(error);
  },
};
