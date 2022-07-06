import { Constants, ItemData, ServerIdentifier, ServerRegion } from 'alclient'
import Bot from '../Bot/index.js'
import Task from './index.js'
import { taskArgs } from '../types/index.js'
import { findClosestVendor } from '../helpers/index.js'

export default class BuyItems extends Task {
  itemsToBuy: Array<ItemData>
  constructor (bot: Bot, priority: number, serverIdentifier: ServerIdentifier, serverRegion: ServerRegion, onStartTasks: Array<Task> = [], onRemoveTasks: Array<Task> = [], args: taskArgs = {}) {
    super(bot, priority, serverIdentifier, serverRegion, onStartTasks, onRemoveTasks, args)
    this.itemsToBuy = args.itemsToBuy
  }

  async loop (): Promise<void> {
    const character = this.bot.character
    let vendor, craftQty
    for (const i in this.itemsToBuy) {
      vendor = findClosestVendor(this.bot, this.itemsToBuy[i].name)
      if (!vendor?.npc?.id) {
        this.bot.logger.warn(`${this.bot.name} cannot find vendor for item ${this.itemsToBuy[i].name}`)
        continue
      }
      await this.bot.easyMove(vendor.npc.id, { getWithin: Constants.NPC_INTERACTION_DISTANCE })
      if (!character.canBuy(this.itemsToBuy[i].name)) {
        this.bot.logger.warn(`${this.bot.name} Cannot buy ${this.itemsToBuy[i].name}`)
        continue
      }
      craftQty = this.itemsToBuy[i].q || 1

      for (let count = 0; count < craftQty; count++) {
        await character.buy(this.itemsToBuy[i].name).catch(() => {})
      }
    }

    this.removeFromQueue()
  }
}
