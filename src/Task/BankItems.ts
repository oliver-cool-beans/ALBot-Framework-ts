
import { IPosition, ItemName, ServerIdentifier, ServerRegion } from 'alclient'
import Bot from '../Bot/index.js'
import { bankItems } from '../helpers/index.js'
import Task from './index.js'
import { taskArgs } from '../types/index.js'

export default class BankItems extends Task {
  itemsToHold: Array<ItemName>
  goldToHold: number
  nextPosition: IPosition | undefined
  bankingPosition: IPosition
  constructor (bot: Bot, priority: number, serverIdentifier: ServerIdentifier, serverRegion: ServerRegion, onStartTasks: Array<Task> = [], onRemoveTasks: Array<Task> = [], args: taskArgs = {}) {
    super(bot, priority, serverIdentifier, serverRegion, onStartTasks, onRemoveTasks, args)
    this.itemsToHold = args.itemsToHold
    this.goldToHold = args.goldToHold
    this.bankingPosition = { map: 'bank', x: 0, y: -200 }
  }

  async loop (): Promise<void> {
    await this.bot.easyMove(this.bankingPosition).catch(() => {})
    await bankItems(this.bot, this.itemsToHold)
    if (this.bot.character.gold >= this.bot.goldToHold) {
      await this.bot.character.depositGold(this.bot.character.gold - this.bot.goldToHold)
    }
    await this.removeFromQueue()
  }
}
