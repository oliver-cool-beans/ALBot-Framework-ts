import { Entity } from 'alclient'
import Strategy from './Strategy.js'

export default class KiteTarget extends Strategy {
  async loop (targetData: Entity) {
    const character = this.bot.character
    const target = character.entities.get(targetData.id)

    if (!target) return

    if (target?.target && target.target !== this.bot.character.id) {
      this.bot.easyMove(target, { getWithin: this.bot.character.range / 2 }).catch(() => {})
      return
    }

    const distance = this.bot.AL.Tools.distance(character, target)

    // Stop smart moving when we can walk to the monster directly
    if (character.smartMoving && (this.bot.AL.Pathfinder.canWalkPath(character, target) || distance < character.range)) {
      character.stopSmartMove().catch(() => {})
    }

    const kiteDistance = Math.min(character.range * 0.9)
    const distanceToMove = distance - kiteDistance
    const angleFromBotToMonster = Math.atan2(target.y - character.y, target.x - character.x)

    let potentialSpot = { map: character.map, x: character.x + distanceToMove * Math.cos(angleFromBotToMonster), y: character.y + distanceToMove * Math.sin(angleFromBotToMonster) }
    let angle = 0
    while (!this.bot.AL.Pathfinder.canStand(potentialSpot) && angle <= 2 * Math.PI) {
      if (angle > 0) {
        angle = -angle
      } else {
        angle -= Math.PI / 180 // Increase angle by 1 degree
        angle = -angle
      }
      potentialSpot = { map: character.map, x: character.x + distanceToMove * Math.cos(angleFromBotToMonster + angle), y: character.y + distanceToMove * Math.sin(angleFromBotToMonster + angle) }
    }

    if (this.bot.AL.Pathfinder.canWalkPath(character, potentialSpot)) {
      character.move(potentialSpot.x, potentialSpot.y).catch(() => {})
    } else if (this.bot.AL.Pathfinder.canStand(potentialSpot) && !character.smartMoving) {
      this.bot.easyMove(potentialSpot, { avoidTownWarps: true }).catch(() => {})
    }
  }
}
