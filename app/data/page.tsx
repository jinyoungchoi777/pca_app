import axios from "axios";
import https from "https";

export default async function DataPage() {
  const EQR_BASE_URL = "https://eqr.oilbank.co.kr";
  const ONTOLOGY = "hyundaioilbank-ontology";
  const rawObjectType = "직영_세부경제성".trim();
  const OBJECT_TYPE = encodeURIComponent(rawObjectType);

  const url = `${EQR_BASE_URL}/api/v2/ontologies/${ONTOLOGY}/objects/${OBJECT_TYPE}`;
  
  try {
    const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${process.env.EQR_FOUNDRY_TOKEN}`,
        },
        params: {
          pageSize: 15,
        },
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
      });
      

    const data = response.data;

    return (
      <main className="p-4">
        <h1 className="text-xl font-bold mb-4">데이터 결과</h1>
        <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(data, null, 2)}</pre>
      </main>
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("⚠️ Error fetching data:", error.message);
    } else {
      console.error("⚠️ Error fetching data:", error);
    }
    return <div className="p-4 text-red-500">Error: Unable to fetch data.</div>;
  }
  
}
