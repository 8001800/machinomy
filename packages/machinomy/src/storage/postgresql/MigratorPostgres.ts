import IMigrator from '../IMigrator'
import EnginePostgres from './EnginePostgres'
import * as fs from 'fs'
const DBMigrate = require('db-migrate')
const dbmigrate = DBMigrate.getInstance(true, { cwd: '../../../migrations', config: __dirname + '/../../../database.json' })
const LENGTH_OF_MIGRATION_NAME = 14

export default class MigratorPostgres implements IMigrator {
  engine: EnginePostgres

  constructor (engine: EnginePostgres) {
    this.engine = engine
  }

  isLatest (): Promise<boolean> {
    return new Promise(async (resolve) => {
      const commonIndex: number = await this.getCommonIndex()
      if (commonIndex === -1) {
        resolve(true)
      } else {
        resolve(false)
      }
    })
  }

  sync (n?: string): Promise<void> {
    return new Promise(async (resolve) => {
      if (n !== undefined) {
        if (n.length === LENGTH_OF_MIGRATION_NAME) {
          dbmigrate.sync(n)
        } else {
          console.error('DB migration name must have ' + LENGTH_OF_MIGRATION_NAME + ' chars. But got ' + n.length)
        }
      } else {
        dbmigrate.sync()
      }
      resolve()
    })
  }

  private async getCommonIndex (): Promise<number> {
    const migrationsInDB = await this.retrieveUpMigrationList()
    const migrationsInFolder = await this.retrieveInFolderMigrationList()
    let commonIndex = -1
    for (let i = 0; i < migrationsInFolder.length; i++) {
      if (migrationsInDB[i] !== migrationsInFolder[i]) {
        commonIndex = i
        break
      }
    }

    return Promise.resolve(commonIndex)
  }

  private retrieveUpMigrationList (): Promise<string[]> {
    return new Promise((resolve) => {
      // tslint:disable-next-line:no-floating-promises
      this.engine.exec((client: any) => client.query(
        'SELECT name FROM migrations ORDER BY name ASC'
      )).then((res: any) => {
        const names: string[] = res.rows
        let result: string[] = []
        for (let migrationName in names) {
          result.push(migrationName.substring(1))
        }
        resolve(result)
      })
    })
  }

  private retrieveInFolderMigrationList (): Promise<string[]> {
    return new Promise(async (resolve) => {
      let result: string[] = []
      const listOfFiles: string[] = fs.readdirSync(__dirname + '/../../../migrations/')
      for (let filename in listOfFiles) {
        const isDir = fs.statSync(filename).isDirectory()
        if (!isDir) {
          filename = filename.slice(0, -3)
          result.push(filename)
          console.log('debug::DB migration file: ' + filename)
        }
      }
      result = result.sort((a: string, b: string) => a.localeCompare(b))
      resolve(result)
    })
  }
}
