
import { IPosition, ItemData, ServerIdentifier, ServerRegion } from 'alclient'
import Bot from '../Bot/index.js'
import { findWithdrawBank } from '../helpers/index.js'
import Task from './index.js'
import { taskArgs } from '../types/index.js'

export default class WithdrawItems extends Task {
  bankingPosition: IPosition
  items: Array<ItemData>
  constructor (bot: Bot, priority: number, serverIdentifier: ServerIdentifier, serverRegion: ServerRegion, onStartTasks: Array<Task> = [], onRemoveTasks: Array<Task> = [], args: taskArgs = {}) {
    super(bot, priority, serverIdentifier, serverRegion, onStartTasks, onRemoveTasks, args)
    this.bankingPosition = { map: 'bank', x: 0, y: -200 }
    this.items = args.items || []
  }

  async loop (): Promise<void> {
    await this.bot.easyMove(this.bankingPosition).catch(() => {})
    await findWithdrawBank(this.bot, this.items)
    if (this.bot.character.gold < this.bot.goldToHold) {
      await this.bot.character.withdrawGold(this.bot.goldToHold - this.bot.character.gold)
    }
    await this.removeFromQueue()
  }
}
