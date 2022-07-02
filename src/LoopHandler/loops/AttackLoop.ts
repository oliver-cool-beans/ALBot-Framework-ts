import Bot from '../../Bot/index.js'
import Loop from './Loop.js'

export default class AttackLoop extends Loop {
  constructor (bot: Bot) {
    super(bot)
    this.timeout = 0.05
  }

  async loop (): Promise<void> {
    if (!this.bot.target) return
    if (Object.keys(this.bot.character.c).length) return

    const attackingMe = this.bot.attackingMe()
    const targetData = attackingMe[0] || this.bot.character.entities.get(this.bot.target)

    if (!targetData || (!this.bot.isReadyToEngage() && !attackingMe.length && !targetData?.target)) {
      return
    }

    // Run strategy if present
    this.setStrategy(targetData, 'attack')
    if (this.strategy.name) {
      return await this.strategy.func.loop(targetData).catch((error) => {
        this.bot.logger.error(`${this.bot.name} failed to run attack strategy - ${error}`)
      })
    }

    if (this.bot.character.canUse('attack')) {
      await this.bot.character.basicAttack(targetData?.id).catch((error) => {
        this.bot.logger.error(`${this.bot.name} failed to attack - ${error}`)
      })
    }
  }
}
