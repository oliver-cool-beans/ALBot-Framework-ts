import Loop from './Loop.js'

export default class GoldWithdrawLoop extends Loop {
  async loop (): Promise<void> {
    if (this.bot.character.gold < 200000) {
      // TODO add gold withdraw task
    }
  }
}
