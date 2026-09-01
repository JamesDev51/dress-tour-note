import {
  OptionArtwork,
  type OptionArtworkCategory,
} from "../../components/OptionArtwork";
import { OptionTile } from "../../components/OptionTile";
import type { Option } from "../../lib/dress/options";

type DressOptionSectionProps<T extends string> = {
  category: OptionArtworkCategory;
  title: string;
  options: readonly Option<T>[];
  value: T;
  onPick: (id: T) => void;
  disabled?: (id: T) => boolean;
};

export function DressOptionSection<T extends string>({
  category,
  title,
  options,
  value,
  onPick,
  disabled,
}: DressOptionSectionProps<T>) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-xl font-black">{title}</h2>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <OptionTile
            key={option.id}
            label={option.label}
            technical={option.technical}
            selected={value === option.id}
            disabled={disabled?.(option.id)}
            onClick={() => onPick(option.id)}
            icon={<OptionArtwork category={category} id={option.id} />}
          />
        ))}
      </div>
    </section>
  );
}
