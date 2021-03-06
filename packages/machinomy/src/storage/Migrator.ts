import IEngine from './IEngine'
import IMigrator from './IMigrator'
import * as fs from 'fs'
import { ConnectionString } from 'connection-string'
import * as DBMigrate from 'db-migrate'

const LENGTH_OF_MIGRATION_NAME = 14

export default class Migrator implements IMigrator {
  engine: IEngine
  migrationsPath: string
  dbmigrate: any

  constructor (engine: IEngine, connectionString: string, migrationsPath: string) {
    this.engine = engine
    const dbMigrateConfig = Migrator.generateConfigObject(connectionString)
    this.dbmigrate = DBMigrate.getInstance(true, dbMigrateConfig)
    this.migrationsPath = migrationsPath
    if (this.migrationsPath.endsWith('/') !== true) {
      this.migrationsPath += '/'
    }
  }

  static generateConfigObject (connectionUrl: string) {
    const driversMap = new Map<string, string>()
    driversMap.set('postgresql', 'pg')
    driversMap.set('sqlite', 'sqlite3')
    const connectionObject = new ConnectionString(connectionUrl)
    let result: DBMigrate.InstanceOptions = {}
    switch (process.env.DB_URL!.split('://')[0]) {
      case 'sqlite': {
        result = {
          cmdOptions: {
            'migrations-dir': './migrations/sqlite'
          },
          config: {
            defaultEnv: 'defaultSqlite',
            defaultSqlite: {
              driver: `${driversMap.get(connectionObject.protocol!)}`,
              filename: `${connectionObject.hostname}`
            }
          }
        }
        break
      }
      case 'postgresql': {
        result = {
          cmdOptions: {
            'migrations-dir': './migrations/postgresql'
          },
          config: {
            defaultEnv: 'defaultPg',
            defaultPg: {
              driver: `${driversMap.get(connectionObject.protocol!)}`,
              user: `${connectionObject.user}`,
              password: `${connectionObject.password}`,
              host: `${connectionObject.hostname}`,
              database: `${connectionObject.segments![0]}`
            }
          }
        }
        break
      }
    }
    return result
  }

  async isLatest (): Promise<boolean> {
    return this.dbmigrate.check()
  }

  async sync (n?: string): Promise<void> {
    if (n !== undefined) {
      this.dbmigrate.sync(n)
    } else {
      const migrationsInFolder = await this.retrieveInFolderMigrationList()
      const lastMigrationInFolderName = migrationsInFolder[migrationsInFolder.length - 1].substring(0, LENGTH_OF_MIGRATION_NAME)
      this.dbmigrate.sync(lastMigrationInFolderName)
    }
  }

  async retrieveInFolderMigrationList (): Promise<string[]> {
    let result: string[] = []
    const listOfFiles: string[] = fs.readdirSync(this.migrationsPath)
    for (let filename of listOfFiles) {
      const isDir = fs.statSync(this.migrationsPath + filename).isDirectory()
      if (!isDir) {
        result.push(filename.slice(0, -3))
      }
    }
    result.sort()
    return result
  }
}
