import { Entity } from 'alclient'
import Bot from '../Bot/index.js'
import Strategy from './Strategy.js'
import { findTank } from '../helpers/index.js'

export default class AttackTankTarget extends Strategy {
  tank: Bot | undefined
  constructor (bot: Bot) {
    super(bot)
    this.tank = findTank(bot)
  }

  async loop (targetData: Entity) {
    const character = this.bot.character
    if (!character.canUse('attack')) return

    if (!this.tank) {
      this.tank = findTank(this.bot)
      if (!this.tank) return Promise.reject(new Error('no Tank'))
    }

    if (!this.tank.target) return

    const target = character.entities.get(this.tank.target)
    if (!target) return

    if (target.target === this.tank.character.id) {
      await character.basicAttack(target.id)
    }
  }
}
