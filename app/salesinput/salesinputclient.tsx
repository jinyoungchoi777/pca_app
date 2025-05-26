'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { format, subMonths, endOfMonth, subDays } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ArrowLeft, ChevronRight } from 'lucide-react'
interface SimulationRow {
  key: string
  [key: string]: string | number | null | undefined
}
export default function SalesInputClient() {
  const searchParams = useSearchParams()
  const station = searchParams.get('station') || ''
  const stationName = searchParams.get('stationName') || ''

  const today = new Date()
  const prevDay = format(subDays(today, 1), 'd')
  const currentdate = format(today, 'yyyy-MM-dd')
  const monthEnd = endOfMonth(today)
  const thisMonthDays = format(monthEnd, 'd')
  const lastYearRange = `${format(subMonths(today, 13), 'yyyy.MM')} ~ ${format(subMonths(today, 2), 'yyyy.MM')}`

  const productRows = ['전체', 'UPG', 'PG', 'UG', 'K/O', 'ULSD', 'ULSD+']

  const [salesInput, setSalesInput] = useState({ upg: '', pg: '', ug: '', ko: '', ulsd: '', ulsdplus: '' })
  const [marginInput, setMarginInput] = useState({ upg: '', pg: '', ug: '', ko: '', ulsd: '', ulsdplus: '' })

  const [salesData, setSalesData] = useState<SimulationRow[]>([])
  const [marginData, setMarginData] = useState<SimulationRow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [openSales, setOpenSales] = useState(false)   // 판매량 시트용
  const [openMargin, setOpenMargin] = useState(false) // 게시가 시트용
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [salesRes, marginRes] = await Promise.all([
          fetch(`/api/selecteddata?station=${station}&type=판매량`),
          fetch(`/api/selecteddata?station=${station}&type=판매마진`),
        ])
        const salesJson = await salesRes.json()
        const marginJson = await marginRes.json()
        setSalesData(salesJson)
        setMarginData(marginJson)
      } catch (err) {
        console.error("❌ API 호출 실패", err)
        
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [station])

  const extractProductFromKey = (key: string): string => {
    const parts = key?.split('_')
    return parts?.[3] || ''
  }

  const formatNumber = (val: string | number | null | undefined): string => {
    const num = Number(val)
    return isNaN(num)
      ? '-'
      : new Intl.NumberFormat('ko-KR', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }).format(num)
  }

  const renderSheetContent = (
    title: string,
    inputs: typeof salesInput,
    onChange: (key: string, value: string) => void,
    onApply?: () => void
  ) => (
    <SheetContent side="right" className="w-[320px] sm:w-[400px] px-5 py-0 bg-gradient-to-br from-white to-gray-50 shadow-xl">
      <SheetHeader>
        <SheetTitle className="text-xl font-semibold text-indigo-800">
          {title}
        </SheetTitle>
      </SheetHeader>
      <div className="mt-0 space-y-2 overflow-y-auto max-h-[70vh] pr-2">
        {productRows.filter(label => label !== '전체').map((label) => {
          const key = label.toLowerCase().replace('+', 'plus')
          return (
            <div key={label} className="bg-white rounded-xl p-3 shadow-sm border border-gray-200 hover:shadow-md transition">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {label} 증감
              </label>
              <Input
                type="number"
                value={inputs[key as keyof typeof inputs]}
                onChange={(e) => onChange(key, e.target.value)}
                placeholder={`${label} 값을 입력하세요`}
                className="text-sm border-gray-300 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
              />
            </div>
          )
        })}
      </div>
      <div className="mt-0">
      <Button
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow"
        onClick={() => {
          if (onApply) onApply()
        }}
      >
        입력값 적용
      </Button>
      </div>
    </SheetContent>
  )
  const encodedSales = useMemo(() => btoa(JSON.stringify(salesInput)), [salesInput])
  const encodedMargin = useMemo(() => btoa(JSON.stringify(marginInput)), [marginInput])


  return (
    <main className="p-4 space-y-6">
      {/* 상단 요약 정보 카드 */}
      <div className="bg-gradient-to-b from-sky-100 to-white rounded-2xl shadow-md px-6 py-4 w-full space-y-4">
        <div className="text-center">
          <p className="text-xl font-bold text-indigo-700">{stationName || '선택되지 않음'}</p>
        </div>

        <hr className="border-gray-200" />

        <div className="grid grid-cols-2 gap-y-4 text-sm text-gray-700">
          <div>
            <p className="text-gray-500">기준일자</p>
            <p className="font-semibold">{currentdate}</p>
          </div>
          <div>
            <p className="text-gray-500">전일 누계일수</p>
            <p className="font-semibold">{prevDay}일</p>
          </div>
          <div>
            <p className="text-gray-500">당월일수</p>
            <p className="font-semibold">{thisMonthDays}일</p>
          </div>
          <div>
            <p className="text-gray-500">직전 1년</p>
            <p className="font-semibold">{lastYearRange}</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-sm text-gray-500">데이터를 불러오는 중입니다...</div>
      ) : (
        <>
          {/* 판매량 카드 */}
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">판매량 변경 시뮬레이션</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">단위: ℓ</p>
              </div>
              <Sheet open={openSales} onOpenChange={setOpenSales}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">판매량 증감 입력</Button>
                </SheetTrigger>
                {renderSheetContent(
                  '판매량 증감 입력',
                  salesInput,
                  (k, v) => setSalesInput(prev => ({ ...prev, [k]: v })),
                  () => setOpenSales(false)
                )}
              </Sheet>

            </CardHeader>
            <CardContent className="overflow-auto">
              <table className="min-w-full text-sm text-center border">
                <thead className="bg-indigo-50">
                  <tr>
                    <th className="p-2">제품</th>
                    <th className="p-2">직전1년</th>
                    <th className="p-2">전일까지누계</th>
                    <th className="p-2">전일까지평균</th>
                    <th className="p-2">RSP계획</th>
                  </tr>
                </thead>
                <tbody>
                  {productRows.map((product) => {
                    const row = salesData.find(d => extractProductFromKey(d.key) === product)
                    if (!row || !row["rsp_계획"]) return null
                    return (
                      <tr
                        key={product}
                        className={`border-t hover:bg-indigo-50 ${product === '전체' ? 'bg-yellow-50 font-bold' : ''}`}
                      >
                        <td className="p-2 font-medium">{product}</td>
                        <td className="p-2">{formatNumber(row["직전1년"])}</td>
                        <td className="p-2">{formatNumber(row["전일까지누계"])}</td>
                        <td className="p-2">{formatNumber(row["전일까지평균"])}</td>
                        <td className="p-2">{formatNumber(row["rsp_계획"])}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* 마진 카드 */}
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">판매마진 변경 시뮬레이션</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">단위: 원/ℓ</p>
              </div>
              <Sheet open={openMargin} onOpenChange={setOpenMargin}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">게시가 증감 입력</Button>
                </SheetTrigger>
                {renderSheetContent(
                  '게시가 증감 입력',
                  marginInput,
                  (k, v) => setMarginInput(prev => ({ ...prev, [k]: v })),
                  () => setOpenMargin(false)
                )}
              </Sheet>


            </CardHeader>
            <CardContent className="overflow-auto">
              <table className="min-w-full text-sm text-center border">
                <thead className="bg-indigo-50">
                  <tr>
                    <th className="p-2">제품</th>
                    <th className="p-2">직전1년</th>
                    <th className="p-2">전일까지누계</th>
                    <th className="p-2">전일자마진</th>
                    <th className="p-2">RSP계획</th>
                  </tr>
                </thead>
                <tbody>
                  {productRows.map((product) => {
                    const row = marginData.find(d => extractProductFromKey(d.key) === product)
                    if (!row || !row["rsp_계획"]) return null
                    return (
                      <tr
                        key={product}
                        className={`border-t hover:bg-indigo-50 ${product === '전체' ? 'bg-yellow-50 font-bold' : ''}`}
                      >
                        <td className="p-2 font-medium">{product}</td>
                        <td className="p-2">{formatNumber(row["직전1년"])}</td>
                        <td className="p-2">{formatNumber(row["전일까지누계"])}</td>
                        <td className="p-2">{formatNumber(row["전일까지평균"])}</td>
                        <td className="p-2">{formatNumber(row["rsp_계획"])}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>


        </>
      )}
      {/* 하단 버튼 */}
      <div className="flex justify-between pt-2">
        <Link href={`/?station=${station}`}>
          <Button variant="outline" className="text-sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            주유소 선택화면
          </Button>
        </Link>
        <Link href={`/result?station=${station}&sales=${encodedSales}&margin=${encodedMargin}&stationName=${stationName}`}>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
            손익추정 보기 <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>      
    </main>
  )
}
