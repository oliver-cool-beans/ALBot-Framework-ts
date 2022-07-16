import Loop from './Loop.js'
import WithdrawItems from '../../Task/WithdrawItems.js'
import BankItems from '../../Task/BankItems.js'
import Bot from '../../Bot/index.js'
import { calculatePotionItems } from '../../helpers/index.js'

export default class GoldWithdrawLoop extends Loop {
  constructor (bot: Bot) {
    super(bot)
    this.timeout = 5
  }

  async loop (): Promise<void> {
    const { character } = this.bot
    const { hpot, mpot } = calculatePotionItems(character.level)
    const args = {
      goldToHold: this.bot.goldToHold,
      itemsToHold: [hpot, mpot, 'tracker']
    }

    if (character.gold >= this.bot.goldToHold * 10) {
      const BankItemsTask = new BankItems(this.bot, 0, this.bot.getServerIdentifier(), this.bot.getServerRegion(), [], [], args)
      this.bot.queue.addTask(BankItemsTask)
    }

    if (character.gold < this.bot.goldToHold) {
      const WithdrawItemsTask = new WithdrawItems(this.bot, 0, this.bot.getServerIdentifier(), this.bot.getServerRegion(), [], [], args)
      this.bot.queue.addTask(WithdrawItemsTask)
    }
  }
}
