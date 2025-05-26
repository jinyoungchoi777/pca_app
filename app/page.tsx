'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'

interface StationItem {
  주유소명?: string;
  주유소코드?: string | number;
}

type GasStationOption = {
  label: string
  value: string
}

export default function Home() {
  const [gasStations, setGasStations] = useState<GasStationOption[]>([])
  const [selected, setSelected] = useState<GasStationOption | null>(null)

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const res = await axios.get('/api/gasstations')
  
        const items = Array.isArray(res.data) ? res.data : []

        const mapped = items.map((item: StationItem) => ({
          label: item.주유소명 || '이름없음',
          value: item.주유소코드?.toString() || '코드없음',
        }))
        
        const unique = Array.from(
          new Map(mapped.map(item => [item.value, item])).values()
        )
        
        unique.sort((a, b) => a.label.localeCompare(b.label))
        
        setGasStations(unique)
        
      } catch (err) {
        console.error("주유소 목록 불러오기 실패:", err);
      }
    }
  
    fetchStations()
  }, [])
 

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
        <Image src="/HD_Hyundai_logo.png" alt="HDoilbank" width={160} height={80} className="mx-auto"/>
          <p className="text-sm text-muted-foreground">시뮬레이션할 주유소를 선택하세요</p>
        </div>

        <div className="flex justify-center items-center w-full">
          <Combobox
            options={gasStations}
            onChange={(value) => {
              const found = gasStations.find(g => g.value === value)
              setSelected(found || null)
            }}
            placeholder="주유소 선택"
          />
        </div>

        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center space-y-4 pt-2"
          >
            <p className="text-sm text-gray-700">
              선택한 주유소: <span className="font-semibold text-indigo-600">{selected.label}</span>
            </p>
            <Link href={`/salesinput?station=${selected.value}&stationName=${selected.label}`}>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
                시뮬레이션 시작
              </Button>
            </Link>
          </motion.div>
        )}
      </div>
    </main>
  )
}
