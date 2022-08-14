import { Entity } from 'alclient'
import Strategy from './Strategy.js'

export default class SafeAttack extends Strategy {
  async loop (target: Entity) {
    if (!this.bot.character.canUse('attack')) return
    const character = this.bot.character
    // If the target is already us, attack anyway
    if (target.target && target.target === character.id) {
      await character.basicAttack(target?.id)
      return
    }

    // If it has a target, and that target is not us, we're safe to attack
    if (target.target && target.target !== character.id) {
      await character.basicAttack(target?.id)
      return
    }

    // Otherwise, make sure we're out of range of the target

    if (this.bot.AL.Tools.distance(character, target) >= this.bot.character.range * 0.8) {
      await character.basicAttack(target?.id)
    }
  }
}
