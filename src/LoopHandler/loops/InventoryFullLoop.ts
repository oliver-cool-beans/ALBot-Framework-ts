import Loop from './Loop.js'
import { calculatePotionItems } from '../../helpers/index.js'
import BankItems from '../../Task/BankItems.js'
import { ItemData } from 'alclient'

export default class InventoryFullLoop extends Loop {
  findLimitedItem (item: ItemData, itemLimitConfig) {
    return item &&
    itemLimitConfig.find((limitedItem) => limitedItem.name === item.name && limitedItem.level === item.level && limitedItem.q <= (item.q || 0))
  }

  getBankTask () {
    const { hpot, mpot } = calculatePotionItems(this.bot.character.level)
    const args = {
      itemsToHold: [hpot, mpot, 'tracker'],
      goldToHold: 1000000
    }
    return new BankItems(this.bot, 1, this.bot.getServerIdentifier(), this.bot.getServerRegion(), [], [], args)
  }

  async loop (): Promise<void> {
    if (this.bot.character.esize <= 0) {
      const Task = this.getBankTask()
      this.bot.queue.addTask(Task)
    }

    const { itemLimits = [] } = this.bot.config
    if (!itemLimits.length) return

    if (this.bot.character.items.find((item) => this.findLimitedItem(item, itemLimits))) {
      const Task = this.getBankTask()
      this.bot.queue.addTask(Task)
    }
  }
}
