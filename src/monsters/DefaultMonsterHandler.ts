import Bot from '../Bot/index.js'
import { Entity, IPosition } from 'alclient'
import { sortClosestDistance } from '../helpers/index.js'

export default class DefaultMonsterHandler {
  targetData: Entity | undefined
  bot: Bot
  rallyPosition: IPosition | undefined
  mtypes: Array<string>
  constructor (bot: Bot, mtypes?: Array<string>, rallyPosition?: IPosition) {
    this.bot = bot
    this.mtypes = mtypes || [bot.monster]
    if (this.rallyPosition) this.rallyPosition = rallyPosition
  }

  checkTarget (target: Entity): boolean {
    if (!Object.keys(this.bot.character.getEntities())) return false
    if (!target) return false
    if (!this.mtypes.includes(target.type)) return false
    if (this.bot.AL.Tools.distance(this.bot.character, target) < 100 && !this.bot.character.entities.get(target.id)) {
      return false
    }
    return true
  }

  findTarget (types?: Array<string>): Entity {
    let targets = this.bot.character.getEntities({
      canDamage: true,
      couldGiveCredit: true,
      typeList: types || this.mtypes,
      willBurnToDeath: false,
      willDieToProjectiles: false
    }).filter((target) => !this.bot.party.findMemberWithTarget(target.id))
      .filter((target) => ![...this.bot.character.players].find(([name, player]) => player.target === target.id))
    targets = targets.sort(sortClosestDistance(this.bot.character))
    return targets[0]
  }

  async loop (): Promise<void> {
    let target = this.bot.character.entities.get(this.bot.target)
    if (!target || !this.checkTarget(target)) {
      this.bot.setTarget(null)
      target = this.findTarget()
    }

    if (!target) {
      await this.bot.easyMove(this.rallyPosition || this.mtypes[0])
      return
    }

    if (target && !this.bot.target) {
      this.bot.setTarget(target.id)
    }
  }
}
