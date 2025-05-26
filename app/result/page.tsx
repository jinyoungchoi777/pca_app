

import { Suspense } from 'react'
import ResultClient from './resultclient' // 대소문자 주의! 파일명과 동일하게 맞출 것

export default function SalesInputPage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <ResultClient />
    </Suspense>
  )
}