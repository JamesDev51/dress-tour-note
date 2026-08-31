import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSaveStore, useToastStore, useUndoStore } from './stores'

export function AppFrame({ children }: { children: ReactNode }) {
  return (
    <div className="app-frame">
      <div className="app-surface">{children}</div>
      <ToastViewport />
      <UndoViewport />
    </div>
  )
}

export function Page({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <main className={`page ${className}`}>{children}</main>
}

interface TopBarProps {
  title?: string
  subtitle?: string
  back?: boolean | string
  right?: ReactNode
}

export function TopBar({ title = '그드레스', subtitle, back, right }: TopBarProps) {
  const navigate = useNavigate()
  const handleBack = () => {
    if (typeof back === 'string') navigate(back)
    else navigate(-1)
  }
  return (
    <header className="top-bar">
      <div className="top-bar__side">
        {back ? (
          <button className="icon-button" type="button" onClick={handleBack} aria-label="뒤로가기">
            <span aria-hidden="true">‹</span>
          </button>
        ) : (
          <Link className="wordmark" to="/" aria-label="그드레스 홈">
            그드레스
          </Link>
        )}
      </div>
      <div className="top-bar__title-wrap">
        {back && <strong className="top-bar__title">{title}</strong>}
        {subtitle && <span className="top-bar__subtitle">{subtitle}</span>}
      </div>
      <div className="top-bar__side top-bar__side--right">{right}</div>
    </header>
  )
}

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    block?: boolean
    loading?: boolean
  }
