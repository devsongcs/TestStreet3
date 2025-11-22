export type Field = {
  id: string
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

export type FieldConfig = {
  title: string
  dataCnt: number
  format: 'JSON' | 'CSV'
  fields: Field[]
}

