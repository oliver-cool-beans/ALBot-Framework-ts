import Bot from '../Bot/index.js'
// eslint-disable-next-line no-unused-vars
import { Entity, MonsterName } from 'alclient'
import { findTank, sortClosestDistance } from '../helpers/index.js'

export default class Crabxx {
  bot: Bot
  startTime: Date
  tank: Bot | undefined
  constructor (bot: Bot) {
    this.bot = bot
    this.startTime = new Date()
    this.tank = findTank(bot)
    bot.kitePositions.crabxx = { x: -948.7080262263672, y: 1618.109145505532 }
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
    const now = new Date()
    const timeoutDiff = now.getTime() - this.startTime.getTime()
    const timeoutInMins = Math.round(timeoutDiff / 60000)
    console.log('Timeout in mins', timeoutInMins)
    if (timeoutInMins >= 35 || (this.bot.isOnServer(task.serverIdentifier, task.serverRegion) && !this.bot.character?.S?.crabxx?.live)) {
      console.log('Crabxx is no longer live, removing task')
      this.bot.party.members.forEach((member) => {
        return member.queue.removeTask(taskId)
      })
      return
    }

    let target = this.bot.character.entities.get(this.bot.target)
    target && console.log(target.s)
    if (target?.target && (target.type !== 'crabxx' || target.type !== 'crabx')) {
      this.bot.setTarget(null)
    }

    if (!target || !this.checkTarget(target)) {
      this.bot.setTarget(null)
      target = this.findTarget('crabxx') || this.findTarget('crabxx')
    }

    if (this.bot.character.range <= 50 && !this.bot.target) {
      const crabxx = this.findTarget('crabxx')
      if (crabxx?.target) target = crabxx
    }

    if (!target) {
      await this.bot.easyMove('crabx').catch(() => {})
      return
    }

    if (target && !this.bot.target) {
      this.bot.setTarget(target.id)
    }

    if (target && target.type === 'crabxx' && this.bot.character.canUse('curse') && !target.s?.cursed) {
      await this.bot.character.curse(target.id).catch((error) => {
        console.log('error curse', error)
      })
    }

    if (this.bot.character.canUse('scare')) {
      await this.bot.character.scare().catch((error) => {
        console.log('failed to scare', error)
      })
    }
  }
}
