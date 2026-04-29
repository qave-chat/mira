import type { Preview } from "@storybook/react";
import { useEffect } from "react";
import "../src/index.css";

const preview: Preview = {
  parameters: {
    layout: "centered",
  },
  globalTypes: {
    theme: {
      description: "Color theme",
      defaultValue: "light",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: [
          { value: "light", icon: "sun", title: "Light" },
          { value: "dark", icon: "moon", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme ?? "light";
      useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        document.body.style.backgroundColor = "var(--color-background)";
        document.body.style.color = "var(--color-foreground)";
      }, [theme]);
      return <Story />;
    },
  ],
};

export default preview;
