export default interface IMigrator {
  isLatest (): Promise<boolean>
  up (n?: any): Promise<void>
  down (n?: any): Promise<void>
}
