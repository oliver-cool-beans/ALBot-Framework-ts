
import { ItemData, ServerIdentifier, ServerRegion } from 'alclient'
import Bot from '../Bot/index.js'
import Task from './index.js'
import { taskArgs } from '../types/index.js'
import { findWithdrawBank, bankItems } from '../helpers/index.js'

export default class FindAndRecycle extends Task {
  items: Array<ItemData>
  constructor (bot: Bot, priority: number, serverIdentifier: ServerIdentifier, serverRegion: ServerRegion, onStartTasks: Array<Task> = [], onRemoveTasks: Array<Task> = [], args: taskArgs = {}) {
    super(bot, priority, serverIdentifier, serverRegion, onStartTasks, onRemoveTasks, args)
    this.items = args.items || []
  }

  isInInventory (item: ItemData): Boolean {
    return !!this.bot.character.items.find((invItem) => {
      return invItem &&
      invItem.name === item.name &&
      invItem.level === item.level &&
      (invItem.q || 1) >= (item.q || 1)
    })
  }

  async loop (): Promise<any> {
    const { character } = this.bot
    const bank = character.bank || this.bot.party.getBank(character.owner)
    if (!bank) return await this.bot.easyMove({ map: 'bank', x: 0, y: -200 })

    this.bot.logger.info(`${this.bot.name} recycling these items ${JSON.stringify(this.items)}`)
    await findWithdrawBank(this.bot, this.items)

    let item: ItemData
    for (const i in character.items) {
      item = character.items[i]
      console.log('looping', item)
      if (!item) continue
      if (!this.items.find((i) => item.name === i.name && item.level === i.level)) continue
      await this.bot.easyMove('craftsman').catch(() => {})
      character.socket.emit('dismantle', { num: i })
      await this.bot.wait(3)
    }

    await this.bot.easyMove('bank').catch(() => {})
    await bankItems(this.bot, this.bot.itemsToHold)
    return await this.removeFromQueue()
  }
}
