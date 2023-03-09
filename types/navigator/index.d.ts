interface Navigator {
  // Allow detection of Brave browser
  // https://github.com/brave/brave-browser/issues/10165#issuecomment-641128278
  brave?: {
    isBrave: () => Promise<boolean>;
  };

  userAgentData?: {
    readonly brands: { brand: string; version: string }[];
    readonly mobile: boolean;
    readonly platform: string;
  };
}
