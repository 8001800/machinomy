import ChannelId from '../../ChannelId'
import EnginePostgres from './EnginePostgres'
import AbstractTokensDatabase from '../AbstractTokensDatabase'

export default class PostgresTokensDatabase extends AbstractTokensDatabase<EnginePostgres> {
  save (token: string, channelId: ChannelId | string, meta: string): Promise<void> {
    return this.engine.exec((client: any) => client.query(
      'INSERT INTO token(token, "channelId", kind, meta) VALUES ($1, $2, $3, $4)',
      [
        token,
        channelId.toString(),
        this.kind,
        meta
      ]
    ))
  }

  isPresent (token: string): Promise<boolean> {
    return this.engine.exec((client: any) => client.query(
      'SELECT COUNT(*) as count FROM token WHERE token=$1',
      [
        token
      ]
    )).then((res: any) => (res.rows[0].count > 0))
  }
}
