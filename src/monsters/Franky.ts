import Bot from '../Bot/index.js'
import { Entity, IPosition, MonsterName } from 'alclient'
import { sortClosestDistance } from '../helpers/index.js'

export default class Franky {
  bot: Bot
  rallyPosition: IPosition
  constructor (bot: Bot) {
    this.bot = bot
    this.rallyPosition = { x: 1.2496361013690418, y: -12.770557914832374, map: 'level2w' }
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
    if (!this.bot.character?.S?.franky?.live) {
      console.log('Franky is no longer live, removing task')
      this.bot.party.members.forEach((member) => {
        return member.queue.removeTask(taskId)
      })
      return
    }

    let target = this.bot.character.entities.get(this.bot.target)
    if (target?.target && target.type !== 'franky') {
      this.bot.setTarget(null)
    }

    if (!target || !this.checkTarget(target)) {
      this.bot.setTarget(null)
      target = this.findTarget('nerfedmummy') || this.findTarget('franky')
    }

    if (!target) {
      await this.bot.easyMove({ x: -186.10837647933212, y: 21.54308871590579, map: 'level2w' }).catch(() => {})
      return
    }

    if (target && !this.bot.target) {
      this.bot.setTarget(target.id)
    }

    if (target.target && this.bot.AL.Tools.distance(this.bot.character, this.rallyPosition) >= 15) {
      await this.bot.easyMove(this.rallyPosition)
    }
  }
}