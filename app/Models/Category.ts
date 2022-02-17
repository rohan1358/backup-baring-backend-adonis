import { DateTime } from 'luxon'
import { BaseModel, column, ManyToMany, manyToMany } from '@ioc:Adonis/Lucid/Orm'
import Content from './Content'

export default class Category extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @manyToMany(() => Content)
  public contents: ManyToMany<typeof Content>

  @column({
    serialize: (value: string) => {
      if (!value) {
        return null
      }
      return '/api/stream/icon/' + value
    },
  })
  public icon: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  public serializeExtras() {
    return {
      contents_count: Number(this.$extras.contents_count),
    }
  }
}
