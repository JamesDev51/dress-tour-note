import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CompatibilityNotice,
  DetailOptionCard,
  DressPreview,
  OptionCard,
} from '../components/DressPreview'
import {
  applyCompatibilityRules,
  backStyleOptions,
  colorToneOptions,
  detailOptions,
  necklineOptions,
  primaryFabricOptions,
  quickTagOptions,
  silhouetteOptions,
  toggleDressDetail,
  trainLengthOptions,
  upperStyleOptions,
  waistlineOptions,
  type CompatibilityResult,
} from '../domain/options'
import type {
  BackStyle,
  ColorTone,
  Dress,
  DressDetail,
  DressStyle,
  Neckline,
  PrimaryFabric,
  QuickTag,
  Silhouette,
  TrainLength,
  UpperStyle,
  Waistline,
} from '../domain/types'
import { flushPendingSaves, queueDressPatch } from '../lib/autosave/saveQueue'
import { getTourAggregate, setSetting } from '../lib/db/repositories'
import { useDbQuery } from '../shared/hooks'
import { useToastStore } from '../shared/stores'
import {
  BottomBar,
  Button,
  ErrorState,
  LoadingScreen,
  Notice,
  Page,
  SaveIndicator,
  TextArea,
  TopBar,
} from '../shared/ui'
import { countCharacters } from '../shared/utils'

type EditorTab =
  | 'upperStyle'
  | 'neckline'
  | 'waistline'
  | 'silhouette'
  | 'primaryFabric'
  | 'details'
  | 'trainLength'
  | 'backColor'
  | 'notes'

const tabs: Array<{ id: EditorTab; label: string; question: string; description: string }> = [
  { id: 'upperStyle', label: '어깨', question: '어깨와 소매는 어떻게 생겼나요?', description: '끈과 소매가 닿는 위치를 떠올려보세요.' },
  { id: 'neckline', label: '가슴선', question: '가슴 부분의 선은 어떤 모양인가요?', description: '하트, 일자, V처럼 가장 가까운 모양을 고르세요.' },
  { id: 'waistline', label: '허리선', question: '허리 경계는 어디에 있었나요?', description: '가슴 아래인지, 허리인지, 골반 쪽인지 확인해요.' },
  { id: 'silhouette', label: '치마', question: '치마는 어디서부터 퍼졌나요?', description: '전체 실루엣을 가장 잘 기억하게 해주는 항목이에요.' },
  { id: 'primaryFabric', label: '소재', question: '드레스의 소재와 표면은 어땠나요?', description: '광택, 망사, 레이스처럼 눈에 띈 느낌을 선택하세요.' },
  { id: 'details', label: '장식', question: '눈에 띈 장식을 모두 골라주세요', description: '여러 개 선택할 수 있어요.' },
  { id: 'trainLength', label: '트레인', question: '뒤로 끌리는 치맛자락은 얼마나 길었나요?', description: '샵에서 걸어 나왔을 때 뒤쪽 길이를 떠올려보세요.' },
  { id: 'backColor', label: '등·색', question: '뒷모습과 색감은 어땠나요?', description: '등 파임과 흰색의 온도를 함께 기록해요.' },
  { id: 'notes', label: '메모', question: '입어봤을 때 느낌은 어땠나요?', description: '빠른 태그와 자유 메모를 남겨 비교할 때 활용해요.' },
]

function updateStyle<K extends keyof DressStyle>(
  style: DressStyle,
  key: K,
  value: DressStyle[K],
): CompatibilityResult {
  return applyCompatibilityRules({ ...style, [key]: value }, key)
}

function toggleQuickTag(current: QuickTag[], value: QuickTag): QuickTag[] {
  return current.includes(value) ? current.filter((tag) => tag !== value) : [...current, value]
}

