import Loop from './Loop.js'
import { calculatePotionItems } from '../../helpers/index.js'
import BuyPotions from '../../Task/BuyPotions.js'

export default class BuyPotionLoop extends Loop {
  checkIfPotionsLow (amount) {
    const { hpot, mpot } = calculatePotionItems(this.bot.character.level)
    const hpotCount = this.bot.character.countItem(hpot)
    const mpotCount = this.bot.character.countItem(mpot)

    if (hpotCount >= amount && mpotCount >= amount) return false
    return true
  }

  async loop (): Promise<void> {
    const { hpot, mpot } = calculatePotionItems(this.bot.character.level)
    const hpotCount = this.bot.character?.countItem(hpot)
    const mpotCount = this.bot.character?.countItem(mpot)

    if (hpotCount < 200) {
      if (this.bot.character && this.bot.character.canBuy(hpot)) {
        await this.bot.character.buy(hpot, 200 - hpotCount).catch(() => {})
      }
    }
    if (mpotCount < 200) {
      if (this.bot.character && this.bot.character.canBuy(mpot)) {
        await this.bot.character.buy(mpot, 200 - mpotCount).catch(() => {})
      }
    }

    if (this.checkIfPotionsLow(20)) {
      const Task = new BuyPotions(this.bot, 5, this.bot.getServerIdentifier(), this.bot.getServerRegion())
      this.bot.queue.addTask(Task)
    }
  }
}
