'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

// 주유소 타입 정의
interface GasStation {
  label: string
  value: string
}

// Context 타입 정의
interface GasStationContextType {
  selectedStation: GasStation | null
  setSelectedStation: (station: GasStation | null) => void
}

// 초기값 설정
const GasStationContext = createContext<GasStationContextType | undefined>(undefined)

export const GasStationProvider = ({ children }: { children: ReactNode }) => {
  const [selectedStation, setSelectedStation] = useState<GasStation | null>(null)

  return (
    <GasStationContext.Provider value={{ selectedStation, setSelectedStation }}>
      {children}
    </GasStationContext.Provider>
  )
}

// Context 값 사용을 위한 custom hook
export const useGasStation = () => {
  const context = useContext(GasStationContext)
  if (!context) {
    throw new Error('useGasStation must be used within a GasStationProvider')
  }
  return context
}
