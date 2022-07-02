import Loop from './Loop.js'
import { calculatePotionItems } from '../../helpers/index.js'
import BankItems from '../../Task/BankItems.js'

export default class InventoryFullLoop extends Loop {
  async loop (): Promise<void> {
    if (this.bot.character.esize <= 0) {
      const { hpot, mpot } = calculatePotionItems(this.bot.character.level)
      const args = {
        itemsToHold: [hpot, mpot, 'tracker'],
        goldToHold: 1000000
      }
      const Task = new BankItems(this.bot, 1, this.bot.getServerIdentifier(), this.bot.getServerRegion(), [], [], args)
      this.bot.queue.addTask(Task)
    }
  }
}
