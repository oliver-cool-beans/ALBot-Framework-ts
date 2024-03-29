import Bot from '../Bot/index.js'
// eslint-disable-next-line no-unused-vars
import { Entity, MonsterName, IPosition } from 'alclient'
import { sortClosestDistance } from '../helpers/index.js'

export default class Snowman {
  bot: Bot
  rallyPosition: IPosition
  constructor (bot: Bot) {
    this.bot = bot
    this.rallyPosition = { x: 1143.0969205025276, y: -1043.9478443762375, map: 'winterland' }
    this.bot.kitePositions.snowman = { x: 1164.1348111178727, y: -1074.3045132208767 }
  }

  checkTarget (target: Entity): boolean {
    if (!Object.keys(this.bot.character.getEntities())) return false
    if (!target) return false
    if (this.bot.AL.Tools.distance(this.bot.character, target) < 100 && !this.bot.character.entities.get(target.id)) {
      return false
    }
    return true
  }

  findTarget (type: string): Entity {
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

  async loop (targetData: Entity, taskId: string, task): Promise<void> {
    if (this.bot.isOnServer(task.serverIdentifier, task.serverRegion) && !this.bot.character?.S?.snowman?.live) {
      console.log('Snowman is no longer live, removing task')
      this.bot.party.members.forEach((member) => {
        return member.queue.removeTask(taskId)
      })
      return
    }

    let target = this.bot.character.entities.get(this.bot.target)
    if (target?.target && target.type !== 'snowman') {
      this.bot.setTarget(null)
    }

    if (!target || !this.checkTarget(target)) {
      this.bot.setTarget(null)
      target = this.findTarget('snowman')
    }

    if (!target) {
      await this.bot.easyMove(this.rallyPosition)
    }

    if (target && !this.bot.target) {
      this.bot.setTarget(target.id)
    }

    if (target.target && this.bot.party.findMemberByName(target.target) && this.bot.AL.Tools.distance(this.bot.character, this.rallyPosition) >= 40) {
      await this.bot.easyMove(this.rallyPosition).catch(() => {})
    }
  }
}
