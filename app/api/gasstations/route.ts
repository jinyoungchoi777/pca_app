// app/api/gasstations/route.ts
import { NextResponse } from 'next/server'
import axios from 'axios'
import https from 'https'

export async function GET() {
  try {
    const url =
      "https://eqr.oilbank.co.kr/api/v2/ontologies/hyundaioilbank-ontology/objects/%EC%A7%81%EC%98%81_%EC%84%B8%EB%B6%80%EA%B2%BD%EC%A0%9C%EC%84%B1"

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${process.env.EQR_FOUNDRY_TOKEN}`,
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    })

    const data = response.data?.data || []
    return NextResponse.json(data)
    
  } catch (err) {
    console.error('📛 전체 데이터 로딩 실패:', err)
    console.log("🔑 TOKEN:", process.env.EQR_FOUNDRY_TOKEN);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })

  }
}
