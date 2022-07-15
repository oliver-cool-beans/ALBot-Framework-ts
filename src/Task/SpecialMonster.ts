import { Entity } from 'alclient'
import Task from './index.js'

export default class SpecialMonster extends Task {
  findTarget (target: Entity): Entity {
    const targets = this.bot.character.getEntities({ canDamage: true, couldGiveCredit: true, typeList: [target.type], willBurnToDeath: false, willDieToProjectiles: false })
    return targets[0]
  }

  stopIfTrue (targetData): boolean {
    return !this.bot.queue.findTaskById(this.id) ||
    !!this.bot.character.entities.get(targetData.id)
  }

  async loop (): Promise<void> {
    const { targetData } = this.args
    const { noSolo = [] } = this.bot.config.monsters
    if (!targetData) return

    if (noSolo.includes(targetData.id) && !targetData.target) {
      this.bot.logger.info(`${this.bot.name} removing SpecialMonster for ${targetData.id} - NoSolo and no target`)
      this.bot.queue.removeTask(this.id)
      return
    }

    if (this.bot.target !== targetData.id) this.bot.setTarget(null)

    let target = this.bot.target ? this.bot.character.entities.get(this.bot.target) : this.findTarget(targetData)
    if (!target) {
      target = this.bot.party.findMemberWithTarget(targetData.id)
      target && await this.bot.easyMove(target, { stopIfTrue: () => this.stopIfTrue(targetData) })
    }

    if (target && !this.bot.target) {
      return this.bot.setTarget(target?.id)
    }

    if (target && this.bot.target === target.id) return

    if (!target) {
      const distance = this.bot.AL.Tools.distance(this.bot.character, targetData)
      // If i'm on the same map, and less than 500m then it's probably dead, remove target, remove task
      if (targetData.map === this.bot.character.map && distance <= 500) {
        this.bot.setTarget(null)
        console.log(this.bot.name, 'removing special monster because', targetData.map, this.bot.character.map, distance)
        this.bot.party.members.forEach((member) => {
          return member.queue.removeTask(this.id)
        })
      }
    }

    await this.bot.easyMove({ map: targetData.map, x: targetData.x, y: targetData.y }, { stopIfTrue: () => this.stopIfTrue(targetData) })
  }
}
