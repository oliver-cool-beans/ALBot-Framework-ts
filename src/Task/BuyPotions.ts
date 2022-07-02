
import Task from './index.js'

export default class BuyPotions extends Task {
  async loop (): Promise<void> {
    await this.bot.easyMove('fancypots', { avoidTownWarps: true, getWithin: this.bot.AL.Constants.NPC_INTERACTION_DISTANCE / 2 })
      .catch(() => {})
    await this.bot.wait(2)
    await this.removeFromQueue()
  }
}
