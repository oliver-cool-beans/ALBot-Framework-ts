import { Entity } from 'alclient'
import Bot from '../../Bot/index.js'
import Loop from './Loop.js'

export default class AttackLoop extends Loop {
  constructor (bot: Bot) {
    super(bot)
    this.timeout = 0.05
  }

  canAttack (entity: Entity): Boolean {
    return this.bot.character.canUse('attack') &&
    this.bot.AL.Tools.distance(this.bot.character, entity) <= this.bot.character.range && this.bot.character.entities.get(entity.id)
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

    if (this.bot.attackStrategy) {
      return await this.bot.attackStrategy(this.bot, targetData).catch((error) => {
        this.bot.logger.error(`${this.bot.name} failed to run bot attack strategy ${error}`)
      })
    }

    if (this.canAttack(targetData)) {
      await this.bot.character.basicAttack(targetData?.id).catch(() => {})
    }
  }
}
