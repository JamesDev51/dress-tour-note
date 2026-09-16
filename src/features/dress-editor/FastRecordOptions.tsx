import type { Dress, Neckline, Silhouette, TopStyle } from "../../types/domain";
import {
  necklineOptions,
  silhouetteOptions,
  topStyleOptions,
} from "../../lib/dress/options";
import { DressOptionSection } from "./DressOptionSection";

const fastNecklineOptions = necklineOptions.map((option) =>
  option.id === "sweetheart"
    ? { ...option, aliases: [...(option.aliases ?? []), "하트형"] }
    : option,
);

type CoreValues = Pick<
  Dress,
  "topStyle" | "neckline" | "silhouette" | "customOptions"
>;

export function FastRecordOptions({
  step,
  values,
  acknowledged,
  saving,
  onTop,
  onNeckline,
  onSilhouette,
}: {
  readonly step: 1 | 2 | 3;
  readonly values: CoreValues;
  readonly acknowledged: boolean;
  readonly saving: boolean;
  readonly onTop: (value: TopStyle) => void;
  readonly onNeckline: (value: Neckline) => void;
  readonly onSilhouette: (value: Silhouette) => void;
}) {
  const shared = {
    disabled: () => saving,
    allowCustom: false,
    onCustomCommit: () => undefined,
  };
  switch (step) {
    case 1:
      return (
        <DressOptionSection
          {...shared}
          category="top"
          title="어깨/상의는 어땠나요?"
          hint="어깨를 덮는 부분이나 끈을 봐 주세요. 목선은 다음에 골라요."
          options={topStyleOptions}
          value={acknowledged ? values.topStyle : undefined}
          onPick={onTop}
          customValue={values.customOptions?.top}
        />
      );
    case 2:
      return (
        <DressOptionSection
          {...shared}
          category="neckline"
          title="네크라인은 어땠나요?"
          hint="목과 가슴 위쪽의 테두리 모양을 봐 주세요."
          options={fastNecklineOptions}
          value={acknowledged ? values.neckline : undefined}
          onPick={onNeckline}
          customValue={values.customOptions?.neckline}
        />
      );
    case 3:
      return (
        <DressOptionSection
          {...shared}
          category="silhouette"
          title="실루엣은 어땠나요?"
          hint="허리에서 치마 끝까지 퍼지는 모양을 봐 주세요."
          options={silhouetteOptions}
          value={acknowledged ? values.silhouette : undefined}
          onPick={onSilhouette}
          customValue={values.customOptions?.silhouette}
        />
      );
    default: {
      const unreachable: never = step;
      return unreachable;
    }
  }
}
