import type { Meta, StoryObj } from "@storybook/react";
import { SearchIcon, XIcon } from "lucide-react";
import {
  Combobox,
  ComboboxChip,
  ComboboxChipInput,
  ComboboxChipRemove,
  ComboboxChips,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
  ComboboxPopup,
  ComboboxPortal,
  ComboboxPositioner,
  ComboboxValue,
} from "./combobox.ui";

const FRUITS = [
  "Apple",
  "Banana",
  "Cherry",
  "Dragonfruit",
  "Elderberry",
  "Fig",
  "Grape",
  "Honeydew",
  "Kiwi",
  "Lemon",
  "Mango",
  "Nectarine",
];

function FruitCombobox({ items = FRUITS }: { items?: ReadonlyArray<string> }) {
  return (
    <Combobox items={items}>
      <ComboboxInput placeholder="Pick a fruit…" className="max-w-xs" />
      <ComboboxPortal>
        <ComboboxPositioner>
          <ComboboxPopup>
            <ComboboxList>
              {items.map((item) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              ))}
              <ComboboxEmpty>No matches</ComboboxEmpty>
            </ComboboxList>
          </ComboboxPopup>
        </ComboboxPositioner>
      </ComboboxPortal>
    </Combobox>
  );
}

const meta: Meta<typeof FruitCombobox> = {
  title: "Shared/UI/Combobox",
  component: FruitCombobox,
  decorators: [
    (Story) => (
      <div className="max-w-lg p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof FruitCombobox>;

export const Default: Story = {};

export const ShortList: Story = {
  args: { items: ["Alpha", "Beta", "Gamma"] },
};

export const EmptyList: Story = {
  args: { items: [] },
};

function MultiFruitCombobox({ items = FRUITS }: { items?: ReadonlyArray<string> }) {
  return (
    <Combobox items={items} multiple>
      <ComboboxInputGroup className="max-w-xs">
        <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
        <ComboboxChips>
          <ComboboxValue>
            {(value: ReadonlyArray<string>) =>
              value.map((v) => (
                <ComboboxChip key={v} aria-label={v}>
                  {v}
                  <ComboboxChipRemove aria-label={`Remove ${v}`}>
                    <XIcon className="size-3" />
                  </ComboboxChipRemove>
                </ComboboxChip>
              ))
            }
          </ComboboxValue>
          <ComboboxChipInput placeholder="Pick fruits…" />
        </ComboboxChips>
      </ComboboxInputGroup>
      <ComboboxPortal>
        <ComboboxPositioner>
          <ComboboxPopup>
            <ComboboxList>
              {items.map((item) => (
                <ComboboxItem key={item} value={item}>
                  <span>{item}</span>
                  <ComboboxItemIndicator />
                </ComboboxItem>
              ))}
              <ComboboxEmpty>No matches</ComboboxEmpty>
            </ComboboxList>
          </ComboboxPopup>
        </ComboboxPositioner>
      </ComboboxPortal>
    </Combobox>
  );
}

export const Multiple: StoryObj<typeof MultiFruitCombobox> = {
  render: (args) => <MultiFruitCombobox {...args} />,
};
