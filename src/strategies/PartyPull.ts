import { Entity } from 'alclient'
import Bot from '../Bot/index.js'
import Strategy from './Strategy.js'
import { findTank, allPartyPresent } from '../helpers/index.js'

export default class PartyPull extends Strategy {
  tank: Bot | undefined
  constructor (bot: Bot) {
    super(bot)
    this.tank = findTank(bot)
  }

  async loop (targetData: Entity) {
    const character = this.bot.character
    if (!character.canUse('attack')) return

    console.log(this.bot.name, 'all party present?', allPartyPresent(this.bot))
    if (targetData && !targetData.target && !allPartyPresent(this.bot)) return

    const target = character.entities.get(targetData.id)
    if (!target) return
    if (!target.target && this.tank?.character.id === this.bot.character.id) {
      return await character.basicAttack(target.id)
    }

    if (target.target) {
      await character.basicAttack(target.id)
    }
  }
}
