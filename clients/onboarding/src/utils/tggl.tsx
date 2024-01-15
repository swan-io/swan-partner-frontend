import React, { useEffect } from "react";
import {
  TgglProvider as Provider,
  TgglClient,
  TgglContext,
  useFlag,
  useTggl,
} from "react-tggl-client";
import { env } from "./env";

const client = env.TGGL_API_KEY != null ? new TgglClient(env.TGGL_API_KEY) : null;

export const TgglProvider = ({ children }: { children: React.ReactNode }) => {
  return client != null ? <Provider client={client}>{children}</Provider> : children;
};

const DEFAULT_FLAG = { active: false, value: undefined, loading: false, error: undefined };

export const useTgglFlag = client != null ? useFlag : () => DEFAULT_FLAG;

export const useTgglContext =
  client != null
    ? (context: Partial<TgglContext>) => {
        const { updateContext } = useTggl();
        useEffect(() => {
          updateContext(context);
        }, [updateContext, context]);
      }
    : () => {};
