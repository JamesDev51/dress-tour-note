import type {
  Dress,
  DressOptionCategory,
  Fabric,
  Neckline,
  Silhouette,
  TopStyle,
} from "../../types/domain";
import {
  fabricOptions,
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
  "topStyle" | "neckline" | "silhouette" | "fabric" | "customOptions"
>;

export function FastRecordOptions({
  step,
  values,
  acknowledged,
  saving,
  onTop,
  onNeckline,
  onSilhouette,
  onFabric,
  onCustomCommit,
  onClearAndSelect,
}: {
  readonly step: 1 | 2 | 3 | 4;
  readonly values: CoreValues;
  readonly acknowledged: boolean;
  readonly saving: boolean;
  readonly onTop: (value: TopStyle) => void;
  readonly onNeckline: (value: Neckline) => void;
  readonly onFabric: (value: Fabric) => void;
  readonly onCustomCommit: (
    category: DressOptionCategory,
    value: string,
  ) => void;
  readonly onClearAndSelect: (
    category: DressOptionCategory,
    patch: Partial<Dress>,
  ) => void;
  readonly onSilhouette: (value: Silhouette) => void;
}) {
  const shared = {
    disabled: () => saving,
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
          onCustomCommit={(value) => onCustomCommit("top", value)}
          onClearAndSelect={(value) =>
            onClearAndSelect("top", { topStyle: value })
          }
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
          onCustomCommit={(value) => onCustomCommit("neckline", value)}
          onClearAndSelect={(value) =>
            onClearAndSelect("neckline", { neckline: value })
          }
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
          onCustomCommit={(value) => onCustomCommit("silhouette", value)}
          onClearAndSelect={(value) =>
            onClearAndSelect("silhouette", { silhouette: value })
          }
        />
      );
    case 4:
      return (
        <DressOptionSection
          {...shared}
          category="fabric"
          title="소재는 어땠나요?"
          hint="표면의 느낌을 떠올려 보세요."
          options={fabricOptions}
          value={acknowledged ? values.fabric : undefined}
          onPick={onFabric}
          customValue={values.customOptions?.fabric}
          onCustomCommit={(value) => onCustomCommit("fabric", value)}
          onClearAndSelect={(value) =>
            onClearAndSelect("fabric", { fabric: value })
          }
        />
      );
    default: {
      const unreachable: never = step;
      return unreachable;
    }
  }
}
