type Field = {
  name: string
  type: string
  options?: {
    minLength?: number
    maxLength?: number
    minValue?: number
    maxValue?: number
    decimal?: number
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

export async function createTestDatas(fields: Field[], dataCnt = 10, resultType = 'JSON') {
  const body = fields.map((f) => {
    const backendType = TypeNameMap[f.type] ?? f.type
    return {
      name: f.name,
      dataType: DataTypeMap[backendType] ?? 3,
      options: {
        formatType: 0,
        minLength: f.options?.minLength ?? 0,
        maxLength: f.options?.maxLength ?? 0,
        minValue: f.options?.minValue ?? 0,
        maxValue: f.options?.maxValue ?? 0,
        decimal: f.options?.decimal ?? 0,
      },
    }
  })

  const rt = resultType === 'CSV' ? 0 : 1

  const url = `/Api/testdatas?dataCnt=${encodeURIComponent(String(dataCnt))}&resultType=${encodeURIComponent(String(rt))}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API error: ${res.status} ${text}`)
  }

  // If backend returns CSV as string when CSV selected, or JSON when JSON selected.
  if (resultType === 'CSV') {
    const txt = await res.text()
    return { csv: txt }
  }

  const json = await res.json()
  return json
}
