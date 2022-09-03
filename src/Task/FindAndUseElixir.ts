
import { ItemData, ServerIdentifier, ServerRegion } from 'alclient'
import Bot from '../Bot/index.js'
import Task from './index.js'
import { taskArgs } from '../types/index.js'
import { findWithdrawBank, bankItems } from '../helpers/index.js'

export default class FindAndUseElixir extends Task {
  elixirs: Array<ItemData>
  constructor (bot: Bot, priority: number, serverIdentifier: ServerIdentifier, serverRegion: ServerRegion, onStartTasks: Array<Task> = [], onRemoveTasks: Array<Task> = [], args: taskArgs = {}) {
    super(bot, priority, serverIdentifier, serverRegion, onStartTasks, onRemoveTasks, args)
    this.elixirs = args.elixirs || []
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
    if (character.map !== 'bank') {
      await this.bot.easyMove({ map: 'bank', x: 0, y: -200 })
      return await this.bot.wait(2)
    }

    const selectedElixir = this.elixirs[0]
    await findWithdrawBank(this.bot, [selectedElixir])

    if (!this.isInInventory(selectedElixir)) {
      this.bot.logger.error(`${this.bot.name} Attempted to use elixir ${selectedElixir.name}, but not found in inventory`)
      await bankItems(this.bot, this.bot.itemsToHold)
      return await this.removeFromQueue()
    }

    const elixirLocation = character.locateItem(selectedElixir.name)
    await character.equip(elixirLocation).catch(() => {})
    this.bot.logger.info(`${this.bot.name} equipped elixir ${selectedElixir.name}`)
    await this.removeFromQueue()
  }
}
