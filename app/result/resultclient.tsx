'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
// import { cn } from "@/lib/utils"
import { format, subMonths, endOfMonth, subDays } from 'date-fns'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, ChevronRight } from 'lucide-react'
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from '@/components/ui/card'
interface DetailRow {
  구분: string;
  계정: string;
  [key: string]: string | number | null | undefined;
}

export default function ResultClient() {
  const searchParams = useSearchParams()
  const station = searchParams.get('station') || ''
  const [data, setData] = useState<DetailRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const stationName = searchParams.get('stationName') || ''

  const today = new Date()
  const prevDay = format(subDays(today, 1), 'd')
  const currentdate = format(today, 'yyyy-MM-dd')
  const monthEnd = endOfMonth(today)
  const thisMonthDays = format(monthEnd, 'd')
  const lastYearRange = `${format(subMonths(today, 13), 'yyyy.MM')} ~ ${format(subMonths(today, 2), 'yyyy.MM')}`
  const formatDecimal = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value)
  }
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const res = await fetch(`/api/selecteddata?station=${station}`)
        const json = await res.json()
        const sorted = [...json].sort((a, b) => {
          const o1 = Number(a['순서1'] ?? 0)
          const o2 = Number(b['순서1'] ?? 0)
          if (o1 !== o2) return o1 - o2
          const o3 = Number(a['순서2'] ?? 0)
          const o4 = Number(b['순서2'] ?? 0)
          return o3 - o4
        })
        setData(sorted)
      } catch (err) {
        console.error('데이터 불러오기 실패:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [station])

  // const today = new Date()
  const lastDay = endOfMonth(today).getDate()
  const day = today.getDate() - 1

  const salesInput = useMemo(() => {
    const encoded = searchParams.get('sales')
    return encoded ? JSON.parse(atob(encoded)) : {}
  }, [searchParams])
  
  const marginInput = useMemo(() => {
    const encoded = searchParams.get('margin')
    return encoded ? JSON.parse(atob(encoded)) : {}
  }, [searchParams])
  // const formatNumber = (val: string | number | null | undefined): string => {
  //   const num = Number(val)
  //   return isNaN(num)
  //     ? '-'
  //     : new Intl.NumberFormat('ko-KR', {
  //         minimumFractionDigits: 1,
  //         maximumFractionDigits: 1,
  //       }).format(num)
  // }

  const getData = (구분: string, 계정: string, field: string) => {
    return data.find(d => d.구분 === 구분 && d.계정 === 계정)?.[field] ?? 0
  }

  
  const calculateValue = (row: DetailRow): number => {
    const { 구분, 계정 } = row
    const key = 계정?.toLowerCase().replace('+', 'plus')

    if (구분 === '판매량' && 계정 === '전체') {
      const codes = ['upg', 'pg', 'ug', 'ko', 'ulsd', 'ulsdplus']
      const total = codes.reduce((sum, key) => {
        const prev =  Number(getData('판매량', key.toUpperCase().replace('PLUS', '(PLUS)'), '전일까지누계') || 0)
        const delta = Number(salesInput[key] || 0)
        const added = prev / day * lastDay + delta * (lastDay - day)
        return sum + added
      }, 0)
      return total
    }

    if (구분 === '판매량') {
      const prev = Number(getData('판매량', 계정, '전일까지누계')|| 0)
      const delta = Number(salesInput[key] || 0)
      return prev / day * lastDay + delta * (lastDay - day)
    }

    if (구분 === '유류매출이익') {
      if (계정 === '전체') {
        const calc = ['UPG', 'PG', 'UG', 'K/O', 'ULSD', 'ULSD(PLUS)'].map(code => {
          const prev = Number(getData('유류매출이익', code, '전일까지누계')|| 0)
          const avg = Number(getData('판매량', code, '전일까지평균')|| 0)
          const margin = Number(getData('판매마진', code, '전일판매마진')|| 0)
          const deltaSales = Number(salesInput[code.toLowerCase().replace('+', 'plus')] || 0)
          const deltaMargin = Number(marginInput[code.toLowerCase().replace('+', 'plus')] || 0)
          return prev + ((deltaSales + avg) * (lastDay - day) * 200) * (deltaMargin + margin) / 1_000_000
        })
        return calc.reduce((sum, val) => sum + val, 0)
      } else if (['UPG', 'PG', 'UG', 'K/O', 'ULSD', 'ULSD(PLUS)'].includes(계정)) {
        const prev = Number(getData('유류매출이익', 계정, '전일까지누계')|| 0)
        const avg = Number(getData('판매량', 계정, '전일까지평균')|| 0)
        const margin = Number(getData('판매마진', 계정, '전일판매마진')|| 0)
        const deltaSales = Number(salesInput[key] || 0)
        const deltaMargin = Number(marginInput[key] || 0)
        return prev + ((deltaSales + avg) * (lastDay - day) * 200) * (deltaMargin + margin) / 1_000_000
      }
    }

    if (구분 === '판매마진') {
      if (['UPG', 'PG', 'UG', 'K/O', 'ULSD', 'ULSD(PLUS)'].includes(계정)) {
        const prevSum = Number(getData('판매량', 계정, '전일까지누계') || 0)
        const prevAvg = Number(getData('판매량', 계정, '전일까지평균') || 0)
        const prevMargin = Number(getData('판매마진', 계정, '전일판매마진') || 0)
        const salesDelta = Number(salesInput[key] || 0)
        const marginDelta = Number(marginInput[key] || 0)
        const volume = prevSum / day * lastDay + salesDelta * (lastDay - day)
        const profit = Number(getData('유류매출이익', 계정, '전일까지누계') || 0) + ((salesDelta + prevAvg) * (lastDay - day) * 200) * (marginDelta + prevMargin) / 1_000_000
        return profit * 1_000_000 / (volume * 200)
      } else if (계정 === '전체') {
        const codes = ['UPG', 'PG', 'UG', 'K/O', 'ULSD', 'ULSD(PLUS)']
        const volumeSum = codes.reduce((sum, code) => {
          const prev = Number(getData('판매량', code, '전일까지누계') || 0)
          const delta = Number(salesInput[code.toLowerCase().replace('+', 'plus')] || 0)
          return sum + (prev / day * lastDay + delta * (lastDay - day))
        }, 0)
        const profitSum = codes.reduce((sum, code) => {
          const prev = Number(getData('유류매출이익', code, '전일까지누계') || 0)
          const avg = Number(getData('판매량', code, '전일까지평균') || 0)
          const margin = Number(getData('판매마진', code, '전일판매마진') || 0)
          const deltaSales = Number(salesInput[code.toLowerCase().replace('+', 'plus')] || 0)
          const deltaMargin = Number(marginInput[code.toLowerCase().replace('+', 'plus')] || 0)
          return sum + (prev + ((deltaSales + avg) * (lastDay - day) * 200) * (deltaMargin + margin) / 1_000_000)
        }, 0)
        return profitSum * 1_000_000 / (volumeSum * 200)
      }
    }
    if (구분 === '역무수입' && 계정 === '전체') {
      const codes = ['세차비', '첨가제, 요소수 등', '기타', '임대료']
      return codes.reduce((sum, code) => {
        const rowData = data.find(d => d.구분 === '역무수입' && d.계정 === code)
        if (!rowData) return sum
        const val = calculateValue(rowData)
        return sum + (isNaN(val) ? 0 : val)
      }, 0)
    }
    
    
    if (구분 === '역무수입') {
      const prev = row.전일까지누계 ?? 0
    
      if (계정 === '임대료' || 계정 === '기타') {
        return Number(prev|| 0) / day * lastDay
      }
    
      const salesYesterday = Number(getData('판매량', '전체', '전일까지누계') || 0) / day * lastDay
      const salesToday = ['UPG', 'PG', 'UG', 'K/O', 'ULSD', 'ULSD(PLUS)'].reduce((sum, code) => {
        const prevSales = Number(getData('판매량', code, '전일까지누계') || 0)
        const delta = Number(salesInput[code.toLowerCase().replace('+', 'plus')] || 0)
        return sum + (prevSales / day * lastDay + delta * (lastDay - day))
      }, 0)
    
      if (계정 === '첨가제, 요소수 등') {
        return Number(prev|| 0) / day * lastDay + Number(prev|| 0) * ((salesToday - salesYesterday) / salesYesterday) * 0.5
      }
    
      if (계정 === '세차비') {
        const base = (Number(prev|| 0) * 1.1 * 1_000_000) / day * lastDay
        const adjusted = base + base * ((salesToday / salesYesterday) - 1) * 0.5
        return adjusted / 1.1 / 1_000_000
      }
    
      return 0  // 안전 fallback
    }
    
    
    if (구분 === '매출할인' && 계정 === '매출할인') {
      const volume = calculateValue({ 구분: '판매량', 계정: '전체' })
      const discountPerLiter = Number(getData('매출할인', '매출할인', '리터당') || 0)
      return volume * 200 * discountPerLiter / 1_000_000
    }
    
    if (구분 === '이송비' && 계정 === '이송비') {
      const volume = calculateValue({ 구분: '판매량', 계정: '전체' }) // salesCalcAll과 동일
      const unitCost = Number(getData('이송비', '이송비', '리터당') || 0)         // yesterdaySumSeq4_7
      return volume * 200 * unitCost / 1_000_000
    }

    if (구분 === '원가조정' && 계정 === '원가조정') {
      const volume = calculateValue({ 구분: '판매량', 계정: '전체' })
      const unitCost = Number(getData('원가조정', '원가조정', '리터당') || 0)
      return volume * 200 * unitCost / 1_000_000
    }
    
    if (구분 === '매출이익 GAP 조정' && 계정 === '매출이익 GAP 조정') {
      const volume = calculateValue({ 구분: '판매량', 계정: '전체' })
      const gapRate = Number(getData('매출이익 GAP 조정', '전체', '리터당') || 0)
      return volume * 200 * gapRate / 1_000_000
    }
    
    if (구분 === '매출이익' && 계정 === '전체') {
      const oil = calculateValue({ 구분: '유류매출이익', 계정: '전체' })
      const service = calculateValue({ 구분: '역무수입', 계정: '전체' })
      const discount = calculateValue({ 구분: '매출할인', 계정: '매출할인' })
      const costAdjust = calculateValue({ 구분: '원가조정', 계정: '원가조정' })
      const gap = calculateValue({ 구분: '매출이익 GAP 조정', 계정: '매출이익 GAP 조정' })
      return oil + service + discount + costAdjust + gap
    }

    if (구분 === '위탁수수료') {
      const prev = row.전일까지누계 ?? 0
    
      if (['전기/용수비', '기타'].includes(계정)) {
        const result = Number(prev|| 0) / day * lastDay
        return result
      }
    
      if (계정 === '세차지원비') {
        const carWashSales = Number(getData('위탁수수료', '세차지원비', '총세차매출액') || 0)
        const carWashFree = Number(getData('위탁수수료', '세차지원비', '무료대수') || 0)
        const carWashPaid = Number(getData('위탁수수료', '세차지원비', '유료대수') || 0)
        const carWashMember = Number(getData('위탁수수료', '세차지원비', '멤버십대수') || 0)
        const yesterdayTotal = Number(getData('판매량', '전체', '전일까지누계') || 0)
        const salesToday = Number(calculateValue({ 구분: '판매량', 계정: '전체' }) || 0)

        const ratio = (salesToday / (yesterdayTotal / day * lastDay)) - 1
        const sales = (carWashSales / day * lastDay) * (1 + ratio * 0.5)
        const paid = (carWashPaid / day * lastDay) * (1 + ratio * 0.5)
        const free = (carWashFree / day * lastDay) * (1 + ratio * 0.5)

        const totalWashes = paid + free
        const daedang = sales / 1.1 / totalWashes - 1027

        let result = 0
        if (totalWashes <= 500) {
          result = daedang * totalWashes * 0.8
        } else if (totalWashes <= 1000) {
          result = daedang * (500 * 0.8 + (totalWashes - 500) * 0.75)
        } else if (totalWashes <= 1500) {
          result = daedang * (500 * 0.8 + 500 * 0.75 + (totalWashes - 1000) * 0.7)
        } else if (totalWashes <= 2000) {
          result = daedang * (500 * 0.8 + 500 * 0.75 + 500 * 0.7 + (totalWashes - 1500) * 0.35)
        } else if (totalWashes <= 2500) {
          result = daedang * (500 * 0.8 + 500 * 0.75 + 500 * 0.7 + 500 * 0.35 + (totalWashes - 2000) * 0.3)
        } else if (totalWashes <= 3000) {
          result = daedang * (500 * 0.8 + 500 * 0.75 + 500 * 0.7 + 500 * 0.35 + 500 * 0.3 + (totalWashes - 2500) * 0.25)
        } else {
          result = daedang * (500 * 0.8 + 500 * 0.75 + 500 * 0.7 + 500 * 0.35 + 500 * 0.3 + 500 * 0.25 + (totalWashes - 3000) * 0.2)
        }

        const final = (result + carWashMember * 1800) / 1_000_000


        return isNaN(final) ? 0 : final
      }
    
      if (계정 === '판매관련') {
      
        const salesGubun1 = row['운영형태1'] ?? ''  // '직영안정'인지 확인
        const salesGubun2 = row['운영형태2'] ?? ''  // '풀' 여부 확인

        if (salesGubun1 !== '직영안정') return 0
      
        const isPool = salesGubun2 === '풀'
        // const salesCalcAll = calculateValue({ 구분: '판매량', 계정: '전체' }) ?? 0
        const roundedSales = parseFloat(salesCalcAll.toFixed(15))


        let salesPart = 0
        if (isPool) {
          if (roundedSales <= 500) salesPart = salesCalcAll * 200 * 55
          else if (roundedSales <= 1000) salesPart = 500 * 200 * 55 + (salesCalcAll - 500) * 200 * 40
          else if (roundedSales <= 1500) salesPart = 500 * 200 * 55 + 500 * 200 * 40 + (salesCalcAll - 1000) * 200 * 30
          else if (roundedSales <= 2000) salesPart = 500 * 200 * 55 + 500 * 200 * 40 + 500 * 200 * 30 + (salesCalcAll - 1500) * 200 * 15
          else if (roundedSales <= 2500) salesPart = 500 * 200 * 55 + 500 * 200 * 40 + 500 * 200 * 30 + 500 * 200 * 15 + (salesCalcAll - 2000) * 200 * 10
          else if (roundedSales <= 3000) salesPart = 500 * 200 * 55 + 500 * 200 * 40 + 500 * 200 * 30 + 500 * 200 * 15 + 500 * 200 * 10 + (salesCalcAll - 2500) * 200 * 5
          else salesPart = 500 * 200 * 55 + 500 * 200 * 40 + 500 * 200 * 30 + 500 * 200 * 15 + 500 * 200 * 10 + 500 * 200 * 5 + (salesCalcAll - 3000) * 200 * 5
        } else {
          if (roundedSales <= 500) salesPart = salesCalcAll * 200 * 55
          else if (roundedSales <= 1000) salesPart = 500 * 200 * 55 + (salesCalcAll - 500) * 200 * 8
          else if (roundedSales <= 1500) salesPart = 500 * 200 * 55 + 500 * 200 * 8 + (salesCalcAll - 1000) * 200 * 8
          else if (roundedSales <= 2000) salesPart = 500 * 200 * 55 + 500 * 200 * 8 + 500 * 200 * 8 + (salesCalcAll - 1500) * 200 * 5
          else if (roundedSales <= 2500) salesPart = 500 * 200 * 55 + 500 * 200 * 8 + 500 * 200 * 8 + 500 * 200 * 5 + (salesCalcAll - 2000) * 200 * 3
          else if (roundedSales <= 3000) salesPart = 500 * 200 * 55 + 500 * 200 * 8 + 500 * 200 * 8 + 500 * 200 * 5 + 500 * 200 * 3 + (salesCalcAll - 2500) * 200 * 3
          else salesPart = 500 * 200 * 55 + 500 * 200 * 8 + 500 * 200 * 8 + 500 * 200 * 5 + 500 * 200 * 3 + 500 * 200 * 3 + (salesCalcAll - 3000) * 200 * 3
        }
      
        let additionalPart = 0
        if (isPool) {
          if (salesCalcAll > 2000) {
            additionalPart = (salesCalcAll - 2000) * 200 * 2.5 + 1000 * 200 * 3.5 + 1000 * 200 * 11.5
          } else if (salesCalcAll > 1000) {
            additionalPart = (salesCalcAll - 1000) * 200 * 3.5 + 1000 * 200 * 11.5
          } else {
            additionalPart = salesCalcAll * 200 * 11.5
          }
        } else {
          if (salesCalcAll > 2000) {
            additionalPart = (salesCalcAll - 2000) * 200 * 2.5 + 1000 * 200 * 3.5 + 1000 * 200 * 7.7
          } else if (salesCalcAll > 1000) {
            additionalPart = (salesCalcAll - 1000) * 200 * 3.5 + 1000 * 200 * 11.5
          } else {
            additionalPart = salesCalcAll * 200 * 7.7
          }
        }
      
        const finalPart = Math.max(salesCalcAll * 200 * 2.5, 300_000)
        const total = (salesPart + additionalPart + finalPart) / 1_000_000
      
        return total
      }
          
      return 0
    }    


    
    if (구분 === '판관비') {
      const prev = row.전일까지누계 ?? 0
      const volume = calculateValue({ 구분: '판매량', 계정: '전체' })
      const unitCost = row['리터당'] ?? 0

      //  1. 리터당 계산 계정
      if (['카드수수료', '기타수수료', '수송비'].includes(계정)) {
        return volume * 200 * Number(unitCost|| 0) / 1_000_000
      }

      //  2. 단순 일수 보정 계정
      if (
        [
          '판매촉진비', '광고선전비', '수선유지비', '소모품비',
          '자가소비', '제세공과금', '지급임차료', '유형감가상각비', '기타'
        ].includes(계정)
      ) {
        return Number(prev|| 0) / day * lastDay
      }
      //  3. 위탁수수료 (추정 로직, 보정 필요시 조율)
      if (구분 === '판관비' && 계정 === '위탁수수료') {

        const etcUtilityRow = data.find(d => d.구분 === '위탁수수료' && d.계정 === '전기/용수비')
        const etcMiscRow = data.find(d => d.구분 === '위탁수수료' && d.계정 === '기타')
        const carWashSupportRow = data.find(d => d.구분 === '위탁수수료' && d.계정 === '세차지원비')
        const salesRelatedRow = data.find(d => d.구분 === '위탁수수료' && d.계정 === '판매관련')
        
        const etcUtility = etcUtilityRow ? calculateValue(etcUtilityRow) : 0
        const etcMisc = etcMiscRow ? calculateValue(etcMiscRow) : 0
        const carWashSupport = carWashSupportRow ? calculateValue(carWashSupportRow) : 0
        const salesRelatedFee = salesRelatedRow ? calculateValue(salesRelatedRow) : 0
        
        const consignmentFee = etcUtility + etcMisc + carWashSupport + salesRelatedFee

        return consignmentFee
      }
      // 4. 전체 합산
      if (계정 === '전체') {
        const codes = [
          '판매촉진비', '광고선전비', '수선유지비', '소모품비', '자가소비',
          '제세공과금', '지급임차료', '유형감가상각비', '기타',
          '카드수수료', '기타수수료', '수송비', '위탁수수료'
        ]
        return codes.reduce((sum, code) => {
          const rowData = data.find(d => d.구분 === '판관비' && d.계정 === code)
          if (!rowData) return sum
          const val = calculateValue(rowData)
          return sum + (isNaN(val) ? 0 : val)
        }, 0)
      }

      return 0
    }

    if (구분 === '매출할인' && 계정 === '헷징(1)') {
      const volume = calculateValue({ 구분: '판매량', 계정: '전체' }) ?? 0
      const rate = row['리터당'] ?? 0
      const result = volume * 200 * Number(rate|| 0) / 1_000_000
    
    
      return result
    }
    
    if (구분 === '원가조정' && 계정 === '헷징(2)') {
      const volume = calculateValue({ 구분: '판매량', 계정: '전체' }) ?? 0
      const rate = row['리터당'] ?? 0
      const result = volume * 200 * Number(rate|| 0) / 1_000_000


      return result
    }

    if (구분 === '헷징' && 계정 === '헷징') {
      const volume = calculateValue({ 구분: '판매량', 계정: '전체' }) ?? 0
      const rate = row['리터당'] ?? 0
      const result = volume * 200 * Number(rate|| 0) / 1_000_000
    
    
      return result
    }
    
    if (구분 === '영업이익1' && 계정 === '전체') {
      const salesProfit = calculateValue({ 구분: '매출이익', 계정: '전체' }) ?? 0
      const adminExpense = calculateValue({ 구분: '판관비', 계정: '전체' }) ?? 0
      const result = salesProfit - adminExpense
        
      return result
    }
    
    if (구분 === '영업이익1(헷징제외)' && 계정 === '전체') {
      const salesProfit = calculateValue({ 구분: '매출이익', 계정: '전체' }) ?? 0
      const adminExpense = calculateValue({ 구분: '판관비', 계정: '전체' }) ?? 0

      const hedgingRow = data.find(d => d.구분 === '헷징' && d.계정 === '헷징')
      const hedging = hedgingRow ? calculateValue(hedgingRow) : 0
    
      const result = salesProfit - adminExpense - hedging
        
      return result
    }
    
    if (구분 === '영업외수익') {
      const prev = row.전일까지누계 ?? 0
    
      return Number(prev|| 0) / day * lastDay
    }
    
    if (구분 === '영업외수익' && 계정 === '전체') {
      const codes = ['임대수입', '기타이자수익', '수선비보전', '카드리베이트']
      const total = codes.reduce((sum, code) => {
        const rowData = data.find(d => d.구분 === '영업외수익' && d.계정 === code)
        if (!rowData) return sum
        const val = calculateValue(rowData)
        return sum + (isNaN(val) ? 0 : val)
      }, 0)

      return total
    }
    
    if (구분 === '영업외비용') {
      const prev = row.전일까지누계 ?? 0
      return Number(prev|| 0) / day * lastDay
    }
    
    if (구분 === '영업외비용' && 계정 === '전체') {
      const codes = ['이자비용', '기타비용', '금융수수료']  // 필요시 계정명 수정
      const total = codes.reduce((sum, code) => {
        const rowData = data.find(d => d.구분 === '영업외비용' && d.계정 === code)
        if (!rowData) return sum
        const val = calculateValue(rowData)
        return sum + (isNaN(val) ? 0 : val)
      }, 0)
    

      return total
    }
    
    if (구분 === 'MPP(EPP+)') {
      const opIncome = calculateValue({ 구분: '영업이익1', 계정: '전체' }) ?? 0

      const nonOpIncomeRow = data.find(d => d.구분 === '영업외수익' && d.계정 === '전체')
      const nonOpExpenseRow = data.find(d => d.구분 === '영업외비용' && d.계정 === '전체')
      
      const nonOpIncome = nonOpIncomeRow ? calculateValue(nonOpIncomeRow) : 0
      const nonOpExpense = nonOpExpenseRow ? calculateValue(nonOpExpenseRow) : 0
    
      const result = opIncome + nonOpIncome - nonOpExpense
      return result
    }

    if (구분 === 'MPP(EPP+)(헷징제외)') {
      const opIncome = calculateValue({ 구분: '영업이익1', 계정: '전체' }) ?? 0

      const nonOpIncomeRow = data.find(d => d.구분 === '영업외수익' && d.계정 === '전체')
      const nonOpExpenseRow = data.find(d => d.구분 === '영업외비용' && d.계정 === '전체')
      const hedgingRow = data.find(d => d.구분 === '헷징' && d.계정 === '헷징')
      
      const nonOpIncome = nonOpIncomeRow ? calculateValue(nonOpIncomeRow) : 0
      const nonOpExpense = nonOpExpenseRow ? calculateValue(nonOpExpenseRow) : 0
      const hedging = hedgingRow ? calculateValue(hedgingRow) : 0
  
      const result = opIncome + nonOpIncome - nonOpExpense - hedging
      return result
    }

    return Number(row.rsp_계획 ?? 0)
  }

  const salesCalcAll = calculateValue({ 구분: '판매량', 계정: '전체' }) ?? 0
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
      <h1 className="text-lg font-bold">손익추정</h1>
      {isLoading ? (
        <p className="text-sm text-gray-500">데이터를 불러오는 중입니다...</p>
      ) : (
        // {/* 판매량 카드 */}
        <div className="rounded-xl border bg-white shadow-sm p-4 mt-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-base font-semibold text-gray-800">손익 요약 테이블</h2>
            <span className="text-sm text-gray-500">단위: DM / 백만원</span>
          </div>
          <div className="overflow-auto rounded-md border">
            <table className="min-w-full text-sm text-center">
              <thead className="bg-indigo-100 text-gray-800">
                <tr>
                  <th className="p-2 border-b">구분</th>
                  <th className="p-2 border-b">직전1년(월평균)</th>
                  <th className="p-2 border-b">당월추정①</th>
                  <th className="p-2 border-b">당월추정②</th>
                  <th className="p-2 border-b">증감</th>
                  <th className="p-2 border-b">직전1년 대비</th>
                </tr>
              </thead>
              <tbody>
                {data
                  .filter(row =>
                    row.계정 === '전체' &&
                    ['판매량', '판매마진', '유류매출이익', '판관비', '영업이익1(헷징제외)', 'MPP(EPP+)(헷징제외)'].includes(row.구분)
                  )
                  .map((row, i) => {
                    const value = calculateValue(row)
                    const lastYear = Number(row['직전1년']) || 0
                    const est = Number(row['월말추정']) || 0
                    const diff = value - est
                    const diffVsLast = value - lastYear
                    const isHighlight = row.구분 === '판매량' // 하이라이트 기준

                    return (
                      <tr
                        key={`summary-${i}`}
                        className={`border-t ${isHighlight ? 'bg-yellow-50 font-semibold' : 'hover:bg-indigo-50'}`}
                      >
                        <td className="p-2 border-b">{row.구분}</td>
                        <td className="p-2 border-b">{formatDecimal(lastYear)}</td>
                        <td className="p-2 border-b">{formatDecimal(est)}</td>
                        <td className="p-2 border-b text-indigo-700 font-semibold">{formatDecimal(value)}</td>
                        <td className="p-2 border-b">{formatDecimal(diff)}</td>
                        <td className="p-2 border-b">{formatDecimal(diffVsLast)}</td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>

      )}
      {/* 하단 버튼 */}
      <div className="flex justify-between pt-2">
        <Link href={`/salesinput/?station=${station}&margin=${encodedMargin}&stationName=${stationName}`}>
          <Button variant="outline" className="text-sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            증감입력 화면
          </Button>
        </Link>
        <Link href={`/detail?station=${station}&sales=${encodedSales}&margin=${encodedMargin}&stationName=${stationName}`}>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
            손익추정 상세보기 <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>   
     
    </main>
  )
}
