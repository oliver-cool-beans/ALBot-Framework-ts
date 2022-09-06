import { Entity } from 'alclient'
import Bot from '../Bot/index.js'
import Strategy from './Strategy.js'

export default class ThreeShot extends Strategy {
  targets: Array<string>
  constructor (bot: Bot) {
    super(bot)
    this.targets = []
  }

  async loop (targetData: Entity) {
    const character = this.bot.character

    if (character.canUse('3shot') && character.mp > 500) { // 300 mp cost
      this.targets = this.targets?.filter((entityId) => character.entities.get(entityId))
      const targetsNeeded: number = 2 - (this.targets?.length || 0) // 3 shot max targets is 3 - 1 because we have a main target
      const targets = this.bot.character.getEntities({
        canDamage: true,
        couldGiveCredit: true,
        typeList: targetData.type,
        willBurnToDeath: false,
        willDieToProjectiles: false
      }).filter((target) => target.id !== targetData.id && !this.bot.party.findMemberWithTarget(target.id))
        .filter((target) => ![...character.players].find(([name, player]) => player.target === target.id))
        .filter((target) => this.bot.AL.Tools.distance(character, target) <= character.range * 0.8)
        .slice(0, targetsNeeded)

      if (targets.length) targets.forEach((t) => this.targets.push(t.id))

      if (this.targets.length === 2) {
        return await character.threeShot(targetData.id, this.targets[0], this.targets[1]).catch((error) => {
          this.bot.logger.error(`${this.bot.name} failed to threeshot - ${error}`)
        })
      }
    }

    if (character.canUse('attack')) {
      await character.basicAttack(targetData.id).catch(() => {})
    }
  }
}
