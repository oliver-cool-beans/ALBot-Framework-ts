import { Entity } from 'alclient'
import Bot from '../Bot/index.js'
import Strategy from './Strategy.js'
import { findTank } from '../helpers/index.js'

export default class CBurstPull extends Strategy {
  pullLimit: number
  tank: Bot | undefined
  constructor (bot: Bot) {
    super(bot)
    this.pullLimit = 3
    this.tank = findTank(bot)
  }

  async loop (targetData: Entity) {
    const character = this.bot.character

    if (character.canUse('attack')) {
      await character.basicAttack(this.tank?.target || targetData?.id).catch((error) => {
        this.bot.logger.error(`${this.bot.name} failed to attack - ${error}`)
      })
    }

    if (!character.canUse('cburst')) return
    if (!this.tank) return
    if (this.bot.AL.Tools.distance(character, this.tank.character) >= 250) return

    const entitiesTargetingMe: Array<Entity> = [...character.entities.values()].filter((entity) => {
      return entity.target === character.id
    })

    if (entitiesTargetingMe.length >= this.pullLimit) return

    const entitiesNotPulled = [...character.entities.values()].map((entity) => {
      if (!entity.target && entity.id !== targetData.id && entity.type === targetData.type) {
        return [entity.id, 1]
      }
      return null
    }).filter(Boolean)

    if (!entitiesNotPulled?.length) return
    const numberToPull = this.pullLimit - entitiesTargetingMe.length
    const targetsToPull = entitiesNotPulled.slice(0, numberToPull)

    if (!targetsToPull.length) return
    await character.cburst(targetsToPull[0]).catch((error) => {
      this.bot.logger.error(`${this.bot.name} failed to cburst - ${error}`)
    })
  }
}
