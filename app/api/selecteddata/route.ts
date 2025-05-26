import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import https from "https";
interface DataRow {
  [key: string]: string | number | null | undefined;
}

const EQR_BASE_URL = "https://eqr.oilbank.co.kr";
const ONTOLOGY = "hyundaioilbank-ontology";
const OBJECT_TYPE = "직영_세부경제성";
const PAGE_SIZE = 1000;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const station = searchParams.get("station");
    const type = searchParams.get("type");

    const url = `${EQR_BASE_URL}/api/v2/ontologies/${ONTOLOGY}/objects/${encodeURIComponent(OBJECT_TYPE)}`;

    const headers = {
      Authorization: `Bearer ${process.env.EQR_FOUNDRY_TOKEN}`,
      "User-Agent": "PostmanRuntime/7.32.3",
      Accept: "*/*",
      "Accept-Encoding": "gzip, deflate, br",
      Connection: "keep-alive",
      "Content-Type": "application/json",
    };

    let nextPageToken: string | null = null;
    let allItems: DataRow[] = [];

    while (true) {
      const params: Record<string, string | number> = {
        pageSize: PAGE_SIZE,
      };      
      if (nextPageToken) {
        params.pageToken = nextPageToken;
      }

      const response = await axios.get(url, {
        headers,
        params,
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      });

      const items = response.data?.data || [];
      
      allItems = [...allItems, ...items];

      nextPageToken = response.data?.nextPageToken || null;
      if (!nextPageToken) break; // 더 이상 페이지 없음
    }

    

    // ✅ 필터링: station과 type(구분)
    
    const filteredItems = allItems.filter((item: DataRow) => {
        const stationMatch = station
          ? item?.["주유소코드"]?.toString() === station
          : true;
        const typeMatch = type
          ? item?.["구분"] === type
          : true; // type이 없으면 모두 허용
        return stationMatch && typeMatch;
      });


    return NextResponse.json(filteredItems);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("데이터 수집/필터링 실패:", error.message);
    } else {
      console.error("데이터 수집/필터링 실패: 알 수 없는 에러");
    }
  }
}
