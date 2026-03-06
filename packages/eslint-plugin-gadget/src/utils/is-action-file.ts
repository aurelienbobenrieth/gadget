import { minimatch } from "minimatch";

const GLOBAL_ACTION_PATTERN = "**/api/actions/**/*.{js,ts}";
const MODEL_ACTION_PATTERN = "**/api/models/**/actions/**/*.{js,ts}";
const ACTION_FILE_PATTERNS = [GLOBAL_ACTION_PATTERN, MODEL_ACTION_PATTERN] as const;

export function isActionFile(filename: string): boolean {
  const normalized = filename.replace(/\\/g, "/");
  return ACTION_FILE_PATTERNS.some((pattern) => minimatch(normalized, pattern));
}

export function isModelActionFile(filename: string): boolean {
  const normalized = filename.replace(/\\/g, "/");
  return minimatch(normalized, MODEL_ACTION_PATTERN);
}

export function isGlobalActionFile(filename: string): boolean {
  const normalized = filename.replace(/\\/g, "/");
  return minimatch(normalized, GLOBAL_ACTION_PATTERN);
}
