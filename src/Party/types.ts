export type task = {
  id?: string,
  script: string,
  priority?: number,
  regionName: string,
  regionIdentifier: string
  meta: { [key: string]: any }
}
