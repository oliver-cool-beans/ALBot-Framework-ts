import { Entity, IPosition } from 'alclient'
import Bot from '../Bot/index.js'
import { findTank } from '../helpers/index.js'
import DefaultMonsterHandler from './DefaultMonsterHandler.js'

export class BigBird extends DefaultMonsterHandler {
  targetData: Entity | undefined
  bot: Bot
  rallyPosition: IPosition
  mtypes: Array<string>
  constructor (bot: Bot, mtypes?: Array<string>) {
    super(bot, mtypes)
    this.bot = bot
    this.mtypes = mtypes || [bot.monster]
    this.rallyPosition = { map: 'main', x: 1325.6127181849818, y: 377.569337335335 }
  }

  async loop (): Promise<void> {
    const tank = findTank(this.bot)
    const tankTarget = tank?.target && tank?.character.entities.get(tank.target)
    if (!tank || (tank?.name !== this.bot.name)) {
      if (tank && tankTarget?.type === 'bigbird') {
        this.bot.setTarget(tankTarget.id)
        if (this.bot.AL.Tools.distance(this.bot.character, tank.character) >= 40) {
          await this.bot.easyMove({ x: tank?.character.x, y: tank?.character.y, map: tank?.character.map }, { getWithin: 10 })
        }
      } else {
        const spiderTarget = this.findTarget(['spider'])
        if (spiderTarget) this.bot.setTarget(spiderTarget.id)
        if (!spiderTarget) await this.bot.easyMove('spider')
      }
      return
    }

    let target = this.bot.character.entities.get(this.bot.target)
    if (!target || !this.checkTarget(target)) {
      this.bot.setTarget(null)
      target = this.findTarget()
    }

    if (!target || this.bot.AL.Tools.distance(this.bot.character, this.rallyPosition) >= 100) {
      await this.bot.easyMove(this.rallyPosition)
      return
    }

    if (target && !this.bot.target) {
      this.bot.setTarget(target.id)
    }
  }
}
