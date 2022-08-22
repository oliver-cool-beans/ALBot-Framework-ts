import Bot from '../Bot/index.js'
// eslint-disable-next-line no-unused-vars
import { Entity, MonsterName } from 'alclient'
import { allPartyPresent, findTank, sortClosestDistance } from '../helpers/index.js'

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

  findTarget (type: string, attackingTargets?: boolean): Entity {
    let targets = this.bot.character.getEntities({
      canDamage: true,
      typeList: [type],
      willBurnToDeath: false,
      willDieToProjectiles: false
    })
    targets = targets.sort(sortClosestDistance(this.bot.character))
    if (attackingTargets) targets = targets.filter((entity) => entity.target)
    return targets[0]
  }

  async loop (targetData: Entity, taskId: string, task): Promise<void> {
    const now = new Date()
    const timeoutDiff = now.getTime() - this.startTime.getTime()
    const timeoutInMins = Math.round(timeoutDiff / 60000)
    if (timeoutInMins >= 35 || (this.bot.isOnServer(task.serverIdentifier, task.serverRegion) && !this.bot.character?.S?.crabxx?.live)) {
      console.log('Crabxx is no longer live, removing task')
      this.bot.party.members.forEach((member) => {
        return member.queue.removeTask(taskId)
      })
      return
    }

    let target = this.bot.character.entities.get(this.bot.target)
    if (target?.target && (target.type !== 'crabxx' || target.type !== 'crabx')) {
      this.bot.setTarget(null)
    }

    if (!target?.target && target?.type === 'crabxx') {
      this.bot.setTarget(null)
      target = null
    }

    if (!target || !this.checkTarget(target) || target?.type === 'crabxx') {
      if (target?.type !== 'crabxx') this.bot.setTarget(null)
      target = this.findTarget('crabx', true) || this.findTarget('crabxx', true)
    }

    if (this.bot.character.range <= 50 && !this.bot.target) {
      const crabxx = this.findTarget('crabxx', true)
      if (crabxx?.target) target = crabxx
    }

    if (!target) {
      return await this.bot.joinEvent('crabxx')
    }

    if (target && !this.bot.target) {
      if (target.type === 'crabxx' && (!target.target && !allPartyPresent(this.bot))) return
      if (this.tank && this.tank.name === this.bot.name) {
        const crabxx = this.findTarget('crabxx')
        crabxx && this.bot.setTarget(crabxx.id)
      } else {
        this.bot.setTarget(target.id)
      }
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
