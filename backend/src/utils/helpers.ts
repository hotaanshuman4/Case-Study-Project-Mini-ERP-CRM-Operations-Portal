import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';

/**
 * Generate a unique challan number in format: CH-YYYYMM-XXXX
 */
export const generateChallanNumber = async (): Promise<string> => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `CH-${year}${month}`;

  // Count challans for this month to generate sequence
  const count = await prisma.challan.count({
    where: {
      challanNumber: {
        startsWith: prefix,
      },
    },
  });

  const sequence = String(count + 1).padStart(4, '0');
  return `${prefix}-${sequence}`;
};

/**
 * Generate a SKU if not provided
 */
export const generateSku = (name: string): string => {
  const slug = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `${slug}-${rand}`;
};

/**
 * Sleep for ms milliseconds
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Safely parse JSON, return null on failure
 */
export const safeParseJson = <T>(str: string): T | null => {
  try {
    return JSON.parse(str) as T;
  } catch {
    return null;
  }
};

export { uuidv4 };
