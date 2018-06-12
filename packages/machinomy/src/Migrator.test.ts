import * as fs from 'fs'
import EngineSqlite from './storage/sqlite/EngineSqlite'
import * as support from './support'

const DBMigrate = require('db-migrate')
const dbmigrate = DBMigrate.getInstance(true, { cwd: '../migrations', config: __dirname + '/../database.json' })

function showMigrationsInFolder () {
  let result: string[] = []
  const listOfFiles: string[] = fs.readdirSync(__dirname + '/../migrations/')
  console.log('debug::' + __dirname + '/../migrations/')
  for (let filename of listOfFiles) {
    const isDir = fs.statSync(__dirname + '/../migrations/' + filename).isDirectory()
    if (!isDir) {
      result.push(filename.slice(0, -3))
    }
  }
  result.sort()
  console.log('debug::DB migration files: ' + JSON.stringify(result))
}

describe('sqlite migrator', () => {
  let engine: EngineSqlite

  function showMigrationsInDB () {
    engine.connect().then(() => engine.exec((client: any) => client.run(
      'SELECT name FROM migrations ORDER BY name ASC'
      )).then((res: any) => {
        const names: string[] = res.rows
        let result: string[] = []
        for (let migrationName in names) {
          result.push(migrationName.substring(1))
        }
        console.log('IN DB: ' + result)
      })
    )
  }

  function addTestMigrationsToDB () {
    engine.connect().then(() => engine.exec((client: any) => client.run(
      'CREATE TABLE migrations'
      )).then((res: any) => {
        const names: string[] = res.rows
        let result: string[] = []
        for (let migrationName in names) {
          result.push(migrationName.substring(1))
        }
        console.log('IN DB: ' + result)
      })
    )
  }

  before(() => {
    return support.tmpFileName().then(filename => {
      engine = new EngineSqlite(filename)

      // dbmigrate.up()

      showMigrationsInFolder()
      showMigrationsInDB()
    })
  })

  after(() => {
    return engine.close()
  })

  afterEach(() => {
    return engine.drop()
  })

  describe('silent behaviour', () => {
    it('get Available Migrations In Folder', async () => {
      let listOfMigrations = await engine.migrate().retrieveInFolderMigrationList()
      console.log(listOfMigrations)
    })
  })
})
