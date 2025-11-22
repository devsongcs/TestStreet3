type Field = {
  name: string
  type: string
  options?: {
    minLength?: number
    maxLength?: number
    minValue?: number
    maxValue?: number
    decimal?: number
    setTitle?: boolean
    pno?: string
  }
}

// Map client type names (Korean) to backend type names (English)
const TypeNameMap: Record<string, string> = {
  '라인 ID': 'LineId',
  '제품 ID': 'PartId',
  '스텝 ID': 'StepId',
  'String 데이터': 'CustomString',
  'Number 데이터': 'CustomNumber',
  'CustomString': 'CustomString',
  'CustomNumber': 'CustomNumber',
}

// Map client type names to backend DataType enum numeric values
const DataTypeMap: Record<string, number> = {
  LineId: 0, // StdLineId
  PartId: 1, // StdPartId
  StepId: 2, // StdStepId
  CustomString: 3, // CustomDataToString
  CustomNumber: 4, // CustomDataToNumber
}

export async function createTestDatas(fields: Field[], dataCnt = 10, resultType = 'JSON', fileName = '') {
  const body = fields.map((f) => {
    const backendType = TypeNameMap[f.type] ?? f.type
    return {
      name: f.name,
      dataType: DataTypeMap[backendType] ?? 3,
      options: {
        useTitle: f.options?.setTitle ?? false,
        pno: f.options?.pno ? parseInt(f.options.pno) : 0,
        formatType: 0,
        minLength: f.options?.minLength ?? 0,
        maxLength: f.options?.maxLength ?? 0,
        minValue: f.options?.minValue ?? 0,
        maxValue: f.options?.maxValue ?? 0,
        decimal: f.options?.decimal ?? 0,
      },
    }
  })

  const fileFormatType = resultType === 'CSV' ? 0 : 1 // FileFormatType: CSV=0, JSON=1

  const url = `/Api/generate-data?dataCnt=${encodeURIComponent(String(dataCnt))}&fileFormatType=${encodeURIComponent(String(fileFormatType))}&fileName=${encodeURIComponent(fileName)}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API error: ${res.status} ${text}`)
  }

  // 파일 다운로드 응답 처리
  const blob = await res.blob()
  const contentDisposition = res.headers.get('Content-Disposition')
  let downloadFileName = fileName || `dataset-${Date.now()}.${resultType.toLowerCase()}`
  
  if (contentDisposition) {
    console.log('Content-Disposition:', contentDisposition) // 디버깅용
    
    // RFC 5987 형식 (filename*=UTF-8''...) 또는 일반 형식 (filename="...") 처리
    const utf8Match = contentDisposition.match(/filename\*=UTF-8''(.+)/i)
    if (utf8Match) {
      downloadFileName = decodeURIComponent(utf8Match[1])
    } else {
      const fileNameMatch = contentDisposition.match(/filename="?([^";]+)"?/i)
      if (fileNameMatch) {
        downloadFileName = fileNameMatch[1].replace(/['"]/g, '')
      }
    }
  }
  
  console.log('Download file name:', downloadFileName) // 디버깅용

  // Blob을 다운로드
  const url_blob = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url_blob
  a.download = downloadFileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url_blob)

  return { success: true, fileName: downloadFileName }
}

// Preview API - 새로운 엔드포인트 사용
export async function previewTestData(fields: Field[], dataCnt = 10, fileName = '') {
  const body = fields.map((f) => {
    const backendType = TypeNameMap[f.type] ?? f.type
    return {
      name: f.name,
      dataType: DataTypeMap[backendType] ?? 3,
      options: {
        useTitle: f.options?.setTitle ?? false,
        pno: f.options?.pno ? parseInt(f.options.pno) : 0,
        formatType: 0,
        minLength: f.options?.minLength ?? 0,
        maxLength: f.options?.maxLength ?? 0,
        minValue: f.options?.minValue ?? 0,
        maxValue: f.options?.maxValue ?? 0,
        decimal: f.options?.decimal ?? 0,
      },
    }
  })

  const url = `/Api/pre-view?dataCnt=${encodeURIComponent(String(dataCnt))}&fileName=${encodeURIComponent(fileName)}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API error: ${res.status} ${text}`)
  }

  const json = await res.json()
  // API 응답이 { fileName, dataSets } 형태이므로 둘 다 반환
  return {
    fileName: json.fileName || '',
    dataSets: json.dataSets || json
  }
}

// CreateRule API
export async function createRule(rule: {
  title: string
  dataCount: number
  resultType: 'CSV' | 'JSON'
  useSchedule: boolean
  scheduleInterval: number
  scheduleType: 'hour' | 'day'
  fileName: string
  columns: Field[]
}) {
  const columns = rule.columns.map((f) => {
    const backendType = TypeNameMap[f.type] ?? f.type
    return {
      name: f.name,
      dataType: DataTypeMap[backendType] ?? 3,
      options: {
        useTitle: f.options?.setTitle ?? false,
        pno: f.options?.pno ? parseInt(f.options.pno) : 0,
        formatType: 0,
        minLength: f.options?.minLength ?? 0,
        maxLength: f.options?.maxLength ?? 0,
        minValue: f.options?.minValue ?? 0,
        maxValue: f.options?.maxValue ?? 0,
        decimal: f.options?.decimal ?? 0,
      },
    }
  })

  const body = {
    id: crypto.randomUUID(),
    title: rule.title,
    dataCount: rule.dataCount,
    resultType: rule.resultType === 'CSV' ? 0 : 1, // FileFormatType: CSV=0, JSON=1
    useSchedule: rule.useSchedule,
    scheduleInterval: rule.scheduleInterval,
    scheduleType: rule.scheduleType === 'hour' ? 0 : 1, // ScheduleType: Hour=0, Day=1
    fileName: rule.fileName,
    columns: columns,
  }

  const url = `/Api/create-rule`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API error: ${res.status} ${text}`)
  }

  const json = await res.json()
  return json
}

// GetRules API
export async function getRules() {
  const url = `/Api/get-rules`

  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API error: ${res.status} ${text}`)
  }

  const json = await res.json()
  return json
}

// DeleteRule API
export async function deleteRule(id: string) {
  const url = `/Api/delete-rule?id=${encodeURIComponent(id)}`

  const res = await fetch(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API error: ${res.status} ${text}`)
  }

  const json = await res.json()
  return json
}
