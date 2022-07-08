import Loop from './Loop.js'

export default class DefenceLoop extends Loop {
  async loop (): Promise<void> {
    if (Object.keys(this.bot.character.c).length) return
    const attackingMe = this.bot.attackingMe().find((entity) => entity.id !== this.bot.target)
    const target = attackingMe || (this.bot.target && this.bot.character.entities.get(this.bot.target))

    // Run strategy if present
    this.setStrategy(attackingMe || target, 'defence')
    if (this.strategy.name) {
      return await this.strategy.func.loop(attackingMe || target).catch((error) => {
        this.bot.logger.error(`${this.bot.name} failed to run defence strategy - ${error}`)
      })
    }

    if (this.bot.defenceStrategy) {
      return await this.bot.defenceStrategy(this.bot, target).catch((error) => {
        this.bot.logger.error(`${this.bot.name} failed to run bot defence strategy ${error}`)
      })
    }

    if ((attackingMe || this.bot.isLowHp()) && this.bot.character.canUse('scare')) {
      await this.bot.character.scare().catch(() => {
      })
    }
  }
}
