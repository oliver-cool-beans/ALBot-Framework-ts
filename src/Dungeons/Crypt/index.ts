import Bot from '../../Bot/index.js'
import { findTank } from '../../helpers/index.js'

// Stages
import prepare from './prepare.js'

const allStages = {
  prepare
}

type stageType = 'prepare' | 'a1' | 'a2' | 'a3' | 'a4' | 'a5' | 'a6' | 'a7'

export default class Crypt {
  stage: stageType
  instanceKey: string | null
  bot: Bot
  tank: Bot | undefined
  constructor (bot: Bot) {
    this.stage = 'prepare'
    this.instanceKey = null
    this.bot = bot
    this.tank = findTank(this.bot)
  }

  async runStage (stage: stageType) {
    await allStages[stage](this)
  }

  async loop () {
    if (!this.tank) return
    await this.runStage(this.stage)
  }
}
