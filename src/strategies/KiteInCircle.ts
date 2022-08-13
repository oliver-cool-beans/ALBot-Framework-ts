import { Entity } from 'alclient'
import Strategy from './Strategy.js'

export default class KiteInCircle extends Strategy {
  async loop (targetData: Entity) {
    try {
      const target = this.bot.character.getTargetEntity()
      if (!target) return Promise.resolve('No Target')

      const distance = this.bot.AL.Tools.distance(this.bot.character, target)

      // Stop smart moving when we can walk to the monster directly
      if (distance > this.bot.character.range) {
        this.bot.easyMove(target).catch(() => {})
        return
      }

      let center = this.bot.kitePositions && this.bot.kitePositions[target.type]

      // Find kitePosition by id, and delete other id's with same type
      if (!center) {
        Object.entries(this.bot.kitePositions).forEach(([key, value]) => {
          if (value?.type === target.type && value.id !== target.id) delete this.bot.kitePositions[key]
        })
        this.bot.kitePositions[target.id] = { type: target.type, x: target.x, y: target.y }
        center = this.bot.kitePositions[target.id]
      }
      const radius = target.range >= 100 ? 200 : 100
      const angle = Math.PI / 2.5

      if (!center) return Promise.resolve('No kite config')
      if (target) {
        const angleFromCenterToMonsterGoing = Math.atan2(target.going_y - center.y, target.going_x - center.x)
        const endGoalAngle = angleFromCenterToMonsterGoing + angle
        const endGoal = { x: center.x + radius * Math.cos(endGoalAngle), y: center.y + radius * Math.sin(endGoalAngle) }
        this.bot.character.move(endGoal.x, endGoal.y, { resolveOnStart: true }).catch(e => console.error(e))
      }
    } catch (error) {
      console.log(error)
    }
  }
}