>(function Button(
  { variant = 'primary', block = false, loading = false, className = '', children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`button button--${variant} ${block ? 'button--block' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="spinner spinner--small" aria-hidden="true" />}
      <span>{children}</span>
    </button>
  )
})

export function LinkButton({
  to,
  children,
  variant = 'primary',
  block = false,
  className = '',
}: {
  to: string
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  block?: boolean
  className?: string
}) {
  return (
    <Link
      to={to}
      className={`button button--${variant} ${block ? 'button--block' : ''} ${className}`}
    >
      {children}
    </Link>
  )
}

export function IconButton({
  label,
  children,
  variant = 'default',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  children: ReactNode
  variant?: 'default' | 'danger' | 'accent'
}) {
  return (
    <button
      className={`icon-button icon-button--${variant} ${className}`}
      type="button"
      aria-label={label}
      {...props}
    >
      {children}
    </button>
  )
}

export function Card({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <section className={`card ${className}`} {...props}>
      {children}
    </section>
  )
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
  counter?: string
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, hint, error, counter, className = '', ...props },
  ref,
) {
  const id = useId()
  const inputId = props.id ?? id
  const helpId = `${inputId}-help`
  return (
    <label className={`field ${className}`} htmlFor={inputId}>
      <span className="field__header">
        <span className="field__label">{label}</span>
        {counter && <span className="field__counter">{counter}</span>}
      </span>
      <input
        ref={ref}
        className={`input ${error ? 'input--error' : ''}`}
        id={inputId}
        aria-describedby={hint || error ? helpId : undefined}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {(hint || error) && (
        <span className={`field__help ${error ? 'field__help--error' : ''}`} id={helpId}>
          {error ?? hint}
        </span>
      )}
    </label>
  )
})

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, hint, error, children, className = '', ...props },
  ref,
) {
  const id = useId()
  const inputId = props.id ?? id
  const helpId = `${inputId}-help`
  return (
    <label className={`field ${className}`} htmlFor={inputId}>
      <span className="field__label">{label}</span>
      <select
        ref={ref}
        className={`input select ${error ? 'input--error' : ''}`}
        id={inputId}
        aria-describedby={hint || error ? helpId : undefined}
        aria-invalid={Boolean(error)}
        {...props}
      >
        {children}
      </select>
      {(hint || error) && (
        <span className={`field__help ${error ? 'field__help--error' : ''}`} id={helpId}>
          {error ?? hint}
        </span>
      )}
    </label>
  )
})

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  hint?: string
  error?: string
  counter?: string
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, hint, error, counter, className = '', ...props },
  ref,
) {
  const id = useId()
  const inputId = props.id ?? id
  const helpId = `${inputId}-help`
  return (
    <label className={`field ${className}`} htmlFor={inputId}>
      <span className="field__header">
        <span className="field__label">{label}</span>
        {counter && <span className="field__counter">{counter}</span>}
      </span>
      <textarea
        ref={ref}
        className={`textarea ${error ? 'input--error' : ''}`}
        id={inputId}
        aria-describedby={hint || error ? helpId : undefined}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {(hint || error) && (
        <span className={`field__help ${error ? 'field__help--error' : ''}`} id={helpId}>
          {error ?? hint}
        </span>
      )}
    </label>
  )
})

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
}) {
  return (
    <label className={`switch-row ${disabled ? 'switch-row--disabled' : ''}`}>
      <span className="switch-row__copy">
        <strong>{label}</strong>
        {description && <span>{description}</span>}
      </span>
      <input
        className="switch-input"
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
      />
      <span className="switch-control" aria-hidden="true" />
    </label>
  )
}

export function Notice({
  children,
  kind = 'info',
}: {
  children: ReactNode
  kind?: 'info' | 'warning' | 'success' | 'danger'
}) {
  return <div className={`notice notice--${kind}`}>{children}</div>
}

export function Pill({ children, active = false }: { children: ReactNode; active?: boolean }) {
  return <span className={`pill ${active ? 'pill--active' : ''}`}>{children}</span>
}

export function BottomBar({ children }: { children: ReactNode }) {
  return <div className="bottom-bar">{children}</div>
}

export function SaveIndicator() {
  const state = useSaveStore((store) => store.state)
  const lastSavedAt = useSaveStore((store) => store.lastSavedAt)
  const retry = async () => {
    const { retryPendingSaves } = await import('../lib/autosave/saveQueue')
    await retryPendingSaves().catch(() => undefined)
  }
  const labels = {
    saved: '저장됨 ✓',
    saving: '저장 중…',
    error: '저장 안 됨',
    quotaExceeded: '저장 공간 부족',
  }
  return (
    <button
      className={`save-indicator save-indicator--${state}`}
      type="button"
      onClick={state === 'error' || state === 'quotaExceeded' ? retry : undefined}
      aria-label={`${labels[state]}${lastSavedAt ? `, 마지막 저장 ${new Date(lastSavedAt).toLocaleTimeString('ko-KR')}` : ''}`}
    >
      {state === 'saving' && <span className="spinner spinner--tiny" aria-hidden="true" />}
      {labels[state]}
    </button>
  )
}

export function LoadingScreen({ label = '기록을 불러오는 중…' }: { label?: string }) {
  return (
    <div className="state-screen" role="status">
      <span className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  )
}

export function EmptyState({
  emoji = '👗',
  title,
  description,
  action,
}: {
  emoji?: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      <span className="empty-state__emoji" aria-hidden="true">
        {emoji}
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  )
}

export function ErrorState({
  title = '문제가 생겼어요',
  message,
  action,
}: {
  title?: string
  message: string
  action?: ReactNode
}) {
  return (
    <div className="empty-state empty-state--error" role="alert">
      <span className="empty-state__emoji" aria-hidden="true">
        !
      </span>
      <h2>{title}</h2>
      <p>{message}</p>
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  )
}

interface ModalProps {
  open: boolean
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
}

export function Modal({ open, title, description, children, onClose }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    previousFocus.current = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current
    const focusable = dialog?.querySelector<HTMLElement>(
      'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
    )
    window.setTimeout(() => focusable?.focus(), 0)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
      if (event.key !== 'Tab' || !dialog) return
      const items = [
        ...dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((item) => !item.hasAttribute('disabled'))
      const first = items[0]
      const last = items.at(-1)
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.classList.add('modal-open')
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.classList.remove('modal-open')
      previousFocus.current?.focus()
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        className="modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? 'modal-description' : undefined}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-handle" aria-hidden="true" />
        <div className="modal-header">
          <div>
            <h2 id="modal-title">{title}</h2>
            {description && <p id="modal-description">{description}</p>}
          </div>
          <IconButton label="닫기" onClick={onClose}>
            ×
          </IconButton>
        </div>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  )
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = '삭제',
  onConfirm,
  onClose,
  dangerous = true,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => Promise<void> | void
  onClose: () => void
  dangerous?: boolean
}) {
  const [submitting, setSubmitting] = useState(false)
  return (
    <Modal open={open} title={title} description={description} onClose={onClose}>
      <div className="modal-actions">
        <Button variant="secondary" onClick={onClose} block>
          취소
        </Button>
        <Button
          variant={dangerous ? 'danger' : 'primary'}
          loading={submitting}
          onClick={async () => {
            setSubmitting(true)
            try {
              await onConfirm()
              onClose()
            } finally {
              setSubmitting(false)
            }
          }}
          block
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}

function ToastViewport() {
  const { message, kind, visible, hide } = useToastStore()
  if (!visible) return null
  return (
    <div className={`toast toast--${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      <span>{message}</span>
      <button type="button" onClick={hide} aria-label="알림 닫기">
        ×
      </button>
    </div>
  )
}

function UndoViewport() {
  const { message, visible, undo, dismiss } = useUndoStore()
  if (!visible) return null
  return (
    <div className="undo-toast" role="status">
      <span>{message}</span>
      <button type="button" onClick={() => void undo()}>
        실행 취소
      </button>
      <button type="button" onClick={dismiss} aria-label="닫기">
        ×
      </button>
    </div>
  )
}
