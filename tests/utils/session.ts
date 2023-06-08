import fs from "node:fs/promises";
import { sessionPath } from "../../playwright.config";
import { deepMerge } from "./functions";

type Session = {
  companyEmail: string;
  individualEmail: string;
};

export const getSession = async () => {
  const content = await fs.readFile(sessionPath, "utf-8");
  return JSON.parse(content) as Session;
};

export const saveSession = async (data: Partial<Session>) => {
  const currentData = await getSession().catch(() => ({}));
  const content = JSON.stringify(deepMerge(currentData, data), null, 2);
  return fs.writeFile(sessionPath, content, "utf-8");
};
