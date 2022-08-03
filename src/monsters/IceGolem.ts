import Bot from '../Bot/index.js'
import { Entity, MonsterName } from 'alclient'
import { sortClosestDistance } from '../helpers/index.js'

export default class IceGolem {
  bot: Bot
  constructor (bot: Bot) {
    this.bot = bot
  }

  checkTarget (target: Entity): boolean {
    if (!Object.keys(this.bot.character.getEntities())) return false
    if (!target) return false
    if (this.bot.AL.Tools.distance(this.bot.character, target) < 100 && !this.bot.character.entities.get(target.id)) {
      return false
    }
    return true
  }

  findTarget (type: MonsterName): Entity {
    let targets = this.bot.character.getEntities({
      canDamage: true,
      couldGiveCredit: true,
      typeList: [type],
      willBurnToDeath: false,
      willDieToProjectiles: false
    })
    targets = targets.sort(sortClosestDistance(this.bot.character))
    return targets[0]
  }

  async loop (targetData: Entity, taskId: string): Promise<void> {
    if (!this.bot.character?.S?.icegolem?.live) {
      console.log('Icegolem is no longer live, removing task')
      this.bot.party.members.forEach((member) => {
        return member.queue.removeTask(taskId)
      })
      return
    }

    let target = this.bot.character.entities.get(this.bot.target)
    if (target?.target && target.type !== 'icegolem') {
      this.bot.setTarget(null)
    }

    if (!target || !this.checkTarget(target)) {
      this.bot.setTarget(null)
      target = this.findTarget('icegolem')
    }

    if (!target) {
      await this.bot.easyMove('icegolem').catch(() => {})
      return
    }

    if (target && !this.bot.target) {
      this.bot.setTarget(target.id)
    }
  }
}
