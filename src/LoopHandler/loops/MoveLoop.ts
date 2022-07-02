import Loop from './Loop.js'

export default class MoveLoop extends Loop {
  async loop (): Promise<void> {
    if (!this.bot.target) return
    if (Object.keys(this.bot.character.c).length) return

    const targetData = this.bot.character.entities.get(this.bot.target) || this.bot.party.findMemberWithTarget(this.bot.target)
    if (!targetData) return

    // Run strategy if present
    this.setStrategy(targetData, 'move')
    if (this.strategy.name) {
      return await this.strategy.func.loop(targetData).catch((error) => {
        this.bot.logger.error(`${this.bot.name} failed to run move strategy - ${error}`)
      })
    }

    // If we're out of range, move to the target
    if (this.bot.AL.Tools.distance(this.bot.character, targetData) > this.bot.character.range && !this.bot.character.moving) {
      await this.bot.easyMove(targetData, { getWithin: this.bot.character.attackRange || this.bot.character.range / 2 }).catch(() => {})
    }
  }
}