export function DressEditorPage() {
  const { tourId = '', shopId = '', dressId = '' } = useParams()
  const navigate = useNavigate()
  const loader = useCallback(() => getTourAggregate(tourId), [tourId])
  const { data, loading, error, reload } = useDbQuery(loader, [tourId, shopId, dressId])
  const [draft, setDraft] = useState<Dress | null>(null)
  const [tabIndex, setTabIndex] = useState(0)
  const [compatibility, setCompatibility] = useState<CompatibilityResult | null>(null)
  const showToast = useToastStore((state) => state.show)
  const revisionRef = useRef(0)

  const sourceDress = data?.dresses.find((dress) => dress.id === dressId) ?? null
  const shop = data?.shops.find((item) => item.id === shopId) ?? null
  const faceAsset = data?.assets.find((asset) => asset.id === data.tour.faceConfig.assetId)

  useEffect(() => {
    if (!sourceDress) return
    setDraft({
      ...sourceDress,
      style: { ...sourceDress.style, details: [...sourceDress.style.details] },
      quickTags: [...sourceDress.quickTags],
    })
    revisionRef.current = sourceDress.clientRevision
  }, [sourceDress?.id])

  useEffect(() => {
    if (!tourId || !shopId || !dressId) return
    void setSetting('lastOpenedRoute', `/tour/${tourId}/shop/${shopId}/dress/${dressId}/edit`)
  }, [tourId, shopId, dressId])

  const tab = tabs[tabIndex]!

  const savePatch = useCallback(
    (patch: Partial<Dress>, delay = 0) => {
      revisionRef.current += 1
      queueDressPatch(dressId, tourId, { ...patch, clientRevision: revisionRef.current }, delay)
    },
    [dressId, tourId],
  )

  const applyStyle = <K extends keyof DressStyle>(key: K, value: DressStyle[K]) => {
    if (!draft) return
    const result = updateStyle(draft.style, key, value)
    setCompatibility(result)
    const next = { ...draft, style: result.style }
    setDraft(next)
    savePatch({ style: result.style })
  }

  const previewStyleFor = useCallback(
    <K extends keyof DressStyle>(key: K, value: DressStyle[K]): DressStyle => {
      if (!draft) throw new Error('드레스 편집 정보를 찾을 수 없습니다.')
      return updateStyle(draft.style, key, value).style
    },
    [draft],
  )

  const optionContent = useMemo(() => {
    if (!draft) return null
    const style = draft.style
    if (tab.id === 'upperStyle') {
      return (
        <div className="option-grid" role="radiogroup" aria-label={tab.question}>
          {upperStyleOptions.map((option) => (
            <OptionCard<UpperStyle>
              key={option.value}
              option={option}
              selected={style.upperStyle === option.value}
              style={previewStyleFor('upperStyle', option.value)}
              onSelect={() => applyStyle('upperStyle', option.value)}
            />
          ))}
        </div>
      )
    }
    if (tab.id === 'neckline') {
      return (
        <div className="option-grid" role="radiogroup" aria-label={tab.question}>
          {necklineOptions.map((option) => (
            <OptionCard<Neckline>
              key={option.value}
              option={option}
              selected={style.neckline === option.value}
              style={previewStyleFor('neckline', option.value)}
              onSelect={() => applyStyle('neckline', option.value)}
            />
          ))}
        </div>
      )
    }
    if (tab.id === 'waistline') {
      return (
        <div className="option-grid" role="radiogroup" aria-label={tab.question}>
          {waistlineOptions.map((option) => (
            <OptionCard<Waistline>
              key={option.value}
              option={option}
              selected={style.waistline === option.value}
              style={previewStyleFor('waistline', option.value)}
              onSelect={() => applyStyle('waistline', option.value)}
            />
          ))}
        </div>
      )
    }
    if (tab.id === 'silhouette') {
      return (
        <div className="option-grid" role="radiogroup" aria-label={tab.question}>
          {silhouetteOptions.map((option) => (
            <OptionCard<Silhouette>
              key={option.value}
              option={option}
              selected={style.silhouette === option.value}
              style={previewStyleFor('silhouette', option.value)}
              onSelect={() => applyStyle('silhouette', option.value)}
            />
          ))}
        </div>
      )
    }
    if (tab.id === 'primaryFabric') {
      return (
        <div className="option-grid" role="radiogroup" aria-label={tab.question}>
          {primaryFabricOptions.map((option) => (
            <OptionCard<PrimaryFabric>
              key={option.value}
              option={option}
              selected={style.primaryFabric === option.value}
              style={previewStyleFor('primaryFabric', option.value)}
              onSelect={() => applyStyle('primaryFabric', option.value)}
            />
          ))}
        </div>
      )
    }
    if (tab.id === 'details') {
      return (
        <div className="option-grid" aria-label={tab.question}>
          {detailOptions.map((option) => {
            const selected = style.details.includes(option.value)
            const details = toggleDressDetail(style.details, option.value)
            return (
              <DetailOptionCard
                key={option.value}
                option={option}
                selected={selected}
                previewStyle={{ ...style, details }}
                onSelect={() => applyStyle('details', details)}
              />
            )
          })}
        </div>
      )
    }
    if (tab.id === 'trainLength') {
      return (
        <div className="option-grid" role="radiogroup" aria-label={tab.question}>
          {trainLengthOptions.map((option) => (
            <OptionCard<TrainLength>
              key={option.value}
              option={option}
              selected={style.trainLength === option.value}
              style={previewStyleFor('trainLength', option.value)}
              onSelect={() => applyStyle('trainLength', option.value)}
            />
          ))}
        </div>
      )
    }
    if (tab.id === 'backColor') {
      return (
        <div className="combined-options">
          <section>
            <h3>뒷모습</h3>
            <div className="option-grid" role="radiogroup" aria-label="뒷모습">
              {backStyleOptions.map((option) => (
                <OptionCard<BackStyle>
                  key={option.value}
                  option={option}
                  selected={style.backStyle === option.value}
                  style={previewStyleFor('backStyle', option.value)}
                  onSelect={() => applyStyle('backStyle', option.value)}
                />
              ))}
            </div>
          </section>
          <section>
            <h3>색감</h3>
            <div className="option-grid option-grid--colors" role="radiogroup" aria-label="색감">
              {colorToneOptions.map((option) => (
                <OptionCard<ColorTone>
                  key={option.value}
                  option={option}
                  selected={style.colorTone === option.value}
                  style={previewStyleFor('colorTone', option.value)}
                  onSelect={() => applyStyle('colorTone', option.value)}
                />
              ))}
            </div>
          </section>
        </div>
      )
    }
    return (
      <div className="notes-editor">
        <section>
          <h3>빠른 인상</h3>
          <p>비교할 때 기억하고 싶은 느낌을 모두 고르세요.</p>
          <div className="tag-picker">
            {quickTagOptions.map((option) => {
              const selected = draft.quickTags.includes(option.value)
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`tag-button ${selected ? 'tag-button--selected' : ''}`}
                  aria-pressed={selected}
                  onClick={() => {
                    const next = toggleQuickTag(draft.quickTags, option.value)
                    setDraft({ ...draft, quickTags: next })
                    savePatch({ quickTags: next })
                  }}
                >
                  {selected ? '✓ ' : ''}{option.label}
                </button>
              )
            })}
          </div>
        </section>
        <TextArea
          label="특이사항"
          value={draft.memo}
          onChange={(event) => {
            const memo = event.target.value
            setDraft({ ...draft, memo })
            savePatch({ memo }, 300)
          }}
          onBlur={() => void flushPendingSaves(tourId)}
          maxLength={2000}
          rows={7}
          counter={`${countCharacters(draft.memo)}/2,000`}
          placeholder="허리가 제일 얇아 보였음, 움직일 때 조금 무거웠음…"
        />
      </div>
    )
  }, [draft, tab, previewStyleFor, savePatch])

  if (loading) return <Page><TopBar title="드레스 편집" back={`/tour/${tourId}/shop/${shopId}`} /><LoadingScreen /></Page>
  if (error) return <Page><TopBar title="드레스 편집" back={`/tour/${tourId}/shop/${shopId}`} /><ErrorState message={error.message} action={<Button onClick={reload}>다시 시도</Button>} /></Page>
  if (!data || !shop || !sourceDress || !draft) {
    return <Page><TopBar title="드레스 편집" back={`/tour/${tourId}/shop/${shopId}`} /><ErrorState message="드레스 기록을 찾을 수 없습니다." /></Page>
  }

  const goBack = async () => {
    await flushPendingSaves(tourId).catch(() => undefined)
    navigate(`/tour/${tourId}/shop/${shopId}`)
  }

  const next = async () => {
    if (tabIndex < tabs.length - 1) {
      setTabIndex((value) => value + 1)
      document.querySelector('.editor-options')?.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    await flushPendingSaves(tourId)
    showToast('드레스 기록을 저장했어요.', 'success')
    navigate(`/tour/${tourId}/shop/${shopId}`)
  }

  return (
    <Page className="editor-page page-with-bottom">
      <TopBar
        title={draft.name}
        subtitle={shop.name}
        back={false}
        right={<SaveIndicator />}
      />
      <div className="editor-custom-back">
        <button type="button" onClick={() => void goBack()} aria-label="샵으로 돌아가기">‹</button>
        <label className="inline-name-field">
          <span className="sr-only">드레스 이름</span>
          <input
            value={draft.name}
            maxLength={30}
            onChange={(event) => {
              const name = event.target.value
              setDraft({ ...draft, name })
              savePatch({ name }, 300)
            }}
            onBlur={() => void flushPendingSaves(tourId)}
          />
        </label>
        <button
          className={`heart-button heart-button--large ${draft.isFavorite ? 'heart-button--active' : ''}`}
          type="button"
          aria-label={draft.isFavorite ? '후보에서 해제' : '후보로 저장'}
          aria-pressed={draft.isFavorite}
          onClick={() => {
            const isFavorite = !draft.isFavorite
            setDraft({ ...draft, isFavorite })
            savePatch({ isFavorite })
          }}
        >
          {draft.isFavorite ? '♥' : '♡'}
        </button>
      </div>

      <section className="editor-preview" aria-label="드레스 조합 미리보기">
        <DressPreview
          style={draft.style}
          faceAsset={faceAsset}
          faceConfig={data.tour.faceConfig}
          title={`${shop.name} ${draft.name}`}
        />
        <p>실제 드레스와 완전히 같지 않은 기억용 스케치입니다.</p>
      </section>

      <nav className="editor-tabs" aria-label="드레스 편집 항목">
        {tabs.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={index === tabIndex ? 'active' : ''}
            aria-current={index === tabIndex ? 'step' : undefined}
            onClick={() => setTabIndex(index)}
          >
            <span>{index + 1}</span>{item.label}
          </button>
        ))}
      </nav>

      <section className="editor-options">
        <div className="editor-question">
          <span>{tabIndex + 1} / {tabs.length}</span>
          <h2>{tab.question}</h2>
          <p>{tab.description}</p>
        </div>
        <CompatibilityNotice result={compatibility} />
        {tab.id === 'details' && <Notice>‘장식 거의 없음’을 고르면 다른 장식 선택이 해제됩니다.</Notice>}
        {optionContent}
      </section>

      <BottomBar>
        <div className="editor-bottom-actions">
          {tabIndex > 0 && (
            <Button variant="secondary" onClick={() => setTabIndex((value) => value - 1)}>
              이전
            </Button>
          )}
          <Button block onClick={() => void next()}>
            {tabIndex === tabs.length - 1 ? '기록 완료' : '다음 선택'}
          </Button>
        </div>
      </BottomBar>
    </Page>
  )
}
