import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.ui.story.@(ts|tsx)"],
  framework: {
    name: "@storybook/react-vite",
    options: {
      viteConfigPath: ".storybook/vite.config.ts",
    },
  },
};

export default config;
