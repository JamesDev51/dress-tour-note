import { useEffect, useState } from 'react'
import type { Shop } from '../domain/types'
import { Button, Field, Modal, TextArea } from '../shared/ui'
import { countCharacters } from '../shared/utils'

export interface ShopFormValue {
  name: string
  appointmentTime: string | null
  memo: string
}

export function ShopFormModal({
  open,
  shop,
  onClose,
  onSubmit,
}: {
  open: boolean
  shop?: Shop | null
  onClose: () => void
  onSubmit: (value: ShopFormValue) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('')
  const [memo, setMemo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setName(shop?.name ?? '')
    setAppointmentTime(shop?.appointmentTime ?? '')
    setMemo(shop?.memo ?? '')
    setError('')
  }, [open, shop])

  return (
    <Modal
      open={open}
      title={shop ? '드레스샵 수정' : '드레스샵 추가'}
      description="샵별로 입어본 드레스를 묶어 기록해요."
      onClose={onClose}
    >
      <form
        className="form-stack"
        onSubmit={(event) => {
          event.preventDefault()
          const trimmed = name.trim()
          if (!trimmed) {
            setError('드레스샵 이름을 입력해주세요.')
            return
          }
          if (countCharacters(trimmed) > 50) {
            setError('샵 이름은 50자 이하로 입력해주세요.')
            return
          }
          setSubmitting(true)
          void onSubmit({
            name: trimmed,
            appointmentTime: appointmentTime || null,
            memo: memo.trim(),
          })
            .then(onClose)
            .finally(() => setSubmitting(false))
        }}
      >
        <Field
          label="드레스샵 이름"
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            setError('')
          }}
          maxLength={50}
          error={error}
          counter={`${countCharacters(name)}/50`}
          autoFocus
          placeholder="예: 아뜰리에 로리에"
        />
        <Field
          label="방문 시간"
          type="time"
          value={appointmentTime}
          onChange={(event) => setAppointmentTime(event.target.value)}
        />
        <TextArea
          label="샵 메모"
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
          maxLength={500}
          rows={4}
          counter={`${countCharacters(memo)}/500`}
          placeholder="피팅비, 담당자, 주차 등"
        />
        <div className="modal-actions">
          <Button type="button" variant="secondary" block onClick={onClose}>
            취소
          </Button>
          <Button type="submit" block loading={submitting}>
            {shop ? '수정 완료' : '샵 추가'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
