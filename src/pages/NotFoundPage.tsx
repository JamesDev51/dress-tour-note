import { LinkButton, Page, TopBar, EmptyState } from '../shared/ui'

export function NotFoundPage() {
  return (
    <Page>
      <TopBar back="/" title="페이지를 찾을 수 없어요" />
      <EmptyState
        emoji="?"
        title="잘못된 주소예요"
        description="기록이 삭제되었거나 주소가 올바르지 않을 수 있어요."
        action={<LinkButton to="/">홈으로 돌아가기</LinkButton>}
      />
    </Page>
  )
}
