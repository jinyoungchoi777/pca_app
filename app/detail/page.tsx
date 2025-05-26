import { Suspense } from 'react'
import DetailClient from './detailclient' // 대소문자 주의! 파일명과 동일하게 맞출 것

export default function DetailPage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <DetailClient />
    </Suspense>
  )
}
